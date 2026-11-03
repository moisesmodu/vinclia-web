---
title: "Cómo hacer que un robot se pare antes de un obstáculo"
description: "Programa un Maqueen que se para solo delante de una caja, esté donde esté, con «si… si no» dentro de «para siempre», y ajusta el umbral según la"
slug: como-hacer-que-un-robot-se-pare-antes-de-un-obstaculo
consulta: "sensor ultrasonidos micro:bit"
curso: c2
clase: c2-14
---

# Cómo hacer que un robot se pare antes de un obstáculo

Hoy damos el gran salto de la unidad. Hasta ahora, el robot obedecía tiempos fijos. A partir de esta clase, decide solo. En el puerto, el Maqueen tiene que pararse a unos 10 centímetros de un contenedor, para que la grúa deje el paquete. Pero la grúa lo deja cada noche en un sitio diferente. Con tiempos fijos no funciona. Necesitamos un robot que mire, piense y elija cuándo se para.

## Recordemos

- El sensor mide la distancia con el eco, en centímetros
- 500 quiere decir que no ve nada
- «Para siempre» repite los bloques sin parar
- Hoy: ¿cómo sabrá el robot cuándo pararse?

Un repaso rápido de la clase anterior. El sensor de ultrasonidos mide la distancia con el eco y nos la da en centímetros. Si dice 500, no ve nada. Y si queremos que vuelva a medir sin parar, los bloques van en «para siempre». Con estas tres piezas ya casi lo tenemos. Solo nos falta una: un bloque que haga una pregunta y, según la respuesta, haga una cosa u otra.

## «Si… si no»: una pregunta, dos caminos

- Pregunta: ¿la distancia es menor que 15?
- Si es que sí: para el motor
- Si no: motor los dos adelante
- Nunca hace las dos cosas a la vez

El bloque «si» hace una pregunta de sí o no. Por ejemplo: ¿la distancia es menor que 15? Si la respuesta es sí, hace los bloques de dentro: para el motor. Si es no, hace los de la parte «si no»: adelante. Nunca hace las dos cosas a la vez. A esta pregunta la llamamos condición. Y el número que comparamos, aquí 15, se llama umbral: el punto donde el robot cambia lo que hace. En MakeCode, la parte «si no» se añade con el botón más de debajo del bloque.

Aquí tienes el programa: para siempre, si la distancia es menor que el umbral, para; si no, adelante. Fíjate en que no hay ninguna espera. Para el vídeo y predice: ¿dónde se parará? Ahora, míralo. En cada vuelta de «para siempre», el robot pregunta: ¿ya estoy? Lejos, la respuesta es no, y avanza. Al llegar al umbral, la respuesta es sí, y se para. Decide el sensor, no el reloj. Y si quitas la caja, vuelve a arrancar, porque «para siempre» sigue preguntando.

Mismo programa, con una sola diferencia: el «si» está en «al iniciar». Antes de ejecutar, predice: ¿se parará delante de la caja? Piensa cuántas veces se hace la pregunta. Vamos a verlo. El «si» pregunta una sola vez, al principio. En ese momento la caja está lejos, así que dice adelante. Ya no vuelve a preguntar nunca más, y el robot choca. Es como preguntar ¿ya llegamos? solo al salir de casa. Dentro de «para siempre», la pregunta se repite muchas veces cada segundo.

Un truco para no liarse con los signos de comparar. El signo menor que y el signo mayor que parecen una boca abierta. La boca siempre se abre hacia el número más grande. Ocho es menor que quince. Cuarenta es mayor que quince. Si giras el signo sin querer, el robot hace cosas raras: no se mueve, o no se para nunca. Para comprobarlo, lee la condición con un número de verdad: ¿60 es menor que 12? No, así que avanza. Tiene sentido al principio del camino.

Ahora hemos puesto «muestra el número distancia» dentro del bucle, por si acaso. Predice: ¿se parará a tiempo? Míralo. Cada número tarda casi un segundo en pasar por la pantalla. Mientras sale, el robot no vuelve a preguntar. Cuando por fin se da cuenta de que la caja está cerca, ya es tarde, y choca. La regla es sencilla: dentro del bucle, solo lo que el robot tiene que vigilar. El número, cuando ya está parado. Lo mismo pasa con una espera larga dentro del «si».

El robot no frena en seco. Cuando el programa dice para, los motores se paran, pero el robot todavía se desliza un poco. Eso es la inercia. Cuanto más deprisa va, más se desliza. Por eso, si va rápido, hay que decidir antes: un umbral más grande. En la app hay un reto extra: aparcar en menos de 4 segundos a velocidad 255, quedando entre 6 y 14 centímetros de la caja. Pasa lo mismo con los coches: cerca de los obstáculos, más despacio.

## Sin pantalla: mide y elige el umbral

1. Cinta métrica en el suelo, con el 0 tocando la pared
2. Empuja un coche de juguete; al pasar el 15, «¡para!» y suelta
3. Mide cuántos centímetros ha resbalado
4. Prueba umbrales de 10, 15 y 20, y más deprisa

Esta actividad se hace con alguien de casa, una cinta métrica y un coche de juguete o una pelota. Extended la cinta con el cero tocando la pared. Una persona empuja el coche. La otra, cuando pasa del 15, dice para, y se suelta. Medid dónde se ha parado. Probad umbrales de 10, 15 y 20 centímetros, y también más deprisa. ¿Con cuál queda a unos 10 centímetros sin tocar la pared? Acabáis de descubrir el número del «si».

## Robot de verdad: se para solo

1. Descarga con el interruptor apagado
2. Robot en el suelo, nunca en la mesa: ahora se mueve
3. Caja rígida a 40, 60 y 80 cm: el mismo programa
4. Mide dónde se para; luego prueba a 255

Con el Maqueen de verdad, el programa es el mismo: para siempre, si distancia menor que 12, para; si no, adelante a 150. En los imprimibles lo tienes en bloques de MakeCode. Descárgalo con el robot apagado y enciéndelo ya en la línea de salida, sin cable. Pon una caja rígida de al menos 15 centímetros de alto a 40, 60 y 80 centímetros. No pongáis manos ni pies delante para hacerlo parar. Si no se para justo donde en el simulador, es normal: mide y ajusta el número.

## Para profes: errores típicos

- El «si» en «al iniciar»: ¿cuántas veces pregunta?
- Signo girado: léelo con un número real
- Falta el «si no»: ¿qué bloque lo hace avanzar?
- Una espera «para que vaya mejor»: ¿qué hace el sensor?

Para quien da la clase, cuatro errores que verás seguro. El «si» en «al iniciar»: pregunta cuántas veces se hace la pregunta. El signo girado: que lea la condición con un número real. El robot que no arranca porque falta el «si no»: pregunta qué bloque lo hace avanzar cuando la caja está lejos. Y la espera dentro del «si»: pregunta qué hace el sensor mientras el robot espera. En el reto de las 3 pistas, si alguien usa esperas, deja que la segunda pista le enseñe el problema.

## En resumen

- «Si… si no»: una pregunta, dos caminos
- Dentro de «para siempre», pregunta muchas veces y para a tiempo
- Más velocidad, umbral más grande
- Tu reto: el robot del muelle, entre 5 y 18 cm

---

Este artículo es una clase del curso en vídeo **Crea robots con micro:bit y Maqueen para niños y profes**. Con el cupón `NUMI-C2` tienes el mejor precio: `https://www.udemy.com/course/[slug]/?couponCode=NUMI-C2`.
