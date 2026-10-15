// Seguimiento del ave: máquina de estados y geometría puras, sin ECS, DOM ni timers.
// Se puede probar sin cámara ni WebGL (ver tests/bird-follow.test.cjs). No importa otros
// módulos a propósito, para poder cargarse como ESM embebido en las pruebas.
//
// Responsabilidades de la raíz frente al nodo del modelo:
// - La RAÍZ (raíz de la entidad) la mueven este módulo y ArrivalMotion: posición XZ,
//   altura de crucero y giro (yaw). Sus coordenadas están en metros de mundo porque el
//   nodo raíz no tiene escala.
// - El NODO DEL MODELO conserva la elevación por categoría de clip que ya administra
//   tap-to-place.ts; aquí no se duplica esa altura.
//
// Convención de giro: igual que ArrivalMotion. La raíz debe recibir
// `atan2(dir.x, dir.z) - (anguloFrente + giroYModelo)` para que el frente del modelo
// mire en la dirección horizontal `dir`.

export const ESTADOS = Object.freeze({
  REPOSO: 'REPOSO',
  DESPEGUE: 'DESPEGUE',
  VUELO: 'VUELO',
  ATERRIZAJE: 'ATERRIZAJE',
})

// Valores por defecto para teléfono. Los exigidos por el enunciado están primero.
export const DEFAULTS = Object.freeze({
  habilitado: true,
  distanciaActivacion: 5,
  distanciaAcercamiento: 1.5,
  distanciaInicioAterrizaje: 2,
  velocidadVuelo: 2,
  alturaCrucero: 0.5,
  pausaSegundos: 1.5,
  bajadaSinAterrizajeSegundos: 0.5,
  // Suavizado no exigido; valores razonables para móvil.
  velocidadGiro: Math.PI,
  transicionAlturaSegundos: 0.5,
  // Longitud mínima de la proyección horizontal del frente para considerarla utilizable.
  // Por debajo (~82° de inclinación) se conserva la última dirección válida o la cámara-ave.
  umbralMiradaVertical: 0.15,
})

const NUMERO = ['distanciaActivacion', 'distanciaAcercamiento', 'distanciaInicioAterrizaje',
  'velocidadVuelo', 'alturaCrucero', 'pausaSegundos', 'bajadaSinAterrizajeSegundos',
  'velocidadGiro', 'transicionAlturaSegundos', 'umbralMiradaVertical']
// En estas dos el valor 0 tiene sentido (sin pausa / descenso instantáneo) y el código lo admite.
const ADMITE_CERO = new Set(['pausaSegundos', 'bajadaSinAterrizajeSegundos'])

const finito = (valor, respaldo) => (Number.isFinite(valor) ? valor : respaldo)

const copiar = punto => ({x: punto.x, y: punto.y, z: punto.z})

const esPunto = punto => !!punto && ['x', 'y', 'z'].every(k => Number.isFinite(punto[k]))

// Mezcla los valores por defecto con la configuración global y, si existe, con la
// anulación por ave. Ignora campos ausentes, no numéricos o no positivos.
export function normalizarConfig(global, anulacion) {
  const salida = {...DEFAULTS}
  for (const fuente of [global, anulacion]) {
    if (!fuente || typeof fuente !== 'object') continue
    if (Object.prototype.hasOwnProperty.call(fuente, 'habilitado')) {
      salida.habilitado = fuente.habilitado !== false
    }
    for (const clave of NUMERO) {
      if (!Object.prototype.hasOwnProperty.call(fuente, clave)) continue
      const valor = fuente[clave]
      const valido = Number.isFinite(valor) && (ADMITE_CERO.has(clave) ? valor >= 0 : valor > 0)
      if (valido) salida[clave] = valor
    }
  }
  return salida
}

// Distancia horizontal (XZ) entre dos puntos; es la distancia real en metros de mundo.
export const distanciaHorizontal = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

// Dirección horizontal normalizada de `desde` hacia `hacia`, o null si coinciden en XZ.
export const direccionHorizontal = (desde, hacia) => {
  const dx = hacia.x - desde.x
  const dz = hacia.z - desde.z
  const longitud = Math.hypot(dx, dz)
  if (!(longitud > 1e-9)) return null
  return {x: dx / longitud, z: dz / longitud}
}

// Proyección horizontal del frente de cámara. Si es casi vertical (longitud por debajo
// del umbral) devuelve la última dirección válida, o null.
export function direccionMirada(adelante, umbral, ultima) {
  if (adelante && Number.isFinite(adelante.x) && Number.isFinite(adelante.z)) {
    const longitud = Math.hypot(adelante.x, adelante.z)
    if (longitud >= umbral) return {x: adelante.x / longitud, z: adelante.z / longitud}
  }
  return ultima ? {x: ultima.x, z: ultima.z} : null
}

