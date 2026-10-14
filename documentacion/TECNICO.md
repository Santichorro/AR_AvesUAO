# Guía técnica ampliada — AR_AvesUAO

**Revisión:** 13 de octubre de 2026.
**Objetivo:** ejecutar todas las tareas del plan hasta una versión WebAR publicable. Complementa [PLANEACION.md](PLANEACION.md). Las rutas nuevas y los nombres de componentes propuestos no son archivos existentes ni APIs de Studio.

## 1. Alcance técnico y estado comprobado

| Capa | Configuración presente | Verificación pendiente |
|---|---|---|
| Editor | 8th Wall Studio, plantilla World Effects | Operación completa del proyecto en el editor |
| Runtime ECS | `@8thwall/ecs` declarado como `^3.2.0` | Compatibilidad con escena y dependencias instaladas |
| Seguimiento | HTML carga `@8thwall/engine-binary@1` con SLAM desde CDN | Seguimiento real en Android e iPhone |
| Entrada | `app.js` configura LandingPage y webpack inicializa la escena | Inicio personalizado, permisos y audio |
| Compilación | `npm run build`, salida `dist/` | Compilación de cada versión integrada |
| Datos | TypeScript permite `resolveJsonModule` | Crear y validar `src/data/aves.json` |
| Recursos | Ejemplo GLB, preview y campus ya copiado | Aves del catálogo vigente, fotografías, cantos y efectos finales |
| Publicación | Actions construye y despliega desde `main` | Configuración remota y ejecución exitosa |

La inspección actual confirma archivos, configuración y referencias. El documento anterior reportaba una compilación exitosa: se conserva como antecedente, no como resultado de esta revisión. No se ejecutó un build ni una prueba física para escribir esta ampliación.

La selección actual es `martin_pescador`, `paloma`, `loro`, `colibri`. Cambiar referencias antiguas a Pellares donde corresponda. No renombrar recursos de otros integrantes a ciegas: revisar primero sus referencias.

## 2. Estructura real y estructura propuesta

### 2.1 Archivos existentes

```text
AR_AvesUAO/
├── .github/workflows/deploy.yml
├── config/
│   ├── webpack.config.js
│   ├── entry-plugin.js
│   ├── dev8-plugin.js
│   ├── asset-loader.js
│   ├── types/
│   └── LICENSE
├── docs/
│   ├── PLANEACION.md
│   └── TECNICO.md
├── src/
│   ├── .expanse.json
│   ├── index.html
│   ├── app.js
│   ├── tap-to-place.ts
│   ├── reset-button.ts
│   ├── hide-on-ready.ts
│   ├── logo.ts
│   └── assets/
│       ├── 8-jewel.glb
│       ├── preview.jpg
│       └── UAO_Campus_LowPoly.glb
├── AGENTS.md, README.md, LICENSE
├── package.json, package-lock.json, tsconfig.json
└── .gitignore, .gitattributes
```

`node_modules/`, `dist/` y almacenamiento local de LFS son generados, no entregables de código fuente. La escena actual sigue usando el modelo de ejemplo aunque el campus esté en assets.

### 2.2 Adiciones propuestas

```text
src/
├── data/
│   ├── aves.json
│   └── experiencia.json
├── app-state.ts
├── bird-controller.ts
├── bird-selection.ts
├── bird-inspection.ts
├── audio-manager.ts
├── bird-info.ts
├── birdwatching.ts
├── quiz-controller.ts
├── results-panel.ts
└── assets/
    ├── models/<id>.glb
    ├── models/UAO_Campus_LowPoly.glb
    ├── audio/<id>_canto.mp3
    ├── audio/sfx_*.mp3
    └── img/<id>.jpg
```

Estos nombres organizan responsabilidades; adaptar a Studio sin reestructurar lo que ya genera. Mantener inicialmente componentes en `src/` facilita el trabajo. El plugin de entrada busca código recursivamente, pero importa automáticamente todos los `.ts`/`.js` fuera de `assets/` y `.dependencies/`: no introducir scripts ejecutables de prueba o generación dentro de `src/`.

### 2.3 Rutas fuente y rutas de la web

| Recurso | Ruta de trabajo | Referencia en runtime |
|---|---|---|
| Modelo de ave | `src/assets/models/colibri.glb` | `assets/models/colibri.glb` |
| Audio | `src/assets/audio/colibri_canto.mp3` | `assets/audio/colibri_canto.mp3` |
| Foto | `src/assets/img/colibri.jpg` | `assets/img/colibri.jpg` |
| Campus actual | `src/assets/UAO_Campus_LowPoly.glb` | `assets/UAO_Campus_LowPoly.glb` |
| Datos | `src/data/aves.json` | Importados y empaquetados en `bundle.js` |
| Escena | `src/.expanse.json` | Empaquetada e inicializada por webpack |

Si se mueve el campus a `models/`, actualizar también la escena y todas las referencias; no conservar una ruta rota. Para Pages usar rutas relativas al documento o una estrategia coherente con la subcarpeta del repositorio. Evitar añadir `/assets/...` por costumbre.

## 3. P0 — Preparación y primera publicación

### 3.1 Comprobar herramientas y repositorio

Abrir PowerShell y trabajar en la raíz del proyecto:

```powershell
Set-Location 'E:/ProyectosUnity/ParcialAR8Wall/AR_AvesUAO'
node --version
npm --version
git --version
git lfs version
git status --short --branch
git branch --show-current
git remote -v
```

Usar Node 20 o una versión compatible con las dependencias; el workflow remoto emplea Node 20. Los comandos de consulta no publican cambios. Si hay modificaciones ajenas, no limpiar ni resetear el repositorio. Si se está en `main`, guardar o coordinar los cambios existentes antes de pasar a la rama personal.

```powershell
git switch juandate
git lfs install
git lfs pull
npm ci
npm run build
```

Sustituir `juandate` por la rama propia existente. `npm ci` reproduce el lockfile y reinstala dependencias; si falta o no coincide con `package.json`, resolver la discrepancia. Usar `npm install` al modificar dependencias y revisar el cambio del lockfile. No actualizar versiones del motor como parte incidental de otra tarea.

### 3.2 Abrir y probar la base

1. Abrir esta carpeta en Studio y guardar sin modificar la estructura.
2. Revisar cámara, luces, Ground y prefab Logo en la escena.
3. Comprobar que el modelo de ejemplo aparece al tocar y que Reset lo retira.
4. Compilar y revisar que `dist/` contiene `index.html`, `bundle.js`, `assets/` y `external/runtime/`.
5. Para inspección local del build, ejecutar:

```powershell
npx http-server dist -p 8080
```

