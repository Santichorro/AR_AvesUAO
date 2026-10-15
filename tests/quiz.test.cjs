const {test} = require('node:test')
const assert = require('node:assert/strict')
const {loadBirdQuizModule, loadBirdQuizWith, readQuizJson} = require('./quiz-module-loader.cjs')

const data = JSON.parse(readQuizJson())

test('quiz.json contiene 25 preguntas completas', () => {
  assert.equal(data.preguntas.length, 25)
  assert.equal(new Set(data.preguntas.map(q => q.id)).size, 25, 'los id deben ser únicos')
  data.preguntas.forEach((q, i) => {
    const marca = `pregunta ${i + 1} (${q.id})`
    assert.equal(typeof q.pregunta, 'string', `${marca} sin enunciado`)
    assert.ok(q.pregunta.trim().length > 0, `${marca} con enunciado vacío`)
    assert.ok(Array.isArray(q.opciones) && q.opciones.length >= 2, `${marca} sin opciones`)
    assert.ok(
      Number.isInteger(q.respuestaCorrecta) &&
      q.respuestaCorrecta >= 0 &&
      q.respuestaCorrecta < q.opciones.length,
      `${marca} con respuesta correcta fuera de rango`
    )
  })
})

test('cargarPreguntas mapea las 25 preguntas sin usar la red', async () => {
  const {BirdQuiz} = await loadBirdQuizModule()
  const quiz = new BirdQuiz()

  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = () => {
    fetchCalls++
    throw new Error('cargarPreguntas no debe llamar a fetch')
  }

  try {
    const preguntas = await quiz.cargarPreguntas()

    assert.equal(fetchCalls, 0, 'cargarPreguntas hizo una petición de red')
    assert.equal(quiz.loaded, true)
    assert.equal(preguntas.length, 25)
    assert.equal(quiz.questions.length, 25)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('el mapeo de BirdQuiz conserva enunciado, opciones y respuesta correcta', async () => {
  const {BirdQuiz} = await loadBirdQuizModule()
  const quiz = new BirdQuiz()
  await quiz.cargarPreguntas()

  quiz.questions.forEach((q, i) => {
    const fuente = data.preguntas[i]
    assert.equal(q.id, fuente.id)
    assert.equal(q.pregunta, fuente.pregunta)
    assert.deepEqual(q.opciones, fuente.opciones)
    assert.equal(q.respuestaCorrecta, fuente.respuestaCorrecta)
  })
})

// Silencia el console del módulo mientras se comprueba un error esperado.
async function rejectsQuietly (json, pattern) {
  const {BirdQuiz} = await loadBirdQuizWith(json)
  const log = console.log
  const error = console.error
  console.log = () => {}
  console.error = () => {}
  try {
    await assert.rejects(() => new BirdQuiz().cargarPreguntas(), pattern)
  } finally {
    console.log = log
    console.error = error
  }
}

test('cargarPreguntas falla con un mensaje claro si no hay preguntas', () =>
  rejectsQuietly('{"preguntas":[]}', /no contiene preguntas válidas/))

test('cargarPreguntas falla si una pregunta no tiene enunciado', () =>
  rejectsQuietly('{"preguntas":[{"opciones":["a","b"],"respuestaCorrecta":0}]}', /pregunta 1 no tiene enunciado/))

test('cargarPreguntas falla si una pregunta no tiene opciones suficientes', () =>
  rejectsQuietly('{"preguntas":[{"pregunta":"¿Cuál?","opciones":["a"],"respuestaCorrecta":0}]}', /pregunta 1 no tiene opciones válidas/))

test('cargarPreguntas falla si la respuesta correcta está fuera de rango', () =>
  rejectsQuietly('{"preguntas":[{"pregunta":"¿Cuál?","opciones":["a","b"],"respuestaCorrecta":5}]}', /pregunta 1 tiene una respuesta correcta fuera de rango/))
