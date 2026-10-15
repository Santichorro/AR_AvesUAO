// Validación de colocación sobre el suelo: geometría y reglas puras, sin ECS, DOM ni timers.
// Se puede probar sin cámara ni WebGL (ver tests/colocacion-suelo.test.cjs). No importa otros
// módulos a propósito, para poder cargarse como ESM embebido en las pruebas.
//
// Convención de ejes: igual que el resto del proyecto. El plano del suelo es y = 0 y la
// dirección de vista de la cámara es la del eje +Z de la entidad de cámara (ver poseCamara en
// tap-to-place.ts). "Bajo el horizonte" se mide como el ángulo descendente del rayo respecto
// al plano horizontal: 0 = horizontal, 90 = apuntando en vertical hacia el suelo.

export const DEFAULTS = Object.freeze({
  habilitado: true,
  distanciaMaxima: 4, // m: distancia horizontal máxima de la cámara al punto.
  toleranciaAltura: 0.05, // m: desviación máxima admitida respecto a la altura del suelo.
  anguloMinimoGrados: 15, // grados: inclinación mínima por debajo del horizonte.
  reticulaSuelo: true,
  suavizadoSegundos: 0.12, // s: constante del suavizado independiente de los FPS.
  radioExteriorReticula: 0.12, // unidades de mundo del anillo.
  radioInteriorReticula: 0.09,
  alturaReticula: 0.005, // separación mínima sobre el suelo para evitar z-fighting.
})

const NUMEROS = ['distanciaMaxima', 'toleranciaAltura', 'anguloMinimoGrados', 'suavizadoSegundos',
  'radioExteriorReticula', 'radioInteriorReticula', 'alturaReticula']

const esPunto = punto => !!punto && ['x', 'y', 'z'].every(k => Number.isFinite(punto[k]))

// Mezcla los valores por defecto con la configuración dada. Ignora campos ausentes,
// no numéricos o negativos; los dos interruptores solo se desactivan con un false explícito.
export function normalizarConfig(global) {
  const salida = {...DEFAULTS}
  if (!global || typeof global !== 'object') return salida
  if (Object.prototype.hasOwnProperty.call(global, 'habilitado')) salida.habilitado = global.habilitado !== false
  if (Object.prototype.hasOwnProperty.call(global, 'reticulaSuelo')) salida.reticulaSuelo = global.reticulaSuelo !== false
  for (const clave of NUMEROS) {
    if (!Object.prototype.hasOwnProperty.call(global, clave)) continue
    const valor = global[clave]
    if (Number.isFinite(valor) && valor >= 0) salida[clave] = valor
  }
  return salida
}

// Intersección analítica del rayo (origen + t·dirección, t > 0) con el plano horizontal
// y = planoY. Devuelve el punto o null si el rayo es paralelo al plano o lo corta por detrás.
export function interseccionRayoPlanoY(origen, direccion, planoY = 0) {
  if (!esPunto(origen) || !esPunto(direccion)) return null
  if (Math.abs(direccion.y) < 1e-6) return null
  const t = (planoY - origen.y) / direccion.y
  if (!(t > 0)) return null
  return {x: origen.x + direccion.x * t, y: planoY, z: origen.z + direccion.z * t}
}

// Ángulo descendente del rayo (grados). 0 = horizontal, positivo hacia el suelo,
// negativo si apunta por encima del horizonte. Null si la dirección no es válida.
export function anguloBajoHorizonte(direccion) {
  if (!esPunto(direccion)) return null
  return Math.atan2(-direccion.y, Math.hypot(direccion.x, direccion.z)) * 180 / Math.PI
}

// Aplica las reglas de colocación a un punto del suelo. `pose` = {posicion, adelante}.
// Devuelve {valido, motivo} con motivo en 'distancia' | 'altura' | 'angulo' | 'invalido'.
export function validarPuntoSuelo(punto, pose, config, planoY = 0) {
  const cfg = normalizarConfig(config)
  if (!cfg.habilitado) return {valido: true, motivo: null}
  if (!esPunto(punto) || !pose || !esPunto(pose.posicion)) return {valido: false, motivo: 'invalido'}
  const distancia = Math.hypot(punto.x - pose.posicion.x, punto.z - pose.posicion.z)
  if (distancia > cfg.distanciaMaxima) return {valido: false, motivo: 'distancia'}
  if (Math.abs(punto.y - planoY) > cfg.toleranciaAltura) return {valido: false, motivo: 'altura'}
  const angulo = anguloBajoHorizonte(pose.adelante)
  if (angulo === null || angulo < cfg.anguloMinimoGrados) return {valido: false, motivo: 'angulo'}
  return {valido: true, motivo: null}
}

// Acerca `actual` hacia `objetivo` con suavizado exponencial, de modo que el resultado no
// dependa de los FPS: con el mismo tiempo transcurrido el avance es el mismo. `tauSegundos`
// es la constante de tiempo (0 = salto inmediato).
export function acercarPuntoSuave(actual, objetivo, dtSegundos, tauSegundos) {
  if (!esPunto(objetivo)) return esPunto(actual) ? {...actual} : null
  if (!esPunto(actual)) return {...objetivo}
  const tau = Number.isFinite(tauSegundos) && tauSegundos > 0 ? tauSegundos : 0
  const dt = Number.isFinite(dtSegundos) && dtSegundos > 0 ? dtSegundos : 0
  const alfa = tau > 0 ? 1 - Math.exp(-dt / tau) : 1
  return {
    x: actual.x + (objetivo.x - actual.x) * alfa,
    y: actual.y + (objetivo.y - actual.y) * alfa,
    z: actual.z + (objetivo.z - actual.z) * alfa,
  }
}
