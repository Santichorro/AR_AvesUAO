import labels from './data/interfaz.json'

type Controls = {start: () => void; reset: () => void; relocate: () => void;
  cancel: () => void; clip: (name: string) => void; pause: () => void; idle: () => void}

// El contenido académico y las etiquetas proceden de JSON; el DOM no recibe HTML del PDF.
export function createPilotUi(catalog: any[], bird: any, controls: Controls, desktop: boolean) {
  document.getElementById('aves-pilot')?.remove()
  const root = document.createElement('main')
  root.id = 'aves-pilot'
  root.innerHTML = `<header class="aves-header"><span class="aves-brand">✦</span><div><h1></h1><p></p></div></header>
    <section class="aves-status" aria-live="polite"><p></p><button data-action="start"></button></section>
    <div class="aves-scan" aria-hidden="true"><span></span></div>
    <aside class="aves-toolbar"><label for="aves-species"></label><select id="aves-species"></select>
      <div class="aves-actions"><button data-action="info"></button><button data-action="animation"></button>
      <button data-action="relocate"></button><button data-action="cancel"></button><button data-action="reset"></button></div>
      <p class="aves-preview"></p></aside>
    <section class="aves-panel" id="aves-info" hidden aria-labelledby="aves-info-title"><button data-close="info"></button>
      <h2 id="aves-info-title"></h2><p class="aves-note"></p><p class="aves-source"></p>
      <label for="aves-reference"></label><select id="aves-reference"></select><div class="aves-facts"></div>
      <p class="aves-audio"></p><p class="aves-photo"></p></section>
    <section class="aves-panel" id="aves-animation" hidden aria-labelledby="aves-animation-title"><button data-close="animation"></button>
      <h2 id="aves-animation-title"></h2><p></p><div class="aves-clips"></div>
      <div class="aves-actions"><button data-action="idle"></button><button data-action="pause"></button></div></section>`
  document.body.append(root)
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!
  get('h1').textContent = labels.titulo
  get('header p').textContent = labels.subtitulo
  get('label[for="aves-species"]').textContent = labels.catalogo
  const select = get<HTMLSelectElement>('#aves-species')
  for (const b of catalog) {
    const option = new Option(b.nombre + (b.disponible ? '' : ` · ${labels.pendiente}`), b.id)
    option.disabled = !b.disponible
    option.selected = b.id === bird.id
    select.add(option)
  }
  get('.aves-preview').textContent = desktop ? labels.preview : ''
  get('#aves-info-title').textContent = labels.ficha
  get('.aves-note').textContent = labels.ilustrativo
  get('.aves-source').textContent = `${labels.guia} · páginas ${bird.fuente.paginas.join(', ')}`
  get('label[for="aves-reference"]').textContent = labels.fichasGuia
  const references = get<HTMLSelectElement>('#aves-reference')
  references.add(new Option(labels.elegirFicha, ''))
  for (const species of bird.fichas) references.add(new Option(species.nombre, species.id))
  const facts = get('.aves-facts')
  const renderFacts = () => {
    facts.replaceChildren()
    const selected = bird.fichas.find((s: any) => s.id === references.value)
    const description = document.createElement('p')
    description.textContent = selected ? `${selected.nombreCientifico} · ${labels.referencia}` : labels.modeloGenerico
    facts.append(description)
    if (selected) {
      const text = document.createElement('p'); text.textContent = selected.descripcion; facts.append(text)
      const dl = document.createElement('dl')
      for (const [key, label] of [['habitat', labels.habitat], ['alimentacion', labels.alimentacion], ['rasgos', labels.rasgos]]) {
        if (!selected[key]) continue
        const dt = document.createElement('dt'); dt.textContent = label
        const dd = document.createElement('dd'); dd.textContent = selected[key]; dl.append(dt, dd)
      }
      facts.append(dl)
      const source = document.createElement('small'); source.textContent = `${labels.guia} · página ${selected.pagina}`; facts.append(source)
    } else {
      const list = document.createElement('ul')
      for (const species of bird.candidatas) {
        const item = document.createElement('li'); item.textContent = `${species.nombre} (${species.nombreCientifico})`; list.append(item)
      }
      facts.append(list)
    }
  }
  references.addEventListener('change', renderFacts); renderFacts()
  get('.aves-audio').textContent = labels.sinAudio
  get('.aves-photo').textContent = labels.sinFoto
  get('#aves-animation-title').textContent = labels.animaciones
  get('#aves-animation > p').textContent = labels.animacionesNota
  for (const clip of bird.clips) {
    const button = document.createElement('button'); button.type = 'button'
    button.textContent = clip.etiqueta
    button.dataset.clip = clip.nombre
    button.title = `${clip.nombre} · ${clip.duracionSegundos}s`
    button.addEventListener('click', () => controls.clip(clip.nombre))
    get('.aves-clips').append(button)
  }
  const buttonLabels: Record<string, string> = {start: labels.comenzar, info: labels.ficha,
    animation: labels.animaciones, relocate: labels.reubicar, cancel: labels.cancelar,
    reset: labels.reiniciar, idle: labels.reposo, pause: labels.pausa}
  root.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
    b.type = 'button'
    if (b.dataset.action) b.textContent = buttonLabels[b.dataset.action]
    if (b.dataset.close) b.textContent = labels.cerrar
  })
  const closePanels = () => root.querySelectorAll<HTMLElement>('.aves-panel').forEach(p => p.hidden = true)
  const openInfo = () => { closePanels(); get('#aves-info').hidden = false }
  root.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('button')
    if (!button || button.disabled) return
    if (button.dataset.close) { closePanels(); return }
    switch (button.dataset.action) {
      case 'start': controls.start(); break
      case 'info': openInfo(); break
      case 'animation': closePanels(); get('#aves-animation').hidden = false; break
      case 'relocate': closePanels(); controls.relocate(); break
      case 'cancel': controls.cancel(); break
      case 'reset': closePanels(); controls.reset(); break
      case 'idle': controls.idle(); break
      case 'pause': controls.pause(); break
    }
  })
  // Captura eventos del HUD antes que el canvas. Incluye selects y gestos en paneles.
  const stop = (e: Event) => e.stopPropagation()
  const pointer = (e: Event) => {
    if ((e.target as Element).closest('button,select,label,.aves-panel')) stop(e)
  }
  for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
    root.addEventListener(event, pointer)
  }
  return {
    root, openInfo, closePanels,
    showMessage(message: string) { get('.aves-status p').textContent = message },
    update(snapshot: any) {
      const phase = snapshot.phase
      root.dataset.phase = phase
      const placed = phase === 'EXPLORAR'
      const start = get<HTMLButtonElement>('[data-action="start"]')
      start.hidden = !['INTRO', 'ERROR'].includes(phase)
      start.textContent = phase === 'ERROR' ? labels.reintentar : labels.comenzar
      const messages: Record<string, string> = {INTRO: labels.intro, PREPARANDO: labels.preparando,
        ESCANEO: labels.escaneo, COLOCANDO: labels.colocando, EXPLORAR: labels.explorar,
        REUBICAR: labels.reubicando, ERROR: snapshot.message || labels.errorRecurso}
      get('.aves-status p').textContent = !snapshot.trackingReady && ['ESCANEO', 'REUBICAR', 'EXPLORAR'].includes(phase) ? labels.seguimiento : messages[phase]
      get('.aves-scan').hidden = !['ESCANEO', 'REUBICAR'].includes(phase)
      for (const action of ['info', 'animation', 'relocate', 'idle', 'pause']) get<HTMLButtonElement>(`[data-action="${action}"]`).disabled = !placed
      get('[data-action="cancel"]').hidden = phase !== 'REUBICAR'
      get<HTMLButtonElement>('[data-action="reset"]').disabled = !snapshot.position && phase !== 'ERROR'
      if (!placed) closePanels()
    },
    dispose() { root.remove() },
  }
}
