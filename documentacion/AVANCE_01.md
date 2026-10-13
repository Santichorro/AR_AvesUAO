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
- Ficha única de Colibrí Colirufo (Amazilia tzacatl, Trochilidae) desde JSON, con fotografía aportada y contenido de página 17. El usuario asigna esa representación al GLB existente; no se reemplaza ni se identifica nuevamente el modelo.
- Seis clips reales con pausa, reposo y vuelta a reposo después de clips no cíclicos.
- Selector preparado para las cinco aves; solo colibrí disponible.
- Vista 3D de escritorio para probar sin cámara. No es una simulación certificada de RA.
- Interfaz natural con tarjetas claras, relieve suave, textos verde bosque y rojo UAO. Foco y pulsación sin morado; controles de al menos 48 px. Ver [DISENO_UI.md](DISENO_UI.md) para paleta y criterio visual.
- Selector compacto con icono de ave abajo a la izquierda: muestra las cinco opciones, solo colibrí habilitado. Se cierra al elegir, tocar fuera o pulsar Cerrar.
- Un tap breve sobre el ave abre el menú circular y este permanece abierto al retirar el dedo. Un segundo tap ejecuta Ficha, Animaciones, Reubicar o Reiniciar y cierra el círculo. Tocar fuera o pulsar Escape lo cierra sin acciones.
- La ruta de tap que el usuario comprobó físicamente se conserva: tap sobre el modelo → ui.openInfo(point). Solo se pasa el punto del viewport que ya calculaba el controlador. La UI presenta el círculo; openGuide presenta la ficha del Colirufo únicamente al elegir Ficha, conservando Cerrar y las acciones anteriores. Se retiraron selector de referencias, candidatas y avisos de modelo genérico.
- Arrastre y pinch no abren el círculo ni la ficha. Se mantienen listeners, hit del modelo, condiciones de estado, limpieza y conversión canvas/viewport. No se activa el reconocedor RadialGesture para abrir o elegir: los sectores usan directamente las mismas acciones de los botones. Un nuevo pointerdown en el sector es necesario para aceptar su click; los eventos residuales de apertura o cancelación se ignoran sin temporizadores de activación.
- Cancelar reubicación permanece visible fuera del radial. Reiniciar durante carga/error y Comenzar/Reintentar conservan acceso contextual.

## Recursos y fuentes

El GLB original (10.942.732 bytes) se conserva en Downloads. La copia integrada tiene 3.274.900 bytes; mantiene los canales de animación y 58 articulaciones. Base color a 1024 px; normal y roughness a 512 px. Las texturas necesarias siguen embebidas. No se deben copiar de nuevo las texturas externas. Ver COLIBRI_RECURSO.json.

Se ocultan en la copia las mallas Prop_Perch, Prop_TrumpetFlower y Prop_TrumpetFlower_Stem para mostrar solo el ave. El gesto de alimentación puede reproducirse sin flor. No se ha reducido el detalle de la geometría skinned: todavía requiere medición en móvil.

Fuente académica vigente de esta ficha: GUIA AVES UAO FINAL.pdf, primera edición 2023, página 17, revisada visualmente. Autores indicados en página 2: Germán Morales Zuñiga y Natalia Lenis Sánchez. La sección Colibrí Colirufo respalda hábitat, alimentación a distintas alturas, visita a comederos, cola canela no horquetada y vientre gris manchado; la ilustración muestra plumaje verde. No se añaden dieta, medidas o distribución no especificadas. La asignación del modelo al Colirufo es una decisión del usuario para el proyecto.

Fotografía: src/assets/img/colirufo.jpg, copia íntegra del archivo aportado (480×639, 28.096 bytes). El original permanece en Downloads. La imagen se muestra completa, proporcional, con alt descriptivo y crédito «Fotografía proporcionada por el usuario», independiente de la cita académica. Autor y licencia no se inventan. Las referencias previas de otras especies se conservan en REFERENCIAS_COLIBRIES.json, fuera de la ficha y del bundle activo.

Autoría del modelo según metadatos: animalanimator.com. No se encontró una licencia en los archivos aportados. Registrar la licencia real y la atribución necesaria antes de publicar externamente este asset.

## Cómo probar

