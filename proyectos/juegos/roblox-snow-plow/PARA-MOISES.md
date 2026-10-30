# Para Moisés · Snow Plow Simulator en Roblox (3 tareas, unos 15 minutos, antes del 1 de diciembre)

El juego (pueblo nevado con 4 zonas, quitanieves con mejoras, compañeros de nieve, premio diario, calendario de
Adviento, renacer), el guardado, la tienda y la publicación automática están hechos. Nada sale en público hasta que
tú pulses. Detalle en `DESPLIEGUE.md`.

1. **Crear la experiencia «Snow Plow Simulator»** en [create.roblox.com](https://create.roblox.com/) (web, sin
   Studio), con un segundo place «Pruebas» y tamaño de servidor 12. Apunta el universeId y los dos placeId.
2. **GitHub**: añadir Snow Plow Simulator a la clave de Open Cloud que ya usa la CI (`universe-places:write`), crear
   las variables `SNOW_UNIVERSE_ID` y `SNOW_TEST_PLACE_ID`, comprobar que el entorno `production` te tiene como
   revisor y **después** crear `SNOW_PLACE_ID`.
3. **Tienda y madurez**: crear 3 pases (2× Snow, Bigger Backpack, Auto-Collect) y 3 productos (Snow Storm, Coin
   Pack, Lucky Egg), pasarme los IDs (o pegarlos en `src/shared/Config.luau`) y rellenar el cuestionario de madurez.
   **Public** antes del 1 de diciembre, solo cuando lo hayas probado en el place de pruebas.
