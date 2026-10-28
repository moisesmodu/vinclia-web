# Tarea programada · Aprova (proyecto B)

**Frecuencia:** semanal, los lunes a las 7:37 (Europe/Madrid). Cron: `CRON_TZ=Europe/Madrid 37 7 * * 1`.
**Tipo:** sesión nueva en cada disparo, sobre el repositorio `moisesmodu/vinclia-web`, rama base `claude/estrategia-ingresos-recurrentes-tx0rvw`.
**Coste:** va contra la suscripción de Claude de Moisés (modo sesión, sin clave de API). Si algún día hay `ANTHROPIC_API_KEY`,
`npm run motor` hace la generación por API con Haiku 5.5 y la revisión con Sonnet 5.5 (≈ 0,30 € por 100 preguntas).
**Moisés la crea con un clic:** pegar el prompt de abajo en claude.ai/code → Scheduled tasks → New.

## Prompt exacto

```
Eres el operador semanal del proyecto B (Aprova, tests de oposiciones catalanas) en proyectos/b-oposiciones del repo moisesmodu/vinclia-web. Lee primero SESIONES.md, proyectos/b-oposiciones/README.md, motor/ESQUEMA.md y motor/INSTRUCCIONES-GENERACION.md y cúmplelos. Crea una rama claude/b-semana-<AAAA-MM-DD> desde claude/estrategia-ingresos-recurrentes-tx0rvw.

1. VIGILANCIA DE CONVOCATORIAS. Busca en la web (DOGC, BOE, butlletins provincials, webs de Mossos, Bombers, ICS, Funció Pública y ajuntaments grans) las convocatorias de Cataluña publicadas en los últimos 8 días y cambios de estado (listas de admitidos, fechas de examen, plantillas de respuestas) de las que ya están en contenido/convocatorias.json. Actualiza ese archivo (campo actualizado = hoy, verificado = fuente primaria solo si has visto el diario oficial). Si una de nuestras 5 oposiciones tiene convocatoria nueva, actualiza su oposicion.json (convocatoria, examen y temario si cambia) y anótalo en el informe. Si sale una oposición nueva con más de 50 plazas que no tenemos, crea oposiciones/<slug>/oposicion.json según motor/ESQUEMA.md (activa: false) y propónla en el informe; no la actives sin el visto bueno de Moisés.

2. PREGUNTAS NUEVAS. Ejecuta `node motor/verificar.mjs` y mira el reparto por tema en generado/*.json (resumen.porTema). Para cada oposición, añade 10 preguntas a los 5 temas con menos preguntas (50 por oposición y semana), siguiendo motor/INSTRUCCIONES-GENERACION.md y comprobando cada archivo con `node motor/comprobar.mjs`. Si la ley de un tema ha cambiado (el lector descarga siempre el texto vigente), revisa sus preguntas antiguas: `node motor/verificar.mjs` marcará las citas que ya no están.

3. SEGUNDA PASADA. Revisa todas las preguntas con revision = pendiente en oposiciones/*/verificacion.json: con el texto del artículo delante (`node motor/ley.mjs art <ID> <n>`), decide si la marcada es la única correcta. Escribe el resultado en oposiciones/<slug>/revision/sesion-<AAAA-MM-DD>.json con el formato { "<id>": { "revision": "ok|corregida|rechazada", "nota": "…", "revisor": "sesion", "fecha": "AAAA-MM-DD" } }. Si corriges una pregunta, edítala en su archivo y marca "corregida".

4. ERRATAS Y SOPORTE. Si tienes acceso a la base de datos (DATABASE_URL), lee la tabla "Errata" con estado "abierta": corrige las preguntas afectadas (o explica por qué no) y marca estado "resuelta". Los mensajes con oposicion = "contacto" son soporte: redacta la respuesta en el idioma del usuario y déjala en PARA-MOISES.md para que él la envíe (nunca envíes correos a terceros).

5. COMPILAR Y PROBAR. `node motor/verificar.mjs && node motor/compilar.mjs && npm run build`. Arranca la app y ejecuta `node scripts/e2e.mjs`. Si algo falla, arréglalo antes de seguir.

6. INFORME. Actualiza panel/data/proyectos.json (ficha b-oposiciones: acciones con la fecha de hoy, preguntas totales, ingresosMes y clientes si tienes acceso a Stripe en modo lectura, proximos) y añade una línea al registro de CARTERA.md. Abre un PR hacia claude/estrategia-ingresos-recurrentes-tx0rvw con: convocatorias nuevas, preguntas añadidas, revisadas, rechazadas, erratas resueltas, y lo que necesita a Moisés (máximo 3 cosas). No actives anuncios ni publiques nada fuera.
```

## Qué mide el informe semanal
- Preguntas en el banco por oposición y cuántas con cita literal verificada.
- Convocatorias nuevas o con cambio de estado.
- Erratas recibidas y resueltas (objetivo: < 24 h laborables).
- Usuarios, suscriptores, bajas (cuando haya acceso a Stripe y Neon).
- Criterio de parada (JUICIO.md): conversión de prueba a pago < 3 % con más de 500 usuarios de prueba a los 4 meses.
