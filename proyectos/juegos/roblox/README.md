# Egg Truck Tycoon (Roblox) · Nuvolet Games

Primer juego de Roblox del catálogo (proyecto Q, plan en `../ROBLOX.md`). Todo vive en Git: código Luau, mapa generado
por código y publicación por la API Open Cloud desde GitHub Actions. **Nadie abre Roblox Studio.**

**El bucle:** tu granja pone huevos → los cargas en tu camión → conduces por una pista de colinas, baches y rampas
hasta el mercado sin romperlos → cobras → mejoras granja, suspensión, paredes de la caja y capacidad.
Cada 10 minutos hay una **carrera de huevos** de 3 minutos: quien más huevos entrega gana un premio.

**Para volver cada día** (lo que hace ganar a *Grow a Garden* y a los tycoons de cabeza, `../IDEAS-LIDERES.md` §2):
huevos raros, recompensa diaria con racha, evento de fin de semana con una pintura limitada y pinturas del camión.

## Estructura

```
default.project.json   Rojo 7: carpetas → árbol de Roblox (y los RemoteEvents)
rokit.toml             versiones fijadas: rojo 7.4.4, lune 0.8.9, selene 0.27.1, stylua 2.6.0
selene.toml stylua.toml .luaurc   lint, formato y modo estricto
src/shared/            ReplicatedStorage.Shared (servidor y cliente)
  Config.luau          precios, curvas, física, IDs de la tienda (0 = apagado)
  Economy.luau         funciones puras: coste(nivel), pago(huevos, distancia), granja, camión, carrera,
                       rareza (rollRarity), racha diaria (dailyStreak), evento (isEventActive)
  TrackGen.luau        función pura: tramos y perfil de la pista a partir de una semilla
src/server/            ServerScriptService.Server
  Main.server.luau     arranque, entrada/salida de jugadores, BindToClose
  Services/            DataService (guardado), WorldBuilder (pista y mercado), PlotService (12 parcelas),
                       FarmService (gallineros), TruckBuilder + TruckService (camión, huevos, entrega),
                       UpgradeService, MonetizationService (pases, productos, ProcessReceipt),
                       RaceService (carrera), EventService (evento de fin de semana),
                       PaintService (pinturas), RateLimiter
src/client/            StarterPlayerScripts.Client: Hud (interfaz) y TruckController (conducción y cámara)
tests/                 pruebas de Lune de Economy, TrackGen y los sistemas nuevos (systems_spec): `lune run tests/run`
scripts/publish.sh     publica un .rbxl con Open Cloud (curl)
(.github/workflows/roblox.yml en la raíz del repositorio: flujo de GitHub Actions)
assets/                icono y miniatura (se suben a mano en la ficha del juego)
```

## Cómo se publica

1. **PR** que toque `proyectos/juegos/roblox/**`: la CI instala las herramientas con Rokit y ejecuta
   `stylua --check`, `selene src`, `lune run tests/run`, `rojo build -o build.rbxl` y guarda el `.rbxl` como
   artefacto. `luau-lsp analyze` (tipos estrictos) corre solo como aviso.
2. **Push a `main`**: lo mismo y publica en el **place de pruebas**:
   `POST https://apis.roblox.com/universes/v1/{universeId}/places/{placeId}/versions?versionType=Published`
   con `x-api-key` y el `.rbxl` como cuerpo (`scripts/publish.sh`).
3. **Producción**: trabajo aparte en el entorno `production` de GitHub, que espera la **aprobación manual** de
   Moisés (regla dura 1). Sin la variable `ROBLOX_PLACE_ID` ni siquiera se lanza.

Sin la clave o los IDs, los pasos de publicación dicen «omitida» y terminan en verde. Los pasos de la cuenta y del
panel están en `DESPLIEGUE.md`.

En local (con Rokit): `rokit install`, `lune run tests/run`, `rojo build default.project.json -o build.rbxl`.

## Decisiones

- **Mapa por código.** La pista se genera al arrancar cada servidor con una semilla aleatoria (queda en
  `Workspace.TrackSeed`), con las mismas reglas de tramos que `egg-truck/src/terrain.ts`. Son tablones `Part`
  inclinados (uno por cada 6 studs, todo el ancho) con barandillas entre carriles: un carril por parcela, así 12
  camiones no chocan. Granja y mercado, `Part` y `WedgePart`. Sin `.rbxm` ni mallas por ahora.
- **Camión de restricciones.** Chasis con `VehicleSeat`; en cada rueda, `PrismaticConstraint` + `SpringConstraint`
  (suspensión), `HingeConstraint` servo (dirección delantera) y `HingeConstraint` motor (tracción a las 4 ruedas).
  Los muelles se ajustan a la masa real del camión. Conduce el cliente (dueño de la física de su camión: responde
  al instante, también con el joystick táctil); el servidor no le cree nada de la economía.
