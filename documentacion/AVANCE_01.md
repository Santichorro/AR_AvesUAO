# Avance 01 — Colibrí de colocación directa

Fecha: 12 de octubre de 2026. Rama de trabajo: juandate.

## Implementado

- Colocación de una sola ave con toque válido sobre Ground, sin isla ni mapa previo.
- Estado INTRO, PREPARANDO, ESCANEO, COLOCANDO, EXPLORAR, REUBICAR y ERROR.
- Seguimiento NORMAL requerido en móvil antes de colocar o reubicar; la detección no crea contenido automáticamente.
- Una raíz de colocación y un modelo hijo; animaciones no cambian el punto elegido.
- Doble toque bloqueado mientras carga o existe un modelo.
- Reubicar mueve la raíz existente; cancelar conserva el punto anterior.
- Reiniciar elimina modelo/raíz, cancela timeout y listeners y descarta cargas tardías.
- Arrastrar horizontalmente sobre el área AR rota la raíz del ave en el eje Y; un arrastre no abre la ficha ni cambia el punto de colocación.
- El gesto de dos dedos escala uniformemente el modelo hijo entre 0.12 y 0.60, sin cambiar su animación, orientación de raíz ni ubicación. Los límites y sensibilidad están en `aves.json`.
- Ficha en español desde JSON; consulta de tres especies sin asignarles identidad al GLB.
- Seis clips reales con pausa, reposo y vuelta a reposo después de clips no cíclicos.
- Selector preparado para las cinco aves; solo colibrí disponible.
- Vista 3D de escritorio para probar sin cámara. No es una simulación certificada de RA.
- Interfaz natural con tarjetas claras, relieve suave, textos verde bosque y rojo UAO. Foco y pulsación sin morado; controles de al menos 48 px. Ver [DISENO_UI.md](DISENO_UI.md) para paleta y criterio visual.
- Selector compacto con icono de ave abajo a la izquierda: muestra las cinco opciones, solo colibrí habilitado. Se cierra al elegir, tocar fuera o pulsar Cerrar.
- Restaurado el flujo anterior: un tap breve sobre el ave abre directamente Ficha del colibrí con guía, datos y selector de referencias. No se abre el menú circular ni se exige pulsación prolongada.
- Animaciones, Reubicar y Reiniciar quedan disponibles como botones dentro de la ficha. Cerrar y Escape cierran el panel; el selector compacto de aves permanece abajo a la izquierda.
- Arrastre y pinch no abren la ficha. Se mantiene la conversión correcta entre coordenadas del canvas y el viewport, incluso en una vista de simulación reducida.
- Cancelar reubicación permanece visible fuera del radial. Reiniciar durante carga/error y Comenzar/Reintentar conservan acceso contextual.

## Recursos y fuentes

El GLB original (10.942.732 bytes) se conserva en Downloads. La copia integrada tiene 3.274.900 bytes; mantiene los canales de animación y 58 articulaciones. Base color a 1024 px; normal y roughness a 512 px. Las texturas necesarias siguen embebidas. No se deben copiar de nuevo las texturas externas. Ver COLIBRI_RECURSO.json.

Se ocultan en la copia las mallas Prop_Perch, Prop_TrumpetFlower y Prop_TrumpetFlower_Stem para mostrar solo el ave. El gesto de alimentación puede reproducirse sin flor. No se ha reducido el detalle de la geometría skinned: todavía requiere medición en móvil.

Fuente académica: GUIA AVES UAO FINAL.pdf, primera edición 2023. Autores indicados en página 2: Germán Morales Zuñiga y Natalia Lenis Sánchez. Se revisaron visualmente páginas 17 y 18. Página 8 enumera seis colibríes; el JSON conserva sus nombres científicos según el documento, sin convertir una lista en identificación del modelo. La guía tiene inconsistencias de rótulos en otras fichas; no se usan para inferir datos del colibrí.

Autoría del modelo según metadatos: animalanimator.com. No se encontró una licencia en los archivos aportados. Registrar la licencia real y la atribución necesaria antes de publicar externamente este asset.

## Cómo probar

