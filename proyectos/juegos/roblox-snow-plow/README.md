# Snow Plow Simulator (Roblox) · Nuvolet Games

Cuarta experiencia de Roblox del catálogo (R3 en `../CATALOGO.md`, tras Egg Truck Tycoon, Jelly Tower Obby y Jelly Pets): **simulador de temporada para diciembre**.
Toma el bucle de los simuladores que más se juegan (recoger → vender → mejorar → zona nueva → renacer, con mascotas
que suben el rendimiento y vuelta diaria; `../IDEAS-LIDERES.md` §2) y lo viste de Navidad acogedora, para toda la
familia. Igual que *Jelly Pets* y *Jelly Tower Obby*: código Luau en Git, mapa generado por código y publicación por
la API Open Cloud desde GitHub Actions. **Nadie abre Roblox Studio.**

**El bucle:** empujas un quitanieves pequeñito por un pueblo nevado → la pala recoge los montones que toca y llena
la mochila (barra ❄️) → la vacías en el depósito de la zona (❄️ ➜ 🪙) → mejoras la pala, la mochila, la velocidad y
la descarga automática → abres zonas nuevas por una puerta de hielo (Pueblo 🏘️ → Parque 🌲 → Pueblo de esquí ⛷️ →
Polo Norte 🎅, cada una con nieve que vale más) → abres huevos de **compañeros de nieve** (muñecos, pingüinos,
búhos, zorros, renos y osos) que te siguen y suben el valor de la nieve → **renaces** con un multiplicador.
Y cada día de diciembre, una casilla del **calendario de Adviento** 🎄.

## Estructura

```
default.project.json   Rojo 7: carpetas → árbol de Roblox (y los RemoteEvents)
rokit.toml             versiones fijadas: rojo 7.4.4, lune 0.8.9, selene 0.27.1, stylua 2.6.0
selene.toml stylua.toml .luaurc   lint, formato y modo estricto (iguales que Jelly Pets)
src/shared/            ReplicatedStorage.Shared (servidor y cliente). Módulos puros, sin Roblox ni require:
  Config.luau          zonas, nieve, pala, mejoras, compañeros, huevos, premios, Adviento, IDs de la tienda (0 = apagado)
  Rng.luau             generador con semilla (Park–Miller): misma secuencia en Lune y en Roblox
  SnowLayout.luau      reparto determinista de los montones (límites, separación, huecos) y espera de la Tormenta
  Collection.luau      ancho de pala, capacidad, velocidad, cuánto cabe, valor de la nieve, descarga, antitrampas
  Upgrades.luau        precios de las mejoras
  Zones.luau           geometría de las zonas (depósito, centro, llegada) y reglas para abrirlas
  Buddies.luau         tirada de los huevos, bonus con tope, equipar/quitar, los mejores, limpiar el guardado
  Daily.luau           premio diario con racha de 7 días
  Advent.luau          fecha civil UTC sin os.date, casilla del 1 al 25 de diciembre, un regalo por día y año
  Rebirth.luau         precio y multiplicador de renacer
  Economy.luau         bolsa de monedas y formato corto de los números
src/server/            ServerScriptService.Server
  Main.server.luau     arranque, RemoteEvents validados y limitados, avisos de las puertas, entrada/salida
  Services/            DataService (guardado con bloqueo de sesión), MonetizationService (pases, productos,
                       ProcessReceipt idempotente), RateLimiter, WorldBuilder (pueblo), SnowService (montones),
                       PlowService (quitanieves, recogida, depósito, zonas), BuddyBuilder y BuddyService
                       (compañeros), ProgressService (mejoras, zonas, diario, Adviento, renacer)
src/client/            StarterPlayerScripts.Client: Hud (interfaz), GateView (puertas abiertas), Snowfall (nevada)
tests/                 specs de Lune de los módulos puros: `lune run tests/run`
scripts/publish.sh     publica un .rbxl con Open Cloud (curl), con reintentos
(.github/workflows/roblox-snow-plow.yml en la raíz del repositorio: flujo de GitHub Actions)
assets/                icono 512 y miniatura 1920×1080 (se suben a mano en la ficha)
```

## Cómo se publica

1. **PR** que toque `proyectos/juegos/roblox-snow-plow/**`: la CI instala las herramientas con Rokit y ejecuta
   `stylua --check`, `selene src`, `lune run tests/run`, `rojo build -o build.rbxl` y guarda el `.rbxl` como
   artefacto. `luau-lsp analyze` (tipos estrictos) corre como aviso.
