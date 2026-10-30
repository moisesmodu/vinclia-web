# Catálogo · producción a escala (web + Roblox)

> **Cambio del 28/10/2026 (Moisés: "hay que crear muchos juegos y monetizarlo todo").** El ritmo pasa de 1 juego cada
> 2 semanas a **2 juegos web por semana** y **1 experiencia de Roblox al mes**. Cada juego se publica en todos los
> canales que pagan (tabla de canales abajo). En curso hoy: Bike Flip, Snow Plow, Rocket Hop y Jelly Stack (web) y
> Egg Truck Tycoon (Roblox).

## Canales de ingresos de cada juego web (todos, en este orden)
| Canal | Cómo paga | Exclusividad | Qué hace falta |
|---|---|---|---|
| CrazyGames | 50–70 % de la publicidad del SDK | No | Cuenta de desarrollador (Moisés) y subir el zip |
| Poki | 50 % (100 % del tráfico propio) | Sí, web | Aceptación manual; si piden exclusiva, se decide juego a juego |
| GameDistribution | Reparto de publicidad de su SDK, distribución a miles de webs | No | Otro adaptador en `comun/portal.ts` (pendiente) |
| GameMonetize / GamePix | Reparto de publicidad | No | Adaptador por portal (pendiente) |
| itch.io | Donaciones / pago opcional | No | Zip |
| Web propia (Vercel) | AdSense for Games (H5 Games Ads) | — | Cuenta de AdSense |
| Google Play (TWA) | AdMob | — | Cuenta de Play y AdMob (ola 3) |
| Licencias no exclusivas | 300–800 $ por juego | No | Cuando haya 3 juegos con datos |

Regla: los juegos que Poki acepte en exclusiva salen de los portales web no exclusivos; el resto va a todos.

## Roblox: catálogo propio (1 al mes)
| # | Experiencia | Género | Gancho |
|---|---|---|---|
| R1 | Egg Truck Tycoon | Tycoon + conducción | Granja de huevos y entregas frágiles por pistas generadas |
| R2 | Jelly Tower Obby | Obby por niveles | Plataformas de gelatina que rebotan y se encogen al pisarlas |
| R3 | Snow Plow Simulator | Simulador de temporada (diciembre) | Quitar nieve del pueblo, mejorar la máquina, mascotas de nieve |
| R4 | Rocket Hop Tycoon | Tycoon espacial | Base lunar que crece; cohetes que se pilotan con un botón |

## Próximos por datos de los líderes (29/10/2026, ver `IDEAS-LIDERES.md`)
Orden actualizado: primero las mecánicas con más partidas en Poki y CrazyGames que aún no tenemos.

| # | Juego | Inspirado en | Mecánica (una) | Gancho propio |
|---|---|---|---|---|
| 6 | **Hook Hop** | Stickman Hook | Mantener = engancharse a la liana; soltar = salir disparado | Un mono que recoge plátanos en el aire; lianas que se rompen |
| 7 | **Trick Floor** | Level Devil | Flechas o toques para moverse y saltar | Castillo de gelatina donde el suelo, los pinchos y la meta engañan; reintento instantáneo |
| 8 | **Lane Dash** | Subway Surfers | Deslizar izquierda, derecha, arriba | Carrito de supermercado por pasillos; ofertas que dan turbo |
| 9 | **Fruit Stand** | Monkey Mart | Mover el personaje con el dedo | Puesto de fruta que crece a mercado; ayudantes que no se duermen |
| 10 | **Paint Grab** | Paper.io 2 | Dibujar con el dedo para conquistar | Pintar el patio del colegio contra bots; partidas de 2 min |
| 11 | **Penalty Season** | Retro Bowl | Un gesto para tirar el penalti | Temporada de liga y plantilla entre partidos |

Roblox: **Jelly Pets** (coleccionar, fusionar y llevarse gelatinas; la categoría que más crece) pasa delante del obby.

Criterios: una mecánica, sin texto, partidas de 1 a 3 minutos (salvo los dos de gestión, que prueban sesiones largas
como el líder Monkey Mart), ratón y táctil, menos de 8 MB. Mezcla de géneros por datos:
- **Coches tipo plataforma** en Poki: 7 % de los títulos, 30 % de las partidas (informe de Poki, 29/09/2026). Se
  reutiliza el motor de Egg Truck, así que estos juegos salen más baratos.
- **Hipercasual** (78,8 % del tiempo de juego en CrazyGames, abril de 2026) y **puzle** (20,6 %).
- **Gestión e idle**: demanda alta y poca oferta en web (hallazgo del panel y del análisis de Monkey Mart).

