# 30 instrucciones para hacer apps con IA

Curso «Vibe coding: crea apps y webs con IA sin saber programar».

**Cómo usar esta plantilla**

- Copia la instrucción, rellena lo que va entre [corchetes] y pégala en tu chat de IA (Claude, ChatGPT, Gemini u otro).
- Donde pone [ficha], pega la ficha de tu proyecto. Donde pone [archivo], pega el index.html completo.
- Cada instrucción tiene tres partes: **contexto** (qué hay), **tarea** (una sola cosa) y **límites** (qué no tocar, formato).
- Una instrucción, un cambio. Guarda una copia de la carpeta antes de cada cambio (v1, v2, v3…).
- Nunca pegues contraseñas, claves de API ni datos personales de clientes.
- Regla de oro: **la IA escribe el código, tú decides y compruebas.** Prueba siempre cada cambio.

---

## 1. Pedir: empezar un proyecto

1. Quiero hacer [qué app o web] para [quién]. No sé programar. Antes de escribir código, hazme preguntas de una en una para entender lo que necesito. Máximo [5] preguntas.
2. [ficha] Esta es la ficha de mi proyecto. Antes de escribir código, dime en cinco líneas qué harías en la primera versión y qué dudas tienes.
3. [ficha] Haz la primera versión en un solo archivo index.html, con el CSS y el JavaScript dentro. Sin librerías ni nada de internet: tiene que funcionar abriéndolo con doble clic. Textos en castellano de España.
4. [ficha] Mi idea es grande. Divídela en pasos pequeños: cada paso, algo que pueda pedirte en una instrucción y probar en cinco minutos. Solo la lista de pasos, sin código.
5. Haz solo el paso [número]: [descripción del paso]. No adelantes los siguientes.
6. Diseño: limpio y moderno, tipografía del sistema, color principal [color], mucho espacio en blanco. Que se vea bien en el móvil y en el ordenador.
7. Los datos se guardan en el navegador con localStorage, para que sigan ahí al recargar. Es una app personal: no recoge datos de otras personas.
8. Si te falta un dato, como un precio, un horario o un texto, no lo inventes: pon [PENDIENTE] y dime al final qué falta.

## 2. Iterar: cambiar sin romper

9. [archivo] Esta es la versión actual de mi app y funciona bien. Quiero un solo cambio: [cambio]. No toques nada más. Dame el archivo completo.
10. Antes de cambiar nada, explícame en tres frases qué vas a cambiar y en qué parte del archivo. Espera a que te diga que sí.
11. Mantén todo igual salvo [la parte que quieres cambiar].
12. Dame siempre el archivo completo, de principio a fin, no trozos sueltos.
13. Al final de tu respuesta, haz una lista de lo que has cambiado respecto a la versión anterior.
14. Esto se ha complicado. Deshaz el último cambio y vuelve a la versión anterior: [archivo de la versión buena].
15. Vamos a seguir en una conversación nueva. Escríbeme un resumen de la app tal como está ahora: qué hace, qué falta y qué decisiones hemos tomado, para pegarlo al empezar.
16. [ficha] [archivo] Te paso la ficha y la versión [número] de mi app, que funciona. Siguiente paso, solo este: [paso].

## 3. Depurar: cuando algo falla

17. Qué hice: [pasos]. Qué esperaba: [resultado esperado]. Qué pasa: [resultado real]. Mensaje de la consola: [mensaje o «no sale nada en rojo»]. Qué cambié por última vez: [cambio]. Explícame por qué pasa en dos frases y arréglalo cambiando solo lo necesario.
18. Pulso [botón] y no pasa nada. En la consola del navegador sale esto en rojo: [mensaje completo con la línea]. ¿Qué significa, en palabras sencillas?
19. En la versión [anterior] esto funcionaba y en la [nueva] no. Te pego las dos. Dime qué cambio lo ha estropeado: [versión anterior] [versión nueva].
20. No me des el arreglo todavía. Dime tres posibles causas de este fallo, de la más probable a la menos, y qué prueba puedo hacer yo para saber cuál es: [descripción del fallo].
21. Tu arreglo no ha funcionado. Sigue pasando esto: [lo que pasa ahora]. Antes de probar otra cosa, explícame qué crees que está pasando.
22. Añade mensajes en la consola (console.log) en los puntos clave de [función o botón] para ver qué está pasando. Dime qué tengo que mirar.
23. En el ordenador funciona, pero en el móvil [qué pasa]. Lo pruebo en [navegador y móvil]. ¿Qué puede ser y cómo lo arreglo sin estropear la versión de ordenador?

## 4. Pulir: que quede profesional

24. Revisa mi app como lo haría alguien que la usa por primera vez. Dime cinco cosas que le confundirían y cómo arreglarlas. No cambies el código todavía.
25. Mejora el diseño sin cambiar cómo funciona: espaciado, tamaños de letra y contraste. Que los botones se puedan pulsar bien con el dedo.
26. Revisa los textos de la app: castellano de España, frases cortas, sin faltas, de tú. Hazme una tabla con el texto actual y el propuesto.
27. ¿Qué pasa si [caso raro: lista vacía, un texto muy largo, un número negativo, pulsar dos veces]? Pruébalo mentalmente y dime si mi app lo aguanta. Si no, arréglalo.
28. Revisa la accesibilidad: contraste de colores, que se pueda usar con el teclado y que las imágenes y botones tengan texto alternativo. Arréglalo sin cambiar el diseño.
29. Revisa el código como lo haría un programador con experiencia. Dime, en palabras sencillas, si hay algo inseguro, alguna clave o dato que se vea desde el navegador, o algo que vaya a dar problemas cuando haya más datos.
30. Escribe un archivo LEEME de diez líneas como máximo: qué hace la app, cómo abrirla y qué versión es. Para que lo entienda yo dentro de seis meses.
