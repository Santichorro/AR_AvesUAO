# Planeación ampliada — AR_AvesUAO

**Parcial 2 · Fundamentos de Realidad Virtual · Universidad Autónoma de Occidente**  
**Revisión:** 12 de octubre de 2026.  
**Propósito:** orientar todas las tareas necesarias para completar y presentar el proyecto. La implementación paso a paso se desarrolla en [TECNICO.md](TECNICO.md).

## 1. Qué construiremos

Una aplicación WebAR educativa sobre cinco aves del campus UAO: **pechirrojo, azulejo, paloma, loro y colibrí**. El usuario abre un enlace en el celular, elige una especie, detecta una superficie y toca el lugar donde quiere que aparezca directamente esa ave. Explora su información y canto, cambia de especie en el mismo punto, participa en un reto de avistamiento y responde dos rondas de quiz dentro de la experiencia RA.

**Flujo vigente:** detectar el plano habilita la colocación; el ave aparece solo después de tocar un área válida. Durante exploración hay una sola ave activa. Cambiar de especie reemplaza la anterior, y Reubicar permite seleccionar otro punto.

La información académica procede de la base de datos de aves de la UAO. Los nombres comunes todavía deben asociarse a especies y nombres científicos exactos. No se inventarán datos para llenar fichas o formular preguntas.

El campus low poly se conserva como recurso opcional para una vista independiente. No se coloca una isla, estación ni hábitat previo: la experiencia principal muestra directamente el ave sobre la superficie. Su representación es estilizada, no un plano de navegación ni un levantamiento arquitectónico.

### 1.1 Requisitos de la consigna y decisiones del equipo

| Tema | Exigencia del parcial | Decisión actual del proyecto |
|---|---|---|
| Dispositivo | Uso desde Android o iOS | Intentar y verificar Android/Chrome e iPhone/Safari |
| Información | Base de datos UAO, textos, imágenes y sonidos pertinentes | JSON local y recursos asociados a cada ave |
| Realidad aumentada | Debe ser el centro de la aplicación | Colocación, selección, inspección, avistamiento y quiz en RA |
| Interacciones | Mínimo cinco interacciones RA | Seis interacciones diferenciadas por acciones del usuario |
| Evaluación | Quiz interactivo en RA | Una ronda de cantos y otra de información |
| Multimedia | Recursos adecuados a las acciones y al contenido | Modelos animados, cantos y efectos; video solo si aporta |
| Entrega | Página web funcional o APK según el caso | Página web HTTPS; no se desarrolla APK |
| Exposición | Cinco minutos de pitch y cinco de preguntas | Demo en vivo, video de respaldo y argumento de escalabilidad |

El número de aves, los dos tipos de quiz, el mapa 3D y el objetivo de ambos sistemas operativos son decisiones del proyecto. No deben presentarse como exigencias adicionales del docente. La fecha de entrega y la duración disponible deben confirmarse; no se da por hecho un plazo de una semana.

## 2. Estado real y punto de partida

La revisión de archivos del 12 de octubre muestra lo siguiente. Es una inspección de código y recursos, no una certificación de funcionamiento en celulares.

| Elemento | Evidencia actual | Trabajo restante |
|---|---|---|
| Plantilla World Effects | Cámara RA, luces, suelo, carga y componentes de ejemplo | Adaptar a la experiencia de aves |
| Colocación | `tap-to-place.ts` instancia el prefab al tocar | Una ave en el punto elegido, orientación controlada, cambio de especie y reubicación |
| Modelo en escena | `.expanse.json` referencia `assets/8-jewel.glb` | Adaptar el prefab de ejemplo para mostrar el ave seleccionada |
| Campus | `src/assets/UAO_Campus_LowPoly.glb` existe | Verificar su versión, escala, orientación y aspecto en Studio |
| Aves y datos | No hay JSON de aves ni recursos finales de especies en lo inspeccionado | Obtener, producir e integrar los cinco conjuntos |
| Quizzes y avistamiento | Definidos en documentos, sin componentes específicos actuales | Implementar y validar |
| Compilación | Scripts y configuración webpack existentes | Ejecutar la compilación de la versión integrada |
| Publicación | Workflow de GitHub Pages existente | Confirmar repositorio, Pages, ejecución y enlace real |
| Compatibilidad | No hay evidencia física registrada en estos documentos | Probar en Android e iPhone |

