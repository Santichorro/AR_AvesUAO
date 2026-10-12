# Documento técnico — AR_AvesUAO

Complementa a `PLANEACION.md`. Lo que aquí figura como "sugerido" debe adaptarse a la estructura real del proyecto de Studio; lo que no esté verificado se marca como tal.

## 1. Stack
| Capa | Elección |
|------|----------|
| Editor y motor | 8th Wall Studio (app de escritorio, modo local) con plantilla *World Effects* |
| Seguimiento de superficie | Motor de 8th Wall con SLAM (binario distribuido, licencia de uso limitada) |
| Plataforma destino | Navegador web en Android e iOS (HTTPS) |
| Modelos 3D | GLB propios con animaciones por clips |
| Control de versiones | Git + GitHub (repo `AR_AvesUAO`) |
| Agente de código | OpenCode |
| Hosting | Gratuito con HTTPS (GitHub Pages, Netlify o Cloudflare Pages) |

La plataforma hospedada de 8th Wall dejó de existir el 28 de febrero de 2026. No hay API key ni cuenta que configurar: el proyecto se edita y compila localmente.

Fuentes oficiales para consultar (el agente debe leerlas con webfetch cuando dude):
- https://8thwall.org/docs/studio
- https://8thwall.org/docs/engine
- https://8thwall.org/docs/api
- https://8thwall.org/docs/open-source
- https://github.com/8thwall/8thwall (código y `examples/`)

## 2. Máquina de estados de la app
```
INTRO -> ESCANEO -> COLOCADO -> LLEGADA -> EXPLORAR
                                              |-> AVISTAMIENTO -> EXPLORAR
                                              |-> QUIZ_CANTO -> QUIZ_INFO -> RESULTADOS
RESULTADOS -> EXPLORAR  (repetir)
```
- **INTRO:** pantalla de inicio, permiso de cámara y desbloqueo de audio.
- **ESCANEO:** retícula sobre el suelo detectado; mensaje guía mientras no haya superficie.
- **COLOCADO:** se instancia el hábitat en el punto tocado.
- **LLEGADA:** las aves entran con `fly`, aterrizan con `land` y quedan en `idle`.
- **EXPLORAR:** tocar un ave abre su ficha y dispara `sing`; gestos para rotar y escalar.
- **AVISTAMIENTO:** un ave vuela por el espacio; el audio guía al usuario hasta tocarla.
- **QUIZ_CANTO / QUIZ_INFO / RESULTADOS:** ver sección 4.

Una sola fuente de estado (un gestor de estado) controla qué UI y qué interacciones están activas, para que no se mezclen entre sí.

## 3. Datos de aves
Un único archivo (sugerido: `data/aves.json`) alimenta fichas, quiz y audio. Los textos salen de la base de datos de aves de la UAO; no se inventan.

```json
{
  "aves": [
    {
      "id": "paloma",
      "nombre": "Paloma",
      "nombreCientifico": "<desde base UAO>",
      "descripcion": "<desde base UAO>",
      "datos": [
        { "etiqueta": "Alimentación", "valor": "<desde base UAO>" },
        { "etiqueta": "Dónde se ve en el campus", "valor": "<desde base UAO>" }
      ],
      "modelo": "assets/models/paloma.glb",
      "audioCanto": "assets/audio/paloma_canto.mp3",
      "imagen": "assets/img/paloma.jpg",
      "escalaExhibicion": 1.0,
      "preguntas": [
        {
          "enunciado": "<pregunta tomada de la información del ave>",
          "opciones": ["<A>", "<B>", "<C>"],
          "correcta": 0
        }
      ]
    }
  ]
}
```
Reglas:
- `id` en minúscula sin tildes y único.
- `correcta` es el índice (0, 1 o 2) dentro de `opciones`.
- `escalaExhibicion` permite mostrar aves reales muy pequeñas a un tamaño visible sin tocar el modelo.
- Agregar un ave = un GLB + un MP3 + un registro en este archivo. La lógica no cambia.

