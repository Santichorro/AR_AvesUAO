// Trayectoria y compensación del hueso root, independientes del motor.
const copy = p => ({x: p.x, y: p.y, z: p.z})
const finitePosition = p => p && ['x', 'y', 'z'].every(k => Number.isFinite(p[k]))
const clamp = value => Math.max(0, Math.min(1, value))
const smooth = value => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10) }

export function rootTranslationAt(curve, time) {
  if (time <= curve[0][0]) return {x: curve[0][1], y: curve[0][2], z: curve[0][3]}
  const end = curve[curve.length - 1]
  if (time >= end[0]) return {x: end[1], y: end[2], z: end[3]}
  let low = 0, high = curve.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (curve[middle][0] <= time) low = middle
    else high = middle
  }
  const a = curve[low], b = curve[high], t = (time - a[0]) / (b[0] - a[0])
  return {x: a[1] + (b[1] - a[1]) * t, y: a[2] + (b[2] - a[2]) * t, z: a[3] + (b[3] - a[3]) * t}
}

export class ArrivalMotion {
  constructor(config, calibration, random = Math.random) {
    this.config = config
    this.calibration = calibration
    this.random = random
    this.cancel()
  }
  begin(target, generation, scale, modelYaw, localPosition) {
    if (!finitePosition(target) || !finitePosition(localPosition) || !Number.isFinite(modelYaw) || !Number.isFinite(scale) || scale <= 0) throw new Error('Transformación de llegada inválida')
    const c = this.config
    if (!(c.duracionSegundos > 0 && c.mezclaReposoSegundos >= 0 && c.alturaMinima > 0 && c.alturaMaxima >= c.alturaMinima && c.radioMinimo > 0 && c.radioMaximo >= c.radioMinimo && c.exponenteVertical > 0)) throw new Error('Calibración de llegada inválida')
    const angle = this.random() * Math.PI * 2
    const radius = c.radioMinimo + this.random() * (c.radioMaximo - c.radioMinimo)
    const height = c.alturaMinima + this.random() * (c.alturaMaxima - c.alturaMinima)
    this.target = copy(target)
    this.origin = {x: target.x + Math.cos(angle) * radius, y: target.y + height, z: target.z + Math.sin(angle) * radius}
    // El pico del GLB apunta a +X; considerar la rotación local del modelo.
    this.yaw = Math.atan2(target.x - this.origin.x, target.z - this.origin.z) - (Math.PI / 2 + modelYaw)
    this.modelYaw = modelYaw
    this.scale = scale
    this.localPosition = copy(localPosition)
    this.generation = generation
    this.elapsed = this.blendElapsed = 0
    this.phase = 'approach'
    return this.sample()
  }
  sample() {
    const c = this.config, landed = this.elapsed >= c.duracionSegundos
    const u = clamp(this.elapsed / c.duracionSegundos)
    const horizontal = smooth(u), vertical = smooth(Math.pow(u, c.exponenteVertical))
    const position = landed ? copy(this.target) : {
      x: this.origin.x + (this.target.x - this.origin.x) * horizontal,
      y: this.origin.y + (this.target.y - this.origin.y) * vertical,
      z: this.origin.z + (this.target.z - this.origin.z) * horizontal,
    }
    const clipTime = u * this.calibration.contactoSegundos
    const translation = rootTranslationAt(this.calibration.traslacionRoot, clipTime)
    const reference = this.calibration.rootReposo
    const dx = (translation.x - reference.x) * this.scale, dz = (translation.z - reference.z) * this.scale
    const cosine = Math.cos(this.modelYaw), sine = Math.sin(this.modelYaw)
    const localPosition = landed ? copy(this.localPosition) : {
      x: this.localPosition.x - (cosine * dx + sine * dz),
      y: this.localPosition.y - (translation.y - reference.y) * this.scale,
      z: this.localPosition.z - (-sine * dx + cosine * dz),
    }
    return {position, localPosition, yaw: this.yaw, clipTime, landed,
      finished: this.phase === 'blend' && this.blendElapsed >= c.mezclaReposoSegundos}
  }
  advance(seconds, generation) {
    if (this.phase === 'idle' || generation !== this.generation) return null
    if (Number.isFinite(seconds) && seconds > 0) {
      if (this.phase === 'approach') this.elapsed += seconds
      else this.blendElapsed += seconds
    }
    return this.sample()
  }
  beginBlend() {
    if (this.phase !== 'approach' || this.elapsed < this.config.duracionSegundos) return false
    this.phase = 'blend'
    this.blendElapsed = 0
    return true
  }
  cancel() {
    this.phase = 'idle'
    this.elapsed = this.blendElapsed = 0
    this.generation = null
    this.target = this.origin = null
  }
  snapshot() {
    return {phase: this.phase, elapsed: this.elapsed, blendElapsed: this.blendElapsed,
      origin: this.origin && copy(this.origin), target: this.target && copy(this.target)}
  }
}
