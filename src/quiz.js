import quizData from './data/quiz.json'

export class BirdQuiz {
    constructor() {
        this.questions = []
        this.currentQuestions = []
        this.currentQuestionIndex = 0
        this.score = 0

        this.answered = []
        this.audioListened = new Set()
        this.fichasVistas = new Set()

        this.loaded = false
    }

    /**
     * Carga las preguntas del quiz.
     *
     * IMPORTANTE:
     * Las preguntas viajan dentro del paquete: quiz.json se importa de forma
     * estática (arriba), así que ya no hay ninguna petición de red ni una ruta
     * con hash que se pueda perder al publicar. Se conserva `async` para no
     * romper el `await birdQuiz.cargarPreguntas()` de pilot-ui.ts, aunque no
     * espere ninguna red.
     */
    async cargarPreguntas() {
        console.log('BIRD QUIZ: inicializando preguntas desde quiz.json...')

        try {
            /*
             * Admitimos varias estructuras posibles.
             *
             * Caso 1:
             * {
             *   "preguntas": [...]
             * }
             *
             * Caso 2:
             * [...]
             *
             * Caso 3:
             * {
             *   "quiz": [...]
             * }
             */
            let preguntas = []

            if (Array.isArray(quizData)) {
                preguntas = quizData
            } else if (Array.isArray(quizData?.preguntas)) {
                preguntas = quizData.preguntas
            } else if (Array.isArray(quizData?.quiz)) {
                preguntas = quizData.quiz
            } else if (Array.isArray(quizData?.questions)) {
                preguntas = quizData.questions
            }

            if (!preguntas.length) {
                throw new Error(
                    'quiz.json no contiene preguntas válidas.'
                )
            }

            this.questions = preguntas.map((pregunta, index) => {
                const opciones = Array.isArray(pregunta?.opciones)
                    ? pregunta.opciones
                    : Array.isArray(pregunta?.options)
                        ? pregunta.options
                        : []

                let respuestaCorrecta

                if (
                    typeof pregunta?.respuestaCorrecta === 'number'
                ) {
                    respuestaCorrecta = pregunta.respuestaCorrecta
                } else if (
                    typeof pregunta?.correcta === 'number'
                ) {
                    respuestaCorrecta = pregunta.correcta
                } else if (
                    typeof pregunta?.correctIndex === 'number'
                ) {
                    respuestaCorrecta = pregunta.correctIndex
                } else if (
                    typeof pregunta?.respuesta === 'number'
                ) {
                    respuestaCorrecta = pregunta.respuesta
                } else {
                    respuestaCorrecta = -1
                }

                const enunciado =
                    pregunta?.pregunta ??
                    pregunta?.question ??
                    (typeof pregunta?.enunciado === 'string'
                        ? pregunta.enunciado
                        : undefined)

                /*
                 * Validación: cada pregunta debe traer enunciado, opciones y
                 * una respuesta correcta que exista dentro de las opciones.
                 * Si algo falta, el error dice exactamente cuál pregunta es.
                 */
                if (
                    typeof enunciado !== 'string' ||
                    !enunciado.trim()
                ) {
                    throw new Error(
                        `quiz.json: la pregunta ${index + 1} no tiene enunciado.`
                    )
                }

                if (opciones.length < 2) {
                    throw new Error(
                        `quiz.json: la pregunta ${index + 1} no tiene opciones válidas.`
                    )
                }

                if (
                    !Number.isInteger(respuestaCorrecta) ||
                    respuestaCorrecta < 0 ||
                    respuestaCorrecta >= opciones.length
                ) {
                    throw new Error(
                        `quiz.json: la pregunta ${index + 1} tiene una respuesta correcta fuera de rango.`
                    )
                }

                return {
                    ...pregunta,

                    pregunta: enunciado,

                    opciones,

                    respuestaCorrecta
                }
            })

            this.loaded = true

            console.log(
                `BIRD QUIZ: ${this.questions.length} preguntas cargadas correctamente.`
            )

            return this.questions
        } catch (error) {
            console.error(
                'BIRD QUIZ: ERROR cargando quiz.json:',
                error
            )

            throw error
        }
    }

    /**
     * Inicia una nueva partida.
     */
    iniciarQuiz() {
        if (!this.loaded || !this.questions.length) {
            throw new Error(
                'El quiz todavía no ha cargado las preguntas.'
            )
        }

        this.currentQuestionIndex = 0
        this.score = 0
        this.answered = []

        /*
         * Copiamos las preguntas para no modificar
         * el arreglo original.
         */
        this.currentQuestions = [...this.questions]

        /*
         * Mezclamos las preguntas.
         * Si quieres que siempre aparezcan en el mismo orden,
         * elimina este bloque.
         */
        for (
            let i = this.currentQuestions.length - 1;
            i > 0;
            i--
        ) {
            const j = Math.floor(Math.random() * (i + 1))

            const temp = this.currentQuestions[i]

            this.currentQuestions[i] =
                this.currentQuestions[j]

            this.currentQuestions[j] = temp
        }

        console.log(
            'BIRD QUIZ: quiz iniciado:',
            this.currentQuestions.length,
            'preguntas'
        )

        return this.currentQuestions[0]
    }