La copia del campus dentro del proyecto pesa 2.937.376 bytes y difiere de la exportación de 2.001.344 bytes generada en esta conversación. No se reemplazará automáticamente: primero se decide cuál versión conservar y se prueba. La mera existencia del archivo no significa que la escena lo use.

En `AGENTS.md` y `README.md` aún aparece la lista antigua con Pellares. **La selección vigente del usuario prevalece:** `pechirrojo`, `azulejo`, `paloma`, `loro`, `colibri`. La tarea de alineación documental forma parte del plan.

## 3. Alcance y prioridades

### 3.1 Primera versión completa

- Cinco aves con información verificable, representación 3D y canto correcto.
- Una ave colocada directamente sobre la superficie y estable al mover el celular.
- Cambio entre las cinco especies, exploración, inspección, reubicación y reto de avistamiento.
- Seis interacciones demostrables, contando acciones reales del usuario.
- Quiz de canto y quiz de información, retroalimentación y resultados.
- Reinicio sin duplicación de aves, audio, puntaje o eventos.
- Página HTTPS accesible desde un enlace, créditos y pitch.

### 3.2 Mejoras posteriores a la base funcional

Mayor detalle del campus, video educativo, transiciones más elaboradas y variaciones de animación. Se desarrollan únicamente después de tener la experiencia completa y las pruebas esenciales aprobadas.

### 3.3 Fuera del alcance

APK, cuentas, ranking en servidor, reconocimiento automático de aves reales con la cámara, GPS, rutas de navegación por el campus, modelos adicionales a las cinco especies y servicios de pago. Los registros de avistamiento serán de la actividad virtual durante la sesión; no se presentarán como observaciones biológicas reales.

## 4. Experiencia y diseño de interacciones

### 4.1 Recorrido del usuario

1. **Inicio:** explicación breve, botón Comenzar, cámara y activación del audio.
2. **Preparación:** carga de recursos y mensajes ante permisos rechazados o problemas de red.
3. **Escaneo:** guía para mover el celular y localizar una superficie válida.
4. **Selección y colocación:** el usuario elige un ave y toca un área válida del plano; aparece esa especie directamente en el punto elegido.
5. **Cambio de especie:** el selector reemplaza el ave visible por otra en el mismo punto. Solo queda una ave activa.
6. **Exploración:** toca el ave activa, ve su ficha y reproduce su canto. La ficha permanece asociada a la escena.
7. **Inspección:** rota o escala el ave seleccionada dentro de límites útiles y puede restaurarla.
8. **Reubicación y avistamiento:** puede elegir otro punto de colocación. En el reto busca el ave activa guiándose por el sonido y la toca para registrarla.
9. **Quiz:** identifica cantos tocando tarjetas de especies en RA y responde preguntas relacionadas con las fichas.
10. **Resultados:** conoce aciertos por ronda, recibe una explicación y puede repetir o volver a explorar.

Durante preguntas o búsquedas, la aplicación bloquea acciones de otros modos que puedan producir resultados ambiguos. Los botones deben mantener texto legible y tamaños cómodos sobre la imagen de cámara.

### 4.2 Seis interacciones con evidencia

