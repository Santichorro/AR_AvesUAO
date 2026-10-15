const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const src=fs.readFileSync(path.join(__dirname,'../src/bird-follow.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`)
const CAMARA={x:0,y:1.6,z:6},ADELANTE={x:0,y:0,z:-1},DT=1/60
const ave=(over={})=>({anguloFrente:0,giroY:0,tieneDespegue:true,tieneAterrizaje:true,duracionDespegue:1,...over})
const config=(over={})=>({pausaSegundos:0,distanciaActivacion:5,distanciaAcercamiento:1.5,
 distanciaInicioAterrizaje:2,velocidadVuelo:2,alturaCrucero:0.5,transicionAlturaSegundos:0.5,...over})

test('geometría horizontal: ignora la altura y normaliza la dirección',async()=>{
 const {distanciaHorizontal,direccionHorizontal,direccionMirada,puntoDestinoFrente}=await modulePromise
 near(distanciaHorizontal({x:0,y:0,z:0},{x:3,y:9,z:4}),5)
 assert.deepEqual(direccionHorizontal({x:0,y:0,z:0},{x:0,y:5,z:10}),{x:0,z:1})
 assert.equal(direccionHorizontal({x:1,y:0,z:1},{x:1,y:4,z:1}),null)
 // Proyección horizontal del frente.
 assert.deepEqual(direccionMirada({x:1.5,y:0,z:2},0.15,null),{x:0.6,z:0.8})
 // Casi vertical: conserva la última válida, o null si no hay.
 assert.deepEqual(direccionMirada({x:0.01,y:0.99,z:0},0.15,{x:1,z:0}),{x:1,z:0})
 assert.equal(direccionMirada({x:0,y:1,z:0},0.15,null),null)
 // Destino: distanciaAcercamiento delante del objetivo, al nivel del suelo.
 assert.deepEqual(puntoDestinoFrente({x:0,y:1.6,z:6},{x:0,z:-1},1.5,0),{x:0,y:0,z:4.5})
})

test('yaw: alinea el frente del modelo con la dirección y limita el giro',async()=>{
 const {yawHacia,acercarAngulo}=await modulePromise
 near(yawHacia({x:0,z:1},0,0),0)
 near(yawHacia({x:1,z:0},0,0),Math.PI/2)
 // El ángulo de frente y el giro del modelo se compensan (0 en las cuatro aves).
 near(yawHacia({x:1,z:0},Math.PI/2,-Math.PI/2),Math.PI/2)
 near(acercarAngulo(0,0.5,1),0.5)
 near(acercarAngulo(0,Math.PI,0.25),0.25)
 // Una vuelta completa es equivalente a no girar.
 near(acercarAngulo(0,Math.PI*2,1),0)
})

test('normalizarConfig mezcla global y anulación por ave, e ignora valores inválidos',async()=>{
 const {normalizarConfig,DEFAULTS}=await modulePromise
 assert.equal(normalizarConfig().habilitado,true)
 assert.equal(normalizarConfig({habilitado:false}).habilitado,false)
 const mezcla=normalizarConfig({velocidadVuelo:3,alturaCrucero:0.4},{velocidadVuelo:4,distanciaActivacion:7})
 assert.equal(mezcla.velocidadVuelo,4);assert.equal(mezcla.alturaCrucero,0.4);assert.equal(mezcla.distanciaActivacion,7)
 const invalido=normalizarConfig({velocidadVuelo:-1,distanciaActivacion:'x',alturaCrucero:0})
 assert.equal(invalido.velocidadVuelo,DEFAULTS.velocidadVuelo)
 assert.equal(invalido.distanciaActivacion,DEFAULTS.distanciaActivacion)
 assert.equal(invalido.alturaCrucero,DEFAULTS.alturaCrucero)
 // En la pausa, 0 es válido (desactiva la espera).
 assert.equal(normalizarConfig({pausaSegundos:0}).pausaSegundos,0)
})

test('seguimiento.json declara los parámetros exigidos',()=>{
 const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/data/seguimiento.json')))
 for(const k of ['habilitado','distanciaActivacion','distanciaAcercamiento','distanciaInicioAterrizaje',
  'velocidadVuelo','alturaCrucero','pausaSegundos','bajadaSinAterrizajeSegundos'])assert.ok(k in cfg,`falta ${k}`)
 assert.equal(cfg.habilitado,true)
})

test('no despega antes de la pausa, estando pausado, ni sin distancia suficiente',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const s=new SeguimientoAve(config({pausaSegundos:1.5}),ave())
 s.reiniciar({x:0,y:0,z:0},0,0)
 const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
 // Antes de cumplir la pausa sigue en reposo.
 s.actualizar(1,entrada);assert.equal(s.estado,ESTADOS.REPOSO)
 // Con la pausa cumplida pero el usuario pausado, tampoco despega.
 s.actualizar(1,{...entrada,pausado:true});assert.equal(s.estado,ESTADOS.REPOSO)
 // Pausa cumplida y sin pausa: despega.
 s.actualizar(DT,entrada);assert.equal(s.estado,ESTADOS.DESPEGUE)
 // Lejos pero sin distancia de activación: nunca sale de reposo.
 const quieta=new SeguimientoAve(config(),ave());quieta.reiniciar({x:0,y:0,z:0},0,0)
 quieta.actualizar(DT,{camara:{x:0,y:1.6,z:3},adelante:ADELANTE,pausado:false})
 assert.equal(quieta.estado,ESTADOS.REPOSO)
})

test('ciclo completo con despegue por clip y aterrizaje por clip',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const s=new SeguimientoAve(config(),ave())
 s.reiniciar({x:0,y:0,z:0},0,0)
 const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
 let r=s.actualizar(DT,entrada);assert.equal(r.estado,ESTADOS.DESPEGUE)
 // El despegue no desplaza horizontalmente.
 for(let i=0;i<30;i++)s.actualizar(DT,entrada)
 assert.equal(s.posicion.x,0);assert.equal(s.posicion.z,0);assert.equal(s.estado,ESTADOS.DESPEGUE)
 // Al terminar el clip entra en vuelo.
 for(let i=0;i<40;i++)s.actualizar(DT,entrada)
 assert.equal(s.estado,ESTADOS.VUELO)
 // Vuela hacia el punto delante de la cámara.
 let guard=0
 while(s.estado===ESTADOS.VUELO&&guard++<3000)s.actualizar(DT,entrada)
 assert.equal(s.estado,ESTADOS.ATERRIZAJE)
 assert.equal(s.modoAterrizaje,'clip')
 assert.equal(s.controlaRaiz,false)
 // El punto de aterrizaje es el destino capturado delante de la cámara, al nivel del suelo.
 near(s.aterrizaje.destino.z,4.5);assert.equal(s.aterrizaje.destino.y,0)
 assert.ok(s.aterrizaje.destino.z>s.aterrizaje.origen.z)
 // Mientras ArrivalMotion controla la raíz, el módulo no la escribe.
 assert.equal(s.actualizar(DT,entrada).posicion,null)
 // El ECS confirma al terminar la mezcla.
 s.confirmarAterrizaje(s.aterrizaje.destino,0.3)
 assert.equal(s.estado,ESTADOS.REPOSO)
 near(s.posicion.z,4.5)
})

