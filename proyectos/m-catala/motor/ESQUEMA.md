# Esquema del contenido de Aprova (proyecto M)

Todo el contenido vive en `contenido/` como JSON y lo valida `node motor/comprobar.mjs` (forma) y `node motor/validar-lt.mjs`
(LanguageTool con las reglas de Softcatalà sobre todos los textos en catalán). `node motor/compilar.mjs` genera `generado/banc.json`,
que es lo único que lee la app. **Nada entra en la app sin pasar el comprobador.**

## Idiomas
- El contenido del examen (enunciados, textos, opciones, respuestas) está **solo en catalán normativo** (el examen es en catalán).
- Las **explicaciones de las reglas** están en `ca`, `es`, `en`, `ar`, `ro` y `fr` (los idiomas del público: inmigración y castellanohablantes).
- Variedad: estándar central; se admiten formas del nord-occidental cuando la normativa las acepta (se marcan en `variants`).

## 1. Reglas · `contenido/regles/<id>.json`
```json
{
  "id": "pronoms-en-hi",
  "punt": "pronoms-febles",                 // id de config/punts.json
  "nivells": ["B1", "B2", "C1"],
  "titol": { "ca": "Els pronoms en i hi" },
  "regla": { "ca": "…", "es": "…", "en": "…", "ar": "…", "ro": "…", "fr": "…" },   // 2 a 5 frases, lenguaje llano, con la forma normativa
  "exemples": [{ "malament": "Vaig a Lleida i torno de Lleida.", "be": "Vaig a Lleida i en torno." }],  // mínimo 2
  "font": { "nom": "Optimot, fitxa 7405/2", "url": "https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=pronom+en" }
}
```
`font.nom` cita la obra normativa (Optimot, GIEC, OIEC, DIEC2, Gramàtica essencial) y `font.url` enlaza a la consulta del Optimot
(`https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=<termes>`), al DIEC2 (`https://dlc.iec.cat/Results?DecEntradaText=<mot>`)
o a la GIEC en línia (`https://giec.iec.cat`). Si no se conoce la ficha exacta, basta con `"Optimot"` y la URL de búsqueda.

## 2. Ítems · `contenido/items/<nivell>/<tipus>.json` (un array por archivo)
Campos comunes:
```json
{
  "id": "c1-buits-0001",           // <nivell en minúscula>-<tipus>-<4 dígitos>, único en todo el banco
  "nivell": "C1",                   // B1 | B2 | C1 | C2
  "area": "us",                     // us (ús de la llengua) | lectura | co (comprensió oral) | escrit | oral
  "tipus": "buits",                 // ver abajo
  "punt": "pronoms-febles",         // id de config/punts.json
  "regla": "pronoms-en-hi",         // id de contenido/regles
  "dificultat": 0.3,                // de -2 (fácil para el nivel) a 2 (difícil para el nivel); 0 = típico del nivel
  "enunciat": "…",                  // en catalán; en buits, el hueco es ___ (tres guiones bajos)
  "resposta": "…",                  // string, array de strings aceptados, o índice (number) cuando hay opcions
  "opcions": ["…", "…", "…"],       // opcional salvo en castellanismes y lexic-opcio; 3 o 4 opciones distintas
  "pista": "…",                     // opcional, una frase
  "diagnostic": true,               // puede salir en el diagnóstico adaptativo
  "gratis": true,                   // visible sin suscripción (al menos un 30 % de cada archivo)
  "revisio": "sessio",              // sessio (escrito en modo sesión) | ia (generado por modelo) | huma (revisado por filólogo)
  "variants": ["…"]                 // opcional: formas también correctas (nord-occidental, valenciano) que se aceptan
}
```
Tipos (`tipus`) y campos propios:
| tipus | qué es | campos |
|---|---|---|
| `buits` | hueco normativo en una frase (pronombre, preposición, verbo, grafía) | `resposta` string o array; `opcions` opcional |
| `transformacio` | reescribir según la instrucción (sustituye por pronombres, pasa a pasado, al registro formal…) | `enunciat` = instrucción + frase; `resposta` array con todas las formas aceptadas |
| `castellanismes` | detectar y corregir un calco del castellano | `enunciat` frase con el error; `opcions` 3–4 (la correcta normativa y distractores); `resposta` índice; `error` = el fragmento incorrecto |
| `lexic` | precisión léxica, parejas confusibles, léxico por tema | `enunciat` frase o definición; `opcions` 3–4; `resposta` índice |
| `dictat` | dictado con audio (TTS) | `text` = lo que se dicta (1 o 2 frases, 15–35 palabras); `resposta` = `text`; `focus` = grafías que trabaja |
| `lectura` | pregunta sobre un texto | `textId` (de contenido/textos); `opcions` 3; `resposta` índice |
| `co` | pregunta sobre un audio | `textId` (texto de tipo co); `opcions` 3; `resposta` índice |

