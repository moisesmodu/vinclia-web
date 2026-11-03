---
title: "Robot seguidor de línea con micro:bit: cómo funciona"
description: "Conoce los tres sensores de línea del Maqueen, qué significan el 0, el 1 y el valor de gris, y programa un robot que se para en la cinta negra o en una"
slug: robot-seguidor-de-linea-con-micro-bit-como-funciona
consulta: "seguidor de línea micro:bit"
curso: c2
clase: c2-17
---

# Robot seguidor de línea con micro:bit: cómo funciona

Empezamos la unidad 4. Nos vamos al muelle de mercancías del puerto. En el almacén nuevo, los robots llevan cajas por caminos de cinta negra pegada al suelo. Al final de la unidad montaremos un tren de mercancías que sigue la vía y se para en las estaciones. Pero hoy empezamos por lo básico. Una pregunta para pensar: ¿cómo puede saber un robot dónde está la cinta, si no tiene ojos como los nuestros?

## Recordemos y miremos al suelo

- Ultrasonidos sin eco: el bloque distancia da 500
- Hoy, otros sensores: los que miran al suelo
- Tres «ojos» pequeños bajo el morro del Maqueen
- Misión de hoy: pararse en la cinta, en el borde y en el color

Un repaso de la unidad 3. ¿Qué te dice el sensor de ultrasonidos cuando no ve ningún obstáculo? 500: no ha recibido ningún eco. Ese sensor mira hacia delante. Hoy conocerás otros que miran hacia abajo. Si das la vuelta al Maqueen, verás tres sensores pequeños bajo el morro. Son los sensores de línea. La misión de hoy tiene tres partes: pararse en la cinta negra, pararse antes del borde y pararse en una zona de color.

## Luz que rebota

- **Así no:** Negro: la luz casi no vuelve. El sensor dice 1
- **Mejor así:** Blanco: la luz rebota mucho. El sensor dice 0

Cada sensor envía luz infrarroja hacia el suelo, una luz que nuestros ojos no ven, y mide cuánta vuelve. El blanco la hace rebotar mucho, y el sensor dice 0. El negro casi no la devuelve, y el sensor dice 1. Por eso se llaman sensores de luz reflejada. ¿Por qué el negro es 1 y no al revés? Es una decisión de la librería del Maqueen: 1 quiere decir hay línea. Lo importante es saber qué significa cada número.

El Maqueen tiene tres sensores en fila: L, el izquierdo; M, el del medio; y R, el derecho. Están separados poco más de 1 centímetro, y la cinta mide 2. Así que, con el robot bien centrado, solo el M ve negro, y el panel muestra 0, 1, 0. Otra cosa importante: los sensores están unos 3,6 centímetros por delante del centro de las ruedas. Por eso, cuando el sensor toca la cinta, el centro del robot todavía no ha llegado.

Este es el primer programa: para siempre, si el sensor M ve negro, es decir, si M es igual a 1, para; si no, adelante. Es la misma idea que el robot que paraba antes del muro, pero con otro sensor. Para el vídeo y predice: ¿dónde se parará? Míralo. Avanza sobre el blanco y, al llegar a la cinta, se para. Fíjate en los sensores del robot: se encienden cuando tocan la cinta. En la app, este reto se hace a velocidad 120.

El mismo programa, pero ahora a velocidad 255. Antes de ejecutar, predice: ¿se parará en la cinta? Vamos a verlo. Llega a la cinta, frena un instante… y sigue. ¿Qué ha pasado? El robot no frena en seco, ya lo sabemos: tiene inercia. La cinta solo mide 2 centímetros, así que se la pasa antes de frenar. Y cuando el sensor vuelve a ver blanco, el «si no» lo pone otra vez en marcha. Para pararse en una línea, hay que ir despacio.

Además del 0 o el 1, cada sensor da un número de 0 a 1023: el valor de gris. El blanco da unos 90, un color como el azul o el verde da unos 360, y el negro, unos 900. ¿Para qué sirve? Con el 0 o el 1, una zona azul dice 0, igual que el blanco. Si el robot tiene que pararse en la zona azul de descarga, necesita el valor de gris. Por ejemplo: si el valor de gris de M es mayor que 200, para.

Cuidado con esta trampa: el aire también es negro. En el borde de una mesa, la luz se va al vacío y no vuelve. El sensor dice 1, como si viera cinta negra. Un 1 quiere decir que no vuelve luz: cinta negra, o el vacío. Así funcionan muchos robots aspiradores para no caerse por las escaleras. En la app hay un reto extra con una mesa sin borde. Pero en el aula no se prueba en una mesa de verdad: el robot podría caer antes de pararse.

## Sin pantalla: la prueba de la linterna

1. Busca una hoja blanca y algo bien negro
2. Con poca luz, apunta la linterna del móvil desde unos 10 cm
3. Pon la mano al lado y mira la luz que rebota
4. Prueba una hoja de color: ¿cuánta luz devuelve?

Esta prueba se hace con un adulto y la linterna del móvil. Busca una hoja blanca y algo bien negro: una cartulina, un jersey, una bolsa. Con poca luz, apunta la linterna a la hoja blanca desde unos 10 centímetros, un poco inclinada. Pon la mano al lado y verás la luz que rebota. Con el negro, vuelve mucha menos. Una hoja de color devuelve más que el negro y menos que el blanco. Esa es la idea del 360. Nunca mires directamente la linterna.

## Robot de verdad: medimos el suelo

1. Programa de medir: muestra el valor de gris del sensor M
2. Hoja blanca grande con una tira de cinta aislante negra
3. Apunta: blanco, negro, hoja de color y en el aire
4. Después, el programa de pararse a 120 y a 255

Con el Maqueen de verdad, carga en la micro:bit un programa de medir que muestre el valor de gris del sensor M. Descárgalo siempre con el interruptor apagado. Pon el robot sobre el blanco, sobre la cinta negra y sobre una hoja de color, y apunta los números en la ficha. Para medir el aire, levántalo con la mano. Tus números no se parecerán a los del simulador, y no pasa nada. Lo que cuenta es la diferencia: el negro tiene que dar mucho más que el blanco.

## Para profes: errores típicos

- Cree que el sensor ve colores: vuelve a la linterna
- Se pasa la cinta: prueba el simulador a velocidad ×1
- En la zona azul usa M = 1: mira el panel en el azul
- Falla una pista y borra todo: ¿qué número cambiar?

Para quien da la clase. Si alguien cree que el sensor ve colores como una cámara, vuelve a la linterna: solo mide cuánta luz vuelve. Si el robot se pasa la cinta, que ejecute el simulador en el modo más lento y mire dónde está el sensor cuando frena. Si en la zona azul usa M igual a 1, que mire qué dice el panel en el azul. Para la pista, usad cinta aislante negra mate. La cinta de pintor, de color beis, da valores parecidos al blanco.

## En resumen

- Blanco: vuelve mucha luz, 0. Negro o aire: poca, 1
- Valor de gris: blanco ≈90, color ≈360, negro ≈900
- Para pararse en la cinta, despacio: hay inercia
- Tu reto: el robot del muelle avisa al llegar

---

Este artículo es una clase del curso en vídeo **Crea robots con micro:bit y Maqueen para niños y profes**. Con el cupón `NUMI-C2` tienes el mejor precio: `https://www.udemy.com/course/[slug]/?couponCode=NUMI-C2`.
