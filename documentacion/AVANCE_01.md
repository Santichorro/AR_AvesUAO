# Avance 01 — Colibrí de colocación directa

Fecha: 12 de octubre de 2026. Rama de trabajo: juandate.

## Implementado

- Colocación de una sola ave con toque válido sobre Ground, sin isla ni mapa previo. Tras cargar, llega desde un origen elevado aleatorio, aterriza y pasa a reposo antes de permitir explorar.
- Estados INTRO, PREPARANDO, ESCANEO, COLOCANDO, ATERRIZANDO, EXPLORAR, REUBICAR y ERROR.
- Seguimiento NORMAL requerido en móvil antes de colocar o reubicar; la detección no crea contenido automáticamente.
- Una raíz de colocación y un modelo hijo; animaciones no cambian el punto elegido.
- Doble toque bloqueado mientras carga o existe un modelo.
- Reubicar mueve la raíz existente; cancelar conserva el punto anterior.
- Reiniciar elimina modelo/raíz, cancela timeout y listeners y descarta cargas tardías.
- Arrastrar horizontalmente sobre el área AR rota la raíz del ave en el eje Y; un arrastre no abre la ficha ni cambia el punto de colocación.
- El gesto de dos dedos escala uniformemente el modelo hijo entre 0.12 y 0.60, sin cambiar su animación, orientación de raíz ni ubicación. Los límites y sensibilidad están en `aves.json`.
- Ficha única de Colibrí Colirufo (Amazilia tzacatl, Trochilidae) desde JSON, con fotografía aportada y contenido de página 17. El usuario asigna esa representación al GLB existente; no se reemplaza ni se identifica nuevamente el modelo.
- Seis clips reales con pausa, reposo y vuelta a reposo después de clips no cíclicos. Elegir un clip, Volver a reposo o Pausar/continuar ejecuta la acción de inmediato y cierra el panel con salida suave de 180 ms para observar el ave.
- Selector preparado para las cinco aves; solo colibrí disponible.
- Vista 3D de escritorio para probar sin cámara. No es una simulación certificada de RA.
- Interfaz natural con tarjetas claras, relieve suave, textos verde bosque y rojo UAO. Foco y pulsación sin morado; controles de al menos 48 px. Ver [DISENO_UI.md](DISENO_UI.md) para paleta y criterio visual.
- Selector compacto con icono de ave abajo a la izquierda: muestra las cinco opciones, solo colibrí habilitado. Se cierra al elegir, tocar fuera o pulsar Cerrar.
- Un tap breve sobre el ave abre el menú circular y este permanece abierto al retirar el dedo. Un segundo tap ejecuta Ficha, Animaciones, Canto, Reubicar o Reiniciar y cierra el círculo. Tocar fuera o pulsar Escape lo cierra sin acciones.
- La ruta de tap que el usuario comprobó físicamente se conserva: tap sobre el modelo → ui.openInfo(point). Solo se pasa el punto del viewport que ya calculaba el controlador. La UI presenta el círculo; openGuide presenta la ficha del Colirufo únicamente al elegir Ficha, conservando Cerrar y las acciones anteriores. Se retiraron selector de referencias, candidatas y avisos de modelo genérico.
- Arrastre y pinch no abren el círculo ni la ficha. Se mantienen listeners, hit del modelo, condiciones de estado, limpieza y conversión canvas/viewport. No se activa el reconocedor RadialGesture para abrir o elegir: los sectores usan directamente las mismas acciones de los botones. Un nuevo pointerdown en el sector es necesario para aceptar su click; los eventos residuales de apertura o cancelación se ignoran sin temporizadores de activación.
- Cancelar reubicación permanece visible fuera del radial. Reiniciar durante carga/error y Comenzar/Reintentar conservan acceso contextual.
- Canto es la quinta opción del círculo: cierra el menú e inicia el MP3 aportado desde ese mismo click. Un altavoz rojo con ondas y «Escucha el canto» indica reproducción real, con entrada/salida suave. Pausar conserva el punto de reproducción y ofrece Continuar; el panel permanece abierto y las ondas se detienen. La X pequeña detiene y cierra suavemente. Repetir Canto reinicia una única instancia; fin, cierre, errores, reubicación, selección de ave, cambio de fase, pestaña oculta y dispose limpian el audio y su panel.

## Recursos y fuentes

El GLB original (10.942.732 bytes) se conserva en Downloads. La copia integrada tiene 3.274.900 bytes; mantiene los canales de animación y 58 articulaciones. Base color a 1024 px; normal y roughness a 512 px. Las texturas necesarias siguen embebidas. No se deben copiar de nuevo las texturas externas. Ver COLIBRI_RECURSO.json.