// Punto de suelo a `distancia` metros en la dirección horizontal `direccion`.
export const puntoDestinoFrente = (camara, direccion, distancia, sueloY) => ({
  x: camara.x + direccion.x * distancia,
  y: sueloY,
  z: camara.z + direccion.z * distancia,
})

// Yaw de la raíz para que el frente del modelo mire en `direccion` (ver nota de arriba).
export const yawHacia = (direccion, anguloFrente, giroModelo) =>
  Math.atan2(direccion.x, direccion.z) - (anguloFrente + giroModelo)

// Interpolación angular con paso máximo, envolviendo la diferencia a [-π, π].
export function acercarAngulo(actual, objetivo, pasoMaximo) {
  const diferenciaCruda = objetivo - actual
  const diferencia = Math.atan2(Math.sin(diferenciaCruda), Math.cos(diferenciaCruda))
  if (!Number.isFinite(pasoMaximo) || pasoMaximo <= 0) return actual + diferencia
  return actual + Math.max(-pasoMaximo, Math.min(pasoMaximo, diferencia))
}

const suavizar = t => t * t * (3 - 2 * t)

export class SeguimientoAve {
  constructor(config, ave = {}) {
    this.config = normalizarConfig(config)
    this.anguloFrente = finito(ave.anguloFrente, Math.PI / 2)
    this.giroModelo = finito(ave.giroY, 0)
    this.tieneDespegue = !!ave.tieneDespegue
    this.tieneAterrizaje = !!ave.tieneAterrizaje
    this.duracionDespegue = finito(ave.duracionDespegue, 0)
    this.reiniciar({x: 0, y: 0, z: 0}, 0, 0)
  }

  get habilitado() { return this.config.habilitado }
  get controlaRaiz() {
    if (this.estado === ESTADOS.REPOSO) return false
    if (this.estado === ESTADOS.ATERRIZAJE) return this.aterrizaje?.modo === 'simple'
    return true
  }
  get modoAterrizaje() { return this.aterrizaje?.modo ?? null }

  // Coloca el ave en reposo sobre `posicion` (pie en `sueloY`), conservando el yaw actual
  // para no girar de golpe al terminar la llegada o al reubicar.
  reiniciar(posicion, sueloY, yaw = 0) {
    const punto = esPunto(posicion) ? posicion : {x: 0, y: 0, z: 0}
    this.posicion = copiar(punto)
    this.sueloY = finito(sueloY, punto.y)
    this.yaw = finito(yaw, 0)
    this.estado = ESTADOS.REPOSO
    this.estadoAnterior = ESTADOS.REPOSO
    this.despegueTranscurrido = 0
    this.tiempoDesdeAterrizaje = 0
    this.destino = null
    this.aterrizaje = null
    this.ultimaDireccion = null
  }

  // Aborta el ciclo (reposición, reinicio o clip manual) sin tocar la raíz.
  cancelar() {
    this.estado = ESTADOS.REPOSO
    this.estadoAnterior = ESTADOS.REPOSO
    this.despegueTranscurrido = 0
    this.tiempoDesdeAterrizaje = 0
    this.destino = null
    this.aterrizaje = null
  }

  // Cierra el aterrizaje basado en clip cuando ArrivalMotion termina su mezcla.
  confirmarAterrizaje(posicion, yaw) {
    this.posicion = esPunto(posicion) ? copiar(posicion)
      : (this.aterrizaje ? copiar(this.aterrizaje.destino) : this.posicion)
    if (Number.isFinite(yaw)) this.yaw = yaw
    this.estado = ESTADOS.REPOSO
    this.estadoAnterior = ESTADOS.ATERRIZAJE
    this.aterrizaje = null
    this.destino = null
    this.despegueTranscurrido = 0
    this.tiempoDesdeAterrizaje = 0
  }

  // Fija el punto de aterrizaje. En la llegada normal es el destino capturado delante de la
  // cámara (para desacelerar hacia él); en una pausa es la posición actual ("aterriza donde está").
  iniciarAterrizaje(destino) {
    const meta = destino
      ? {x: destino.x, y: this.sueloY, z: destino.z}
      : {x: this.posicion.x, y: this.sueloY, z: this.posicion.z}
    const origen = copiar(this.posicion)
    this.aterrizaje = this.tieneAterrizaje
      ? {modo: 'clip', destino: meta, origen}
      : {modo: 'simple', destino: meta, origen}
    this.bajadaTranscurrido = 0
    this.estadoAnterior = this.estado
    this.estado = ESTADOS.ATERRIZAJE
  }

  destinoFrente(camara, mirada) {
    let direccion = mirada
    if (!direccion) direccion = direccionHorizontal(camara, this.posicion)
    if (!direccion) return null
    return puntoDestinoFrente(camara, direccion, this.config.distanciaAcercamiento, this.sueloY)
  }

