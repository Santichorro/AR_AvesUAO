# AGENTS.md — AR_AvesUAO

Guía para el agente de código (OpenCode). Léela completa antes de tocar nada.

## Qué es este proyecto
App web de realidad aumentada (AR de superficie) que sirve como guía de avistamiento de 5 aves del campus de la Universidad Autónoma de Occidente (UAO), con un quiz dentro de la escena AR. Es el Parcial 2 de Fundamentos de Realidad Virtual. Trabaja un equipo de 4 personas, cada una en su propia rama.

Documentos del proyecto (léelos después de este):
- `documentacion/PLANEACION.md`: qué se construye y por qué.
- `documentacion/TECNICO.md`: cómo se construye (estados, datos, assets, flujo Git, despliegue).

## Tecnología
- **8th Wall Studio** (app de escritorio, modo local/offline). El proyecto es un proyecto de Studio con la plantilla *World Effects*.
- Destino: **web** (Android e iOS desde el navegador). No se hace APK ni app nativa.
- Todo lo que se use debe ser **gratuito**. No agregues servicios de pago ni dependencias que requieran cuenta o tarjeta.

## Acceso a la documentación de 8th Wall
La plataforma hospedada de 8th Wall ya no existe; no hay cuenta, API key ni servidor al cual conectarse. Tu fuente de verdad son los docs públicos y el código abierto. Consúltalos con webfetch cuando necesites un dato, en lugar de recordarlo de memoria:

- Studio: https://8thwall.org/docs/studio
- Instalación y setup: https://8thwall.org/docs/getting-started/installation
- Engine (motor): https://8thwall.org/docs/engine
- API Reference: https://8thwall.org/docs/api
- Migración y licencia: https://8thwall.org/docs/migration/faq
- Open source y cumplimiento de licencia: https://8thwall.org/docs/open-source
- Código fuente (incluye `packages/ecs`, el motor de Studio, y `examples/`): https://github.com/8thwall/8thwall

## Reglas de trabajo
1. **Explora antes de editar.** Lista la estructura real del proyecto de Studio y resúmela. No asumas nombres de archivos, componentes ni APIs: verifícalos en el proyecto o en los docs. Si algo no está documentado, dilo en lugar de inventarlo.
2. **No reestructures lo que Studio genera.** Respeta su organización de carpetas y archivos de escena. Agrega código y assets en los lugares que Studio espera.
3. **Cambios pequeños y verificables.** Un commit por cambio lógico, con mensaje claro en español.
4. **Ramas.** Las ramas son `main`, `tello`, `sam`, `meli` y `juandate`. Trabaja solo en la rama activa. Nunca hagas push directo a `main`; se integra por pull request.
5. **No borres ni sobrescribas** modelos, audios o escenas de otros integrantes. Si hay conflicto, detente y avisa.
6. **Datos separados del código.** Textos, preguntas y rutas de audio van en el JSON de aves (ver `documentacion/TECNICO.md`), no escritos a mano en la lógica.
7. **Placeholders, no bloqueos.** Si falta un modelo GLB o un audio, usa un placeholder para que la app siga corriendo y deja un `TODO` visible.
8. **Entorno del usuario:** Windows con PowerShell. Da comandos compatibles con PowerShell.
9. **Ante duda de alcance o decisiones de diseño, pregunta** antes de implementar.

## Licencia del motor (obligatorio)
El motor con SLAM (seguimiento de superficie) se distribuye como binario cerrado de Niantic Spatial. No lo modifiques, descompiles ni redistribuyas alterado. Debe conservarse el aviso de copyright "Copyright © 2026 Niantic Spatial, Inc." en el archivo del motor, visible en el build publicado. Si el build no lo conserva, agrega el comentario de atribución indicado en https://8thwall.org/docs/open-source dentro del `index.html` publicado.

## Convenciones del proyecto
- Idioma de la interfaz y de los textos: español.
- IDs de aves en minúscula sin tildes: `colibri`, `paloma`, `azulejo`, `pechirrojo`, `loro`.
- Modelos propios: clips estándar `idle`, `fly`, `land`, `sing`, `happy`, `no`. Modelos aportados: respetar sus nombres reales y usar el mapeo del JSON; no atribuirles clips inexistentes.
- Modelos: `assets/models/<id>.glb`. Audios: `assets/audio/<id>_canto.mp3` y `assets/audio/sfx_*.mp3`.
- Si la estructura de Studio exige otra ruta, adáptate a ella y documenta el cambio en `documentacion/TECNICO.md`.

## Qué reportar al terminar cada tarea
Resume qué cambiaste, qué archivos tocaste, cómo probarlo y qué quedó pendiente o sin verificar.
