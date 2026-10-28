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
   - Usa trabajosIlustr: modelo, resolución, paginas (18 o 22), hoja, referencias y prompts (cada uno con su
     proporción: portada 1:1, páginas 3:2).
   - Si "faltan" empieza por "hoja": genera primero la hoja de personaje del pedido (trabajosIlustr.hoja.prompt,
     1:1, con sus referencias) y revísala (tres vistas del mismo niño, sin texto). En el resto del pedido, cambia
     la referencia "HOJA_DEL_PEDIDO" por el job_id de esa hoja. Entrega su URL con la clave "hoja".
   - generate_image_batch (máx. 12 por lote) con model nano_banana_pro, resolution 2k, aspect_ratio de cada prompt
     y medias = [{role: "image_references", value: <cada referencia>}]. Primero el índice 1 (página 1); en cuanto
     termine, añade su job_id como referencia extra al resto de páginas para que la mascota sea igual.
   - jobs_wait hasta que terminen. Mira cada imagen: personaje igual a la hoja, mascota coherente, sin texto,
     sin manos o caras deformes. Repite como máximo 3 imágenes por cuento; nunca más de 56 créditos por cuento
     (hoja 2 + portada 2 + 22 páginas × 2 = 48, más repeticiones).
   - POST $URL_BASE/api/admin/pedidos/<id>/ilustraciones con {"hoja"?: url, "0": url, …, "N": url} (las result_url;
     se admiten entregas parciales).
   - La respuesta debe traer estado "entregado" o "enviado_imprenta" cuando ya están todas. Si no, anota el error
     en INCIDENCIAS.md.
4. No envíes correos ni mensajes: la tienda los manda sola.
5. Si no había pedidos y faltan combinaciones en la biblioteca de vistas previas (ver src/lib/ilustraciones.ts:
   hay 16 combinaciones colección × edad × protagonista y hoy solo existen dormir-peques-niño y, a medias,
   ciudad-mayores-niña), genera UNA combinación por ejecución nocturna (entre las 2:00 y las 6:00) con datos de
   ejemplo inventados y solo la portada y las páginas 1 a 3 (lo que enseña la vista previa: 8 créditos). Guárdala en
   public/biblioteca/<coleccion>-<peques|mayores>-<nino|nina>/00..03.webp (portada 1200×1200, páginas 1200×800,
   calidad 78), haz commit en una rama y abre un PR hacia la rama base. Presupuesto: 8 créditos por combinación,
   120 en total. Antes, completa las 10 páginas que faltan de la muestra de Martina (20 créditos; ver
   content/muestras/la-martina-i-els-secrets-de-lleida.json → "ilustradas", y scripts/generar-muestras.ts: ficheros
   datos-locales/originales/martina/nNN.png).
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
