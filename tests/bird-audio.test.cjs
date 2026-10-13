const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/bird-audio.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const flush=()=>new Promise(resolve=>setImmediate(resolve))
async function fixture(url='assets/audio/colibri_canto.mp3') {
 const {createBirdAudio}=await modulePromise
 const media=new EventTarget(),states=[],phases=[],errors=[],requests=[]
 let instances=0
 Object.assign(media,{paused:true,ended:false,currentTime:0,plays:0,loads:0,
  pause(){this.paused=true},
  play(){this.plays++;this.paused=false;this.ended=false;return new Promise((resolve,reject)=>requests.push({resolve,reject}))},
  removeAttribute(name){delete this[name]},load(){this.loads++}})
 const player=createBirdAudio({url,onPlaying:value=>states.push(value),onState:value=>phases.push(value),onError:reason=>errors.push(reason)},()=>{instances++;return media})
 const emit=type=>media.dispatchEvent(new Event(type))
 return {player,media,states,phases,errors,requests,emit,instances:()=>instances}
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
test('pausar conserva la posición y continuar reutiliza el mismo audio',async()=>{
 const f=await fixture();f.player.play();f.emit('playing');f.media.currentTime=7.5
 f.player.pause();assert.equal(f.media.paused,true);assert.equal(f.media.currentTime,7.5)
 assert.equal(f.phases.at(-1),'paused');assert.equal(f.states.at(-1),false)
 f.emit('pause');f.emit('waiting');f.emit('playing');assert.equal(f.phases.at(-1),'paused')
 f.requests[0].reject(Object.assign(new Error(),{name:'AbortError'}));await flush();assert.deepEqual(f.errors,[])
 f.player.resume();assert.equal(f.media.plays,2);assert.equal(f.media.currentTime,7.5);assert.equal(f.instances(),1)
 f.emit('pause');assert.equal(f.phases.at(-1),'loading','un pause anterior no cancela la continuación')
 f.emit('playing');assert.equal(f.phases.at(-1),'playing');assert.equal(f.states.at(-1),true)
 f.player.resume();assert.equal(f.media.plays,2,'continuar fuera de pausa no duplica reproducción')
})
test('cerrar estando pausado restaura tiempo y bloquea continuar o eventos tardíos',async()=>{
 const f=await fixture();f.player.play();f.emit('playing');f.media.currentTime=5;f.player.pause();f.player.stop()
 assert.equal(f.media.currentTime,0);assert.equal(f.phases.at(-1),'idle')
 f.player.resume();f.emit('pause');f.emit('waiting');f.emit('playing');assert.equal(f.media.plays,1)
 assert.equal(f.phases.at(-1),'idle');assert.deepEqual(f.states,[true,false])
 f.player.play();f.emit('playing');assert.equal(f.media.currentTime,0);assert.equal(f.instances(),1)
})
test('pausar durante una carga invalida su rechazo sin mostrar error',async()=>{
 const f=await fixture();f.player.play();f.player.pause();f.requests[0].reject(new Error());await flush()
 assert.deepEqual(f.errors,[]);assert.equal(f.phases.at(-1),'paused')
 f.player.resume();f.requests[1].reject(Object.assign(new Error(),{name:'NotAllowedError'}));await flush()
 assert.deepEqual(f.errors,['blocked']);assert.equal(f.phases.at(-1),'idle')
 f.player.pause();f.player.resume();assert.equal(f.media.plays,2)
})
