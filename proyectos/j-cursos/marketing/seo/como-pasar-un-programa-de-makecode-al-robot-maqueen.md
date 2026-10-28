---
title: "Cómo pasar un programa de MakeCode al robot Maqueen"
description: "Pasa tu programa del simulador al Maqueen de verdad con MakeCode: descargar con el robot apagado, emparejar la micro:bit, el camino alternativo si la red"
slug: como-pasar-un-programa-de-makecode-al-robot-maqueen
consulta: "MakeCode Maqueen"
curso: c2
clase: c2-04
---

# Cómo pasar un programa de MakeCode al robot Maqueen

Un programa que funciona en el simulador es un gran paso. Pero lo emocionante es verlo moverse en el suelo. En esta clase aprendes a pasar el programa a la micro:bit del Maqueen con MakeCode, el editor gratuito de la micro:bit. Veremos el camino rápido, el camino alternativo si la red no deja, y qué hacer cuando el robot no responde. Ten a mano el robot, el cable USB y un ordenador.

Este es el camino del programa. Desde el simulador, el botón MakeCode abre tu programa en bloques. Conectas la micro:bit con el cable USB. Pulsas Descargar. Y el programa pasa a la micro:bit, que es el cerebro del robot. Fíjate en un detalle: en MakeCode, los bloques del Maqueen salen en inglés, por ejemplo motor, pause o read line sensor. Son los mismos que en el simulador.

## El camino rápido, en cinco pasos

1. Cuando funcione en el simulador, pulsa MakeCode
2. Comprueba tus bloques: los del Maqueen, en inglés
3. Robot apagado: conecta la micro:bit por USB
4. Pulsa Descargar y espera a que termine
5. Cable fuera, robot en el suelo y enciéndelo

Paso a paso. Cuando el programa ya funciona en el simulador, pulsa el botón MakeCode. Se abre MakeCode dentro de Numi Tech, con tu programa y la extensión del Maqueen ya añadida. Comprueba que están tus bloques. Con el robot apagado, conecta la micro:bit al ordenador. Pulsa Descargar y espera: la luz de la micro:bit parpadea mientras se copia. Después, cable fuera, robot en el suelo y enciéndelo.

## La primera vez: emparejar

- Con Chrome o Edge, MakeCode pide emparejar la micro:bit
- Elígela en la lista y acepta
- Otros navegadores: se descarga un archivo .hex
- Arrastra el .hex a la unidad MICROBIT
- Con iPad no se puede por cable: usa un ordenador

La primera vez hay un paso más. Con Chrome o Edge, MakeCode te pide emparejar la micro:bit. Elígela en la lista y acepta. A partir de ahí, Descargar la programa directamente. Con otros navegadores, se descarga un archivo punto hex. Lo arrastras a la unidad que se llama MICROBIT, como si fuera un lápiz de memoria. Y con iPad no se puede descargar por cable: usa un ordenador con Windows, Mac, Linux o un Chromebook.

## Si la red bloquea MakeCode

1. En la app: Mostrar el código y Copiar el código
2. Abre makecode.microbit.org y crea un proyecto
3. Extensiones: busca maqueen y añádela
4. Pestaña JavaScript: borra todo y pega
5. Vuelve a Bloques y pulsa Descargar
6. Luces de debajo: añade neopixel, pin P15

A veces la red del colegio bloquea la página y MakeCode se queda cargando. Hay un camino alternativo. En la aplicación, pulsa Mostrar el código y Copiar el código. Busca MakeCode micro:bit en Google y crea un proyecto nuevo. Ve a Extensiones, busca maqueen y añádela. Abre la pestaña JavaScript, borra todo lo que hay y pega tu código. Vuelve a Bloques y descarga. Para las luces de debajo del robot, añade también la extensión neopixel, en el pin P quince.

¿Qué es ese texto que has pegado? Es JavaScript, un lenguaje de programación escrito con texto. Cada bloque tiene su línea. El bloque motor los dos adelante a velocidad 150 se escribe con la palabra motorRun, la palabra All, que quiere decir los dos, y CW, que quiere decir adelante. Atrás sería CCW. Son dos maneras de escribir lo mismo. Si vuelves a Bloques, MakeCode te enseña los bloques equivalentes.

Ahora, una pregunta para pensar. El robot real no siempre hace lo mismo que el simulador: las pilas, el suelo y los motores cambian un poco el resultado. Este robot avanza hasta que el sensor del medio encuentra una cinta. Predice: si las pilas estuvieran medio gastadas, ¿se pararía en la cinta o antes? Mira. Se para en la cinta, porque decide el sensor y no el tiempo. Lo verás en la unidad 4. De momento, en las unidades 1 y 2 calibraremos tiempos.

## Tu primera prueba en el suelo

1. Marca una línea de salida con cinta de pintor
2. Centro de las ruedas sobre la salida
3. Descarga: adelante a 150 durante 2000 ms y para
4. Mide hasta el centro de las ruedas
5. Compara con el simulador: unos 31 cm

Hagamos la primera prueba. Marca en el suelo una línea de salida con cinta de pintor y pega al lado una cinta métrica, con el cero en la línea. Pon el robot con el centro de las ruedas sobre la salida. Descarga un programa de 2 segundos a velocidad 150 y para. Mide siempre hasta el centro de las ruedas. En el simulador hace unos 31 centímetros. El tuyo hará algo parecido, pero no idéntico. Apunta el número: lo usarás muy pronto.

## Si algo falla

| Qué pasa | Qué revisar |
|---|---|
| MakeCode se queda cargando | La red: usa Copiar el código |
| Los bloques salen en rojo | Falta la extensión maqueen |
| El robot no hace nada | Interruptor, pilas y descarga |
| La micro:bit muestra una cruz | No encuentra la placa del robot |

Los problemas más típicos tienen solución rápida. Si MakeCode se queda cargando, es la red: usa el camino de copiar el código. Si los bloques salen en rojo, falta la extensión maqueen. Si el robot no hace nada, revisa el interruptor, las pilas y que la descarga haya terminado. Al principio del programa hay un bloque que conecta la micro:bit con la placa del Maqueen. Si no la encuentra, muestra una cruz. Cuando la encuentra, una marca de acierto.

## Seguridad y privacidad

- Se descarga con el robot apagado
- Al descargar, el programa empieza solo
- Solo se envía el programa: ningún dato del alumno
- No hace falta registrarse en MakeCode

Dos cosas más. Al terminar la descarga, el programa empieza solo. Por eso el robot debe estar apagado, o en la mano con las ruedas en el aire, nunca al borde de una mesa ni colgando del cable. Y sobre privacidad: MakeCode es un servicio de Microsoft, hecho para la Micro:bit Educational Foundation. Desde Numi Tech solo se envía el programa del robot: ningún nombre, ninguna cuenta. Si eres profe y la red filtra webs, pide que permitan MakeCode.

## En resumen

- Botón MakeCode, cable USB y Descargar
- Robot apagado al descargar; cable fuera al encender
- La primera vez, emparejar con Chrome o Edge
- Si la red bloquea: copiar el código y extensión maqueen

---

Este artículo es una clase del curso en vídeo **Crea robots con micro:bit y Maqueen para niños y profes**. Con el cupón `NUMI-C2` tienes el mejor precio: `https://www.udemy.com/course/[slug]/?couponCode=NUMI-C2`.
