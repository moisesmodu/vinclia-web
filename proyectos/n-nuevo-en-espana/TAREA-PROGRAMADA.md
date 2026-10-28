# Tarea programada · N Nuevo en España

**Frecuencia:** cada lunes a las 07:41 (hora de Madrid). Expresión: `CRON_TZ=Europe/Madrid 41 7 * * 1`.
**Repositorio:** `moisesmodu/vinclia-web`, rama `claude/estrategia-ingresos-recurrentes-tx0rvw`.
**Cómo se crea:** en claude.ai/code → Tareas programadas → Nueva, pega el prompt de abajo, elige el repositorio y la
frecuencia. Una sesión nueva cada vez. Recomendado: acceso a red «completo» o, al menos, permitir boe.es,
inclusion.gob.es, extranjeros.inclusion.gob.es, sede.administracionespublicas.gob.es, seg-social.es, sede.seg-social.gob.es,
sanidad.gob.es, dgt.es, sede.dgt.gob.es, mjusticia.gob.es, examenes.cervantes.es, ciencia.gob.es, educacionfpydeportes.gob.es
y bde.es (si no, la tarea usa la búsqueda web y lo dice en el informe).

## Prompt (copiar tal cual)

```
Eres el mantenedor semanal de «Nuevo en España» (proyectos/n-nuevo-en-espana en moisesmodu/vinclia-web). Lee primero
SESIONES.md y el README del proyecto. Trabaja en una rama nueva claude/n-revision-<fecha> creada desde
claude/estrategia-ingresos-recurrentes-tx0rvw.

1. Fuentes y datos. Ejecuta `npm install` y `node scripts/revisar-fuentes.mjs`. Para cada guía de
   content/es/es/guias/, comprueba en las fuentes oficiales (BOE, Ministerio de Inclusión y sede de extranjería,
   Seguridad Social, Sanidad, DGT, Justicia, Instituto Cervantes, Universidades, Educación, Banco de España) si han
   cambiado plazos, tasas (modelo 790 y sus códigos), requisitos, formularios o enlaces. Busca también en el BOE de
   la última semana normas nuevas sobre extranjería, padrón, nacionalidad, tráfico, Seguridad Social y sanidad
   (en especial, instrucciones sobre la modificación o prórroga de las autorizaciones del Real Decreto 316/2026).
   Pendientes conocidos de la primera versión: tasas 790-052 y 790-012 de 2026, precio del DELE A2, tasas DGT 2.1 y 2.3
   de 2026, si China tiene convenio de canje de permisos (añadirlo a la guía), plazo del NUSS y umbrales de la
   cuenta de pago básica gratuita.
   Si no puedes abrir una web oficial, usa WebSearch limitada a su dominio y dilo en el informe.
2. Si algo ha cambiado y lo puedes confirmar en la fuente oficial: corrige la guía en castellano, pon
   "actualizado" y "consultado" a la fecha de hoy, y aplica el MISMO cambio en las 6 traducciones
   (content/es/{ar,fr,en,ro,zh,uk}/guias/) y en las páginas de preguntas que citen ese dato. Si un dato que la guía
   marca como «comprueba» ya se puede confirmar, quita la advertencia. Nunca inventes un dato: si no está claro,
   déjalo marcado como pendiente de comprobar.
3. Si no hay cambios en una guía, actualiza solo "consultado" de las fuentes que hayas comprobado de verdad.
4. Ejecuta `npm run validar`, `npm run check` y `npm run build`. Todo debe pasar.
5. Contenido nuevo (máximo 1 hora): 1 página SEO nueva en el idioma con menos páginas o con una búsqueda nueva que
   hayas detectado, y 2 guiones de vídeo corto en marketing/videos-<idioma>.md sobre los cambios de la semana.
   Nada se publica fuera: solo se deja preparado.
6. Abre un PR hacia claude/estrategia-ingresos-recurrentes-tx0rvw con el título «N: revisión semanal <fecha>».
7. Actualiza panel/data/proyectos.json (ficha n-nuevo-en-espana): añade una acción con la fecha y lo cambiado,
   y en `hallazgos` cualquier novedad normativa relevante.
8. Informe final (en el PR y en el chat), corto y en castellano: qué cambió (dato, antes, después, fuente), qué no se
   pudo verificar y por qué, y si hay algo que Moisés deba aprobar. Si no cambió nada, dilo en una línea.
```

## Por qué así
- La ola de modificaciones de las autorizaciones del RD 316/2026 (abril–junio de 2027) hará que el Ministerio publique
  instrucciones nuevas: la guía estrella tiene que reflejarlas la misma semana.
- Las tasas del modelo 790 cambian con los Presupuestos; la de la DGT, cada año.
- Cada cambio va a las 7 lenguas en la misma pasada: una guía traducida desactualizada es peor que no tenerla.
