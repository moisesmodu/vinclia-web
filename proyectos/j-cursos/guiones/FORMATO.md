# Formato de los guiones (un archivo JSON por clase)

Ruta: `proyectos/j-cursos/guiones/<curso>/<id>.json` (p. ej. `guiones/c1/c1-07.json`). El montaje
(`pipeline/`) lee estos archivos y genera diapositivas, voz, vídeo, subtítulos y cuestionarios. **Nada más.**

```json
{
  "id": "c1-07",
  "titulo": "Algoritmos en casa: recetas, mochilas y dientes",
  "descripcion": "Una o dos frases para la descripción de la clase en Udemy (qué consigue el alumno).",
  "vistaPrevia": false,
  "recursos": ["imprimible:r1-1"],
  "escenas": [
    { "tipo": "portada", "titulo": "…", "subtitulo": "…", "narracion": "…" },
    { "tipo": "puntos", "titulo": "…", "puntos": ["…", "…"], "narracion": "…" },
    { "tipo": "pasos", "titulo": "…", "pasos": ["…", "…"], "narracion": "…" },
    { "tipo": "frase", "texto": "…", "autor": "opcional", "narracion": "…" },
    { "tipo": "comparar", "titulo": "…", "mal": "…", "bien": "…", "narracion": "…" },
    { "tipo": "tabla", "titulo": "…", "columnas": ["…", "…"], "filas": [["…", "…"]], "narracion": "…" },
    { "tipo": "chat", "titulo": "…", "usuario": "instrucción que escribe el alumno", "ia": "respuesta de ejemplo de la IA", "narracion": "…" },
    { "tipo": "captura", "fuente": "presenta:r1-1:4", "narracion": "…" },
    { "tipo": "demo", "fuente": "presenta:k3-2:5", "narracion": "…" },
    { "tipo": "resumen", "titulo": "…", "puntos": ["…"], "narracion": "…" }
  ]
}
```

## Reglas
- **Duración:** la suma de `narracion` de la clase, entre **800 y 1.150 palabras** (5 a 8 minutos a ~160 palabras/min).
  Las clases de bienvenida y la clase extra pueden ser más cortas (500-800). Entre 7 y 13 escenas por clase; cada
  `narracion` entre 50 y 200 palabras. Empieza siempre por `portada` y termina por `resumen`.
- **Texto en pantalla corto:** `titulo` ≤ 60 caracteres; `puntos`/`pasos` de 2 a 6 elementos de ≤ 75 caracteres;
  `frase` ≤ 140; `comparar` ≤ 110 por lado; tabla ≤ 5 filas × 3 columnas, celdas ≤ 40. La pantalla resume, la voz explica.
- **Narración para leer en voz alta por una voz sintética (Kokoro):** castellano de España, frases de menos de 30
  palabras, sin markdown, sin emojis, sin paréntesis largos, sin símbolos (escribe «menor que», «por ciento», «euros»,
  «grados», «centímetros»), sin URL completas (di «numimates punto com» o «busca Scratch en Google»). Números pequeños en
  cifras están bien; los años, en cifras (2027). Siglas que se deletrean, con puntos o separadas solo si es necesario; el
  montaje ya corrige IA, RGPD, IVA, IRPF, LED, USB, micro:bit, MakeCode, Maqueen, Scratch y Verifactu.
- **Tono:** cercano y concreto, de tú (curso 1 y 4: «tu hijo o tu hija», también «el peque» o «tu niña» alternando; nunca
  sexista). Nada de «en el vertiginoso mundo de hoy», ni de promesas («será ingeniero»), ni relleno. Cada clase deja
  algo que hacer hoy. Di de dónde sale cada idea cuando es una práctica conocida (PRIMM, Parsons, desconectada).
- **Capturas y demos:** `captura` y `demo` usan diapositivas reales de las presentaciones de Numi Tech:
  `presenta:<sesión>:<n>` con el número de la lista «Diapositivas de la presentación» del resumen de la sesión. `demo`
  solo para diapositivas de tipo `[robo]` (simulador del Maqueen) o `[demo]` (en Bit ejecuta el programa): el vídeo
  muestra la ejecución, así que la narración pide predecir antes y luego explica qué pasa. Úsalas: 1-3 por clase en los
  cursos 1, 2 y 4 (en el 2, al menos una `demo` por clase si la sesión tiene `[robo]`). Ninguna en el curso 3.
- **Recursos descargables:** `"imprimible:<sesión>"` adjunta las fichas imprimibles de esa sesión en PDF (castellano).
  En el curso 3 usa `"plantilla:<nombre>"` y describe la plantilla en la clase (la generamos aparte, ver abajo).
- **Primera sección:** `vistaPrevia: true` en las 2-3 primeras clases (Udemy las enseña gratis: deben enganchar).
- **Exactitud:** no inventes datos. Del curso de Numi, usa lo que dice el resumen (incluido el solucionario). Si dudas de un
  dato externo, no lo pongas.

## Cuestionario por sección
`guiones/<curso>/quiz-<n>.json` (n = número de sección, desde 1), de 3 a 5 preguntas de opción múltiple (la estructura
del cuestionario de Udemy), sacadas del solucionario o del contenido de la sección:

```json
{ "seccion": 3, "titulo": "Cuestionario: órdenes en orden", "preguntas": [
  { "pregunta": "…", "respuestas": ["…", "…", "…", "…"], "correcta": 0, "explicacion": "…" } ] }
```
Pregunta ≤ 250 caracteres; respuestas ≤ 120 (de 3 a 4); explicación ≤ 300. Varía la posición de la correcta.
Sin cuestionario en la sección «Empieza aquí» ni en la última sección si solo tiene la clase extra.
