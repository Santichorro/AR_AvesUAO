# Interfaz de Aves UAO: naturaleza y exploración

## Referencia y criterio

Se toma el estilo de la imagen aportada por el usuario: tarjetas claras, bordes redondeados, relieves suaves, controles separados y acentos puntuales de color. No se trasladan sus contenidos, ilustraciones ni mecánicas a la aplicación. El enfoque natural se expresa con tonos de vegetación y superficies claras, sin agregar texturas o adornos que compitan con el ave en cámara.

El rojo institucional se conserva como identificador. El texto pasa del rojo oscuro al verde bosque para evitar que todos los elementos compitan como acciones principales. Comenzar utiliza rojo; el selector y la ficha usan superficies claras. Reiniciar mantiene texto rojo.

## Paleta

| Función | Color | Uso |
|---|---|---|
| Identidad UAO | `#ed1d24` | Marca roja existente y acentos del distintivo |
| Acción principal | `#c91b22` | Comenzar y foco visible de botones/selectores |
| Pulsación principal | `#a7151b` | Respuesta al presionar |
| Verde bosque | `#243d35` | Títulos y texto principal |
| Texto secundario | `#586c61` | Indicaciones y fuentes |
| Superficie clara | `#f5f7f2` y `#ffffff` | Tarjetas y controles |
| Salvia | `#e7efe5` | Ficha y notas informativas |
| Vegetación | `#48654b` | Etiquetas y retícula |
| Rosa tenue | `#fff0ee` | Distintivo y pulsación de controles neutros |

Contrastes calculados con luminancia sRGB sobre superficies sólidas: bosque/superficie clara 10.85:1; texto secundario/superficie clara 5.22:1; blanco/acción principal 5.73:1. Blanco sobre el rojo original da 4.37:1, por eso el botón principal usa su variante oscura. No se utiliza texto blanco pequeño sobre `#ed1d24`.

## Cambios de estilo

- Se elimina el morado del foco, las notas y los textos auxiliares.
- Se reemplaza el brillo táctil del navegador por una pulsación rosa/roja y un foco rojo visible con teclado.
- Se usan sombras suaves, borde superior claro y gradiente discreto para conservar el relieve de la referencia.
- Botones de al menos 48 px y cerrar de 44 px; icono de selección de 56 px. El círculo ofrece Ficha, Animaciones, Reubicar y Reiniciar. Los controles ya existentes dentro de la ficha se conservan.
- Se mantiene la zona central libre para observar y manipular el ave. El HUD conserva su comportamiento de eventos.
- El colibrí del encabezado aparece directamente sobre la tarjeta, sin recuadro rosa ni borde rojo. Su espacio exterior de 44 px se conserva y el padding baja de 7 a 3 px para ampliar la ilustración sin desplazar el texto.
- Se contemplan celulares estrechos, escritorio, modo horizontal y preferencia de movimiento reducido.
- La selección de aves usa ahora un popover de botones propio; cuatro especies siguen deshabilitadas. El selector de fichas de referencia conserva su menú nativo.

## Archivos y mantenimiento

`src/pilot.css` contiene las reglas legibles. El bloque `<style>` de `src/index.html` mantiene una copia idéntica porque el flujo actual de Studio/export usa el HTML y no carga ese CSS externo. Actualizar ambos juntos; no modificar escenas ni runtime para cambiar el aspecto.

Las etiquetas proceden de interfaz.json; la reorganización agrega un gesto contextual sin alterar modelos, escenas ni la lógica de colocación. No se agregan dependencias.

## Comprobaciones

Revisar inicio, exploración, ficha y animaciones en 320–390 px, escritorio y orientación horizontal. Confirmar foco rojo visible, pulsación, ausencia de desplazamiento horizontal, controles dentro del viewport y scroll del panel. Ejecutar las pruebas existentes y compilar.

Validación realizada el 12 de octubre de 2026: HUD real renderizado en Edge sin motor, con callbacks de prueba, en 390×844, 320×568, 1100×800 y 844×390. Foco rojo confirmado por estilo calculado, fichas y animaciones abiertas/cerradas, acciones Comenzar/Reubicar/Reiniciar recibidas, controles dentro del viewport y sin overflow horizontal. Se verificó que el CSS legible y el bloque del HTML sean idénticos. Las 12 pruebas existentes pasan; Webpack compila con los avisos previos de tamaño de assets.

Queda pendiente revisar con cámara real en Android/Chrome e iPhone/Safari: lectura al sol y frente a fondos claros/oscuros, safe areas, selector nativo y pulsación táctil. Las vistas de navegador sin motor verifican el HUD, no el seguimiento AR.

## Menú circular por tap y selector compacto

