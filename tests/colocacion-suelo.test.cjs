const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const src=fs.readFileSync(path.join(__dirname,'../src/colocacion-suelo.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`)

// Pose de referencia: cámara a 1.6 m mirando 45° hacia el suelo (más de 15° bajo el horizonte).
const POSE_VALIDA={posicion:{x:0,y:1.6,z:0},adelante:{x:0,y:-1,z:-1}}

test('intersección rayo-plano: solo acepta cortes por delante',async()=>{
 const {interseccionRayoPlanoY}=await modulePromise
 const abajo=interseccionRayoPlanoY({x:0,y:1.6,z:0},{x:0,y:-1,z:0},0)
 assert.deepEqual(abajo,{x:0,y:0,z:0})
 // Rayo inclinado: t = 1.6/0.8 = 2 y avanza 2 en -Z.
 const inclinado=interseccionRayoPlanoY({x:0,y:1.6,z:0},{x:0,y:-0.8,z:-1},0)
 near(inclinado.z,-2)
 // Horizontal: paralelo al plano.
 assert.equal(interseccionRayoPlanoY({x:0,y:1.6,z:0},{x:0,y:0,z:-1},0),null)
 // Hacia arriba: cortaría por detrás (t < 0).
 assert.equal(interseccionRayoPlanoY({x:0,y:1.6,z:0},{x:0,y:1,z:0},0),null)
 // Por debajo del plano y mirando hacia abajo: el corte también queda detrás.
 assert.equal(interseccionRayoPlanoY({x:0,y:-1,z:0},{x:0,y:-1,z:0},0),null)
 // Ya por debajo del plano y mirando hacia arriba: sí lo corta por delante (t = 1).
 assert.deepEqual(interseccionRayoPlanoY({x:0,y:-1,z:0},{x:0,y:1,z:0},0),{x:0,y:0,z:0})
 // Entradas no finitas.
 assert.equal(interseccionRayoPlanoY({x:NaN,y:0,z:0},{x:0,y:-1,z:0},0),null)
 assert.equal(interseccionRayoPlanoY({x:0,y:1,z:0},{x:0,y:NaN,z:0},0),null)
})

test('ángulo bajo el horizonte: 0 horizontal, 90 vertical, negativo hacia arriba',async()=>{
 const {anguloBajoHorizonte}=await modulePromise
 near(anguloBajoHorizonte({x:0,y:-1,z:0}),90)
 near(anguloBajoHorizonte({x:0,y:0,z:-1}),0)
 near(anguloBajoHorizonte({x:0,y:1,z:0}),-90)
 near(anguloBajoHorizonte({x:0,y:-1,z:-1}),45)
 // No depende de la magnitud de la dirección.
 near(anguloBajoHorizonte({x:0,y:-50,z:-50}),45)
 assert.equal(anguloBajoHorizonte({x:0,y:NaN,z:0}),null)
})

test('validar punto: distancia, altura y ángulo del rayo',async()=>{
 const {validarPuntoSuelo}=await modulePromise
 const cfg={distanciaMaxima:4,toleranciaAltura:0.05,anguloMinimoGrados:15}
 assert.deepEqual(validarPuntoSuelo({x:1,y:0,z:1},POSE_VALIDA,cfg),{valido:true,motivo:null})
 // Más allá de la distancia máxima.
 assert.deepEqual(validarPuntoSuelo({x:0,y:0,z:-5},POSE_VALIDA,cfg),{valido:false,motivo:'distancia'})
 // Fuera de la tolerancia de altura.
 assert.deepEqual(validarPuntoSuelo({x:1,y:0.5,z:1},POSE_VALIDA,cfg),{valido:false,motivo:'altura'})
 // Rayo casi horizontal (5° < 15°).
 const posePlana={posicion:{x:0,y:1.6,z:0},adelante:{x:0,y:-0.087,z:-1}}
 assert.deepEqual(validarPuntoSuelo({x:1,y:0,z:1},posePlana,cfg),{valido:false,motivo:'angulo'})
 // Sin pose o punto inválido.
 assert.deepEqual(validarPuntoSuelo({x:1,y:0,z:1},null,cfg),{valido:false,motivo:'invalido'})
 assert.deepEqual(validarPuntoSuelo(null,POSE_VALIDA,cfg),{valido:false,motivo:'invalido'})
})

test('validar punto: la configuración desactivada acepta cualquier punto',async()=>{
 const {validarPuntoSuelo}=await modulePromise
 assert.deepEqual(validarPuntoSuelo({x:99,y:9,z:99},null,{habilitado:false}),{valido:true,motivo:null})
 assert.deepEqual(validarPuntoSuelo(null,POSE_VALIDA,{habilitado:false}),{valido:true,motivo:null})
})

test('suavizado: independiente de los FPS y sin salto cuando tau > 0',async()=>{
 const {acercarPuntoSuave}=await modulePromise
 // Sin punto previo se adopta el objetivo.
 assert.deepEqual(acercarPuntoSuave(null,{x:1,y:0,z:2},1/60,0.12),{x:1,y:0,z:2})
 // Dos pasos de 50 ms equivalen a uno de 100 ms con la misma constante de tiempo.
 const uno=acercarPuntoSuave({x:0,y:0,z:0},{x:1,y:0,z:0},0.1,0.12)
 const medio=acercarPuntoSuave({x:0,y:0,z:0},{x:1,y:0,z:0},0.05,0.12)
 const dos=acercarPuntoSuave(medio,{x:1,y:0,z:0},0.05,0.12)
 near(uno.x,dos.x,1e-12)
 assert.ok(uno.x>0&&uno.x<1)
 // tau = 0 salta directamente.
 assert.deepEqual(acercarPuntoSuave({x:0,y:0,z:0},{x:2,y:0,z:0},1,0),{x:2,y:0,z:0})
})

test('normalizarConfig: valores por defecto, anulaciones y entradas inválidas',async()=>{
 const {normalizarConfig,DEFAULTS}=await modulePromise
 assert.deepEqual(normalizarConfig(undefined),{...DEFAULTS})
 assert.equal(normalizarConfig(undefined).distanciaMaxima,4)
 assert.equal(normalizarConfig(undefined).toleranciaAltura,0.05)
 assert.equal(normalizarConfig(undefined).anguloMinimoGrados,15)
 const custom=normalizarConfig({distanciaMaxima:8,habilitado:false,reticulaSuelo:false,anguloMinimoGrados:-3})
 assert.equal(custom.distanciaMaxima,8)
 assert.equal(custom.habilitado,false)
 assert.equal(custom.reticulaSuelo,false)
 assert.equal(custom.anguloMinimoGrados,15) // negativo: se ignora y queda el defecto
 assert.equal(normalizarConfig({distanciaMaxima:'x'}).distanciaMaxima,4) // no numérico: defecto
})
