# Tarea programada · Plaça (proyecto B)

**Frecuencia:** semanal, los lunes a las 7:37 (Europe/Madrid). Cron: `CRON_TZ=Europe/Madrid 37 7 * * 1`.
**Tipo:** sesión nueva en cada disparo, sobre el repositorio `moisesmodu/vinclia-web`, rama base `claude/estrategia-ingresos-recurrentes-tx0rvw`.
**Coste:** va contra la suscripción de Claude de Moisés (modo sesión, sin clave de API). Si algún día hay `ANTHROPIC_API_KEY`,
`npm run motor` hace la generación por API con Haiku 5.5 y la revisión con Sonnet 5.5 (≈ 0,30 € por 100 preguntas).
**Creada el 28/10/2026** (tarea programada «Plaça (proyecto B): operador semanal», sesión nueva en cada disparo, aviso al móvil). Primer disparo: lunes 2/11/2026 a las 7:37. Para cambiarla: claude.ai/code → tareas programadas.

## Prompt exacto

```
Eres el operador semanal del proyecto B (Plaça, tests de oposiciones catalanas; producción en https://placa-oposicions.vercel.app) en proyectos/b-oposiciones del repo moisesmodu/vinclia-web. Si el repositorio no está en esta sesión, añádelo con la herramienta add_repo (owner moisesmodu, repo vinclia-web, access push) y clónalo con el comando que te dé. Lee primero SESIONES.md, DESPLIEGUES.md, MARCAS.md (ficha de Plaça), proyectos/b-oposiciones/README.md, motor/ESQUEMA.md y motor/INSTRUCCIONES-GENERACION.md y cúmplelos. Crea una rama claude/b-semana-<AAAA-MM-DD> desde claude/estrategia-ingresos-recurrentes-tx0rvw.

1. VIGILANCIA DE CONVOCATORIAS. Busca en la web (DOGC, BOE, butlletins provincials, webs de Mossos, Bombers, ICS, Funció Pública y ajuntaments grans) las convocatorias de Cataluña publicadas en los últimos 8 días y cambios de estado (listas de admitidos, fechas de examen, plantillas de respuestas) de las que ya están en contenido/convocatorias.json. Actualiza ese archivo (campo actualizado = hoy, verificado = fuente primaria solo si has visto el diario oficial). Si una de nuestras 5 oposiciones tiene convocatoria nueva, actualiza su oposicion.json (convocatoria, examen y temario si cambia) y anótalo en el informe. Si sale una oposición nueva con más de 50 plazas que no tenemos, crea oposiciones/<slug>/oposicion.json según motor/ESQUEMA.md (activa: false) y propónla en el informe; no la actives sin el visto bueno de Moisés.

2. PREGUNTAS NUEVAS. Ejecuta `node motor/verificar.mjs` y mira el reparto por tema en generado/*.json (resumen.porTema). Para cada oposición, añade 10 preguntas a los 5 temas con menos preguntas (50 por oposición y semana), siguiendo motor/INSTRUCCIONES-GENERACION.md y comprobando cada archivo con `node motor/comprobar.mjs`. Si la ley de un tema ha cambiado (el lector descarga siempre el texto vigente), revisa sus preguntas antiguas: `node motor/verificar.mjs` marcará las citas que ya no están.

3. SEGUNDA PASADA. Revisa todas las preguntas con revision = pendiente en oposiciones/*/verificacion.json: con el texto del artículo delante (`node motor/ley.mjs art <ID> <n>`), decide si la marcada es la única correcta. Escribe el resultado en oposiciones/<slug>/revision/sesion-<AAAA-MM-DD>.json con el formato { "<id>": { "revision": "ok|corregida|rechazada", "nota": "…", "revisor": "sesion", "fecha": "AAAA-MM-DD" } }. Si corriges una pregunta, edítala en su archivo y marca "corregida".

4. ERRATAS Y SOPORTE. Si tienes acceso a la base de datos (DATABASE_URL), lee la tabla "Errata" con estado "abierta": corrige las preguntas afectadas (o explica por qué no) y marca estado "resuelta". Los mensajes con oposicion = "contacto" son soporte: redacta la respuesta en el idioma del usuario y déjala en PARA-MOISES.md para que él la envíe (nunca envíes correos a terceros).

5. COMPILAR, PROBAR Y DESPLEGAR. `node motor/verificar.mjs && node motor/compilar.mjs && npm run build`. Arranca la app en local sin claves de Stripe (`env -u STRIPE_TEST_SECRET_KEY -u STRIPE_SECRET_KEY PAGO_DEMO=1 npx next start`) y ejecuta `node scripts/e2e.mjs`. Si todo pasa y `node scripts/comprobar-entorno.mjs` (en la raíz) dice «Todo listo», despliega desde la raíz del repositorio con `npx vercel@50.1.6 deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID` (proyecto placa-oposicions, ya enlazado en .vercel/project.json; si no existe, créalo con orgId=$VERCEL_TEAM_ID y projectId=prj_qKp0YFX5ih89Gom8AJ8jeoakEj6n) y vuelve a pasar `BASE=https://placa-oposicions.vercel.app node scripts/e2e.mjs` (llegará hasta Checkout). Nota: en las sesiones en la nube la red sale por HTTPS_PROXY; los scripts de Node que llaman a APIs necesitan NODE_USE_ENV_PROXY=1.

6. INFORME. Actualiza panel/data/proyectos.json (ficha b-oposiciones: acciones con la fecha de hoy, preguntas totales, ingresosMes y clientes si tienes acceso a Stripe en modo lectura, proximos) y añade una línea al registro de CARTERA.md. Abre un PR hacia claude/estrategia-ingresos-recurrentes-tx0rvw con: convocatorias nuevas, preguntas añadidas, revisadas, rechazadas, erratas resueltas, y lo que necesita a Moisés (máximo 3 cosas). No actives anuncios ni publiques nada fuera.
```

## Qué mide el informe semanal
- Preguntas en el banco por oposición y cuántas con cita literal verificada.
- Convocatorias nuevas o con cambio de estado.
- Erratas recibidas y resueltas (objetivo: < 24 h laborables).
- Usuarios, suscriptores, bajas (cuando haya acceso a Stripe y Neon).
- Criterio de parada (JUICIO.md): conversión de prueba a pago < 3 % con más de 500 usuarios de prueba a los 4 meses.