2. **Push a `main`**: lo mismo y publica en el **place de pruebas** (`SNOW_UNIVERSE_ID`, `SNOW_TEST_PLACE_ID`).
3. **Producción** (`SNOW_PLACE_ID`): trabajo aparte en el entorno `production` de GitHub, con **aprobación manual**
   de Moisés. Sin esa variable ni siquiera se lanza.

Sin la clave o los IDs, la publicación dice «omitida» y termina en verde. Pasos de la cuenta en `DESPLIEGUE.md`.
Hay que publicar **antes del 1 de diciembre** para que el calendario de Adviento se vea entero.

En local (con Rokit): `rokit install`, `lune run tests/run`, `rojo build default.project.json -o build.rbxl`.

## Decisiones

- **Quitanieves sin física de vehículo.** Un carrito de bloques (cuerpo, motor, manillar, ruedas, faro y pala
  amarilla) soldado delante del personaje, sin masa ni colisiones: se mueve con los controles normales de Roblox
  (teclado, mando, joystick del móvil), no vuelca ni se atasca. La mejora de pala lo reconstruye más ancho y la de
  velocidad sube la `WalkSpeed`.
- **Nieve en el servidor.** Los montones los crea el servidor con `SnowLayout` y una semilla por zona (siempre el
  mismo pueblo). Diez veces por segundo mira qué montones toca la pala de cada jugador (rectángulo delante de él,
  o un radio con el pase Imán), recoge solo lo que cabe y encoge o quita el montón; vuelve a salir a los 18 s (6 s
  con Tormenta). Un movimiento imposible entre dos vistazos no recoge nada; en una zona sin abrir no se recoge y el
  jugador vuelve a la última abierta.
- **Valor.** Cada unidad vale lo de su zona (1, 4, 15, 60) · (1 + bonus de compañeros, tope +600 %) · (2 con el pase).
  Al descargar se multiplica por el renacer. La descarga automática (mejora) cobra el 50–90 % sin ir al depósito.
- **Compañeros.** Cuatro huevos (uno por zona) con pesos por rareza que mejoran con la zona; las probabilidades se
  ven en la tarjeta del huevo. Se equipan hasta 3 (siguen al jugador con `AlignPosition`), «⭐» equipa los mejores y
  «💰» (dos toques) suelta uno por monedas. Máximo 60.
- **Calendario de Adviento.** Del 1 al 25 de diciembre en UTC, solo la casilla de hoy: monedas que crecen con el día
  y compañeros los días 6, 12, 18 y 24 (Raro/Épico) y un muñeco Legendario el 25. La fecha sale de `os.time()` con
  aritmética entera (probada contra `Date` de JavaScript y en las specs: límites de las 00:00 UTC, bisiestos,
  fuera de temporada, año nuevo).
- **Renacer.** Vuelve a empezar monedas, mejoras y zonas con ×1,5, ×2… para siempre; los compañeros se quedan. El
  Polo Norte pide haber renacido una vez.
- **Guardado.** Igual que Jelly Pets: `UpdateAsync` con bloqueo de sesión en el propio registro, reintentos,
  presupuesto, guardado cada 2 minutos, al salir y en `BindToClose`.
- **Compras.** `ProcessReceipt` idempotente: el `PurchaseId` y lo comprado se escriben en una sola escritura; los
  efectos (tormenta, compañero, aviso), después. Con un ID a 0 en `Config.luau` todo queda apagado y el botón no sale.
- **Interfaz sin texto.** Emojis y números, botones de 64 px con `UIScale`, a la derecha (lejos del joystick).
  Renacer y soltar piden dos toques. Sin chat propio, sin enlaces externos, sin datos fuera de Roblox.
- **Marca Nuvolet Games.** Cielo, tinta, nube, sol y hierba; fuente FredokaOne; casas con luces, abetos, farolas,
  bastones de caramelo y regalos, todo de bloques.

## Lo que solo se puede comprobar en la CI o en el place de pruebas

`selene`, `luau-lsp`, `rojo build` y las specs de Lune no se pudieron ejecutar en la sesión que escribió el juego:
se comprobaron sintaxis y formato (StyLua 2.6.0) y los números de las specs se recalcularon en JavaScript (reparto
de montones, frecuencias de los huevos, fechas). El aspecto del pueblo, del carrito y de los compañeros, el
seguimiento con `AlignPosition` y la escala de la interfaz en móvil se ven por primera vez en el place de pruebas.

## Pendiente

Música y sonidos, tabla de récords de nieve, un evento de fin de semana con un compañero limitado y que el análisis
de tipos pase a ser obligatorio.