| ID | Acción del usuario | Respuesta esperada | Cómo demostrarla |
|---|---|---|---|
| I1 | Tocar un área válida del plano | Aparece directamente el ave seleccionada | Colocar y rodearla sin que se creen copias |
| I2 | Cambiar de especie | El ave visible se reemplaza en el mismo punto | Cambiar entre las cinco especies y comprobar que solo queda una |
| I3 | Tocar un ave y su control de canto | Ficha, selección visual y canto de esa especie | Comparar dos aves y sus datos |
| I4 | Rotar o escalar el ave seleccionada | Cambia la inspección sin deformar el modelo | Llevarla a dos tamaños, girarla y restaurarla |
| I5 | Buscar y tocar el ave del reto | Registro de la especie buscada y fin del reto | Un toque fuera del ave no registra; tocar el objetivo sí |
| I6 | Responder dentro del quiz RA | Acierto/error, animación, sonido y puntaje | Resolver una pregunta de cada ronda |

La aparición o animación breve de aterrizaje es una respuesta a I1 y no se cuenta además como interacción independiente. I2 exige cambiar activamente la especie. Reubicar es un control adicional. Las seis acciones deben demostrarse; este conteo no acredita por sí mismo la aprobación del docente.

## 5. Contenido de las cinco aves

| ID | Nombre común | Nombre científico | Datos y fuentes | GLB y clips | Canto y licencia | Preguntas |
|---|---|---|---|---|---|---|
| `pechirrojo` | Pechirrojo | Por confirmar con UAO | Pendiente | Pendiente | Pendiente | Pendiente |
| `azulejo` | Azulejo | Por confirmar con UAO | Pendiente | Pendiente | Pendiente | Pendiente |
| `paloma` | Paloma | Por confirmar con UAO | Pendiente | Pendiente | Pendiente | Pendiente |
| `loro` | Loro | Por confirmar con UAO | Pendiente | Pendiente | Pendiente | Pendiente |
| `colibri` | Colibrí | Por confirmar con UAO | Pendiente | Pendiente | Pendiente | Pendiente |

Cada ficha contendrá nombre común y científico, fotografía, descripción, alimentación, hábitat, ubicación de avistamiento cuando esté documentada, canto y un dato reconocible que pueda evaluarse. Incluir conservación solo si hay una fuente apropiada. Registrar autoría, referencia y licencia por recurso.

Propuesta de contenido mínimo: **tres preguntas verificadas por especie**, para un banco de quince. No son hechos biológicos todavía ni un requisito del profesor. La persona que revisa debe encontrar la respuesta de cada pregunta en la ficha o en la fuente registrada. Se descartan opciones ambiguas o preguntas cuya respuesta no se haya enseñado.

## 6. Organización del equipo

Las ramas existentes son `tello`, `sam`, `meli` y `juandate`; `main` es la rama integrada. No se asignan nombres a roles sin acuerdo del equipo.

| Rol propuesto | Responsabilidad principal | Entregables | Colaboración necesaria |
|---|---|---|---|
| R1: integración RA | Estado global, colocación, cámara, interacción y limpieza | Ave anclada y flujo funcional | Recibe assets R2 y conecta UI R3 |
| R2: arte 3D | Aves y clips; campus como recurso opcional | GLB revisados e inventario | Coordina escala/origen con R1 |
| R3: contenido y experiencia | Datos UAO, fichas, preguntas y interfaz | JSON, audio, fichas y quiz | Revisión biológica cruzada con R4 |
| R4: calidad y publicación | Git, Pages, pruebas, evidencias y pitch | URL, matriz de pruebas y demo | Prueba cambios de todos y revisa PR |

El quiz requiere trabajo compartido: R3 define contenido e interfaz, R1 integra la selección RA y R4 prueba el puntaje. Los cinco modelos pueden repartirse entre integrantes; R2 asegura convenciones comunes. Cada tarea tendrá una persona responsable y otra revisora. No cargar a una sola persona con arte, integración y publicación.

### 6.1 Rutina de trabajo

