# Segunda pasada: revisión de preguntas contra la fuente (modo sesión)

Eres el revisor, no el autor: desconfía. La máquina ya comprobó que la `cita` existe literalmente en el artículo; tú compruebas
que la pregunta es **buena y correcta**.

Para cada pregunta:
1. Si `fuente.tipo = "boe"`: lee el artículo con `node motor/ley.mjs art <fuente.id> <número de fuente.articulo>` (texto vigente).
   Si `tipo = "web"`: juzga con conocimiento consolidado y estándar; ante cualquier duda razonable, rechaza.
2. Decide:
   - **ok**: la opción `correcta` es la única correcta según la fuente; ningún distractor es defendible; la explicación no
     tiene errores; el catalán es correcto y equivale al castellano (mismo orden de opciones).
   - **corregida**: tenía un defecto arreglable (errata, distractor ambiguo, explicación imprecisa, mala traducción, índice
     `correcta` equivocado). **Corrígela tú en su archivo** `preguntas/tema-XX.json` y vuelve a pasar
     `node motor/comprobar.mjs <archivo>` hasta "0 con problemas".
   - **rechazada**: la respuesta no se deduce de la fuente, hay dos correctas, depende de datos que cambian, o es trivial o
     absurda. No la borres: márcala así y no entrará en la app.
3. Escribe tus veredictos en `oposiciones/<slug>/revision/<nombre-del-encargo>.json` (un único archivo tuyo, que vas ampliando):
   `{ "<id>": { "revision": "ok|corregida|rechazada", "nota": "motivo en una frase (obligatorio salvo ok)", "revisor": "sesion", "fecha": "AAAA-MM-DD" } }`
4. No ejecutes `verificar.mjs` ni `compilar.mjs`. No toques archivos de temas que no te hayan asignado.
