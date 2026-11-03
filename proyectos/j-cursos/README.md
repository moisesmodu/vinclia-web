# J · Cursos en Udemy (Numi)

Cuatro cursos en vídeo en castellano de España, hechos a partir de Numi Tech (cursos de programación y robótica de
Numimates) y, el tercero, escritos desde cero. Todo el contenido es de Moisés; las piezas 3D de las imágenes son de
Kenney (CC0); la voz es Piper con la voz de castellano de España `es_ES-davefx-medium` (CC0) y el software de montaje es libre. Nada con licencia no comercial.

| | Curso | Base | Clases | Duración | Estado |
|---|---|---|---|---|---|
| c1 | Enseña a programar a tu hijo con Scratch: guía para padres | Tech Robot + Tech Creadores | 32 + promo | 2 h 38 min | listo para subir |
| c2 | Crea robots con micro:bit y Maqueen para niños y profes | Tech Robótica + kit | 38 + promo | 3 h 33 min | listo para subir |
| c3 | Ahorra horas con IA y ChatGPT para autónomos y pymes | nuevo | 37 + promo | ~4 h (guion); 24 min grabados | guion completo; sección 1 (+ clases 20 y 23) grabada |
| c4 | Bienestar digital en familia: pantallas y redes seguras (gratis) | Tech Digital | 8 + promo | 37 min | listo para subir |

## Carpetas

- `cursos/c*.json`: temario (secciones, clases y sesiones de Numi Tech de las que sale cada una).
- `guiones/c*/c*-NN.json`: guion de cada clase (escenas con texto en pantalla y narración), `quiz-N.json` (cuestionario
  de la sección N), `c*-promo.json` (vídeo promocional) y `c3/plantillas/*.md` (descargables del curso 3).
  Formato y reglas: `guiones/FORMATO.md`.
- `udemy/`: fichas (título, subtítulo, objetivos, requisitos, público, palabras clave), descripciones y
  `c*-CURRICULO.md`, la estructura exacta para subir cada curso.
- `pipeline/`: el montaje automático. `marketing/`: vídeos cortos y 20 artículos SEO.
- Vídeos, audio y PDF **no van a git** (`.gitignore`): se generan en `$WORK` y se entregan en el almacenamiento del
  proyecto (enlace en `PARA-MOISES.md`).

## Cómo se produce un curso (todo en local, 0 €)

Requisitos: Node 22 con Playwright (Chromium), Python 3 con `piper-tts`, `soundfile` y `numpy`, ffmpeg, la voz
`es_ES-davefx-medium` (de `k2-fsa/sherpa-onnx`, release `tts-models`, `vits-piper-es_ES-davefx-medium.tar.bz2`) en
`$PIPER_MODEL`, y un
clon de `moisesmodu/numimates` servido en `http://127.0.0.1:5190` (`python3 -m http.server 5190`): las capturas y las
demostraciones salen de su `presenta.html` y los imprimibles de `imprimeix.html`.

```bash
python3 pipeline/check_guiones.py guiones/c1      # formato y longitudes
node    pipeline/render.mjs c1                    # diapositivas, capturas y demos del simulador → $WORK/out/c1
python3 pipeline/voz.py c1                        # narración Piper (davefx) por frase + tiempos → $WORK/out/c1
python3 pipeline/montaje.py c1                    # MP4 1080p + SRT/VTT → $WORK/entrega/c1
node    pipeline/recursos.mjs c1                  # fichas en PDF (o plantillas en el c3) → $WORK/entrega/c1/recursos
python3 pipeline/udemy.py c1                      # udemy/c1-CURRICULO.md con duraciones
python3 pipeline/cortos.py                        # vídeos cortos verticales → $WORK/entrega/cortos
python3 pipeline/seo.py                           # 20 artículos → marketing/seo
```
Cada paso se puede repetir con una lista de clases (`render.mjs c1 c1-07`) y no rehace lo que ya existe (salvo
`FORCE=1` en la voz). Con 4 núcleos: la voz va a ~30× tiempo real y ~2-3 min por demo del simulador.

## Decisiones tomadas (y por qué)

- **Voz: Piper con `es_ES-davefx-medium` en todas las clases** (castellano de España, licencia CC0, local y gratuita).
  La primera versión usó Kokoro (`ef_dora`/`em_alex`): pronunciaba como en España, pero con entonación latina. El
  31/10/2026 Moisés eligió davefx entre cinco muestras (Kokoro, davefx, las dos voces de sharvard y ElevenLabs «David»)
  y se volvió a narrar y montar todo. `MOTOR=kokoro` recupera la voz anterior. Narrar los cursos 1 y 2 con ElevenLabs
  costaría unos 390.000 créditos (1 crédito por carácter, medido con la muestra: 207 caracteres, 207 créditos), un plan
  Pro de un mes: supera el tope de 20 €/mes y solo se hace si Moisés lo aprueba. La pronunciación de siglas y
  anglicismos está en `PRON` (`voz.py`), revisada con los fonemas de espeak. Gasto de voz al final del informe.
- **Diapositivas** con el lenguaje visual de `presenta.html` (Lexend, fondo punteado, tarjetas, color por curso: azul
  Robot, coral Robótica, violeta IA, verde Digital) y **capturas reales de las presentaciones de Numi Tech en
  castellano** (con Bit y el Maqueen en 3D). Los puntos aparecen mientras se explican.
- **Demostraciones del simulador grabadas con Playwright** desde `presenta.html` con reloj virtual (el 3D por software
  va a ~1 fotograma por segundo; sin reloj virtual el robot se movería a cámara lenta), 12 fps escalados a 1080p.
- **Traducción:** Numi Tech ya es bilingüe (`"català|castellano"`); se extrae la parte castellana de sesiones, guías,
  imprimibles y solucionario. Revisión por muestreo: sin restos de catalán en los 115 guiones (búsqueda de 17 palabras
  catalanas frecuentes) y lectura completa de una clase de cada curso.
- **El curso 1 sirve sin comprar nada:** cada semana tiene actividades sin pantalla, imprimibles y Scratch (gratis); Numi
  Tech es una opción (primera sesión gratis sin cuenta). El curso 2 se puede seguir sin robot con MakeCode.
- **Título** con la fórmula del líder (resultado + herramienta + «para» + público), ≤ 60 caracteres; imagen del curso
  sin texto (norma de Udemy) con los renders 3D de Numi; curso 4 gratuito como imán.
- **Subtítulos exactos**: cada frase se sintetiza aparte, así que los tiempos del SRT/VTT son los del audio.
- **Udemy no tiene API para crear cursos**: la subida es manual con el cargador masivo y el `CURRICULO.md` de cada curso.
  Para preguntas y valoraciones sí hay API de instructor (la usa la tarea programada).