Antes de comenzar: revisar la rama, el estado del repositorio, el último avance de `main` y el archivo que cada persona editará. Reservar `.expanse.json` para un solo editor por turno. Al cerrar: guardar Studio, revisar el diff, compilar, registrar prueba y crear un PR pequeño. La sincronización diaria del equipo debe responder qué terminó, qué falta y qué dependencia bloquea la siguiente tarea.

Tablero sugerido: **Pendiente / En proceso / En revisión / Probado / Terminado**. Una tarea no está terminada por tener código escrito: debe cumplir su criterio de aceptación y contar con evidencia apropiada.

## 7. Desglose completo del trabajo

Los códigos P0–P8 se utilizan también en el documento técnico. Se puede producir contenido y arte en paralelo, pero la integración avanza en el orden indicado. Cada fase incluye tareas concretas y una condición de salida.

### P0. Preparar el proyecto y demostrar la base

**Depende de:** acceso al repositorio y al menos un celular. **Responsable propuesto:** R1/R4.

1. Confirmar fecha de entrega, equipos disponibles y repositorio remoto.
2. Asignar los cuatro roles y acordar quién edita la escena primero.
3. Alinear los nombres de las cinco aves en los documentos y el README.
4. Verificar Node, npm, Git LFS, Studio y la rama personal.
5. Instalar dependencias y compilar la plantilla actual.
6. Configurar Pages y publicar una versión inicial mediante PR a `main`.
7. Abrirla en un celular real, permitir cámara y probar colocación/reinicio.
8. Registrar errores y repetir la prueba en el segundo sistema operativo.

**Entregable:** enlace de base, instrucciones de entorno y registro de dispositivos. **Salida:** cámara y colocación comprobadas en el dispositivo objetivo; cualquier incompatibilidad del segundo se registra antes de seguir prometiendo soporte.

### P1. Consolidar información y recursos

**Depende de:** fuente UAO. Puede avanzar junto a P0. **Responsable:** R3/R2.

1. Obtener la base o fichas UAO y guardar las referencias.
2. Asociar los cinco nombres comunes a especies científicas exactas.
3. Preparar textos breves y fotografías correctas por especie.
4. Obtener cantos distinguibles con permisos de uso y recortarlos sin alterar la identificación.
5. Redactar y revisar las quince preguntas propuestas.
6. Registrar licencias y créditos de fotos, cantos, modelos y efectos.
7. Completar el JSON, manteniendo la estructura acordada.
8. Revisar datos y preguntas entre dos personas.

**Entregable:** cinco fichas, banco de preguntas, inventario y JSON validado. **Salida:** todas las preguntas tienen una respuesta respaldada y cada recurso corresponde a su especie.

### P2. Producir y revisar los modelos

**Depende de:** identidad visual y científica de cada ave. **Responsable:** R2 y autores de cada modelo.

1. Acordar paleta, estilo low poly, tamaños relativos y convenciones de exportación.
2. Modelar primero una ave piloto con proporciones y rasgos reconocibles.
3. Preparar rig y los clips `idle`, `fly`, `land`, `sing`, `happy`, `no`.
4. Exportar GLB, reimportarlo y comprobar materiales y animaciones.
5. Probar la ave piloto en Studio antes de repetir el trabajo cinco veces.
6. Crear las otras cuatro usando el mismo contrato de entrega.
7. Conservar el campus como recurso opcional; revisar su versión si se desarrollará esa vista.
8. Preparar el origen de apoyo y comprobar que las cinco aves se colocan en el mismo punto sin flotar ni hundirse.
9. Registrar peso, triángulos, clips y problemas de cada archivo.

**Entregable:** cinco modelos revisados y preparados para colocación directa. **Salida:** la especie piloto carga y anima en Studio; los cinco archivos cumplen las convenciones. Un placeholder permite programar, pero no reemplaza el recurso final en la aceptación.

### P3. Implementar colocación directa y cambio de especie

**Depende de:** P0, un modelo piloto y datos estructurados. **Responsable:** R1.

