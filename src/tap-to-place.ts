import * as ecs from '@8thwall/ecs'
import catalog from './data/aves.json'
import labels from './data/interfaz.json'
import {PlacementSession, validPosition} from './placement-session'
import {createPilotUi} from './pilot-ui'
import {InspectionControls, normalizedScreenPosition} from './inspection-controls'
import {RadialGesture} from './radial-gesture'
import {screenToViewport, viewportToScreen} from './screen-coordinates'
import {ArrivalMotion} from './arrival-motion'
import {refreshAnimatedBounds} from './animated-bounds'
import {SeguimientoAve, ESTADOS, normalizarConfig} from './bird-follow'
import seguimientoConfig from './data/seguimiento.json'
import colocadoConfig from './data/colocacion.json'
import {normalizarConfig as normalizarColocacion, interseccionRayoPlanoY, validarPuntoSuelo, acercarPuntoSuave} from './colocacion-suelo'
import colibriCalibration from './data/colibri-aterrizaje.json'
import martinCalibration from './data/martin_pescador-aterrizaje.json'
import palomaCalibration from './data/paloma-aterrizaje.json'
import guacamayaCalibration from './data/loro-aterrizaje.json'
import {availableBird} from './bird-catalog'

// Se conserva el evento de la plantilla para no romper componentes ajenos.
const OBJECT_PLACED_EVENT = 'object-placed'
const controllers = new Map<ecs.Eid, {tick: () => void; dispose: () => void}>()
const calibrations = {colibri: colibriCalibration, martin_pescador: martinCalibration, paloma: palomaCalibration, loro: guacamayaCalibration}

// Elevación suave del modelo según la categoría de altura del clip activo, en metros de mundo.
// La subida y el retorno al suelo duran ELEVACION_SUBIDA_SEGUNDOS; el descenso de "aterrizaje"
// dura lo que dura el clip. El valor de vuelo por defecto se puede ajustar por ave con
// "elevacionVuelo" en aves.json.
const ELEVACION_SUBIDA_SEGUNDOS = 0.5
const ELEVACION_VUELO_POR_DEFECTO = 0.08
const suavizarEntradaSalida = (t: number) => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
const suavizarSalida = (t: number) => 1 - (1 - t) ** 3

// Configuración de colocación sobre el suelo (src/data/colocacion.json). Se normaliza una vez:
// mezcla los valores por defecto con el archivo y desactiva todo con "habilitado": false.
const COLOCACION = normalizarColocacion(colocadoConfig)
// Reticula 3D: colores (r,g,b 0-255, como los materiales unlit del motor) y posición de reposo
// fuera de escena cuando está oculta, para que el raycast del toque sobre el ave no la alcance.
const RETICULA_VALIDA = {r: 34, g: 197, b: 94}
const RETICULA_INVALIDA = {r: 237, g: 28, b: 36}
const RETICULA_OCULTA = {x: 0, y: -1000, z: 0}

// Crea el seguimiento puro de un ave: mezcla la configuración global con la anulación por ave
// y aporta los datos que la máquina de estados necesita (presencia real de clips, giro y ángulo
// de frente). No se escribe ningún nombre de clip en la lógica: solo se usan los del JSON.
function crearSeguimiento(ave: any) {
  const clips: any[] = ave.clips ?? []
  const despegue = ave.animaciones?.despegue
  const aterrizaje = ave.animaciones?.aterrizaje
  const tiene = (nombre: any) => !!nombre && clips.some(c => c.nombre === nombre)
  return new SeguimientoAve(
    normalizarConfig(seguimientoConfig, ave.seguimiento),
    {
      anguloFrente: ave.llegada?.anguloFrente,
      giroY: ave.transformacion?.giroY,
      tieneDespegue: tiene(despegue),
      tieneAterrizaje: tiene(aterrizaje),
      duracionDespegue: clips.find(c => c.nombre === despegue)?.duracionSegundos ?? 0,
    },
  )
}

// Lee la pose de la cámara activa desde los componentes ECS de la entidad de cámara, que el
// motor actualiza cada fotograma con la pose real del dispositivo. La cámara de render es hija
// de la entidad con un giro local de 180° en Y (createCameraObject) y el motor aplica además un
// Z_FLIP; por eso el eje +Z de la entidad de cámara es la dirección de vista real (su -Z apunta
// hacia atrás). Se lee de la transformación ECS, no de three.js, para no depender del modo de
// actualización de matrices (por defecto 'manual').
function poseCamara(world: ecs.World) {
  try {
    const eid = world.camera.getActiveEid()
    if (!eid) return null
    const posicion = world.transform.getWorldPosition(eid)
    if (!posicion || !['x', 'y', 'z'].every(k => Number.isFinite((posicion as any)[k]))) return null
    const giro = world.transform.getWorldQuaternion(eid)
    if (!giro || !['x', 'y', 'z', 'w'].every(k => Number.isFinite((giro as any)[k]))) return null
    const {x, y, z, w} = giro as any
    // Rotación de (0,0,1) por el cuaternión (producto de Hamilton).
    const adelante = {x: 2 * (x * z + w * y), y: 2 * (z * y - w * x), z: 1 - 2 * (x * x + y * y)}
    return {posicion: {x: posicion.x, y: posicion.y, z: posicion.z}, adelante}
  } catch (error) {
    return null
  }
}

