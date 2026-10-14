const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const src=fs.readFileSync(path.join(__dirname,'../src/arrival-motion.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))
const calibration=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/data/colibri-aterrizaje.json')))
const bird=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/data/aves.json'))).aves.find(b=>b.id==='colibri')
const target={x:1.2,y:.4,z:-.8}
async function fixture(random=()=>.5){const {ArrivalMotion}=await modulePromise;const motion=new ArrivalMotion(bird.llegada,calibration,random);const start=motion.begin(target,7,bird.escalaExhibicion,bird.transformacion.giroY,bird.transformacion.posicionLocal);return {motion,start}}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`)
test('origen aleatorio elevado, acotado y estable durante el descenso',async()=>{
 let n=0;const values=[0,0,0,.25,1,1],f=await fixture(()=>values[n++])
 near(f.start.position.y-target.y,bird.llegada.alturaMinima)
 near(Math.hypot(f.start.position.x-target.x,f.start.position.z-target.z),bird.llegada.radioMinimo)
 const origin={...f.motion.origin};f.motion.advance(.8,7);assert.deepEqual(f.motion.origin,origin);assert.equal(n,3)
 f.motion.cancel();const second=f.motion.begin(target,8,.25,-Math.PI/2,bird.transformacion.posicionLocal)
 assert.notDeepEqual(second.position,origin);near(second.position.y-target.y,bird.llegada.alturaMaxima)
})
test('descenso termina exactamente en destino y restaura el offset local',async()=>{
 const f=await fixture();let previous=f.start.position.y
 for(let i=0;i<150;i++) {
  const p=f.motion.advance(.025,7)
  assert.ok(p.position.y<=previous+1e-12&&p.position.y>=target.y-1e-12);previous=p.position.y
 }
 const end=f.motion.sample();assert.deepEqual(end.position,target);assert.deepEqual(end.localPosition,bird.transformacion.posicionLocal)
 near(end.clipTime,calibration.contactoSegundos);assert.equal(end.finished,false)
 assert.equal(f.motion.beginBlend(),true);assert.equal(f.motion.beginBlend(),false)
 assert.equal(f.motion.advance(.08,7).finished,false);assert.equal(f.motion.advance(.08,7).finished,true)
})
test('trayectoria y reloj del clip dan igual resultado a 15, 30, 60 y 120 fps',async()=>{
 const samples=[]
 for(const fps of [15,30,60,120]) {
  const f=await fixture();const count=Math.floor(1.5*fps)
  for(let i=0;i<count;i++)f.motion.advance(1/fps,7)
  f.motion.advance(1.5-count/fps,7);samples.push(f.motion.sample())
 }
 for(const sample of samples)for(const field of ['position','localPosition'])for(const axis of ['x','y','z'])near(sample[field][axis],samples[0][field][axis])
 for(const sample of samples)near(sample.clipTime,1.5)
})
test('compensación cancela la traslación interna del root en toda la llegada',async()=>{
 const {rootTranslationAt}=await modulePromise,f=await fixture()
 for(let i=0;i<=135;i++) {
  const p=f.motion.sample(),root=rootTranslationAt(calibration.traslacionRoot,p.clipTime)
  const dx=(root.x-calibration.rootReposo.x)*.25,dz=(root.z-calibration.rootReposo.z)*.25,yaw=bird.transformacion.giroY
  near(p.localPosition.x+Math.cos(yaw)*dx+Math.sin(yaw)*dz,bird.transformacion.posicionLocal.x)
  near(p.localPosition.y+(root.y-calibration.rootReposo.y)*.25,bird.transformacion.posicionLocal.y)
  near(p.localPosition.z-Math.sin(yaw)*dx+Math.cos(yaw)*dz,bird.transformacion.posicionLocal.z)
  f.motion.advance(1/60,7)
 }
})
test('orientación mira al destino considerando el giro local del modelo',async()=>{
 for(const angle of [0,.25,.5,.75]) {
  let i=0;const f=await fixture(()=>i++===0?angle:.5),dx=target.x-f.start.position.x,dz=target.z-f.start.position.z
  const direction=Math.atan2(dx,dz),actual=f.start.yaw+bird.transformacion.giroY+Math.PI/2
  near(Math.cos(actual-direction),1)
 }
})
test('cancelar descarta generaciones antiguas y un fotograma largo no salta la mezcla',async()=>{
 const f=await fixture();assert.equal(f.motion.advance(1,6),null)
 const landing=f.motion.advance(10,7);assert.equal(landing.landed,true);assert.equal(landing.finished,false)
 f.motion.beginBlend();assert.equal(f.motion.advance(.1,7).finished,false)
 f.motion.cancel();assert.equal(f.motion.advance(100,7),null);assert.equal(f.motion.snapshot().phase,'idle')
 f.motion.begin(target,8,.25,-Math.PI/2,bird.transformacion.posicionLocal);assert.equal(f.motion.advance(1,7),null)
 const t=f.motion.elapsed;f.motion.advance(NaN,8);f.motion.advance(-3,8);assert.equal(f.motion.elapsed,t)
})
test('calibración corresponde al GLB original y termina en la traslación de reposo',async()=>{
 const {rootTranslationAt}=await modulePromise;const end=rootTranslationAt(calibration.traslacionRoot,calibration.contactoSegundos)
 for(const axis of ['x','y','z'])near(end[axis],calibration.rootReposo[axis])
 assert.equal(calibration.duracionClipSegundos,2.5)
 assert.equal(calibration.clip,bird.animaciones.aterrizaje)
 const model=path.join(__dirname,'../src',calibration.modelo)
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(model)).digest('hex'),calibration.sha256Modelo)
})


test('frente propio de cada GLB apunta al destino sin asumir el eje del Colibrí',async()=>{
 const {ArrivalMotion}=await modulePromise
 for(const front of [0,Math.PI/2,-Math.PI/2]){
  const motion=new ArrivalMotion({...bird.llegada,anguloFrente:front},calibration,()=>.25)
  const p=motion.begin(target,7,.25,-Math.PI/2,bird.transformacion.posicionLocal)
  const direction=Math.atan2(target.x-p.position.x,target.z-p.position.z)
  near(Math.cos(p.yaw-Math.PI/2+front-direction),1)
 }
})
test('contacto distinto del reposo mantiene continua la compensación hasta el destino',async()=>{
 const {ArrivalMotion}=await modulePromise,ref=calibration.rootReposo
 const cal={...calibration,rootContacto:{...ref,y:ref.y+1},traslacionRoot:[[0,ref.x,ref.y+2,ref.z],[2.25,ref.x,ref.y+1,ref.z]]}
 const motion=new ArrivalMotion(bird.llegada,cal,()=>.5)
 motion.begin(target,7,.25,-Math.PI/2,bird.transformacion.posicionLocal)
 const before=motion.advance(2.25-1e-6,7);assert.ok(Math.abs(before.localPosition.y-bird.transformacion.posicionLocal.y)<1e-6)
 assert.deepEqual(motion.advance(.001,7).localPosition,bird.transformacion.posicionLocal)
})
