# AR_AvesUAO

Guía de avistamiento en **WebAR** de **5 aves del campus UAO** — *Pellare(s),
Paloma, Azulejo, Pechirrojo y Loro* — construida con **8th Wall Studio**, con un
**quiz** de reconocimiento al final.

> Proyecto de 4 personas. La app de escritorio de 8th Wall Studio abre esta carpeta
> directamente. **No reestructures** `src/` ni `.expanse.json`.

## Requisitos

- [8th Wall Studio Desktop](https://8thwall.org/downloads) (para editar la escena).
- [Node.js](https://nodejs.org/) 20 o superior y `npm`.
- [Git LFS](https://git-lfs.com/) (`git lfs install`) — los modelos `.glb` y las
  imágenes se guardan con Git LFS.
- Un editor de código (VSCode / Cursor) opcional.

## Estructura

```
AR_AvesUAO/
├── .github/workflows/deploy.yml   # CI: build + deploy a GitHub Pages
├── config/                        # Configuración de webpack (build)
├── src/                           # Escena (.expanse.json), componentes (.ts) y assets
│   ├── .expanse.json              # Escena de Studio
│   ├── app.js, *.ts               # Entrada y componentes ECS
│   └── assets/                    # Modelos GLB, audio e imágenes (Git LFS)
├── package.json                   # Scripts build / serve
└── README.md
```

Para el detalle de la arquitectura y las reglas del proyecto, ver
[`AGENTS.md`](./AGENTS.md).

## Desarrollo local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Opción A — trabajar en **Studio**: abre la app de 8th Wall Studio y abre esta
   carpeta. Usa *Preview / Simulator* para probar en el navegador.

3. Opción B — trabajar con **código + servidor de desarrollo**:

   ```bash
   npm run serve
   ```

## Build de producción

El proyecto **se puede compilar por línea de comandos** (no hace falta usar la app
de escritorio para generar el bundle). El comando y la carpeta de salida están
definidos en `package.json` y `config/webpack.config.js`:

```bash
npm run build
```

- **Comando:** `npm run build`
  (ejecuta `webpack --config config/webpack.config.js`).
- **Carpeta de salida:** **`dist/`**
  (definida como `output.path` en `config/webpack.config.js`).

El build genera, entre otros: `dist/index.html`, `dist/bundle.js`, `dist/assets/`
(modelos e imágenes) y `dist/external/runtime/` (copiado de `node_modules/@8thwall/ecs`).

### Probar el build en local

WebAR necesita **HTTPS** o `localhost` para acceder a la cámara. Para servir el
build localmente:

```bash
npx http-server dist
```

Además, la app de Studio permite exportar el build manualmente: **Publish → HTML5 →
Build**, y descargar el `.zip`. Ese `.zip` contiene lo mismo que `dist/`.

## Despliegue (GitHub Pages)

El repositorio incluye un workflow de **GitHub Actions**
(`.github/workflows/deploy.yml`) que, en cada push a la rama `main` (o al
ejecutarlo manualmente con *workflow_dispatch*):

1. Hace checkout (con Git LFS).
2. Ejecuta `npm ci` y `npm run build`.
3. Sube `dist/` como artefacto de Pages.
4. Publica en **GitHub Pages**.

### Activar GitHub Pages en el repositorio

1. Entra a **GitHub → repositorio `AR_AvesUAO`**.
2. Ve a **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. (Opcional) Ajusta el dominio o el entorno. Guarda.
5. Haz un push a `main` o ejecuta el workflow desde **Actions → Deploy to GitHub
   Pages → Run workflow**.

Cuando termine, el sitio queda en
`https://<usuario>.github.io/AR_AvesUAO/`.

> Nota: por ahora el proyecto usa `publicPath: '/'` en webpack. En GitHub Pages el
> sitio se sirve bajo subcarpeta (`/<repo>/`). Si los assets aparecen con 404 en
> Pages, ajusta `output.publicPath` a `/<nombre-del-repo>/` o usa una acción que
> reescriba las rutas. En local (`http-server`) la raíz `/` funciona bien.

## Trabajo en equipo (ramas)

- `main`: rama publicada (protegida conceptualmente; solo merges revisados).
- `tello`, `sam`, `meli`, `juandate`: ramas de trabajo individuales.

Clonar y empezar a trabajar:

```bash
git lfs install                 # una vez por máquina
git clone https://github.com/<usuario>/AR_AvesUAO.git
cd AR_AvesUAO
git checkout tello              # o sam / meli / juandate
npm install
```

Crear un Pull Request hacia `main` cuando el trabajo esté listo.

## Licencia y créditos

- Código del proyecto Studio: ver [`LICENSE`](./LICENSE) (8th Wall, Inc. — MIT).
- Configuración de build y runtime: ver [`config/LICENSE`](./config/LICENSE)
  (**Niantic Spatial, Inc.** — MIT).
- El motor/SLAM de 8th Wall se carga desde su CDN y mantiene su aviso de copyright.
  Respeta la licencia de Niantic Spatial antes de modificar el motor.
