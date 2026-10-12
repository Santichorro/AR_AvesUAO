const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/radial-gesture.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
async function fixture(origin={x:200,y:300}) {
 const {RadialGesture,radialLayout}=await modulePromise
 const calls=[],layout=radialLayout(origin,{width:400,height:800})
 const gesture=new RadialGesture({open:()=>calls.push('open'),close:()=>calls.push('close'),action:a=>calls.push(a)})
 gesture.begin(1,origin,layout)
 return {gesture,calls,layout,origin}
}
test('un tap válido abre el radial al liberar y lo mantiene abierto',async()=>{
 const f=await fixture();assert.equal(f.gesture.phase,'pending');assert.deepEqual(f.calls,[])
 f.gesture.release(1,true);assert.equal(f.gesture.phase,'open');assert.deepEqual(f.calls,['open'])
 f.gesture.release(1);assert.equal(f.gesture.phase,'open');assert.deepEqual(f.calls,['open'])
})
test('liberar sin tap válido no abre menú ni ficha',async()=>{
 const f=await fixture();f.gesture.release(1,false)
 assert.equal(f.gesture.phase,'idle');assert.deepEqual(f.calls,[])
 assert.equal(f.gesture.select('info'),false)
})
test('un arrastre invalida el tap',async()=>{
 const f=await fixture();f.gesture.move(1,{x:211,y:300});f.gesture.release(1,true)
 assert.equal(f.gesture.phase,'idle');assert.deepEqual(f.calls,[])
})
test('dos dedos invalidan el tap y dejan disponible el pinch',async()=>{
 const f=await fixture();f.gesture.pointerDown(2);f.gesture.release(1,true);f.gesture.release(2,true)
 assert.equal(f.gesture.phase,'idle');assert.deepEqual(f.calls,[]);assert.equal(f.gesture.blocked,false)
})
test('seleccionar Ficha ejecuta una sola acción y cierra',async()=>{
 const f=await fixture();f.gesture.release(1,true)
 assert.equal(f.gesture.select('info'),true);assert.equal(f.gesture.select('info'),false)
 f.gesture.release(1);assert.equal(f.gesture.phase,'idle')
 assert.equal(f.calls.filter(a=>a==='info').length,1)
})
test('resaltar no confirma; el centro y acciones desconocidas no seleccionan',async()=>{
 const f=await fixture();f.gesture.release(1,true)
 f.gesture.move(2,{x:f.layout.x,y:f.layout.y-100});assert.equal(f.gesture.selected,'info')
 assert.ok(!f.calls.includes('info'))
 f.gesture.move(2,{x:f.layout.x,y:f.layout.y});assert.equal(f.gesture.selected,null)
 assert.equal(f.gesture.select('desconocida'),false);assert.equal(f.gesture.phase,'open')
})
test('cancelar y reiniciar limpian el menú sin ejecutar opciones',async()=>{
 const f=await fixture();f.gesture.release(1,true);f.gesture.cancel()
 assert.equal(f.gesture.phase,'idle');assert.equal(f.gesture.select('info'),false)
 f.gesture.begin(2,f.origin,f.layout);f.gesture.reset();f.gesture.release(2,true)
 assert.equal(f.gesture.phase,'idle');assert.equal(f.gesture.pointers.size,0)
 assert.ok(!f.calls.includes('info'))
})
test('dos dedos con menú abierto cancelan hasta retirar ambos',async()=>{
 const f=await fixture();f.gesture.release(1,true);f.gesture.pointerDown(2);f.gesture.pointerDown(3)
 assert.equal(f.gesture.phase,'consuming');assert.equal(f.gesture.select('info'),false)
 f.gesture.release(2);assert.equal(f.gesture.blocked,true)
 f.gesture.release(3);assert.equal(f.gesture.phase,'idle')
})
test('sectores angulares y límites conservan su geometría',async()=>{
 const {radialSector}=await modulePromise;const l={x:200,y:300,radius:144,deadRadius:44}
 for(const [p,a] of [[{x:200,y:200},'info'],[{x:300,y:300},'animation'],[{x:200,y:400},'relocate'],[{x:100,y:300},'reset']])assert.equal(radialSector(p,l),a)
 for(const p of [{x:200,y:300},{x:244,y:300},{x:400,y:300},{x:270,y:230}])assert.equal(radialSector(p,l),null)
})
test('ajuste de esquinas mantiene sectores dentro de la pantalla',async()=>{
 const {radialLayout}=await modulePromise
 for(const origin of [{x:0,y:0},{x:320,y:0},{x:0,y:568},{x:320,y:568}]) {
  const l=radialLayout(origin,{width:320,height:568})
  assert.ok(l.x-l.radius*1.08>=12-.001);assert.ok(l.x+l.radius*1.08<=308+.001)
  assert.ok(l.y-l.radius*1.08>=12-.001);assert.ok(l.y+l.radius*1.08<=556+.001)
 }
})
