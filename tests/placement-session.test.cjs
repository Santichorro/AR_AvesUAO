const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/placement-session.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
async function fixture(){
 const {PlacementSession}=await modulePromise
 const calls={spawn:[],move:[],destroy:0}
 const session=new PlacementSession({spawn:(p,g)=>calls.spawn.push({p,g}),move:p=>calls.move.push(p),destroy:()=>calls.destroy++})
 return {session,calls,ready(){session.start();session.setTracking(true);session.setAsset(true)}}
}
const a={x:1,y:0,z:2},b={x:3,y:0,z:4}
test('detectar/cargar no crea contenido antes de comenzar y tocar',async()=>{const f=await fixture();f.session.setTracking(true);f.session.setAsset(true);assert.equal(f.session.phase,'INTRO');assert.equal(f.calls.spawn.length,0);f.session.start();assert.equal(f.session.phase,'ESCANEO');assert.equal(f.calls.spawn.length,0)})
test('rechaza posición inválida y seguimiento ausente',async()=>{const f=await fixture();f.session.start();f.session.setAsset(true);assert.equal(f.session.place(a),false);f.session.setTracking(true);for(const p of [null,{x:NaN,y:0,z:0},{x:0,y:Infinity,z:0},{}])assert.equal(f.session.place(p),false);assert.equal(f.calls.spawn.length,0)})
test('doble toque crea una sola ave',async()=>{const f=await fixture();f.ready();assert.equal(f.session.place(a),true);assert.equal(f.session.place(b),false);assert.equal(f.calls.spawn.length,1);f.session.loaded(f.session.generation);assert.equal(f.session.place(b),false);assert.deepEqual(f.session.position,a)})
test('reubicar mueve la misma instancia al confirmar',async()=>{const f=await fixture();f.ready();f.session.place(a);f.session.loaded(f.session.generation);f.session.relocate();assert.deepEqual(f.session.position,a);f.session.place(b);assert.equal(f.calls.spawn.length,1);assert.deepEqual(f.calls.move,[b]);assert.deepEqual(f.session.position,b)})
test('cancelar reubicación conserva la ubicación',async()=>{const f=await fixture();f.ready();f.session.place(a);f.session.loaded(f.session.generation);f.session.relocate();assert.equal(f.session.cancelRelocation(),true);assert.deepEqual(f.session.position,a);assert.equal(f.calls.move.length,0)})
test('reinicio invalida una carga tardía y permite nueva colocación',async()=>{const f=await fixture();f.ready();f.session.place(a);const old=f.session.generation;f.session.reset();assert.equal(f.session.loaded(old),false);assert.equal(f.session.position,null);assert.equal(f.session.phase,'ESCANEO');f.session.place(b);assert.equal(f.calls.spawn.length,2);assert.equal(f.session.loaded(old),false);assert.equal(f.session.loaded(f.session.generation),true)})
test('error elimina la instancia y muestra un estado recuperable',async()=>{const f=await fixture();f.ready();f.session.place(a);f.session.fail('Carga fallida');assert.equal(f.calls.destroy,1);assert.equal(f.session.phase,'ERROR');assert.equal(f.session.position,null);f.session.reset();assert.equal(f.session.phase,'ESCANEO')})
test('perder seguimiento bloquea colocación y reubicación',async()=>{const f=await fixture();f.ready();f.session.place(a);f.session.loaded(f.session.generation);f.session.relocate();f.session.setTracking(false);assert.equal(f.session.place(b),false);assert.deepEqual(f.session.position,a);f.session.setTracking(true);assert.equal(f.session.place(b),true)})
