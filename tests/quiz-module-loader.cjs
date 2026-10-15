// Carga src/quiz.js fuera de webpack para probarlo con el runner de Node.
//
// En el build, `import quizData from './data/quiz.json'` lo resuelve webpack.
// El runner de Node no puede importar un JSON sin atributos de importación
// (`with { type: 'json' }`) y, además, un `import` relativo no funciona desde
// una URL `data:`. Por eso aquí leemos el JSON real y lo inyectamos en lugar del
// import estático; el resto del archivo se ejecuta tal cual.

const fs = require('node:fs')
const path = require('node:path')

const quizImport = /import\s+quizData\s+from\s+['"]\.\/data\/quiz\.json['"][ \t]*\r?\n?/

function readQuizJson () {
  return fs.readFileSync(path.join(__dirname, '..', 'src/data/quiz.json'), 'utf8')
}

// Inyecta `json` (texto JSON) en lugar del import estático de quiz.json.
function loadBirdQuizWith (json) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/quiz.js'), 'utf8')

  if (!quizImport.test(source)) {
    throw new Error('No se encontró `import quizData from \'./data/quiz.json\'` en src/quiz.js')
  }

  const transformed = source.replace(quizImport, `const quizData = ${json}\n`)
  const url = 'data:text/javascript;base64,' + Buffer.from(transformed).toString('base64')

  return import(url)
}

// Carga el módulo con el quiz.json real del proyecto.
function loadBirdQuizModule () {
  return loadBirdQuizWith(readQuizJson())
}

module.exports = {loadBirdQuizModule, loadBirdQuizWith, readQuizJson}