## 4. Quiz
**Ronda de canto (QUIZ_CANTO).**
1. Elegir un ave al azar (sin repetir en la ronda) y reproducir su `audioCanto`.
2. Ubicar las 5 aves en arco frente al usuario en estado `idle`.
3. Al tocar un ave: si coincide con la elegida, `happy` + sonido de acierto + punto; si no, `no` + sonido de error y se revela la correcta reproduciendo su canto.

**Ronda de información (QUIZ_INFO).**
1. Tomar preguntas de los arreglos `preguntas` de las aves, mezcladas.
2. Mostrar el enunciado y las opciones en un panel sobre la escena; las opciones se responden tocando.
3. Retroalimentación inmediata y acumulación de puntaje.

**RESULTADOS:** puntaje total, desglose por ronda y botón para repetir.

## 5. Especificación de assets
### Modelos (GLB)
- Origen en los pies del ave, frente hacia +Z, 1 unidad = 1 metro.
- Clips nombrados exactamente: `idle`, `fly`, `land`, `sing`, `happy`, `no`.
- Objetivo de rendimiento (sugerido): menos de 15 000 triángulos y menos de 5 MB por ave, texturas de 1024 px o menos.
- Un archivo por ave: `assets/models/<id>.glb`.

### Audio
- Formato MP3, mono, objetivo de menos de 300 KB por canto.
- Cantos: `assets/audio/<id>_canto.mp3`. Efectos: `assets/audio/sfx_colocar.mp3`, `sfx_alas.mp3`, `sfx_acierto.mp3`, `sfx_error.mp3`, `sfx_tocar.mp3`.
- iOS bloquea el audio hasta que el usuario toca la pantalla: iniciar y "desbloquear" el audio desde el botón "Comenzar".

### Imágenes
- JPG o WebP, ancho máximo de 800 px, una por ave.

## 6. Estructura de carpetas (real, verificada)

Verificado el 2026-10-12 directamente sobre el proyecto de Studio (plantilla *World Effects*). La estructura real difiere de la "sugerida": en Studio **los assets viven bajo `src/assets/`**, no en la raíz. El cambio queda documentado aquí.

```
AR_AvesUAO/
├── .github/workflows/deploy.yml   # CI: build + deploy a GitHub Pages (rama main)
├── config/                        # Configuración del build (webpack). No editar sin motivo.
│   ├── webpack.config.js          # entry, output=dist/, loaders y plugins
│   ├── entry-plugin.js            # genera entry.js virtual desde .expanse.json + src/*.ts
│   ├── dev8-plugin.js             # inyecta dev8.js en modo desarrollo
│   ├── asset-loader.js            # exporta rutas de assets como strings
│   ├── LICENSE                    # Licencia de Niantic Spatial, Inc. (MIT)
│   └── types/                     # Declaraciones .d.ts
├── docs/
│   ├── PLANEACION.md
│   └── TECNICO.md
├── src/                           # Todo lo que Studio administra
│   ├── .expanse.json              # ESCENA: espacios, entidades y componentes
│   ├── index.html                 # HTML raíz (carga el runtime externo + bundle.js)
│   ├── app.js                     # entrada de la app (LandingPage)
│   ├── logo.ts                    # componente ECS `logo`
│   ├── tap-to-place.ts            # componente ECS `tap-to-place`
│   ├── reset-button.ts            # componente ECS `reset-button`
│   ├── hide-on-ready.ts           # componente ECS `hide-on-ready`
│   └── assets/                    # se copia tal cual a dist/assets/ (Git LFS)
│       ├── 8-jewel.glb            # (placeholder de la plantilla)
│       └── preview.jpg
├── AGENTS.md   README.md   LICENSE   tsconfig.json
├── package.json   package-lock.json   .gitignore   .gitattributes
└── (node_modules/, dist/ y lfs/ son generados y están ignorados por git)
```