Abrir `http://localhost:8080` en el computador. Para un celular, `http://IP-del-PC:8080` no equivale a localhost y no garantiza permisos de cámara. Usar el sitio HTTPS publicado o un mecanismo de preview seguro de Studio comprobado para la versión instalada.

6. Hacer PR de los cambios necesarios, publicar la plantilla mediante Pages y abrir el enlace real en el teléfono.
7. Registrar modelo del teléfono, navegador, fecha, permisos, seguimiento y reinicio.

**Salida P0:** evidencia de cámara y colocación en un celular real. Tener un workflow o un build no demuestra tracking.

## 4. P1 — Contrato de datos y contenido

### 4.1 Obtener información antes de llenar el JSON

1. Identificar fuente UAO y especie científica de cada nombre común.
2. Separar campos biológicos de metadatos técnicos.
3. Escribir fichas breves que puedan leerse en el celular.
4. Asociar cada fotografía y canto a la especie exacta.
5. Guardar autoría, licencia y procedencia de cada recurso.
6. Preparar tres preguntas por especie y comprobar sus respuestas con la ficha.

### 4.2 Ejemplo de registro

El ejemplo es una plantilla, no información biológica real ni un archivo final listo para evaluar.

```json
{
  "aves": [
    {
      "id": "colibri",
      "nombre": "Colibrí",
      "nombreCientifico": "PENDIENTE: especie en la base UAO",
      "descripcion": "PENDIENTE: descripción documentada",
      "datos": [
        { "etiqueta": "Alimentación", "valor": "PENDIENTE" },
        { "etiqueta": "Hábitat", "valor": "PENDIENTE" },
        { "etiqueta": "Zona del campus", "valor": "PENDIENTE" }
      ],
      "modelo": "assets/models/colibri.glb",
      "audioCanto": "assets/audio/colibri_canto.mp3",
      "imagen": "assets/img/colibri.jpg",
      "escalaExhibicion": 1.0,
      "animaciones": {
        "reposo": "idle", "vuelo": "fly", "aterrizaje": "land",
        "canto": "sing", "acierto": "happy", "error": "no"
      },
      "fuenteInformacion": {
        "referencia": "PENDIENTE: ficha o documento UAO",
        "fechaConsulta": "PENDIENTE"
      },
      "creditos": [
        { "recurso": "canto", "autor": "PENDIENTE", "licencia": "PENDIENTE", "referencia": "PENDIENTE" }
      ],
      "preguntas": [
        {
          "id": "colibri-info-01",
          "enunciado": "PENDIENTE: pregunta respaldada por la ficha",
          "opciones": ["PENDIENTE A", "PENDIENTE B", "PENDIENTE C"],
          "correcta": 0,
          "explicacion": "PENDIENTE: por qué la respuesta es correcta"
        }
      ]
    }
  ]
}
```

Crear los otros cuatro registros conservando exactamente los nombres de campos. `escalaExhibicion` es un factor visual uniforme, no el tamaño biológico certificado de la especie.

### 4.3 Validación necesaria

- IDs únicos y los acordados en el catálogo vigente, sin tildes en los IDs.
- Campos obligatorios presentes, textos no vacíos y sin `PENDIENTE` en la versión final.
- Preguntas con ID único, tres opciones y `correcta` entera entre cero y dos.
- Respuesta correcta y explicación respaldadas por información presentada.
- Rutas existentes y sensibles a mayúsculas/minúsculas en el hosting Linux.
- Escala finita y mayor que cero.
- Clips previstos y autorías/licencias registradas.

Comprobar sintaxis inicialmente con PowerShell:

```powershell
Get-Content -LiteralPath './src/data/aves.json' -Raw | ConvertFrom-Json | Out-Null
```

Esto solo comprueba que el JSON pueda leerse, no que los datos biológicos, rutas o índices sean correctos. Implementar la validación de estructura al cargarlo para informar un registro inválido sin derribar toda la app.

`tsconfig.json` permite importar JSON. Un componente puede leer `./data/aves.json`; comprobar la compilación tras crear el archivo. Los datos quedan en el bundle: **se requiere recompilar** si cambian. Una alternativa futura es `src/assets/data/aves.json` leído por `fetch`, pero no mezclar ambos contratos sin documentar la decisión.

### 4.4 Configuración de experiencia

Proponer `src/data/experiencia.json` para cantidad de preguntas, orden de especies, límites de inspección, especie inicial, escala de exhibición y desplazamientos del reto relativos al punto elegido. La raíz de colocación almacena posición y orientación; los IDs vigentes describen alternativas para una sola ave activa. Separar estas posiciones de la información biológica, ya que son decisiones de diseño.

**Salida P1:** fuente, fichas del catálogo vigente, recursos identificados, preguntas revisadas y JSON válido.

## 5. P2 — Producción y entrega de recursos 3D

### 5.1 Aves low poly en Blender

1. Revisar fotografías verificadas y elegir rasgos que distingan la especie.
2. Crear silueta simple: cuerpo, cabeza, pico, alas, patas y cola; mantener el estilo común.
3. Usar materiales planos y pocas texturas; detalles que no se vean en móvil no justifican complejidad.
4. Preparar origen en los pies o una raíz de aterrizaje claramente definida.
5. Acordar la orientación final en Studio: el contrato runtime es frente local `+Z` y vertical `+Y` en glTF. Blender utiliza vertical Z; verificar la conversión al exportar, no asumir que ambos ejes coinciden.
6. Aplicar transformaciones apropiadas antes del rig; con un modelo ya animado, comprobar que cualquier ajuste no altere los clips.
7. Crear rig simple y revisar deformación de alas, patas y cabeza.
8. Exportar cada ave a un GLB autocontenido con las animaciones necesarias.
9. Reimportar el GLB, revisar materiales y probar los clips.
10. Importarlo en Studio y verificar escala, dirección, sombra y reproducción.

### 5.2 Clips acordados

| Clip | Uso | Comportamiento esperado |
|---|---|---|
| `idle` | Reposo o espera | Bucle suave sin desplazamiento de la raíz |
| `fly` | Búsqueda o aparición opcional | Movimiento de alas; trayectoria controlada por la app |
| `land` | Aterrizaje opcional al aparecer | Una reproducción, acaba compatible con reposo |
| `sing` | Canto | Movimiento corto sincronizable con el audio |
| `happy` | Respuesta correcta | Celebración breve |
| `no` | Respuesta incorrecta | Reacción breve sin mover el ave fuera de su sitio |

Evitar que `fly` mueva la raíz por animación y que el controlador vuelva a desplazarla por código: se sumaría movimiento dos veces. Mantener clips in-place cuando la app controla trayectorias. No usar `*` para las aves de producción, porque no es una selección explícita del clip requerido.