function attach(world: ecs.World, ground: ecs.Eid) {
  const desktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !('ontouchend' in document && navigator.maxTouchPoints > 1)
  let bird = availableBird(catalog.aves, 'colibri')!
  let landingCalibration = calibrations[bird.id]
  let root: ecs.Eid | null = null
  let model: ecs.Eid | null = null
  let loadedListener: any = null
  let finishedListener: any = null
  let loadTimer: ReturnType<typeof setTimeout> | null = null
  let startupTimer: ReturnType<typeof setTimeout> | null = null
  let fetchController: AbortController | null = null
  let fetchGeneration = 0
  let paused = false
  let activeClip = bird.animaciones.reposo
  let ui: ReturnType<typeof createPilotUi>
  let arrival = new ArrivalMotion(bird.llegada, landingCalibration)
  let landingRate = landingCalibration.contactoSegundos / bird.llegada.duracionSegundos
  let landingFrameApplied = false
  // Descenso simple de la llegada inicial si el ave no tiene clip de aterrizaje (defensivo;
  // hoy las cuatro aves lo tienen). Reutiliza el origen aéreo aleatorio de ArrivalMotion.
  let arrivalSimple = false
  let arrivalTranscurrido = 0
  let arrivalInicio: {x: number; y: number; z: number} = {x: 0, y: 0, z: 0}
  let arrivalDestino: {x: number; y: number; z: number} = {x: 0, y: 0, z: 0}
  // Seguimiento del ave por distancia. `seguimiento` es puro y testeable; `arrivalFollow` es la
  // trayectoria de aterrizaje basada en el clip, separada de la llegada inicial. `generacion`
  // propia permite reutilizar ArrivalMotion sin depender de la generación de la sesión.
  let seguimiento = crearSeguimiento(bird)
  let arrivalFollow = new ArrivalMotion(bird.llegada, landingCalibration)
  let seguimientoGeneracion = 0
  let seguimientoAterrizajeListo = false
  let seguimientoCongelado = false
  let seguimientoFrameContacto = false
  // Elevación del modelo: objetivo por categoría del clip, transición suave e independiente del FPS.
  let clipTimeScale = 1
  let elevacionActual = 0
  let elevacionDesde = 0
  let elevacionObjetivo = 0
  let elevacionDuracion = 0
  let elevacionTranscurrido = 0
  let elevacionCurva: (t: number) => number = suavizarEntradaSalida
  let elevacionAplicada: number | null = null
  let phaseAnterior = 'INTRO'
  // Retícula 3D sobre el suelo: entidad creada por código (sin assets) que marca el punto de
  // apoyo calculado analíticamente. El suavizado usa el delta del tick, no los FPS.
  let reticulaEid: ecs.Eid | null = null
  let reticulaPunto: {x: number; y: number; z: number} | null = null
  let reticulaValida = false
  let reticulaColor: 'valida' | 'invalida' | null = null
  let inspection = new InspectionControls({
    escalaBase: bird.escalaExhibicion,
    escalaMinima: bird.inspeccion?.escalaMinima,
    escalaMaxima: bird.inspeccion?.escalaMaxima,
    sensibilidadGiro: bird.inspeccion?.sensibilidadGiro,
    umbralArrastre: bird.inspeccion?.umbralArrastre,
  })
  let inspectionTouch: {pointerId: any; target: ecs.Eid | undefined; start: {x: number; y: number}; dragged: boolean} | null = null
  let pinchActive = false
  let hudUnlockTimer: ReturnType<typeof setTimeout> | null = null
  const radial = new RadialGesture({
    open(layout) {
      if (!canInspect() || !session.trackingReady) { radial.cancel(); return }
      ui.showRadial(layout)
    },
    highlight(action) { ui.highlightRadial(action) },
    close() { ui?.closeRadial() },
    action(action) {
      inspectionTouch = null
      ui.runRadialAction(action)
    },
  })
  const clearLoadTimer = () => { if (loadTimer) clearTimeout(loadTimer); loadTimer = null }
  const applyInspection = () => {
    if (root !== null) {
      const rotation = ecs.math.quat.yRadians(inspection.yaw)
      ecs.Quaternion.set(world, root, {x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w})
    }
    if (model !== null) world.setScale(model, inspection.scale, inspection.scale, inspection.scale)
  }
  const destroy = () => {
    arrival.cancel()
    arrivalFollow.cancel()
    seguimiento.cancelar()
    seguimientoAterrizajeListo = false
    seguimientoCongelado = false
    seguimientoFrameContacto = false
    landingFrameApplied = false
    arrivalSimple = false
    arrivalTranscurrido = 0
    clearLoadTimer()
    if (model !== null) {
      if (loadedListener) world.events.removeListener(model, ecs.events.GLTF_MODEL_LOADED, loadedListener)
      if (finishedListener) world.events.removeListener(model, ecs.events.GLTF_ANIMATION_FINISHED, finishedListener)
      world.deleteEntity(model)
    }
    if (root !== null) world.deleteEntity(root)
    model = root = null
    loadedListener = finishedListener = null
    paused = false
    inspectionTouch = null
    pinchActive = false
    clipTimeScale = 1
    elevacionActual = elevacionDesde = elevacionObjetivo = 0
    elevacionDuracion = elevacionTranscurrido = 0
    elevacionCurva = suavizarEntradaSalida
    elevacionAplicada = null
    inspection.reset()
    radial.reset(true)
    ui?.setGestureBlocked(radial.blocked)
  }
  // Escribe la elevación actual en el nodo del modelo, sumándola al nivel de suelo
  // declarado en transformacion.posicionLocal (que nunca se reemplaza). Como el nodo
  // del modelo es hijo de la raíz sin escala, la posición local está en metros de mundo:
  // la elevación no depende de escalaExhibicion ni del escalado por inspección.
  const escribirElevacion = () => {
    if (model === null) return false
    if (elevacionAplicada !== null && Math.abs(elevacionAplicada - elevacionActual) < 1e-9) return false
    const base = bird.transformacion.posicionLocal
    world.getEntity(model).setLocalPosition({x: base.x, y: base.y + elevacionActual, z: base.z})
    elevacionAplicada = elevacionActual
    return true
  }
  // Comienza una transición hacia la altura objetivo. Si ya hay una en curso, parte de la
  // altura actual (elevacionActual) para continuar sin saltos; si ya está en el objetivo, la fija.
  const iniciarElevacion = (objetivo: number, duracion: number, curva: (t: number) => number) => {
    if (Math.abs(objetivo - elevacionActual) < 1e-6) {
      elevacionDesde = elevacionObjetivo = elevacionActual
      elevacionDuracion = elevacionTranscurrido = 0
      return
    }
    elevacionDesde = elevacionActual
    elevacionObjetivo = objetivo
    elevacionDuracion = Math.max(0, duracion)
    elevacionTranscurrido = 0
    elevacionCurva = curva
  }
  const aplicarAlturaDeClip = (clip: any) => {
    if (clip?.altura === 'aire') {
      iniciarElevacion(bird.elevacionVuelo ?? ELEVACION_VUELO_POR_DEFECTO, ELEVACION_SUBIDA_SEGUNDOS, suavizarEntradaSalida)
    } else if (clip?.altura === 'aterrizaje') {
      const escalaTiempo = clipTimeScale > 0 ? clipTimeScale : 1
      iniciarElevacion(0, (clip.duracionSegundos ?? 0) / escalaTiempo, suavizarSalida)
    } else {
      iniciarElevacion(0, ELEVACION_SUBIDA_SEGUNDOS, suavizarEntradaSalida)
    }
  }
  // Avanza la transición con el delta de ECS (no setTimeout) y devuelve si escribió el nodo.
  // No actúa durante la llegada inicial ni durante el aterrizaje basado en clip del seguimiento:
  // en ambos casos ArrivalMotion controla la posición del nodo del modelo.
  const seguimientoControlaModelo = () =>
    seguimiento.estado === ESTADOS.ATERRIZAJE && seguimiento.modoAterrizaje === 'clip'
  const tickElevacion = () => {
    if (model === null || session.phase !== 'EXPLORAR' || seguimientoControlaModelo()) return false
    if (elevacionTranscurrido < elevacionDuracion) {
      elevacionTranscurrido = Math.min(elevacionDuracion, elevacionTranscurrido + world.time.delta / 1000)
      const t = elevacionDuracion > 0 ? elevacionTranscurrido / elevacionDuracion : 1
      elevacionActual = elevacionDesde + (elevacionObjetivo - elevacionDesde) * elevacionCurva(t)
    } else {
      elevacionActual = elevacionObjetivo
    }
    return escribirElevacion()
  }
  const setClip = (name: string) => {
    if (model === null || session.phase !== 'EXPLORAR') return
    const clip = bird.clips.find(c => c.nombre === name)
    if (!clip) { ui.showMessage(labels.errorAnimacion); return }
    // Una elección manual de animación cancela el seguimiento y devuelve el ave al suelo.
    abortarSeguimiento()
    activeClip = name; paused = false
    clipTimeScale = 1
    ecs.GltfModel.set(world, model, {animationClip: name, loop: clip.bucle, paused: false, time: 0, timeScale: 1, crossFadeDuration: 0.12})
    aplicarAlturaDeClip(clip)
  }
  const applyArrivalPose = (pose: ReturnType<ArrivalMotion['sample']>) => {
    if (root === null || model === null) return
    world.getEntity(root).setLocalPosition(pose.position)
    world.getEntity(model).setLocalPosition(pose.localPosition)
    inspection.yaw = pose.yaw
    applyInspection()
  }
  const tickArrival = () => {
    if (root === null || model === null || session.phase !== 'ATERRIZANDO' || !session.trackingReady) return
    // Sin clip de aterrizaje: descenso suave desde el origen aéreo, conservando el clip de vuelo.
    if (arrivalSimple) {
      arrivalTranscurrido += world.time.delta / 1000
      const segundos = Math.max(1e-6, seguimiento.config.bajadaSinAterrizajeSegundos)
      const t = Math.min(1, arrivalTranscurrido / segundos)
      const factor = suavizarEntradaSalida(t)
      world.getEntity(root).setLocalPosition({
        x: arrivalInicio.x + (arrivalDestino.x - arrivalInicio.x) * factor,
        y: arrivalInicio.y + (arrivalDestino.y - arrivalInicio.y) * factor,
        z: arrivalInicio.z + (arrivalDestino.z - arrivalInicio.z) * factor,
      })
      if (t >= 1) {
        arrivalSimple = false
        activeClip = bird.animaciones.reposo
        clipTimeScale = 1
        ecs.GltfModel.set(world, model, {animationClip: activeClip, loop: true, paused: false,
          time: 0, timeScale: 1, crossFadeDuration: bird.llegada.mezclaReposoSegundos})
        const generation = session.generation
        if (session.arrived(generation)) world.events.dispatch(ground, OBJECT_PLACED_EVENT)
      }
      return
    }
    try {
      const pose = arrival.advance(world.time.delta / 1000, session.generation)
      if (!pose) return
      applyArrivalPose(pose)
      // El motor reproduce el clip con velocidad positiva, usando el mismo delta
      // ECS que la trayectoria. timeScale=0 también congela las poses al hacer seek.
      if (pose.landed && arrival.phase === 'approach') {
        // Mantener un fotograma de contacto antes de mezclar con reposo.
        if (!landingFrameApplied) { landingFrameApplied = true; return }
        arrival.beginBlend()
        activeClip = bird.animaciones.reposo
        clipTimeScale = 1
        ecs.GltfModel.set(world, model, {animationClip: activeClip, loop: true, paused: false,
          time: 0, timeScale: 1, crossFadeDuration: bird.llegada.mezclaReposoSegundos})
      } else if (pose.finished) {
        const generation = session.generation
        arrival.cancel()
        if (session.arrived(generation)) world.events.dispatch(ground, OBJECT_PLACED_EVENT)
      }
    } catch (error) {
      console.error('Llegada del ave:', error)
      session.fail(labels.errorLlegada)
    }
  }
  // El seguimiento no inicia ciclos y, si el ave vuela, aterriza donde está, cuando hay una
  // inspección activa, un panel/ficha/rueda o quiz abiertos, o la escena sale de EXPLORAR.
  const seguimientoPausado = () =>
    session.phase !== 'EXPLORAR' ||
    pinchActive ||
    inspectionTouch?.dragged === true ||
    ui.bloqueandoSeguimiento()
  // El propio seguimiento controla el clip activo mientras dura un ciclo (deja de ser reposo).
  const seguimientoGestionaClip = () => seguimiento.habilitado && seguimiento.estado !== ESTADOS.REPOSO
  // Reproduce un clip del ave sin la validación de fase de setClip (el seguimiento ya corre en
  // EXPLORAR) y sin abortarse a sí mismo. `escala` permite al aterrizaje usar landingRate, igual
  // que la llegada inicial, para que el clip renderizado avance al ritmo de la trayectoria.
  const reproducirClip = (nombre?: string, escala = 1) => {
    if (model === null || !nombre) return
    const clip = bird.clips.find(c => c.nombre === nombre)
    if (!clip) return
    activeClip = nombre; paused = false; clipTimeScale = escala
    ecs.GltfModel.set(world, model, {animationClip: nombre, loop: clip.bucle, paused: false, time: 0, timeScale: escala, crossFadeDuration: 0.12})
    aplicarAlturaDeClip(clip)
  }
  const aplicarClipDeSeguimiento = (estado: string) => {
    if (estado === ESTADOS.DESPEGUE) reproducirClip(bird.animaciones.despegue ?? bird.animaciones.vuelo)
    else if (estado === ESTADOS.VUELO) reproducirClip(bird.animaciones.vuelo)
    else if (estado === ESTADOS.ATERRIZAJE) {
      // Con clip de aterrizaje lo controla ArrivalMotion (a su ritmo); sin él se conserva el vuelo.
      reproducirClip(seguimiento.modoAterrizaje === 'clip' ? bird.animaciones.aterrizaje : bird.animaciones.vuelo,
        seguimiento.modoAterrizaje === 'clip' ? landingRate : 1)
    } else reproducirClip(bird.animaciones.reposo)
  }
  // Aborta el seguimiento y deja la raíz en el suelo; el clip lo elige quien llama después.
  const abortarSeguimiento = () => {
    const activo = seguimiento.estado !== ESTADOS.REPOSO
    arrivalFollow.cancel()
    seguimientoAterrizajeListo = false
    seguimientoCongelado = false
    seguimientoFrameContacto = false
    seguimiento.cancelar()
    if (!activo || root === null) return
    seguimiento.posicion.y = seguimiento.sueloY
    world.getEntity(root).setLocalPosition(seguimiento.posicion)
    elevacionActual = elevacionDesde = elevacionObjetivo = 0
    elevacionDuracion = elevacionTranscurrido = 0
    elevacionCurva = suavizarEntradaSalida
    elevacionAplicada = null
  }
  // Aterrizaje basado en el clip y la calibración por ave, reutilizando ArrivalMotion. El origen
  // se ajusta con la elevación actual del nodo del modelo para que la pose visible sea continua:
  // la raíz sube lo mismo que baja el nodo al aplicar la compensación de hueso del clip.
  const tickAterrizajeSeguimiento = () => {
    if (root === null || model === null) return false
    const info = seguimiento.aterrizaje
    if (!info) return false
    if (!session.trackingReady) {
      if (!seguimientoCongelado) { seguimientoCongelado = true; ecs.GltfModel.set(world, model, {paused: true}) }
      return false
    }
    if (seguimientoCongelado) { seguimientoCongelado = false; ecs.GltfModel.set(world, model, {paused}) }
    try {
      if (!seguimientoAterrizajeListo) {
        seguimientoAterrizajeListo = true
        seguimientoFrameContacto = false
        const origen = {x: info.origen.x, y: info.origen.y + elevacionActual, z: info.origen.z}
        const pose = arrivalFollow.begin(info.destino, ++seguimientoGeneracion, inspection.scale,
          bird.transformacion.giroY, bird.transformacion.posicionLocal, origen)
        applyArrivalPose(pose)
      }
      const pose = arrivalFollow.advance(world.time.delta / 1000, seguimientoGeneracion)
      if (!pose) return false
      applyArrivalPose(pose)
      if (pose.landed && arrivalFollow.phase === 'approach') {
        // Un fotograma de contacto con el suelo antes de mezclar con reposo (igual que la llegada).
        if (!seguimientoFrameContacto) { seguimientoFrameContacto = true; return true }
        arrivalFollow.beginBlend()
        activeClip = bird.animaciones.reposo
        clipTimeScale = 1
        ecs.GltfModel.set(world, model, {animationClip: activeClip, loop: true, paused: false,
          time: 0, timeScale: 1, crossFadeDuration: bird.llegada.mezclaReposoSegundos})
      } else if (pose.finished) {
        seguimientoAterrizajeListo = false
        seguimientoFrameContacto = false
        arrivalFollow.cancel()
        seguimiento.confirmarAterrizaje(info.destino, pose.yaw)
        elevacionActual = elevacionDesde = elevacionObjetivo = 0
        elevacionDuracion = elevacionTranscurrido = 0
        elevacionCurva = suavizarEntradaSalida
        elevacionAplicada = null
      }
      return true
    } catch (error) {
      console.error('Aterrizaje del seguimiento:', error)
      seguimientoAterrizajeListo = false
      arrivalFollow.cancel()
      seguimiento.cancelar()
      elevacionAplicada = null
      return false
    }
  }
  // Avanza el seguimiento y aplica la pose de la raíz que le corresponde. Devuelve si escribió
  // posición o rotación, para refrescar la matriz del modelo que usa el raycast del toque.
  const tickSeguimiento = () => {
    if (root === null || model === null || session.phase !== 'EXPLORAR' || !seguimiento.habilitado) return false
    if (seguimiento.estado === ESTADOS.ATERRIZAJE && seguimiento.modoAterrizaje === 'clip') return tickAterrizajeSeguimiento()
    // Sin cámara o sin seguimiento estable, se congela el ave sin avanzar el estado.
    const pose = poseCamara(world)
    if (!session.trackingReady || !pose) {
      if (!seguimientoCongelado) { seguimientoCongelado = true; ecs.GltfModel.set(world, model, {paused: true}) }
      return false
    }
    if (seguimientoCongelado) { seguimientoCongelado = false; ecs.GltfModel.set(world, model, {paused}) }
    // Al empezar un ciclo, el ave parte del giro visible actual (pudo inspeccionarla el usuario).
    if (seguimiento.estado === ESTADOS.REPOSO) seguimiento.yaw = inspection.yaw
    const anterior = seguimiento.estado
    const resultado = seguimiento.actualizar(world.time.delta / 1000, {
      camara: pose.posicion, adelante: pose.adelante, pausado: seguimientoPausado(),
    })
    if (resultado.estado !== anterior) aplicarClipDeSeguimiento(resultado.estado)
    let escrito = false
    if (resultado.posicion) { world.getEntity(root).setLocalPosition(resultado.posicion); escrito = true }
    if (Number.isFinite(resultado.yaw)) { inspection.yaw = resultado.yaw as number; applyInspection(); escrito = true }
    return escrito
  }
  const session = new PlacementSession({
    destroy,
    move(position: {x: number; y: number; z: number}) {
      if (root !== null) world.getEntity(root).setLocalPosition(position)
    },
    spawn(position: {x: number; y: number; z: number}, generation: number, options: {arrival: boolean}) {
      inspection.reset()
      landingFrameApplied = false
      arrivalSimple = false
      arrivalTranscurrido = 0
      // Clip de entrada: aterrizaje si lo hay, vuelo como respaldo, o reposo en colocación directa.
      const tieneAterrizaje = !!bird.animaciones.aterrizaje && bird.clips.some(c => c.nombre === bird.animaciones.aterrizaje)
      const clipEntrada = !options.arrival ? bird.animaciones.reposo
        : (tieneAterrizaje ? bird.animaciones.aterrizaje : bird.animaciones.vuelo)
      clipTimeScale = options.arrival && tieneAterrizaje ? landingRate : 1
      elevacionActual = elevacionDesde = elevacionObjetivo = 0
      elevacionDuracion = elevacionTranscurrido = 0
      elevacionCurva = suavizarEntradaSalida
      elevacionAplicada = 0
      root = world.createEntity()
      world.getEntity(root).setLocalPosition(position)
      model = world.createEntity()
      world.getEntity(model).setParent(root)
      world.getEntity(model).setLocalPosition(bird.transformacion.posicionLocal)
      world.getEntity(model).set(ecs.Quaternion, ecs.math.quat.yRadians(bird.transformacion.giroY))
      applyInspection()
      if (options.arrival) {
        const initialPose = arrival.begin(position, generation, inspection.scale, bird.transformacion.giroY, bird.transformacion.posicionLocal)
        if (tieneAterrizaje) {
          applyArrivalPose(initialPose)
        } else {
          // Sin clip de aterrizaje: se guarda el origen aéreo y se desciende suave en tickArrival.
          arrivalSimple = true
          arrivalInicio = {...initialPose.position}
          arrivalDestino = {x: position.x, y: position.y, z: position.z}
          inspection.yaw = initialPose.yaw
          applyInspection()
          arrival.cancel()
        }
      }
      const currentModel = model
      loadedListener = (event: any) => {
        if (model !== currentModel || !session.loaded(generation)) return
        clearLoadTimer()
        activeClip = clipEntrada
        clipTimeScale = options.arrival && tieneAterrizaje ? landingRate : 1
        ecs.GltfModel.set(world, currentModel, {time: 0, timeScale: options.arrival && tieneAterrizaje ? landingRate : 1, paused: options.arrival && !session.trackingReady})
      }
      finishedListener = (event: any) => {
        if (model !== currentModel || session.phase !== 'EXPLORAR' || event.data.name !== activeClip) return
        // Mientras el seguimiento controla el clip, su final no debe elegir otra animación.
        if (seguimientoGestionaClip()) return
        const clip = bird.clips.find(c => c.nombre === activeClip)
        if (clip && !clip.bucle) setClip(bird.animaciones.reposo)
      }
      world.events.addListener(model, ecs.events.GLTF_MODEL_LOADED, loadedListener)
      world.events.addListener(model, ecs.events.GLTF_ANIMATION_FINISHED, finishedListener)
      loadTimer = setTimeout(() => {
        if (session.generation === generation && session.phase === 'COLOCANDO') session.fail(labels.errorRecurso)
      }, 30000)
      activeClip = clipEntrada
      const clipEntradaBucle = bird.clips.find(c => c.nombre === clipEntrada)?.bucle ?? !options.arrival
      ecs.GltfModel.set(world, model, {url: bird.modelo, animationClip: activeClip, loop: clipEntradaBucle, paused: true, time: 0, timeScale: options.arrival && tieneAterrizaje ? landingRate : 1})
    },
  }, snapshot => {
    if (model !== null && snapshot.phase === 'ATERRIZANDO') {
      ecs.GltfModel.set(world, model, {paused: !snapshot.trackingReady})
    }
    // Al entrar en EXPLORAR (tras la llegada o al reubicar) la altura parte del clip activo.
    if (snapshot.phase === 'EXPLORAR' && phaseAnterior !== 'EXPLORAR') {
      aplicarAlturaDeClip(bird.clips.find(c => c.nombre === activeClip))
      arrivalFollow.cancel()
      seguimientoAterrizajeListo = false
      seguimientoCongelado = false
      // La llegada pudo dejar el nodo del modelo en la compensación de hueso: se invalida el
      // último valor aplicado para que tickElevacion vuelva a escribir la base del modelo.
      elevacionAplicada = null
      // El ave queda en reposo sobre su punto de apoyo; conserva el giro con el que llegó.
      if (snapshot.position) seguimiento.reiniciar(
        {x: snapshot.position.x, y: snapshot.position.y, z: snapshot.position.z},
        snapshot.position.y, inspection.yaw)
    }
    phaseAnterior = snapshot.phase
    if (snapshot.phase !== 'EXPLORAR' || !snapshot.trackingReady) {
      radial.cancel()
      inspectionTouch = null
    }
    ui?.update(snapshot)
  })

  const prepareAsset = async () => {
    const generation = ++fetchGeneration
    const requestedBird = bird
    fetchController?.abort()
    fetchController = new AbortController()
    const controller = fetchController
    const timeout = setTimeout(() => controller.abort(), 30000)
    session.setAsset(false)
    try {
      const response = await fetch(requestedBird.modelo, {signal: controller.signal, cache: 'force-cache'})
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (bytes.length < 20 || String.fromCharCode(...bytes.slice(0, 4)) !== 'glTF') throw new Error('No es un GLB válido; comprobar Git LFS')
      if (generation === fetchGeneration && bird === requestedBird) session.setAsset(true)
    } catch (error) {
      if (generation === fetchGeneration) session.fail(labels.errorRecurso)
      console.error('Carga del GLB:', error)
    } finally { clearTimeout(timeout) }
  }
  const selectSpecies = (id: string) => {
    const next = availableBird(catalog.aves, id)
    if (!next || next.id === bird.id) return
    ++fetchGeneration
    fetchController?.abort()
    session.changeSpecies()
    bird = next
    landingCalibration = calibrations[bird.id]
    arrival = new ArrivalMotion(bird.llegada, landingCalibration)
    arrivalFollow = new ArrivalMotion(bird.llegada, landingCalibration)
    seguimiento = crearSeguimiento(bird)
    seguimientoAterrizajeListo = false
    seguimientoCongelado = false
    landingRate = landingCalibration.contactoSegundos / bird.llegada.duracionSegundos
    inspection = new InspectionControls({escalaBase: bird.escalaExhibicion, ...bird.inspeccion})
    activeClip = bird.animaciones.reposo
    ui.setBird(bird)
    session.emit()
    if (session.started) void prepareAsset()
  }
  ui = createPilotUi(catalog.aves, bird, {
    species: selectSpecies,
    start() {
      session.reset(); session.start()
      if (!session.assetReady) void prepareAsset()
    },
    reset() { session.reset() },
    relocate() { session.relocate() },
    cancel() { session.cancelRelocation() },
    dismiss() { radial.cancel(); inspectionTouch = null },
    radial(action: string) { if (canInspect()) radial.select(action) },
    clip: setClip,
    idle() { setClip(bird.animaciones.reposo) },
    pause() {
      if (model === null || session.phase !== 'EXPLORAR') return
      paused = !paused; ecs.GltfModel.set(world, model, {paused: paused || seguimientoCongelado})
    },
  }, desktop, COLOCACION.habilitado && COLOCACION.reticulaSuelo && !desktop)
  session.emit()
  if (desktop) session.setTracking(true)
  const ready = () => {
    if (startupTimer) clearTimeout(startupTimer)
    startupTimer = null
    // REALITY_READY confirma inicio, no garantiza por sí solo seguimiento estable.
    if (!desktop) ui.showMessage(labels.seguimiento)
  }
  const tracking = (event: any) => session.setTracking(event.data?.status === 'NORMAL',
    {status: event.data?.status, reason: event.data?.reason})
  const inputRect = () => world.three.renderer.domElement.getBoundingClientRect()
  const isUiTouch = (position: {x: number; y: number} | undefined) => {
    const point = screenToViewport(position, inputRect())
    if (!point) return false
    return !!document.elementFromPoint(point.x, point.y)?.closest('#aves-pilot button, #aves-pilot select, #aves-pilot .aves-panel, #aves-pilot [data-aves-ui]')
  }
  // El modo 3D de escritorio no produce worldPosition de una superficie AR.
  // Se usa únicamente allí un plano virtual centrado en la escena para poder
  // revisar carga, escala, interfaz y animaciones sin alegar detección física.
  const desktopPosition = (position: {x: number; y: number} | undefined) => {
    if (!desktop || !position) return null
    const x = position.x <= 1 ? position.x : position.x / window.innerWidth
    const y = position.y <= 1 ? position.y : position.y / window.innerHeight
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return {x: (x - 0.5) * 3.2, y: 0, z: (0.5 - y) * 2.2}
  }
  // Retícula 3D sobre el suelo: una única entidad-anillo creada por código (sin assets) con
  // geometría y material del motor. Mientras no hay fase de colocación o falta el seguimiento se
  // oculta y se aleja a RETICULA_OCULTA para que el raycast del toque sobre el ave no la alcance.
  const crearReticula = () => {
    if (reticulaEid !== null) return
    const eid = world.createEntity()
    const entity = world.getEntity(eid)
    entity.set(ecs.RingGeometry, {
      innerRadius: COLOCACION.radioInteriorReticula,
      outerRadius: COLOCACION.radioExteriorReticula,
    })
    // Anillo por defecto en el plano XY: se gira -90° en X para tumbarlo sobre el suelo (y = 0).
    entity.set(ecs.Quaternion, {x: -0.7071067811865476, y: 0, z: 0, w: 0.7071067811865476})
    entity.set(ecs.UnlitMaterial, {
      ...RETICULA_VALIDA, opacity: 0.95, side: 'double', blending: 'normal',
      depthTest: false, depthWrite: false, forceTransparent: true,
    })
    entity.setLocalPosition(RETICULA_OCULTA)
    entity.hide()
    reticulaEid = eid
  }
  const ocultarReticula = () => {
    if (reticulaEid === null) return
    const entity = world.getEntity(reticulaEid)
    entity.hide()
    entity.setLocalPosition(RETICULA_OCULTA)
    reticulaPunto = null
    reticulaValida = false
    reticulaColor = null
  }
  const aplicarColorReticula = (valida: boolean) => {
    if (reticulaEid === null) return
    const clave = valida ? 'valida' : 'invalida'
    if (clave === reticulaColor) return
    reticulaColor = clave
    world.getEntity(reticulaEid).set(ecs.UnlitMaterial, {
      ...(valida ? RETICULA_VALIDA : RETICULA_INVALIDA), opacity: valida ? 0.95 : 0.5,
      side: 'double', blending: 'normal', depthTest: false, depthWrite: false, forceTransparent: true,
    })
  }
  const tickReticula = () => {
    if (reticulaEid === null) return
    const activa = COLOCACION.habilitado && COLOCACION.reticulaSuelo &&
      ['ESCANEO', 'REUBICAR'].includes(session.phase) && session.trackingReady
    if (!activa) return ocultarReticula()
    const pose = poseCamara(world)
    if (!pose) return ocultarReticula()
    const punto = interseccionRayoPlanoY(pose.posicion, pose.adelante, 0)
    if (!punto) return ocultarReticula()
    reticulaValida = validarPuntoSuelo(punto, pose, COLOCACION).valido
    // Suavizado con delta del tick: el mismo tiempo de reacción sin importar los FPS.
    reticulaPunto = acercarPuntoSuave(reticulaPunto, punto, world.time.delta / 1000, COLOCACION.suavizadoSegundos)
    aplicarColorReticula(reticulaValida)
    const entity = world.getEntity(reticulaEid)
    entity.show()
    entity.setLocalPosition({x: reticulaPunto!.x, y: COLOCACION.alturaReticula, z: reticulaPunto!.z})
  }
  if (COLOCACION.habilitado && COLOCACION.reticulaSuelo && !desktop) crearReticula()
  const touch = (event: any) => {
    if (isUiTouch(event.data.position)) return
    if (!['ESCANEO', 'REUBICAR'].includes(session.phase)) return
    // Con la retícula de suelo activa, el punto de apoyo es el que ella marca (calculado
    // analíticamente en cada tick). Si no es válido, se rechaza sin cambiar de fase.
    if (COLOCACION.habilitado && COLOCACION.reticulaSuelo && !desktop) {
      const pose = poseCamara(world)
      if (reticulaPunto && reticulaValida && pose) {
        const valido = session.place({x: reticulaPunto.x, y: 0, z: reticulaPunto.z},
          p => validarPuntoSuelo(p, pose, COLOCACION).valido)
        if (!valido) ui.showMessage(labels.superficieInvalida)
      } else {
        ui.showMessage(labels.superficieInvalida)
      }
      return
    }
    // Sin retícula (desactivada o escritorio) se conserva el comportamiento previo: el
    // worldPosition del motor o, en 3D, el plano virtual de escritorio.
    const position = validPosition(event.data.worldPosition) ? event.data.worldPosition : desktopPosition(event.data.position)
    if (!validPosition(position)) { ui.showMessage(labels.superficieInvalida); return }
    if (!desktop) {
      const pose = poseCamara(world)
      if (!validarPuntoSuelo(position, pose, COLOCACION).valido) { ui.showMessage(labels.superficieInvalida); return }
      if (!session.place(position, p => validarPuntoSuelo(p, pose, COLOCACION).valido)) ui.showMessage(labels.superficieInvalida)
      return
    }
    session.place(position)
  }
  const canInspect = () => session.phase === 'EXPLORAR' && root !== null && model !== null
  const screenPixels = (position: {x: number; y: number}) => screenToViewport(position, inputRect())
  const beginInspectionTouch = (event: any) => {
    if (!canInspect() || pinchActive || radial.pointers.size > 1 || isUiTouch(event.data.position)) return
    const position = normalizedScreenPosition(event.data.position)
    if (!position) return
    inspectionTouch = {pointerId: event.data.pointerId, target: event.data.target ?? event.target, start: position, dragged: false}
  }
  const moveInspectionTouch = (event: any) => {
    const point = screenPixels(event.data.position)
    const wasPending = radial.phase === 'pending'
    if (point) radial.move(event.data.pointerId, point)
    if (radial.blocked) return
    if (!canInspect() || pinchActive || !inspectionTouch || inspectionTouch.pointerId !== event.data.pointerId) return
    const position = normalizedScreenPosition(event.data.position)
    const change = normalizedScreenPosition(event.data.change)
    if (!position || !change) return
    if (!inspectionTouch.dragged) inspectionTouch.dragged = (wasPending && radial.phase === 'idle') || inspection.isDrag(inspectionTouch.start, position)
    if (inspectionTouch.dragged) radial.cancel()
    const totalX = position.x - inspectionTouch.start.x
    const totalY = position.y - inspectionTouch.start.y
    if (inspectionTouch.dragged && Math.abs(totalX) >= Math.abs(totalY)) {
      inspection.rotate(change.x)
      applyInspection()
    }
  }
  const endInspectionTouch = (event: any) => {
    const point = screenPixels(event.data.position)
    if (point) radial.move(event.data.pointerId, point)
    const tapOnBird = !!inspectionTouch && inspectionTouch.pointerId === event.data.pointerId &&
      inspectionTouch.target === model && !inspectionTouch.dragged && !pinchActive &&
      canInspect() && !isUiTouch(event.data.position)
    const consumed = radial.release(event.data.pointerId)
    if (consumed) { inspectionTouch = null; return }
    if (!inspectionTouch || inspectionTouch.pointerId !== event.data.pointerId) return
    inspectionTouch = null
    if (tapOnBird) ui.openInfo(point)
  }
  const beginPinch = (event: any) => {
    radial.cancel()
    if (radial.blocked) { inspectionTouch = null; return }
    if (!canInspect() || event.data.touchCount !== 2 || isUiTouch(event.data.position)) return
    pinchActive = inspection.beginPinch(event.data.startSpread)
    if (pinchActive) inspectionTouch = null
  }
  const movePinch = (event: any) => {
    if (radial.blocked || !pinchActive || !canInspect() || event.data.touchCount !== 2) return
    inspection.pinch(event.data.spread)
    applyInspection()
  }
  const endPinch = () => {
    pinchActive = false
    inspection.endPinch()
  }
  // El toque puede llegar al global aunque una geometría visual (como Hider)
  // sea la que recibió el raycast. La fase evita que un toque sobre el ave
  // vuelva a colocarla; el filtro del HUD evita colocar detrás de los controles.
  const screenTouch = (event: any) => {
    radial.pointerDown(event.data.pointerId)
    if (radial.blocked) return
    if (radial.pointers.size > 1) { inspectionTouch = null; return }
    if (['ESCANEO', 'REUBICAR'].includes(session.phase)) touch(event)
    else beginInspectionTouch(event)
  }
  // Pointer Events completa cancelación y contactos sobre DOM; ECS resuelve el hit 3D.
  const nativeDown = (event: PointerEvent) => {
    if (hudUnlockTimer) clearTimeout(hudUnlockTimer)
    hudUnlockTimer = null
    if (!radial.blocked && !radial.pointers.size) ui.setGestureBlocked(false)
    radial.pointerDown(event.pointerId)
    if (radial.pointers.size > 1) inspectionTouch = null
    if (radial.blocked) { inspectionTouch = null; ui.setGestureBlocked(radial.phase === 'consuming') }
  }
  const nativeMove = (event: PointerEvent) => {
    if (radial.phase === 'open') radial.move(event.pointerId, {x: event.clientX, y: event.clientY})
  }
  const nativeEnd = (event: PointerEvent) => {
    if (radial.blocked || event.type === 'pointercancel') inspectionTouch = null
    if (event.type === 'pointercancel') endPinch()
    if (event.type === 'pointerup' && radial.phase === 'pending' && radial.pointerId === event.pointerId) {
      // El hit inicial lo resolvió ECS. Completar aquí evita depender del orden de ambos END.
      const position = viewportToScreen({x: event.clientX, y: event.clientY}, inputRect())
      if (position) endInspectionTouch({data: {pointerId: event.pointerId, position}})
      // Consumir también el click sintetizado del tap que acaba de abrir el menú.
      if (radial.blocked) ui.setGestureBlocked(true)
    }
    radial.release(event.pointerId)
    if (!radial.pointers.size) {
      // El click sintetizado tras pointerup también pertenece al gesto consumido.
      hudUnlockTimer = setTimeout(() => { hudUnlockTimer = null; if (!radial.pointers.size) ui.setGestureBlocked(false) }, 0)
    }
  }
  const cancelInteraction = () => {
    radial.reset()
    inspectionTouch = null
    endPinch()
    ui.setGestureBlocked(false)
  }
  const visibility = () => { if (document.hidden) cancelInteraction() }
  const contextMenu = (event: Event) => {
    if (radial.phase !== 'idle') event.preventDefault()
  }
  window.addEventListener('pointerdown', nativeDown, true)
  window.addEventListener('pointermove', nativeMove, true)
  window.addEventListener('pointerup', nativeEnd, true)
  window.addEventListener('pointercancel', nativeEnd, true)
  window.addEventListener('blur', cancelInteraction)
  window.addEventListener('resize', cancelInteraction)
  window.addEventListener('contextmenu', contextMenu)
  document.addEventListener('visibilitychange', visibility)
  world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, screenTouch)
  world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_MOVE, moveInspectionTouch)
  world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_END, endInspectionTouch)
  world.events.addListener(world.events.globalId, ecs.input.GESTURE_START, beginPinch)
  world.events.addListener(world.events.globalId, ecs.input.GESTURE_MOVE, movePinch)
  world.events.addListener(world.events.globalId, ecs.input.GESTURE_END, endPinch)
  world.events.addListener(world.events.globalId, ecs.events.REALITY_READY, ready)
  world.events.addListener(world.events.globalId, ecs.events.REALITY_TRACKING_STATUS, tracking)
  if (!desktop) startupTimer = setTimeout(() => {
    if (!session.trackingReady) ui.showMessage(labels.errorMotor)
  }, 45000)
  // Panel de diagnóstico que solo existe (y solo se actualiza) con ?debug en la URL. Sin el
  // parámetro no crea DOM ni ejecuta lecturas.
  const debugActivo = new URLSearchParams(window.location.search).has('debug')
  let debugPanel: HTMLElement | null = null
  let debugFps = 0
  let debugFpsTiempo = performance.now()
  if (debugActivo) {
    debugPanel = document.createElement('pre')
    debugPanel.id = 'aves-debug'
    debugPanel.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9999;margin:0;padding:8px 10px;font:11px/1.45 ui-monospace,monospace;color:#e6ffe6;background:rgba(0,0,0,.72);border-radius:8px;white-space:pre-wrap;pointer-events:none;max-width:70vw'
    document.body.appendChild(debugPanel)
  }
  const tickDebug = () => {
    if (debugPanel === null) return
    const ahora = performance.now()
    const dtFps = ahora - debugFpsTiempo
    debugFpsTiempo = ahora
    if (dtFps > 0) debugFps = debugFps ? debugFps * 0.85 + (1000 / dtFps) * 0.15 : 1000 / dtFps
    const pose = poseCamara(world)
    const estado = session.snapshot()
    let distancia = '-'
    if (root !== null && pose) {
      const p = world.transform.getWorldPosition(root)
      if (p) distancia = `${Math.hypot(p.x - pose.posicion.x, p.z - pose.posicion.z).toFixed(2)} m`
    }
    debugPanel.textContent = [
      `seguimiento: ${estado.trackingStatus ?? '-'} · ${estado.trackingReason ?? '-'}`,
      `altura de la cámara: ${pose ? pose.posicion.y.toFixed(2) : '-'} m`,
      `distancia horizontal al ave: ${distancia}`,
      `retícula: ${reticulaPunto ? (reticulaValida ? 'válida' : 'inválida') : 'sin punto'}`,
      `fps: ${debugFps.toFixed(0)}`,
    ].join('\n')
  }
  // Diagnóstico de solo lectura; no añade controles de simulación al producto.
  const debug = () => ({...session.snapshot(), root: root?.toString() ?? null,
    model: model?.toString() ?? null, activeClip, paused, desktop, birdId: bird.id, inspection: inspection.snapshot(), pinchActive, radial: radial.snapshot(), arrival: arrival.snapshot(),
    elevacion: elevacionActual, elevacionObjetivo, elevacionAplicada,
    seguimiento: seguimiento.snapshot(), seguimientoCongelado})
  ;(window as any).__AR_AVES_DEBUG__ = debug
  return {tick: () => {
    tickArrival()
    const seguimientoEscrito = tickSeguimiento()
    const elevacionEscrita = tickElevacion()
    tickReticula()
    tickDebug()
    if (model !== null) {
      // Tanto la elevación como el seguimiento mueven el modelo (directamente o vía la raíz):
      // hay que refrescar las envolventes del raycast. Las aves con actualizarLimitesAnimados ya
      // lo hacen cada fotograma; las demás solo necesitan rehacer la matriz de mundo si cambió.
      if (bird.inspeccion?.actualizarLimitesAnimados) refreshAnimatedBounds(world.three.entityToObject.get(model))
      else if (elevacionEscrita || seguimientoEscrito) world.three.entityToObject.get(model)?.updateWorldMatrix(true, true)
    }
  }, dispose: () => {
    ++fetchGeneration
    fetchController?.abort()
    if (startupTimer) clearTimeout(startupTimer)
    session.reset()
    radial.reset()
    if (hudUnlockTimer) clearTimeout(hudUnlockTimer)
    window.removeEventListener('pointerdown', nativeDown, true)
    window.removeEventListener('pointermove', nativeMove, true)
    window.removeEventListener('pointerup', nativeEnd, true)
    window.removeEventListener('pointercancel', nativeEnd, true)
    window.removeEventListener('blur', cancelInteraction)
    window.removeEventListener('resize', cancelInteraction)
    window.removeEventListener('contextmenu', contextMenu)
    document.removeEventListener('visibilitychange', visibility)
    world.events.removeListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, screenTouch)
    world.events.removeListener(world.events.globalId, ecs.input.SCREEN_TOUCH_MOVE, moveInspectionTouch)
    world.events.removeListener(world.events.globalId, ecs.input.SCREEN_TOUCH_END, endInspectionTouch)
    world.events.removeListener(world.events.globalId, ecs.input.GESTURE_START, beginPinch)
    world.events.removeListener(world.events.globalId, ecs.input.GESTURE_MOVE, movePinch)
    world.events.removeListener(world.events.globalId, ecs.input.GESTURE_END, endPinch)
    world.events.removeListener(world.events.globalId, ecs.events.REALITY_READY, ready)
    world.events.removeListener(world.events.globalId, ecs.events.REALITY_TRACKING_STATUS, tracking)
    if (reticulaEid !== null) { world.deleteEntity(reticulaEid); reticulaEid = null }
    if (debugPanel) { debugPanel.remove(); debugPanel = null }
    if ((window as any).__AR_AVES_DEBUG__ === debug) delete (window as any).__AR_AVES_DEBUG__
    ui.dispose()
  }}
}

ecs.registerComponent({
  name: 'tap-to-place',
  schema: {prefab: 'eid'}, // Compatibilidad con el prefab conservado en Studio.
  add: (world, {eid}) => { controllers.set(eid, attach(world, eid)) },
  tick: (_world, {eid}) => { controllers.get(eid)?.tick() },
  remove: (_world, {eid}) => { controllers.get(eid)?.dispose(); controllers.delete(eid) },
})

// Conserva campus y controles de plantilla en la escena, fuera del recorrido piloto.
ecs.registerComponent({name: 'pilot-hidden', add: (world, {eid}) => { world.getEntity(eid).hide() }})
export {OBJECT_PLACED_EVENT}
