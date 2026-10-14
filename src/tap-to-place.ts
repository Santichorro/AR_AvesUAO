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
import colibriCalibration from './data/colibri-aterrizaje.json'
import martinCalibration from './data/martin_pescador-aterrizaje.json'
import palomaCalibration from './data/paloma-aterrizaje.json'
import guacamayaCalibration from './data/loro-aterrizaje.json'
import {availableBird} from './bird-catalog'

// Se conserva el evento de la plantilla para no romper componentes ajenos.
const OBJECT_PLACED_EVENT = 'object-placed'
const controllers = new Map<ecs.Eid, {tick: () => void; dispose: () => void}>()
const calibrations = {colibri: colibriCalibration, martin_pescador: martinCalibration, paloma: palomaCalibration, loro: guacamayaCalibration}

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
    landingFrameApplied = false
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
    inspection.reset()
    radial.reset(true)
    ui?.setGestureBlocked(radial.blocked)
  }
  const setClip = (name: string) => {
    if (model === null || session.phase !== 'EXPLORAR') return
    const clip = bird.clips.find(c => c.nombre === name)
    if (!clip) { ui.showMessage(labels.errorAnimacion); return }
    activeClip = name; paused = false
    ecs.GltfModel.set(world, model, {animationClip: name, loop: clip.bucle, paused: false, time: 0, timeScale: 1, crossFadeDuration: 0.12})
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
  const session = new PlacementSession({
    destroy,
    move(position: {x: number; y: number; z: number}) {
      if (root !== null) world.getEntity(root).setLocalPosition(position)
    },
    spawn(position: {x: number; y: number; z: number}, generation: number, options: {arrival: boolean}) {
      inspection.reset()
      landingFrameApplied = false
      root = world.createEntity()
      world.getEntity(root).setLocalPosition(position)
      model = world.createEntity()
      world.getEntity(model).setParent(root)
      world.getEntity(model).setLocalPosition(bird.transformacion.posicionLocal)
      world.getEntity(model).set(ecs.Quaternion, ecs.math.quat.yRadians(bird.transformacion.giroY))
      applyInspection()
      if (options.arrival) {
        const initialPose = arrival.begin(position, generation, inspection.scale, bird.transformacion.giroY, bird.transformacion.posicionLocal)
        applyArrivalPose(initialPose)
      }
      const currentModel = model
      loadedListener = (event: any) => {
        if (model !== currentModel || !session.loaded(generation)) return
        clearLoadTimer()
        activeClip = options.arrival ? bird.animaciones.aterrizaje : bird.animaciones.reposo
        ecs.GltfModel.set(world, currentModel, {time: 0, timeScale: options.arrival ? landingRate : 1, paused: options.arrival && !session.trackingReady})
      }
      finishedListener = (event: any) => {
        if (model === currentModel && session.phase === 'EXPLORAR' && event.data.name === activeClip) {
          const clip = bird.clips.find(c => c.nombre === activeClip)
          if (clip && !clip.bucle) setClip(bird.animaciones.reposo)
        }
      }
      world.events.addListener(model, ecs.events.GLTF_MODEL_LOADED, loadedListener)
      world.events.addListener(model, ecs.events.GLTF_ANIMATION_FINISHED, finishedListener)
      loadTimer = setTimeout(() => {
        if (session.generation === generation && session.phase === 'COLOCANDO') session.fail(labels.errorRecurso)
      }, 30000)
      activeClip = options.arrival ? bird.animaciones.aterrizaje : bird.animaciones.reposo
      ecs.GltfModel.set(world, model, {url: bird.modelo, animationClip: activeClip, loop: !options.arrival, paused: true, time: 0, timeScale: options.arrival ? landingRate : 1})
    },
  }, snapshot => {
    if (model !== null && snapshot.phase === 'ATERRIZANDO') {
      ecs.GltfModel.set(world, model, {paused: !snapshot.trackingReady})
    }
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
      paused = !paused; ecs.GltfModel.set(world, model, {paused})
    },
  }, desktop)
  session.emit()
  if (desktop) session.setTracking(true)
  const ready = () => {
    if (startupTimer) clearTimeout(startupTimer)
    startupTimer = null
    // REALITY_READY confirma inicio, no garantiza por sí solo seguimiento estable.
    if (!desktop) ui.showMessage(labels.seguimiento)
  }
  const tracking = (event: any) => session.setTracking(event.data?.status === 'NORMAL')
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
  const touch = (event: any) => {
    if (isUiTouch(event.data.position)) return
    if (!['ESCANEO', 'REUBICAR'].includes(session.phase)) return
    const position = validPosition(event.data.worldPosition) ? event.data.worldPosition : desktopPosition(event.data.position)
    if (!validPosition(position)) { ui.showMessage(labels.superficieInvalida); return }
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
  // Diagnóstico de solo lectura; no añade controles de simulación al producto.
  const debug = () => ({...session.snapshot(), root: root?.toString() ?? null,
    model: model?.toString() ?? null, activeClip, paused, desktop, birdId: bird.id, inspection: inspection.snapshot(), pinchActive, radial: radial.snapshot(), arrival: arrival.snapshot()})
  ;(window as any).__AR_AVES_DEBUG__ = debug
  return {tick: () => {
    tickArrival()
    if (model !== null && bird.inspeccion?.actualizarLimitesAnimados) {
      refreshAnimatedBounds(world.three.entityToObject.get(model))
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