1. Adaptar el prefab de ejemplo a una raíz de colocación que contenga una sola ave.
2. Crear selector de las cinco especies, disponible antes de colocar; configurar una especie inicial si el usuario aún no elige.
3. Mostrar guía y retícula en un plano válido. Detectarlo no crea automáticamente el modelo.
4. Al tocar el área elegida, guardar posición/orientación, crear el ave seleccionada y pasar a exploración.
5. Impedir duplicados por doble toque y bloquear nuevas colocaciones fuera de ESCANEO o REUBICAR.
6. Cambiar de especie en el mismo punto: cargar la elegida, reemplazar modelo y renovar ficha/audio sin conservar entidades de la anterior.
7. Añadir Reubicar: esperar otro toque válido y mover la raíz existente; cancelar conserva la ubicación previa.
8. Manejar carga lenta, selecciones rápidas y errores; reiniciar limpia entidades, sonidos, temporizadores y puntaje.

**Entregable:** ave colocable, intercambiable entre las cinco especies y reubicable. **Salida:** detectar sin tocar no crea contenido; colocar, cambiar rápidamente, reubicar y reiniciar no genera duplicados.

### P4. Completar exploración e inspección

**Depende de:** P1 y P3. **Responsable:** R1/R3.

1. Crear selección por toque y relacionar cada entidad con el ID del JSON.
2. Mostrar ficha, fotografía y nombre científico correctos.
3. Reproducir solo el canto seleccionado y activar su animación.
4. Añadir rotación, escala limitada y botón de restaurar.
5. Mantener tocable el ave activa de cualquiera de las cinco especies: ampliar zonas de toque sin modificar sus proporciones.
6. Evitar que tocar el selector o un botón coloque otra ave, la reubique o seleccione algo detrás.
7. Añadir pausa/silencio, cierre de ficha y retorno a exploración.
8. Revisar lectura sobre la cámara y accesibilidad básica de los controles.

**Entregable:** cinco fichas y manipulación funcional. **Salida:** seleccionar las cinco especies siempre muestra los datos y sonidos correspondientes; la escala no deforma el modelo.

### P5. Implementar el reto de avistamiento

**Depende de:** P4 y reproducción espacial de audio comprobada. **Responsable:** R1/R3.

1. Definir instrucciones y una zona de búsqueda segura alrededor del punto elegido.
2. Usar el ave activa como objetivo; guardar su ID y posición de exploración.
3. Llevar el ave a una posición alcanzable visualmente y reproducir su canto espacial.
4. Informar cómo girar el celular sin exigir desplazamientos peligrosos.
5. Validar el toque: suelo y controles no registran el ave; solo el objetivo completa el reto.
6. Registrar la correcta una sola vez y mostrar la retroalimentación.
7. Añadir pista, cancelar y regreso del ave al punto original.
8. Probar con altavoz y, cuando estén disponibles, auriculares; no prometer precisión direccional idéntica en ambos.

**Entregable:** un reto completo, aplicable a cualquier ave por datos. **Salida:** búsqueda, registro y cancelación devuelven la aplicación a un estado limpio.

### P6. Implementar los dos quizzes

**Depende de:** P1 y selección RA de P4. **Responsable:** R3/R1.

1. Cerrar fichas, detener otros audios y guardar la especie activa y su transformación de exploración.
2. Crear la ronda de canto con cinco preguntas, una por especie sin repetir.
3. Mostrar cinco tarjetas de especies en RA cerca del punto elegido; ocultar temporalmente el ave de exploración y resolver tocando una tarjeta.
4. Bloquear una segunda respuesta hasta terminar la retroalimentación.
5. Crear la ronda informativa con cinco preguntas del banco, una por ave.
6. Mostrar enunciado y opciones en un panel asociado a la escena RA.
7. Explicar la respuesta correcta después de un error y reproducir feedback coherente.
8. Mostrar aciertos por ronda y puntaje total sobre diez.
9. Añadir repetir quiz y volver a explorar, restaurando el ave elegida en su punto; diferenciarlos de reiniciar la colocación.
10. Probar todo correcto, todo incorrecto, doble toque, cancelación y repetición.

