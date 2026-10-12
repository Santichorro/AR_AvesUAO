const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/radial-gesture.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
function clock() {
 let now=0, next=0; const jobs=new Map()
 return {set(fn,ms){const id=++next;jobs.set(id,{fn,time:now+ms});return id},clear(id){jobs.delete(id)},
 tick(ms){const end=now+ms;while(true){const due=[...jobs].filter(([,j])=>j.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!due)break;now=due[1].time;jobs.delete(due[0]);due[1].fn()}now=end},get size(){return jobs.size}}
}
async function fixture(origin={x:200,y:300}) {
 const {RadialGesture,radialLayout}=await modulePromise
 const time=clock(), calls=[]
 const layout=radialLayout(origin,{width:400,height:800})
 const gesture=new RadialGesture({open:()=>calls.push('open'),close:()=>calls.push('close'),action:a=>calls.push(a)}, {},time)
 gesture.begin(1,origin,layout)
 return {gesture,time,calls,layout,origin}
}
test('solo abre al completar un segundo; soltar antes no ejecuta opciones',async()=>{
 const f=await fixture();f.time.tick(999);assert.equal(f.gesture.phase,'pending')
 f.time.tick(1);assert.equal(f.gesture.phase,'open');assert.deepEqual(f.calls,['open'])
 const short=await fixture();short.time.tick(500);assert.equal(short.gesture.release(1),false)
 short.time.tick(2000);assert.deepEqual(short.calls,[]);assert.equal(short.time.size,0)
})
test('Ficha solo se confirma tras 180 ms y liberaciones residuales no repiten la acción',async()=>{
 const f=await fixture();f.time.tick(1000)
 assert.equal(f.calls.filter(a=>a==='info').length,0)
 f.gesture.move(1,{x:f.layout.x,y:f.layout.y-100});f.time.tick(179)
 assert.equal(f.calls.filter(a=>a==='info').length,0)
 f.time.tick(1);assert.equal(f.calls.filter(a=>a==='info').length,1)
 f.gesture.move(1,{x:f.layout.x-100,y:f.layout.y});f.time.tick(500)
 assert.equal(f.gesture.release(1),true);f.gesture.release(1);f.time.tick(1000)
 assert.equal(f.calls.filter(a=>a==='info').length,1);assert.ok(!f.calls.includes('reset'))
})
test('mover antes del plazo cancela la espera y deja disponible el arrastre',async()=>{
 const f=await fixture();f.gesture.move(1,{x:211,y:300});f.time.tick(2000)
 assert.equal(f.gesture.phase,'idle');assert.equal(f.gesture.blocked,false);assert.deepEqual(f.calls,[])
})
test('dos dedos antes de abrir cancelan el hold y permiten pinch',async()=>{
 const f=await fixture();f.gesture.pointerDown(2);f.time.tick(2000)
 assert.equal(f.gesture.blocked,false);assert.deepEqual(f.calls,[]);assert.equal(f.time.size,0)
})
test('dos dedos con menú abierto consumen la secuencia hasta retirar ambos',async()=>{
 const f=await fixture();f.time.tick(1000);f.gesture.pointerDown(2)
 assert.equal(f.gesture.phase,'consuming');assert.equal(f.gesture.release(1),true)
 assert.equal(f.gesture.blocked,true);assert.equal(f.gesture.release(2),true)
 assert.equal(f.gesture.phase,'idle');assert.ok(!f.calls.includes('info'))
})
test('sectores angulares, centro, separación y exterior mantienen hits estables',async()=>{
 const {radialSector}=await modulePromise;const l={x:200,y:300,radius:144,deadRadius:44}
 assert.equal(radialSector({x:200,y:200},l),'info')
 assert.equal(radialSector({x:300,y:300},l),'animation')
 assert.equal(radialSector({x:200,y:400},l),'relocate')
 assert.equal(radialSector({x:100,y:300},l),'reset')
 assert.equal(radialSector({x:200,y:300},l),null)
 assert.equal(radialSector({x:244,y:300},l),null)
 assert.equal(radialSector({x:400,y:300},l),null)
 assert.equal(radialSector({x:270,y:230},l),null)
})
test('ajusta las cuatro esquinas y no elige bajo el dedo por desplazar el centro',async()=>{
 const {radialLayout}=await modulePromise
 for(const origin of [{x:0,y:0},{x:320,y:0},{x:0,y:568},{x:320,y:568}]) {
  const l=radialLayout(origin,{width:320,height:568})
  assert.ok(l.x-l.radius*1.08>=12-0.001);assert.ok(l.x+l.radius*1.08<=308+0.001)
  assert.ok(l.y-l.radius*1.08>=12-0.001);assert.ok(l.y+l.radius*1.08<=556+0.001)
 }
 const f=await fixture({x:15,y:300});f.time.tick(1000)
 f.gesture.move(1,{x:16,y:300});f.time.tick(1000)
 assert.equal(f.gesture.selected,null);assert.equal(f.gesture.phase,'open')
})
test('confirmar requiere permanencia; cambiar de sector o volver al centro cancela',async()=>{
 const f=await fixture();f.time.tick(1000)
 f.gesture.move(1,{x:f.layout.x,y:f.layout.y-100});f.time.tick(179)
 assert.equal(f.gesture.selected,'info')
 f.gesture.move(1,{x:f.layout.x,y:f.layout.y});f.time.tick(200)
 assert.equal(f.gesture.phase,'open');assert.ok(!f.calls.includes('info'))
 f.gesture.move(1,{x:f.layout.x+100,y:f.layout.y});f.time.tick(180)
 assert.equal(f.gesture.phase,'consuming');assert.equal(f.calls.filter(a=>a==='animation').length,1)
 f.gesture.move(1,{x:f.layout.x-100,y:f.layout.y});f.time.tick(2000)
 assert.ok(!f.calls.includes('reset'));assert.equal(f.gesture.release(1),true)
})
test('soltar antes de confirmar cierra sin ejecutar y sin tap residual',async()=>{
 const f=await fixture();f.time.tick(1000)
 f.gesture.move(1,{x:f.layout.x,y:f.layout.y-100});f.time.tick(100)
 assert.equal(f.gesture.release(1),true);f.time.tick(1000)
 assert.deepEqual(f.calls,['open','close']);assert.equal(f.time.size,0)
})
test('reinicio/cambio de estado limpia timers conservando el bloqueo del dedo activo',async()=>{
 const f=await fixture();f.time.tick(1000)
 f.gesture.move(1,{x:f.layout.x,y:f.layout.y+100})
 f.gesture.reset(true);assert.equal(f.time.size,0);assert.equal(f.gesture.blocked,true)
 f.time.tick(2000);assert.ok(!f.calls.includes('relocate'))
 f.gesture.release(1);assert.equal(f.gesture.blocked,false)
 const pending=await fixture();pending.gesture.reset();pending.time.tick(2000)
 assert.equal(pending.time.size,0);assert.equal(pending.gesture.pointers.size,0);assert.deepEqual(pending.calls,['close'])
})
