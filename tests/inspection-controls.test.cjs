const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const source=fs.readFileSync(path.join(__dirname,'../src/inspection-controls.js'),'utf8')
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))

test('el pinch conserva escala uniforme y respeta los límites',async()=>{
 const {InspectionControls}=await modulePromise
 const inspection=new InspectionControls({escalaBase:0.25,escalaMinima:0.12,escalaMaxima:0.60})
 assert.equal(inspection.beginPinch(0.2),true)
 assert.equal(inspection.pinch(0.4),0.5)
 assert.equal(inspection.pinch(2),0.60)
 inspection.endPinch()
 assert.equal(inspection.beginPinch(0.5),true)
 assert.equal(inspection.pinch(0.01),0.12)
})

test('el giro acumula desplazamiento horizontal y se mantiene en un ciclo útil',async()=>{
 const {InspectionControls}=await modulePromise
 const inspection=new InspectionControls({escalaBase:0.25,sensibilidadGiro:Math.PI*2})
 assert.equal(inspection.rotate(0.25),Math.PI/2)
 assert.ok(inspection.rotate(1) >= -Math.PI)
 assert.ok(inspection.yaw < Math.PI)
})

test('reiniciar restaura escala, giro y pinch al estado de la siguiente colocación',async()=>{
 const {InspectionControls}=await modulePromise
 const inspection=new InspectionControls({escalaBase:0.25,escalaMinima:0.12,escalaMaxima:0.60})
 inspection.rotate(0.2)
 inspection.beginPinch(0.1)
 inspection.pinch(0.2)
 inspection.reset()
 assert.deepEqual(inspection.snapshot(),{scale:0.25,yaw:0,minimumScale:0.12,maximumScale:0.60})
 assert.equal(inspection.pinchStartScale,null)
})

test('un desplazamiento breve sigue siendo toque y un arrastre se diferencia',async()=>{
 const {InspectionControls}=await modulePromise
 const inspection=new InspectionControls({escalaBase:0.25,umbralArrastre:0.015})
 assert.equal(inspection.isDrag({x:0.5,y:0.5},{x:0.508,y:0.504}),false)
 assert.equal(inspection.isDrag({x:0.5,y:0.5},{x:0.52,y:0.5}),true)
})
