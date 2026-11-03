# Checklist: cuando algo falla

Curso «Vibe coding: crea apps y webs con IA sin saber programar».

Que algo falle es normal. Les pasa a los programadores todos los días. Lo que marca la diferencia es cómo se lo cuentas a la IA.

---

## Antes de escribir a la IA: lo básico (1 minuto)

- [ ] ¿Has guardado el archivo nuevo que te dio la IA? ¿Entero, sin que falte el final?
- [ ] ¿Estás abriendo la versión correcta? Mira la barra de direcciones: carpeta y nombre del archivo.
- [ ] ¿Has recargado la página? (Tecla F5, o Comando y R en Mac.)
- [ ] ¿Funciona en otra versión anterior? Si en la v1 iba bien y en la v2 no, el fallo está en el último cambio.

## Abre la consola del navegador (1 minuto)

- En Chrome o Edge, con Windows o Linux: pulsa **F12** y elige la pestaña **Consola** (o Console).
- Atajo directo a la consola: **Control, Mayúsculas y J**. En Mac: **Comando, Opción y J**.
- También: clic derecho en la página, **Inspeccionar**, pestaña **Consola**.
- Repite lo que falla (pulsa el botón otra vez) con la consola abierta.
- Busca líneas en **rojo**. Copia el texto entero: el mensaje y la línea de debajo, que dice el archivo y el número de línea.
- Si no sale nada en rojo, no pasa nada: también es una pista. Dilo así.

## Lo que copias a la IA

Rellena y pega esto en el chat, en la misma conversación donde se hizo la app (o en una nueva, con la ficha y el archivo).

> **Qué hice:** [los pasos exactos. Ejemplo: abro la app, tengo Tomates, Pan y Leche, pulso Borrar en Tomates]
>
> **Qué esperaba:** [Ejemplo: que desapareciera Tomates]
>
> **Qué pasa:** [Ejemplo: desaparece Leche y Tomates sigue ahí]
>
> **Mensaje de la consola:** [pégalo tal cual, o escribe «la consola no muestra nada en rojo»]
>
> **Qué cambié por última vez:** [Ejemplo: le pedí que lo último añadido saliera arriba]
>
> **Qué te pido:** Explícame en dos frases sencillas por qué pasa. Después arréglalo cambiando solo lo necesario y dame el archivo completo.

## Después del arreglo

- [ ] Guarda el archivo nuevo en una carpeta nueva (v2, v3…). No machaques la versión que funcionaba.
- [ ] Repite exactamente la prueba que fallaba.
- [ ] Repite también las pruebas de tu ficha: a veces un arreglo estropea otra cosa.
- [ ] Apunta en tus notas qué falló y cómo se arregló.

## Si la IA da vueltas sin arreglarlo

- Tras dos o tres intentos sin éxito, para.
- Vuelve a la última versión que funcionaba (por eso guardas copias).
- Abre una conversación nueva: pega la ficha, el archivo bueno y el fallo descrito con esta checklist.
- Pide que te explique primero qué cree que pasa, antes de tocar nada.
- Divide: pide un cambio más pequeño.
- Si la app maneja pagos, datos de clientes o muchos usuarios y el fallo persiste, es momento de llamar a un programador.

## Nunca pegues en el chat

- Contraseñas, claves de API ni códigos de acceso.
- Datos personales de clientes (nombres, teléfonos, correos, DNI).
- Si el mensaje de error contiene alguno de esos datos, sustitúyelo por [OCULTO] antes de pegarlo.
