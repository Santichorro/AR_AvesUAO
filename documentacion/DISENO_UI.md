# Interfaz de Aves UAO: naturaleza y exploración

## Referencia y criterio

Se toma el estilo de la imagen aportada por el usuario: tarjetas claras, bordes redondeados, relieves suaves, controles separados y acentos puntuales de color. No se trasladan sus contenidos, ilustraciones ni mecánicas a la aplicación. El enfoque natural se expresa con tonos de vegetación y superficies claras, sin agregar texturas o adornos que compitan con el ave en cámara.

El rojo institucional se conserva como identificador. El texto pasa del rojo oscuro al verde bosque para evitar que todos los elementos compitan como acciones principales. Comenzar utiliza rojo; el selector y las opciones radiales usan superficies claras. El sector activo se resalta en rosa/rojo y Reiniciar mantiene su icono y texto rojos.

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
- Botones de al menos 48 px y cerrar de 44 px; icono de selección de 56 px. Las acciones del ave se presentan en cuatro sectores.
- Se mantiene la zona central libre para observar y manipular el ave. El HUD conserva su comportamiento de eventos.
- Se contemplan celulares estrechos, escritorio, modo horizontal y preferencia de movimiento reducido.
- La selección de aves usa ahora un popover de botones propio; cuatro especies siguen deshabilitadas. El selector de fichas de referencia conserva su menú nativo.

## Archivos y mantenimiento

`src/pilot.css` contiene las reglas legibles. El bloque `<style>` de `src/index.html` mantiene una copia idéntica porque el flujo actual de Studio/export usa el HTML y no carga ese CSS externo. Actualizar ambos juntos; no modificar escenas ni runtime para cambiar el aspecto.

Las etiquetas proceden de interfaz.json; la reorganización agrega un gesto contextual sin alterar modelos, escenas ni la lógica de colocación. No se agregan dependencias.

## Comprobaciones

Revisar inicio, exploración, ficha y animaciones en 320–390 px, escritorio y orientación horizontal. Confirmar foco rojo visible, pulsación, ausencia de desplazamiento horizontal, controles dentro del viewport y scroll del panel. Ejecutar las pruebas existentes y compilar.

Validación realizada el 12 de octubre de 2026: HUD real renderizado en Edge sin motor, con callbacks de prueba, en 390×844, 320×568, 1100×800 y 844×390. Foco rojo confirmado por estilo calculado, fichas y animaciones abiertas/cerradas, acciones Comenzar/Reubicar/Reiniciar recibidas, controles dentro del viewport y sin overflow horizontal. Se verificó que el CSS legible y el bloque del HTML sean idénticos. Las 12 pruebas existentes pasan; Webpack compila con los avisos previos de tamaño de assets.

Queda pendiente revisar con cámara real en Android/Chrome e iPhone/Safari: lectura al sol y frente a fondos claros/oscuros, safe areas, selector nativo y pulsación táctil. Las vistas de navegador sin motor verifican el HUD, no el seguimiento AR.

## Menú radial y selector compacto

La tarjeta inferior permanente se sustituye por el icono de ave abajo a la izquierda. Abre las cinco especies y se cierra al seleccionar, tocar fuera o usar Cerrar. El toque exterior se consume para que no coloque ni manipule el modelo.

En EXPLORAR, un tap sobre el hit del ave abre únicamente el radial. Permanece abierto al retirar el dedo; otro tap en Ficha, Animaciones, Reubicar o Reiniciar ejecuta esa opción. La ficha solo se abre desde su sector. Arrastrar o agregar un segundo dedo invalida el tap y permite giro/pinch. El menú tiene Ficha arriba, Animaciones a la derecha, Reubicar abajo y Reiniciar a la izquierda.

Al abrir, el centro se ajusta al viewport y a sus áreas seguras. El centro es neutral; tocar fuera cierra sin manipular el ave. Los límites angulares conservan una separación de 4°. El sector resaltado crece 1.08 veces y no se selecciona por permanecer sobre él: requiere tap/click. Las opciones también admiten Enter/Espacio y Escape cierra el menú.

El click residual del tap que abre el menú se consume para evitar seleccionar un sector automáticamente. Añadir un segundo dedo con el menú abierto cancela hasta retirar los contactos. Un tap exterior solo cierra; Reubicar requiere un toque nuevo en el suelo para confirmar el punto. Cancelar reubicación, inicio, recuperación y reinicio durante carga/error permanecen accesibles.

Configuración en RADIAL_CONFIG de src/radial-gesture.js: radius, deadRadius, moveThreshold, edgePadding y visualScale. Se eliminaron holdMs, confirmMs y sus temporizadores. Apertura de 240 ms, cierre de 160 ms y resaltado de 140 ms, con curvas configurables en variables CSS. El movimiento reducido desactiva las transiciones.

La integración utiliza SCREEN_TOUCH_START/MOVE/END y GESTURE_START/MOVE/END de ECS para resolver el ave y sus gestos. Pointer Events del navegador complementa contactos sobre HUD, pointercancel y liberación; blur, resize y visibilitychange limpian interacciones. No se inventa un evento SCREEN_TOUCH_CANCEL.

Fuentes: [Input Events de 8th Wall](https://8thwall.org/docs/api/studio/events/input), [Pointer Events de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) y las definiciones locales del paquete ECS.

Validación de la activación por tap: 24 pruebas unitarias aprobadas y compilación correcta. En el build con World/ECS/raycast simulados pasaron apertura persistente, cuatro opciones por tap, tap exterior sin manipulación, giro/pinch, selector, cancelación, reinicio, cuatro bordes, teclado y pantallas de 320×568 a 1100×800. La UI no abre la ficha directamente al tocar el ave. Estas pruebas no incluyen cámara, raycast real del GLB ni tracking físico.

## Coordenadas de simulación

Los eventos ECS normalizan respecto del canvas; Pointer Events, elementFromPoint y el menú DOM trabajan en coordenadas del viewport. src/screen-coordinates.js centraliza la conversión usando getBoundingClientRect de world.three.renderer.domElement. Usar innerWidth/innerHeight para comparar ambos producía un desplazamiento falso al liberar, que cancelaba un tap cuando el canvas estaba reducido o desplazado. El fallo se reprodujo antes de corregirlo y ahora pasan cuatro taps fuera del centro y apertura de Ficha con un canvas de 330×680 situado en (30,80). Las pruebas previas de pantalla completa no cubrían este caso.
