// Validación de colocación sobre el suelo: geometría y reglas puras, sin ECS, DOM ni timers.
// Se puede probar sin cámara ni WebGL (ver tests/colocacion-suelo.test.cjs). No importa otros
// módulos a propósito, para poder cargarse como ESM embebido en las pruebas.
//
// Convención de ejes: igual que el resto del proyecto. El plano del suelo es y = 0 y la
// dirección de vista de la cámara es la del eje +Z de la entidad de cámara (ver poseCamara en
// tap-to-place.ts). "Bajo el horizonte" se mide como el ángulo descendente de un rayo respecto
// al plano horizontal: 0 = horizontal, 90 = apuntando en vertical hacia el suelo.

// Objeto declarado aparte (y no como literal dentro de Object.freeze) para que TypeScript
// infiera los campos como boolean/string/number en lugar de sus valores literales, de modo que
// comparaciones como modoColocacion === 'centro' sean válidas al importar desde TypeScript.
const BASE = {
  habilitado: true,
  modoColocacion: 'toque', // 'toque': el punto sale del píxel tocado; 'centro': lo marca la retícula.
  distanciaMaxima: 4, // m: distancia horizontal máxima de la cámara al punto.
  toleranciaAltura: 0.05, // m: desviación máxima admitida respecto a la altura del suelo.
  anguloMinimoGrados: 15, // grados: inclinación mínima del rayo por debajo del horizonte.
  reticulaSuelo: true,
  suavizadoSegundos: 0.12, // s: constante del suavizado independiente de los FPS.
  radioExteriorReticula: 0.12, // unidades de mundo del anillo.
  radioInteriorReticula: 0.09,
  alturaReticula: 0.005, // separación mínima sobre el suelo para evitar z-fighting.
  duracionConfirmacionSegundos: 0.6, // s: tiempo que se ve el anillo tras un toque (modo 'toque').
}

export const DEFAULTS = Object.freeze(BASE)

const MODOS_COLOCACION = ['toque', 'centro']

const NUMEROS = ['distanciaMaxima', 'toleranciaAltura', 'anguloMinimoGrados', 'suavizadoSegundos',
  'radioExteriorReticula', 'radioInteriorReticula', 'alturaReticula', 'duracionConfirmacionSegundos']

const esPunto = punto => !!punto && ['x', 'y', 'z'].every(k => Number.isFinite(punto[k]))

// Mezcla los valores por defecto con la configuración dada. Ignora campos ausentes,
// no numéricos o negativos; los dos interruptores solo se desactivan con un false explícito.
export function normalizarConfig(global) {
  const salida = {...DEFAULTS}
  if (!global || typeof global !== 'object') return salida
  if (Object.prototype.hasOwnProperty.call(global, 'habilitado')) salida.habilitado = global.habilitado !== false
  if (Object.prototype.hasOwnProperty.call(global, 'reticulaSuelo')) salida.reticulaSuelo = global.reticulaSuelo !== false
  // Solo se aceptan los modos conocidos; cualquier otro valor conserva el defecto ('toque').
  if (MODOS_COLOCACION.includes(global.modoColocacion)) salida.modoColocacion = global.modoColocacion
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

const esPunto2 = p => !!p && Number.isFinite(p.x) && Number.isFinite(p.y)

const versor = v => {
  if (!esPunto(v)) return null
  const n = Math.hypot(v.x, v.y, v.z)
  return n > 1e-9 ? {x: v.x / n, y: v.y / n, z: v.z / n} : null
}

// Rayo del mundo que pasa por un píxel tocado, a partir de la proyección real de la cámara.
// `pantalla` = {x, y} normalizado a [0,1] (x a la derecha, y hacia abajo, como los toques del
// ECS). `camara` = {posicion, derecha, arriba, adelante, fovGrados, aspecto}: la base ortonormal
// del mundo de la cámara de render, su campo de visión VERTICAL y el aspecto ancho/alto. Los
// vectores base se normalizan, así que un escalado de la cámara no distorsiona el resultado.
// Devuelve {origen, direccion} (dirección unitaria) o null si faltan datos. Proyección
// perspectiva estándar: el centro de la pantalla apunta en `adelante` y las esquinas hacia
// adelante ± derecha·tan(fov/2)·aspecto ± arriba·tan(fov/2).
export function rayoDesdePantalla(pantalla, camara) {
  if (!esPunto2(pantalla) || !camara) return null
  const origen = esPunto(camara.posicion) ? {...camara.posicion} : null
  const derecha = versor(camara.derecha)
  const arriba = versor(camara.arriba)
  const adelante = versor(camara.adelante)
  const fov = Number(camara.fovGrados)
  const aspecto = Number(camara.aspecto)
  if (!origen || !derecha || !arriba || !adelante) return null
  if (!Number.isFinite(fov) || fov <= 0 || fov >= 180) return null
  if (!Number.isFinite(aspecto) || aspecto <= 0) return null
  // Pantalla (y hacia abajo) -> coordenadas normalizadas de dispositivo (y hacia arriba).
  const ndcX = 2 * pantalla.x - 1
  const ndcY = 1 - 2 * pantalla.y
  const tanMedio = Math.tan((fov * Math.PI / 180) / 2)
  const sx = ndcX * tanMedio * aspecto
  const sy = ndcY * tanMedio
  const direccion = versor({
    x: adelante.x + derecha.x * sx + arriba.x * sy,
    y: adelante.y + derecha.y * sx + arriba.y * sy,
    z: adelante.z + derecha.z * sx + arriba.z * sy,
  })
  if (!direccion) return null
  return {origen, direccion}
}

// Ángulo descendente de un rayo (grados). 0 = horizontal, positivo hacia el suelo,
// negativo si apunta por encima del horizonte. Null si la dirección no es válida.
export function anguloBajoHorizonte(direccion) {
  if (!esPunto(direccion)) return null
  return Math.atan2(-direccion.y, Math.hypot(direccion.x, direccion.z)) * 180 / Math.PI
}

// Aplica las reglas de colocación a un punto del suelo. `pose` = {posicion, adelante}.
// `direccionRayo` (opcional) es la dirección real del rayo evaluado (el del píxel tocado o el
// cámara->punto); si falta se usa `pose.adelante`. Devuelve {valido, motivo} con motivo en
// 'distancia' | 'altura' | 'angulo' | 'invalido'.
export function validarPuntoSuelo(punto, pose, config, planoY = 0, direccionRayo = null) {
  const cfg = normalizarConfig(config)
  if (!cfg.habilitado) return {valido: true, motivo: null}
  if (!esPunto(punto) || !pose || !esPunto(pose.posicion)) return {valido: false, motivo: 'invalido'}
  const distancia = Math.hypot(punto.x - pose.posicion.x, punto.z - pose.posicion.z)
  if (distancia > cfg.distanciaMaxima) return {valido: false, motivo: 'distancia'}
  if (Math.abs(punto.y - planoY) > cfg.toleranciaAltura) return {valido: false, motivo: 'altura'}
  const angulo = anguloBajoHorizonte(esPunto(direccionRayo) ? direccionRayo : pose.adelante)
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