### 6.1 Dónde va cada cosa (mapeo fuente → build)

| Qué | Ruta en el repo (fuente) | Ruta publicada (`dist/`) | Cómo se usa |
|-----|--------------------------|--------------------------|-------------|
| Modelos GLB de aves | `src/assets/models/<id>.glb` | `assets/models/<id>.glb` | `.expanse.json` (`gltfModel.src`) o `ecs.GltfModel.set(world, eid, { url: 'assets/models/<id>.glb', animationClip: 'idle' })` |
| Cantos y efectos | `src/assets/audio/<id>_canto.mp3`, `src/assets/audio/sfx_*.mp3` | `assets/audio/...` | `ecs.Audio.set(world, eid, { url: 'assets/audio/<id>_canto.mp3', positional: true })` |
| Imágenes de ficha | `src/assets/img/<id>.jpg` | `assets/img/<id>.jpg` | Ficha del ave |
| Datos de aves | `src/data/aves.json` | (empaquetado en `bundle.js`) | `import aves from './data/aves.json'` desde un componente |
| Lógica / componentes | `src/*.ts` | `bundle.js` | `entry-plugin.js` los importa automáticamente |
| Escena | `src/.expanse.json` | (empaquetado en `bundle.js`) | `ecs.application.init(scene)` |

Reglas que se desprenden de la estructura real:

- `config/webpack.config.js` copia `src/assets/` → `dist/assets/` y `node_modules/@8thwall/ecs/dist` → `dist/external/runtime/`. Por eso las rutas de assets en runtime son `assets/...` (sin `src/`).
- `config/entry-plugin.js` importa automáticamente todo `.ts`/`.js` de `src/`, **excepto** `src/assets/` y `src/.dependencies/`. Por eso los datos van en un JSON aparte que un componente importa (no como `.ts`).
- **Alternativa** para no recompilar al cambiar datos: `src/assets/data/aves.json` (se copia a `dist/assets/data/`) leído con `fetch`. La opción por defecto del equipo es `src/data/aves.json`; si se cambia, actualizar esta tabla.
- Los binarios (`*.png`, `*.jpg`, `*.glb` y `src/assets/**`) se versionan con **Git LFS** (ver `.gitattributes`): quien clone debe tener `git-lfs` instalado.

## 7. Interfaz
- Mensajes cortos y claros en cada estado (por ejemplo "Mueve el celular para encontrar el suelo").
- Tamaños de botón pensados para el pulgar; texto legible sobre la cámara.
- Ficha del ave: nombre, imagen, datos y botón para escuchar el canto.
- Pantalla de error amistosa si el dispositivo no soporta AR o se niega el permiso de cámara.

## 8. Compatibilidad y rendimiento
- Probar en al menos un iPhone (Safari) y un Android (Chrome) reales.
- Un solo modelo de ave visible o animándose en cada momento cuando sea posible; cargar los modelos al inicio con indicador de progreso.
- La cámara exige HTTPS: usar siempre el enlace publicado, no `http`.

## 9. Flujo de Git
- Repo: `AR_AvesUAO` en GitHub.
- Ramas: `main` (integrada y publicada) y una por integrante: `tello`, `sam`, `meli`, `juandate`.
- Cada quien trabaja en su rama, con commits pequeños en español.
- Integración a `main` por pull request revisado por otro integrante.
- Repartir escenas y archivos entre personas para reducir conflictos. Los archivos de escena de Studio son difíciles de fusionar a mano: si dos personas necesitan tocar la misma escena, coordinarlo primero.
- No subir archivos temporales ni de compilación (ver `.gitignore`).