Si falta un clip durante desarrollo, mantener `idle` o una reacción sencilla y registrar un TODO. Antes de entregar, completar el contrato o acordar y documentar una adaptación coherente. No inventar nombres de clips sin revisar el GLB.

### 5.3 Objetivos de recursos

Los límites son objetivos del equipo, no restricciones oficiales del motor ni resultados medidos.

| Recurso | Objetivo inicial | Cómo comprobar |
|---|---|---|
| Ave | Menos de 15.000 triángulos y 5 MB por archivo; intentar bastante menos | Estadísticas de Blender y peso del GLB |
| Textura, si existe | Hasta 1024 px, pocas por ave | Inspección de imágenes exportadas |
| Canto | MP3 mono, menos de 300 KB cuando conserve claridad | Peso, escucha y prueba móvil |
| Fotografía | JPG/WebP hasta 800 px de ancho | Dimensión y lectura en ficha |
| Campus | Conservar versión ligera y probada | Peso total, materiales y rendimiento |

Cinco archivos de aves de 5 MB ya sumarían 25 MB, aunque solo se muestre uno a la vez. Por ello medir el **total** y no considerar el máximo por ave como presupuesto a consumir. El objetivo de interacción es al menos 30 FPS en el dispositivo de referencia, con medición registrada y posibilidad de ajustar calidad.

### 5.4 Conservar el campus como recurso opcional

1. Revisar el GLB que el equipo copió al proyecto. Su hash y peso difieren del entregado aquí; puede haber cambios válidos.
2. Comparar versiones en Blender/Studio y seleccionar una sin sobrescribir trabajo ajeno.
3. La exportación original de esta conversación tiene 34.595 triángulos, 18 materiales, sin texturas bitmap y dimensiones de maqueta de aproximadamente 1,03 × 2,06 m. Esos valores no certifican la copia de 2,94 MB presente en E:.
4. El campus no se integra en la raíz de colocación del ave. Si se desarrolla una vista opcional del mapa, probarla independientemente y fuera del recorrido principal.
5. No hacen falta perchas del campus para colocar el ave: se usa el punto de superficie elegido. Para una futura vista interactiva del mapa, crear anchors aparte, porque el GLB agrupa por material.
6. El colibrí debe poder verse y tocarse al colocarlo directamente, aunque su escala de exhibición sea mayor que la real. Ajustar el apoyo de cada especie al mismo punto.
7. No llevar fondo morado, cámaras de presentación ni luces del render al GLB de RA. El morado es el contexto de la maqueta/render; en RA el fondo lo da la cámara.

### 5.5 Franjas, clipping y superficies próximas

Si aparecen bandas o parpadeos, comprobar en este orden: modelos duplicados superpuestos, superficies coplanares, separación entre capas, escala del objeto y rango de clipping de la cámara. En Blender revisar también el clipping del visor, que es distinto al de la cámara de render. Eliminar caras ocultas/coplanarias innecesarias y asegurar separación suficiente entre tejado, jardín y paneles.

