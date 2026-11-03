---
title: "Cómo hacer un videojuego en Scratch con tu hijo"
description: "Tu hijo o tu hija añade variables al juego (puntos y vidas), programa el fin de partida y construye «Atrapa la fruta» con un plan en papel y por trozos."
slug: como-hacer-un-videojuego-en-scratch-con-tu-hijo
consulta: "videojuego Scratch niños"
curso: c1
clase: c1-23
---

# Cómo hacer un videojuego en Scratch con tu hijo

Esta es la clase del juego terminado. Vamos a añadir a la manzana de la clase anterior tres cosas que tiene cualquier videojuego: un marcador de puntos, unas vidas y un fin de partida. Y lo vamos a montar como lo hace un estudio de verdad, con un plan en papel y por trozos. Las variables ya salieron en la semana 3, con el contador de Bit. Aquí tendrán nombre propio y se verán en pantalla. Reserva dos tardes: una para el marcador y otra para el juego entero.

## Las variables en Scratch

| Tech Creadores | Scratch |
|---|---|
| pon puntos a 0 | fijar puntos a 0 |
| suma a puntos 1 | cambiar puntos por 1 |
| suma a vidas -1 | cambiar vidas por -1 |
| si vidas = 0 | si vidas = 0 entonces |
| para todo | detener todos |

En Scratch, las variables están en la categoría Variables, en naranja oscuro. Primero hay que crearla con el botón «Crear una variable» y ponerle nombre, por ejemplo, puntos. Al crearla, aparece en el escenario un marcador con su valor. «Fijar a» da un valor nuevo y «cambiar por» le suma. Para restar no hay bloque: se suma un número negativo. El signo igual está en Operadores, y «detener todos», al final de Control. Cuando cree la variable, que elija «para todos los objetos»: así la manzana y la cesta la pueden usar.

## Sin pantalla: tres variables y una papelera

1. Una hoja con puntos, errores y racha, todos a 0
2. Bola que entra: puntos más 2 y racha más 1
3. Bola que cae fuera: errores más 1 y racha a 0
4. Antes de cada tiro, alguien predice el marcador
5. Después de 10 tiros: ¿cuál ha sido la racha más larga?

Empezad con el marcador de papel. Una papelera, unas bolas de papel blandas y una hoja con tres nombres: puntos, errores y racha, todos a cero. Si la bola entra, puntos sube dos y racha sube uno. Si cae fuera, errores sube uno y racha vuelve a cero. Antes de cada lanzamiento, alguien dice cómo quedará el marcador si entra y si falla. Fijaos en algo importante: la racha se pone a cero, y los puntos se suman. Cada variable tiene sus reglas, y esa diferencia es justo la de los dos bloques de Scratch.

Aquí se ve el marcador en acción. Al empezar, puntos vale cero, y cada toque a la moneda le suma uno. Después, plantea una predicción con trampa que sale de la propia sesión. Fijar puntos a cero, sumar 2, sumar 2, fijar a 10 y sumar menos 1. ¿Cuánto vale? La respuesta es 9, porque «fijar a 10» borra lo que había. Otro detalle: si quiere que un personaje diga los puntos, tiene que meter la variable dentro del «decir». Si escribe la palabra, el personaje dirá «puntos» y no el número.

## Vidas y fin de partida

- «Fijar vidas a 3» una sola vez, antes del bucle
- En cada choque: «cambiar vidas por -1» y esperar 1 segundo
- Si vidas = 0: «¡Fin de la partida!» y «detener todos»
- Sin la espera, un solo choque quita todas las vidas

Las vidas son otra variable, pero que baja. Empieza en 3, y en cada choque se le resta una. Aquí hay un detalle que sorprende a todos. Mientras un objeto atraviesa al personaje, lo toca durante muchos fotogramas, y en cada vuelta resta una vida. Por eso, después de restar, hay que esperar un segundo. Para el final, un «si vidas es igual a 0» dentro del bucle, con un mensaje y «detener todos». Y un truco de la guía para los signos: la boca abierta del mayor que y del menor que mira siempre al número más grande.

Esta diapositiva muestra el error estrella de la sesión. «Fijar vidas a 3» está dentro del «por siempre», así que en cada vuelta las vidas vuelven a 3 y la partida no se acaba nunca. Pídele que lo encuentre antes de que se lo digas. La pregunta de la guía es muy buena: este bloque, ¿cuántas veces se tiene que hacer? Que siga el bucle con el dedo y diga el valor de vidas en cada vuelta. El mismo razonamiento sirve para «fijar puntos a 0»: va al principio, con la bandera verde, y no en cada acierto.

## El plan del juego, en papel

1. Quién hay: una cesta, una manzana y una roca
2. La cesta: flechas con «cambiar x por 20» o por -20
3. Manzana: si toca la cesta, puntos más 1 y vuelve arriba
4. Si llega abajo: vuelve arriba y vidas menos 1
5. Si la roca toca la cesta: «¡Pam!» y «detener todos»

Ahora, el proyecto. Antes de programar se hace el plan en papel, con la ficha de los recursos: qué personajes hay, cómo se mueve cada uno y qué reglas tiene. Cada regla empieza por «si». La versión de Creadores tiene una cesta, una manzana, un plátano y una roca que lo acaba todo. Pregúntale en qué personaje va cada regla. Si la manzana tiene que volver arriba, la regla va en la manzana, no en la cesta. Con el plan hecho, programar es mucho más fácil, y tú tienes algo concreto que revisar con él.

## Construir a trozos

- **Así no:** Lo programo todo de golpe y lo pruebo al final
- **Mejor así:** Programo un trozo, lo pruebo, lo arreglo y paso al siguiente

La regla de oro del proyecto es construir a trozos. Primero, la cesta con las flechas, y se prueba. Después, la manzana que cae, y se prueba. Luego las reglas, una a una. Si lo programa todo de golpe y falla, no sabrá dónde está el error. Cuando se atasque, la guía propone dejar quieto un personaje y probar solo otro: si funciona, se añade el siguiente. En Scratch, para que la manzana sepa cuándo ha llegado abajo, usad la condición de la clase anterior, la de menor que menos 150. Si un trozo no sale hoy, no pasa nada: se termina otro día.

Así queda el juego terminado en Creadores. Miradlo juntos y pregúntale qué reglas ve: es el mejor ejercicio para preparar el plan. Cuando su versión en Scratch funcione, llega tu papel favorito: hacer de tester. El tester es la persona que prueba un videojuego para encontrarle errores e ideas. Primero te explica las reglas sin tocar nada. Luego juegas sin que te ayude, y él mira dónde te atascas. Al final le dices una cosa que te ha gustado y una idea para mejorar. Él elige si la programa.

## En resumen

- Variable: un número con nombre que se ve en el marcador
- Fijar al principio; cambiar en cada acierto o choque
- Después de un choque, esperar un segundo
- Plan en papel, construir a trozos y tester al final
- Hoy: la papelera y el juego Atrapa la fruta

---

Este artículo es una clase del curso en vídeo **Enseña a programar a tu hijo con Scratch: guía para padres**. Con el cupón `NUMI-C1` tienes el mejor precio: `https://www.udemy.com/course/[slug]/?couponCode=NUMI-C1`.
