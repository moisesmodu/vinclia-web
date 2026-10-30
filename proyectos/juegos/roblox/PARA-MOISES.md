# Para Moisés · Egg Truck Tycoon en Roblox (3 tareas, unos 15 minutos)

El juego, la pista, el camión, la economía, el guardado, la tienda y la publicación automática están hechos.
Nada sale en público hasta que tú pulses. Los pasos detallados están en `DESPLIEGUE.md`.

1. **Crear la experiencia en [create.roblox.com](https://create.roblox.com/)** (web, sin Studio): *Create
   Experience*, un segundo place «Pruebas», tamaño de servidor 12. Apunta el universeId y los dos placeId.
2. **Crear la clave de Open Cloud** con permiso `universe-places:write` sobre esa experiencia y pegarla en GitHub
   como secreto `ROBLOX_API_KEY`, junto con las variables `ROBLOX_UNIVERSE_ID` y `ROBLOX_TEST_PLACE_ID`; crear el
   entorno `production` contigo como revisor y luego la variable `ROBLOX_PLACE_ID`.
3. **Tienda y madurez**: crear los 3 pases y 2 productos en *Monetization* (pásame los IDs o pégalos en
   `src/shared/Config.luau`) y rellenar el cuestionario de madurez. El botón **Public**, solo cuando lo hayas probado.
