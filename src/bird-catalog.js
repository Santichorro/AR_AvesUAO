// Solo las especies configuradas pueden sustituir el ave activa.
export const availableBird = (catalog, id) => catalog.find(bird =>
  bird.id === id && bird.disponible && bird.modelo && bird.animaciones?.reposo && bird.llegada)