## 10. Despliegue web
1. Compilar el proyecto como build web. **Verificado (2026-10-12):** `npm run build` compila con webpack y genera la carpeta **`dist/`** (ver sección 13 y `README.md`). Alternativa sin línea de comandos: *Publish → HTML5 → Build* en la app de Studio.
2. Publicar la carpeta de build en un hosting con HTTPS. Opción por defecto: GitHub Pages desde `main` con un workflow de GitHub Actions (repo público para que sea gratis). Alternativas: Netlify o Cloudflare Pages.
3. Si no se puede compilar por línea de comandos, subir manualmente la carpeta de build exportada y dejar el procedimiento escrito.
4. Publicar una versión temprana (aunque sea la plantilla) y abrirla en celulares reales para detectar problemas de HTTPS y permisos.

## 11. Licencia del motor
- El motor con SLAM es un binario cerrado con licencia de uso limitada. Se puede usar y distribuir sin modificarlo.
- El build publicado debe conservar el aviso "Copyright © 2026 Niantic Spatial, Inc." en el archivo del motor, o llevar el comentario de atribución equivalente en `index.html` (texto exacto en https://8thwall.org/docs/open-source).
- No modificar, descompilar ni redistribuir alterado el motor.
- Funciones que no están en el binario distribuido: VPS, Maps y Hand Tracking. Este proyecto no las usa.

## 12. Lista de pruebas
- [ ] La cámara se activa tras el permiso y la retícula sigue el suelo.
- [ ] El hábitat se coloca al tocar y no se desplaza al mover el celular.
- [ ] Las 5 aves llegan, aterrizan y quedan estables.
- [ ] Cada ave muestra su ficha y reproduce su canto (con audio activo en iOS).
- [ ] Los gestos de rotar y escalar no rompen la escena.
- [ ] El modo avistamiento permite ubicar al ave y registrarla.
- [ ] El quiz de canto y el de información dan puntaje correcto.
- [ ] Repetir el quiz no deja estados sucios.
- [ ] Todo funciona desde el enlace publicado con HTTPS en Android e iPhone.
- [ ] La app corre con placeholders si falta un modelo o audio.

## 13. Pendientes por verificar

Estado de verificación: 2026-10-12.

- [x] **Estructura real del proyecto de Studio con la plantilla *World Effects*.** Verificada; documentada en la sección 6.
- [x] **Cómo se generan y publican builds web desde Studio en modo local.** Verificado: `npm run build` (webpack, en `config/webpack.config.js`) genera la carpeta **`dist/`** y compila correctamente en Windows. La app también puede exportar con *Publish → HTML5 → Build* y descargar un `.zip` (documentado en https://8thwall.org/docs/getting-started/publishing). El despliegue a GitHub Pages quedó automatizado en `.github/workflows/deploy.yml` (disparado por push a `main`).
- [x] **Cómo se reproducen clips de animación por nombre en el sistema de componentes de Studio.** Verificado: el componente `GltfModel` (`gltf-model`) tiene la propiedad `animationClip` (nombre del clip; `*` reproduce todos). Se define en `.expanse.json` (`gltfModel.animationClip`) y se cambia en runtime con `ecs.GltfModel.set(world, eid, { animationClip: 'fly', loop: false })` o `ecs.GltfModel.mutate(world, eid, c => { c.animationClip = 'idle'; return false })`. Fuente: https://8thwall.org/docs/api/studio/ecs/gltf-model. El audio sigue el mismo patrón con `ecs.Audio` (https://8thwall.org/docs/api/studio/ecs/audio).
- [ ] **Soporte del motor de SLAM en el modo local de la app en los dos sistemas operativos móviles.** **Pendiente: requiere prueba en dispositivos reales (iPhone/Safari y Android/Chrome).** Lo verificado hasta ahora: el motor/SLAM se carga desde el CDN (`@8thwall/engine-binary` con `data-preload-chunks="slam"` en `src/index.html`) y WebAR exige **HTTPS** para la cámara. Falta la prueba física del seguimiento de superficie en ambos sistemas.
