// Canto de exploración no espacial. Una instancia, activada desde el click real.
// La fábrica inyectable permite comprobar carreras y limpieza sin motor/audio.
export function createBirdAudio({url, onPlaying = (_playing) => {}, onState = (_state) => {}, onError = (_reason) => {}}, makeAudio = () => new Audio()) {
  let audio = null
  let requested = false
  let playing = false
  let disposed = false
  let generation = 0
  let state = 'idle'
  let heard = false
  const listeners = new Map()
  const setState = next => {
    if (state === next) return
    state = next
    const value = next === 'playing'
    if (playing !== value) { playing = value; onPlaying(value) }
    onState(next)
  }
  const stop = () => {
    ++generation
    requested = false
    heard = false
    setState('idle')
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }
  const fail = reason => {
    if (!requested || disposed) return
    stop()
    onError(reason)
  }
  const prepare = () => {
    if (audio) return
    audio = makeAudio()
    audio.preload = 'metadata'
    audio.loop = false
    listeners.set('playing', () => {
      if (requested && !disposed && !audio.paused && !audio.ended) { heard = true; setState('playing') }
    })
    listeners.set('waiting', () => { if (requested && heard && state !== 'paused') setState('waiting') })
    listeners.set('pause', () => {
      if (requested && audio.paused && !audio.ended) { ++generation; setState('paused') }
    })
    listeners.set('ended', () => { if (audio.ended) stop() })
    listeners.set('error', () => fail('failed'))
    for (const [event, listener] of listeners) audio.addEventListener(event, listener)
    audio.src = url
  }
  const startPlayback = () => {
    const request = ++generation
    requested = true
    setState('loading')
    try {
      prepare()
      // Sin await ni demora de animación: conserva la activación del usuario.
      Promise.resolve(audio.play()).catch(error => {
        if (generation === request) fail(error?.name === 'NotAllowedError' ? 'blocked' : 'failed')
      })
    } catch (error) {
      fail(error?.name === 'NotAllowedError' ? 'blocked' : 'failed')
    }
  }
  return {
    play() {
      if (disposed) return
      if (!url) { onError('missing'); return }
      stop()
      startPlayback()
    },
    pause() {
      if (disposed || !requested || !audio || audio.ended || state === 'paused') return
      ++generation // La promesa de play interrumpida por pausa no es un fallo.
      setState('paused')
      audio.pause()
    },
    resume() {
      if (!disposed && requested && state === 'paused') startPlayback()
    },
    stop,
    dispose() {
      if (disposed) return
      stop()
      disposed = true
      if (!audio) return
      for (const [event, listener] of listeners) audio.removeEventListener(event, listener)
      listeners.clear()
      audio.removeAttribute('src')
      audio.load()
      audio = null
    },
  }
}
