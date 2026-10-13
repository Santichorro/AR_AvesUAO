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
- En el título «Aves UAO», solo «UAO» usa rojo UAO (#ed1d24), como el colibrí; «Aves» conserva el verde bosque. El texto completo continúa procediendo de interfaz.json.
- Los avisos posteriores a Comenzar permiten cerrar con una X de 16 px, sin círculo, fondo ni borde, en la esquina superior derecha. Su área táctil es de 32 px y conserva la etiqueta accesible «Cerrar mensaje». El cierre desvanece la tarjeta en 180 ms y la desplaza 6 px; no reaparece por actualizaciones del mismo aviso. Una nueva etapa o un mensaje distinto vuelve a mostrar la tarjeta. INTRO y ERROR mantienen Comenzar/Reintentar disponibles; movimiento reducido cierra inmediatamente. Los contactos durante la salida no actúan sobre el suelo.

El cierre de avisos se verificó sobre dist/bundle.js con ECS simulado en 390×844, 320×568 y 844×390: X sin fondo/borde, opacidad intermedia, eliminación tras la salida, persistencia ante el mismo estado, nueva guía de reubicación, protección del ave y movimiento reducido. Comenzar y Reintentar permanecen accesibles; también se comprobó cerrar durante la entrada. Pasaron la regresión del menú/gestos y de la transición de inicio, las 24 pruebas existentes y la compilación. Falta revisar el tacto y la animación en Android/iPhone.
- Al pulsar Comenzar, la tarjeta de bienvenida sale en 220 ms con desvanecimiento y desplazamiento de 10 px. El mensaje vigente entra en 320 ms, tras 80 ms, con desaceleración. La copia visual de salida no anuncia texto ni ejecuta botones y consume contactos durante su salida. El estado avanza inmediatamente; no se retrasa la carga o colocación. Al completar la animación se elimina la copia; error y dispose limpian la transición. Con movimiento reducido el cambio es inmediato.

La transición de inicio se comprobó sobre el bundle generado en Edge con ECS simulado, en 390×844, 320×568 y 844×390: opacidad intermedia de salida/entrada, avance inmediato a ESCANEO, contacto sobre la copia sin colocación, eliminación de la copia y colocación posterior. También se verificó movimiento reducido desde inicio y al activarlo durante la animación. Pasan las 24 pruebas existentes y la compilación, con los dos avisos previos de tamaño. Falta evaluar la suavidad percibida en Studio y teléfonos reales.
- Se contemplan celulares estrechos, escritorio, modo horizontal y preferencia de movimiento reducido.
- La selección de aves usa un popover de botones propio; cuatro especies siguen deshabilitadas. La ficha del Colirufo no incluye un selector de referencias.

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

El cierre del selector y el de la ficha del Colirufo se representan con la misma X de trazos redondeados en un control circular de 44 px. No muestran el texto «Cerrar», pero lo conservan como etiqueta accesible y tooltip. Mantienen sus acciones existentes y la animación de salida del selector. El cierre del panel de animaciones conserva su presentación.

El selector entra en 260 ms con desvanecimiento, desplazamiento vertical de 10 px y escala de 0.97 a 1; sale en 180 ms. Cerrar, elegir un ave, el icono, Escape y el toque exterior usan la misma salida. El estado lógico y aria-expanded cambian inmediatamente; hidden se aplica al terminar la transición de opacidad. Durante la salida el contenido usa inert, mientras el contenedor consume toques para evitar acciones detrás del HUD. Reabrir a mitad de salida invierte la transición, sin clones ni temporizadores. Movimiento reducido produce cambios inmediatos; transición cancelada y dispose completan la limpieza. Referencias: [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) y [transitioncancel](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitioncancel_event).

Validación del selector sobre dist/bundle.js en Edge con ECS simulado: entrada/salida con opacidad intermedia, cinco rutas de cierre, controles inactivos durante la salida, cuatro aves pendientes intactas, inversión rápida y movimiento reducido desde inicio o durante cierre. Pasó en 390×844, 320×568 y 844×390 sin errores. También pasó la regresión de menú circular, guía, giro/pinch, reubicación y reinicio; las 24 pruebas existentes y la compilación siguen aprobadas. Estilos inline y pilot.css idénticos. Falta revisar la suavidad percibida en Studio y Android/iPhone.

En EXPLORAR se conserva exactamente la ruta de tap sobre el ave que el usuario comprobó físicamente: el controlador llama ui.openInfo y únicamente añade el punto del viewport que ya calculaba. Esa entrada ahora presenta el círculo. No se cambian listeners, hit del modelo, distinción de arrastre/pinch, coordenadas ni condiciones de estado. No se usa pulsación prolongada, temporizador de activación ni un nuevo reconocedor del ave.

El círculo permanece al soltar y un segundo tap ejecuta una de las cuatro opciones. Ficha llama a openGuide, que presenta la ficha específica del Colirufo y Cerrar; no llama nuevamente a openInfo. Los sectores y los botones de la ficha comparten el despachador de acciones, sin depender de RadialGesture.select ni de su fase. Tocar fuera, Escape o cancelar cierran el círculo sin ejecutar. El toque exterior, incluido su click residual, se consume incluso si cae sobre otro botón del HUD.

Arrastre y pinch no abren el círculo ni la ficha. Los controles del HUD se filtran antes de manipular el ave. Reubicar conserva escala y giro y requiere un toque nuevo para elegir el punto; Cancelar conserva el anterior. Inicio, recuperación y reinicio durante carga/error siguen accesibles. El selector de aves continúa abajo a la izquierda.

Se reutilizan geometría e iconos radiales, ajuste de bordes y áreas seguras, superficies claras, bosque, salvia y rojo UAO. Apertura de 240 ms con desaceleración, cierre de 160 ms con aceleración y resaltado de 140 ms con escala 1.08. La UI ilumina el sector al pasar o tocar; acepta su click solo después de un nuevo pointerdown sobre ese mismo sector. Así el tap que abre no elige accidentalmente una opción bajo el dedo, sin retrasos arbitrarios. Enter/Espacio también ejecutan una opción enfocada. Se respeta movimiento reducido. pilot.css y el bloque de index.html permanecen idénticos y sin cambios.

La integración utiliza SCREEN_TOUCH_START/MOVE/END y GESTURE_START/MOVE/END de ECS para resolver el ave y sus gestos. Pointer Events del navegador complementa contactos sobre HUD, pointercancel y liberación; blur, resize y visibilitychange limpian interacciones. No se inventa un evento SCREEN_TOUCH_CANCEL.

Fuentes: [Input Events de 8th Wall](https://8thwall.org/docs/api/studio/events/input), [Pointer Events de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) y las definiciones locales del paquete ECS.

Validación del flujo: 24 pruebas existentes aprobadas y compilación correcta con dos avisos previos de tamaño. En dist/bundle.js con World/ECS/raycast simulados pasaron círculo persistente, Ficha del Colirufo una sola vez, fotografía real, eventos residuales, cierre exterior, Escape/cancelación, giro/pinch, las otras tres opciones, reubicación con toque nuevo, cancelación, reinicio y selector. Se revisaron cuatro tamaños, cuatro taps en canvas reducido, teclado, toque emulado y movimiento reducido. Estas pruebas no incluyen cámara, raycast real del GLB ni tracking físico. El usuario confirmó el funcionamiento del radial; la ficha renovada queda pendiente en Studio y Android/iPhone.

## Ficha del Colibrí Colirufo

El modelo existente representa al Colirufo por decisión del usuario. La ficha muestra «Colibrí Colirufo», Amazilia tzacatl en cursiva y Trochilidae como información secundaria. La fotografía aportada conserva su proporción 480×639, sin recorte, y se limita a 220 px de ancho para leerla en móvil. Su crédito indica que fue proporcionada por el usuario; la cita académica se refiere exclusivamente a la guía UAO, primera edición 2023, página 17.

Descripción, Hábitat, Comportamiento y Rasgos de identificación se presentan con títulos de 15 px en negrita, verde de vegetación y una línea lateral discreta. La fuente se separa al pie y las acciones existentes permanecen accesibles mediante scroll. Se retiraron nota de especie no confirmada, selector de referencias, candidatas y fotografía pendiente. Los datos de otras fichas se archivan en REFERENCIAS_COLIBRIES.json para futuras etapas. Se mantienen rojo UAO, superficies claras, bordes suaves y sombras ligeras.

La comprobación visual del bundle en 390×844, 320×568, 844×390 y 1100×1000 confirma fotografía cargada, proporción natural, subtítulos visibles, encabezado ajustado, scroll y acciones sin desbordamiento horizontal. Conserva ID colibri, ruta del GLB, clips y controles. No hay comprobación física de esta ficha todavía.

## Coordenadas de simulación

Los eventos ECS normalizan respecto del canvas; Pointer Events, elementFromPoint y el menú DOM trabajan en coordenadas del viewport. src/screen-coordinates.js centraliza la conversión usando getBoundingClientRect de world.three.renderer.domElement. Usar innerWidth/innerHeight para comparar ambos producía un desplazamiento falso al liberar, que cancelaba un tap cuando el canvas estaba reducido o desplazado. El fallo se reprodujo antes de corregirlo y ahora pasan cuatro taps fuera del centro y apertura de Ficha con un canvas de 330×680 situado en (30,80). Las pruebas previas de pantalla completa no cubrían este caso.
