# J · Cursos en Udemy · despliegue (para la sesión del Mac)

> Voz de todos los vídeos: castellano de España (Piper, `es_ES-davefx-medium`, CC0), rehecha el 31/10/2026.
>
> Resultado de `node scripts/comprobar-entorno.mjs` en la sesión de J (28/10/2026): sin `VERCEL_TOKEN` ni el resto de
> secretos, y sin red a api.vercel.com. Por eso los vídeos no van a Vercel Blob desde la nube: están en el almacén de
> páginas privadas de claude.ai (enlaces abajo), que ya sirven para ver, descargar por sección en zip y subir a Udemy.
> J no tiene web, base de datos ni Stripe: cobra Udemy.

## 1. Dónde están los archivos (ya subidos)

| Curso | Página privada de entrega | Contenido |
|---|---|---|
| c1 · Enseña a programar a tu hijo con Scratch | https://claude.ai/artifact/FM7xrjAKWFWaHGmRJQvJoK | 32 clases + promo (158,5 min), 48 PDF, imagen, VTT, cuestionarios y ficha |
| c4 · Bienestar digital en familia | misma página (pestaña «Bienestar digital») | 8 clases + promo (36,6 min), PDF, imagen, VTT, cuestionarios y ficha |
| c2 · Crea robots con micro:bit y Maqueen | https://claude.ai/artifact/1JzaUbRaAAbgmy49WhMbW3 | 38 clases + promo (212,8 min), 33 PDF, imagen, VTT, cuestionarios y ficha |
| c3 · Ahorra horas con IA (sección 1) | misma página que c1 (pestaña «IA para autónomos») | promo + clases 1-3 (+ 20 y 23 para los vídeos cortos), 24,1 min; las 24 plantillas en PDF |

Las páginas son privadas de la cuenta de Moisés. Cada sección se baja en un zip («Descargar sección») con los MP4, los
`.vtt` y los PDF, que es exactamente lo que pide el cargador masivo de Udemy.

## 2. Opcional: copia en Vercel Blob (si se quiere un segundo almacén)

Cuando haya `VERCEL_TOKEN` y red: crear un almacén Blob en el equipo `moisesmodu-3705s-projects` llamado
`cursos-udemy` (privado), y subir los zips de cada sección con `vercel blob put <zip> --token $VERCEL_TOKEN
--scope $VERCEL_TEAM_ID --access private` (o `@vercel/blob` `put`). Anotar las URLs en `panel/data/proyectos.json`
(`enlaces.almacen`). Coste: el plan gratuito de Blob admite 1 GB; los cursos 1 y 2 ocupan unos 0,8 GB.

## 3. Tareas programadas (crearlas con `create_trigger`, sin pedir nada a Moisés)

Las dos de `TAREA-PROGRAMADA.md`, cada una con `create_new_session_on_fire: true`, el repositorio `moisesmodu/vinclia-web`
y el conector de Gmail (solo borradores):

| Nombre | Cron | Prompt |
|---|---|---|
| J · Cursos Udemy · mensual | `CRON_TZ=Europe/Madrid 17 10 3 * *` | el de «1. Mensual» de `TAREA-PROGRAMADA.md` |
| J · Cursos Udemy · trimestral | `CRON_TZ=Europe/Madrid 23 11 10 1,4,7,10 *` | el de «2. Trimestral» de `TAREA-PROGRAMADA.md` |

Secreto que necesitan: `UDEMY_TOKEN` (API de instructor). Solo existe cuando Moisés haya abierto la cuenta de
instructor: Udemy → Perfil → «API clients» → crear. Hasta entonces la tarea mensual deja en el borrador cómo crearlo.

## 4. Nada más

Ni dominio, ni Vercel, ni Neon, ni Stripe, ni Resend. La subida a Udemy la hace Moisés con su cuenta
(`PARA-MOISES.md`): Udemy no tiene API para crear cursos.
