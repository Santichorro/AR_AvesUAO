const {test}=require('node:test')
const assert=require('node:assert/strict'),path=require('node:path')
const configure=require('../config/webpack.config.js')
const filenameFromUrl=require('webpack-dev-middleware/dist/utils/getFilenameFromUrl')

function emittedAssets(output) {
  const assets=new Set(['index.html','bundle.js','external/runtime/runtime.js','external/dev8/dev8.js','assets/models/colibri.glb','assets/img/colirufo.jpg'].map(asset=>path.join(output.path,asset)))
  return {
    options:{}, stats:{compilation:{outputOptions:output,getPath:value=>value}},
    outputFileSystem:{statSync(filename){
      if(!assets.has(filename))throw new Error('Asset no emitido')
      return {isFile:()=>true,isDirectory:()=>false}
    }},
  }
}

test('el middleware de desarrollo resuelve HTML, bundle, motor y assets del simulador',()=>{
  const config=configure({}, {mode:'development'})
  const context=emittedAssets(config.output)
  for(const asset of ['index.html','bundle.js','external/runtime/runtime.js','external/dev8/dev8.js','assets/models/colibri.glb','assets/img/colirufo.jpg']) {
    assert.equal(filenameFromUrl(context,'/'+asset),path.join(config.output.path,asset),asset)
  }
  assert.equal(filenameFromUrl(context,'/archivo-inexistente.js'),undefined)
})

test('crear la configuración de desarrollo conserva las rutas relativas del build de Pages',()=>{
  const before=configure({}, {mode:'production'}).output
  configure({}, {mode:'development'})
  const after=configure({}, {mode:'production'}).output
  assert.deepEqual(after,before)
  assert.equal(after.publicPath,'./')
})
