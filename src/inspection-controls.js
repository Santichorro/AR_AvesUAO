// Estado matemático de inspección, independiente de ECS para poder probarlo sin cámara.
export const DEFAULT_INSPECTION = Object.freeze({
  escalaMinima: 0.12,
  escalaMaxima: 0.60,
  sensibilidadGiro: Math.PI * 2,
  umbralArrastre: 0.015,
})

const finite = value => Number.isFinite(value)

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export const normalizedScreenPosition = position => {
  if (!position || !finite(position.x) || !finite(position.y)) return null
  const x = Math.abs(position.x) <= 1 ? position.x : position.x / window.innerWidth
  const y = Math.abs(position.y) <= 1 ? position.y : position.y / window.innerHeight
  if (!finite(x) || !finite(y)) return null
  return {x, y}
}

const wrappedRadians = radians => {
  const fullTurn = Math.PI * 2
  return ((radians + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI
}

export class InspectionControls {
  constructor(config = {}) {
    this.baseScale = finite(config.escalaBase) ? config.escalaBase : 0.25
    this.minimumScale = finite(config.escalaMinima) ? config.escalaMinima : DEFAULT_INSPECTION.escalaMinima
    this.maximumScale = finite(config.escalaMaxima) ? config.escalaMaxima : DEFAULT_INSPECTION.escalaMaxima
    this.rotationSensitivity = finite(config.sensibilidadGiro) ? config.sensibilidadGiro : DEFAULT_INSPECTION.sensibilidadGiro
    this.dragThreshold = finite(config.umbralArrastre) ? config.umbralArrastre : DEFAULT_INSPECTION.umbralArrastre
    if (this.minimumScale > this.maximumScale) [this.minimumScale, this.maximumScale] = [this.maximumScale, this.minimumScale]
    this.baseScale = clamp(this.baseScale, this.minimumScale, this.maximumScale)
    this.reset()
  }

  reset() {
    this.scale = this.baseScale
    this.yaw = 0
    this.pinchStartScale = null
    this.pinchStartSpread = null
  }

  rotate(deltaX) {
    if (!finite(deltaX)) return this.yaw
    this.yaw = wrappedRadians(this.yaw + deltaX * this.rotationSensitivity)
    return this.yaw
  }

  beginPinch(spread) {
    if (!finite(spread) || spread <= 0) return false
    this.pinchStartScale = this.scale
    this.pinchStartSpread = spread
    return true
  }

  pinch(spread) {
    if (!finite(spread) || spread <= 0 || !finite(this.pinchStartSpread) || this.pinchStartSpread <= 0) return this.scale
    this.scale = clamp(this.pinchStartScale * (spread / this.pinchStartSpread), this.minimumScale, this.maximumScale)
    return this.scale
  }

  endPinch() {
    this.pinchStartScale = null
    this.pinchStartSpread = null
  }

  isDrag(start, position) {
    if (!start || !position) return false
    return Math.hypot(position.x - start.x, position.y - start.y) >= this.dragThreshold
  }

  snapshot() {
    return {scale: this.scale, yaw: this.yaw, minimumScale: this.minimumScale, maximumScale: this.maximumScale}
  }
}