1. Abrir la carpeta en Studio o compilar desde la raíz con npm run build.
2. Para revisar en escritorio, servir dist/ y abrir localhost. Es una vista 3D; tocar el plano virtual del suelo coloca el ave.
3. Pulsar Comenzar y esperar la carga del modelo. En móvil, permitir cámara y estabilizar el seguimiento sobre el suelo.
4. Tocar el lugar elegido: debe aparecer una sola ave. Tocar de nuevo no debe duplicarla.
5. Tocar brevemente el ave: debe aparecer solo el círculo y permanecer al retirar el dedo. Tocar Ficha para abrir Colibrí Colirufo una sola vez. Comparar nombre, fotografía y cuatro secciones con página 17; no debe aparecer selector de referencias ni lista de especies. Cerrar permite volver a la vista AR.
6. Tocar el ave y después Animaciones; recorrer los seis clips, pausar y volver a reposo.
7. Elegir Reubicar en el círculo; un toque nuevo confirma otro punto. La selección del sector no confirma una ubicación. Cancelar conserva el anterior.
8. Pulsar Reiniciar mientras carga y después de colocar; no debe reaparecer un modelo de una carga vieja.
9. Repetir tres recorridos. Los botones y selects no deben colocar modelos detrás del HUD.
10. Arrastrar horizontalmente sobre el área AR: debe rotar sobre su eje Y sin abrir el círculo. Tocar suelo o HUD no abre el círculo. Tocar fuera con el círculo abierto solo lo cierra, también sobre otro control del HUD.
11. Hacer pinch con dos dedos: la escala debe cambiar de forma uniforme, respetar los límites y conservar el punto de apoyo. Reubicar debe mantener giro y escala; Reiniciar debe restaurarlos para la siguiente colocación.
12. Probar un tap sobre el ave fuera del centro y con canvas reducido/desplazado: debe abrir el círculo ajustado a la pantalla. Repetir en horizontal y con áreas seguras. La ficha abierta desde su sector debe permitir scroll.
13. Repetir apertura/cierre, Escape, scroll de la ficha, animación, reubicación/cancelación y reinicio. El tap inicial, una liberación residual y pointercancel no deben seleccionar sectores. El HUD no debe modificar el ave por gestos detrás de los paneles.

## Pruebas automatizadas

Ejecutar npm test (o node --test tests/*.test.cjs). Pasan las 24 pruebas de colocación, inspección, recursos de interacción y coordenadas. Las pruebas unitarias de RadialGesture comprueban ese recurso aislado; no demuestran por sí solas el flujo actual, cuya apertura y selección se presentan en la UI.

La revisión de dist/bundle.js en Edge con World/ECS/raycast simulados comprueba tap → círculo → segundo tap en Ficha, una sola apertura del Colirufo y Cerrar. Verifica nombre científico, familia, cuatro subtítulos, cita exclusiva de página 17, foto cargada desde dist y ausencia de selector/avisos/candidatas. También comprueba eventos residuales, cancelación, cierre exterior, Escape, giro/pinch, las otras tres opciones, clips/pausa, reubicación con toque nuevo conservando entidad/giro/escala, cancelación, reinicio y selector. Regresión en 390×844, 320×568, 844×390 y 1100×800, cuatro taps con canvas 330×680 en (30,80), teclado, toque emulado y movimiento reducido. Revisión visual y scroll en 390×844, 320×568, 844×390 y 1100×1000: foto proporcional, subtítulos de 15 px en negrita, botones accesibles y sin desbordamiento. Webpack compila con los dos avisos previos de tamaño; CSS y estilos inline están sincronizados. Este entorno no usa cámara, carga real del GLB ni tracking; no acredita compatibilidad física.

Se reprodujo una cancelación incorrecta del tap con un canvas reducido (330×680, desplazado 30 px a la derecha y 80 px abajo dentro de una ventana 390×844): el controlador mezclaba posiciones normalizadas respecto del canvas con píxeles de toda la ventana. La corrección utiliza el rectángulo de world.three.renderer.domElement para convertir en ambas direcciones. Pasaron cuatro taps fuera del centro y la selección de Ficha en ese canvas, además de las pruebas anteriores. Falta comprobar la sesión real de Studio y teléfonos.

Para inspeccionar el estado sin modificarlo: window.__AR_AVES_DEBUG__(). Devuelve fase, posición, raíz/modelo, clip, giro/escala y estado del reconocedor radial anterior. Ese estado permanece idle durante el menú presentado por la UI; no indica si el círculo está visible. La clase is-open y aria-hidden de .aves-radial describen su visibilidad. El diagnóstico no permite introducir posiciones falsas ni forzar tracking.

## Pendiente físico y de contenido

- El usuario confirmó la ruta de tap y el funcionamiento del menú circular. La nueva ficha del Colirufo requiere comprobación en Studio, Android/Chrome e iPhone/Safari: carga de fotografía, scroll, legibilidad, cierre, subtítulos y botones sin acciones detrás del HUD. Revisar también giro/pinch, permisos, tracking, apoyo, áreas seguras, horizontal y rendimiento.
- El hit de la plantilla se calcula sobre Ground con tracking activo; no ofrece selección de múltiples planos físicos como ARKit/ARCore. Comprobar el apoyo real en el suelo con dispositivos.
- El aro del HUD orienta el escaneo; no afirma ser una retícula proyectada con hit-test continuo.
- Incorporar canto documentado y registrar autoría/licencia de fotografía y modelo. La representación del Colirufo ya está definida por el usuario.
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
