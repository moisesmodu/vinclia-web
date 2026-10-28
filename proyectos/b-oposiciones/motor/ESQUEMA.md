# Esquema del motor de oposiciones

Añadir una oposición = crear `oposiciones/<slug>/oposicion.json` + dejar el PDF de la convocatoria en
`oposiciones/<slug>/convocatoria.pdf` (o su URL en `convocatoria.pdfUrl`) y ejecutar `npm run motor -- <slug>`.
Todo lo demás (temario troceado, preguntas, verificación, traducción, páginas SEO) sale de ahí.

## `oposicion.json`

```jsonc
{
  "slug": "auxiliar-administratiu-generalitat",      // URL y carpeta
  "pais": "es",                                       // mercado (config/paises/<pais>.json)
  "activa": true,
  "nombre": { "es": "Auxiliar Administrativo de la Generalitat de Catalunya", "ca": "Auxiliar Administratiu de la Generalitat de Catalunya" },
  "nombreCorto": { "es": "Auxiliar Generalitat", "ca": "Auxiliar Generalitat" },
  "cuerpo": { "es": "Cuerpo auxiliar de administración (subgrupo C2)", "ca": "Cos auxiliar d'administració (subgrup C2)" },
  "administracion": "Generalitat de Catalunya",
  "convocatoria": {
    "referencia": "Resolució PRE/212/2026, de 27 de gener",           // tal como aparece en el diario
    "diario": "DOGC", "numero": "9595", "fecha": "2026-02-02",
    "url": "https://dogc.gencat.cat/...",                            // enlace oficial
    "pdfUrl": "https://...pdf",                                      // opcional
    "plazas": 114, "estado": "en curso|prevista|cerrada", "notas": "…",
    "verificado": "fuente primaria|fuente secundaria (academia/prensa): comprobar"   // honestidad sobre la cita
  },
  "examen": {                                            // formato real de la prueba de conocimientos
    "preguntas": 50, "reserva": 5, "opciones": 4, "minutos": 60,
    "penalizacion": 0.25,                                // fracción de acierto que resta cada error (0 = sin penalización)
    "notaMaxima": 10, "notaCorte": 5,
    "descripcion": { "es": "…", "ca": "…" },
    "otrasPruebas": { "es": ["Catalán C1", "…"], "ca": ["…"] }
  },
  "temas": [
    {
      "n": 1,
      "titulo": { "es": "…", "ca": "…" },              // texto oficial del temario (traducido si hace falta)
      "slug": "estatut-autonomia",                        // URL de la página SEO del tema
      "bloque": { "es": "Parte general", "ca": "Part general" },
      "fuentes": [                                        // de dónde salen las preguntas
        { "tipo": "boe", "id": "BOE-A-2006-13087", "norma": "Ley Orgánica 6/2006… Estatuto de Autonomía de Cataluña", "articulos": "1-11, 55-86" },
        { "tipo": "web", "norma": "Idescat · Anuari estadístic", "url": "https://…" }    // fuentes no legales (geografía, técnica sanitaria)
      ],
      "peso": 1                                            // peso relativo en simulacros (por defecto 1)
    }
  ],
  "examenesAnteriores": [ { "anio": 2023, "titulo": "…", "url": "…", "plantilla": "url de respuestas" } ],
  "seo": { "palabrasClave": { "es": ["test auxiliar administrativo generalitat"], "ca": ["test auxiliar administratiu generalitat"] } }
}
```

## Preguntas: `oposiciones/<slug>/preguntas/tema-XX.json` (array)

```jsonc
{
  "id": "aux-gen-t01-001",                   // único y estable (prefijo de la oposición, tema, número)
  "tema": 1,
  "dificultad": 2,                           // 1 fácil · 2 media · 3 difícil
  "correcta": 1,                             // índice 0..opciones-1
  "es": { "enunciado": "…", "opciones": ["…","…","…","…"], "explicacion": "Por qué es la correcta y por qué fallan las otras, en 1-3 frases." },
  "ca": { "enunciado": "…", "opciones": ["…","…","…","…"], "explicacion": "…" },
  "fuente": {
    "tipo": "boe|web",
    "id": "BOE-A-2015-10565",                // si tipo=boe
    "norma": "Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común…",
    "articulo": "21.3",                      // artículo y apartado
    "url": "https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565#a21"
  },
  "cita": "Cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, éste será de tres meses",
                                             // fragmento LITERAL de la fuente que justifica la respuesta (≤ 300 caracteres; se puede
                                             // unir con " … " dos trozos del mismo artículo). Lo comprueba la máquina.
  "origen": "ia|examen-oficial",
  "examen": { "convocatoria": "…", "anio": 2023, "numero": 12 }     // solo si origen = examen-oficial
}
```

## Verificación (dos pasadas)
1. **Máquina** (`motor/verificar.mjs`): para `fuente.tipo = boe`, descarga la norma consolidada y comprueba que la `cita` está,
   literal, en el artículo citado. Comprueba también formato: 4 opciones distintas, índice válido, es y ca completos.
2. **Segunda lectura con IA** (`motor/revisar.mjs`, o un revisor humano): con el texto del artículo delante, decide si la opción
   marcada es la única correcta según la fuente. Resultado en `oposiciones/<slug>/verificacion.json`:
   `{ "<id>": { "maquina": "ok|cita-no-encontrada|sin-fuente-boe", "revision": "ok|corregida|rechazada", "nota": "…", "fecha": "…" } }`.
   Solo entran en la app las preguntas con `revision` = ok o corregida y, si son de BOE, `maquina` = ok.
