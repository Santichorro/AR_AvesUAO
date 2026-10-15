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

test('normalizarConfig: modo de colocación por defecto, aceptado e inválido',async()=>{
 const {normalizarConfig,DEFAULTS}=await modulePromise
 assert.equal(DEFAULTS.modoColocacion,'toque') // por defecto se coloca donde se toca
 assert.equal(normalizarConfig(undefined).modoColocacion,'toque')
 assert.equal(normalizarConfig({modoColocacion:'centro'}).modoColocacion,'centro') // se respeta
 assert.equal(normalizarConfig({modoColocacion:'toque'}).modoColocacion,'toque')
 // Un valor desconocido no cambia el defecto.
 assert.equal(normalizarConfig({modoColocacion:'esquina'}).modoColocacion,'toque')
 assert.equal(normalizarConfig({modoColocacion:3}).modoColocacion,'toque')
})

// Cámara horizontal mirando en -Z, subiendo con +Y y a la derecha con +X, fov vertical 90°.
const CAMARA_RECTA={posicion:{x:0,y:1.6,z:0},derecha:{x:1,y:0,z:0},arriba:{x:0,y:1,z:0},adelante:{x:0,y:0,z:-1},fovGrados:90,aspecto:1}
const cerca=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`)
const cercaPunto=(p,q,eps=1e-6)=>{cerca(p.x,q.x,eps);cerca(p.y,q.y,eps);cerca(p.z,q.z,eps)}

test('rayo desde el píxel: centro, esquinas y aspecto',async()=>{
 const {rayoDesdePantalla}=await modulePromise
 // Centro de la pantalla: el rayo es la dirección de vista.
 const centro=rayoDesdePantalla({x:0.5,y:0.5},CAMARA_RECTA)
 cercaPunto(centro.direccion,{x:0,y:0,z:-1})
 cercaPunto(centro.origen,{x:0,y:1.6,z:0})
 // Esquina superior derecha: adelante + derecha + arriba (fov 90°, aspecto 1) -> (1,1,-1)/√3.
 const tercio=1/Math.sqrt(3)
 const supDer=rayoDesdePantalla({x:1,y:0},CAMARA_RECTA)
 cercaPunto(supDer.direccion,{x:tercio,y:tercio,z:-tercio})
 // Esquina inferior izquierda: adelante - derecha - arriba -> (-1,-1,-1)/√3.
 const infIzq=rayoDesdePantalla({x:0,y:1},CAMARA_RECTA)
 cercaPunto(infIzq.direccion,{x:-tercio,y:-tercio,z:-tercio})
 // Un aspecto 2 estira la componente horizontal en el borde derecho.
 const ancho=rayoDesdePantalla({x:1,y:0.5},{...CAMARA_RECTA,aspecto:2})
 const n=Math.hypot(2,0,-1)
 cercaPunto(ancho.direccion,{x:2/n,y:0,z:-1/n})
 // La dirección siempre es unitaria.
 for(const d of [centro.direccion,supDer.direccion,infIzq.direccion,ancho.direccion])cerca(Math.hypot(d.x,d.y,d.z),1)
})

test('rayo desde el píxel: un toque arriba del horizonte no corta el suelo',async()=>{
 const {rayoDesdePantalla,interseccionRayoPlanoY,anguloBajoHorizonte}=await modulePromise
 // Con la cámara horizontal, el borde superior apunta por encima del horizonte (y > 0).
 const arriba=rayoDesdePantalla({x:0.5,y:0},CAMARA_RECTA)
 assert.ok(arriba.direccion.y>0)
 assert.ok(anguloBajoHorizonte(arriba.direccion)<0)
 assert.equal(interseccionRayoPlanoY(arriba.origen,arriba.direccion,0),null)
 // El borde inferior sí corta por delante del plano y=0.
 const abajo=rayoDesdePantalla({x:0.5,y:1},CAMARA_RECTA)
 const corte=interseccionRayoPlanoY(abajo.origen,abajo.direccion,0)
 assert.ok(corte&&corte.y===0&&corte.z<0)
 // Entradas no válidas.
 assert.equal(rayoDesdePantalla(null,CAMARA_RECTA),null)
 assert.equal(rayoDesdePantalla({x:NaN,y:0.5},CAMARA_RECTA),null)
 assert.equal(rayoDesdePantalla({x:0.5,y:0.5},null),null)
 assert.equal(rayoDesdePantalla({x:0.5,y:0.5},{...CAMARA_RECTA,fovGrados:0}),null)
 assert.equal(rayoDesdePantalla({x:0.5,y:0.5},{...CAMARA_RECTA,aspecto:0}),null)
 assert.equal(rayoDesdePantalla({x:0.5,y:0.5},{...CAMARA_RECTA,adelante:{x:0,y:0,z:0}}),null)
})