Se ocultan en la copia las mallas Prop_Perch, Prop_TrumpetFlower y Prop_TrumpetFlower_Stem para mostrar solo el ave. El gesto de alimentación puede reproducirse sin flor. No se ha reducido el detalle de la geometría skinned: todavía requiere medición en móvil.

Fuente académica vigente de esta ficha: GUIA AVES UAO FINAL.pdf, primera edición 2023, página 17, revisada visualmente. Autores indicados en página 2: Germán Morales Zuñiga y Natalia Lenis Sánchez. La sección Colibrí Colirufo respalda hábitat, alimentación a distintas alturas, visita a comederos, cola canela no horquetada y vientre gris manchado; la ilustración muestra plumaje verde. No se añaden dieta, medidas o distribución no especificadas. La asignación del modelo al Colirufo es una decisión del usuario para el proyecto.

Fotografía: src/assets/img/colirufo.jpg, copia íntegra del archivo aportado (480×639, 28.096 bytes). El original permanece en Downloads. La imagen se muestra completa, proporcional, con alt descriptivo y crédito «Fotografía proporcionada por el usuario», independiente de la cita académica. Autor y licencia no se inventan. Las referencias previas de otras especies se conservan en REFERENCIAS_COLIBRIES.json, fuera de la ficha y del bundle activo.

Canto: src/assets/audio/colibri_canto.mp3, copia íntegra de colirufoSound.mp3 aportado por el usuario para el Colirufo (484.891 bytes; duración decodificada en Edge: 30,296 s). Ruta y procedencia en aves.json; autor y licencia no proporcionados, registrados como null. No se atribuye al PDF ni se añade una animación vocal inexistente al GLB. El original de Downloads permanece sin cambios. Este avance usa audio de exploración no espacial; el audio espacial del reto sigue pendiente.

Autoría del modelo según metadatos: animalanimator.com. No se encontró una licencia en los archivos aportados. Registrar la licencia real y la atribución necesaria antes de publicar externamente este asset.

## Cómo probar

1. Abrir la carpeta en Studio o compilar desde la raíz con npm run build.
2. Para revisar en escritorio, servir dist/ y abrir localhost. Es una vista 3D; tocar el plano virtual del suelo coloca el ave.
3. Pulsar Comenzar y esperar la carga del modelo. En móvil, permitir cámara y estabilizar el seguimiento sobre el suelo.
4. Tocar el lugar elegido: se carga una sola ave y llega desde un origen elevado aleatorio durante 2,25 s. Debe plegar las alas y pasar a reposo con mezcla de 160 ms. Durante la llegada, tocar o hacer pinch no abre el radial ni duplica o escala el ave; Reiniciar permanece disponible.
5. Tocar brevemente el ave: debe aparecer solo el círculo y permanecer al retirar el dedo. Tocar Ficha para abrir Colibrí Colirufo una sola vez. Comparar nombre, fotografía y cuatro secciones con página 17; no debe aparecer selector de referencias ni lista de especies. Cerrar permite volver a la vista AR.
6. Tocar el ave y después Animaciones; recorrer los seis clips, pausar y volver a reposo.
7. Elegir Reubicar en el círculo; un toque nuevo confirma otro punto. La selección del sector no confirma una ubicación. Cancelar conserva el anterior.
8. Pulsar Reiniciar mientras carga, durante descenso, en la transición a reposo y después de colocar; no debe reaparecer un modelo ni completar una llegada antigua.
9. Repetir tres recorridos. Los botones y selects no deben colocar modelos detrás del HUD.
10. Arrastrar horizontalmente sobre el área AR: debe rotar sobre su eje Y sin abrir el círculo. Tocar suelo o HUD no abre el círculo. Tocar fuera con el círculo abierto solo lo cierra, también sobre otro control del HUD.
11. Hacer pinch con dos dedos: la escala debe cambiar de forma uniforme, respetar los límites y conservar el punto de apoyo. Reubicar debe mantener giro y escala; Reiniciar debe restaurarlos para la siguiente colocación.
12. Probar un tap sobre el ave fuera del centro y con canvas reducido/desplazado: debe abrir el círculo ajustado a la pantalla. Repetir en horizontal y con áreas seguras. La ficha abierta desde su sector debe permitir scroll.
13. Repetir apertura/cierre, Escape, scroll de la ficha, animación, reubicación/cancelación y reinicio. El tap inicial, una liberación residual y pointercancel no deben seleccionar sectores. El HUD no debe modificar el ave por gestos detrás de los paneles.
14. Elegir Canto: el círculo sale suavemente y el audio empieza sin esperar su salida. Durante reproducción aparece «Escucha el canto» con ondas y botones Pausar/Continuar y una X pequeña. Pausar conserva el tiempo y permite continuar desde ese punto. La X detiene y cierra con salida suave de 180 ms; los controles se desactivan durante el cierre. Al finalizar también desaparece suavemente. Repetir Canto reinicia sin superponer. Reubicar, Reiniciar, seleccionar un ave y ocultar la pestaña detienen el audio. El indicador queda apartado al abrir el círculo para evitar solapamientos y vuelve al cerrarlo si el canto sigue sonando.

