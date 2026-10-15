// Sonidos cortos de interfaz. Independiente del motor y del DOM de la app.
// Usa Web Audio (latencia mínima). Si un archivo falla, avisa en consola y ese sonido queda en silencio.
// El canto del ave sigue en bird-audio.js; aquí solo hay efectos de UI.

// Carpeta donde viven los efectos (src/assets/audio/ui se sirve como assets/audio/ui/).
export const UI_SOUNDS_BASE = 'assets/audio/ui/'

// nombre del evento -> archivo (dentro de UI_SOUNDS_BASE), volumen base y separación mínima entre repeticiones (ms).
// "fallback" (opcional): si ESTE archivo no existe, suena el otro evento en su lugar.
export const UI_SOUNDS = Object.freeze({
    radialOpen: { file: 'radial-abrir.mp3', volume: 0.8, minGap: 120 },
    radialClose: { file: 'radial-cerrar.mp3', volume: 0.6, minGap: 120 },
    radialHover: { file: 'radial-hover.mp3', volume: 0.35, minGap: 80 },
    radialSelect: { file: 'radial-elegir.mp3', volume: 0.8, minGap: 120 },
    start: { file: 'comenzar.mp3', volume: 0.9, minGap: 300 },
    place: { file: 'colocar.mp3', volume: 0.9, minGap: 300 },
    land: { file: 'aterrizaje.mp3', volume: 0.9, minGap: 300 },
    panelOpen: { file: 'panel-abrir.mp3', volume: 0.7, minGap: 120 },
    panelClose: { file: 'panel-cerrar.mp3', volume: 0.6, minGap: 120 },
    clip: { file: 'animacion.mp3', volume: 0.8, minGap: 150 },
    relocate: { file: 'reubicar.mp3', volume: 0.9, minGap: 300 },
    reset: { file: 'reiniciar.mp3', volume: 0.8, minGap: 300 },
    error: { file: 'error.mp3', volume: 0.8, minGap: 400 },

    // ---- Quiz ----
    quizStart: { file: 'quiz-comenzar.mp3', volume: 0.9, minGap: 300 },
    quizOption: { file: 'quiz-opcion.mp3', volume: 0.7, minGap: 100 },
    quizNext: { file: 'quiz-siguiente.mp3', volume: 0.7, minGap: 150 },
    quizLocked: { file: 'quiz-bloqueado.mp3', volume: 0.7, minGap: 300 },
    quizFinish: { file: 'quiz-final.mp3', volume: 0.9, minGap: 500 },
    quizFinishHigh: { file: 'quiz-final-alto.mp3', volume: 0.9, minGap: 500, fallback: 'quizFinish' },
    quizClose: { file: 'quiz-cerrar.mp3', volume: 0.6, minGap: 150 },
})

const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']
const TAG = '[sonidos UI]'

export function createUiSounds({ base = UI_SOUNDS_BASE, sounds = UI_SOUNDS, duckedVolume = 0.35 } = {}) {
    const Ctor = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null
    const raw = new Map()       // nombre -> Promise<ArrayBuffer | null> (descarga, no requiere gesto)
    const buffers = new Map()   // nombre -> AudioBuffer decodificado
    const failed = new Map()    // nombre -> motivo
    const warned = new Set()
    const lastPlayed = new Map()
    let ctx = null
    let master = null
    let ducked = false
    let disposed = false
    let listening = false

    const fail = (name, reason) => {
        failed.set(name, reason)
        console.warn(`${TAG} "${name}" (${base}${sounds[name].file}): ${reason}`)
    }

    const decode = data => new Promise((resolve, reject) => {
        const result = ctx.decodeAudioData(data, resolve, reject)
        if (result && typeof result.catch === 'function') result.catch(reject)
    })

    // La descarga empieza al crear la UI; la decodificación espera al primer gesto.
    const download = () => {
        for (const [name, def] of Object.entries(sounds)) {
            const url = base + def.file
            raw.set(name, fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status} (¿nombre o carpeta incorrectos?)`)
                    const type = response.headers.get('content-type') || ''
                    if (type.includes('text/html')) throw new Error('el servidor devolvió una página HTML, no un audio (ruta incorrecta)')
                    return response.arrayBuffer()
                })
                .then(data => {
                    if (data.byteLength < 100) throw new Error('archivo vacío o puntero de Git LFS')
                    return data
                })
                .catch(error => { fail(name, error.message || String(error)); return null }))
        }
    }

    const decodeAll = () => {
        for (const name of Object.keys(sounds)) {
            raw.get(name)?.then(data => {
                if (!data || disposed || !ctx) return
                return decode(data).then(buffer => { if (!disposed) buffers.set(name, buffer) })
            }).catch(error => fail(name, `no se pudo decodificar el audio (${error?.message || error || 'formato no soportado'})`))
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
                decodeAll()
            }
            if (ctx.state === 'suspended') ctx.resume().catch(() => { })
            if (ctx.state === 'running') removeUnlockListeners()
        } catch (error) {
            console.warn(`${TAG} no disponibles:`, error)
        }
    }

    if (!Ctor) console.warn(`${TAG} este navegador no soporta Web Audio`)
    if (Ctor && typeof document !== 'undefined') {
        download()
        listening = true
        // Captura: el HUD detiene la propagación de sus eventos, así que hay que escuchar antes.
        for (const event of UNLOCK_EVENTS) document.addEventListener(event, unlock, { capture: true, passive: true })
    }

    // Diagnóstico: en la consola del navegador escribe  __UI_SOUNDS__()
    if (typeof window !== 'undefined') {
        window.__UI_SOUNDS__ = () => ({
            contexto: ctx ? ctx.state : 'sin crear (aún no hubo un toque)',
            cargados: [...buffers.keys()],
            fallidos: Object.fromEntries(failed),
            carpeta: base,
        })
    }

    const play = (name, { volume = 1 } = {}) => {
        const def = sounds[name]
        if (disposed || !def || !Ctor) return false
        unlock()
        const buffer = buffers.get(name)
        // Si este archivo no existe y hay un sonido de respaldo, suena ese.
        if (!buffer && failed.has(name) && def.fallback && def.fallback !== name) {
            return play(def.fallback, { volume })
        }
        if (!buffer || !ctx || ctx.state !== 'running') {
            if (!buffer && ctx && ctx.state === 'running' && !failed.has(name) && !warned.has(name)) {
                warned.add(name) // Probablemente aún se está decodificando; solo se avisa una vez.
                console.info(`${TAG} "${name}" todavía no está listo`)
            }
            return false
        }
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
            console.warn(`${TAG} no se pudo reproducir "${name}":`, error)
            return false
        }
    }

    return {
        play,
        // Baja el volumen de los efectos mientras suena un canto.
        setDucked(value) { ducked = !!value },
        dispose() {
            if (disposed) return
            disposed = true
            removeUnlockListeners()
            buffers.clear()
            raw.clear()
            if (window.__UI_SOUNDS__) delete window.__UI_SOUNDS__
            if (ctx) { ctx.onstatechange = null; ctx.close().catch(() => { }) }
            ctx = master = null
        },
    }
}