test('sin despegue va directo a vuelo; sin aterrizaje desciende y vuelve a reposo',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const s=new SeguimientoAve(config({bajadaSinAterrizajeSegundos:0.5}),
  {anguloFrente:0,giroY:0,tieneDespegue:false,tieneAterrizaje:false,duracionDespegue:0})
 s.reiniciar({x:0,y:0,z:0},0,0)
 const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
 const r=s.actualizar(DT,entrada);assert.equal(r.estado,ESTADOS.VUELO)
 assert.ok(r.posicion,true)
 let guard=0
 while(s.estado===ESTADOS.VUELO&&guard++<3000)s.actualizar(DT,entrada)
 assert.equal(s.estado,ESTADOS.ATERRIZAJE)
 assert.equal(s.modoAterrizaje,'simple')
 assert.ok(s.aterrizaje.origen.y>0.4)
 // El descenso lo controla el módulo y termina en reposo sobre el suelo.
 const bajada=Math.ceil(0.5/DT)+2
 for(let i=0;i<bajada&&s.estado===ESTADOS.ATERRIZAJE;i++)s.actualizar(DT,entrada)
 assert.equal(s.estado,ESTADOS.REPOSO)
 near(s.posicion.y,0)
})

test('una pausa en vuelo aterriza donde está y no reinicia el ciclo',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const s=new SeguimientoAve(config(),ave({tieneAterrizaje:false,tieneDespegue:false}))
 s.reiniciar({x:0,y:0,z:0},0,0)
 const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
 s.actualizar(DT,entrada)
 for(let i=0;i<60;i++)s.actualizar(DT,entrada)
 assert.equal(s.estado,ESTADOS.VUELO)
 const zAntes=s.posicion.z
 assert.ok(zAntes>0.5)
 const r=s.actualizar(DT,{...entrada,pausado:true})
 assert.equal(r.estado,ESTADOS.ATERRIZAJE)
 // El destino fijado es la posición actual proyectada al suelo.
 near(s.aterrizaje.destino.z,zAntes)
 near(s.aterrizaje.destino.x,0)
 assert.equal(s.aterrizaje.destino.y,0)
})

