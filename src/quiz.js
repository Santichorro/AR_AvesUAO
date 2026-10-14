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
     * Carga quiz.json desde src/data/quiz.json.
     *
     * IMPORTANTE:
     * No usamos "/data/quiz.json", porque eso busca el archivo
     * en la raíz pública del servidor.
     *
     * import.meta.url hace que la ruta sea relativa a quiz.js.
     */
    async cargarPreguntas() {
        console.log('BIRD QUIZ: iniciando carga de quiz.json...')

        try {
            const quizUrl = new URL('./data/quiz.json', import.meta.url)

            console.log(
                'BIRD QUIZ: URL generada:',
                quizUrl.href
            )

            const response = await fetch(quizUrl)

            console.log(
                'BIRD QUIZ: respuesta HTTP:',
                response.status,
                response.statusText
            )

            if (!response.ok) {
                throw new Error(
                    `No se pudo cargar quiz.json: ${response.status} ${response.statusText}`
                )
            }

            const data = await response.json()

            console.log(
                'BIRD QUIZ: JSON recibido:',
                data
            )

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

            if (Array.isArray(data)) {
                preguntas = data
            } else if (Array.isArray(data.preguntas)) {
                preguntas = data.preguntas
            } else if (Array.isArray(data.quiz)) {
                preguntas = data.quiz
            } else if (Array.isArray(data.questions)) {
                preguntas = data.questions
            }

            if (!preguntas.length) {
                throw new Error(
                    'quiz.json fue cargado correctamente, pero no contiene preguntas válidas.'
                )
            }

            this.questions = preguntas.map((pregunta, index) => {
                const opciones = Array.isArray(pregunta.opciones)
                    ? pregunta.opciones
                    : Array.isArray(pregunta.options)
                        ? pregunta.options
                        : []

                let respuestaCorrecta

                if (
                    typeof pregunta.respuestaCorrecta === 'number'
                ) {
                    respuestaCorrecta = pregunta.respuestaCorrecta
                } else if (
                    typeof pregunta.correcta === 'number'
                ) {
                    respuestaCorrecta = pregunta.correcta
                } else if (
                    typeof pregunta.correctIndex === 'number'
                ) {
                    respuestaCorrecta = pregunta.correctIndex
                } else if (
                    typeof pregunta.respuesta === 'number'
                ) {
                    respuestaCorrecta = pregunta.respuesta
                } else {
                    respuestaCorrecta = 0
                }

                return {
                    ...pregunta,

                    pregunta:
                        pregunta.pregunta ??
                        pregunta.question ??
                        `Pregunta ${index + 1}`,

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