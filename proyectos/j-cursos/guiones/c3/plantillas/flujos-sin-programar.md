# Plantilla: dos flujos sin programar

Clase c3-29. Herramientas: Zapier y Make (planes gratuitos con límites) o n8n (código abierto, autoalojable; pide algo de ayuda técnica). Si necesitas un plan de pago, piensa en unos 20 euros al mes como orden de magnitud: los precios cambian, compruébalos.

**Regla:** automatiza el borrador, nunca la decisión. Lo que llega al cliente lo revisas tú.

## Antes de empezar
- [ ] He hecho la tarea a mano varias veces y he apuntado los pasos.
- [ ] Sé qué datos personales pasan por cada servicio y los he añadido a mi lista de encargados (plantilla de la clase c3-25).
- [ ] Voy a probar el flujo conmigo como cliente antes de publicarlo.

## Flujo 1: formulario web → hoja de cálculo → correo de confirmación
| Paso | Qué es | Dónde | Hecho |
|---|---|---|---|
| 1 | Formulario de solicitud | Google Forms | [ ] |
| 2 | Respuestas enlazadas a una hoja | Google Forms → Google Sheets | [ ] |
| 3 | **Disparador:** fila nueva en la hoja | Zapier o Make | [ ] |
| 4 | **Acción:** enviar correo de confirmación al cliente | Gmail | [ ] |
| 5 | Prueba con mis propios datos | — | [ ] |
| 6 | Columna de estado en la hoja: pendiente / presupuestado / aceptado | Google Sheets | [ ] |

Texto del correo (instrucción):
> Tengo [negocio] y recibo [solicitudes] por un formulario. Redacta el correo automático de confirmación. Usa los huecos [NOMBRE] y [DATO DEL FORMULARIO]. Debe agradecer, decir en cuánto tiempo respondo y [lo que el cliente debe saber]. Máximo seis líneas.

## Flujo 2: reseña nueva → borrador de respuesta
| Paso | Qué es | Dónde | Hecho |
|---|---|---|---|
| 1 | **Disparador:** correo de aviso de reseña nueva en tu ficha | Gmail (aviso de Google Business Profile) | [ ] |
| 2 | **Acción:** enviar solo el texto de la reseña (sin el nombre de quien opina) | Bloque de IA en Zapier o Make | [ ] |
| 3 | La IA redacta el borrador con tus instrucciones | Bloque de IA | [ ] |
| 4 | **Acción:** guardar el borrador en una hoja o mandártelo por correo | Google Sheets o Gmail | [ ] |
| 5 | Tú lo lees, lo corriges y lo publicas a mano | Google Business Profile | [ ] |

Instrucción para el bloque de IA:
> Eres quien responde las reseñas de [negocio] en [ciudad]. Te llega el texto de una reseña. Redacta un borrador de respuesta de tres líneas como máximo, en el idioma de la reseña. Si es positiva, agradece algo concreto. Si es negativa, pide disculpas sin dar la razón en todo e invita a hablar en persona. No ofrezcas descuentos ni inventes datos.

## Si te atascas
> Quiero montar en [Zapier / Make] este flujo: cuando [disparador], [acciones]. No sé programar. Explícame los pasos uno a uno, con los nombres de los botones si los sabes, y avísame cuando no estés seguro de algún paso.

## Mantenimiento
- [ ] Reviso cada semana que el flujo sigue funcionando (día: ________).
- [ ] Si cambio una contraseña o una hoja, vuelvo a probarlo.
