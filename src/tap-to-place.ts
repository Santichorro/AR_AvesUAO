import * as ecs from '@8thwall/ecs'
import catalog from './data/aves.json'
import labels from './data/interfaz.json'
import {PlacementSession, validPosition} from './placement-session'
import {createPilotUi} from './pilot-ui'

// Se conserva el evento de la plantilla para no romper componentes ajenos.
const OBJECT_PLACED_EVENT = 'object-placed'
const controllers = new Map<ecs.Eid, () => void>()
const bird = catalog.aves.find(b => b.id === 'colibri')!

function attach(world: ecs.World, ground: ecs.Eid) {
  const desktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !('ontouchend' in document && navigator.maxTouchPoints > 1)
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
  const clearLoadTimer = () => { if (loadTimer) clearTimeout(loadTimer); loadTimer = null }
  const destroy = () => {
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
  }
  const setClip = (name: string) => {
    if (model === null || session.phase !== 'EXPLORAR') return
    const clip = bird.clips.find(c => c.nombre === name)
    if (!clip) { ui.showMessage(labels.errorAnimacion); return }
    activeClip = name; paused = false
    ecs.GltfModel.set(world, model, {animationClip: name, loop: clip.bucle, paused: false, time: 0, crossFadeDuration: 0.12})
  }
  const session = new PlacementSession({
    destroy,
    move(position: {x: number; y: number; z: number}) {
      if (root !== null) world.getEntity(root).setLocalPosition(position)
    },
    spawn(position: {x: number; y: number; z: number}, generation: number) {
      root = world.createEntity()
      world.getEntity(root).setLocalPosition(position)
      model = world.createEntity()
      world.getEntity(model).setParent(root)
      world.getEntity(model).setLocalPosition(bird.transformacion.posicionLocal)
      world.setScale(model, bird.escalaExhibicion, bird.escalaExhibicion, bird.escalaExhibicion)
      world.getEntity(model).set(ecs.Quaternion, ecs.math.quat.yRadians(bird.transformacion.giroY))
      const currentModel = model
      loadedListener = (event: any) => {
        if (model !== currentModel || !session.loaded(generation)) return
        clearLoadTimer()
        activeClip = bird.animaciones.reposo
        world.events.dispatch(ground, OBJECT_PLACED_EVENT)
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
      ecs.GltfModel.set(world, model, {url: bird.modelo, animationClip: bird.animaciones.reposo, loop: true})
    },
  }, snapshot => ui?.update(snapshot))

  const prepareAsset = async () => {
    const generation = ++fetchGeneration
    fetchController?.abort()
    fetchController = new AbortController()
    const controller = fetchController
    const timeout = setTimeout(() => controller.abort(), 30000)
    session.setAsset(false)
    try {
      const response = await fetch(bird.modelo, {signal: controller.signal, cache: 'force-cache'})
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (bytes.length < 20 || String.fromCharCode(...bytes.slice(0, 4)) !== 'glTF') throw new Error('No es un GLB válido; comprobar Git LFS')
      if (generation === fetchGeneration) session.setAsset(true)
    } catch (error) {
      if (generation === fetchGeneration) session.fail(labels.errorRecurso)
      console.error('Carga del GLB:', error)
    } finally { clearTimeout(timeout) }
  }
  ui = createPilotUi(catalog.aves, bird, {
    start() {
      session.reset(); session.start()
      if (!session.assetReady) void prepareAsset()
    },
    reset() { session.reset() },
    relocate() { session.relocate() },
    cancel() { session.cancelRelocation() },
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
  const isUiTouch = (position: {x: number; y: number} | undefined) => {
    if (!position) return false
    const x = position.x <= 1 ? position.x * window.innerWidth : position.x
    const y = position.y <= 1 ? position.y * window.innerHeight : position.y
    return !!document.elementFromPoint(x, y)?.closest('#aves-pilot button, #aves-pilot select, #aves-pilot .aves-panel')
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
  const birdTouch = (event: any) => {
    if (session.phase !== 'EXPLORAR' || model === null || isUiTouch(event.data.position)) return
    if (event.target === model || event.data.target === model) ui.openInfo()
  }
  // El toque puede llegar al global aunque una geometría visual (como Hider)
  // sea la que recibió el raycast. La fase evita que un toque sobre el ave
  // vuelva a colocarla; el filtro del HUD evita colocar detrás de los controles.
  const screenTouch = (event: any) => {
    if (['ESCANEO', 'REUBICAR'].includes(session.phase)) touch(event)
    else birdTouch(event)
  }
  world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, screenTouch)
  world.events.addListener(world.events.globalId, ecs.events.REALITY_READY, ready)
  world.events.addListener(world.events.globalId, ecs.events.REALITY_TRACKING_STATUS, tracking)
  if (!desktop) startupTimer = setTimeout(() => {
    if (!session.trackingReady) ui.showMessage(labels.errorMotor)
  }, 45000)
  // Diagnóstico de solo lectura; no añade controles de simulación al producto.
  const debug = () => ({...session.snapshot(), root: root?.toString() ?? null,
    model: model?.toString() ?? null, activeClip, paused, desktop})
  ;(window as any).__AR_AVES_DEBUG__ = debug
  return () => {
    ++fetchGeneration
    fetchController?.abort()
    if (startupTimer) clearTimeout(startupTimer)
    session.reset()
    world.events.removeListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, screenTouch)
    world.events.removeListener(world.events.globalId, ecs.events.REALITY_READY, ready)
    world.events.removeListener(world.events.globalId, ecs.events.REALITY_TRACKING_STATUS, tracking)
    if ((window as any).__AR_AVES_DEBUG__ === debug) delete (window as any).__AR_AVES_DEBUG__
    ui.dispose()
  }
}

ecs.registerComponent({
  name: 'tap-to-place',
  schema: {prefab: 'eid'}, // Compatibilidad con el prefab conservado en Studio.
  add(world, {eid}) { controllers.set(eid, attach(world, eid)) },
  remove(_world, {eid}) { controllers.get(eid)?.(); controllers.delete(eid) },
})

// Conserva campus y controles de plantilla en la escena, fuera del recorrido piloto.
ecs.registerComponent({name: 'pilot-hidden', add(world, {eid}) { world.getEntity(eid).hide() }})
export {OBJECT_PLACED_EVENT}