### Validación de Canto — 13 de octubre de 2026

Actualización de controles: pasan 34 pruebas unitarias, incluidas tres nuevas para conservar tiempo al pausar/continuar, cerrar en pausa y descartar rechazos de cargas interrumpidas. El bundle con MP3 real se revisó en Edge en 390×844, 320×568 y 844×390: tiempo estable mientras pausa, continuación desde ese tiempo, una sola instancia, X sin círculo, cierre en reproducción o pausa, opacidad intermedia de salida, controles desactivados durante el cierre, eventos residuales, teclado y movimiento reducido. Las acciones no cambian posición, giro ni escala del ave. Pasó la regresión del radial y sus otras cuatro opciones. Build correcto con los dos avisos previos de tamaño; CSS e inline idénticos. El navegador headless está silenciado y ECS/raycast son simulados; quedan por probar en Studio y Android/iPhone el tacto, la escucha real y las interrupciones del dispositivo.

Pasan las 31 pruebas unitarias existentes/adaptadas, incluidas cinco nuevas de instancia única, activación síncrona, eventos de reproducción, carreras entre solicitudes, bloqueos, errores y dispose. La geometría prueba los cinco centros y sus separaciones. Compilación correcta con dos avisos de tamaño; el MP3 añade 474 KiB a los assets señalados por webpack. El MP3 original, src y dist tienen el mismo SHA-256; CSS e inline sincronizados.

Sobre dist/bundle.js, Edge decodificó el MP3 real con progreso de currentTime y evento ended en 390×844, 320×568 y 844×390. Se comprobaron cinco sectores accesibles, color rojo, ondas, indicador, una instancia, repetición, fin, reubicación/cancelación, selección y reinicio, sin errores de página. En canvas reducido se verificaron bloqueo de permisos simulado, error por URL inexistente, movimiento reducido, pestaña oculta y eliminación del controlador con limpieza del audio. Pasó también la regresión de ficha, seis clips, tap, eventos residuales, giro/pinch, reubicación y reinicio, teclado, toque emulado y áreas seguras. World/ECS/raycast son simulados; el navegador decodifica audio real pero la ejecución headless está silenciada: no se ha verificado escucha física, volumen, cámara ni tracking.

Pendiente en Studio, Android/Chrome e iPhone/Safari: reproducción desde el segundo tap, volumen y salida del dispositivo, interrupciones, regreso desde segundo plano, suavidad sobre cámara real y controles en áreas seguras. No se hizo push ni despliegue.

## Pruebas automatizadas

### Llegada animada — 13 de octubre de 2026

Flujo: COLOCANDO espera GLTF_MODEL_LOADED; ATERRIZANDO mueve una única raíz y controla el clip 05_Landing; EXPLORAR se habilita después de reposo. El destino es una copia del punto elegido; el origen se sortea una vez, 0,45–0,75 unidades por encima y 0,35–0,65 lateralmente. El pico se orienta hacia ese destino considerando el giro local del GLB. Reubicar no repite la llegada y conserva giro y escala.

El GLB real contiene 05_Landing de 2,5 s y 151 claves de traslación LINEAR del hueso root. Se revisaron poses en Blender a 0, 0,75, 1,25, 1,5, 1,75, 2, 2,25 y 2,5 s, además de reposo. Las alas siguen abiertas entre 1,5 y 2 s y quedan plegadas hacia 2,25 s; la traslación final coincide con el inicio del reposo. colibri-aterrizaje.json conserva la curva exacta y el SHA-256 del modelo. aves.json centraliza duración, altura, radio, curva vertical y mezcla.

El tick ECS usa world.time.delta en milisegundos, convertido a segundos. Tras GLTF_MODEL_LOADED el motor reproduce 05_Landing con timeScale positivo (contactoSegundos / duracionSegundos); no se reasigna time durante el descenso. La trayectoria y el clip avanzan con el delta ECS. timeScale=0 congelaba las alas aunque se escribiera time; se eliminó ese control. Se conserva la compensación del root, el destino exacto, un fotograma de contacto y la mezcla de 0,16 s a reposo. Perder seguimiento pausa tanto el clip como el reloj del movimiento; recuperar seguimiento continúa ambos sin reiniciar. Reset/dispose limpian entidades/listeners y descartan generaciones antiguas.