- **Huevos físicos.** Piezas sueltas en la caja. Se rompen si chocan a más de `breakSpeed` (sube con la suspensión),
  si tocan algo con la etiqueta `Ground` (pista, suelo, barandillas) o si salen de la caja.
- **Economía en el servidor.** El cliente solo pide «carga», «reinicia» o «mejora X» (RemoteEvents validados y con
  cubo de fichas por jugador). Los huevos los crea el servidor (como mucho la capacidad y lo que había en la granja);
  la entrega cuenta lo que el servidor ve en la caja; un viaje más rápido que el 60 % del tiempo mínimo posible no
  cobra.
- **Guardado.** `UpdateAsync` con bloqueo de sesión en el propio registro (un bloqueo de más de 7 minutos se da por
  abandonado), reintentos con espera creciente, presupuesto de peticiones, guardado cada 2 minutos, al salir y en
  `BindToClose`. Si el DataStore no responde se juega sin guardar y las compras esperan.
- **Compras.** `ProcessReceipt` idempotente: el `PurchaseId` se escribe en el DataStore en la misma escritura que
  concede la compra y solo entonces devuelve `PurchaseGranted`; los efectos en el mundo (reparación) van después.
  Con un ID a 0 en `Config.luau` todo queda apagado y el botón no aparece.
- **Interfaz sin texto.** Emojis y números (monedas, huevos, mejoras, carrera), botones de 76 px escalados con
  `UIScale` y fuera de la zona del joystick. Sin chat propio, sin enlaces externos, sin datos fuera de Roblox.
- **Marca Nuvolet Games.** Colores cielo, tinta, nube, sol y hierba; fuente FredokaOne; nubes en el cielo.

## Huevos raros, recompensa diaria, evento y pinturas

Todo se decide en el servidor; el cliente solo ve atributos y pide «pinta/compra esta pintura» (RemoteEvent
`PaintAction`, validado y con el mismo cubo de fichas). Las reglas son funciones puras de `Economy.luau` con sus
números en `Config.luau`, probadas con Lune en `tests/systems_spec.luau`.

- **Huevos raros.** Cada huevo que pone un gallinero tira un dado (`Economy.rollRarity`, con `Random` del servidor):
  🥈 plata (6 %, vale ×3), 🥇 oro (1,5 %, ×8) y 🌈 arcoíris (0,3 %, ×25), en `Config.RarityTiers`. La probabilidad
  se multiplica por la mejora nueva **🍀 Suerte** (+12 % por nivel, 10 niveles), el pase **2× dinero** (×1,25), el
  producto **Huevo de oro** (×2 durante 10 minutos, guardado en el perfil en la misma escritura que la compra) y el
  **evento** (×1,5), con tope ×6 y nunca más de la mitad de huevos raros. La caja de la granja cuenta cada rareza;
  el camión carga primero los raros; cada huevo se ve distinto (color, metal o neón, destellos) y al entregarlo
  paga su valor (`Economy.payoutUnits`, mismo cálculo de distancia, carga llena y 2×).
- **Recompensa diaria.** Al entrar, si cambió el día UTC desde el último cobro (`Economy.dailyStreak`): día
  siguiente, racha + 1 (hasta 7 y ahí se queda); un día sin entrar, vuelta a 1; mismo día o reloj hacia atrás, nada.
  Monedas = la mayor de `Config.Daily.rewards[racha]` (50…400) y mejor entrega · 0,25 · racha, para que siga
  contando cuando el jugador avanza. Se guarda enseguida; con el DataStore caído no se da (no quedaría guardada).
- **Evento de fin de semana.** De viernes 00:00 a lunes 00:00 UTC (`Economy.isEventActive(os.time())`): huevos
  raros ×1,5 y, entregando **150 huevos** durante el evento, la pintura limitada 🎉 **Festiva** (neón) para siempre.
  El progreso es por semana (`Economy.eventWeek`) y vuelve a 0 el siguiente fin de semana. La barra superior muestra
  la cuenta atrás y el progreso (o el tiempo hasta el próximo evento).
- **Pinturas.** Botón 🎨: muestras de color con su icono y precio en 🪙 (🟥 de serie, 🟦 y 🟩 600, ⬛ metal 2.500,
  🟨 oro 12.000, 🎉 solo del evento). Tocar una tuya te la pone (✅); una que no es tuya, la compra si te llega.
  Pinta capó, cabina y caja del camión al instante y en cada aparición.
- **Guardado (versión 2 del registro).** El perfil añade `dailyDay`, `streak`, `paints`, `paint`, `eventWeek`,
  `eventEggs` y `luckUntil`. `reconcile()` rellena los que falten con su valor por defecto, así los perfiles de la
  versión 1 se migran solos al cargar (mismo DataStore `EggTruckTycoon_v1`, mismo bloqueo de sesión).

## Pendiente (sesión 3 de ROBLOX.md)

Tabla de récords persistente (OrderedDataStore), pistas más largas que pagan más, prueba de humo con Luau Execution
en el place de pruebas, música y efectos, y que el análisis de tipos pase a ser obligatorio.
