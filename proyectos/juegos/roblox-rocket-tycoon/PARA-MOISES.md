# Para Moisés · Rocket Hop Tycoon en Roblox (3 tareas, unos 15 minutos)

El juego (base lunar con 22 botones, cohete de un botón, asteroides con cristales, renacer, premio diario,
ganancias sin conectar), el guardado, la tienda y la publicación automática están hechos. Nada sale en público
hasta que tú pulses. Detalle en `DESPLIEGUE.md`.

1. **Crear la experiencia «Rocket Hop Tycoon»** en [create.roblox.com](https://create.roblox.com/) (web, sin
   Studio), con un segundo place «Pruebas» y tamaño de servidor 8. Apunta el universeId y los dos placeId.
2. **GitHub**: añadir Rocket Hop Tycoon a
   la clave de Open Cloud que ya usa la CI (`universe-places:write`), crear `ROCKET_UNIVERSE_ID` y
   `ROCKET_TEST_PLACE_ID`, comprobar que el entorno `production` te tiene como revisor y **después** crear
   `ROCKET_PLACE_ID`.
3. **Tienda y madurez**: crear 3 pases (2× Cash, Auto-Collect, Faster Rocket) y 3 productos (Cash Pack, Instant
   Upgrade, Meteor Shower), pasarme los IDs (o pegarlos en `src/shared/Config.luau`), rellenar el cuestionario de
   madurez y pulsar **Public** cuando lo hayas probado en el place de pruebas.
