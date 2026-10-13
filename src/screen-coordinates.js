// ECS normaliza respecto al canvas. DOM/menú/elementFromPoint usan el viewport.
const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y)
const validRect = r => r && ['left','top','width','height'].every(k => Number.isFinite(r[k])) && r.width > 0 && r.height > 0
export function screenToViewport(position, rect) {
  if (!validPoint(position) || !validRect(rect)) return null
  return {x: rect.left + position.x * rect.width, y: rect.top + position.y * rect.height}
}
export function viewportToScreen(position, rect) {
  if (!validPoint(position) || !validRect(rect)) return null
  return {x: (position.x - rect.left) / rect.width, y: (position.y - rect.top) / rect.height}
}
