import labels from './data/interfaz.json'
import { RADIAL_CONFIG, RADIAL_ACTIONS, radialLayout } from './radial-gesture'
import { createBirdAudio } from './bird-audio'
import { createUiSounds } from './ui-sounds'
import { BirdQuiz } from './quiz'

// Desde este porcentaje de aciertos suena "quiz-final-alto.mp3" (si no existe, suena "quiz-final.mp3").
const QUIZ_PUNTAJE_ALTO = 70

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

// Texto de seguimiento según el estado y el motivo que reporta el motor. Si ni el motivo ni el
// estado están mapeados, se usa el mensaje genérico (labels.seguimiento). El motor puede enviar
// 'INITIALIZING'/'RELOCALIZING' como motivo y 'LIMITED'/'NOT_AVAILABLE' como estado.
const trackingMessage = (snapshot: any) => {
    const reason = String(snapshot.trackingReason ?? '').toUpperCase()
    const status = String(snapshot.trackingStatus ?? '').toUpperCase()
    if (reason === 'INITIALIZING') return labels.seguimientoInicializando
    if (reason === 'RELOCALIZING') return labels.seguimientoRelocalizando
    if (status === 'LIMITED' || status === 'NOT_AVAILABLE') return labels.seguimientoLimitado
    return labels.seguimiento
}

