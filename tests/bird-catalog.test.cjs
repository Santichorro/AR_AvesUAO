const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const root=path.join(__dirname,'..'),birds=JSON.parse(fs.readFileSync(path.join(root,'src/data/aves.json'))).aves
const source=fs.readFileSync(path.join(root,'src/bird-catalog.js'),'utf8')
const catalogModule=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex')

test('catálogo vigente habilita tres modelos y rechaza entradas descartadas o pendientes',async()=>{
 const {availableBird}=await catalogModule
 assert.deepEqual(birds.filter(b=>b.disponible).map(b=>b.id).sort(),['colibri','martin_pescador','paloma'])
 for(const id of ['pechirrojo','azulejo','loro','desconocido'])assert.equal(availableBird(birds,id),undefined)
 for(const id of ['colibri','martin_pescador','paloma'])assert.equal(availableBird(birds,id).id,id)
})
for(const id of ['martin_pescador','paloma'])test(`${id}: clips y calibración corresponden al GLB, conservando el original`,()=>{
 const bird=birds.find(b=>b.id===id),cal=JSON.parse(fs.readFileSync(path.join(root,'src/data/'+id+'-aterrizaje.json')))
 const raw=fs.readFileSync(path.join(root,'src',bird.modelo)),original=fs.readFileSync(path.join(root,'src',bird.modeloOriginal))
 assert.equal(sha(raw),cal.sha256Modelo);assert.equal(sha(original),cal.sha256Original)
 const gltf=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)))
 const clips=new Map(gltf.animations.map(a=>[a.name,a]))
 for(const c of bird.clips){
  const animation=clips.get(c.nombre);assert.ok(animation)
  const end=Math.max(...animation.samplers.map(s=>gltf.accessors[s.input].max[0]))
  assert.ok(Math.abs(end-c.duracionSegundos)<1e-5)
  assert.ok(animation.samplers.every(s=>gltf.accessors[s.input].min[0]>=0))
 }
 for(const name of Object.values(bird.animaciones))assert.ok(clips.has(name))
 assert.equal(cal.clip,bird.animaciones.aterrizaje);assert.ok(cal.contactoSegundos>0)
 for(const p of cal.traslacionRoot)assert.ok(p.every(Number.isFinite))
 assert.ok(Math.abs(cal.traslacionRoot.at(-1)[0]-cal.contactoSegundos)<1e-6)
 assert.equal(bird.audioCanto,null);assert.notEqual(bird.imagen,'assets/img/colirufo.jpg')
})

test('Paloma documenta sus recortes de Take 001 y Martín conserva sus nombres reales',()=>{
 const paloma=JSON.parse(fs.readFileSync(path.join(root,'src/data/paloma-aterrizaje.json')))
 assert.ok(Object.values(paloma.rangosOriginales).every(r=>r.clipOriginal==='Take 001'))
 const martin=JSON.parse(fs.readFileSync(path.join(root,'src/data/martin_pescador-aterrizaje.json')))
 assert.ok(Object.entries(martin.rangosOriginales).every(([name,r])=>name===r.clipOriginal))
 assert.ok(martin.rangosOriginales.idleA1_bird.inicioOriginalSegundos>20)
})