1. Abrir la carpeta en Studio o compilar desde la raíz con npm run build.
2. Para revisar en escritorio, servir dist/ y abrir localhost. Es una vista 3D; tocar el plano virtual del suelo coloca el ave.
3. Pulsar Comenzar y esperar la carga del modelo. En móvil, permitir cámara y estabilizar el seguimiento sobre el suelo.
4. Tocar el lugar elegido: debe aparecer una sola ave. Tocar de nuevo no debe duplicarla.
5. Tocar brevemente el ave: debe aparecer directamente Ficha del colibrí. Elegir una referencia y comparar datos con páginas 17–18. Cerrar permite volver a la vista AR.
6. Abrir la ficha y pulsar Probar animaciones; recorrer los seis clips, pausar y volver a reposo.
7. Pulsar Reubicar dentro de la ficha; un toque nuevo confirma otro punto. Cancelar conserva el anterior.
8. Pulsar Reiniciar mientras carga y después de colocar; no debe reaparecer un modelo de una carga vieja.
9. Repetir tres recorridos. Los botones y selects no deben colocar modelos detrás del HUD.
10. Arrastrar horizontalmente sobre el área AR: debe rotar sobre su eje Y sin abrir la ficha. Un tap sobre el ave abre la guía; tocar suelo o HUD no debe abrirla.
11. Hacer pinch con dos dedos: la escala debe cambiar de forma uniforme, respetar los límites y conservar el punto de apoyo. Reubicar debe mantener giro y escala; Reiniciar debe restaurarlos para la siguiente colocación.
12. Probar un tap sobre el ave fuera del centro y con canvas reducido/desplazado: debe abrir la ficha. El panel debe permanecer dentro de pantalla y permitir scroll.
13. Repetir apertura/cierre, cambio de referencia, animación, reubicación/cancelación y reinicio. Los controles de la ficha no deben modificar el ave por gestos detrás del HUD.

## Pruebas automatizadas

Ejecutar npm test (o node --test tests/*.test.cjs). Se conservan las 24 pruebas de colocación, inspección, recursos de interacción y coordenadas. El recurso radial permanece en el código, pero el flujo actual del ave utiliza apertura directa de la guía.

La revisión del build con World/ECS/raycast simulados comprueba guía directa por tap, cambio de referencias, Cerrar, ausencia de ficha al tocar suelo/arrastrar/pinchar, animaciones, reubicación/cancelación, reinicio, selector y cuatro taps con canvas reducido. Tamaños: 390×844, 320×568, 844×390 y 1100×800. Este entorno no usa cámara, carga real del GLB ni tracking; no acredita compatibilidad física.

Se reprodujo una cancelación incorrecta del tap con un canvas reducido (330×680, desplazado 30 px a la derecha y 80 px abajo dentro de una ventana 390×844): el controlador mezclaba posiciones normalizadas respecto del canvas con píxeles de toda la ventana. La corrección utiliza el rectángulo de world.three.renderer.domElement para convertir en ambas direcciones. Pasaron cuatro taps fuera del centro y la selección de Ficha en ese canvas, además de las pruebas anteriores. Falta comprobar la sesión real de Studio y teléfonos.

Para inspeccionar el estado sin modificarlo: window.__AR_AVES_DEBUG__(). Devuelve fase, posición, raíz/modelo, clip, giro/escala y estado del radial. No permite introducir posiciones falsas ni forzar tracking.

## Pendiente físico y de contenido

- Studio, Android/Chrome e iPhone/Safari: comprobar que un tap sobre el hit real del GLB abre directamente la guía, que los datos y controles responden y que arrastre/pinch no abren paneles. Revisar también permisos, tracking, apoyo, safe areas y rendimiento.
- El hit de la plantilla se calcula sobre Ground con tracking activo; no ofrece selección de múltiples planos físicos como ARKit/ARCore. Comprobar el apoyo real en el suelo con dispositivos.
- El aro del HUD orienta el escaneo; no afirma ser una retícula proyectada con hit-test continuo.
- Confirmar especie representada, canto, fotografía y licencia del modelo.
- Incorporar cuatro modelos y sus fichas completas en etapas siguientes.
- Quizzes y avistamiento no se implementan en este avance.
- Confirmar Pages y despliegue real tras revisión por PR; no se ha publicado ni hecho push.

## GitHub Pages

Se mantiene el workflow existente. El publicPath relativo evita que el bundle dependa de la raíz del dominio; las rutas del JSON y HTML son relativas. Verificar desde el enlace HTTPS real cuando el equipo integre a main. Los GLB se gestionan mediante Git LFS. La compilación exitosa no acredita compatibilidad física ni autorización de redistribución del asset.

## APIs consultadas

- https://8thwall.org/docs/api/studio/events/input
- https://8thwall.org/docs/api/studio/events/assets
- https://8thwall.org/docs/api/studio/ecs/gltf-model
- https://8thwall.org/docs/troubleshooting/world-tracking-issues
- Tipos de la instalación local: node_modules/@8thwall/ecs/index.d.ts.