Pasan 43 pruebas unitarias, sin omisiones: origen variable/acotado, curva y destino exactos, resultados a 15/30/60/120 fps, orientación, compensación, cancelación, estados y SHA del GLB. Build correcto con los dos avisos previos de tamaño. Sobre el bundle con ECS/carga/raycast simulados pasaron bloqueo de tap/pinch, doble toque, reloj/seguimiento, pose final independiente, reinicio durante carga/descenso/mezcla, carga tardía, evento de colocación único, reubicación/cancelación y dispose. Pasaron la regresión del menú, ficha, clips, giro/pinch y controles del MP3 real, incluida pausa/continuación/X, móvil y horizontal.

Validación visual separada: Blender renderizó el GLB real con las posiciones y compensaciones calculadas por arrival-motion.js en ocho instantes del recorrido y reposo. Confirma alas abiertas durante aproximación y plegadas al finalizar, sin otro desplazamiento interno ni salto al reposo. La corrección del aleteo se contrastó además con ECS 3.2.0 real y el GLB original en Edge: los huesos permanecen inmóviles con timeScale=0 y cambian con reproducción positiva. Pendiente en Studio y Android/iPhone: llegada completa, mezcla real, suavidad, visibilidad del origen respecto de la cámara y seguimiento.

**Límite del apoyo:** se conserva posicionLocal=(0,0.25,0) y escala 0,25 del proyecto. El ancla termina exactamente en el punto tocado, pero el GLB está diseñado para una percha y esa altura de exhibición mantiene las patas por encima de la superficie. Esta entrega no certifica apoyo de patas en el suelo ni elimina esa separación previa: requiere otra calibración del apoyo/pose, independiente de sincronizar el aterrizaje. El GLB y las escenas no se modificaron.