    /**
     * Registra la respuesta seleccionada.
     *
     * IMPORTANTE:
     * Aquí NO mostramos si es correcta o incorrecta.
     * Solo guardamos la respuesta.
     */
    responder(indice) {
        const pregunta =
            this.currentQuestions[this.currentQuestionIndex]

        if (!pregunta) {
            return {
                estado: 'sin_pregunta',
                correcta: false
            }
        }

        /*
         * Evitamos responder dos veces la misma pregunta.
         */
        if (
            this.answered[this.currentQuestionIndex] !== undefined
        ) {
            return {
                estado: 'ya_respondida',
                correcta:
                    this.answered[this.currentQuestionIndex] ===
                    pregunta.respuestaCorrecta
            }
        }

        const correcta =
            indice === pregunta.respuestaCorrecta

        /*
         * Guardamos únicamente el índice.
         */
        this.answered[this.currentQuestionIndex] = indice

        /*
         * El puntaje se actualiza internamente,
         * pero NO se muestra todavía.
         */
        if (correcta) {
            this.score++
        }

        return {
            estado: 'respondida',
            correcta,
            indiceSeleccionado: indice,
            indiceCorrecto: pregunta.respuestaCorrecta
        }
    }

    /**
     * Avanza a la siguiente pregunta.
     *
     * IMPORTANTE:
     * Se permite avanzar aunque la respuesta anterior
     * haya sido incorrecta.
     */
    siguientePregunta() {
        if (!this.currentQuestions.length) {
            return {
                permitido: false,
                terminado: true,
                score: 0,
                total: 0,
                porcentaje: 0
            }
        }

        /*
         * Si todavía no respondió esta pregunta,
         * no permitimos avanzar.
         */
        if (
            this.answered[this.currentQuestionIndex] === undefined
        ) {
            return {
                permitido: false,
                terminado: false,
                pregunta:
                    this.currentQuestions[
                        this.currentQuestionIndex
                    ]
            }
        }

        this.currentQuestionIndex++

        /*
         * Ya terminó.
         */
        if (
            this.currentQuestionIndex >=
            this.currentQuestions.length
        ) {
            const total = this.currentQuestions.length

            const porcentaje =
                total > 0
                    ? (this.score / total) * 100
                    : 0

            return {
                permitido: true,
                terminado: true,
                score: this.score,
                total,
                porcentaje
            }
        }

        return {
            permitido: true,
            terminado: false,
            pregunta:
                this.currentQuestions[
                    this.currentQuestionIndex
                ]
        }
    }

    /**
     * Devuelve si ya se completaron las fichas y audios
     * necesarios para poder iniciar el quiz.
     *
     * Se mantiene compatible con pilot-ui.ts.
     */
    fichaYAudioCompletos() {
        /*
         * Si todavía no tenemos un catálogo registrado,
         * permitimos continuar.
         *
         * El sistema actual registra los audios cuando
         * empiezan a reproducirse.
         */
        return true
    }

    /**
     * Marca que el usuario escuchó el audio de un ave.
     */
    marcarAudioEscuchado(id) {
        if (id !== undefined && id !== null) {
            this.audioListened.add(id)
        }
    }

    /**
     * Permite registrar que se visitó una ficha.
     */
    marcarFichaVista(id) {
        if (id !== undefined && id !== null) {
            this.fichasVistas.add(id)
        }
    }

    /**
     * Permite consultar si un audio fue escuchado.
     */
    audioFueEscuchado(id) {
        return this.audioListened.has(id)
    }

    /**
     * Permite consultar si una ficha fue vista.
     */
    fichaFueVista(id) {
        return this.fichasVistas.has(id)
    }

    /**
     * Reinicia completamente el estado del quiz.
     */
    reiniciar() {
        this.currentQuestions = []
        this.currentQuestionIndex = 0
        this.score = 0
        this.answered = []
    }

    /**
     * Devuelve el estado actual.
     */
    obtenerEstado() {
        return {
            currentQuestionIndex:
                this.currentQuestionIndex,

            totalPreguntas:
                this.currentQuestions.length,

            score:
                this.score,

            respuestas:
                [...this.answered]
        }
    }
}