  // Avanza un fotograma. `entrada` = {camara, adelante, pausado}. Devuelve el estado y, si
  // corresponde, la pose de la raíz que el ECS debe escribir.
  actualizar(dt, entrada = {}) {
    const cfg = this.config
    const paso = Number.isFinite(dt) && dt > 0 ? dt : 0
    const camara = entrada.camara
    const pausado = entrada.pausado === true
    const resultado = {estado: this.estado, estadoAnterior: this.estadoAnterior, posicion: null,
      yaw: null, modoAterrizaje: null, aterrizaje: null}
    if (!cfg.habilitado || !esPunto(camara)) return resultado

    this.tiempoDesdeAterrizaje += paso

    const mirada = direccionMirada(entrada.adelante, cfg.umbralMiradaVertical, this.ultimaDireccion)
    if (mirada) this.ultimaDireccion = mirada

    if (this.estado === ESTADOS.REPOSO) {
      const distancia = distanciaHorizontal(camara, this.posicion)
      if (!pausado && this.tiempoDesdeAterrizaje >= cfg.pausaSegundos && distancia > cfg.distanciaActivacion) {
        if (this.tieneDespegue && this.duracionDespegue > 0) {
          this.estadoAnterior = this.estado
          this.estado = ESTADOS.DESPEGUE
          this.despegueTranscurrido = 0
        } else {
          this.estadoAnterior = this.estado
          this.estado = ESTADOS.VUELO
        }
      }
    } else if (this.estado === ESTADOS.DESPEGUE) {
      this.despegueTranscurrido += paso
      const destino = this.destinoFrente(camara, mirada)
      if (destino) {
        this.destino = destino
        const direccion = direccionHorizontal(this.posicion, destino)
        if (direccion) {
          const objetivo = yawHacia(direccion, this.anguloFrente, this.giroModelo)
          this.yaw = acercarAngulo(this.yaw, objetivo, cfg.velocidadGiro * paso)
        }
      }
      if (pausado) this.iniciarAterrizaje(null)
      else if (!this.tieneDespegue || this.despegueTranscurrido >= this.duracionDespegue) {
        this.estadoAnterior = this.estado
        this.estado = ESTADOS.VUELO
      }
    } else if (this.estado === ESTADOS.VUELO) {
      if (pausado) {
        this.iniciarAterrizaje(null)
      } else {
        const destino = this.destinoFrente(camara, mirada)
        this.destino = destino
        if (destino) {
          const direccion = direccionHorizontal(this.posicion, destino)
          const distancia = distanciaHorizontal(this.posicion, destino)
          if (distancia <= cfg.distanciaInicioAterrizaje) {
            this.iniciarAterrizaje(destino)
          } else {
            const avance = Math.min(cfg.velocidadVuelo * paso, distancia)
            if (direccion) {
              this.posicion.x += direccion.x * avance
              this.posicion.z += direccion.z * avance
              const objetivo = yawHacia(direccion, this.anguloFrente, this.giroModelo)
              this.yaw = acercarAngulo(this.yaw, objetivo, cfg.velocidadGiro * paso)
            }
            const objetivoY = this.sueloY + cfg.alturaCrucero
            const alfa = cfg.transicionAlturaSegundos > 0 ? 1 - Math.exp(-paso / cfg.transicionAlturaSegundos) : 1
            this.posicion.y += (objetivoY - this.posicion.y) * alfa
          }
        }
      }
    } else if (this.estado === ESTADOS.ATERRIZAJE && this.aterrizaje?.modo === 'simple') {
      const segundos = cfg.bajadaSinAterrizajeSegundos
      this.bajadaTranscurrido += paso
      const t = segundos > 0 ? Math.min(1, this.bajadaTranscurrido / segundos) : 1
      const factor = suavizar(t)
      const meta = this.aterrizaje.destino
      const inicio = this.aterrizaje.origen
      this.posicion.x = inicio.x + (meta.x - inicio.x) * factor
      this.posicion.y = inicio.y + (meta.y - inicio.y) * factor
      this.posicion.z = inicio.z + (meta.z - inicio.z) * factor
      if (t >= 1) this.confirmarAterrizaje(meta, this.yaw)
    }

    if (this.controlaRaiz) {
      resultado.posicion = copiar(this.posicion)
      resultado.yaw = this.yaw
    }
    resultado.estado = this.estado
    resultado.estadoAnterior = this.estadoAnterior
    resultado.modoAterrizaje = this.modoAterrizaje
    resultado.aterrizaje = this.aterrizaje
    return resultado
  }

  snapshot() {
    return {estado: this.estado, estadoAnterior: this.estadoAnterior, posicion: copiar(this.posicion),
      sueloY: this.sueloY, yaw: this.yaw, destino: this.destino && copiar(this.destino),
      modoAterrizaje: this.modoAterrizaje,
      aterrizaje: this.aterrizaje && {modo: this.aterrizaje.modo, origen: copiar(this.aterrizaje.origen),
        destino: copiar(this.aterrizaje.destino)},
      tiempoDesdeAterrizaje: this.tiempoDesdeAterrizaje, despegueTranscurrido: this.despegueTranscurrido}
  }
}