Regla de JUICIO.md: nunca se para por un juego. A los 6 juegos se revisa el catálogo; si ninguno pasa del lanzamiento
básico en CrazyGames, se cambia el reparto de géneros hacia lo que mejor haya retenido.

| # | Juego | Género | Mecánica (una) | Gancho que lo distingue | Reutiliza | Fecha prevista |
|---|---|---|---|---|---|---|
| 2 | **Bike Flip** | Coches tipo plataforma, por niveles | Mantener = acelerar e inclinar atrás; soltar = inclinar adelante | 20 niveles cortos con meta (como Drive Mad) y **voltereta = turbo**: cada mortal completo da velocidad | Motor de Egg Truck y editor de terreno por puntos | 11/11/2026 |
| 3 | **Jelly Stack** | Hipercasual de apilar | Tocar = soltar la pieza | Las piezas son gelatina: lo que sobresale **tiembla y se cae** con física blanda, y la torre se balancea con la altura | Plantilla + Matter | 25/11/2026 |
| 4 | **Snow Plow** | Coches tipo plataforma, de Navidad | Mantener = acelerar | Quitanieves que **empuja regalos** hasta el trineo; versión navideña para la portada de temporada de los portales | Motor de Egg Truck | 09/12/2026 (antes de Navidad) |
| 5 | **Paper Glide** | Hipercasual de distancia | Mantener = subir el morro; soltar = picar | Corrientes de aire visibles y **mejoras entre partidas** (alas, cola, peso) compradas con monedas: la meta de "una partida más" | Plantilla + Arcade | 23/12/2026 |
| 6 | **Pin Rescue** | Puzle de físicas | Tocar un pasador = quitarlo | Agua, arena, lava y oro con partículas **que se mezclan** (agua + lava = piedra); 40 niveles con solución comprobada por bot | Simulación de arena propia | Listo (30/10/2026) |
| 7 | **Rocket Hop** | Habilidad con físicas | Mantener = propulsar | Aterrizajes en **plataformas que se mueven** con combustible limitado; cada aterrizaje perfecto devuelve combustible | Motor de Egg Truck (cuerpo rígido + empuje) | 20/01/2027 |
| 8 | **Tiny Harbor** | Gestión idle | Arrastrar el barco a la grúa | Puerto que crece con **un solo dedo**: cargar, zarpar y mejorar; 3 puertos como capítulos; anuncio con recompensa = barco doble 60 s | Plantilla + guardado del SDK de CrazyGames (progreso en la nube) | Listo (30/10/2026) |
| 9 | **Rope Cut Feed** | Puzle de cuerdas | Deslizar = cortar cuerdas | El caramelo cae a un monstruo; **viento y burbujas** cambian la trayectoria; 50 niveles | Plantilla + Matter (cuerdas por restricciones) | 17/02/2027 |
| 10 | **Tow Truck** | Coches tipo plataforma | Mantener = acelerar | Remolcar un remolque con cuerda y **carga que se mueve** (barriles, ovejas): segunda física del motor | Motor de Egg Truck + cuerda de Rope Cut | Listo (30/10/2026) |
| 11 | **Hoop Bounce** | Deportes hipercasual | Tocar = rebotar la pelota | El aro **se mueve y cambia de tamaño**; cadena de canastas limpias multiplica los puntos; partidas de 60 s cerradas | Plantilla + Arcade | 17/03/2027 |
| 12 | **Fruit Stand** | Gestión idle (ola de Monkey Mart) | Mover el personaje con el dedo | Puesto de fruta que se convierte en mercado; **ayudantes que no se duermen** y prestigio al acabar (lo que se critica del líder) | Plantilla + Arcade + guardado en la nube | 31/03/2027 |

## Qué se mide de cada juego (para decidir el siguiente)
- En CrazyGames, el lanzamiento básico y después el completo: retención frente a su referencia, minutos por partida,
  valoración. En Poki, si lo aceptan, el informe de su inspector.
- Telemetría propia mínima ya en la plantilla: partidas jugadas (`runs`) en el guardado. Pendiente (mejora del líder):
  embudo anónimo y sin cookies (inicio → primera partida → tercera partida) con Umami cuando el panel lo tenga.

## Versiones Android (proyecto 8, ola 3)
Los juegos que pasen del lanzamiento básico se empaquetan como TWA con AdMob a los 3 meses (plan de acción del líder).
El código ya es adaptable a cualquier pantalla y táctil.
