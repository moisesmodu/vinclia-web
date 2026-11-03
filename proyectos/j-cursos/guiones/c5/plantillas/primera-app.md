# Tu primera app con IA: las tres instrucciones

Curso «Vibe coding: crea apps y webs con IA sin saber programar». Clase 1.

**Qué necesitas**

- Un chat de IA con plan gratuito: Claude, ChatGPT o Gemini.
- Un navegador (Chrome, Edge, Firefox o Safari).
- Una carpeta llamada `propinas` con tres subcarpetas: `v1`, `v2` y `v3`.

**Regla de oro:** la IA escribe el código, tú decides y compruebas.

---

## Instrucción 1. La versión mínima

> Hazme una página web en un solo archivo HTML, con el CSS y el JavaScript dentro. Es una calculadora para dividir la cuenta de un restaurante entre amigos. Campos: total de la cuenta, porcentaje de propina y número de personas. Un botón Calcular que muestre cuánto paga cada uno. Textos en castellano.

Guarda el código como `propinas/v1/index.html` y ábrelo con doble clic.

**Comprueba:** 86,40 € de cuenta, 10 % de propina y 4 personas dan 23,76 € por persona.

## Instrucción 2. Bonita, cómoda y sin valores absurdos

> Funciona. Ahora hazla bonita y cómoda en el móvil: una tarjeta centrada, color verde azulado, botones rápidos de propina de 0, 5, 10 y 15 %, botones + y − para las personas y que calcule sola al escribir. Añade una opción para redondear hacia arriba lo que paga cada uno y muestra lo que sobra para el bote. Importes en euros con coma decimal. Que no se pueda poner 0 personas.

Guarda como `propinas/v2/index.html`.

**Comprueba:** con redondeo, 4 personas pagan 24,00 € y sobran 0,96 € para el bote. El contador no baja de 1.

## Instrucción 3. Nombres y resumen para WhatsApp

> Perfecto. Ahora quiero apuntar quién viene: un campo para escribir un nombre, un botón Añadir y una lista donde pueda quitar a cada persona. El número de personas sale de la lista. Añade un campo para el nombre del plan y un botón «Copiar resumen para WhatsApp» que copie un texto corto con el total, la propina, quién viene y cuánto paga cada uno. No cambies nada más.

Guarda como `propinas/v3/index.html`.

**Comprueba:** añade tres nombres, quita uno y mira que el importe cambia. Pulsa «Copiar» y pega el texto en una nota del móvil.

---

## Casos raros que debes probar en cada versión

| Prueba | Qué debería pasar |
|---|---|
| Total vacío | 0,00 €, nunca «NaN» |
| 0 personas | No se puede |
| Importe con coma: 86,40 | Lo entiende igual que 86.40 |
| En el móvil | Se ve entero, sin moverse de lado |

## Si algo falla

1. Abre la consola del navegador (F12, pestaña Consola).
2. Copia el error en rojo tal cual.
3. Pégalo en el chat: «Me sale este error: [error]. Arréglalo y no cambies nada más».
4. Guarda la versión arreglada en una carpeta nueva.

En los recursos tienes también el código de las tres versiones de ejemplo, para compararlas con las tuyas.
