const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/bird-audio.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const flush=()=>new Promise(resolve=>setImmediate(resolve))
async function fixture(url='assets/audio/colibri_canto.mp3') {
 const {createBirdAudio}=await modulePromise
 const media=new EventTarget(),states=[],errors=[],requests=[]
 let instances=0
 Object.assign(media,{paused:true,ended:false,currentTime:0,plays:0,loads:0,
  pause(){this.paused=true},
  play(){this.plays++;this.paused=false;this.ended=false;return new Promise((resolve,reject)=>requests.push({resolve,reject}))},
  removeAttribute(name){delete this[name]},load(){this.loads++}})
 const player=createBirdAudio({url,onPlaying:value=>states.push(value),onError:reason=>errors.push(reason)},()=>{instances++;return media})
 const emit=type=>media.dispatchEvent(new Event(type))
 return {player,media,states,errors,requests,emit,instances:()=>instances}
}
test('Canto inicia en la misma llamada y muestra escucha solo al reproducir',async()=>{
 const f=await fixture();f.player.play()
 assert.equal(f.media.plays,1);assert.equal(f.media.src,'assets/audio/colibri_canto.mp3');assert.deepEqual(f.states,[])
 f.emit('playing');assert.deepEqual(f.states,[true])
 f.emit('waiting');assert.deepEqual(f.states,[true,false])
 f.emit('playing');assert.deepEqual(f.states,[true,false,true])
 f.media.ended=true;f.emit('ended');assert.deepEqual(f.states,[true,false,true,false]);assert.equal(f.media.paused,true)
})
test('repetir reutiliza una instancia y descarta el rechazo de la petición anterior',async()=>{
 const f=await fixture();f.player.play();f.emit('playing');f.media.currentTime=8
 f.player.play();assert.equal(f.instances(),1);assert.equal(f.media.plays,2);assert.equal(f.media.currentTime,0)
 f.requests[0].reject(Object.assign(new Error(),{name:'AbortError'}));await flush();assert.deepEqual(f.errors,[])
 f.emit('playing');assert.equal(f.states.at(-1),true)
 f.requests[1].resolve();await flush();assert.equal(f.states.at(-1),true)
})
test('detener descarta resoluciones y eventos tardíos sin reactivar escucha',async()=>{
 const f=await fixture();f.player.play();f.emit('playing');f.player.stop()
 f.requests[0].resolve();f.emit('playing');await flush()
 assert.equal(f.media.paused,true);assert.equal(f.media.currentTime,0);assert.deepEqual(f.states,[true,false]);assert.deepEqual(f.errors,[])
 f.player.play();f.emit('playing');f.media.paused=true;f.emit('pause');assert.equal(f.states.at(-1),false)
})
test('bloqueo del navegador y recurso inválido no muestran reproducción',async()=>{
 for(const [name,reason] of [['NotAllowedError','blocked'],['NotSupportedError','failed']]) {
  const f=await fixture();f.player.play();f.requests[0].reject(Object.assign(new Error(),{name}));await flush()
  assert.deepEqual(f.errors,[reason]);assert.deepEqual(f.states,[]);assert.equal(f.media.paused,true)
 }
 const f=await fixture();f.player.play();f.emit('playing');f.emit('error');f.emit('error')
 assert.deepEqual(f.errors,['failed']);assert.deepEqual(f.states,[true,false])
})
test('sin recurso no crea audio; destruir elimina listeners y aborta la carga',async()=>{
 const missing=await fixture(null);missing.player.play();assert.equal(missing.instances(),0);assert.deepEqual(missing.errors,['missing'])
 const f=await fixture();f.player.play();f.emit('playing');f.player.dispose()
 assert.equal(f.media.src,undefined);assert.equal(f.media.loads,1);assert.equal(f.media.paused,true)
 f.media.paused=false;f.emit('playing');f.emit('error');f.requests[0].reject(new Error());await flush()
 f.player.play();f.player.dispose();assert.equal(f.media.plays,1);assert.equal(f.media.loads,1)
 assert.deepEqual(f.states,[true,false]);assert.deepEqual(f.errors,[])
})
