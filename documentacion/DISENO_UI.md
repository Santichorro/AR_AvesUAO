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
- Botones de al menos 48 px y cerrar de 44 px; icono de selección de 56 px. Las acciones de Animaciones, Reubicar y Reiniciar se presentan dentro de la ficha.
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

## Guía directa y selector compacto

La tarjeta inferior permanente se sustituye por el icono de ave abajo a la izquierda. Abre las cinco especies y se cierra al seleccionar, tocar fuera o usar Cerrar. El toque exterior se consume para que no coloque ni manipule el modelo.

Se recupera la ruta anterior a los cambios de menú circular: en EXPLORAR, un tap sobre el ave abre directamente Ficha del colibrí. Conserva la nota del modelo ilustrativo, fuente UAO, selector de referencias y contenido de la guía. Cerrar o Escape cierra el panel. No se requiere hold ni selección intermedia.

El panel mantiene superficies claras, bordes suaves, salvia y rojo UAO, scroll y tamaños móviles. Los botones Probar animaciones, Reubicar y Reiniciar se colocan dentro de la ficha para mantener esas funciones accesibles. El selector de aves sigue abajo a la izquierda.

Arrastre y pinch no abren la ficha. Los controles del HUD se filtran antes de manipular el ave. Reubicar conserva escala y giro y requiere un toque nuevo para elegir el punto; Cancelar conserva el anterior. Inicio, recuperación y reinicio durante carga/error siguen accesibles.

El recurso radial y sus pruebas permanecen en el proyecto, pero ya no se activa desde el ave. El flujo actual es tap → guía. Se conserva el estilo y la preferencia de movimiento reducido.

La integración utiliza SCREEN_TOUCH_START/MOVE/END y GESTURE_START/MOVE/END de ECS para resolver el ave y sus gestos. Pointer Events del navegador complementa contactos sobre HUD, pointercancel y liberación; blur, resize y visibilitychange limpian interacciones. No se inventa un evento SCREEN_TOUCH_CANCEL.

Fuentes: [Input Events de 8th Wall](https://8thwall.org/docs/api/studio/events/input), [Pointer Events de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) y las definiciones locales del paquete ECS.

Validación de la guía restaurada: 24 pruebas existentes aprobadas y compilación correcta. En dist/bundle.js con World/ECS/raycast simulados pasaron guía directa, cambio de referencia, cierre, suelo sin ficha, giro/pinch sin panel, animaciones, reubicación/cancelación, reinicio y selector. Se revisaron cuatro tamaños de pantalla y cuatro taps fuera del centro en canvas reducido. Estas pruebas no incluyen cámara, raycast real del GLB ni tracking físico.

## Coordenadas de simulación

Los eventos ECS normalizan respecto del canvas; Pointer Events, elementFromPoint y el menú DOM trabajan en coordenadas del viewport. src/screen-coordinates.js centraliza la conversión usando getBoundingClientRect de world.three.renderer.domElement. Usar innerWidth/innerHeight para comparar ambos producía un desplazamiento falso al liberar, que cancelaba un tap cuando el canvas estaba reducido o desplazado. El fallo se reprodujo antes de corregirlo y ahora pasan cuatro taps fuera del centro y apertura de Ficha con un canvas de 330×680 situado en (30,80). Las pruebas previas de pantalla completa no cubrían este caso.
