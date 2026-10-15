// Estado de colocación independiente del motor; se prueba sin cámara ni WebGL.
export const validPosition = p => !!p && ['x', 'y', 'z'].every(k => Number.isFinite(p[k]))

export class PlacementSession {
  constructor(actions, changed = (_snapshot) => {}) {
    this.actions = actions
    this.changed = changed
    this.started = false
    this.trackingReady = false
    this.trackingStatus = null
    this.trackingReason = null
    this.assetReady = false
    this.phase = 'INTRO'
    this.position = null
    this.message = ''
    this.generation = 0
    this.pendingReplacement = false
    this.replacing = false
  }
  emit() { this.changed(this.snapshot()) }
  snapshot() {
    return {phase: this.phase, position: this.position ? {...this.position} : null,
      started: this.started, trackingReady: this.trackingReady,
      trackingStatus: this.trackingStatus, trackingReason: this.trackingReason,
      assetReady: this.assetReady, message: this.message, generation: this.generation}
  }
  prepare() {
    if (this.pendingReplacement && this.started && this.assetReady && this.trackingReady) {
      this.pendingReplacement = false
      this.spawnAt(this.position, true)
      return
    }
    if (['INTRO', 'PREPARANDO', 'ESCANEO'].includes(this.phase)) {
      this.phase = !this.started ? 'INTRO' : this.assetReady && this.trackingReady ? 'ESCANEO' : 'PREPARANDO'
    }
    this.emit()
  }
  start() { this.started = true; this.prepare() }
  setTracking(ready, info) {
    this.trackingReady = ready
    this.trackingStatus = info?.status ?? null
    this.trackingReason = info?.reason ?? null
    this.prepare()
  }
  setAsset(ready) { this.assetReady = ready; this.prepare() }
  // `validador` (opcional) decide si el punto es aceptable (reglas de suelo de colocacion-suelo.js).
  // Si lo rechaza, no cambia de fase ni coloca: la sesión es el último guardián del punto.
  place(p, validador) {
    if (!this.started || !this.assetReady || !this.trackingReady || !validPosition(p)) return false
    if (!['ESCANEO', 'REUBICAR'].includes(this.phase)) return false
    if (typeof validador === 'function' && !validador(p)) return false
    const next = {x: p.x, y: p.y, z: p.z}
    if (this.phase === 'REUBICAR') {
      this.actions.move(next)
      this.position = next
      this.phase = 'EXPLORAR'
      this.emit()
      return true
    }
    this.spawnAt(next, false)
    return true
  }
  spawnAt(next, replacing) {
    this.phase = 'COLOCANDO' // Se bloquea antes de invocar el motor: evita doble toque.
    this.replacing = replacing
    this.position = next
    const generation = ++this.generation
    this.emit()
    try { this.actions.spawn(next, generation, {arrival: !replacing}) } catch (e) { this.fail(String(e)) }
  }
  changeSpecies() {
    ++this.generation
    this.actions.destroy()
    this.assetReady = false
    this.pendingReplacement = this.started && validPosition(this.position)
    this.replacing = false
    this.message = ''
    this.phase = this.started ? 'PREPARANDO' : 'INTRO'
    this.prepare()
  }
  loaded(generation) {
    if (generation !== this.generation || this.phase !== 'COLOCANDO') return false
    this.phase = this.replacing ? 'EXPLORAR' : 'ATERRIZANDO'; this.emit(); return true
  }
  arrived(generation) {
    if (generation !== this.generation || this.phase !== 'ATERRIZANDO') return false
    this.phase = 'EXPLORAR'; this.emit(); return true
  }
  relocate() {
    if (this.phase !== 'EXPLORAR') return false
    this.phase = 'REUBICAR'; this.emit(); return true
  }
  cancelRelocation() {
    if (this.phase !== 'REUBICAR') return false
    this.phase = 'EXPLORAR'; this.emit(); return true
  }
  fail(message) {
    ++this.generation
    this.actions.destroy()
    this.position = null
    this.pendingReplacement = this.replacing = false
    this.phase = 'ERROR'
    this.message = message
    this.emit()
  }
  reset() {
    ++this.generation // Invalida callbacks de modelos eliminados.
    this.actions.destroy()
    this.position = null
    this.pendingReplacement = this.replacing = false
    this.message = ''
    this.phase = 'INTRO'
    this.prepare()
  }
}
