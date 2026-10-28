# Esquema de una guía (JSON)

Ruta: `content/<pais>/<idioma>/guias/<slug>.json` (país `es`; idiomas `es`, `ar`, `fr`, `en`, `ro`, `zh`, `uk`).
El `slug` y todos los `id` son iguales en todos los idiomas. Solo se traducen los textos.

```json
{
  "slug": "empadronamiento",
  "titulo": "Cómo empadronarte en España",
  "resumen": "3-4 frases claras: qué es, para qué sirve, cuánto cuesta, cuánto tarda. Es lo que se ve gratis.",
  "paraQuien": "1-2 frases: a quién aplica y a quién no.",
  "actualizado": "2026-10-28",
  "datosClave": [ { "etiqueta": "Coste", "valor": "Gratis" }, { "etiqueta": "Tiempo", "valor": "..." } ],
  "pasos": [ { "titulo": "Pide cita en tu ayuntamiento", "texto": "2-5 frases concretas. Sin consejo jurídico personal." } ],
  "documentos": [ { "nombre": "Pasaporte en vigor", "nota": "opcional: original y copia, etc." } ],
  "plazos": [ { "texto": "La renovación se pide en los 60 días anteriores a la caducidad o en los 90 posteriores." } ],
  "tasas": [ { "concepto": "Tasa de renovación", "importe": "16,08 €", "modelo": "Modelo 790 código 052, epígrafe 2.2", "nota": "opcional" } ],
  "errores": [ "Error frecuente concreto y cómo evitarlo, una o dos frases." ],
  "checklist": [ { "id": "doc-pasaporte", "texto": "Tengo el pasaporte en vigor" } ],
  "recordatorio": {
    "pregunta": "¿Cuándo caduca tu tarjeta (TIE)?",
    "avisos": [ { "dias": -60, "texto": "Ya puedes pedir la renovación" }, { "dias": 0, "texto": "Hoy caduca tu tarjeta: tienes 90 días más para pedir la renovación" } ]
  },
  "variantes": [ { "titulo": "En Cataluña", "texto": "opcional: diferencias por comunidad" } ],
  "fuentes": [ { "nombre": "Real Decreto 1155/2024 (BOE)", "url": "https://www.boe.es/...", "consultado": "2026-10-28" } ]
}
```

Reglas de contenido:
- Solo información pública de fuentes oficiales (BOE, Ministerio de Inclusión, Policía Nacional, Seguridad Social,
  Ministerio de Universidades/Educación, DGT, Ministerio de Justicia, Instituto Cervantes, Banco de España,
  ayuntamientos, comunidades autónomas). Cada dato de plazo o tasa debe poder rastrearse a una fuente de `fuentes`.
- Si un dato no se ha podido verificar, se dice ("comprueba el importe vigente en ...") en vez de inventarlo.
- Nunca asesoramiento personal, nunca "te garantizamos", nunca gestión de cita previa ni trámites en nombre de nadie.
  Se puede decir dónde se pide la cita oficial (enlace a la sede oficial).
- Lenguaje claro (nivel A2-B1 de castellano), frases cortas, segunda persona (tú).
- `recordatorio.avisos[].dias`: días relativos a la fecha que da el usuario (negativo = antes, positivo = después).
- 6-10 pasos, 5-12 documentos, 4-8 errores, 6-14 elementos de checklist.

# Esquema de una página de pregunta (SEO)

Ruta: `content/es/<idioma>/preguntas/<slug>.json`. Una página por pregunta real que la gente escribe en Google en ese idioma.
El `slug` va en ASCII con guiones (transliterado si el idioma no usa alfabeto latino), p. ej. `tajdid-iqama-isbania-2027`.

```json
{
  "slug": "como-renovar-residencia-2027",
  "pregunta": "¿Cómo renovar la residencia en 2027?",
  "descripcion": "Meta descripción de 140-160 caracteres con la respuesta y la palabra clave.",
  "respuestaCorta": "2-3 frases que responden directamente (para el fragmento destacado de Google).",
  "secciones": [ { "titulo": "Subtítulo H2", "texto": "1-3 párrafos claros. Separa párrafos con \n\n." } ],
  "faq": [ { "p": "Pregunta relacionada", "r": "Respuesta de 1-3 frases." } ],
  "guia": "renovacion-residencia",
  "actualizado": "2026-10-28",
  "fuentes": [ { "nombre": "...", "url": "https://...", "consultado": "2026-10-28" } ]
}
```
- 3-5 secciones, 3-5 faq, 500-900 palabras. Todo dato (plazo, tasa, norma) sale de la guía relacionada en
  `content/es/es/guias/<guia>.json` y usa sus mismas fuentes: no se añaden datos nuevos sin fuente oficial.
- Mismo aviso implícito: información general, no asesoramiento; nada de gestión de citas.
