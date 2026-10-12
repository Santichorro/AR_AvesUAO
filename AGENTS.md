# AGENTS.md — AR_AvesUAO

Este archivo describe el proyecto y las reglas que deben seguir las personas (y los
agentes de IA) que trabajen en él. Léelo antes de tocar nada.

## Objetivo

**AR_AvesUAO** es una experiencia **WebAR** hecha con **8th Wall Studio** (app de
escritorio). Es una **guía de avistamiento de 5 aves del campus UAO**:

1. Pellare(s)
2. Paloma
3. Azulejo
4. Pechirrojo
5. Loro

La experiencia muestra las aves ancladas al mundo real (World Effects / SLAM) y
termina con un **quiz** de reconocimiento. El proyecto es para **4 personas**.

## Estructura real del proyecto

> ⚠️ **NO reestructures el proyecto de Studio.** La carpeta `src/` y el archivo
> `.expanse.json` son gestionados por la app de 8th Wall Studio. Mover o renombrar
> archivos a mano puede romper la escena. Trabaja *dentro* de la estructura existente.

```
AR_AvesUAO/
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI: compila y publica en GitHub Pages (rama main)
├── config/                    # Configuración del build (webpack). No tocar sin motivo.
│   ├── webpack.config.js      # Entrada, salida (dist/), loaders y plugins
│   ├── entry-plugin.js        # Genera `entry.js` virtual desde .expanse.json + src/*.ts
│   ├── dev8-plugin.js         # Inyecta dev8.js en modo desarrollo
│   ├── asset-loader.js        # Exporta rutas de assets como strings
│   ├── LICENSE                # Licencia de Niantic Spatial, Inc. (MIT)
│   └── types/                 # Declaraciones .d.ts
├── src/                       # Código y contenido de la experiencia
│   ├── .expanse.json          # ESCENA de Studio (espacios, entidades y componentes)
│   ├── index.html             # HTML raíz; carga el runtime y bundle.js
│   ├── app.js                 # Entrada de la app (Landing Page)
│   ├── logo.ts                # Componente ECS `logo`
│   ├── tap-to-place.ts        # Componente ECS `tap-to-place`
│   ├── reset-button.ts        # Componente ECS `reset-button`
│   ├── hide-on-ready.ts       # Componente ECS `hide-on-ready`
│   └── assets/                # Assets binarios (GLB, imágenes) — versionados con Git LFS
├── node_modules/              # Dependencias (IGNORADO en git)
├── package.json               # Scripts `build` y `serve`
├── package-lock.json
├── tsconfig.json
├── .gitattributes             # Git LFS para binarios
├── .gitignore
├── LICENSE                    # Licencia de 8th Wall, Inc. (MIT)
└── README.md
```

### Cómo funciona (resumen)

- **ECS (Entity Component System).** El mundo contiene espacios (`spaces`); cada
  espacio contiene entidades con componentes. La escena se define en
  `src/.expanse.json`.
- **Componentes propios** = archivos `.ts` en `src/`. `config/entry-plugin.js`
  importa automáticamente todo `.ts`/`.js` de `src/` (excepto `src/assets/` y
  `src/.dependencies/`), así que **basta con crear el `.ts` en `src/`** para que se
  incluya en el bundle (y para que Studio lo pueda usar).
- **Modelos 3D.** Se referencian desde `.expanse.json` (campo `gltfModel.src`) y
  viven en `src/assets/`.
- **Assets.** Cualquier archivo dentro de `src/assets/` se copia tal cual al build.
  Los binarios se guardan con **Git LFS** (ver `.gitattributes`).

## Reglas

### 1. Modelos GLB (assets)

- Los modelos deben ser **GLB** e incluir **exactamente estos clips de animación**,
  con estos nombres (en minúscula):
  - `idle`
  - `fly`
  - `land`
  - `sing`
  - `happy`
  - `no`
- Guarda los `.glb` en `src/assets/` y referéncialos desde `.expanse.json`.
- Optimiza el tamaño (Draco/compresión) antes de subirlos; recuerda que Git LFS
  guarda el binario real.

### 2. Datos de las aves (JSON)

Los datos de las aves viven en **un único JSON** (convención sugerida:
`src/data/aves.json`). Cada ave debe tener:

```json
{
  "id": "azulejo",
  "nombre": "Azulejo",
  "nombreCientifico": "Thraupis episcopus",
  "descripcion": "Texto con los datos del ave que alimentan el quiz...",
  "audioCanto": "assets/audio/azulejo.mp3",
  "preguntas": [
    {
      "enunciado": "¿De qué color es principalmente el azulejo?",
      "opciones": ["Azul", "Rojo", "Verde"],
      "indiceCorrecto": 0
    }
  ]
}
```

Reglas del esquema:

- `id`: identificador único y estable (se usa para emparejar con el modelo/entidad).
- `nombre`: nombre común.
- `nombreCientifico`: nombre científico.
- `descripcion`: información del ave (fuente de las preguntas).
- `audioCanto`: ruta relativa al audio del canto.
- `preguntas`: lista con `enunciado`, **3 opciones** (`opciones`) e `indiceCorrecto`
  (índice 0-2 de la opción correcta).

Cada vez que se agregue/modifique información de un ave, actualiza también sus
preguntas en este JSON.

### 3. Quiz AR

El quiz tiene **dos modos** y **puntaje al final**:

- **(a) Identificar el canto.** Se reproduce el `audioCanto` de un ave (aleatoria) y
  el usuario debe **tocar el ave correcta entre las 5** presentes en escena.
- **(b) Preguntas de opción múltiple.** Se toman de la información de cada ave
  (`preguntas` del JSON): 1 enunciado + 3 opciones.
- Al terminar se muestra el **puntaje final** (aciertos sobre el total).

### 4. Licencia y copyright (obligatorio antes de usar el SLAM/motor)

- El motor/SLAM de 8th Wall y el runtime están sujetos a derechos de autor de
  **Niantic Spatial, Inc.** Conserva y respeta los avisos:
  - `LICENSE` (Copyright 2025 8th Wall, Inc.)
  - `config/LICENSE` (Copyright 2025 Niantic Spatial, Inc.)
  - El aviso dentro de `external/runtime/LICENSE` que se copia al build.
- **Antes de tocar el SLAM, el motor (`@8thwall/ecs`, `runtime.js`) o los binarios
  de terceros (Draco, fuentes, etc.), revisa la licencia de Niantic Spatial** y no
  elimines ni ocultes los avisos de copyright.
- No se puede usar código/asset propietario por fuera de lo que permite la licencia.

### 5. Build y despliegue

- Compilar: `npm run build` → genera `dist/`.
- Servir en local: `npm run serve` (modo desarrollo).
- El despliegue a GitHub Pages es automático al hacer push a `main`
  (`.github/workflows/deploy.yml`). Detalles en el `README.md`.

### 6. Flujo de trabajo en git

- Rama principal: `main` (solo lo que se publica).
- Ramas de trabajo: `tello`, `sam`, `meli`, `juandate`.
- Trabaja en tu rama y abre un Pull Request hacia `main`.
- No subas `node_modules/` ni `dist/`.
- Si clonas con Git LFS: instala `git-lfs` primero (`git lfs install`) para que se
  descarguen los modelos e imágenes reales.
