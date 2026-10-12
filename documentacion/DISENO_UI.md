# Interfaz de Aves UAO: naturaleza y exploración

## Referencia y criterio

Se toma el estilo de la imagen aportada por el usuario: tarjetas claras, bordes redondeados, relieves suaves, controles separados y acentos puntuales de color. No se trasladan sus contenidos, ilustraciones ni mecánicas a la aplicación. El enfoque natural se expresa con tonos de vegetación y superficies claras, sin agregar texturas o adornos que compitan con el ave en cámara.

El rojo institucional se conserva como identificador. El texto pasa del rojo oscuro al verde bosque para evitar que todos los elementos compitan como acciones principales. La jerarquía queda así: Comenzar en rojo, Ficha en salvia, otros controles neutros y Reiniciar con texto rojo.

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
- Botones de al menos 48 px y cerrar de 44 px; acciones en dos columnas para que las etiquetas no se compriman.
- Se mantiene la zona central libre para observar y manipular el ave. El HUD conserva su comportamiento de eventos.
- Se contemplan celulares estrechos, escritorio, modo horizontal y preferencia de movimiento reducido.
- El selector sigue siendo nativo: su menú abierto puede conservar la apariencia del sistema operativo. Se personaliza el control cerrado.

## Archivos y mantenimiento

`src/pilot.css` contiene las reglas legibles. El bloque `<style>` de `src/index.html` mantiene una copia idéntica porque el flujo actual de Studio/export usa el HTML y no carga ese CSS externo. Actualizar ambos juntos; no modificar escenas ni runtime para cambiar el aspecto.

No se cambian textos, datos de aves, eventos ni mecánicas AR. No se agregan dependencias.

## Comprobaciones

Revisar inicio, exploración, ficha y animaciones en 320–390 px, escritorio y orientación horizontal. Confirmar foco rojo visible, pulsación, ausencia de desplazamiento horizontal, controles dentro del viewport y scroll del panel. Ejecutar las pruebas existentes y compilar.

Validación realizada el 12 de octubre de 2026: HUD real renderizado en Edge sin motor, con callbacks de prueba, en 390×844, 320×568, 1100×800 y 844×390. Foco rojo confirmado por estilo calculado, fichas y animaciones abiertas/cerradas, acciones Comenzar/Reubicar/Reiniciar recibidas, controles dentro del viewport y sin overflow horizontal. Se verificó que el CSS legible y el bloque del HTML sean idénticos. Las 12 pruebas existentes pasan; Webpack compila con los avisos previos de tamaño de assets.

Queda pendiente revisar con cámara real en Android/Chrome e iPhone/Safari: lectura al sol y frente a fondos claros/oscuros, safe areas, selector nativo y pulsación táctil. Las vistas de navegador sin motor verifican el HUD, no el seguimiento AR.