**Entregable:** quiz completo y resultados. **Salida:** máximo diez puntos; cada pregunta se puntúa una sola vez; repetir empieza desde cero. Cinco más cinco preguntas es una configuración inicial propuesta, modificable mediante datos.

### P7. Integrar, optimizar y publicar la versión final

**Depende de:** P3–P6. **Responsable:** R4 con todo el equipo.

1. Integrar PR por funcionalidad y comprobar que no se pierdan assets.
2. Sustituir placeholders; verificar nombres, cantos, clips, rutas y licencias.
3. Medir carga de las cinco especies y rendimiento con una ave activa; probar por separado las tarjetas del quiz y el campus si se añade como vista opcional.
4. Reducir peso, materiales, sombras o animaciones secundarias según mediciones.
5. Revisar clipping, superficies próximas y geometría visible desde todos los ángulos.
6. Compilar y desplegar la versión candidata en Pages.
7. Ejecutar la matriz de pruebas en Android/Chrome e iPhone/Safari desde HTTPS.
8. Corregir fallos prioritarios y repetir solo las pruebas afectadas y el recorrido completo.
9. Registrar el commit publicado, URL, dispositivos y resultados.

**Entregable:** aplicación pública y registro de pruebas. **Salida:** el recorrido completo es demostrable en el dispositivo de entrega, con limitaciones del segundo sistema claramente documentadas.

### P8. Preparar entrega y sustentación

**Depende de:** candidato estable P7. **Responsable:** equipo completo.

1. Elegir quién presenta y quién opera la demo.
2. Preparar un pitch de cinco minutos y un enlace/QR visible.
3. Demostrar al menos colocación, ficha/canto, inspección y ambos quizzes; mostrar cómo acceder a avistamiento.
4. Grabar un video corto de la misma versión publicada.
5. Preparar respuestas sobre decisiones técnicas, contenido UAO, licencias, aprendizaje y escalabilidad.
6. Ensayar con cronómetro en un celular y condiciones parecidas al salón.
7. Cargar dispositivos, llevar conexión alternativa y verificar audio.
8. Entregar enlace, repositorio, documentación y evidencias solicitadas por el docente.

**Entregable:** pitch, demo, video de respaldo y paquete final. **Salida:** presentación de máximo cinco minutos y acceso probado desde otro dispositivo.

## 8. Dependencias y hitos

| Hito | Resultado | Condición para avanzar |
|---|---|---|
| H0 | Plantilla publicada | Cámara y colocación en un celular real |
| H1 | Ave piloto integrada | Datos, modelo, clip y canto conectados |
| H2 | Cinco especies explorables, una a la vez | Cambio de especie, fichas, audio e inspección |
| H3 | Experiencia educativa completa | Avistamiento y dos quizzes con resultados |
| H4 | Candidato de entrega | Pruebas móviles, assets finales y Pages |
| H5 | Sustentación preparada | Pitch ensayado y video de respaldo |

La ruta que más condiciona la entrega es: entorno y dispositivo, colocación directa, cambio de especie, quizzes, pruebas finales y publicación. Mientras R1 prepara la base, R2 produce modelos y R3 consolida contenido. R4 publica y prueba desde el principio. No esperar hasta el final para descubrir que la cámara o el audio falla en el celular.

## 9. Calendario orientativo

Este calendario distribuye el trabajo en **diez sesiones**, no fija fechas ni presupone una semana. Ajustarlo a la fecha real, disponibilidad y avances del equipo.