Ejecutar npm test (o node --test tests/*.test.cjs). Pasan las 24 pruebas de colocación, inspección, recursos de interacción y coordenadas. Las pruebas unitarias de RadialGesture comprueban ese recurso aislado; no demuestran por sí solas el flujo actual, cuya apertura y selección se presentan en la UI.

La revisión de dist/bundle.js en Edge con World/ECS/raycast simulados comprueba tap → círculo → segundo tap en Ficha, una sola apertura del Colirufo y Cerrar. Verifica nombre científico, familia, cuatro subtítulos, cita exclusiva de página 17, foto cargada desde dist y ausencia de selector/avisos/candidatas. También comprueba eventos residuales, cancelación, cierre exterior, Escape, giro/pinch, las otras tres opciones, clips/pausa, reubicación con toque nuevo conservando entidad/giro/escala, cancelación, reinicio y selector. Regresión en 390×844, 320×568, 844×390 y 1100×800, cuatro taps con canvas 330×680 en (30,80), teclado, toque emulado y movimiento reducido. Revisión visual y scroll en 390×844, 320×568, 844×390 y 1100×1000: foto proporcional, subtítulos de 15 px en negrita, botones accesibles y sin desbordamiento. Webpack compila con los dos avisos previos de tamaño; CSS y estilos inline están sincronizados. Este entorno no usa cámara, carga real del GLB ni tracking; no acredita compatibilidad física.

Se reprodujo una cancelación incorrecta del tap con un canvas reducido (330×680, desplazado 30 px a la derecha y 80 px abajo dentro de una ventana 390×844): el controlador mezclaba posiciones normalizadas respecto del canvas con píxeles de toda la ventana. La corrección utiliza el rectángulo de world.three.renderer.domElement para convertir en ambas direcciones. Pasaron cuatro taps fuera del centro y la selección de Ficha en ese canvas, además de las pruebas anteriores. Falta comprobar la sesión real de Studio y teléfonos.

Para inspeccionar el estado sin modificarlo: window.__AR_AVES_DEBUG__(). Devuelve fase, posición, raíz/modelo, clip, giro/escala y estado del reconocedor radial anterior. Ese estado permanece idle durante el menú presentado por la UI; no indica si el círculo está visible. La clase is-open y aria-hidden de .aves-radial describen su visibilidad. El diagnóstico no permite introducir posiciones falsas ni forzar tracking.

## Pendiente físico y de contenido

- El usuario confirmó la ruta de tap y el funcionamiento del menú circular. La nueva ficha del Colirufo requiere comprobación en Studio, Android/Chrome e iPhone/Safari: carga de fotografía, scroll, legibilidad, cierre, subtítulos y botones sin acciones detrás del HUD. Revisar también giro/pinch, permisos, tracking, apoyo, áreas seguras, horizontal y rendimiento.
- El hit de la plantilla se calcula sobre Ground con tracking activo; no ofrece selección de múltiples planos físicos como ARKit/ARCore. Comprobar el apoyo real en el suelo con dispositivos.
- El aro del HUD orienta el escaneo; no afirma ser una retícula proyectada con hit-test continuo.
- Canto aportado integrado; registrar autoría/licencia de audio, fotografía y modelo. La representación del Colirufo ya está definida por el usuario.
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

### Corrección del aleteo · 13 de octubre de 2026

Se eliminó la reproducción congelada durante llegada. En Edge, el bundle generado, ECS 3.2.0 y el GLB originales produjeron 17 muestras de aproximación con 17 poses distintas del húmero izquierdo; la raíz terminó en el punto elegido y la fase final fue EXPLORAR con reposo. La escena temporal de prueba usa cámara 3D sin SLAM y no modifica la escena del proyecto. Pasaron nuevamente las 43 pruebas unitarias y el build (dos avisos previos de tamaño). La prueba del bundle con ECS simulado confirmó bloqueo de inspección, pausa por seguimiento, reinicios durante carga/descenso/mezcla, reubicación y limpieza. Esta evidencia no sustituye la prueba AR física en Studio, Android e iPhone.


## Catálogo y modelos compartidos · 13 de octubre de 2026

La selección vigente es Martín Pescador, Paloma Doméstica, Loro y Colibrí Colirufo. Hay tres especies habilitadas; Loro conserva su entrada pendiente. Pechirrojo y Azulejo salen del recorrido; no se borran recursos de integrantes ni se inventa una quinta ave. Los cambios de escena, efectos de ui-sounds.js y GLB originales permanecen intactos.

El selector llama a controls.species. PlacementSession.changeSpecies invalida generaciones, elimina la instancia anterior y conserva el punto. PREPARANDO espera recurso y seguimiento; COLOCANDO carga la sustitución y loaded entra directamente en EXPLORAR con reposo. Antes de colocar no se crea contenido; después de Reiniciar se exige un toque nuevo y se reproduce la llegada propia del ave elegida. Reubicar conserva escala y orientación de la misma instancia. Los fetch abortados y eventos de modelos eliminados no pueden restaurar una selección anterior.

pilot-ui.ts mantiene una sola UI: setBird reconstruye únicamente datos de ficha y botones de clips, actualiza aria-pressed y el encabezado, libera el audio anterior y crea el controlador del nuevo recurso. Las etiquetas usan {ave} en interfaz.json. Se conservan el círculo de cinco opciones, icono de nido, X, transiciones, giro/pinch y efectos de interfaz. Sin estilos nuevos: pilot.css e inline siguen sincronizados.

| Ave | Recurso usado | Clips y llegada | Exhibición |
|---|---|---|---|
| Colirufo | assets/models/colibri.glb | Seis clips originales; 05_Landing, contacto 2,25 s | Escala 0,25; límites 0,12–0,60; offset anterior |
| Martín Pescador | assets/models/martin_pescador_configurado.glb | Diez nombres originales, con inicios desplazados a cero; fly_endA_bird → idleA1_bird; 3,3 s | Escala 0,18; límites 0,09–0,45; frente +Z; offset Y −0,1066 |
| Paloma | assets/models/paloma_configurada.glb | Recortes reales de Take 001: vuelo 4–5 s, aterrizaje 18–20 s, reposo 35–40 s; llegada 2 s | Escala 1,2; límites 0,6–3; frente +X y giro local −π/2; offset Y 0,001 |

MartinPescador.glb y paloma.glb se conservan como originales. Las copias configuradas guardan rangos originales y SHA en extras, mantienen geometría, texturas y rig, y compactan buffers no utilizados. El material principal de la Paloma usa metallicFactor=0 para evitar tratar sus plumas como metal cuando no hay mapa de entorno. No se inventan movimientos: sus tres clips derivados proceden de intervalos verificados de Take 001. Martín conserva los nombres reales; en el original idleA1_bird empieza a los 23,63 s, por lo que reproducirlo desde cero causaba una espera prolongada.

Cada ave tiene su calibración JSON y dirección frontal propia. Las curvas de root se expresan en coordenadas del modelo aplicando los ancestros estáticos del GLB. rootContacto cancela la traslación hasta la pose final sin salto; rootReposo registra la referencia de reposo. La reproducción nativa mantiene velocidad positiva y pausa junto con la trayectoria al perder seguimiento. El contacto visual y el apoyo físico deben revisarse en móvil: terminar el ancla en el punto elegido no prueba el contacto de las patas con una superficie AR.

La Paloma usa Columba livia, familia Columbidae, texto e ilustración de la guía UAO, página 15. Para Martín se usa la referencia Megaceryle torquata, familia Cerylidae, del índice de la página 9; el GLB se considera ilustrativo y no confirma taxonómicamente esa especie. Faltan ficha detallada e imagen de referencia. Ambos carecen de canto aportado: Canto cierra el radial e informa que el recurso está pendiente; no utiliza el MP3 del Colirufo. Los créditos de Martín conservan ahitch3, CC-BY-4.0 y el enlace Sketchfab del GLB. Los créditos desconocidos se registran como pendientes.

Validación: 54 pruebas unitarias, TypeScript y build. Las pruebas de integridad verifican originales, modelos derivados, tiempos, nombres y calibraciones; las de sesión cubren selección previa, sustitución en el mismo punto, cambios rápidos, carga/llegada tardías, seguimiento y reinicio. Con ECS simulado y bundle se comprobaron las tres fichas, 6/10/3 clips, giro, límites de pinch, reubicación/cancelación y cantos faltantes. El MP3 real del Colirufo conserva pausa, continuación y X en móvil estrecho y horizontal. Con ECS 3.2.0 y GLB reales en Edge se observaron poses variables durante las tres llegadas, transición a sus reposos y ancla final exacta, usando una escena 3D temporal con la versión de escena del proyecto. Esta prueba no usa SLAM ni sustituye Studio/Android/iPhone.

El build conserva dos avisos de tamaño. El Martín configurado pesa aproximadamente 30,6 MiB y la Paloma 14,4 MiB; la copia de assets incluye también originales para conservar el proyecto. Falta medir carga, consumo de memoria, materiales, suavidad, legibilidad y apoyo físico en dispositivos, y optimizar los modelos si los resultados lo requieren.

Archivos de este cambio: src/tap-to-place.ts, src/placement-session.js, src/arrival-motion.js, src/bird-catalog.js, src/pilot-ui.ts; src/data/aves.json, src/data/interfaz.json y las calibraciones martin_pescador-aterrizaje.json/paloma-aterrizaje.json; copias martin_pescador_configurado.glb/paloma_configurada.glb e ilustración paloma_guia.png; tests/placement-session.test.cjs, tests/arrival-motion.test.cjs y tests/bird-catalog.test.cjs; PLANEACION.md, TECNICO.md, AVANCE_01.md y DISENO_UI.md. La ficha de Paloma se comprobó también en 320×568 y 844×390: imagen cargada, título correcto y scrollWidth igual a clientWidth, sin desbordamiento. El tap/raycast de estas comprobaciones de UI utiliza ECS simulado; la evaluación de animaciones de la prueba 3D usa ECS y GLB reales.

### Fotografías aportadas · 13 de octubre de 2026

Las fichas ahora usan src/assets/img/paloma.jpg (1280×960) y martin_pescador.jpg (2000×2000), copias íntegras de Paloma IMG.jpg y Martin Pescador IM.jpg. aves.json registra rutas, dimensiones, alt descriptivo y crédito de fotografía aportada por el usuario; autor/licencia siguen pendientes. La fotografía de Paloma sustituye la ilustración en la ficha; el recurso anterior se conserva. Martín ya muestra fotografía y deja de anunciar imagen pendiente; su descripción académica detallada sigue pendiente. La foto se usa como referencia visual aportada y no constituye una identificación taxonómica del modelo. Las fuentes académicas y nombres científicos existentes permanecen separados del crédito fotográfico. pilot-ui.ts aplica las dimensiones antes de cargar cada foto y conserva el tamaño CSS y la proporción natural.

### Corrección de transparencia de materiales · 13 de octubre de 2026

Los dos cuerpos estaban exportados con alphaMode=BLEND. El renderizador ECS real los cargaba como transparent=true y depthWrite=false: al girar la vista, otras superficies y el ojo opuesto podían dibujarse por encima del cuerpo. La textura de color de Paloma es RGB, sin canal alfa; Pigeon_mainMat ahora usa OPAQUE. Se mantiene el material independiente de la córnea. Martín posee un atlas RGBA con huecos reales entre plumas: body usa MASK y alphaCutoff=0.5 para conservar esos recortes sin mezclar todo el cuerpo como una superficie translúcida. Se conservan doubleSided y los restantes parámetros del material.

Solo cambió el JSON de materiales de paloma_configurada.glb y martin_pescador_configurado.glb. Los bloques binarios completos son idénticos a los anteriores: geometría, UV, rig, imágenes y claves de animación no se modificaron. Las calibraciones actualizan únicamente sha256Modelo. paloma.glb, MartinPescador.glb y los paquetes de Downloads permanecen originales; para importar la corrección en Blender/Studio deben usarse las copias configuradas.

Validación en Edge con ECS 3.2.0 real: comparación antes/después desde seis ángulos por ave, sin errores de página. Ambos cuerpos corregidos registran profundidad y dejan de ser materiales mezclados; Martín conserva alphaTest=0.5. La revisión visual confirmó la eliminación del ojo opuesto visible y de superficies internas superpuestas. Esta escena temporal 3D no usa SLAM ni certifica resultados en dispositivos. Pendiente en Studio y Android/iPhone: inspección por giro y durante vuelo/aterrizaje, bordes de las plumas, iluminación y seguimiento sobre cámara real.

Criterio de transparencia: especificación oficial glTF 2.0, sección Alpha Coverage, https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#alpha-coverage.
Comprobaciones adicionales de esta corrección: 54 pruebas existentes aprobadas, TypeScript sin errores y build generado con los dos avisos previos de tamaño. Los dos GLB de dist son idénticos a sus copias corregidas en src. El bundle con ECS real completó las tres llegadas con poses variables, ancla final exacta y transición a EXPLORAR/reposo, sin errores de página. No se hizo push ni despliegue.


## Guacamaya Cariseca y cantos del catálogo · 13 de octubre de 2026

La entrada interna `loro` ahora representa a Guacamaya Cariseca (`Ara severus`, Psittacidae), por decisión del usuario. El selector habilita cuatro aves: Martín Pescador, Paloma Doméstica, Guacamaya Cariseca y Colibrí Colirufo. No se añade una quinta especie ni se duplica la entrada de Loro.

Se conserva `src/assets/models/Guacamaya.glb` íntegro. La aplicación carga `guacamaya_configurada.glb`, que mantiene geometría, imágenes, rig y los catorce nombres de animación del original, desplazando sus inicios al tiempo cero. La interfaz presenta nueve clips de comportamiento: reposo, reposo alternativo, vuelo, vuelo suspendido, vuelo circular, aterrizaje, despegue, acicalamiento y caminar. Los clips técnicos/de ataque/muerte permanecen en el recurso y no se ofrecen como comportamiento del recorrido. No se crean movimientos nuevos. El material existente MASK, con corte alfa 0,5 y doble cara, se conserva; los materiales corregidos de Paloma y Martín tampoco se alteran.

`loro-aterrizaje.json` registra SHA del original y de la copia, rangos, contacto y curva del hueso Hips en coordenadas del modelo, con sus ancestros estáticos. Llegada de aproximadamente 2,983 s: ParrotALL_Land → ParrotALL_Idle, mezcla 0,16 s. Dirección frontal +X, giro local −π/2, escala inicial 0,6, límites 0,3–1,5 y offset local Y 0,0048, a partir de la pose de reposo inspeccionada. Reutiliza colocación única, root de llegada, giro, pinch, selección, tap/radial, cancelación, reubicación y reinicio. El apoyo definitivo sobre una superficie AR debe ajustarse si las pruebas físicas lo requieren.

La ficha académica procede exclusivamente de la página 25 de `GUIA AVES UAO FINAL.pdf`, comprobada mediante texto y vista completa. Contiene descripción, hábitat, comportamiento y rasgos; no atribuye alimentación o medidas ausentes. La fotografía `guacamaya_cariseca.jpg`, 960×1141, es copia íntegra de la aportada. Todas las fichas dejan de mostrar la leyenda de fotografía aportada: se retira el figcaption y su estilo, sin contenedor vacío. Alt, proporciones y créditos siguen en JSON. CSS y estilos inline permanecen sincronizados.

Recursos nuevos, copiados sin recodificar:

| Ave | Audio en assets | Duración comprobada |
|---|---|---|
| Guacamaya Cariseca | guacamaya_cariseca_canto.mp3 | 52,712 s |
| Paloma Doméstica | paloma_canto.mp3 | 185,112 s |
| Martín Pescador | martin_pescador_canto.mp3 | 21,072 s |

Se conserva el MP3 del Colirufo. Los archivos nuevos registran nombre de origen y SHA-256 en creditoAudio; autor/licencia quedan sin inventar. El controlador existente mantiene una instancia por ave, inicio desde el segundo tap, cierre suave del círculo, indicador vinculado a playing, pausa/continuación, X y cierre suave. Repetir reinicia; cambiar de ave, reubicar, reiniciar y dispose detienen el recurso anterior. Los efectos de interfaz y su reducción de volumen durante el canto permanecen.

Validación: 57 pruebas unitarias aprobadas, TypeScript sin errores y build con los dos avisos anteriores de tamaño. Regresión de catálogo/modelos/clips/calibraciones, cuatro MP3 distintos con integridad exacta y materiales corregidos. En Edge, sobre el bundle con ECS/raycast simulados, se decodificaron los cuatro MP3 y se comprobaron fichas/fotos sin leyendas, pausa, continuación, repetición sin superposición y X en 390×844 y 844×390. Guacamaya conservó giro, límite de escala, animaciones con cierre automático, reubicación/cancelación y reinicio en 320×568 con movimiento reducido. Las fotografías mantienen su proporción, los paneles tienen scroll y no desbordan horizontalmente. La ejecución headless está silenciada: decodificar y avanzar el reloj no certifica escucha física.

Pendiente en Studio, Android/Chrome e iPhone/Safari: escucha y volumen de los tres recursos nuevos, restricciones de reproducción del navegador, interrupciones/segundo plano, raycast sobre los modelos, contacto de patas, fluidez sobre cámara, tracking, iluminación y memoria. El MP3 completo de Paloma pesa unos 7,06 MiB y dura tres minutos; medir la carga real antes de decidir una optimización. No se hizo push ni despliegue.

Verificación 3D adicional sobre el bundle generado y ECS 3.2.0 real: las cuatro llegadas terminaron en EXPLORAR con sus reposos y ancla final exacta. Guacamaya produjo 27 muestras de aproximación; el hueso BN_Wing_L_01 cambió de rotación durante el aterrizaje. El modelo mostró alas abiertas durante aproximación y plegadas al final en las poses inspeccionadas. Sin errores de página. La escena de prueba usa cámara 3D temporal, sin SLAM ni cambios de escena del proyecto. Los modelos, las cuatro fotografías y los cuatro cantos de dist son idénticos a src.

Archivos de esta integración: src/data/aves.json y loro-aterrizaje.json; src/tap-to-place.ts, pilot-ui.ts, pilot.css e index.html; tests/bird-catalog.test.cjs; documentacion/AVANCE_01.md, TECNICO.md y DISENO_UI.md; Guacamaya.glb original y guacamaya_configurada.glb; guacamaya_cariseca.jpg; guacamaya_cariseca_canto.mp3, paloma_canto.mp3 y martin_pescador_canto.mp3. No se modifica .expanse.json ni el motor.


## Escalas proporcionadas al tamaño real · 13 de octubre de 2026

Se midieron los cuatro GLB con ECS real, escala uniforme 1 y su clip de reposo, incluyendo transformaciones de ancestros y deformación del esqueleto. Se usa la extensión longitudinal X (Colirufo, Paloma, Guacamaya) o Z (Martín), con alas plegadas. No se confunde el multiplicador del GLB con su tamaño en centímetros. Las poses y proporciones son ilustrativas: esta medición es una aproximación longitudinal, no una medición anatómica exacta.

| Ave | Extensión longitudinal antes | Objetivo inicial | Multiplicador nuevo | Rango de inspección aproximado |
|---|---|---|---|---|
| Martín Pescador | 31.4 cm | 35 cm | 0.200385 | 28–70 cm |
| Paloma Doméstica | 24.6 cm | 34 cm | 1.659502 | 26–68 cm |
| Guacamaya Cariseca | 43.3 cm | 46 cm | 0.637788 | 35–92 cm |
| Colibrí Colirufo | 47.4 cm | 15 cm | 0.079094 | 12–30 cm |

El Colirufo se mantiene algo ampliado: referencia biológica 8–11 cm, exhibición 15 cm para visibilidad. Paloma, Martín y Guacamaya siguen referencias cercanas al rango real. Las fuentes y criterios quedan en referenciaEscala del catálogo y no añaden textos técnicos a las fichas. El pinch permite ampliar; Reiniciar restaura la base de la especie y Reubicar conserva la escala elegida. Se ajustan proporcionalmente los offsets locales previos para conservar la relación del modelo con su ancla; no se cambian clips, compensaciones, materiales ni archivos GLB.

La cámara de la escena ahora declara camera.xr.world.scale='absolute', conforme a XrWorldConfig de los tipos locales y la API pública Camera. El modo responsive dependía de la altura inicial de cámara y no garantizaba tamaños métricos. Se conserva el resto de la escena y la detección; no se activa VPS. La estimación métrica y el contacto de patas quedan pendientes de validación con SLAM real en Android/iPhone. La simulación 3D no acredita tamaño físico.

Fuentes de referencia:
- Colirufo: https://animaldiversity.org/accounts/Amazilia_tzacatl/
- Paloma: https://www.allaboutbirds.org/guide/rock_pigeon/id
- Martín: https://www.allaboutbirds.org/guide/Ringed_Kingfisher/id
- Guacamaya: https://www.papouscizoo.cz/ara-maly
- Escala métrica del motor: https://8thwall.org/docs/api/studio/ecs/camera
Validación del ajuste: 58 pruebas aprobadas, TypeScript sin errores y build con los dos avisos previos de tamaño. La prueba de compensación usa ahora la escala del catálogo en lugar de asumir 0,25. Con el bundle y ECS real las cuatro llegadas conservaron poses variables, reposo final y ancla exacta; sin errores de página. La nueva prueba comprueba base por especie, límites de pinch y restauración, incluido el Colirufo por debajo del mínimo genérico anterior. Falta comprobar escala absoluta y visibilidad a distintas distancias sobre SLAM real. Sin push ni despliegue.
