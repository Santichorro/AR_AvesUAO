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
- Un tap breve sobre el ave abre el radial de Ficha, Animaciones, Reubicar y Reiniciar. Permanece abierto al retirar el dedo; un segundo tap en una opción la ejecuta. Tocar fuera o pulsar Escape lo cierra.
- La ficha se abre exclusivamente desde su sector. El tap que abre el menú no abre paneles ni elige la opción bajo el dedo. Se eliminaron la espera de un segundo y la confirmación por permanencia.
- Sectores con resaltado rojo/rosa y crecimiento suave; apertura/cierre animados, configuración central y respeto de movimiento reducido.
- Un arrastre o dos dedos invalidan el tap sobre el ave y mantienen giro/pinch. Con el menú abierto, dos dedos cancelan y consumen la secuencia hasta retirarlos. El tap exterior solo cierra; no coloca ni manipula el ave.
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
5. Tocar brevemente el ave: debe aparecer solo el radial y permanecer abierto. Tocar Ficha para consultar referencias de páginas 17–18. Un nuevo click residual no debe volver a abrirla.
6. Tocar el ave y después Animaciones; recorrer los seis clips, pausar y volver a reposo.
7. Elegir Reubicar desde el radial: mover o soltar el mismo dedo no coloca el ave; un toque nuevo confirma otro punto. Cancelar conserva el anterior.
8. Pulsar Reiniciar mientras carga y después de colocar; no debe reaparecer un modelo de una carga vieja.
9. Repetir tres recorridos. Los botones y selects no deben colocar modelos detrás del HUD.
10. Arrastrar horizontalmente sobre el área AR: debe rotar sobre su eje Y sin abrir el radial. Tocar el ave abre solo el menú; tocar suelo o HUD no debe abrirlo.
11. Hacer pinch con dos dedos: la escala debe cambiar de forma uniforme, respetar los límites y conservar el punto de apoyo. Reubicar debe mantener giro y escala; Reiniciar debe restaurarlos para la siguiente colocación.
12. Abrir el radial cerca de cada borde: deben verse los cuatro sectores. Pasar sobre un sector lo resalta sin ejecutar; tocarlo selecciona. Tocar fuera cierra sin acción sobre el ave.
13. Con el radial abierto, añadir otro dedo, cancelar el puntero, cambiar de orientación o salir de la pestaña: no deben quedar menús ni confirmaciones pendientes. Comprobar selector inferior izquierdo y cierre exterior sin gestos sobre el ave.

## Pruebas automatizadas

Ejecutar npm test (o node --test tests/*.test.cjs). Pasaron los 22 casos: colocación, inspección y 10 pruebas de tap, apertura persistente, sectores, límites, acción única, dos dedos, cancelación y reinicio. El radial no utiliza temporizadores de hold ni de confirmación. Webpack compiló con los dos avisos previos de tamaño de assets.

Revisión aprobada en navegador sobre dist/bundle.js con World/ECS y raycast simulados: tap sobre ave, persistencia tras soltar, cuatro opciones por tap, cierre exterior sin mover, giro/pinch sin menú, selector, cancelación/reinicio, cuatro bordes y selección con teclado. Tamaños: 390×844, 320×568, 844×390 y 1100×800. Sin errores de ejecución ni overflow horizontal. Este entorno no usa cámara, carga real del GLB ni tracking; no acredita compatibilidad física.

Para inspeccionar el estado sin modificarlo: window.__AR_AVES_DEBUG__(). Devuelve fase, posición, raíz/modelo, clip, giro/escala y estado del radial. No permite introducir posiciones falsas ni forzar tracking.

## Pendiente físico y de contenido

- Android/Chrome e iPhone/Safari: permisos, tracking, apoyo, giro, pinch, tap sobre el hit real del GLB, opciones por tap, cierre exterior, cancelación multitáctil, animaciones y rendimiento. Confirmar que el tap de apertura no elige automáticamente un sector, que el HUD no manipula el ave y que las safe areas se respetan.
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
