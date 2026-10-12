# Planeación — AR_AvesUAO

Parcial 2 · Fundamentos de Realidad Virtual · Universidad Autónoma de Occidente

## 1. Resumen
**AR_AvesUAO** es una aplicación web de realidad aumentada que funciona como guía de avistamiento e información de las aves del campus UAO. El usuario apunta el celular al suelo, la app detecta la superficie y despliega una "Estación de avistamiento" donde llegan volando 5 aves. La experiencia AR es el corazón de la app: la información, los sonidos y el quiz ocurren dentro de la escena, no en pantallas aparte.

## 2. Problema y objetivos
**Problema.** La UAO y sus alrededores albergan una gran variedad de aves que forman parte de la fauna de la ciudad, pero la comunidad no cuenta con una forma atractiva de conocerlas.

**Objetivo general.** Ofrecer una experiencia AR informativa e inmersiva que despierte el interés por las aves del campus.

**Objetivos específicos.**
- Presentar información puntual de cada ave (imágenes, sonidos, textos) alimentada con la base de datos de aves de la UAO.
- Dar una experiencia AR que sea el centro de la app y no un añadido.
- Validar el aprendizaje del usuario mediante un quiz interactivo en AR.
- Funcionar en navegadores de Android e iOS sin instalar nada.

## 3. Alcance
**Incluye**
- 5 aves: Pellares, Paloma, Azulejo, Pechirrojo y Loro, con modelos 3D propios y animados.
- Detección de suelo y colocación del hábitat para iniciar la interacción.
- 6 interacciones AR (sección 5).
- Quiz de identificación de cantos y de preguntas sobre la información de cada ave.
- Audio: cantos y efectos acordes a cada acción.
- Publicación como página web con HTTPS.

**No incluye (por ahora)**
- APK o app nativa.
- Más de 5 aves (el diseño debe permitir agregarlas sin cambiar la lógica).
- Cuentas de usuario, base de datos en línea o ranking en servidor.

## 4. Flujo de la experiencia
1. **Inicio:** pantalla de bienvenida con botón "Comenzar" que solicita permiso de cámara.
2. **Escaneo:** el usuario mueve el celular; una retícula aparece sobre el suelo detectado.
3. **Colocación:** al tocar, se despliega el hábitat (rama/árbol/bebedero del campus).
4. **Llegada:** las 5 aves llegan volando y aterrizan en el hábitat.
5. **Exploración:** tocar un ave muestra su ficha y reproduce su canto.
6. **Avistamiento:** un ave sale volando y hay que ubicarla guiándose por el audio.
7. **Quiz:** ronda de cantos y ronda de preguntas.
8. **Resultados:** puntaje y opción de repetir.

## 5. Interacciones AR
El requisito mínimo es 5. El proyecto plantea 6.

| # | Interacción | Qué ocurre | Sonido / animación |
|---|-------------|------------|--------------------|
| 1 | Detección de suelo y colocación | Retícula sobre la superficie; al tocar aparece el hábitat | Sonido de colocación |
| 2 | Llegada de las aves | Las aves vuelan y aterrizan en el hábitat | `fly` → `land` → `idle`, sonido de alas |
| 3 | Tocar un ave | Aparece la ficha de información y suena su canto | `sing`, canto del ave |
| 4 | Inspección | Rotar y escalar el ave con gestos; caminar alrededor | `idle` |
| 5 | Modo avistamiento | Un ave sale volando; se la ubica por el audio girando el celular y se toca para "registrarla" | `fly`, audio direccional, registro en la ficha |
| 6 | Quiz AR | Rondas de canto y de preguntas dentro de la escena | `happy` si acierta, `no` si falla |

## 6. Quiz
El quiz valida que el usuario aprendió sobre las aves y el entorno UAO.

**Ronda A — Identificar el canto.** Suena el canto de un ave, las 5 aves se ubican en arco y el usuario toca la que cree que canta. Acierto: el ave celebra (`happy`) y suma punto. Error: el ave niega (`no`) y se muestra la respuesta correcta con su canto.

