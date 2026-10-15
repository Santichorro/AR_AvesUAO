const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const {loadBirdQuizModule}=require('./quiz-module-loader.cjs')
const root=path.join(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8')
const birds=JSON.parse(read('src/data/aves.json')).aves
const bird=birds.find(b=>b.id==='carpintero')

test('carpintero conserva el modelo aportado y solo ofrece su clip real de aleteo',()=>{
 const bytes=fs.readFileSync(path.join(root,'src',bird.modelo))
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),bird.creditoModelo.sha256)
 assert.equal(bytes.readUInt32LE(8),bytes.length)
 const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))
 assert.deepEqual(gltf.animations.map(a=>a.name),['Animation'])
 assert.deepEqual(bird.clips.map(c=>c.nombre),['Animation'])
 for(const name of Object.values(bird.animaciones))assert.ok(gltf.animations.some(a=>a.name===name))
 assert.equal(bird.animaciones.aterrizaje,undefined)
 assert.equal(bird.animaciones.despegue,undefined)
 assert.match(bird.clips[0].etiqueta,/aleteo/i)
 const end=Math.max(...gltf.animations[0].samplers.map(s=>gltf.accessors[s.input].max[0]))
 assert.equal(bird.clips[0].duracionSegundos,end)
 assert.equal(bird.llegada.calibracion,undefined)
 assert.ok(bird.inspeccion.escalaMinima<bird.escalaExhibicion&&bird.inspeccion.escalaMaxima>bird.escalaExhibicion)
 assert.equal(bird.nombreCientifico,'Melanerpes rubricapillus')
 assert.equal(bird.familia,'Picidae')
 assert.deepEqual(bird.fuente.paginas,[22])
 for(const field of ['descripcion','habitat','comportamiento','rasgos'])assert.ok(bird.ficha[field])
 assert.equal(bird.fuenteComplementaria.seccion,'comportamiento')
 for(const [field,credit] of [['imagen','creditoImagen'],['audioCanto','creditoAudio']]){
  const data=fs.readFileSync(path.join(root,'src',bird[field]))
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),bird[credit].sha256)
 }
})

test('llegada sin aterrizaje genera un origen válido y conserva el offset sin inventar compensación',async()=>{
 const {ArrivalMotion}=await import('data:text/javascript;base64,'+Buffer.from(read('src/arrival-motion.js')).toString('base64'))
 const motion=new ArrivalMotion(bird.llegada,undefined,()=>.5),target={x:1,y:.3,z:-2}
 const pose=motion.begin(target,5,bird.escalaExhibicion,bird.transformacion.giroY,bird.transformacion.posicionLocal)
 assert.ok(pose.position.y>target.y)
 assert.deepEqual(pose.localPosition,bird.transformacion.posicionLocal)
 assert.equal(pose.clipTime,0)
 assert.equal(motion.advance(1,6),null)
 assert.deepEqual(motion.advance(bird.llegada.duracionSegundos,5).position,target)
 motion.cancel();assert.equal(motion.advance(1,5),null)
})

test('preguntas del carpintero participan en el quiz y sus respuestas se puntúan una sola vez',async()=>{
 const data=JSON.parse(read('src/data/quiz.json')),questions=data.preguntas.filter(q=>q.ave==='carpintero')
 assert.equal(questions.length,5)
 assert.equal(new Set(data.preguntas.map(q=>q.id)).size,data.preguntas.length)
 for(const q of questions){assert.equal(q.opciones.length,4);assert.ok(q.respuestaCorrecta>=0&&q.respuestaCorrecta<4);assert.ok(q.explicacion);assert.equal(q.fuente.pagina,22)}
 const {BirdQuiz}=await loadBirdQuizModule()
 const quiz=new BirdQuiz();quiz.loaded=true;quiz.questions=questions;quiz.iniciarQuiz()
 assert.equal(quiz.currentQuestions.length,5)
 for(let i=0;i<5;i++){
  const q=quiz.currentQuestions[i];assert.equal(quiz.responder(q.respuestaCorrecta).correcta,true)
  assert.equal(quiz.responder(q.respuestaCorrecta).estado,'ya_respondida')
  const result=quiz.siguientePregunta();if(i===4){assert.equal(result.terminado,true);assert.equal(result.score,5);assert.equal(result.porcentaje,100)}
 }
})