| Sesión | Prioridad de integración | Trabajo concurrente |
|---|---|---|
| 1 | P0: entorno, roles y plantilla | Fuente UAO e inventario |
| 2 | P0: Pages y pruebas móviles | Ave piloto y preguntas |
| 3 | P3: colocación directa y estado | P1/P2: datos y assets |
| 4 | H1: piloto de punta a punta | Resto de modelos y revisión de contenido |
| 5 | P4: cambio entre especies y fichas | Animaciones finales y efectos |
| 6 | P4: inspección; P5: búsqueda | Revisión de UI y datos |
| 7 | P6: canto y preguntas | Pruebas de puntaje |
| 8 | P7: integración y rendimiento | Créditos y borrador del pitch |
| 9 | H4: candidato y pruebas completas | Video y ensayo |
| 10 | Correcciones de entrega y H5 | Verificación final de enlace y respaldo |

Si queda poco tiempo, reducir mejoras visuales y complejidad de trayectorias. Mantener contenido correcto, cinco aves, interacciones requeridas, quiz RA y demo estable. No ocultar recursos faltantes detrás de placeholders en la entrega final.

## 10. Riesgos y respuesta

| Riesgo | Señal observable | Acción | Responsable |
|---|---|---|---|
| No hay fuente UAO completa | Especies, fichas o preguntas sin respaldo | Conseguir la fuente y priorizar su revisión | R3 |
| Cámara/SLAM falla | No se inicia RA o el ave no permanece anclada al punto elegido | Revisar HTTPS, dispositivo y plantilla antes de ampliar código | R1/R4 |
| Audio bloqueado | Botones funcionan pero no se oye el canto | Activar desde gesto del usuario y mostrar control de reproducción | R1 |
| Modelo pesado | Carga larga o navegación entrecortada | Medir el total y reducir complejidad | R2/R4 |
| Colibrí demasiado pequeño | No se puede tocar o distinguir | Escala de exhibición explícita y zona de selección mayor | R1/R2 |
| Conflicto de escena | Dos cambios incompatibles en `.expanse.json` | Reservar editor y coordinar integración; conservar ambas versiones | Equipo |
| Rutas fallan en Pages | Recursos 404 o modelos ausentes | Revisar subcarpeta, mayúsculas y objetos LFS | R4 |
| Quiz suma varias veces | Puntaje mayor al máximo | Bloquear resolución por pregunta y limpiar al repetir | R1/R3 |
| Franjas/clipping | Superficies parpadean o desaparecen | Revisar duplicados, separación, escala y cámara | R2/R1 |
| La demo falla | Red, permisos o tracking no disponibles | Reintentar base y usar el video de la versión real | Equipo |

No se considera funcionamiento sin conexión como garantía: el HTML actual carga motor y landing page desde CDN. La estrategia de respaldo es un video y una conexión alternativa, no una promesa de modo offline.

## 11. Criterios de finalización y evidencias

| Comprobación | Evidencia requerida | Estado |
|---|---|---|
| Cinco especies correctas | JSON y revisión de fuentes | Pendiente |
| Colocación única y estable | Prueba física y video | Pendiente |
| Cinco especies disponibles, una ave activa con su modelo y canto | Inventario, inspección en Studio y demo | Pendiente |
| Seis interacciones | Recorrido que muestre cada acción I1–I6 | Pendiente |
| Quiz dentro de RA | Video de las dos rondas | Pendiente |
| Puntaje y repetición | Casos de diez, cero, doble toque y reinicio | Pendiente |
| Android e iPhone | Matriz con modelo, navegador y resultado | Pendiente |
| Enlace HTTPS y recursos | Ejecución de Actions y prueba desde otro dispositivo | Pendiente |
| Créditos y licencias | Inventario accesible y avisos del motor | Pendiente |
| Pitch de cinco minutos | Ensayo medido y video de respaldo | Pendiente |

Una falla en Android/iPhone no se marca como aprobada por haber compilado. Una pregunta sin fuente no se marca como validada por funcionar en código. Toda limitación pendiente se comunica antes de la entrega.

