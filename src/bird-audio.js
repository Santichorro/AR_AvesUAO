// Canto de exploración no espacial. Una instancia, activada desde el click real.
// La fábrica inyectable permite comprobar carreras y limpieza sin motor/audio.
export function createBirdAudio({url, onPlaying = (_playing) => {}, onError = (_reason) => {}}, makeAudio = () => new Audio()) {
  let audio = null
  let requested = false
  let playing = false
  let disposed = false
  let generation = 0
  const listeners = new Map()
  const showPlaying = value => {
    if (playing === value) return
    playing = value
    onPlaying(value)
  }
  const stop = () => {
    ++generation
    requested = false
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    showPlaying(false)
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
      if (requested && !disposed && !audio.paused && !audio.ended) showPlaying(true)
    })
    listeners.set('waiting', () => showPlaying(false))
    listeners.set('pause', () => { if (audio.paused) stop() })
    listeners.set('ended', () => { if (audio.ended) stop() })
    listeners.set('error', () => fail('failed'))
    for (const [event, listener] of listeners) audio.addEventListener(event, listener)
    audio.src = url
  }
  return {
    play() {
      if (disposed) return
      if (!url) { onError('missing'); return }
      stop()
      const request = generation
      requested = true
      try {
        prepare()
        // Sin await ni demora de animación: conserva la activación del usuario.
        Promise.resolve(audio.play()).catch(error => {
          if (generation === request) fail(error?.name === 'NotAllowedError' ? 'blocked' : 'failed')
        })
      } catch (error) {
        fail(error?.name === 'NotAllowedError' ? 'blocked' : 'failed')
      }
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
