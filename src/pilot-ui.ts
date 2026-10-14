import labels from './data/interfaz.json'
import { RADIAL_CONFIG, RADIAL_ACTIONS, radialLayout } from './radial-gesture'
import { createBirdAudio } from './bird-audio'
import { createUiSounds } from './ui-sounds'

type Controls = {
    species: (id: string) => void; start: () => void; reset: () => void; relocate: () => void;
    cancel: () => void; clip: (name: string) => void; pause: () => void; idle: () => void; dismiss: () => void; radial: (action: string) => void
}

const icons: Record<string, string> = {
    species: '<g fill="currentColor" stroke="none"><path d="M9.4 5.4C10.3 3.7 11.1 3 12 3s1.7.7 2.6 2.4C13.5 6.5 12.6 7.6 12 8.8c-.6-1.2-1.5-2.3-2.6-3.4Z"/><path d="M5.3 11.2C4.7 8.5 5.4 5.2 7.5 5.6c1.7.3 4 3.2 3.7 6.1-2.3 0-4.3-.2-5.9-.5Zm13.4 0c.6-2.7-.1-6-2.2-5.6-1.7.3-4 3.2-3.7 6.1 2.3 0 4.3-.2 5.9-.5Z"/><path d="M4.2 7.8C1.9 8.8 1 9.8 1 10.7c0 1.5 2 2.9 5.9 3.7.6.1.8.6.6 1-.1.5-.6.6-1.1.5-1.9-.4-3.4-.9-4.4-1.3-.8-.4-1.1.4-.5 1.2 1.8 2.2 6.7 2.6 11.4 1.2.5-.2.9 0 1 .4.2.5-.1.8-.6 1-3.1 1-6.7 1.3-9.5.6C5.6 21 8.7 22 12 22s6.4-1 8.2-3c-.6.2-1.4.4-2.2.5-.6.1-1-.3-1-.7 0-.4.3-.7.8-.8 3.3-.5 5.2-2.1 5.2-3.3 0-.3-.3-.5-.7-.4-1.3.7-3.1 1.3-4.6 1.6-.5.1-1-.1-1.1-.6-.1-.5.2-.8.7-.9 3.8-.8 5.7-2.2 5.7-3.7 0-.9-.9-1.9-3.2-2.9l.2 1.8c1 .4 1.5.9 1.5 1.2 0 1-4.3 2-9.5 2s-9.5-1-9.5-2c0-.3.5-.8 1.5-1.2Z"/></g>',
    info: '<path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4Z"/><path d="M12 7v14M7 9h2m-2 4h2m6-4h2m-2 4h2"/>',
    animation: '<path d="M8 5v14l11-7Z"/><path d="M4 5v14"/>',
    song: '<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4Z"/><path class="aves-sound-wave" d="M16 8a6 6 0 0 1 0 8"/><path class="aves-sound-wave" d="M19 5a10 10 0 0 1 0 14"/>',
    audioPause: '<path fill="currentColor" stroke="none" d="M6 5h4v14H6Zm8 0h4v14h-4Z"/>',
    audioPlay: '<path fill="currentColor" stroke="none" d="M8 5v14l11-7Z"/>',
    relocate: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
}
const icon = (name: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`
const radialText: Record<string, string> = { info: labels.radialFicha, animation: labels.radialAnimaciones, song: labels.radialCanto, relocate: labels.radialReubicar, reset: labels.radialReiniciar }
function radialMarkup() {
    const inner = 144 * RADIAL_CONFIG.deadRadius / RADIAL_CONFIG.radius
    const polar = (r: number, deg: number) => { const a = deg * Math.PI / 180; return { x: 160 + r * Math.cos(a), y: 160 + r * Math.sin(a) } }
    return RADIAL_ACTIONS.map((action: string, index: number) => {
        const sectorAngle = 360 / RADIAL_ACTIONS.length
        const angle = -90 + index * sectorAngle
        const half = sectorAngle / 2 - 2
        const a = polar(144, angle - half), b = polar(144, angle + half), c = polar(inner, angle + half), d = polar(inner, angle - half)
        const point = polar(94, angle)
        return `<g class="aves-radial-sector" data-radial="${action}" role="button" tabindex="-1">
      <path d="M${a.x} ${a.y} A144 144 0 0 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z"/>
      <g transform="translate(${point.x},${point.y})"><svg x="-14" y="-24" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[action]}</svg><text y="22" text-anchor="middle"></text></g>
    </g>`
    }).join('')
}

// El contenido académico y las etiquetas proceden de JSON; el DOM no recibe HTML del PDF.
export function createPilotUi(catalog: any[], bird: any, controls: Controls, desktop: boolean) {
    document.getElementById('aves-pilot')?.remove()
    const root = document.createElement('main')
    root.id = 'aves-pilot'
    root.style.setProperty('--radial-highlight-scale', String(RADIAL_CONFIG.visualScale))
    root.innerHTML = `<header class="aves-header"><img class="aves-brand" src="assets/logo-colibri.png" alt="Colibrí de Aves UAO"><div><h1></h1><p></p></div></header>
    <section class="aves-status" data-aves-ui aria-live="polite"><button class="aves-status-dismiss" data-dismiss="status" hidden>${icon('close')}</button><p></p><button class="aves-start-button" data-action="start"></button></section>
    <div class="aves-scan" aria-hidden="true"><span></span></div>
    <button class="aves-species-trigger" data-aves-ui data-species-toggle aria-haspopup="dialog" aria-expanded="false" aria-controls="aves-species-popover">${icon('species')}</button>
    <aside class="aves-species-popover" id="aves-species-popover" data-aves-ui role="dialog" aria-labelledby="aves-species-title" aria-hidden="true" hidden>
      <button data-close="species">${icon('close')}</button><h2 id="aves-species-title"></h2><div id="aves-species"></div></aside>
    <div class="aves-context-controls"><button data-action="cancel" hidden></button><button data-action="reset" hidden></button></div>
    <p class="aves-preview"></p>
    <section class="aves-listening" data-aves-ui role="group" aria-hidden="true">${icon('song')}<span role="status" aria-live="polite" aria-atomic="true"></span><button data-audio="toggle" disabled>${icon('audioPause')}</button><button data-audio="close" disabled>${icon('close')}</button></section>
    <div class="aves-radial" data-aves-ui aria-hidden="true"><svg viewBox="0 0 320 320">${radialMarkup()}<circle class="aves-radial-center" cx="160" cy="160" r="${144 * RADIAL_CONFIG.deadRadius / RADIAL_CONFIG.radius - 9}"/><text class="aves-radial-hint" x="160" y="159" text-anchor="middle"></text><text class="aves-radial-subhint" x="160" y="174" text-anchor="middle"></text></svg></div>
    <section class="aves-panel" id="aves-info" hidden aria-labelledby="aves-info-title">
      <div class="aves-info-heading"><div><h2 id="aves-info-title"></h2><p class="aves-scientific"><em></em></p><p class="aves-family"></p></div><button data-close="info">${icon('close')}</button></div>
      <figure class="aves-bird-photo"><img width="480" height="639" decoding="async"></figure>
      <div class="aves-facts"></div><p class="aves-source"></p>
      <div class="aves-actions aves-guide-actions"><button data-action="animation"></button><button data-action="relocate"></button><button data-action="reset"></button></div>
    </section>
    <section class="aves-panel" id="aves-animation" hidden aria-labelledby="aves-animation-title"><button data-close="animation"></button>
      <h2 id="aves-animation-title"></h2><p></p><div class="aves-clips"></div>
      <div class="aves-actions"><button data-action="idle"></button><button data-action="pause"></button></div></section>`
    document.body.append(root)
    const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!
    // Efectos de interfaz (Web Audio). Se desbloquean con el primer toque del usuario.
    const sfx = createUiSounds()
    const listening = get('.aves-listening')
    const listeningText = get('.aves-listening span')
    const audioToggle = get<HTMLButtonElement>('[data-audio="toggle"]')
    const audioClose = get<HTMLButtonElement>('[data-audio="close"]')
    let audioPaused = false
    listening.setAttribute('aria-label', labels.panelCanto)
    audioClose.setAttribute('aria-label', labels.cerrarCanto); audioClose.title = labels.cerrarCanto
    Array.from(listening.children).forEach(child => child.setAttribute('inert', ''))
    const makeSong = () => createBirdAudio({
        url: bird.audioCanto,
        onState(state: string) {
            const active = ['playing', 'paused', 'waiting'].includes(state) || (state === 'loading' && listening.classList.contains('is-open'))
            audioPaused = state === 'paused'
            // Los efectos de interfaz bajan de volumen mientras suena el canto.
            sfx.setDucked(state === 'playing')
            if (!active && listening.contains(document.activeElement)) {
                get<HTMLButtonElement>('[data-species-toggle]').focus({ preventScroll: true })
            }
            listening.classList.toggle('is-open', active)
            listening.classList.toggle('is-playing', state === 'playing')
            listening.setAttribute('aria-hidden', String(!active))
            Array.from(listening.children).forEach(child => child.toggleAttribute('inert', !active))
            audioToggle.disabled = audioClose.disabled = !active
            const actionLabel = audioPaused ? labels.reanudarCanto : labels.pausarCanto
            audioToggle.innerHTML = icon(audioPaused ? 'audioPlay' : 'audioPause')
            audioToggle.setAttribute('aria-label', actionLabel); audioToggle.title = actionLabel
            if (active) listeningText.textContent = audioPaused ? labels.cantoPausado : state === 'playing' ? labels.escuchaCanto : labels.cantoCargando
        },
        onError(reason: string) {
            sfx.play('error')
            setStatusMessage(reason === 'blocked' ? labels.cantoBloqueado : reason === 'missing' ? labels.cantoPendiente : labels.errorCanto)
        },
    })
    let song = makeSong()
    const birdText = (text: string) => text.replace(/\{ave\}/g, () => bird.nombre)
    get('h1').replaceChildren(...labels.titulo.split(/(\bUAO\b)/).map(part => {
        if (part !== 'UAO') return document.createTextNode(part)
        const accent = document.createElement('span')
        accent.className = 'aves-title-uao'; accent.textContent = part
        return accent
    }))
    get('header p').textContent = birdText(labels.subtitulo)
    get('#aves-species-title').textContent = labels.catalogo
    const speciesTrigger = get<HTMLButtonElement>('[data-species-toggle]')
    speciesTrigger.setAttribute('aria-label', labels.seleccionarAve)
    speciesTrigger.title = labels.seleccionarAve
    for (const b of catalog) {
        const option = document.createElement('button')
        option.type = 'button'
        option.textContent = b.nombre + (b.disponible ? '' : ` · ${labels.pendiente}`)
        option.disabled = !b.disponible
        option.dataset.species = b.id
        option.setAttribute('aria-pressed', String(b.id === bird.id))
        get('#aves-species').append(option)
    }
    get('.aves-radial').setAttribute('aria-label', labels.menuAve)
    get('.aves-radial-hint').textContent = labels.deslizarMenu
    get('.aves-radial-subhint').textContent = labels.soltarMenu
    for (const action of RADIAL_ACTIONS) {
        get(`[data-radial="${action}"] text`).textContent = radialText[action]
        get(`[data-radial="${action}"]`).setAttribute('aria-label', radialText[action])
    }
    get('.aves-preview').textContent = desktop ? labels.preview : ''
    get('#aves-animation-title').textContent = labels.animaciones
    get('#aves-animation > p').textContent = labels.animacionesNota
    const animationPanel = get('#aves-animation')
    const animationMotion = matchMedia('(prefers-reduced-motion: reduce)')
    let animationClosing = false
    const finishAnimationClose = () => {
        animationClosing = false; animationPanel.hidden = true
        animationPanel.classList.remove('is-closing')
    }
    const closeAnimation = (immediate = false, silent = false) => {
        if (animationPanel.hidden || (animationClosing && !immediate)) return
        if (!silent) sfx.play('panelClose')
        animationClosing = true; animationPanel.setAttribute('aria-hidden', 'true')
        if (animationPanel.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur()
        Array.from(animationPanel.children).forEach(child => child.setAttribute('inert', ''))
        if (immediate || animationMotion.matches) { finishAnimationClose(); return }
        animationPanel.classList.add('is-closing')
    }
    const openAnimation = () => {
        sfx.play('panelOpen')
        animationClosing = false; animationPanel.classList.remove('is-closing')
        Array.from(animationPanel.children).forEach(child => child.removeAttribute('inert'))
        animationPanel.setAttribute('aria-hidden', 'false'); animationPanel.hidden = false
    }
    const finishAnimationExit = (event: AnimationEvent) => {
        if (event.target !== animationPanel || event.animationName !== 'aves-panel-exit' || !animationClosing) return
        const style = getComputedStyle(animationPanel)
        // Un evento de la salida anterior no debe cortar una reapertura o salida nueva.
        if (event.type === 'animationend' && style.opacity !== '0') return
        if (event.type === 'animationcancel' && style.animationName !== 'none') return
        finishAnimationClose()
    }
    animationPanel.addEventListener('animationend', finishAnimationExit)
    animationPanel.addEventListener('animationcancel', finishAnimationExit)
    const reduceAnimationExit = () => { if (animationMotion.matches && animationClosing) finishAnimationClose() }
    animationMotion.addEventListener('change', reduceAnimationExit)
    const renderBird = () => {
        get('header p').textContent = birdText(labels.subtitulo)
        root.querySelectorAll<HTMLElement>('[data-species]').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.species === bird.id)))
        get('#aves-info-title').textContent = bird.nombre
        get('.aves-scientific em').textContent = bird.nombreCientifico || ''
        get('.aves-scientific').hidden = !bird.nombreCientifico
        get('.aves-family').textContent = bird.familia
        const photo = get<HTMLImageElement>('.aves-bird-photo img')
        get('.aves-bird-photo').hidden = !bird.imagen
        if (bird.imagen) {
            photo.width = bird.imagenDimensiones?.ancho || 480
            photo.height = bird.imagenDimensiones?.alto || 639
            photo.src = bird.imagen; photo.alt = bird.imagenAlt || bird.nombre
        }
        else photo.removeAttribute('src')
        get('.aves-source').textContent = bird.fuente?.paginas?.length ? `${labels.guia} · ${labels.pagina} ${bird.fuente.paginas.join(', ')}` : labels.fuentePendiente
        const facts = get('.aves-facts'); facts.replaceChildren()
        if (bird.fichaNota) { const note = document.createElement('p'); note.textContent = bird.fichaNota; facts.append(note) }
        for (const [key, label] of [['descripcion', labels.descripcion], ['habitat', labels.habitat], ['comportamiento', labels.comportamiento], ['rasgos', labels.rasgos]]) {
            if (!bird.ficha?.[key]) continue
            const section = document.createElement('section')
            const heading = document.createElement('h3'); heading.textContent = label
            const text = document.createElement('p'); text.textContent = bird.ficha?.[key]
            section.append(heading, text); facts.append(section)
        }
        get('.aves-clips').replaceChildren()
        get('#aves-animation > p').textContent = bird.animacionesNota || labels.animacionesNota
        for (const clip of bird.clips) {
            const button = document.createElement('button'); button.type = 'button'
            button.textContent = clip.etiqueta
            button.dataset.clip = clip.nombre
            button.title = `${clip.nombre} · ${clip.duracionSegundos}s`
            button.addEventListener('click', () => {
                if (animationClosing || animationPanel.hidden) return
                sfx.play('clip')
                controls.clip(clip.nombre); closeAnimation(false, true)
            })
            get('.aves-clips').append(button)
        }
    }
    const buttonLabels: Record<string, string> = {
        start: labels.comenzar, info: labels.ficha,
        animation: labels.animaciones, relocate: labels.reubicar, cancel: labels.cancelar,
        reset: labels.reiniciar, idle: labels.reposo, pause: labels.pausa
    }
    root.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
        b.type = 'button'
        if (b.dataset.action) b.textContent = buttonLabels[b.dataset.action]
        if (b.dataset.dismiss === 'status') { b.setAttribute('aria-label', labels.cerrarMensaje); b.title = labels.cerrarMensaje }
        if (b.dataset.close === 'species' || b.dataset.close === 'info') {
            b.setAttribute('aria-label', labels.cerrar); b.title = labels.cerrar
        } else if (b.dataset.close) b.textContent = labels.cerrar
    })
    const speciesPopover = get('#aves-species-popover')
    let speciesOpen = false
    const setSpeciesContentActive = (active: boolean) => {
        // El contenedor sigue consumiendo toques mientras sus controles se desvanecen.
        Array.from(speciesPopover.children).forEach(child => child.toggleAttribute('inert', !active))
    }
    const closeSpecies = (immediate = false, silent = false) => {
        const wasOpen = speciesOpen
        speciesOpen = false
        if (wasOpen && !silent) sfx.play('panelClose')
        if (speciesPopover.contains(document.activeElement)) speciesTrigger.focus({ preventScroll: true })
        setSpeciesContentActive(false)
        speciesPopover.setAttribute('aria-hidden', 'true'); speciesTrigger.setAttribute('aria-expanded', 'false')
        speciesPopover.classList.remove('is-open')
        if (immediate || matchMedia('(prefers-reduced-motion: reduce)').matches || getComputedStyle(speciesPopover).opacity === '0') speciesPopover.hidden = true
    }
    const openSpecies = () => {
        sfx.play('panelOpen')
        speciesOpen = true; speciesPopover.hidden = false
        setSpeciesContentActive(true)
        speciesPopover.setAttribute('aria-hidden', 'false'); speciesTrigger.setAttribute('aria-expanded', 'true')
        // Calcula el estado cerrado antes de abrir; invertir a mitad de transición es continuo.
        speciesPopover.getBoundingClientRect()
        speciesPopover.classList.add('is-open')
    }
    const finishSpeciesClose = (event: TransitionEvent) => {
        if (event.target !== speciesPopover || event.propertyName !== 'opacity' || speciesOpen) return
        // Invertir una apertura también cancela la transición anterior: no cortar la salida.
        if (getComputedStyle(speciesPopover).opacity === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches) speciesPopover.hidden = true
    }
    speciesPopover.addEventListener('transitionend', finishSpeciesClose)
    speciesPopover.addEventListener('transitioncancel', finishSpeciesClose)
    // Suena una sola vez "panelClose" si había algo abierto, salvo que se pida silencio
    // (por ejemplo cuando justo después se abre otro panel o la rueda).
    const closePanels = (silent = false) => {
        const anyOpen = speciesOpen || !animationPanel.hidden || !get('#aves-info').hidden
        closeSpecies(false, true); closeAnimation(true, true)
        root.querySelectorAll<HTMLElement>('.aves-panel').forEach(p => p.hidden = true)
        if (anyOpen && !silent) sfx.play('panelClose')
    }
    // La entrada utilizada por el tap ECS conserva su nombre; ahora presenta el círculo.
    // La guía tiene una función propia para que Ficha no vuelva a abrir el menú.
    const openGuide = () => { closePanels(true); get('#aves-info').hidden = false; sfx.play('panelOpen') }
    let gestureBlocked = false
    let pressedSector: string | null = null
    let dismissedOutside = false
    const menu = get('.aves-radial')
    let lastHighlight: string | null = null
    const highlightRadial = (action: string | null) => {
        root.querySelectorAll<HTMLElement>('[data-radial]').forEach(s => s.classList.toggle('is-highlighted', s.dataset.radial === action))
        // Solo suena al cambiar de sector, nunca en cada movimiento del dedo.
        if (action && action !== lastHighlight && menu.classList.contains('is-open')) sfx.play('radialHover')
        lastHighlight = action
    }
    const closeRadial = (silent = false) => {
        const wasOpen = menu.classList.contains('is-open')
        pressedSector = null
        menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true')
        root.classList.remove('has-radial')
        highlightRadial(null)
        root.querySelectorAll<HTMLElement>('[data-radial]').forEach(s => s.setAttribute('tabindex', '-1'))
        if (wasOpen && !silent) sfx.play('radialClose')
    }
    const layoutAt = (point: { x: number; y: number }) => {
        const style = getComputedStyle(root)
        return radialLayout(point, { width: innerWidth, height: innerHeight }, { left: parseFloat(style.paddingLeft), right: parseFloat(style.paddingRight), top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom) })
    }
    const showRadial = (layout: { x: number; y: number; radius: number }) => {
        closePanels(true); pressedSector = null; highlightRadial(null)
        menu.style.left = layout.x + 'px'; menu.style.top = layout.y + 'px'
        menu.style.width = menu.style.height = (layout.radius * 320 / 144) + 'px'
        menu.setAttribute('aria-hidden', 'false'); menu.classList.add('is-open')
        root.classList.add('has-radial')
        root.querySelectorAll<HTMLElement>('[data-radial]').forEach(s => s.setAttribute('tabindex', '0'))
        sfx.play('radialOpen')
    }
    const openInfo = (point?: { x: number; y: number } | null) => {
        showRadial(layoutAt(point || { x: innerWidth / 2, y: innerHeight / 2 }))
    }
    const runRadialAction = (action: string) => {
        if (!RADIAL_ACTIONS.includes(action)) return
        sfx.play(action === 'reset' ? 'reset' : 'radialSelect')
        closeRadial(true); closePanels(true)
        if (action === 'info') openGuide()
        if (action === 'animation') openAnimation()
        if (action === 'song' && root.dataset.phase === 'EXPLORAR') song.play()
        if (action === 'relocate') { song.stop(); controls.relocate() }
        if (action === 'reset') { song.stop(); controls.reset() }
    }
    const status = get('.aves-status')
    const statusDismiss = get<HTMLButtonElement>('[data-dismiss="status"]')
    let statusKey = ''
    let dismissedStatusKey: string | null = null
    const setStatusMessage = (message: string) => {
        const key = `${root.dataset.phase}:${message}`
        if (key !== statusKey) {
            statusKey = key; dismissedStatusKey = null
            status.hidden = false; status.setAttribute('aria-hidden', 'false')
            status.classList.remove('is-dismissed'); statusDismiss.disabled = false
        }
        get('.aves-status p').textContent = message
    }
    let startExit: HTMLElement | null = null
    const clearStartTransition = () => {
        startExit?.remove(); startExit = null
        status.classList.remove('is-entering')
    }
    const animateStart = () => {
        clearStartTransition()
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
        // Conserva visualmente la bienvenida mientras el estado real avanza sin esperar.
        const rect = status.getBoundingClientRect(), bounds = root.getBoundingClientRect()
        const exit = status.cloneNode(true) as HTMLElement
        exit.removeAttribute('aria-live'); exit.setAttribute('aria-hidden', 'true')
        exit.setAttribute('data-aves-ui', '')
        exit.querySelectorAll<HTMLElement>('button').forEach(b => {
            b.removeAttribute('data-action'); b.tabIndex = -1
        })
        exit.classList.add('is-leaving')
        Object.assign(exit.style, { left: rect.left - bounds.left + 'px', top: rect.top - bounds.top + 'px', width: rect.width + 'px' })
        // La tarjeta de salida consume los contactos; no activa controles ni el suelo.
        exit.addEventListener('click', e => { e.preventDefault(); e.stopPropagation() })
        const finishExit = () => { exit.remove(); if (startExit === exit) startExit = null }
        exit.addEventListener('animationend', finishExit, { once: true })
        exit.addEventListener('animationcancel', finishExit, { once: true })
        startExit = exit; root.append(exit)
        status.classList.add('is-entering')
    }
    status.addEventListener('animationend', () => status.classList.remove('is-entering'))
    status.addEventListener('animationcancel', () => status.classList.remove('is-entering'))
    const dismissStatus = () => {
        if (statusDismiss.hidden || dismissedStatusKey === statusKey) return
        clearStartTransition()
        dismissedStatusKey = statusKey
        statusDismiss.blur(); statusDismiss.disabled = true
        status.setAttribute('aria-hidden', 'true'); status.classList.add('is-dismissed')
        if (matchMedia('(prefers-reduced-motion: reduce)').matches || getComputedStyle(status).opacity === '0') status.hidden = true
    }
    const finishStatusDismiss = (event: TransitionEvent) => {
        if (event.target !== status || event.propertyName !== 'opacity' || dismissedStatusKey !== statusKey) return
        if (getComputedStyle(status).opacity === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches) status.hidden = true
    }
    status.addEventListener('transitionend', finishStatusDismiss)
    status.addEventListener('transitioncancel', finishStatusDismiss)
    root.addEventListener('click', (e) => {
        const sector = (e.target as Element).closest<HTMLElement>('[data-radial]')
        if (sector) {
            // El click sintetizado después del tap de apertura no tiene un nuevo pointerdown.
            const action = sector.dataset.radial!
            if (menu.classList.contains('is-open') && pressedSector === action) runRadialAction(action)
            pressedSector = null
            return
        }
        const button = (e.target as Element).closest<HTMLButtonElement>('button')
        if (!button || button.disabled) return
        if (button.dataset.audio) {
            if (!listening.classList.contains('is-open')) return
            if (button.dataset.audio === 'close') song.stop()
            else if (audioPaused) song.resume()
            else song.pause()
            return
        }
        if (animationClosing && animationPanel.contains(button)) return
        if (button.dataset.dismiss === 'status') { dismissStatus(); return }
        if (!speciesOpen && speciesPopover.contains(button)) return
        if (button.hasAttribute('data-species-toggle')) {
            const open = !speciesOpen
            closeRadial(); closePanels(open); controls.dismiss()
            if (open) openSpecies()
            return
        }
        if (button.dataset.species) { closeSpecies(); controls.species(button.dataset.species); return }
        if (button.dataset.close === 'species') { closeSpecies(); return }
        if (button.dataset.close === 'animation') { closeAnimation(); return }
        if (button.dataset.close) { closePanels(); return }
        switch (button.dataset.action) {
            case 'start': sfx.play('start'); animateStart(); controls.start(); break
            case 'animation': runRadialAction('animation'); break
            case 'relocate': runRadialAction('relocate'); break
            case 'cancel': controls.cancel(); break
            case 'reset': runRadialAction('reset'); break
            case 'idle': controls.idle(); closeAnimation(); break
            case 'pause': controls.pause(); closeAnimation(); break
        }
    })
    // Captura eventos del HUD antes que el canvas. Incluye selects y gestos en paneles.
    const stop = (e: Event) => e.stopPropagation()
    const pointer = (e: Event) => {
        if ((e.target as Element).closest('button,select,label,.aves-panel,[data-aves-ui]')) stop(e)
    }
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
        root.addEventListener(event, pointer)
    }
    const block = (e: Event) => {
        if (!gestureBlocked) return
        if (e.cancelable) e.preventDefault()
        e.stopImmediatePropagation()
    }
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'contextmenu']) root.addEventListener(event, block, { capture: true, passive: false })
    const outside = (e: PointerEvent) => {
        dismissedOutside = false
        if (menu.classList.contains('is-open')) {
            if (!(e.target as Element).closest('.aves-radial')) {
                dismissedOutside = true
                closeRadial(); controls.dismiss()
                // El toque exterior solo cierra, incluso si cae sobre otro control del HUD.
                e.preventDefault(); e.stopPropagation(); return
            }
            pressedSector = (e.target as Element).closest<HTMLElement>('[data-radial]')?.dataset.radial || null
            highlightRadial(pressedSector)
        }
        if (!speciesOpen || (e.target as Element).closest('[data-species-toggle],#aves-species-popover')) return
        closeSpecies()
        dismissedOutside = true
        // Ese toque cierra el popover; no llega al canvas para colocar o inspeccionar.
        e.preventDefault(); e.stopPropagation()
    }
    document.addEventListener('pointerdown', outside, true)
    const consumeOutsideClick = (e: MouseEvent) => {
        if (!dismissedOutside) return
        dismissedOutside = false
        e.preventDefault(); e.stopImmediatePropagation()
    }
    document.addEventListener('click', consumeOutsideClick, true)
    menu.addEventListener('pointermove', (e) => {
        if (menu.classList.contains('is-open')) highlightRadial((e.target as Element).closest<HTMLElement>('[data-radial]')?.dataset.radial || null)
    })
    menu.addEventListener('pointerleave', () => highlightRadial(null))
    menu.addEventListener('pointercancel', () => { closeRadial(); controls.dismiss() })
    const escape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeRadial()
            if (!animationPanel.hidden) closeAnimation()
            else closePanels()
            controls.dismiss()
        }
        const sector = (e.target as Element).closest<HTMLElement>('[data-radial]')
        if (sector && menu.classList.contains('is-open') && ['Enter', ' '].includes(e.key)) { e.preventDefault(); runRadialAction(sector.dataset.radial!) }
    }
    document.addEventListener('keydown', escape)
    const dismissMenu = () => closeRadial()
    const hiddenDocument = () => { if (document.hidden) { closeRadial(true); song.stop() } }
    window.addEventListener('blur', dismissMenu)
    window.addEventListener('resize', dismissMenu)
    document.addEventListener('visibilitychange', hiddenDocument)
    // Para detectar transiciones de fase y disparar los sonidos de colocación.
    let lastPhase: string | null = null
    let lastPositionKey = ''
    renderBird()
    return {
        setBird(next: any) {
            song.dispose(); closePanels(true); closeRadial(true); controls.dismiss()
            bird = next; song = makeSong(); renderBird()
        },
        root, openInfo, closePanels, closeRadial, runRadialAction,
        setGestureBlocked(blocked: boolean) { gestureBlocked = blocked },
        radialLayout: layoutAt, showRadial, highlightRadial,
        showMessage: setStatusMessage,
        update(snapshot: any) {
            const phase = snapshot.phase
            const positionKey = snapshot.position ? `${snapshot.position.x},${snapshot.position.y},${snapshot.position.z}` : ''
            if (lastPhase !== null && lastPhase !== phase) {
                if (phase === 'COLOCANDO') sfx.play('place')
                else if (phase === 'EXPLORAR' && lastPhase === 'ATERRIZANDO') sfx.play('land')
                else if (phase === 'EXPLORAR' && lastPhase === 'REUBICAR' && positionKey !== lastPositionKey) sfx.play('relocate')
                else if (phase === 'ERROR') sfx.play('error')
            }
            lastPhase = phase
            lastPositionKey = positionKey
            if (phase === 'ERROR') clearStartTransition()
            root.dataset.phase = phase
            const placed = phase === 'EXPLORAR'
            const start = get<HTMLButtonElement>('[data-action="start"]')
            start.hidden = !['INTRO', 'ERROR'].includes(phase)
            statusDismiss.hidden = !start.hidden
            status.classList.toggle('is-dismissible', start.hidden)
            start.textContent = phase === 'ERROR' ? labels.reintentar : labels.comenzar
            const messages: Record<string, string> = {
                INTRO: labels.intro, PREPARANDO: labels.preparando,
                ESCANEO: labels.escaneo, COLOCANDO: labels.colocando, ATERRIZANDO: labels.aterrizando, EXPLORAR: labels.explorar,
                REUBICAR: labels.reubicando, ERROR: snapshot.message || labels.errorRecurso
            }
            setStatusMessage(!snapshot.trackingReady && ['ESCANEO', 'REUBICAR', 'ATERRIZANDO', 'EXPLORAR'].includes(phase) ? labels.seguimiento : birdText(messages[phase]))
            get('.aves-scan').hidden = !['ESCANEO', 'REUBICAR'].includes(phase)
            for (const action of ['idle', 'pause']) get<HTMLButtonElement>(`[data-action="${action}"]`).disabled = !placed
            get('[data-action="cancel"]').hidden = phase !== 'REUBICAR'
            get('[data-action="reset"]').hidden = !['COLOCANDO', 'ATERRIZANDO', 'ERROR'].includes(phase)
            get<HTMLButtonElement>('[data-action="reset"]').disabled = !snapshot.position && phase !== 'ERROR'
            if (!placed) { song.stop(); closePanels(true); closeRadial(true) }
        },
        dispose() {
            song.dispose()
            sfx.dispose()
            closeAnimation(true, true)
            animationMotion.removeEventListener('change', reduceAnimationExit)
            closeSpecies(true, true)
            clearStartTransition()
            document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape)
            document.removeEventListener('click', consumeOutsideClick, true)
            window.removeEventListener('blur', dismissMenu); window.removeEventListener('resize', dismissMenu)
            document.removeEventListener('visibilitychange', hiddenDocument); root.remove()
        },
    }
}