## 12. Pitch y entrega

| Tiempo | Tema | Qué mostrar |
|---|---|---|
| 0:00–0:45 | Problema del campus y objetivo educativo | Especies y necesidad de conocerlas |
| 0:45–1:15 | Solución y acceso | Enlace, WebAR y colocación |
| 1:15–3:15 | Demo | Colocación directa, cambio de especie, canto, inspección y breve avistamiento |
| 3:15–4:15 | Evaluación | Una pregunta de cada ronda y resultados |
| 4:15–5:00 | Implementación y continuidad | Datos separados, recursos low poly y cómo añadir otra ave |

Después vienen cinco minutos de preguntas. Evitar afirmar que están catalogadas más de noventa especies sin respaldo de la base UAO. Para hablar de escalabilidad, demostrar el contrato JSON y los recursos que requiere una nueva especie.

Paquete de entrega: URL pública, commit o versión presentada, repositorio, estos documentos, inventario de recursos y créditos, registro de pruebas, pitch y video de respaldo. Añadir otros archivos únicamente si la consigna del docente los exige.

## 13. Registro operativo de tareas

Usar esta plantilla en el tablero o en un registro del equipo. Registrar las subtareas de P0–P8, no solo los títulos de las fases.

| Campo | Qué escribir |
|---|---|
| Código | Ejemplo: P4-03, reproducción del canto seleccionado |
| Responsable y revisor | Una persona ejecuta; otra comprueba |
| Dependencia | P1 JSON de audio y P3 selección de entidad |
| Archivos reservados | Componentes, recursos o escena que se editarán |
| Resultado esperado | Solo se oye el ave seleccionada, con control de pausa |
| Prueba | Seleccionar dos especies y comprobar cambio/cierre |
| Evidencia | PR, captura/video o fila de matriz |
| Estado y fecha | Pendiente, en curso, revisado, probado, terminado |

## 14. Referencias de trabajo

- Consigna original: `Parcial 2.pptx`, revisada al inicio de esta conversación.
- Propuesta inicial: `Propuesta AR_ guía de aves UAO.html`; su plazo de una semana no fija la fecha del parcial.
- Repositorio local: `E:/ProyectosUnity/ParcialAR8Wall/AR_AvesUAO`.
- [Documento técnico ampliado](TECNICO.md).
- [Publicación de proyectos de Studio](https://8thwall.org/docs/getting-started/publishing).
- [Fuentes de la maqueta del campus](<C:/Users/Juan Andres/OneDrive/Documentos/ChatGPT/ParcialAR8Wall/campus_uao/FUENTES.md>), en la copia de trabajo de esta conversación. Al compartir el proyecto, incluir ese registro con los recursos de arte y ajustar el enlace a su ubicación definitiva.

Esta ampliación es un plan de ejecución. No acredita que las tareas pendientes ya se hayan implementado.

## Avance implementado: piloto de colibrí (12 de octubre de 2026)

Se implementó la colocación directa de una sola ave, con estado independiente del motor, ficha de referencia desde JSON, seis clips reales, reubicación con cancelación y reinicio. Los recursos anteriores y las modificaciones previas de la escena se conservan. Ver [AVANCE_01.md](AVANCE_01.md) para archivos, comprobaciones y pruebas físicas pendientes.

La especie del modelo no está identificada: la guía enumera seis colibríes (página 8), con tres fichas detalladas en páginas 17–18. El GLB piloto es una representación ilustrativa. Cantos, fotografías y licencia específica de redistribución siguen pendientes. Las cinco especies no se marcan como terminadas.

Se conservan los nombres reales de los clips aportados; no se afirma que existan clips sing, happy o no. El campus queda opcional. La vista 3D de escritorio sirve para inspección y no certifica tracking en Android/iPhone. El control de inicio habilita la colocación; el runtime administra los permisos de cámara.
