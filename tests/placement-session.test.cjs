const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/placement-session.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
async function fixture(){
 const {PlacementSession}=await modulePromise
 const calls={spawn:[],move:[],destroy:0}
 const session=new PlacementSession({spawn:(p,g,options)=>calls.spawn.push({p,g,options}),move:p=>calls.move.push(p),destroy:()=>calls.destroy++})
 return {session,calls,ready(){session.start();session.setTracking(true);session.setAsset(true)}}
}
const a={x:1,y:0,z:2},b={x:3,y:0,z:4}
const finish=session=>{session.loaded(session.generation);session.arrived(session.generation)}
test('detectar/cargar no crea contenido antes de comenzar y tocar',async()=>{const f=await fixture();f.session.setTracking(true);f.session.setAsset(true);assert.equal(f.session.phase,'INTRO');assert.equal(f.calls.spawn.length,0);f.session.start();assert.equal(f.session.phase,'ESCANEO');assert.equal(f.calls.spawn.length,0)})
test('rechaza posición inválida y seguimiento ausente',async()=>{const f=await fixture();f.session.start();f.session.setAsset(true);assert.equal(f.session.place(a),false);f.session.setTracking(true);for(const p of [null,{x:NaN,y:0,z:0},{x:0,y:Infinity,z:0},{}])assert.equal(f.session.place(p),false);assert.equal(f.calls.spawn.length,0)})
test('doble toque crea una sola ave',async()=>{const f=await fixture();f.ready();assert.equal(f.session.place(a),true);assert.equal(f.session.place(b),false);assert.equal(f.calls.spawn.length,1);finish(f.session);assert.equal(f.session.place(b),false);assert.deepEqual(f.session.position,a)})
test('reubicar mueve la misma instancia al confirmar',async()=>{const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.relocate();assert.deepEqual(f.session.position,a);f.session.place(b);assert.equal(f.calls.spawn.length,1);assert.deepEqual(f.calls.move,[b]);assert.deepEqual(f.session.position,b)})
test('cancelar reubicación conserva la ubicación',async()=>{const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.relocate();assert.equal(f.session.cancelRelocation(),true);assert.deepEqual(f.session.position,a);assert.equal(f.calls.move.length,0)})
test('reinicio invalida una carga tardía y permite nueva colocación',async()=>{const f=await fixture();f.ready();f.session.place(a);const old=f.session.generation;f.session.reset();assert.equal(f.session.loaded(old),false);assert.equal(f.session.position,null);assert.equal(f.session.phase,'ESCANEO');f.session.place(b);assert.equal(f.calls.spawn.length,2);assert.equal(f.session.loaded(old),false);assert.equal(f.session.loaded(f.session.generation),true)})
test('error elimina la instancia y muestra un estado recuperable',async()=>{const f=await fixture();f.ready();f.session.place(a);f.session.fail('Carga fallida');assert.equal(f.calls.destroy,1);assert.equal(f.session.phase,'ERROR');assert.equal(f.session.position,null);f.session.reset();assert.equal(f.session.phase,'ESCANEO')})
test('perder seguimiento bloquea colocación y reubicación',async()=>{const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.relocate();f.session.setTracking(false);assert.equal(f.session.place(b),false);assert.deepEqual(f.session.position,a);f.session.setTracking(true);assert.equal(f.session.place(b),true)})

test('cargar inicia ATERRIZANDO y bloquea colocar/reubicar hasta completar',async()=>{
 const f=await fixture();f.ready();f.session.place(a);const generation=f.session.generation
 assert.equal(f.session.loaded(generation),true);assert.equal(f.session.phase,'ATERRIZANDO')
 assert.deepEqual(f.session.position,a);assert.equal(f.session.place(b),false);assert.equal(f.session.relocate(),false)
 assert.equal(f.session.loaded(generation),false);assert.equal(f.session.arrived(generation+1),false)
 assert.equal(f.session.arrived(generation),true);assert.equal(f.session.phase,'EXPLORAR');assert.equal(f.session.arrived(generation),false)
 assert.equal(f.calls.spawn.length,1)
})
test('reiniciar o fallar en llegada descarta su finalización tardía',async()=>{
 for(const fail of [false,true]) {
  const f=await fixture();f.ready();f.session.place(a);const old=f.session.generation;f.session.loaded(old)
  if(fail)f.session.fail('Llegada fallida');else f.session.reset()
  assert.equal(f.session.arrived(old),false);assert.equal(f.session.position,null);assert.equal(f.calls.destroy,1)
  f.session.reset();f.session.place(b);assert.equal(f.session.arrived(old),false)
 }
})


test('cambiar especie antes de comenzar no coloca contenido',async()=>{
 const f=await fixture();f.session.setTracking(true);f.session.changeSpecies();f.session.setAsset(true)
 assert.equal(f.session.phase,'INTRO');assert.equal(f.calls.spawn.length,0);assert.equal(f.session.position,null)
 f.session.start();assert.equal(f.session.phase,'ESCANEO')
})
test('cambiar especie conserva el punto y carga una sola sustitución en reposo',async()=>{
 const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.changeSpecies()
 assert.equal(f.calls.destroy,1);assert.deepEqual(f.session.position,a);assert.equal(f.session.phase,'PREPARANDO')
 f.session.setAsset(true);assert.equal(f.calls.spawn.length,2);assert.deepEqual(f.calls.spawn[1].p,a)
 assert.deepEqual(f.calls.spawn[1].options,{arrival:false});const g=f.session.generation
 assert.equal(f.session.loaded(g),true);assert.equal(f.session.phase,'EXPLORAR');assert.equal(f.session.loaded(g),false)
})
test('cambios durante carga o llegada invalidan callbacks anteriores',async()=>{
 for(const landing of [false,true]){
  const f=await fixture();f.ready();f.session.place(a);const old=f.session.generation
  if(landing)f.session.loaded(old)
  f.session.changeSpecies();f.session.setAsset(true);const current=f.session.generation
  assert.equal(f.session.loaded(old),false);assert.equal(f.session.arrived(old),false)
  assert.equal(f.session.loaded(current),true);assert.equal(f.session.phase,'EXPLORAR');assert.equal(f.calls.destroy,1)
 }
})
test('cambio espera seguimiento y varios cambios rápidos no duplican modelos',async()=>{
 const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.setTracking(false)
 f.session.changeSpecies();f.session.changeSpecies();f.session.setAsset(true)
 assert.equal(f.calls.spawn.length,1);assert.deepEqual(f.session.position,a)
 f.session.setTracking(true);assert.equal(f.calls.spawn.length,2);assert.deepEqual(f.calls.spawn[1].p,a)
 f.session.setTracking(true);f.session.setAsset(true);assert.equal(f.calls.spawn.length,2)
})
test('reiniciar mientras se prepara sustitución exige un punto nuevo',async()=>{
 const f=await fixture();f.ready();f.session.place(a);finish(f.session);f.session.changeSpecies();f.session.reset();f.session.setAsset(true)
 assert.equal(f.session.phase,'ESCANEO');assert.equal(f.session.position,null);assert.equal(f.calls.spawn.length,1)
 f.session.place(b);assert.deepEqual(f.calls.spawn[1].options,{arrival:true})
})
