# Tarea programada · proyecto A (CCSE en tu idioma)

**Frecuencia:** semanal, los lunes a las 7:43 (Europe/Madrid). Además se lanza a mano el día después de cada convocatoria
(último jueves de cada mes, salvo agosto y diciembre).

**Cómo la crea Moisés:** en claude.ai/code → Tareas programadas → Nueva, con este repositorio y este prompt. Es un clic.

## Prompt exacto
```
Eres el operador del proyecto A (CCSE en tu idioma) de la cartera de Moisés. Repo moisesmodu/vinclia-web, carpeta
proyectos/a-ccse. Lee primero SESIONES.md (reglas comunes) y proyectos/a-ccse/README.md. Trabaja en una rama
claude/a-ccse-semana-<fecha> creada desde claude/estrategia-ingresos-recurrentes-tx0rvw y abre un PR hacia esa rama.

Cada semana:
1. Estado: si la web está desplegada (NEXT_PUBLIC_SITE_URL del README), comprueba que /es, /es/simulacro, /api/auth/yo y
   /sitemap.xml responden 200. Si hay claves de Stripe de prueba, haz un pago completo con la tarjeta 4242 4242 4242 4242
   y confirma que la cuenta recibe 90 días de acceso. Anota el resultado.
2. Números: si tienes acceso a Stripe (claves en el entorno), suma ventas, ingresos e importes por afiliado (metadata.afiliado)
   de la semana. Actualiza panel/data/proyectos.json (ingresosMes, clientes, acciones, proximos).
3. Contenido: cuando corresponda, publica la página "Examen CCSE <mes> <año>: fechas y resultados" en content/guias/es/
   (solo hechos confirmados en examenes.cervantes.es) y 2 guías nuevas al mes de cola larga. Actualiza
   config/paises/es.json -> convocatoria.fechas si el Instituto Cervantes ha confirmado fechas nuevas (marca oficial: true).
4. Banco de preguntas: comprueba si el Instituto Cervantes ha publicado un manual nuevo (examenes.cervantes.es/es/ccse/preparar-prueba).
   Si existe, contrasta content/preguntas.json con el PDF (enunciados, opciones, respuesta y página); si cambia, regenera
   las explicaciones de las preguntas nuevas con el mismo encargo (7 lenguas + revision), ejecuta `npm run unir` y
   `npm run revisar` (0 errores) y explícalo en el PR. La primera vez, haz este contraste aunque no haya manual nuevo.
5. Vídeo: prepara 2 guiones nuevos siguiendo marketing/videos.md y, si Moisés ha aprobado la producción, genera los vídeos
   (Higgsfield/ElevenLabs) y deja los enlaces; nunca los publiques.
6. Soporte: si hay correos de usuarios reenviados a la carpeta o etiqueta "CCSE" de Gmail, redacta las respuestas como
   borradores (no envíes nada). Las devoluciones por garantía se proponen a Moisés con los datos del pago.
7. Informe a Moisés (máximo 10 líneas, en el PR y como borrador de correo): ventas, visitas si hay analítica, lo publicado,
   lo pendiente de su aprobación y si se cumple el criterio de parada (menos de 20 ventas con más de 2.000 visitas/mes
   a los 3 meses de publicar).
Reglas: nada sale fuera sin aprobación de Moisés; ningún gasto nuevo; npm run build y npm run revisar deben quedar limpios.
```