test('el vuelo horizontal y la altura no dependen del FPS',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const correr=dt=>{
  const s=new SeguimientoAve(config(),ave({tieneDespegue:false}))
  s.reiniciar({x:0,y:0,z:0},0,0)
  const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
  s.actualizar(dt,entrada)                    // un fotograma para entrar en vuelo
  assert.equal(s.estado,ESTADOS.VUELO)
  const pasos=Math.round(1/dt)                // exactamente un segundo de vuelo
  for(let i=0;i<pasos;i++)s.actualizar(dt,entrada)
  return {x:s.posicion.x,y:s.posicion.y,z:s.posicion.z}
 }
 const a=correr(1/100),b=correr(1/200)
 near(a.z,b.z);near(a.y,b.y);near(a.x,0)
})

test('habilitado=false deja el seguimiento inerte',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const s=new SeguimientoAve(config({habilitado:false}),ave())
 s.reiniciar({x:0,y:0,z:0},0,0)
 const r=s.actualizar(DT,{camara:CAMARA,adelante:ADELANTE,pausado:false})
 assert.equal(r.estado,ESTADOS.REPOSO)
 assert.equal(r.posicion,null)
})

test('destinoFrente usa la línea cámara-ave cuando la mirada es vertical',async()=>{
 const {SeguimientoAve}=await modulePromise
 const s=new SeguimientoAve(config(),ave())
 s.reiniciar({x:0,y:0,z:0},0,0)
 assert.deepEqual(s.destinoFrente({x:0,y:1.6,z:6},null),{x:0,y:0,z:4.5})
})

test('las cuatro combinaciones de clips deciden despegue y modo de aterrizaje',async()=>{
 const {SeguimientoAve,ESTADOS}=await modulePromise
 const casos=[
  {tieneDespegue:true,tieneAterrizaje:true,despega:true,modo:'clip'},
  {tieneDespegue:false,tieneAterrizaje:true,despega:false,modo:'clip'},
  {tieneDespegue:true,tieneAterrizaje:false,despega:true,modo:'simple'},
  {tieneDespegue:false,tieneAterrizaje:false,despega:false,modo:'simple'},
 ]
 for(const caso of casos){
  const s=new SeguimientoAve(config(),{anguloFrente:0,giroY:0,
   tieneDespegue:caso.tieneDespegue,tieneAterrizaje:caso.tieneAterrizaje,duracionDespegue:1})
  s.reiniciar({x:0,y:0,z:0},0,0)
  const entrada={camara:CAMARA,adelante:ADELANTE,pausado:false}
  const etiqueta=`despegue=${caso.tieneDespegue} aterrizaje=${caso.tieneAterrizaje}`
  assert.equal(s.actualizar(DT,entrada).estado,caso.despega?ESTADOS.DESPEGUE:ESTADOS.VUELO,etiqueta)
  let guard=0
  while(s.estado!==ESTADOS.ATERRIZAJE&&guard++<3000)s.actualizar(DT,entrada)
  assert.equal(s.modoAterrizaje,caso.modo,etiqueta)
 }
})

test('con mirada vertical el vuelo conserva la última dirección válida',async()=>{
 const {SeguimientoAve}=await modulePromise
 const s=new SeguimientoAve(config(),ave({tieneDespegue:false}))
 s.reiniciar({x:0,y:0,z:0},0,0)
 // Un primer fotograma con mirada horizontal válida fija la dirección.
 s.actualizar(DT,{camara:CAMARA,adelante:ADELANTE,pausado:false})
 for(let i=0;i<30;i++)s.actualizar(DT,{camara:CAMARA,adelante:{x:0,y:1,z:0},pausado:false})
 assert.ok(s.posicion.z>0,'debe seguir avanzando pese a mirar al suelo')
 assert.ok(s.destino&&s.destino.y===0,'el destino sigue siendo un punto del suelo')
})
