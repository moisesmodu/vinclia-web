# Roblox · plan del primer juego publicado por Open Cloud (sin construir todavía)

Proyecto Q de CARTERA.md. Objetivo: un juego de Roblox mantenido entero desde Git (Rojo + Luau) y publicado por la API
Open Cloud desde GitHub Actions, **sin abrir Roblox Studio**. Datos del panel (hallazgos 24/10/2026): DevEx a
0,0038 $/Robux con mínimo de 30.000 Robux; desde junio de 2026, 0,0054 $/Robux por el gasto de jugadores de EE. UU.
mayores de 18 verificados en juegos con avatares R15; la mediana de DevEx en 2024 fue de unos 1.575 $ por desarrollador
(lotería).

## 1. El juego: **Egg Truck Tycoon**
- **Por qué este:** reutiliza la marca y el gancho de Egg Truck (carga frágil). El tycoon y la simulación son los
  géneros que mejor monetizan en Roblox y los que apuntan al público adulto (la tasa de 0,0054 $). Se juega con
  avatares R15 desde el primer día.
- **Bucle (5 minutos para entenderlo):** recoger huevos en tu granja → cargarlos en tu camión → conducir por una pista
  de colinas hasta el mercado sin romperlos (física de vehículos nativa de Roblox) → cobrar → mejorar granja, camión
  y amortiguación → pistas más largas que pagan más.
- **Social:** servidor de 12 jugadores, granjas en parcelas vecinas, tabla de récords de entrega del servidor, y
  "carreras de huevos" cada 10 minutos entre todos.
- **Monetización (sin bloquear el bucle):** pases (2× dinero, camión grande, segunda granja), productos de un solo
  uso (huevo de oro, reparación instantánea), pagos por tiempo de Premium y anuncios patrocinados en Robux solo cuando
  haya ingresos (VIABILIDAD: 0 € hasta entonces).
- **Clasificación:** cuestionario de madurez con "Minimal": sin violencia, sin chat de voz.

## 2. Repositorio y estructura (Rojo)
Repositorio propio `moisesmodu/egg-truck-roblox` (CARTERA: cada proyecto en su repositorio), o carpeta
`proyectos/juegos/roblox/` mientras no exista:
```
default.project.json        # Rojo: mapa de carpetas → árbol de Roblox
src/server/                 # ServerScriptService (economía, granjas, guardado con DataStoreService)
src/client/                 # StarterPlayerScripts (interfaz, cámara, controles del camión)
src/shared/                 # ReplicatedStorage (configuración, precios, módulos comunes)
assets/                     # modelos .rbxm y mapas exportados (sin Studio: se generan desde código o con Lune)
tests/                      # pruebas de lógica pura con Lune (ejecuta Luau fuera de Roblox)
aftman.toml / rokit.toml    # versiones fijadas de rojo, lune, selene, stylua, rbxcloud
.github/workflows/roblox.yml
```
- **Mapa sin Studio:** las pistas se generan por código al arrancar el servidor (mismas reglas de tramos que
  `egg-truck/src/terrain.ts`: llano, colina, baches, rampa), con piezas `Part` y `WedgePart`. La granja y el mercado,
  con modelos sencillos construidos por scripts de Lune que escriben `.rbxm`. Los mallados complejos, más adelante.
- **Arte:** iconos y miniaturas con Higgsfield (subidos con la Assets API de Open Cloud); música y efectos con
  ElevenLabs (Open Cloud permite subir audio; Roblox lo modera).

## 3. Publicación sin Studio (GitHub Actions)
1. `rojo build default.project.json -o build.rbxl`
2. `selene src` y `luau-analyze` (tipos) y `lune run tests` (lógica de economía).
3. Publicar en el **place de pruebas**:
   `POST https://apis.roblox.com/universes/v1/{universeId}/places/{testPlaceId}/versions?versionType=Published`
   con cabecera `x-api-key: ${{ secrets.ROBLOX_API_KEY }}`, `Content-Type: application/octet-stream` y el `.rbxl`
   como cuerpo (o `rbxcloud experience publish -f build.rbxl -p <placeId> -u <universeId> -t published -a $KEY`).
4. Prueba de humo: `lune` con Open Cloud *Luau Execution* sobre el place de pruebas (arranca un servidor y ejecuta
   las pruebas de integración). Si pasa, el mismo paso contra el place de producción, **solo al fusionar en la rama
   principal** y con aprobación manual del entorno `production` de GitHub (regla dura 1: nada sale sin Moisés).
5. Mensajes del juego (noticias del menú) con *Messaging Service API*; tablas de datos con *DataStores API* para el
   panel.

## 4. Lo que solo puede hacer Moisés (una vez, ~10 minutos)
1. Cuenta de Roblox verificada (mayor de 13; para DevEx, correo verificado e identidad) y, si sigue siendo requisito
   para cobrar, Premium (VIABILIDAD: −30 $).
2. En [create.roblox.com](https://create.roblox.com/) (web, no Studio): *Create experience* → anota `universeId` y
   `placeId`; crear un segundo place de pruebas.
3. *Open Cloud → API Keys* → clave con permiso `universe-places:write` (y `universe-datastores`, `universe:write`,
   `asset:write`) limitada a ese universo y a la IP de GitHub Actions o sin IP → pegarla como secreto
   `ROBLOX_API_KEY` en el repositorio.
4. Cuestionario de madurez y pulsar *Public* la primera vez.

## 5. Plan en sesiones
| Sesión | Entregable | Criterio de hecho |
|---|---|---|
| 1 | Repositorio, Rojo, CI con build y análisis, terreno y camión jugables en el place de pruebas | Publicado por la API en pruebas sin abrir Studio; vídeo de 20 s grabado del cliente |
| 2 | Economía, granja, mejoras, guardado (DataStore), pases y productos, interfaz sin texto | 10 mejoras, guardado probado, pruebas de Lune en verde |
| 3 | Carreras de servidor, tabla de récords, miniaturas e iconos, ficha, publicación a producción con aprobación | Moisés pulsa *Public* |

## 6. Riesgos
- **Lotería:** el 90 % de las experiencias no cobra nada. Se para si a los 3 meses de público no pasa de 50 jugadores
  concurrentes en hora punta de EE. UU.
- **Moderación de recursos subidos por API** (audio, imágenes): puede tardar o rechazar; siempre hay alternativa por
  código o del catálogo gratuito de Roblox.
- **Cambios de la API:** Open Cloud cambia de versión; fijar versiones de las herramientas y probar en el place de
  pruebas antes de producción.
- **Menores:** Roblox es mayoritariamente infantil; nada de recogida de datos fuera de Roblox y ningún enlace externo.