La tarjeta inferior permanente se sustituye por el icono de ave abajo a la izquierda. Abre las cinco especies y se cierra al seleccionar, tocar fuera o usar Cerrar. El toque exterior se consume para que no coloque ni manipule el modelo.

El selector utiliza un nido con tres huevos como silueta SVG sólida, adaptada de la referencia visual del usuario. El rojo UAO sustituye el negro de la referencia; las separaciones dejan ver el fondo blanco del botón. El padding baja de 14 a 9 px para ampliar el icono, conservando el botón de 56 px, posición, etiqueta accesible «Seleccionar ave» y funcionamiento. pilot.css y el bloque de estilos de index.html se mantienen sincronizados.

En EXPLORAR se conserva exactamente la ruta de tap sobre el ave que el usuario comprobó físicamente: el controlador llama ui.openInfo y únicamente añade el punto del viewport que ya calculaba. Esa entrada ahora presenta el círculo. No se cambian listeners, hit del modelo, distinción de arrastre/pinch, coordenadas ni condiciones de estado. No se usa pulsación prolongada, temporizador de activación ni un nuevo reconocedor del ave.

El círculo permanece al soltar y un segundo tap ejecuta una de las cuatro opciones. Ficha llama a openGuide, una función propia de la UI que conserva la guía, nota ilustrativa, fuente UAO, selector de referencias y Cerrar; no llama nuevamente a openInfo. Los sectores y los botones previos de la guía comparten el despachador de acciones, sin depender de RadialGesture.select ni de su fase. Tocar fuera, Escape o cancelar cierran el círculo sin ejecutar. El toque exterior, incluido su click residual, se consume incluso si cae sobre otro botón del HUD.

Arrastre y pinch no abren el círculo ni la ficha. Los controles del HUD se filtran antes de manipular el ave. Reubicar conserva escala y giro y requiere un toque nuevo para elegir el punto; Cancelar conserva el anterior. Inicio, recuperación y reinicio durante carga/error siguen accesibles. El selector de aves continúa abajo a la izquierda.

Se reutilizan geometría e iconos radiales, ajuste de bordes y áreas seguras, superficies claras, bosque, salvia y rojo UAO. Apertura de 240 ms con desaceleración, cierre de 160 ms con aceleración y resaltado de 140 ms con escala 1.08. La UI ilumina el sector al pasar o tocar; acepta su click solo después de un nuevo pointerdown sobre ese mismo sector. Así el tap que abre no elige accidentalmente una opción bajo el dedo, sin retrasos arbitrarios. Enter/Espacio también ejecutan una opción enfocada. Se respeta movimiento reducido. pilot.css y el bloque de index.html permanecen idénticos y sin cambios.

La integración utiliza SCREEN_TOUCH_START/MOVE/END y GESTURE_START/MOVE/END de ECS para resolver el ave y sus gestos. Pointer Events del navegador complementa contactos sobre HUD, pointercancel y liberación; blur, resize y visibilitychange limpian interacciones. No se inventa un evento SCREEN_TOUCH_CANCEL.

Fuentes: [Input Events de 8th Wall](https://8thwall.org/docs/api/studio/events/input), [Pointer Events de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) y las definiciones locales del paquete ECS.

Validación del nuevo flujo: 24 pruebas existentes aprobadas y compilación correcta con dos avisos previos de tamaño. En dist/bundle.js con World/ECS/raycast simulados pasaron círculo persistente, Ficha una sola vez, referencias, eventos residuales, cierre exterior sobre suelo/HUD, Escape/cancelación, giro/pinch sin menú, las otras tres opciones sin guía, reubicación con toque nuevo, cancelación, reinicio y selector. Se revisaron cuatro tamaños, cuatro taps fuera del centro en canvas reducido, sectores dentro del viewport, teclado, toque emulado y movimiento reducido. Estas pruebas no incluyen cámara, raycast real del GLB ni tracking físico. La nueva presentación queda pendiente en Studio y Android/iPhone; la ruta previa de apertura directa sí fue confirmada por el usuario.

## Coordenadas de simulación

Los eventos ECS normalizan respecto del canvas; Pointer Events, elementFromPoint y el menú DOM trabajan en coordenadas del viewport. src/screen-coordinates.js centraliza la conversión usando getBoundingClientRect de world.three.renderer.domElement. Usar innerWidth/innerHeight para comparar ambos producía un desplazamiento falso al liberar, que cancelaba un tap cuando el canvas estaba reducido o desplazado. El fallo se reprodujo antes de corregirlo y ahora pasan cuatro taps fuera del centro y apertura de Ficha con un canvas de 330×680 situado en (30,80). Las pruebas previas de pantalla completa no cubrían este caso.
