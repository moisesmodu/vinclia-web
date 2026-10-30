# Para Moisés · Jelly Tower Obby en Roblox (3 tareas, unos 15 minutos)

El juego (torre de 40 fases en 4 zonas, checkpoints, monedas, estelas, premio diario, reiniciar torre), el guardado,
la tienda y la publicación automática están hechos. Nada sale en público hasta que tú pulses. Detalle en
`DESPLIEGUE.md`.

1. **Crear la experiencia «Jelly Tower Obby»** en [create.roblox.com](https://create.roblox.com/) (web, sin Studio),
   con un segundo place «Pruebas» y tamaño de servidor 20. Apunta el universeId y los dos placeId.
2. **GitHub**: añadir Jelly Tower Obby a la clave de Open Cloud que ya usa la CI (`universe-places:write`), crear las
   variables `OBBY_UNIVERSE_ID` y `OBBY_TEST_PLACE_ID`, comprobar que el entorno `production` te tiene como revisor y
   **después** crear `OBBY_PLACE_ID`.
3. **Tienda y madurez**: crear 3 pases (Speed Coil, Gravity Coil, Trails) y 1 producto (Skip Stage), pasarme los IDs
   (o pegarlos en `src/shared/Config.luau`) y rellenar el cuestionario de madurez. **Public**, solo cuando lo hayas
   probado en el place de pruebas.