Criterios de calidad: una sola respuesta correcta inequívoca; distractores plausibles (errores reales de castellanohablantes);
nada de preguntas de trivia; frases con contexto real de Cataluña (feina, salut, ajuntament, escola, habitatge); sin datos personales;
sin copiar frases literales de libros de editoriales ni de los modelos de la DPL.

## 3. Textos · `contenido/textos/<id>.json`
```json
{ "id": "c1-lectura-0001", "nivell": "C1", "area": "lectura",   // lectura | co
  "titol": "…", "genere": "article d'opinió", "text": "… (lectura: B1 150–250 palabras, B2 250–400, C1 400–600; co: guion de 90–220 palabras con locutores A:/B: si es diálogo)",
  "paraules": 480, "veus": ["central"],   // co: acentos del audio: central | nord-occidental
  "preguntes": [{ "id": "p1", "enunciat": "…", "opcions": ["…", "…", "…"], "resposta": 0 }],   // lectura 5–8, co 3–6
  "revisio": "sessio" }
```

## 4. Tareas escritas · `contenido/tasques/<id>.json`
```json
{ "id": "c1-escrit-0001", "nivell": "C1", "tipus": "argumentatiu-3-fonts",   // correu | text-informatiu | argumentatiu-3-fonts | nota | carta-formal
  "titol": "…", "enunciat": "…", "fonts": [{ "titol": "…", "text": "… (80–150 palabras cada una, 3 en C1)" }],
  "paraulesMin": 220, "paraulesMax": 280, "minuts": 90, "registre": "formal",
  "guia": { "ca": "qué espera el corrector: tesis, 2 argumentos de las fuentes, contraargumento, conclusión" }, "revisio": "sessio" }
```

## 5. Simulacros · `contenido/simulacres/<nivell>-<n>.json`
```json
{ "id": "c1-simulacre-1", "nivell": "C1", "nom": "Simulacre C1 · model 1",
  "arees": { "escrit": { "tasca": "c1-escrit-0001" }, "us": { "items": ["c1-buits-0001", "…45 ids…"] } },
  "revisio": "sessio" }
```
B1 y B2 llevan además `co` (textIds) y `lectura` (textIds). Los tiempos y mínimos salen de `config/examens.json`.

## 6. Oral · `contenido/oral/sons.json` y `contenido/oral/lectures.json`
`sons.json`: catálogo de sonidos difíciles por lengua materna (`es` por defecto): id, nombre, descripción (ca, es), palabras ejemplo, pista articulatoria.
`lectures.json`: textos de 40–80 palabras para leer en voz alta con `sons` que trabaja y `paraulesClau` (palabra → ids de sonido).

## 7. Revisión humana · `contenido/revisio/lot-<fecha>.json`
Lote de 50 ítems elegidos por muestreo estratificado (nivel × tipo) con `estat: pendent` y hueco para el veredicto del filólogo.
