// Actualizar las envolventes de la pose deformada para el raycast nativo de ECS.
// No añade colliders ni cambia la geometría, las animaciones o el reconocedor de tap.
export function refreshAnimatedBounds(object) {
  if (!object) return
  object.updateWorldMatrix(true, true)
  object.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return
    mesh.skeleton.update()
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  })
}