// El contenido académico y las etiquetas proceden de JSON; el DOM no recibe HTML del PDF.
export function createPilotUi(catalog: any[], bird: any, controls: Controls, desktop: boolean, reticulacion = false) {
    const birdQuiz = new BirdQuiz()
    document.getElementById('aves-pilot')?.remove()
    const root = document.createElement('main')
    root.id = 'aves-pilot'
    root.style.setProperty('--radial-highlight-scale', String(RADIAL_CONFIG.visualScale))
    root.innerHTML = `<header class="aves-header"><img class="aves-brand" src="assets/logo-colibri.png" alt="Colibrí de Plumas"><div><h1></h1><p></p></div></header>
    <section class="aves-status" data-aves-ui aria-live="polite"><button class="aves-status-dismiss" data-dismiss="status" hidden>${icon('close')}</button><p></p><button class="aves-start-button" data-action="start"></button></section>
    <div class="aves-scan" aria-hidden="true"><span></span></div>
    <button class="aves-species-trigger" data-aves-ui data-species-toggle aria-haspopup="dialog" aria-expanded="false" aria-controls="aves-species-popover">${icon('species')}</button>
    <button
        class="aves-quiz-trigger"
        data-aves-ui
        data-quiz-toggle
        aria-label="Abrir quiz de aves"
        title="Quiz de aves"
    >
        ?
    </button>
    <aside class="aves-species-popover" id="aves-species-popover" data-aves-ui role="dialog" aria-labelledby="aves-species-title" aria-hidden="true" hidden>
      <button data-close="species">${icon('close')}</button><h2 id="aves-species-title"></h2><div id="aves-species"></div></aside>
    <section class="aves-quiz-lock" id="aves-quiz-lock" hidden aria-live="polite">
    <div class="aves-quiz-lock-content">
        <h2>Quiz de aves</h2>
        <p class="aves-quiz-lock-message"></p>
        <button class="aves-quiz-start" data-quiz-start hidden>
            Iniciar quiz
        </button>
        <button class="aves-quiz-close" data-quiz-close>
            Cerrar
        </button>
    </div>
</section>
    <section class="aves-quiz-panel" id="aves-quiz-panel" hidden aria-live="polite">
    <div class="aves-quiz-content">

        <div class="aves-quiz-header">
            <span class="aves-quiz-counter"></span>
            <button data-quiz-exit aria-label="Cerrar quiz">${icon('close')}</button>
        </div>

        <h2 class="aves-quiz-title">
            Quiz de aves
        </h2>

        <p class="aves-quiz-question"></p>

        <div class="aves-quiz-audio" hidden>
            <button data-quiz-audio>
                🔊 Escuchar canto
            </button>
            <span class="aves-quiz-audio-status" aria-live="polite"></span>
        </div>

        <div class="aves-quiz-options"></div>

        <button
            class="aves-quiz-next"
            data-quiz-next
            disabled
        >
            Siguiente
        </button>

        <p class="aves-quiz-score" hidden></p>

    </div>
</section>
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
    // Se crea aquí arriba porque el quiz también los usa.
    const sfx = createUiSounds()
    // Los efectos bajan de volumen mientras suena un canto (el del ave o el del quiz).
    let songPlaying = false
    let quizAudioPlaying = false
    const updateDuck = () => sfx.setDucked(songPlaying || quizAudioPlaying)

    // ============================================================
    // QUIZ DE AVES
    // ============================================================

    const quizLock = get<HTMLElement>('#aves-quiz-lock')
    const quizLockMessage = get<HTMLElement>('#aves-quiz-lock .aves-quiz-lock-message')
    const quizStartButton = get<HTMLButtonElement>('#aves-quiz-lock [data-quiz-start]')
    const quizCloseButton = get<HTMLButtonElement>('#aves-quiz-lock [data-quiz-close]')

    const quizPanel = get<HTMLElement>('#aves-quiz-panel')
    const quizCounter = get<HTMLElement>('.aves-quiz-counter')
    const quizQuestion = get<HTMLElement>('.aves-quiz-question')
    const quizOptions = get<HTMLElement>('.aves-quiz-options')
    const quizNextButton = get<HTMLButtonElement>('[data-quiz-next]')
    const quizExitButton = get<HTMLButtonElement>('[data-quiz-exit]')
    const quizScore = get<HTMLElement>('.aves-quiz-score')
    const quizAudioPanel = get<HTMLElement>('.aves-quiz-audio')
    const quizAudioButton = get<HTMLButtonElement>('[data-quiz-audio]')
    const quizAudioStatus = get<HTMLElement>('.aves-quiz-audio-status')

    let quizAudio: HTMLAudioElement | null = null
    let currentQuizAudioUrl = ''

    type QuizAnswerRecord = {
        question: string
        options: string[]
        selectedIndex: number
        correctIndex: number
    }

    let quizAnswers: QuizAnswerRecord[] = []
    let quizFinished = false
    let quizQuestionIndex = 0
    let quizQuestions: any[] = []

    // -1 significa que no hay ninguna respuesta seleccionada.
    // Solo se permite una respuesta seleccionada a la vez.
    let selectedQuizOption = -1

    // ============================================================
    // ESTILOS DEL QUIZ
    // ============================================================

    const quizStyle = document.createElement('style')
    quizStyle.textContent = `
        :root {
            --uao-red: #ed1d24;
            --uao-red-dark: #c9141b;
            --uao-navy: #081047;
            --uao-text: #17203d;
            --uao-border: #dfe2ec;
        }

        #aves-quiz-lock,
        #aves-quiz-panel {
            position: fixed !important;
            inset: 0 !important;
            z-index: 4 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 16px;
            background:
                radial-gradient(circle at 50% 12%, rgba(237,29,36,.28), transparent 42%),
                rgba(92, 7, 13, .82);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none !important;
            transition: opacity .24s ease, visibility 0s linear .24s;
            touch-action: manipulation;
            overflow: hidden;
        }

        #aves-quiz-lock[hidden],
        #aves-quiz-panel[hidden] {
            display: none !important;
        }

        #aves-quiz-lock.is-visible,
        #aves-quiz-panel.is-visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto !important;
            transition: opacity .24s ease, visibility 0s linear 0s;
        }

        #aves-quiz-lock .aves-quiz-lock-content,
        #aves-quiz-panel .aves-quiz-content {
            position: relative;
            width: min(430px, 90vw);
            max-height: 84vh;
            box-sizing: border-box;
            overflow-x: hidden;
            overflow-y: auto;
            border: 1px solid rgba(8,16,71,.08);
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 24px 70px rgba(0,0,0,.34);
            pointer-events: auto !important;
            touch-action: manipulation;
            scrollbar-width: thin;
            scrollbar-color: var(--uao-red) #eef0f5;
        }

        /* ---------------- Pantalla de inicio ---------------- */

        #aves-quiz-lock .aves-quiz-lock-content {
            padding: 25px 22px 22px;
            text-align: center;
        }

        #aves-quiz-lock h2 {
            margin: 0 0 12px;
            color: var(--uao-navy);
            font-size: clamp(25px, 6vw, 34px);
            line-height: 1.1;
        }

        #aves-quiz-lock .aves-quiz-lock-message {
            max-width: 450px;
            margin: 0 auto 23px;
            color: #59627d;
            font-size: 15px;
            line-height: 1.5;
        }

        #aves-quiz-lock .aves-quiz-start,
        #aves-quiz-lock .aves-quiz-close {
            width: 100%;
            min-height: 48px;
            margin: 0;
            border: 0;
            border-radius: 12px;
            padding: 12px 20px;
            font: inherit;
            font-weight: 650;
            cursor: pointer;
            pointer-events: auto !important;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        #aves-quiz-lock .aves-quiz-start {
            background: var(--uao-red);
            color: #fff;
            box-shadow: 0 7px 18px rgba(237,29,36,.24);
        }

        #aves-quiz-lock .aves-quiz-start:hover {
            background: var(--uao-red-dark);
        }

        #aves-quiz-lock .aves-quiz-close {
            margin-top: 10px;
            background: #eef0f5;
            color: var(--uao-navy);
        }

        /* ---------------- Botón flotante del Quiz ---------------- */

        #aves-pilot .aves-quiz-trigger {
            position: fixed !important;
            left: 16px !important;
            bottom: 86px !important;
            z-index: 1 !important;
            width: 62px !important;
            height: 50px !important;
            min-width: 62px !important;
            min-height: 50px !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 16px !important;
            background: var(--uao-red) !important;
            color: #fff !important;
            box-shadow: 0 8px 22px rgba(237,29,36,.32) !important;
            display: grid !important;
            place-items: center !important;
            font: inherit !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            text-align: center !important;
            cursor: pointer !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent !important;
            transition: transform .16s ease, background .16s ease, box-shadow .16s ease !important;
        }

        #aves-pilot .aves-quiz-trigger:hover {
            background: var(--uao-red-dark) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 10px 25px rgba(237,29,36,.38) !important;
        }

        #aves-pilot .aves-quiz-trigger:active {
            transform: scale(.95) !important;
        }

        /* ---------------- Ventana del quiz ---------------- */

        #aves-quiz-panel .aves-quiz-content {
            padding: 58px 22px 22px;
            transform: none;
        }

        #aves-quiz-panel .aves-quiz-header {
            position: absolute;
            top: 12px;
            left: 4px;
            right: 4px;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 0;
        }

        #aves-quiz-panel .aves-quiz-counter {
            justify-self: start;
            display: inline-flex;
            align-items: center;
            width: 158px;
            min-width: 158px;
            min-height: 34px;
            box-sizing: border-box;
            padding: 6px 13px;
            justify-content: center;
            white-space: nowrap;
            border-radius: 999px;
            background: #fff0f1;
            border: 1px solid rgba(237,29,36,.20);
            color: var(--uao-red-dark);
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
        }

        #aves-quiz-panel [data-quiz-exit] {
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            flex: 0 0 44px;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            display: grid;
            place-items: center;
            border: 1px solid rgba(237,29,36,.16);
            border-radius: 50%;
            background: #fff5f5;
            color: var(--uao-red-dark);
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            pointer-events: auto !important;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        #aves-quiz-panel [data-quiz-exit]:hover {
            background: #ffe7e8;
            transform: scale(1.04);
        }

        #aves-quiz-panel .aves-quiz-title {
            margin: 0 0 17px;
            color: var(--uao-navy);
            font-size: clamp(24px, 6vw, 30px);
            line-height: 1.15;
            text-align: center;
        }

        #aves-quiz-panel .aves-quiz-question {
            max-width: 500px;
            margin: 0 auto 20px;
            color: var(--uao-navy);
            font-size: clamp(17px, 4.3vw, 21px);
            font-weight: 650;
            line-height: 1.4;
            text-align: center;
        }

        #aves-quiz-panel .aves-quiz-options {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            width: 100%;
            pointer-events: auto !important;
        }

        /* ---------------- Audio del quiz ---------------- */

        #aves-quiz-panel .aves-quiz-audio {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            width: 100%;
            margin: 0 auto 17px;
            padding: 10px;
            box-sizing: border-box;
            border-radius: 14px;
            background: #fff4f4;
            border: 1px solid rgba(237,29,36,.16);
        }

        #aves-quiz-panel .aves-quiz-audio[hidden] {
            display: none !important;
        }

        #aves-quiz-panel [data-quiz-audio] {
            min-height: 42px;
            border: 0;
            border-radius: 12px;
            padding: 9px 15px;
            background: var(--uao-red);
            color: #fff;
            font: inherit;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 5px 14px rgba(237,29,36,.18);
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        #aves-quiz-panel [data-quiz-audio]:active {
            transform: scale(.97);
        }

        #aves-quiz-panel .aves-quiz-audio-status {
            color: var(--uao-red-dark);
            font-size: 12px;
            font-weight: 650;
        }

        /* ---------------- Opciones ---------------- */

        #aves-quiz-panel .aves-quiz-option {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            min-height: 52px;
            box-sizing: border-box;
            border: 2px solid var(--uao-border);
            border-radius: 12px;
            padding: 11px 14px;
            background: #fff;
            color: var(--uao-text);
            text-align: left;
            font: inherit;
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
            cursor: pointer !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            transition:
                transform .12s ease,
                border-color .12s ease,
                background .12s ease,
                color .12s ease,
                box-shadow .12s ease;
        }

        #aves-quiz-panel .aves-quiz-option:hover {
            border-color: rgba(237,29,36,.55);
            background: #fff7f7;
        }

        #aves-quiz-panel .aves-quiz-option:active {
            transform: scale(.99);
        }

        /* Una sola opción puede tener esta clase. */
        #aves-quiz-panel .aves-quiz-option.selected {
            border-color: var(--uao-red);
            background: #fff0f1;
            color: var(--uao-red-dark);
            box-shadow: 0 0 0 3px rgba(237,29,36,.12);
        }

        #aves-quiz-panel .aves-quiz-option::before {
            content: '';
            width: 9px;
            height: 9px;
            flex: 0 0 9px;
            margin-right: 10px;
            border: 2px solid #cdd1dc;
            border-radius: 50%;
            box-sizing: border-box;
            background: #fff;
        }

        #aves-quiz-panel .aves-quiz-option.selected::before {
            border-color: var(--uao-red);
            background: var(--uao-red);
            box-shadow: inset 0 0 0 2px #fff;
        }

        #aves-quiz-panel .aves-quiz-option:focus-visible {
            outline: 3px solid rgba(237,29,36,.24);
            outline-offset: 2px;
        }

        /* ---------------- Botón siguiente ---------------- */

        #aves-quiz-panel .aves-quiz-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 18px;
        }

        #aves-quiz-panel .aves-quiz-next {
            width: 100%;
            min-height: 49px;
            border: 0;
            border-radius: 12px;
            padding: 12px 20px;
            background: var(--uao-red);
            color: #fff;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            pointer-events: auto !important;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 7px 18px rgba(237,29,36,.20);
        }

        #aves-quiz-panel .aves-quiz-next:hover:not(:disabled) {
            background: var(--uao-red-dark);
        }

        #aves-quiz-panel .aves-quiz-next:disabled {
            cursor: not-allowed;
            opacity: .42;
            box-shadow: none;
        }

        /* ---------------- Resultado ---------------- */

        #aves-quiz-panel .aves-quiz-score {
            margin: 18px 0 0;
            padding: 14px;
            border: 1px solid rgba(237,29,36,.16);
            border-radius: 13px;
            background: #fff0f1;
            color: var(--uao-navy);
            font-size: 17px;
            font-weight: 700;
            text-align: center;
        }

        #aves-quiz-panel .aves-quiz-results-title {
            margin: 23px 0 0;
            color: var(--uao-navy);
            font-size: 21px;
            line-height: 1.2;
        }

        #aves-quiz-panel .aves-quiz-review {
            display: grid;
            gap: 10px;
            margin-top: 12px;
        }

        #aves-quiz-panel .aves-quiz-review-card {
            padding: 14px;
            border: 1px solid #e0e3ec;
            border-left: 4px solid var(--uao-red);
            border-radius: 13px;
            background: #fafafd;
        }

        #aves-quiz-panel .aves-quiz-review-number {
            display: block;
            margin-bottom: 5px;
            color: var(--uao-red);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        #aves-quiz-panel .aves-quiz-review-question {
            margin: 0 0 8px;
            color: var(--uao-navy);
            font-size: 15px;
            font-weight: 650;
            line-height: 1.4;
        }

        #aves-quiz-panel .aves-quiz-review-answer,
        #aves-quiz-panel .aves-quiz-review-correct {
            margin: 5px 0 0;
            font-size: 14px;
            line-height: 1.45;
        }

        #aves-quiz-panel .aves-quiz-review-answer {
            color: #4d5670;
        }

        #aves-quiz-panel .aves-quiz-review-answer.is-wrong {
            color: var(--uao-red-dark);
            font-weight: 650;
        }

        #aves-quiz-panel .aves-quiz-review-answer.is-correct {
            color: #2d6849;
            font-weight: 650;
        }

        #aves-quiz-panel .aves-quiz-review-correct {
            color: #2d6849;
            font-weight: 650;
        }

        /* ---------------- Móvil ---------------- */


        @media (max-width: 680px) {
            #aves-pilot .aves-quiz-trigger {
                left: 14px !important;
                bottom: 84px !important;
                width: 60px !important;
                height: 48px !important;
                min-width: 60px !important;
                min-height: 48px !important;
                border-radius: 15px !important;
                font-size: 14px !important;
            }
            #aves-quiz-lock,
            #aves-quiz-panel {
                padding: 9px;
            }

            #aves-quiz-lock .aves-quiz-lock-content,
            #aves-quiz-panel .aves-quiz-content {
                width: min(100%, 390px);
                max-height: 82vh;
                border-radius: 18px;
            }

            #aves-quiz-lock .aves-quiz-lock-content {
                padding: 25px 18px 20px;
            }

            #aves-quiz-panel .aves-quiz-content {
                padding: 55px 14px 16px;
                transform: none;
            }

            #aves-quiz-panel .aves-quiz-header {
                top: 11px;
                left: 4px;
                right: 4px;
            }

            #aves-quiz-panel .aves-quiz-counter {
                width: 158px;
                min-width: 158px;
                font-size: 11px;
            }

            #aves-quiz-panel [data-quiz-exit] {
                width: 44px;
                height: 44px;
                flex-basis: 44px;
            }

            #aves-quiz-panel .aves-quiz-title {
                margin-bottom: 14px;
                font-size: 24px;
            }

            #aves-quiz-panel .aves-quiz-question {
                margin-bottom: 16px;
                font-size: 17px;
            }

            #aves-quiz-panel .aves-quiz-options {
                gap: 8px;
            }

            #aves-quiz-panel .aves-quiz-option {
                min-height: 47px;
                padding: 9px 10px;
                font-size: 14px;
                border-radius: 11px;
            }

            #aves-quiz-panel .aves-quiz-next {
                min-height: 47px;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            #aves-quiz-lock, #aves-quiz-panel, #aves-pilot .aves-quiz-trigger {
                transition: none !important;
            }
        }
    `
    root.appendChild(quizStyle)

    const showQuizOverlay = (element: HTMLElement) => {
        element.hidden = false
        element.setAttribute('aria-hidden', 'false')
        element.classList.remove('is-visible')
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.classList.add('is-visible')
            })
        })
    }

    const hideQuizOverlay = (element: HTMLElement) => {
        element.classList.remove('is-visible')
        element.setAttribute('aria-hidden', 'true')
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.hidden = true; return }
        window.setTimeout(() => {
            if (!element.classList.contains('is-visible')) {
                element.hidden = true
            }
        }, 250)
    }

    const quizResultsTitle = document.createElement('h2')
    quizResultsTitle.className = 'aves-quiz-results-title'
    quizResultsTitle.textContent = 'Revisión de respuestas'
    quizResultsTitle.hidden = true
    quizScore.insertAdjacentElement('beforebegin', quizResultsTitle)

    const quizReview = document.createElement('div')
    quizReview.className = 'aves-quiz-review'
    quizReview.hidden = true
    quizScore.insertAdjacentElement('afterend', quizReview)

    const shuffleArray = <T>(items: T[]): T[] => {
        const copy = [...items]
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
    }

    const isAudioQuizQuestion = (pregunta: any): boolean => {
        if (!pregunta) return false

        const type = String(pregunta?.tipo ?? '').trim().toLowerCase()
        if (type === 'audio' || type === 'canto' || type === 'sonido') return true

        const text = String(pregunta?.pregunta ?? '').toLowerCase()
        return /\bcanto\b|\bsonido\b/.test(text) && Boolean(
            pregunta?.audio ||
            pregunta?.audioUrl ||
            pregunta?.audioCanto ||
            pregunta?.canto ||
            pregunta?.urlAudio
        )
    }

    const resolveQuizAudioUrl = (pregunta: any): string => {
        if (!isAudioQuizQuestion(pregunta)) return ''

        const direct =
            pregunta?.audio ??
            pregunta?.audioUrl ??
            pregunta?.audioCanto ??
            pregunta?.canto ??
            pregunta?.urlAudio ??
            ''

        let rawUrl = ''

        if (typeof direct === 'string' && direct.trim()) {
            rawUrl = direct.trim()
        } else {
            const speciesId = pregunta?.ave ?? pregunta?.aveId ?? pregunta?.birdId
            if (speciesId) {
                const matchingBird = catalog.find((item: any) =>
                    String(item?.id) === String(speciesId)
                )
                const birdAudio = matchingBird?.audioCanto ?? matchingBird?.audio ?? matchingBird?.audioUrl
                if (typeof birdAudio === 'string' && birdAudio.trim()) {
                    rawUrl = birdAudio.trim()
                }
            }
        }

        if (!rawUrl) return ''

        // Los audios del proyecto suelen venir como assets/audio/archivo.mp3.
        // Los convertimos a una URL absoluta respecto al documento de 8th Wall.
        try {
            return new URL(rawUrl, document.baseURI).href
        } catch {
            return rawUrl
        }
    }

    const stopQuizAudio = () => {
        if (quizAudio) {
            quizAudio.pause()
            quizAudio.currentTime = 0
            quizAudio.src = ''
            quizAudio.load()
        }
        quizAudioPlaying = false
        updateDuck()
        currentQuizAudioUrl = ''
        quizAudioPanel.hidden = true
        if (quizAudioStatus) quizAudioStatus.textContent = ''
        if (quizAudioButton) quizAudioButton.textContent = '🔊 Escuchar canto'
    }

    const playQuizAudio = async (url: string, automatic = false) => {
        if (!url) return

        if (!quizAudio) {
            quizAudio = new Audio()
            quizAudio.preload = 'auto'
            quizAudio.volume = 1
            // Mientras suena el canto del quiz, los efectos de interfaz bajan de volumen.
            quizAudio.onplaying = () => { quizAudioPlaying = true; updateDuck() }
            quizAudio.onpause = () => { quizAudioPlaying = false; updateDuck() }
        }

        const playableUrl = (() => {
            try {
                return new URL(url, document.baseURI).href
            } catch {
                return url
            }
        })()

        if (currentQuizAudioUrl !== playableUrl) {
            quizAudio.pause()
            quizAudio.currentTime = 0
            quizAudio.src = playableUrl
            currentQuizAudioUrl = playableUrl
            quizAudio.load()
        } else {
            quizAudio.currentTime = 0
        }

        quizAudio.onended = () => {
            quizAudioPlaying = false
            updateDuck()
            if (quizAudioStatus) quizAudioStatus.textContent = 'Canto terminado'
            if (quizAudioButton) quizAudioButton.textContent = '🔊 Escuchar de nuevo'
        }

        quizAudio.onerror = () => {
            quizAudioPlaying = false
            updateDuck()
            if (quizAudioStatus) quizAudioStatus.textContent = 'No se pudo cargar el canto'
            if (quizAudioButton) quizAudioButton.textContent = '🔊 Intentar de nuevo'
            console.error('QUIZ AUDIO: no se pudo cargar', playableUrl, quizAudio?.error)
        }

        try {
            await quizAudio.play()

            if (quizAudioStatus) {
                quizAudioStatus.textContent = automatic
                    ? 'Escuchando canto…'
                    : 'Reproduciendo…'
            }

            if (quizAudioButton) {
                quizAudioButton.textContent = '🔊 Reproducir de nuevo'
            }

            const speciesId = quizQuestions[quizQuestionIndex]?.ave
            if (speciesId) birdQuiz.marcarAudioEscuchado(speciesId)
        } catch (error) {
            console.warn('QUIZ AUDIO: reproducción bloqueada o falló', error)
            if (quizAudioStatus) {
                quizAudioStatus.textContent = automatic
                    ? 'Toca “Escuchar canto” para reproducirlo'
                    : 'No se pudo reproducir el canto'
            }
            if (quizAudioButton) quizAudioButton.textContent = '🔊 Escuchar canto'
        }
    }

    const createAudioQuizQuestions = (): any[] => {
        const birdsWithAudio = catalog.filter((item: any) => {
            const audio = item?.audioCanto ?? item?.audio ?? item?.audioUrl
            return item?.nombre && typeof audio === 'string' && audio.trim()
        })

        if (birdsWithAudio.length < 2) return []

        return shuffleArray(birdsWithAudio).map((target: any) => {
            const distractors = shuffleArray(
                birdsWithAudio.filter((item: any) => String(item.id) !== String(target.id))
            ).slice(0, 3)

            const optionBirds = shuffleArray([target, ...distractors])
            const correctIndex = optionBirds.findIndex(
                (item: any) => String(item.id) === String(target.id)
            )

            return {
                id: `audio-${target.id}-${Date.now()}-${Math.random()}`,
                tipo: 'audio',
                pregunta: '¿A qué ave pertenece este canto?',
                opciones: optionBirds.map((item: any) => item.nombre),
                respuestaCorrecta: correctIndex,
                ave: target.id,
                audio: target.audioCanto ?? target.audio ?? target.audioUrl,
            }
        })
    }

    const prepareQuizQuestions = () => {
        const allQuestions = Array.isArray(birdQuiz.questions)
            ? [...birdQuiz.questions]
            : []

        const existingAudio = allQuestions.filter((question: any) => {
            const type = String(question?.tipo ?? '').toLowerCase()
            return (
                type === 'audio' ||
                type === 'canto' ||
                typeof question?.audio === 'string' ||
                typeof question?.audioUrl === 'string' ||
                typeof question?.audioCanto === 'string' ||
                typeof question?.canto === 'string'
            )
        })

        const generatedAudio = createAudioQuizQuestions()

        // Priorizamos 3 preguntas de canto para que el quiz siempre tenga
        // una parte dedicada a reconocer las aves por su sonido.
        const audioPool = shuffleArray([...existingAudio, ...generatedAudio])
        const audioCount = Math.min(3, audioPool.length)
        const selectedAudio = audioPool.slice(0, audioCount)

        const selectedIds = new Set(selectedAudio.map((question: any) => question?.id))

        const normalPool = shuffleArray(
            allQuestions.filter((question: any) => !selectedIds.has(question?.id))
        )

        const remaining = Math.max(0, 10 - selectedAudio.length)
        const selectedNormal = normalPool.slice(0, remaining)

        const combined = shuffleArray([...selectedAudio, ...selectedNormal])

        // Si el JSON tiene menos de 10 preguntas, usamos las disponibles.
        return combined.slice(0, Math.min(10, allQuestions.length + generatedAudio.length))
    }

    const openQuizLock = () => {
        closePanels(true)

        quizPanel.hidden = true
        quizPanel.classList.remove('is-visible')
        quizPanel.setAttribute('aria-hidden', 'true')

        showQuizOverlay(quizLock)

        quizFinished = false
        quizAnswers = []
        quizQuestionIndex = 0
        quizQuestions = []
        selectedQuizOption = -1

        const completo = birdQuiz.fichaYAudioCompletos()

        if (!completo) {
            sfx.play('quizLocked')

            quizLockMessage.textContent =
                'Revisa todas las fichas técnicas de las aves junto con sus audios para avanzar con el quiz.'

            quizStartButton.hidden = true
            return
        }

        sfx.play('panelOpen')

        quizLockMessage.textContent =
            '¡Estás listo para iniciar el quiz de las aves!'

        quizStartButton.hidden = false
    }

    quizCloseButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        sfx.play('quizClose')
        stopQuizAudio()
        hideQuizOverlay(quizLock)
    }, { passive: false })

    const renderQuizReview = () => {
        quizReview.innerHTML = ''

        quizAnswers.forEach((answer, index) => {
            const card = document.createElement('article')
            card.className = 'aves-quiz-review-card'

            const number = document.createElement('span')
            number.className = 'aves-quiz-review-number'
            number.textContent = `Pregunta ${index + 1}`

            const question = document.createElement('p')
            question.className = 'aves-quiz-review-question'
            question.textContent = answer.question

            const esCorrecta =
                answer.selectedIndex === answer.correctIndex

            const selected = document.createElement('p')
            selected.className =
                `aves-quiz-review-answer ${esCorrecta ? 'is-correct' : 'is-wrong'}`

            selected.textContent =
                `Tu respuesta: ${answer.options[answer.selectedIndex] ?? 'Sin respuesta'}`

            const correct = document.createElement('p')
            correct.className = 'aves-quiz-review-correct'
            correct.textContent =
                `Respuesta correcta: ${answer.options[answer.correctIndex] ?? 'No disponible'}`

            card.append(number, question, selected, correct)
            quizReview.append(card)
        })
    }

    const mostrarPreguntaQuiz = (pregunta: any) => {
        if (!pregunta) return

        quizFinished = false
        selectedQuizOption = -1

        quizResultsTitle.hidden = true
        quizReview.hidden = true
        quizScore.hidden = true

        quizNextButton.textContent = 'Siguiente'
        quizNextButton.disabled = true

        quizCounter.textContent =
            `Pregunta ${quizQuestionIndex + 1} de ${quizQuestions.length}`

        quizQuestion.textContent = pregunta.pregunta
        quizOptions.innerHTML = ''

        stopQuizAudio()

        // La barra de audio SOLO existe en preguntas de canto.
        if (isAudioQuizQuestion(pregunta)) {
            const audioUrl = resolveQuizAudioUrl(pregunta)

            if (audioUrl) {
                quizAudioPanel.hidden = false
                quizAudioButton.textContent = '🔊 Escuchar canto'
                quizAudioStatus.textContent = 'Toca “Escuchar canto” para reproducirlo'

                // El autoplay puede ser bloqueado por el navegador.
                // El botón queda siempre disponible para reproducirlo con un toque.
                void playQuizAudio(audioUrl, true)
            } else {
                quizAudioPanel.hidden = false
                quizAudioButton.textContent = '🔊 Escuchar canto'
                quizAudioStatus.textContent = 'Audio no disponible para esta pregunta'
            }
        } else {
            quizAudioPanel.hidden = true
            quizAudioStatus.textContent = ''
        }

        pregunta.opciones.forEach((opcion: string, indice: number) => {
            const button = document.createElement('button')

            button.type = 'button'
            button.className = 'aves-quiz-option'
            button.textContent = opcion
            button.setAttribute('data-quiz-option', String(indice))
            button.setAttribute('aria-pressed', 'false')

            let ultimoPointerUp = 0

            const seleccionarRespuesta = (event: Event) => {
                event.preventDefault()
                event.stopPropagation()

                if (quizFinished) return

                // Mismo sonido neutro para cualquier opción: no revela si es correcta.
                sfx.play('quizOption')

                /*
                 * Pulsar nuevamente la misma opción = deseleccionar.
                 */
                if (selectedQuizOption === indice) {
                    selectedQuizOption = -1

                    button.classList.remove('selected')
                    button.setAttribute('aria-pressed', 'false')

                    quizNextButton.disabled = true
                    return
                }

                /*
                 * Si se selecciona otra opción, quitamos la anterior
                 * antes de marcar la nueva. Así nunca hay dos seleccionadas.
                 */
                quizOptions
                    .querySelectorAll<HTMLButtonElement>('.aves-quiz-option')
                    .forEach(option => {
                        option.classList.remove('selected')
                        option.setAttribute('aria-pressed', 'false')
                    })

                selectedQuizOption = indice

                button.classList.add('selected')
                button.setAttribute('aria-pressed', 'true')

                quizNextButton.disabled = false
            }

            /*
             * pointerup funciona bien en el simulador móvil de 8th Wall.
             * click queda como respaldo para navegador/escritorio.
             */
            button.addEventListener(
                'pointerup',
                (event) => {
                    ultimoPointerUp = performance.now()
                    seleccionarRespuesta(event)
                },
                { passive: false }
            )

            /*
             * En algunos navegadores pointerup es seguido inmediatamente
             * por click. Evitamos procesar dos veces el mismo toque.
             */
            button.addEventListener(
                'click',
                (event) => {
                    if (performance.now() - ultimoPointerUp < 500) return
                    seleccionarRespuesta(event)
                },
                { passive: false }
            )

            quizOptions.append(button)
        })
    }

    console.log('EVENTO DEL BOTÓN INICIAR: registrado')

    quizStartButton.addEventListener('pointerup', (event) => {
        event.preventDefault()
        event.stopPropagation()

        console.log('QUIZ: pointerup en botón Iniciar')
    }, { passive: false })

    quizStartButton.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()

        console.log('INICIAR QUIZ: botón presionado')

        try {
            console.log('INICIAR QUIZ: cargando quiz.json...')

            await birdQuiz.cargarPreguntas()

            console.log(
                'INICIAR QUIZ: preguntas cargadas:',
                birdQuiz.questions.length
            )

            // Inicializamos BirdQuiz para conservar su estado interno y luego
            // construimos nuestro intento de exactamente 10 preguntas aleatorias.
            birdQuiz.iniciarQuiz()

            quizQuestions = prepareQuizQuestions()

            // La API existente de BirdQuiz utiliza currentQuestions. La
            // sincronizamos para que el resto del proyecto siga funcionando.
            birdQuiz.currentQuestions = [...quizQuestions]
            birdQuiz.currentQuestionIndex = 0

            quizQuestionIndex = 0
            quizAnswers = []
            quizFinished = false
            selectedQuizOption = -1

            const pregunta = quizQuestions[0]

            console.log(
                'INICIAR QUIZ: pregunta seleccionada:',
                pregunta
            )

            console.log(
                'INICIAR QUIZ: preguntas del intento:',
                quizQuestions.length
            )

            sfx.play('quizStart')

            hideQuizOverlay(quizLock)

            quizPanel.style.pointerEvents = 'auto'
            showQuizOverlay(quizPanel)

            mostrarPreguntaQuiz(pregunta)

            console.log('INICIAR QUIZ: panel mostrado')
        } catch (error) {
            console.error('INICIAR QUIZ: ERROR', error)

            sfx.play('error')

            quizLockMessage.textContent = labels.errorQuiz

            quizStartButton.hidden = false
        }
    }, { passive: false })

    quizAudioButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        const question = quizQuestions[quizQuestionIndex]
        if (!isAudioQuizQuestion(question)) return

        const url = resolveQuizAudioUrl(question)
        if (url) void playQuizAudio(url, false)
    }, { passive: false })

    quizNextButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (quizFinished) return

        /*
         * No se puede avanzar sin una respuesta seleccionada.
         */
        if (selectedQuizOption < 0) return

        const preguntaActual = quizQuestions[quizQuestionIndex]

        if (!preguntaActual) return

        /*
         * La respuesta se guarda solamente al pulsar Siguiente.
         * Durante la pregunta no se informa si fue correcta o incorrecta.
         */
        quizAnswers[quizQuestionIndex] = {
            question: preguntaActual.pregunta,
            options: [...preguntaActual.opciones],
            selectedIndex: selectedQuizOption,
            correctIndex: Number(preguntaActual.respuestaCorrecta)
        }

        const esUltimaPregunta =
            quizQuestionIndex >= quizQuestions.length - 1

        if (esUltimaPregunta) {
            quizFinished = true
            stopQuizAudio()
            quizAudioPanel.hidden = true

            const correctas = quizAnswers.reduce((total, answer) => {
                return total +
                    (answer.selectedIndex === answer.correctIndex ? 1 : 0)
            }, 0)

            const total = quizQuestions.length

            const porcentaje =
                total > 0 ? (correctas / total) * 100 : 0

            // Solo el resultado final distingue el puntaje (ya no hay nada que revelar).
            sfx.play(porcentaje >= QUIZ_PUNTAJE_ALTO ? 'quizFinishHigh' : 'quizFinish')

            quizQuestion.textContent = '¡Quiz terminado!'
            quizCounter.textContent = 'Resultado final'
            quizOptions.innerHTML = ''

            quizScore.textContent =
                `Puntaje: ${correctas}/${total} (${Math.round(porcentaje)}%)`

            quizScore.hidden = false

            quizResultsTitle.hidden = false
            quizReview.hidden = false

            renderQuizReview()

            quizNextButton.textContent = 'Finalizado'
            quizNextButton.disabled = true

            return
        }

        sfx.play('quizNext')

        quizQuestionIndex += 1
        selectedQuizOption = -1

        mostrarPreguntaQuiz(
            quizQuestions[quizQuestionIndex]
        )
    }, { passive: false })

    quizExitButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        sfx.play('quizClose')
        stopQuizAudio()
        hideQuizOverlay(quizPanel)

        quizFinished = false
        selectedQuizOption = -1
    }, { passive: false })

    const listening = get('.aves-listening')
    const listeningText = get('.aves-listening span')
    const audioToggle = get<HTMLButtonElement>('[data-audio="toggle"]')
    const audioClose = get<HTMLButtonElement>('[data-audio="close"]')
    let audioPaused = false
    listening.setAttribute('aria-label', labels.panelCanto)
    audioClose.setAttribute('aria-label', labels.cerrarCanto); audioClose.title = labels.cerrarCanto
    Array.from(listening.children).forEach(child => child.setAttribute('inert', ''))
    let audioWasPlayed = false
    const makeSong = () => createBirdAudio({
        url: bird.audioCanto,
        onState(state: string) {
            if (state === 'playing') {
                birdQuiz.marcarAudioEscuchado(bird.id)
            }
            const active = ['playing', 'paused', 'waiting'].includes(state) || (state === 'loading' && listening.classList.contains('is-open'))
            audioPaused = state === 'paused'
            // Los efectos de interfaz bajan de volumen mientras suena el canto.
            songPlaying = state === 'playing'
            updateDuck()
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
    get('h1').textContent = labels.titulo
    get('header p').textContent = birdText(labels.subtitulo)
    get('#aves-species-title').textContent = labels.catalogo
    const speciesTrigger = get<HTMLButtonElement>('[data-species-toggle]')
    speciesTrigger.setAttribute('aria-label', labels.seleccionarAve)
    speciesTrigger.title = labels.seleccionarAve
    const quizTrigger = get<HTMLButtonElement>('[data-quiz-toggle]')

    quizTrigger.addEventListener('click', openQuizLock)
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
        if (bird.fuenteComplementaria) {
            const source = document.createElement('a')
            source.textContent = bird.fuenteComplementaria.cita
            source.href = bird.fuenteComplementaria.url
            source.target = '_blank'; source.rel = 'noopener noreferrer'
            get('.aves-source').append(document.createTextNode(' · '), source)
        }
        const facts = get('.aves-facts'); facts.replaceChildren()
        if (bird.fichaNota) { const note = document.createElement('p'); note.textContent = bird.fichaNota; facts.append(note) }
        for (const [key, label] of [['descripcion', labels.descripcion], ['habitat', labels.habitat], ['comportamiento', labels.comportamiento], ['rasgos', labels.rasgos]]) {
            if (!bird.ficha?.[key]) continue
            const section = document.createElement('section')
            const heading = document.createElement('h3'); heading.textContent = label
            const text = document.createElement('p'); text.textContent = bird.ficha?.[key]
            section.append(heading, text); facts.append(section)
        }
        get('[data-action="idle"]').textContent = bird.etiquetaAnimacionInicial || labels.reposo
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
        const anyOpen = speciesOpen || !animationPanel.hidden || !get('#aves-info').hidden || !quizPanel.hidden
        closeSpecies(false, true); closeAnimation(true, true); quizPanel.hidden = true; quizLock.hidden = true
        root.querySelectorAll<HTMLElement>('.aves-panel').forEach(p => p.hidden = true)
        if (anyOpen && !silent) sfx.play('panelClose')
    }
    // La entrada utilizada por el tap ECS conserva su nombre; ahora presenta el círculo.
    // La guía tiene una función propia para que Ficha no vuelva a abrir el menú.
    const openGuide = () => {
        closePanels(true)
        get('#aves-info').hidden = false
        birdQuiz.marcarFichaVista(bird.id)
        sfx.play('panelOpen')
    }

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
        // Solo lectura: true si hay una ficha, panel, rueda radial o quiz abierto.
        // Lo usa el seguimiento del ave para pausar el ciclo sin tocar la interfaz.
        bloqueandoSeguimiento() {
            return !!speciesOpen || !animationPanel.hidden || !get<HTMLElement>('#aves-info').hidden ||
                !quizPanel.hidden || !quizLock.hidden || menu.classList.contains('is-open')
        },
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
                ESCANEO: labels.escaneo, COLOCANDO: labels.colocando, ATERRIZANDO: bird.mensajeLlegada || labels.aterrizando, EXPLORAR: labels.explorar,
                REUBICAR: labels.reubicando, ERROR: snapshot.message || labels.errorRecurso
            }
            setStatusMessage(!snapshot.trackingReady && ['ESCANEO', 'REUBICAR', 'ATERRIZANDO', 'EXPLORAR'].includes(phase) ? trackingMessage(snapshot) : birdText(messages[phase]))
            get('.aves-scan').hidden = reticulacion || !['ESCANEO', 'REUBICAR'].includes(phase)
            for (const action of ['idle', 'pause']) get<HTMLButtonElement>(`[data-action="${action}"]`).disabled = !placed
            get('[data-action="cancel"]').hidden = phase !== 'REUBICAR'
            get('[data-action="reset"]').hidden = !['COLOCANDO', 'ATERRIZANDO', 'ERROR'].includes(phase)
            get<HTMLButtonElement>('[data-action="reset"]').disabled = !snapshot.position && phase !== 'ERROR'
            if (!placed) { song.stop(); closePanels(true); closeRadial(true) }
        },
        dispose() {
            song.dispose()
            stopQuizAudio()
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