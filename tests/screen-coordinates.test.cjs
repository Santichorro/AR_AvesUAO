const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/screen-coordinates.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
test('un tap conserva la posición al mezclar ECS y DOM en canvas reducido/desplazado',async()=>{
 const {screenToViewport,viewportToScreen}=await modulePromise
 const rect={left:30,top:80,width:330,height:680},point={x:130,y:300}
 const normalized=viewportToScreen(point,rect)
 assert.deepEqual(screenToViewport(normalized,rect),point)
 assert.equal(normalized.x,(130-30)/330)
 assert.equal(normalized.y,(300-80)/680)
})
test('HUD y menú usan el viewport y rechazan canvas o puntos inválidos',async()=>{
 const {screenToViewport,viewportToScreen}=await modulePromise
 assert.deepEqual(screenToViewport({x:.5,y:.5},{left:40,top:70,width:300,height:600}),{x:190,y:370})
 assert.equal(screenToViewport({x:NaN,y:0},{left:0,top:0,width:100,height:100}),null)
 assert.equal(viewportToScreen({x:10,y:20},{left:0,top:0,width:0,height:100}),null)
})