En Studio, `nearClip` y `farClip` controlan el rango de visibilidad de la cámara. Ajustarlos con pruebas de distancia mínima y máxima; un inicio excesivo oculta objetos cercanos, y un rango exagerado puede dificultar la precisión de profundidad. No prometer que el importador elimina automáticamente el z-fighting. Ver [cámara de Studio](https://8thwall.org/docs/api/studio/ecs/camera) y [problemas de profundidad del visor de Blender](https://docs.blender.org/manual/en/latest/troubleshooting/3d_view.html).

**Salida P2:** modelos identificables, clips y recursos revisados en Studio, no solo en el render de Blender.

## 6. P3 — Colocación directa, cambio de especie y máquina de estados

### 6.1 Jerarquía de colocación en Studio

Jerarquía propuesta; no son nodos existentes:

```text
ColocacionRoot (posición y orientación elegidas sobre el plano)
├── AveActiva (un solo modelo, ID de especie y transformación local)
├── PanelFicha (asociado al ave)
└── ContenidoQuiz (tarjetas/paneles temporales en RA)
ControlesGlobales (selector de especie, Reubicar, quiz y reinicio)
```

1. Coordinar edición de la escena. Adaptar el prefab del ejemplo para crear un ave directamente.
2. Crear una raíz invisible que guarde el punto elegido; no añadir isla, campus ni hábitat base.
3. Conservar selección de especie antes de colocar. Puede configurarse una inicial, mostrada claramente en el selector.
4. Revisar origen/apoyo, orientación y escala por especie. La raíz es estable; el modelo usa transformaciones locales.
5. Conectar controles para cambiar el modelo, reubicar y limpiar la sesión.

### 6.2 Adaptar tap-to-place

Actualmente cada toque válido crea un prefab con orientación aleatoria. La implementación nueva debe:

1. Permitir colocación solo en ESCANEO o REUBICAR y con impacto válido sobre la superficie.
2. La detección muestra guía/retícula; no crea el ave hasta que el usuario toque el lugar.
3. Ignorar toques sobre UI y bloquear una segunda operación durante creación/carga.
4. Guardar posición y orientación elegidas. En el primer toque crear raíz y ave seleccionada; al reubicar mover la raíz existente.
5. Ocultar retícula al colocar. En el piloto vigente, cargar pasa a ATERRIZANDO; EXPLORAR se habilita solo después de llegada y mezcla a reposo.
6. Guardar la referencia de raíz y ave activa; no depender de buscar entidades logo.

La posición de toque usada por la plantilla no demuestra que ya exista una retícula de detección continua. Verificar la API de hit-testing de la versión instalada antes de implementarla.

### 6.3 Máquina de estados

```text
INTRO -> PREPARANDO -> ESCANEO -> COLOCANDO -> ATERRIZANDO -> EXPLORAR
EXPLORAR -> CAMBIANDO_AVE -> EXPLORAR
EXPLORAR -> REUBICAR -> EXPLORAR (confirmar o cancelar)
EXPLORAR -> AVISTAMIENTO -> EXPLORAR
EXPLORAR -> QUIZ_CANTO -> QUIZ_INFO -> RESULTADOS
RESULTADOS -> QUIZ_CANTO (repetir) o EXPLORAR
sesión activa -> REINICIANDO -> ESCANEO
fallo recuperable -> ERROR -> recuperación controlada
```

| Estado | Controles y comportamiento | Al salir |
|---|---|---|
| INTRO | Comenzar, explicación y créditos | Retirar bienvenida |
| PREPARANDO | Permisos, audio y recursos iniciales | Retirar carga finalizada |
| ESCANEO | Retícula válida, selector y toque para colocar | Bloquear más colocaciones |
| COLOCANDO | Crear ave elegida; entrada protegida | Tras cargar, comenzar ATERRIZANDO; fallo recuperable a ERROR |
| ATERRIZANDO | Descenso y pose sincronizados; solo Reiniciar contextual | Mezclar a reposo y habilitar EXPLORAR; limpiar al cancelar |
| EXPLORAR | Ave activa, ficha, canto, inspección, selector y reubicación | Cerrar ficha y detener audio antes de cambiar de modo |
| CAMBIANDO_AVE | Cargar/reemplazar especie en el punto guardado | Activar solo la última selección vigente |
| REUBICAR | Retícula, confirmar toque o cancelar | Confirmar punto nuevo o mantener el anterior |
| AVISTAMIENTO | Buscar el ave activa, pista y registro | Restaurar su posición y detener audio |
| QUIZ_CANTO | Tocar tarjetas RA de especies | Retirar audio y opciones de la ronda |
| QUIZ_INFO | Tocar opción en panel RA | Retirar opciones/eventos |
| RESULTADOS | Repetir quiz o explorar | Retirar resultados |
| REINICIANDO | Entrada bloqueada y limpieza | Volver a escaneo |
| ERROR | Mensaje y recuperación aplicable | Retirar error al recuperar |

La animación es independiente del estado de app: idle puede reproducirse durante EXPLORAR. Una animación de aparición no exige botón Iniciar llegada ni despliegue de aves del catálogo vigente.

### 6.3.1 Llegada vigente del Colirufo

src/arrival-motion.js calcula el origen aleatorio, trayectoria y compensación sin motor. src/tap-to-place.ts usa tick de registerComponent y world.time.delta/1000. El destino se conserva en PlacementSession.position; loaded(generation) entra en ATERRIZANDO y arrived(generation) habilita EXPLORAR. El evento object-placed se emite una sola vez al terminar la mezcla, no al cargar. El tap funcional, arrastre y pinch conservan sus listeners y se bloquean mediante la fase existente de inspección. Reubicar mueve la misma raíz y no crea otro recorrido.

Parámetros en aves.json → llegada: duración 2,25 s; mezcla a reposo 0,16 s; altura aleatoria 0,45–0,75; radio 0,35–0,65 en unidades de escena; exponente vertical 1,1. Se usa suavizado de quinto grado con velocidad nula en los extremos y diferente avance horizontal/vertical para curvar el descenso. El origen no se vuelve a sortear durante el movimiento.

src/data/colibri-aterrizaje.json contiene duración real 2,5 s de 05_Landing, contacto visual a 2,25 s, 151 claves LINEAR del hueso root y referencia de root al iniciar 03_Perched_Idle_Loop. La curva fue extraída del GLB, identificado por SHA-256; si cambia el modelo, la prueba de integridad exige recalibrar. Las poses reales revisadas en Blender muestran alas plegadas hacia 2,25 s. Conservar rotaciones y articulación del clip: solo se compensa su traslación global de root en el hijo, escalada y rotada por giroY, relativa a la referencia de reposo. Al finalizar, la compensación es cero y se restaura posicionLocal sin salto.

Durante descenso GltfModel reproduce 05_Landing con timeScale=contactoSegundos/duracionSegundos, positivo. Comienza tras GLTF_MODEL_LOADED y no recibe saltos de time en cada tick. El control anterior con timeScale=0 mantenía congelada la pose, porque el seek del mixer también aplica la velocidad de la acción. El movimiento usa el mismo delta ECS. Tras un fotograma de contacto, se cambia a reposo con timeScale=1 y crossFadeDuration=0.16; EXPLORAR se habilita al concluir la mezcla. Perder seguimiento pone paused=true y suspende la trayectoria; recuperarlo reanuda sin reiniciar. Reinicio/fallo/dispose conservan la limpieza y las generaciones.

Se conserva el offset local original y la escala: ancla del modelo y apoyo de patas son referencias diferentes. El reposo está diseñado para percha; posicionLocal.y=0.25 mantiene la altura de exhibición previa. El descenso termina exactamente en el ancla seleccionada, pero no se afirma que las patas toquen el suelo. Ajustar apoyo físico exige otra calibración de origen/pose; no se altera el GLB ni la altura anterior en esta tarea. La revisión en Blender valida recurso y trayectoria; ECS simulado valida lógica y limpieza. ECS 3.2.0 real en Edge confirmó el congelamiento con velocidad cero y el avance del esqueleto con velocidad positiva. Studio/Android/iPhone quedan pendientes para la llegada completa y la mezcla en AR.

Fuentes: [registerComponent y tick](https://8thwall.org/docs/api/studio/ecs), [world.time](https://8thwall.org/docs/api/studio/world/time), [GltfModel](https://8thwall.org/docs/api/studio/ecs/gltf-model), tipos locales node_modules/@8thwall/ecs/index.d.ts. Resultado: 43 pruebas unitarias y compilación aprobadas; dos avisos previos de tamaño. Se comprobaron regresiones de radial, guía, animaciones, inspección, reubicación y canto con pausa/cierre.

### 6.4 Cambiar especie sin duplicar el modelo

1. En EXPLORAR, guardar la nueva selección y pasar a CAMBIANDO_AVE.
2. Detener canto y feedback de la anterior; cerrar ficha y restaurar su inspección.
3. Mantener posición y orientación de la raíz. Aplicar tamaño de exhibición y apoyo propios de la nueva especie.
4. Cargar o recuperar el recurso elegido. Reemplazar el modelo dentro de AveActiva, o retirar la entidad anterior al activar la nueva; nunca dejar ambas visibles.
5. Asociar selección, collider y ficha al nuevo ID; activar idle al finalizar.
6. Si hay selecciones rápidas, usar un identificador de solicitud: una carga antigua que finalice tarde no puede sobrescribir la última elección.
7. Si falla, mostrar reintento y conservar/restaurar una ave válida en el mismo punto. No mover la raíz ni dejar modelo y ficha de especies distintas.

Cambiar especie no cambia la ubicación. Como decisión inicial, el nuevo modelo usa su transformación local por defecto; no hereda un escalado o giro de inspección que resulte inadecuado.

### 6.5 Reubicar y reiniciar

Reubicar conserva especie y ubicación original hasta confirmar otro toque válido. Puede ocultarse temporalmente el modelo y mostrar un preview; cancelar lo restaura donde estaba. Una confirmación mueve la raíz existente y vuelve a explorar, sin crear otro ejemplar.

Reiniciar detiene audio, cancela movimientos/cargas pendientes, invalida solicitudes antiguas, retira listeners, elimina raíz/ave, cierra tarjetas y fichas y limpia selección activa, avistamientos y puntaje. Volver a ESCANEO manteniendo la especie elegida como preferencia de la sesión y los recursos en caché si conviene. El Reset actual para entidades logo necesita adaptación.

**Salida P3:** detectar sin tocar no crea un ave; tras colocar queda una sola, el selector conserva el punto, Reubicar cambia solo la ubicación y reiniciar no deja entidades ni cargas tardías.

## 7. P4 — Control de ave, ficha, audio e inspección

### 7.1 Separar responsabilidades

| Módulo propuesto | Responsabilidad | No debe asumir |
|---|---|---|
| Estado de app | Modo permitido y cambios de fase | Textos biológicos |
| Control de ave | ID, modelo, animación y posición original | Puntaje de quiz |
| Selección | Relación toque/entidad/ID | Corrección de preguntas |
| Ficha | Renderizar datos y cerrar panel | Modificar datos de especie |
| Audio | Canto activo, SFX, volumen y limpieza | Mezclar cantos por selección accidental |
| Inspección | Giro/escala del ave activa | Reubicar la raíz sin activar ese modo |

1. Mantener ID seleccionado, ID del ave activa, entidad del modelo y catálogo por ID. Durante exploración solo hay una entidad de ave activa.
2. Preparar zonas de toque suficientemente grandes, comprobando collider/raycast con la versión de Studio.
3. Resolver el gesto según el estado: en EXPLORAR se conserva la ruta funcional tap sobre el ave → ui.openInfo(point), pero la UI presenta el círculo persistente. Un segundo tap ejecuta Ficha, Animaciones, Canto, Reubicar o Reiniciar directamente desde la UI. Ficha llama a openGuide para mostrar la guía existente, sin volver a abrir el círculo. Arrastre y pinch no cuentan como tap. Tocar fuera o Escape cancela el círculo; sus eventos no actúan detrás del HUD. AVISTAMIENTO registra objetivo; QUIZ_CANTO contesta tocando una tarjeta RA de especie.
4. Ignorar toques de aves cuando está activo un control superpuesto o no corresponde al modo.
5. Mostrar el nombre del ave activa y permitir cambiarla con el selector. Bloquear ese selector durante quiz, búsqueda o carga de reemplazo.

### 7.2 Animación y audio: APIs consultadas

La documentación oficial permite establecer `animationClip`, `loop` y `time` en `ecs.GltfModel`. Fragmento ilustrativo para una entidad ya válida; no es un componente completo probado en este proyecto:

```typescript
import * as ecs from '@8thwall/ecs'

// world y birdEid deben proceder del componente que controla el ave.
ecs.GltfModel.set(world, birdEid, {
  animationClip: 'sing',
  loop: false,
  paused: false,
  time: 0,
})
```

Comprobar si volver a seleccionar el mismo clip reinicia como se espera. Coordinar la vuelta a `idle` con la duración del clip y la acción, no con un tiempo arbitrario igual para todas las especies. Fuente: [GltfModel](https://8thwall.org/docs/api/studio/ecs/gltf-model).

Para canto espacial, `ecs.Audio` dispone de URL, volumen, pausa y `positional`. Ejemplo de configuración, no garantía de autoplay:

```typescript
ecs.Audio.set(world, audioEid, {
  url: 'assets/audio/colibri_canto.mp3',
  volume: 0.8,
  loop: false,
  paused: false,
  positional: true,
  refDistance: 0.5,
  rolloffFactor: 1,
})
```

La entidad de audio debe estar asociada a la posición buscada y la escala de la escena. Probar que movimiento de cámara y fuente produce cambios audibles. Fuente: [Audio](https://8thwall.org/docs/api/studio/ecs/audio).

### 7.3 Política de audio

**Implementación vigente de exploración (13 de octubre de 2026):** src/bird-audio.js controla una instancia HTMLAudioElement no espacial. pilot-ui.ts la activa directamente al seleccionar Canto, quinta opción de 72° del círculo. No se modifican listeners de tap ni APIs ECS. La ruta assets/audio/colibri_canto.mp3 y crédito del archivo aportado están en aves.json; las etiquetas y errores en interfaz.json. El canto del reto espacial descrito arriba continúa siendo trabajo futuro.

play() se invoca dentro del click, sin await previo ni temporizador de cierre. playing habilita ondas y panel; waiting conserva el panel si ya se inició el audio, con estado de carga. pause conserva currentTime y el panel, sin ondas; resume llama play desde el botón Continuar, sin resetear el tiempo. ended detiene la sesión. Una generación descarta promesas antiguas al pausar, repetir, detener o destruir; repetir pausa y vuelve a tiempo cero sobre el mismo elemento. La X del panel llama stop, vuelve a tiempo cero y cierra con transición de 180 ms; la pausa del canto es independiente de la pausa de animaciones del modelo. Los errores de carga y NotAllowedError muestran mensajes distintos. Cambio de fase fuera de EXPLORAR, elección del selector, reubicación, reinicio y pestaña oculta detienen; dispose retira listeners, src y carga. Autor y licencia del MP3 no proporcionados se mantienen null. Fuentes: [HTMLMediaElement.play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [playing](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playing_event) y [load](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load).

1. Activar/inicializar el sistema desde Comenzar o un botón de reproducción.
2. Detener el canto anterior al seleccionar otra ave.
3. Usar cantos con volumen similar y sin efectos que oculten rasgos de la especie.
4. En el quiz de canto, pausar ambiente/otros cantos para evitar pistas cruzadas.
5. Usar sonido breve de acierto/error después de la respuesta, no simultáneamente con la muestra a reconocer.
6. Ofrecer silencio y feedback visual; indicar que la ronda de cantos requiere escuchar o activar audio.
7. Manejar reproducción bloqueada con un botón claro, no con intentos automáticos repetidos.
8. Detener audio al reiniciar o abandonar el modo; comprobar comportamiento al ocultar y restaurar la pestaña.

### 7.4 Ficha e inspección

1. Crear panel con nombre, fotografía, datos y control de canto; usar placeholders solo mientras faltan recursos.
2. Mantener panel anclado/asociado a la experiencia RA; los controles globales de navegación pueden ser overlay.
3. Guardar escala, giro y posición originales de cada ave antes de inspección.
4. Aplicar escalado uniforme y límites configurables; evitar escalas negativas o próximas a cero.
5. Diferenciar gesto de giro/pinch de un toque de selección.
6. Ofrecer Restaurar y cerrar ficha; verificar que no altera el punto de colocación. Reubicar es un modo distinto.
7. Comprobar que girar el modelo no gira accidentalmente el panel o cambia la respuesta del quiz.

**Salida P4:** las aves del catálogo vigente responden con datos correctos y la inspección es reversible.

## 8. P5 — Reto de avistamiento

1. Rechazar inicio si no hay ave colocada o aún se carga/cambia el modelo.
2. Usar como objetivo el ID del ave activa y detener audios de exploración.
3. Guardar la transformación original y mover el ave a una ubicación cercana respecto del punto de colocación, sin crear otra instancia.
4. Reproducir canto espacial y mostrar instrucciones cortas.
5. Evaluar el toque sobre la entidad objetivo: suelo, controles u otros elementos no completan; tocar el ave registra una sola vez.
6. Mantener registros de sesión por ID, diferenciándolos de las respuestas del quiz.
7. Pista puede repetir canto o dar orientación visual discreta; cancelar devuelve al modo anterior.
8. Restaurar posiciones y parar audio en éxito, cancelación o reinicio.

No programar ubicaciones que obliguen a caminar hacia obstáculos reales. Mantener la búsqueda orientada al giro del celular alrededor del espacio preparado. El audio espacial es una ayuda, no una prueba de localización precisa en altavoces de cualquier teléfono.

**Salida P5:** reto repetible con éxito, error y cancelación comprobados.

## 9. P6 — Quizzes, bloqueo de respuestas y resultados

### 9.1 Datos de sesión

Mantener separados: cola de cantos, cola de preguntas informativas, índice actual, respuestas, puntos por ronda y bloqueo de respuesta. No guardar el puntaje dentro del JSON de especies. Reiniciar estas estructuras al comenzar un nuevo quiz.

Configuración inicial propuesta: una ronda de cantos y otra de información, con cantidad ajustada a las especies con recursos completos. Cada respuesta correcta suma uno; incorrecta suma cero. El máximo se calcula con la cantidad de preguntas de la sesión. Si se cambia la cantidad, calcular el máximo a partir de la sesión y actualizar los textos del resultado.

### 9.2 Ronda de cantos

1. Barajar una copia de los IDs vigentes; no modificar el catálogo original.
2. Guardar especie y transformación del ave de exploración y ocultarla temporalmente. Crear tarjetas de las especies habilitadas en RA cerca del punto de colocación, con nombre o imagen verificable, sin cargar modelos del catálogo vigente simultáneos.
3. Para cada ID, guardar la respuesta esperada antes de reproducir el canto.
4. Permitir repetir audio sin sumar puntos ni cambiar pregunta.
5. Al tocar una tarjeta de especie, revisar bloqueo y estado; marcar inmediatamente la pregunta como resuelta.
6. Comparar el ID, guardar respuesta y sumar una sola vez.
7. Dar feedback en las tarjetas, sonido y explicación de la correcta. Si se muestra una reacción de ave, usar una sola representación temporal después de resolver, sin revelar la respuesta antes del toque.
8. Avanzar mediante Siguiente después de feedback.
9. Al terminar la ronda configurada, pasar a QUIZ_INFO y detener el canto.

### 9.3 Ronda de información

1. Seleccionar una pregunta de cada especie del banco, luego mezclar orden.
2. Si se mezclan opciones, transportar también el índice de respuesta correcta; no conservar el índice original de forma errónea.
3. Mostrar enunciado y tres opciones sobre la escena RA.
4. Aplicar el mismo bloqueo para evitar doble toque o pulsaciones durante feedback.
5. Guardar especie, ID de pregunta, opción elegida y corrección.
6. Mostrar explicación tomada del registro y avanzar.
7. Pasar a RESULTADOS cuando no queden preguntas.

### 9.4 Repetición y salida

Resultados muestra aciertos de cantos, aciertos de información y total/máximo. Repetir quiz limpia respuestas y puntos, crea nuevas colas y conserva el punto elegido. Volver a explorar retira tarjetas, restaura el ave seleccionada y su transformación original y reactiva controles. Reiniciar colocación realiza la limpieza completa de P3.

### 9.5 Casos de prueba imprescindibles

| Caso | Resultado esperado |
|---|---|
| Diez respuestas correctas | 5/5 por ronda y 10/10 total |
| Todas incorrectas | 0/10 y explicaciones correctas |
| Doble toque sobre la misma respuesta | Una respuesta y una sola puntuación |
| Tocar dos tarjetas rápidamente | Solo la primera respuesta válida resuelve la pregunta |
| Repetir canto | Mismo objetivo, sin puntaje adicional |
| Repetir quiz tras terminar | Puntaje inicial cero, colas nuevas |
| Salir y volver a iniciar | Posiciones/UI/audio coherentes |
| Pregunta inválida en desarrollo | Aviso y tratamiento definido; no índice fuera de rango |

Automatizar pruebas de la lógica pura del puntaje, bloqueo, selección sin repetición y reinicio cuando se implementen esos módulos. Complementarlas con pruebas de interacción real; no escribir tests que solo reproduzcan el código sin comprobar un comportamiento.

**Salida P6:** ambos quizzes puntúan correctamente y pueden repetirse.

## 10. P7 — Integración, rendimiento y pruebas

### 10.1 Orden de integración

1. Base y publicación temprana.
2. Contrato de datos y un recurso piloto.
3. Punto de colocación, selector de especie y estado.
4. Una ave con ficha/canto completa.
5. Cambio entre las especies del catálogo vigente e inspección de una ave activa.
6. Avistamiento.
7. Ronda de cantos.
8. Ronda informativa y resultados.
9. Recursos finales, créditos y optimización.

Este orden mantiene una versión comprobable en cada hito. No integrar todos los cambios de escena el último día.

### 10.2 Medición con la escena completa

1. Medir peso total de modelos, audios e imágenes y tiempos de carga con caché fría/caliente.
2. Observar FPS y pausas durante spawn, cambio de especie, giro, búsqueda y quiz en el dispositivo más limitado disponible.
3. Registrar ave activa, recursos en caché, tarjetas visibles, sombras y configuración cuando se mide.
4. Mantener especies del catálogo vigente en el selector y una sola ave visible. Elegir carga bajo demanda o precarga medida; simplificar `idle` y efectos secundarios si hace falta.
5. Reducir materiales, texturas o sombras antes de sacrificar identificación. El campus opcional tiene su propia medición.
6. Comprobar que el indicador de carga no desaparece antes de tener los recursos básicos listos.
7. Cambiar de orientación, minimizar/restaurar y completar tres recorridos consecutivos.

### 10.3 Matriz de pruebas manuales

Crear un registro por versión publicada. No dejar casillas aprobadas sin ejecución.

| ID | Acción | Resultado esperado |
|---|---|---|
| T01 | Abrir URL HTTPS y comenzar | Cámara disponible tras permiso |
| T02 | Negar permiso | Mensaje y recuperación, sin pantalla vacía |
| T03 | Detectar plano sin tocar; luego colocar con doble toque | Nada aparece antes del toque; después solo una ave |
| T04 | Mover el celular alrededor | Seguimiento razonablemente estable |
| T05 | Cambiar rápidamente entre las especies del catálogo vigente | Queda solo la última elegida en el mismo punto |
| T06 | Seleccionar cada especie | Ficha, imagen y canto correspondientes |
| T07 | Girar/escalar/restaurar | Sin deformación ni cambios de punto de colocación |
| T08 | Buscar, fallar y registrar | Solo el objetivo completa el reto |
| T09 | Cancelar avistamiento | Audio detenido y exploración restaurada |
| T10 | Quiz de cantos | Sin repetición de especie ni doble puntaje |
| T11 | Quiz informativo | Opciones y respuesta correctas |
| T12 | Repetir y volver a explorar | Puntaje y posiciones reiniciados correctamente |
| T13 | Reubicar, cancelar y reiniciar | Un punto nuevo tras confirmar; cancelar conserva el anterior; reiniciar limpia la sesión |
| T14 | Recurso ausente durante desarrollo | Placeholder/aviso; flujo no bloqueado |
| T15 | Red lenta o motor no descargado | Mensaje de espera/error comprensible |
| T16 | Abrir desde Pages | Ningún 404 en recursos esenciales |
| T17 | Ver objetos de cerca y lejos | Sin franjas persistentes ni cortes indebidos |
| T18 | Tres recorridos completos | Sin deterioro visible ni acumulación de estado |

Registrar: ID, versión/commit, teléfono, SO, navegador, fecha, resultado (aprobado/falló/no ejecutado), pasos de reproducción, evidencia y responsable. Ejecutar en al menos Android/Chrome e iPhone/Safari. Si no hay uno disponible, indicar **no probado**, no aprobado.

### 10.4 Diagnóstico práctico

| Síntoma | Revisar primero | Comprobación |
|---|---|---|
| Cámara no abre | HTTPS, permisos y carga del motor | Consola y prueba de plantilla mínima |
| No aparece GLB | Ruta, tamaño real/LFS, escala y orientación | Network, reimportación y escena aislada |
| Clip no se reproduce | Nombre exacto, pausa y duración | Probar un clip por vez |
| No hay audio | Gesto de inicio, ruta, volumen y silencio | Botón explícito y prueba de un MP3 |
| Ficha equivocada | Mapeo entidad/ID | Seleccionar las cinco y comparar JSON |
| Puntaje repetido | Resolución por pregunta y listeners duplicados | Doble toque controlado |
| Modelo salta o crece raro | Jerarquía, escalado y raíz animada | Restaurar transformaciones locales |
| Franjas en superficies | Duplicados, separación y clipping | Probar geometría aislada y rango razonable |
| Funciona local pero no Pages | Subcarpeta, case-sensitive y recursos LFS | URLs reales y respuesta de cada recurso |

## 11. Git y colaboración paso a paso

### 11.1 Antes de trabajar

1. Guardar Studio y comprobar `git status`.
2. Confirmar rama personal y reservar archivos en el tablero.
3. Actualizar referencias remotas; integrar `main` solo con árbol limpio o cambios preservados.

```powershell
git fetch origin
git merge origin/main
```

Esto actualiza la rama personal con cambios de `main`; no mueve el trabajo a `main`. Si aparece un conflicto de escena, no aceptar de forma automática ours/theirs. Coordinar con el otro editor y conservar recursos de ambos.

### 11.2 Registrar una tarea

1. Guardar Studio, revisar diff y confirmar que no se incluyen temporales.
2. Compilar y ejecutar la prueba de aceptación de la tarea.
3. Añadir solo rutas revisadas. Ejemplo, cuando esos archivos existan:

```powershell
git diff --stat
git diff
git add src/data/aves.json docs/PLANEACION.md docs/TECNICO.md
git commit -m 'Documentar el flujo y los datos de las aves del catálogo vigente'
git push origin juandate
```

Cambiar rama y archivos según la tarea real. No copiar ese `git add` si `aves.json` aún no existe. Los recursos `src/assets/**` están configurados con Git LFS; comprobar con `git lfs ls-files`. Las copias fuente `.blend` no deben inflar el bundle: mantenerlas fuera de `src/assets/` o en la ubicación de arte acordada.

### 11.3 Pull request e integración

Describir comportamiento cambiado, archivos de escena afectados, recursos nuevos y prueba ejecutada. Otro integrante revisa; integrar en `main` cuando cumple su criterio. Nunca hacer push directo a `main` según las reglas actuales. Revisar Actions después del merge porque también publica.

## 12. Publicación en GitHub Pages

### 12.1 Preparar la versión

1. Guardar escena y recursos finales.
2. Ejecutar `npm run build` desde la raíz; corregir errores, no publicar un bundle anterior por accidente.
3. Revisar `dist/index.html`, `bundle.js`, recursos y runtime copiado.
4. Probar la versión local y revisar rutas compatibles con el hosting.
5. Confirmar nombre real del repositorio, propietario y configuración de Pages.

El workflow actual escucha cambios en `main` y ejecución manual. Hace checkout con LFS, usa Node 20, ejecuta `npm ci` y `npm run build`, sube `dist/` y despliega. No hay que versionar `dist/` para este flujo.

### 12.2 Activación inicial

1. En GitHub, abrir repositorio > Settings > Pages.
2. En Build and deployment > Source, seleccionar GitHub Actions.
3. Confirmar permisos para Pages y disponibilidad del plan utilizado; el proyecto propone repositorio público.
4. Integrar por PR o ejecutar Actions > Deploy to GitHub Pages > Run workflow desde `main` cuando el workflow exista allí.
5. Esperar build y deploy; si fallan, leer el primer error relevante del log.
6. Obtener el enlace desde Pages o el job de despliegue y abrirlo fuera de la sesión del desarrollador.

Fuente: [configurar la publicación de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### 12.3 Subcarpeta y rutas

El servidor de desarrollo de Studio necesita output.publicPath = '/' para resolver sus rutas HTTP. config/webpack.config.js aplica esa ruta solo con --mode=development y conserva './' para el build de Pages. Con './' en desarrollo se comprobó que /index.html y /bundle.js respondían 404 aunque /webpack-dev-server listaba los assets compilados; el middleware compara cada URL con el prefijo configurado. Al cambiar esta configuración, cerrar y volver a abrir el proyecto en Studio para reiniciar su servidor. El fallo documentado de cambiar clientes con el simulador ejecutándose también puede dejarlo en Initializing; ver [problemas conocidos](https://8thwall.org/docs/troubleshooting).

Para un repositorio llamado `AR_AvesUAO`, la URL habitual sería `https://<propietario>.github.io/AR_AvesUAO/`. Es un patrón, no el enlace confirmado del equipo.

En la base original `output.publicPath` valía `/`; el piloto lo cambia a `./` para el bundle. Eso puede afectar recursos generados que se resuelvan desde la raíz del dominio; no implica por sí solo que toda ruta relativa vaya a fallar. Revisar Network para localizar la URL concreta incorrecta. Si corresponde al despliegue de proyecto bajo esa subcarpeta, ajustar coherentemente el publicPath a `/AR_AvesUAO/` o una estrategia relativa comprobada. No cambiarlo sin revisar también runtime, assets y uso local.

Comprobar que se descargan un GLB, un MP3, una imagen, el runtime y los scripts CDN. Si un GLB contiene un pequeño texto `version https://git-lfs.github.com/spec/v1`, se está sirviendo el puntero LFS, no el modelo: revisar checkout y disponibilidad de los objetos. El workflow ya solicita `lfs: true`, pero necesita que los binarios se hayan subido realmente.

### 12.4 Exportación manual desde Studio

Como alternativa, Studio permite **Publish > HTML5 > Build** y descargar un ZIP. Extraerlo y revisar la carpeta que contiene `index.html`. Ese ZIP es un build web, no un archivo que Pages ejecute por subirlo sin extraer.

Si se adopta publicación manual, definir una estrategia separada para desplegar el contenido del build. El workflow actual recompila desde código; añadir un ZIP al repositorio no cambia automáticamente ese comportamiento. Mantener un solo procedimiento documentado para la entrega.

Fuente: [publicación de Studio](https://8thwall.org/docs/getting-started/publishing).

### 12.5 Comprobación posterior

Abrir desde Android e iPhone, permitir cámara, seleccionar las aves del catálogo vigente, escuchar cantos, ejecutar búsqueda y quiz, repetir y reiniciar. Registrar el commit que generó el sitio. Un check verde en Actions solo demuestra que esos jobs terminaron, no que el aprendizaje, la cámara o el audio funcionen en el teléfono.

## 13. Licencias, créditos y dependencias

El motor de seguimiento se distribuye como binario con condiciones distintas del framework abierto. Conservar los archivos sin modificación y comprobar los avisos y licencia del bundle usado. Si falta el aviso accesible, seguir la alternativa indicada por la documentación oficial; no inventar un texto legal. Fuente: [distribución y cumplimiento del motor](https://8thwall.org/docs/open-source).

Mantener una lista de modelos, imágenes, cantos y efectos con autor, fuente, licencia y atribución requerida. Mostrar créditos en la aplicación y conservar referencias en el proyecto. No añadir servicios de pago ni dependencias que requieran tarjeta.

Aunque se edita y compila localmente, el HTML actual usa CDN para motor y landing page. **No está garantizado funcionamiento offline**. Evitar cambios en esas dependencias al preparar la demo sin probarlos antes.

## 14. P8 — Empaquetar y demostrar

1. Congelar una versión candidata y guardar URL/commit.
2. Revisar créditos, textos en español, títulos y metadatos; retirar los de World Effects.
3. Preparar QR/enlace y comprobarlo desde otro dispositivo.
4. Grabar la experiencia publicada, no una versión distinta del editor.
5. Ensayar pitch de cinco minutos y preguntas sobre decisiones técnicas.
6. Entregar documentación, repositorio, registro de pruebas y los archivos exigidos por el docente.
7. Conservar modelos fuente y exportaciones finales para continuidad del proyecto.

## 15. Lista final de tareas por completar

- [ ] Entorno, rama personal, dependencias y compilación inicial comprobados.
- [ ] Documentos y referencias antiguas alineados con el colibrí.
- [ ] Fuente UAO, nombres científicos, imágenes y cantos verificados.
- [ ] JSON completo y banco de quince preguntas revisado.
- [ ] Cinco GLB y sus clips comprobados en Studio.
- [ ] Campus conservado como recurso opcional, fuera de la colocación principal.
- [ ] Raíz del punto elegido y una sola ave activa relacionada con su ID.
- [ ] Inicio, permisos, audio y carga con mensajes adecuados.
- [ ] Detección sin spawn automático, toque de colocación, cambio de especie y reubicación funcionales.
- [ ] Gestor de estados y limpieza por modo implementados.
- [ ] Cinco fichas, canto, selección e inspección reversible.
- [ ] Reto de avistamiento con éxito, error, pista y cancelación.
- [ ] Quiz de canto, información, feedback y resultados.
- [ ] Puntaje único por pregunta y repetición desde cero.
- [ ] Reinicio sin entidades, eventos o sonidos residuales.
- [ ] Placeholders retirados o limitaciones expresamente registradas.
- [ ] Rendimiento y clipping revisados con la escena completa.
- [ ] Licencias, autorías y avisos accesibles.
- [ ] Build y Pages exitosos, sin recursos esenciales ausentes.
- [ ] Matriz de pruebas físicas con evidencia y dispositivos.
- [ ] Pitch, QR, video y versión de respaldo preparados.

## 16. Fuentes y límites de esta guía

Se consultaron los archivos reales del repositorio, documentación oficial de GltfModel, Audio, publicación y licencia de 8th Wall, y los resultados de exportación del campus generado en esta conversación. Las especificaciones de módulos y tareas nuevas son propuestas de implementación. Los ejemplos de código documentan APIs consultadas, pero necesitan integrarse y probarse con el motor instalado. No se afirma haber verificado hit-testing, eventos de fin de clip, gestos o tracking en móviles cuando todavía no se han ejecutado esas pruebas.

## Avance implementado: piloto de colibrí (12 de octubre de 2026)

Se implementó la colocación directa de una sola ave, con estado independiente del motor, ficha de referencia desde JSON, seis clips reales, reubicación con cancelación y reinicio. Los recursos anteriores y las modificaciones previas de la escena se conservan. Ver [AVANCE_01.md](AVANCE_01.md) para archivos, comprobaciones y pruebas físicas pendientes.

El usuario define al GLB piloto como representación del Colibrí Colirufo (Amazilia tzacatl). src/data/aves.json conserva ID colibri, modelo, clips e inspección; añade familia, ficha única de página 17, imagen assets/img/colirufo.jpg y crédito independiente. La UI elimina referencias/candidatas; el archivo documentacion/REFERENCIAS_COLIBRIES.json conserva esos datos sin incluirlos en la ficha activa. Canto y créditos/licencias siguen pendientes. Las especies del catálogo vigente no se marcan como terminadas.

Se conservan los nombres reales de los clips aportados; no se afirma que existan clips sing, happy o no. El campus queda opcional. La vista 3D de escritorio sirve para inspección y no certifica tracking en Android/iPhone. El control de inicio habilita la colocación; el runtime administra los permisos de cámara.


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