**Ronda B — Preguntas de la información.** Preguntas de opción múltiple tomadas directamente de la información cargada de cada ave. Se muestran sobre la escena y las opciones se responden tocando.

**Resultados.** Puntaje final, retroalimentación y botón para repetir. Las preguntas se leen del archivo de datos de aves, de modo que agregar contenido no requiere cambiar la lógica.

## 7. Aves
La información de cada ave proviene de la base de datos de aves de la UAO; no se redacta de memoria.

| ID | Nombre común | Modelo 3D | Canto | Ficha y preguntas |
|----|--------------|-----------|-------|-------------------|
| `pellares` | Pellares | En desarrollo (equipo) | Pendiente | Desde base UAO |
| `paloma` | Paloma | En desarrollo (equipo) | Pendiente | Desde base UAO |
| `azulejo` | Azulejo | En desarrollo (equipo) | Pendiente | Desde base UAO |
| `pechirrojo` | Pechirrojo | En desarrollo (equipo) | Pendiente | Desde base UAO |
| `loro` | Loro | En desarrollo (equipo) | Pendiente | Desde base UAO |

Animaciones requeridas por ave: `idle`, `fly`, `land`, `sing`, `happy`, `no`.

## 8. Cumplimiento de los requisitos del parcial
| Requisito | Cómo se cumple |
|-----------|----------------|
| Aplicativo RA usable en Android o iOS | Web AR con 8th Wall, probada en ambos sistemas |
| Información puntual desde la base UAO | Archivo de datos de aves alimentado con esa base |
| AR como corazón de la app | Toda la información y el quiz ocurren en la escena AR |
| Animaciones, audios y videos según la interacción | Seis clips por ave, cantos y efectos de sonido |
| Sonidos acordes a las acciones | Efectos para colocar, tocar, acertar y fallar |
| Mínimo 5 interacciones AR | 6 interacciones definidas |
| Quiz en AR | Rondas de canto y de preguntas |
| Entrega: aplicativo funcional en página web | Publicación con HTTPS |
| Pitch de 5 min + 5 min de preguntas | Ver sección 11 |

## 9. Equipo y forma de trabajo
Equipo de 4 personas con una rama de Git por integrante: `tello`, `sam`, `meli` y `juandate`, más `main` como rama integrada. El reparto de tareas y la organización del tiempo se definen internamente. Se trabaja con pull requests hacia `main`; el detalle está en `TECNICO.md`.

## 10. Riesgos
| Riesgo | Mitigación |
|--------|------------|
| La plataforma hospedada de 8th Wall ya no existe; todo se hace con la app local y el motor distribuido | Probar temprano una plantilla en celular y mantener el flujo local |
| La detección de suelo falla en algún dispositivo | Probar en un iPhone y un Android reales lo antes posible; dar mensajes claros al usuario |
| Modelos pesados que cargan lento | Límites de peso y de polígonos (ver `TECNICO.md`) |
| Audio bloqueado en iOS hasta que el usuario toca la pantalla | Iniciar el audio desde el botón "Comenzar" |
| Conflictos de Git entre 4 personas | Una rama por persona, escenas y archivos repartidos, integración por PR |
| Falta de un modelo o audio en la demo | Placeholders para que la app siempre corra |

## 11. Estructura del pitch (5 min + 5 min de preguntas)
1. Problema y propuesta (1 min).
2. Demostración en vivo en celular: suelo, aves, ficha y canto (2 min).
3. Quiz en AR (1 min).
4. Decisiones técnicas y proyección: más de 90 aves en el futuro (1 min).
5. Preguntas del jurado (5 min). Tener un video de respaldo por si falla la cámara o la red.

## 12. Criterios de aceptación
- [ ] Se detecta el suelo y se coloca el hábitat en Android e iPhone.
- [ ] Las 5 aves aparecen, animadas, con su ficha y su canto.
- [ ] Las 6 interacciones funcionan de principio a fin.
- [ ] El quiz de canto y el de información funcionan y muestran puntaje.
- [ ] Hay sonido en cada acción relevante.
- [ ] La app está publicada con HTTPS y abre desde un enlace.
- [ ] Agregar un ave nueva solo requiere un modelo, un audio y un registro en el JSON.
