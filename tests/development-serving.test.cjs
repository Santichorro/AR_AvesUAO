const {test}=require('node:test')
const assert=require('node:assert/strict'),path=require('node:path')
const configure=require('../config/webpack.config.js')
const webpack=require('webpack')
const createMiddleware=require('webpack-dev-middleware')

test('el middleware de desarrollo resuelve HTML, bundle, motor y assets del simulador',async(t)=>{
  const config=configure({}, {mode:'development'})
  const names=['index.html','bundle.js','external/runtime/runtime.js','external/dev8/dev8.js','assets/models/colibri.glb','assets/img/colirufo.jpg']
  const compiler=webpack({mode:'none',entry:{},output:config.output,plugins:[{
    apply(compiler){compiler.hooks.thisCompilation.tap('TestAssets',compilation=>{
      compilation.hooks.processAssets.tap('TestAssets',()=>{
        for(const name of names)compilation.emitAsset(name,new webpack.sources.RawSource('test'))
      })
    })}
  }]})
  const middleware=createMiddleware(compiler,{publicPath:config.output.publicPath,stats:false})
  t.after(async()=>{
    await new Promise(resolve=>middleware.close(resolve))
    await new Promise(resolve=>compiler.close(resolve))
  })
  await new Promise(resolve=>middleware.waitUntilValid(resolve))
  for(const name of names)assert.equal((await middleware.getFilenameFromUrl('/'+name)).filename,path.join(config.output.path,name))
  assert.equal(await middleware.getFilenameFromUrl('/archivo-inexistente.js'),undefined)
})

test('crear la configuración de desarrollo conserva las rutas relativas del build de Pages',()=>{
  const before=configure({}, {mode:'production'}).output
  configure({}, {mode:'development'})
  const after=configure({}, {mode:'production'}).output
  assert.deepEqual(after,before)
  assert.equal(after.publicPath,'./')
})


test('el build conserva recursos activos y excluye solo los modelos originales archivados',()=>{
 const fs=require('node:fs'),CopyPlugin=require('copy-webpack-plugin')
 const config=configure({}, {mode:'production'})
 const copier=config.plugins.find(plugin=>plugin instanceof CopyPlugin)
 const pattern=copier.patterns.find(pattern=>pattern.from===path.join(process.cwd(),'src/assets'))
 const birds=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/data/aves.json'))).aves
 for(const bird of birds.filter(bird=>bird.disponible)){
  for(const field of ['modelo','imagen','audioCanto'])assert.equal(pattern.filter(path.join(process.cwd(),'src',bird[field])),true)
  if(bird.modeloOriginal&&bird.modeloOriginal!==bird.modelo)assert.equal(pattern.filter(path.join(process.cwd(),'src',bird.modeloOriginal)),false)
 }
 assert.equal(config.output.clean,true)
 assert.equal(pattern.filter(path.join(process.cwd(),'src/assets/UAO_Campus_LowPoly.glb')),true)
})
