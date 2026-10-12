// Geometría y temporizadores sin ECS/DOM. Todas las distancias se expresan en px.
export const RADIAL_CONFIG = Object.freeze({
  holdMs: 1000, confirmMs: 180, radius: 144, deadRadius: 44,
  moveThreshold: 10, activationMove: 12, edgePadding: 12, visualScale: 1.08,
})
export const RADIAL_ACTIONS = Object.freeze(['info', 'animation', 'relocate', 'reset'])
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function radialLayout(origin, viewport, insets = {}, config = RADIAL_CONFIG) {
  const left = (insets.left || 0) + config.edgePadding
  const right = (insets.right || 0) + config.edgePadding
  const top = (insets.top || 0) + config.edgePadding
  const bottom = (insets.bottom || 0) + config.edgePadding
  const radius = Math.min(config.radius,
    Math.max(1, (viewport.width - left - right) / (2 * config.visualScale)),
    Math.max(1, (viewport.height - top - bottom) / (2 * config.visualScale)))
  const bound = radius * config.visualScale
  return {
    x: clamp(origin.x, left + bound, viewport.width - right - bound),
    y: clamp(origin.y, top + bound, viewport.height - bottom - bound),
    radius, deadRadius: config.deadRadius * radius / config.radius,
  }
}

export function radialSector(point, layout) {
  const dx = point.x - layout.x, dy = point.y - layout.y
  const r = Math.hypot(dx, dy)
  if (r <= layout.deadRadius || r > layout.radius) return null
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360
  // 4° de separación visual en cada límite; la geometría no cambia al resaltar.
  const offset = (angle + 45) % 90
  if (offset < 2 || offset > 88) return null
  return RADIAL_ACTIONS[Math.floor(((angle + 45) % 360) / 90)]
}

export class RadialGesture {
  constructor(callbacks = {}, config = {}, clock = {}) {
    this.config = {...RADIAL_CONFIG, ...config}
    this.callbacks = callbacks
    this.clock = {set: clock.set || ((fn, ms) => setTimeout(fn, ms)), clear: clock.clear || (id => clearTimeout(id))}
    this.pointers = new Set()
    this.phase = 'idle'
    this.pointerId = null
    this.holdTimer = this.confirmTimer = null
    this.selected = null
  }
  clearTimers() {
    if (this.holdTimer !== null) this.clock.clear(this.holdTimer)
    if (this.confirmTimer !== null) this.clock.clear(this.confirmTimer)
    this.holdTimer = this.confirmTimer = null
  }
  pointerDown(id) {
    this.pointers.add(id)
    if (this.pointers.size > 1) this.cancel()
  }
  begin(id, origin, layout) {
    this.pointerDown(id)
    if (this.phase !== 'idle' || this.pointers.size !== 1) return false
    this.pointerId = id
    this.origin = {...origin}
    this.layout = layout
    this.armed = false
    this.phase = 'pending'
    this.holdTimer = this.clock.set(() => {
      this.holdTimer = null
      if (this.phase !== 'pending' || this.pointers.size !== 1) return
      this.phase = 'open'
      this.callbacks.open?.(this.layout)
    }, this.config.holdMs)
    return true
  }
  move(id, point) {
    if (id !== this.pointerId) return
    if (this.phase === 'pending') {
      if (distance(point, this.origin) >= this.config.moveThreshold) this.cancel()
      return
    }
    if (this.phase !== 'open') return
    // El clamp del centro nunca arma un sector por sí solo.
    if (!this.armed && distance(point, this.origin) < this.config.activationMove) return
    this.armed = true
    const next = radialSector(point, this.layout)
    if (next === this.selected) return
    if (this.confirmTimer !== null) this.clock.clear(this.confirmTimer)
    this.confirmTimer = null
    this.selected = next
    this.callbacks.highlight?.(next)
    if (next === null) return
    this.confirmTimer = this.clock.set(() => {
      this.confirmTimer = null
      if (this.phase !== 'open' || this.selected !== next || this.pointers.size !== 1) return
      this.phase = 'consuming' // Antes del callback: Reubicar/Reiniciar pueden cambiar el estado.
      this.selected = null
      this.callbacks.close?.()
      this.callbacks.action?.(next)
    }, this.config.confirmMs)
  }
  cancel() {
    const wasOpen = this.phase === 'open' || this.phase === 'consuming'
    this.clearTimers()
    this.selected = null
    this.phase = wasOpen && this.pointers.size ? 'consuming' : 'idle'
    if (wasOpen) this.callbacks.close?.()
  }
  release(id) {
    const consumed = this.blocked
    this.pointers.delete(id)
    if (id === this.pointerId && this.phase !== 'idle') this.cancel()
    if (!this.pointers.size) {
      this.phase = 'idle'
      this.pointerId = null
    }
    return consumed
  }
  reset(consume = false) {
    const keepBlocked = consume && this.blocked && this.pointers.size > 0
    this.clearTimers()
    this.selected = null
    this.callbacks.close?.()
    this.phase = keepBlocked ? 'consuming' : 'idle'
    if (!consume) this.pointers.clear()
    if (!keepBlocked) this.pointerId = null
  }
  get blocked() { return this.phase === 'open' || this.phase === 'consuming' }
  snapshot() { return {phase: this.phase, selected: this.selected, pointerCount: this.pointers.size} }
}
