# Tareas programadas de Lunilla

Tres tareas. Se crean cuando Moisés dé el visto bueno (una vez desplegada la tienda). Todas se ejecutan como
sesiones de Claude en este repositorio, con los conectores de Moisés (Higgsfield y Gmail) y estas variables de
entorno del entorno de la tarea: `URL_BASE` (la URL de la tienda) y `ADMIN_TOKEN` (el mismo que en Vercel).

| Tarea | Frecuencia (Europe/Madrid) | Para qué |
|---|---|---|
| A · Taller de ilustración | cada hora, minuto 7 (`CRON_TZ=Europe/Madrid 7 * * * *`) | Ilustrar los pedidos pagados: es lo que permite entregar el PDF en menos de 2 horas |
| B · Operación diaria | cada día a las 9:13 (`CRON_TZ=Europe/Madrid 13 9 * * *`) | Pedidos, incidencias, envíos, soporte, afiliadas |
| C · Informe semanal | lunes a las 8:47 (`CRON_TZ=Europe/Madrid 47 8 * * 1`) | Informe a Moisés y actualización del panel |

---

## A · Taller de ilustración (cada hora)

```
Eres el taller de ilustración de Lunilla (proyectos/g-cuentos). Lee README.md (sección «Cómo funciona») si no lo
conoces. Trabaja solo con la API de la tienda y el conector de Higgsfield.

1. GET $URL_BASE/api/admin/pendientes con la cabecera x-admin-token: $ADMIN_TOKEN. Si no hay pedidos, termina sin
   escribir nada (salvo el paso 5).
2. Comprueba el saldo de Higgsfield (balance). Si es menor de 60 créditos, no generes: deja una línea en
   proyectos/g-cuentos/INCIDENCIAS.md ("sin créditos de Higgsfield, N pedidos esperando") y termina.
3. Para cada pedido (el más antiguo primero) y solo para los índices de "faltan":
   - Usa trabajosIlustr: modelo, resolución, proporción, referencias y prompts.
   - generate_image_batch con model nano_banana_pro, aspect_ratio 1:1, resolution 2k, el prompt de cada índice y
     medias = [{role: "image_references", value: <cada referencia>}]. Primero el índice 1 (página 1); en cuanto
     termine, añade su job_id como referencia extra al resto de páginas para que la mascota sea igual.
   - jobs_wait hasta que terminen. Mira cada imagen: personaje igual a la hoja, mascota coherente, sin texto,
     sin manos o caras deformes. Repite como máximo 2 imágenes por cuento; nunca más de 30 créditos por cuento.
   - POST $URL_BASE/api/admin/pedidos/<id>/ilustraciones con {"0": url, …, "12": url} (las result_url).
   - La respuesta debe traer estado "entregado" o "enviado_imprenta". Si no, anota el error en INCIDENCIAS.md.
4. No envíes correos ni mensajes: la tienda los manda sola.
5. Si no había pedidos y faltan combinaciones en la biblioteca de vistas previas (ver src/lib/ilustraciones.ts:
   hay 8 combinaciones colección × protagonista y hoy solo existen dormir-niño y ciudad-niña), genera UNA
   combinación por ejecución nocturna (entre las 2:00 y las 6:00) con datos de ejemplo inventados, guárdala en
   public/biblioteca/<coleccion>-<nino|nina>/00..12.webp (1200 px, calidad 78), haz commit en una rama y abre un PR
   hacia la rama base. Presupuesto: 26 créditos por combinación, 144 en total.
```

## B · Operación diaria

```
Operación diaria de Lunilla (proyectos/g-cuentos). Reglas: SESIONES.md. Nada sale hacia fuera sin aprobación:
los correos a clientes y afiliadas se dejan como BORRADOR en Gmail, nunca se envían.

1. Pedidos: GET $URL_BASE/api/admin/resumen?dias=1 (cabecera x-admin-token).
   - Para cada incidencia: lee el error y decide. Si es transitorio (red, timeout, imprenta caída), reintenta con
     POST /api/admin/pedidos/<id>/avanzar. Si es de datos (dirección mal, CP de Canarias), prepara un borrador de
     correo al cliente en Gmail explicando la solución (o el reembolso) y apúntalo en PARA-MOISES.md.
   - Pedidos en "ilustrando" con más de 3 horas: el taller está fallando; avísalo en PARA-MOISES.md.
   - Pedidos en "enviado_imprenta": llama a avanzar para refrescar el estado de Gelato; si lleva más de 7 días
     laborables sin enviarse, prepara borrador al cliente y revisa el pedido en Gelato.
2. Soporte: en Gmail, busca correos nuevos a hola@lunilla.es o con «Lunilla» en el asunto de las últimas 24 h.
   Para cada uno, escribe un borrador de respuesta (castellano o catalán, según el cliente). Si piden rehacer el
   cuento (garantía: una vez), prepara el cambio y déjalo indicado en el borrador.
3. Afiliadas (solo los lunes): busca 10 cuentas de maternidad o crianza nuevas (3.000–60.000 seguidores, España,
   mejor si publican en catalán) y deja en PARA-MOISES.md, sección «Mensajes para aprobar», el enlace de cada cuenta
   y el mensaje personalizado (plantillas en MARKETING.md §5). Paga a las afiliadas el día 5: lista en
   PARA-MOISES.md quién supera 20 € pendientes.
4. Contenido (martes y viernes): una página SEO nueva en content/es-ES/seo.ts o content/ca-ES/seo.ts sobre una
   búsqueda con intención de regalo que aún no tengamos, y 2 guiones de vídeo nuevos en MARKETING.md. Build limpio,
   commit en rama y PR.
5. Si no hay nada que hacer, termina sin cambios.
```

## C · Informe semanal (lunes)

```
Informe semanal de Lunilla (proyectos/g-cuentos).

1. GET $URL_BASE/api/admin/resumen?dias=7 y ?dias=30.
2. Actualiza panel/data/proyectos.json, ficha "g-cuentos": ingresosMes (ventas de los últimos 30 días en euros),
   costesMes (créditos de Higgsfield usados a 0,04 €/crédito + impresión de Gelato + Stripe), clientes, y una
   acción con la fecha y una línea de resumen. Commit y push en una rama, PR hacia la rama base.
3. Escribe el informe (máximo 12 líneas, en castellano) como borrador de Gmail para Moisés con asunto
   «Lunilla · semana del <fecha>»: vistas previas, ventas por formato, conversión, ingresos, comisiones, incidencias,
   créditos de Higgsfield restantes, y UNA recomendación concreta. Desde el 15/12 añade el seguimiento del objetivo
   (150 ventas hasta el 6/01; parada si hay menos de 40 el 31/12).
4. Si la conversión de vista previa a compra es menor del 5 % con más de 100 vistas previas, propón un cambio de la
   vista previa o del precio en el informe (no lo apliques sin aprobación).
```
