// Sonidos cortos de interfaz. Independiente del motor y del DOM de la app.
// Usa Web Audio (latencia mínima). Si un archivo no existe, ese sonido simplemente no suena.
// El canto del ave sigue en bird-audio.js; aquí solo hay efectos de UI.

// Carpeta donde viven los efectos. Cámbiala aquí si usas otra ruta.
export const UI_SOUNDS_BASE = 'assets/audio/ui/'

// nombre del evento -> archivo (dentro de UI_SOUNDS_BASE), volumen base y separación mínima entre repeticiones (ms)
export const UI_SOUNDS = Object.freeze({
  radialOpen:   {file: 'radial-abrir.mp3',  volume: 0.8, minGap: 120},
  radialClose:  {file: 'radial-cerrar.mp3', volume: 0.6, minGap: 120},
  radialHover:  {file: 'radial-hover.mp3',  volume: 0.35, minGap: 80},
  radialSelect: {file: 'radial-elegir.mp3', volume: 0.8, minGap: 120},
  start:        {file: 'comenzar.mp3',      volume: 0.9, minGap: 300},
  place:        {file: 'colocar.mp3',       volume: 0.9, minGap: 300},
  land:         {file: 'aterrizaje.mp3',    volume: 0.9, minGap: 300},
  panelOpen:    {file: 'panel-abrir.mp3',   volume: 0.7, minGap: 120},
  panelClose:   {file: 'panel-cerrar.mp3',  volume: 0.6, minGap: 120},
  clip:         {file: 'animacion.mp3',     volume: 0.8, minGap: 150},
  relocate:     {file: 'reubicar.mp3',      volume: 0.9, minGap: 300},
  reset:        {file: 'reiniciar.mp3',     volume: 0.8, minGap: 300},
  error:        {file: 'error.mp3',         volume: 0.8, minGap: 400},
})

const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']

export function createUiSounds({base = UI_SOUNDS_BASE, sounds = UI_SOUNDS, duckedVolume = 0.35} = {}) {
  const Ctor = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null
  const buffers = new Map()
  const lastPlayed = new Map()
  let ctx = null
  let master = null
  let ducked = false
  let disposed = false
  let listening = false

  const decode = data => new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(data, resolve, reject)
    if (result && typeof result.catch === 'function') result.catch(reject)
  })

  const load = () => {
    for (const [name, def] of Object.entries(sounds)) {
      fetch(base + def.file, {cache: 'force-cache'})
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.arrayBuffer()
        })
        .then(decode)
        .then(buffer => { if (!disposed) buffers.set(name, buffer) })
        .catch(() => { /* Archivo ausente o inválido: ese sonido queda en silencio. */ })
    }
  }

  const removeUnlockListeners = () => {
    if (!listening) return
    listening = false
    for (const event of UNLOCK_EVENTS) document.removeEventListener(event, unlock, true)
  }

  // Crea o reanuda el contexto. Debe ejecutarse dentro de un gesto real del usuario.
  function unlock() {
    if (disposed || !Ctor) return
    try {
      if (!ctx) {
        ctx = new Ctor()
        master = ctx.createGain()
        master.gain.value = 1
        master.connect(ctx.destination)
        ctx.onstatechange = () => { if (ctx && ctx.state === 'running') removeUnlockListeners() }
        load()
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
      if (ctx.state === 'running') removeUnlockListeners()
    } catch (error) {
      console.warn('Sonidos de interfaz no disponibles:', error)
    }
  }

  if (Ctor && typeof document !== 'undefined') {
    listening = true
    // Captura: el HUD detiene la propagación de sus eventos, así que hay que escuchar antes.
    for (const event of UNLOCK_EVENTS) document.addEventListener(event, unlock, {capture: true, passive: true})
  }

  return {
    play(name, {volume = 1} = {}) {
      const def = sounds[name]
      if (disposed || !def || !Ctor) return false
      unlock()
      const buffer = buffers.get(name)
      if (!buffer || !ctx || ctx.state !== 'running') return false
      const now = performance.now()
      if (now - (lastPlayed.get(name) ?? -Infinity) < (def.minGap ?? 60)) return false
      lastPlayed.set(name, now)
      try {
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        gain.gain.value = (def.volume ?? 1) * volume * (ducked ? duckedVolume : 1)
        source.buffer = buffer
        source.connect(gain)
        gain.connect(master)
        source.onended = () => { source.disconnect(); gain.disconnect() }
        source.start()
        return true
      } catch (error) {
        console.warn('No se pudo reproducir el sonido', name, error)
        return false
      }
    },
    // Baja el volumen de los efectos mientras suena el canto del ave.
    setDucked(value) { ducked = !!value },
    dispose() {
      if (disposed) return
      disposed = true
      removeUnlockListeners()
      buffers.clear()
      if (ctx) { ctx.onstatechange = null; ctx.close().catch(() => {}) }
      ctx = master = null
    },
  }
}
