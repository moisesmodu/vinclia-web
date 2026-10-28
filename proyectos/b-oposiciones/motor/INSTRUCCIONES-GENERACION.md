# Instrucciones para generar preguntas (las sigue la IA, en sesión o en la tarea semanal)

Lee antes `motor/ESQUEMA.md` (formato) y `oposiciones/<slug>/oposicion.json` (temario y fuentes de cada tema).

## Calidad: la pregunta tiene que poder caer en el examen
1. **Fuente primero.** Para cada fuente `tipo: "boe"` del tema, lee los artículos con
   `node motor/ley.mjs art <ID> <n> [<n> ...]` (o `indice` para ver la lista, `buscar` para localizar un concepto).
   Redacta la pregunta a partir de ese texto, nunca de memoria. Solo el texto vigente que devuelve el lector cuenta.
2. **`cita` literal.** Copia del texto devuelto, sin cambiar ni una coma, el fragmento (≤ 300 caracteres) que demuestra que la
   respuesta correcta es la correcta. Puedes unir dos trozos del mismo artículo con ` … `. `fuente.articulo` = número del
   artículo (y apartado si quieres: "21.3"); `fuente.url` = `https://www.boe.es/buscar/act.php?id=<ID>#a<n>` (sin apartado;
   para disposiciones adicionales/transitorias, la URL sin ancla). `fuente.norma` = título corto oficial ("Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas").
3. **Temas sin texto legal** (técnica de bomberos, cuidados de enfermería, geografía, sociología…): `fuente.tipo = "web"`,
   `fuente.norma` = la fuente de referencia del tema en `oposicion.json` (o una obra/organismo de referencia reconocido),
   `fuente.url` si la hay en el config. Solo hechos consolidados y no discutidos, que aparecen igual en cualquier manual;
   nada de cifras que cambian según la fuente o el año. `cita` se omite.
4. **Una sola correcta, sin trampas.** 4 opciones (o las que diga `examen.opciones`) plausibles, del mismo estilo y longitud,
   del mismo campo semántico; los distractores salen de confusiones reales (plazos vecinos, órganos parecidos, artículos
   cercanos). Prohibido "todas las anteriores", "ninguna de las anteriores" y "a y b son correctas". Las de "señala la
   incorrecta" como mucho 1 de cada 10, y con la palabra INCORRECTA en mayúsculas.
5. **Reparto:** la opción correcta repartida entre a, b, c y d (~25 % cada una); dificultad 1/2/3 en proporción ~30/50/20.
   Cubre todos los artículos relevantes del tema; no repitas el mismo dato en dos preguntas.
6. **Explicación (1-3 frases):** por qué la correcta lo es (con el artículo) y, si ayuda, por qué falla el distractor más
   tentador.
7. **Catalán normativo (IEC)** con la terminologia jurídica de les versions oficials en català (Estatut d'autonomia, recurs
   d'alçada, silenci administratiu, Mesa del Parlament, Síndic de Greuges…). El texto `ca` es traducción fiel del `es`:
   mismas opciones en el mismo orden, mismo índice `correcta`. La `cita` se queda en el idioma de la fuente (castellano BOE).
8. **Exámenes oficiales:** solo si tienes el enunciado literal y la plantilla oficial; entonces `origen: "examen-oficial"` y
   `examen: { convocatoria, anio, numero }`. Si no, `origen: "ia"`.

## Archivos y comprobación
- Un archivo por tema: `oposiciones/<slug>/preguntas/tema-XX.json` (XX con dos cifras), array JSON. Si el archivo ya existe,
  añade preguntas nuevas sin tocar las existentes y continúa la numeración.
- `id`: `<prefijo>-tXX-NNN` (prefijo indicado en el encargo).
- Después de escribir cada archivo: `node motor/comprobar.mjs oposiciones/<slug>/preguntas/tema-XX.json`. Debe acabar con
  "0 con problemas". Si una cita no se encuentra, vuelve a copiarla del lector (no la retoques a mano) o cambia la pregunta.
- No ejecutes `verificar.mjs` ni `compilar.mjs` (otros procesos escriben a la vez); solo `comprobar.mjs` sobre tus archivos.
