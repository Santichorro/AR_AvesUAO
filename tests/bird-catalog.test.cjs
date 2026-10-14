const {test}=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const root=path.join(__dirname,'..'),birds=JSON.parse(fs.readFileSync(path.join(root,'src/data/aves.json'))).aves
const source=fs.readFileSync(path.join(root,'src/bird-catalog.js'),'utf8')
const catalogModule=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex')

test('catálogo vigente habilita cuatro modelos y rechaza entradas descartadas o pendientes',async()=>{
 const {availableBird}=await catalogModule
 assert.deepEqual(birds.filter(b=>b.disponible).map(b=>b.id).sort(),['colibri','loro','martin_pescador','paloma'])
 for(const id of ['pechirrojo','azulejo','desconocido'])assert.equal(availableBird(birds,id),undefined)
 for(const id of ['colibri','loro','martin_pescador','paloma'])assert.equal(availableBird(birds,id).id,id)
})
for(const id of ['martin_pescador','paloma','loro'])test(`${id}: clips y calibración corresponden al GLB, conservando el original`,()=>{
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
 assert.ok(bird.audioCanto);assert.notEqual(bird.imagen,'assets/img/colirufo.jpg')
})

test('Paloma documenta sus recortes de Take 001 y Martín conserva sus nombres reales',()=>{
 const paloma=JSON.parse(fs.readFileSync(path.join(root,'src/data/paloma-aterrizaje.json')))
 assert.ok(Object.values(paloma.rangosOriginales).every(r=>r.clipOriginal==='Take 001'))
 const martin=JSON.parse(fs.readFileSync(path.join(root,'src/data/martin_pescador-aterrizaje.json')))
 assert.ok(Object.entries(martin.rangosOriginales).every(([name,r])=>name===r.clipOriginal))
 assert.ok(martin.rangosOriginales.idleA1_bird.inicioOriginalSegundos>20)
})

test('cada ave tiene su propio MP3 y los nuevos cantos conservan el archivo aportado',()=>{
 const urls=birds.filter(b=>b.disponible).map(b=>b.audioCanto)
 assert.equal(new Set(urls).size,4)
 for(const b of birds.filter(b=>b.disponible)){
  const audio=fs.readFileSync(path.join(root,'src',b.audioCanto))
  assert.ok(audio.length>1000)
  assert.ok(audio.subarray(0,3).toString()==='ID3'||audio[0]===255)
  if(b.creditoAudio.sha256)assert.equal(sha(audio),b.creditoAudio.sha256)
 }
})

test('Guacamaya conserva materiales con recortes y las correcciones de Paloma y Martín',()=>{
 const material=(id,name)=>{
  const b=birds.find(b=>b.id===id),raw=fs.readFileSync(path.join(root,'src',b.modelo))
  const gltf=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)))
  return gltf.materials.find(m=>m.name===name)
 }
 assert.equal(material('paloma','Pigeon_mainMat').alphaMode,'OPAQUE')
 for(const [id,name] of [['martin_pescador','body'],['loro','CH_NPC_MOB_GParrot_A01_MI_ATR']]){
  const m=material(id,name);assert.equal(m.alphaMode,'MASK');assert.equal(m.alphaCutoff,0.5)
 }
})
