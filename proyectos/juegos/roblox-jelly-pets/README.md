# Jelly Pets (Roblox) · Nuvolet Games

Segunda experiencia de Roblox del catálogo (idea en `../IDEAS-LIDERES.md` §2: la categoría «coleccionar y robar» de
*Steal a Brainrot*, en versión propia y para toda la familia). Igual que *Egg Truck Tycoon* (`../roblox/`): código
Luau en Git, mapa generado por código y publicación por la API Open Cloud desde GitHub Actions. **Nadie abre Roblox
Studio.**

**El bucle:** por el centro del mapa pasa una cinta con gelatinas con cara (Común → Mítica) → compras las que
puedas con monedas → se van andando a tu base y se suben a un pedestal → cada una da monedas por segundo → compras
otras mejores, **fusionas** 3 iguales en 1 de la rareza siguiente y, cuando puedes, **renaces** (vuelves a empezar con
un multiplicador permanente).

**Llevarse gelatinas (sin daño):** mantienes pulsado el aviso ✋🐾 de una gelatina de otra base y la llevas encima de
la cabeza, más lento, hasta tu base. Si su dueño te alcanza y te toca (👆), la suelta y vuelve sola a su pedestal.
El **candado** 🔒 de tu base bloquea que se lleven nada durante N segundos (mejorable) y luego recarga.

## Estructura

```
default.project.json   Rojo 7: carpetas → árbol de Roblox (y los RemoteEvents)
rokit.toml             versiones fijadas: rojo 7.4.4, lune 0.8.9, selene 0.27.1, stylua 2.6.0
selene.toml stylua.toml .luaurc   lint, formato y modo estricto (iguales que Egg Truck Tycoon)
src/shared/            ReplicatedStorage.Shared (servidor y cliente). Módulos puros, sin Roblox:
  Config.luau          rarezas, especies, precios, candado, premios, IDs de la tienda (0 = apagado)
  Rng.luau             generador con semilla (Park–Miller): misma secuencia en Lune y en Roblox
  Rarity.luau          tirada ponderada (cinta y Tirada de suerte con mínimo Épica)
  Pets.luau            pedestales libres, ingresos, reglas de fusión, qué se vende/fusiona primero, grupos
  Economy.luau         multiplicadores, renacer, venta, ganancias sin conectar (con tope), bolsa de monedas
  Daily.luau           premio diario con racha de 7 días
  StealLock.luau       tiempos del candado (duración, recarga, mejoras) y reglas para llevarse una gelatina
src/server/            ServerScriptService.Server
  Main.server.luau     arranque, RemoteEvents validados y limitados, entrada/salida, BindToClose
  Services/            DataService (guardado con bloqueo de sesión), MonetizationService (pases, productos,
                       ProcessReceipt idempotente), RateLimiter, WorldBuilder (mapa), BaseService (8 bases,
                       pedestales, candado), PetBuilder (gelatinas con piezas), PetService (pedestales, ingresos,
                       fusión, venta, llevar y tocar), ConveyorService (cinta), ProgressService (diario,
                       renacer, mejora del candado, ganancias sin conectar)
src/client/            StarterPlayerScripts.Client: Hud (interfaz) y PromptFilter (avisos solo para quien toca)
tests/                 specs de Lune de los módulos puros: `lune run tests/run`
scripts/publish.sh     publica un .rbxl con Open Cloud (curl), con reintentos
(.github/workflows/roblox-jelly-pets.yml en la raíz del repositorio: flujo de GitHub Actions)
assets/                icono 512 y miniatura 1920×1080 (se suben a mano en la ficha)
```

## Cómo se publica

1. **PR** que toque `proyectos/juegos/roblox-jelly-pets/**`: la CI instala las herramientas con Rokit y ejecuta
   `stylua --check`, `selene src`, `lune run tests/run`, `rojo build -o build.rbxl` y guarda el `.rbxl` como
   artefacto. `luau-lsp analyze` (tipos estrictos) corre solo como aviso.
2. **Push a `main`**: lo mismo y publica en el **place de pruebas** (`JELLY_UNIVERSE_ID`, `JELLY_TEST_PLACE_ID`).
3. **Producción** (`JELLY_PLACE_ID`): trabajo aparte en el entorno `production` de GitHub, con **aprobación manual**
   de Moisés. Sin esa variable ni siquiera se lanza.

Sin la clave o los IDs, la publicación dice «omitida» y termina en verde. Pasos de la cuenta en `DESPLIEGUE.md`.

En local (con Rokit): `rokit install`, `lune run tests/run`, `rojo build default.project.json -o build.rbxl`.

## Decisiones

- **Gelatinas por código.** Cuerpo de cristal translúcido con núcleo de neón (malla esférica de `SpecialMesh`, sin
  subir mallas), ojos con brillo, mejillas y sonrisa. La especie (Blob, Bunny, Kitty, Dino, Octo, Sprout) solo cambia
  la forma; la rareza da color e ingresos, luz desde Rara, destellos desde Legendaria y corona en la Mítica.
- **Economía en el servidor.** El cliente solo pide «fusiona/vende esta especie y rareza», «candado», «mejora el
  candado», «renace» y «premio diario»: argumentos validados (tipo, longitud, rango) y cubo de fichas por jugador.
  Comprar en la cinta, llevarse y tocar van por `ProximityPrompt`, que el servidor vuelve a comprobar (distancia,
  dueño, candado, pedestal libre, estado de la gelatina). Monedas cada segundo con los decimales acumulados.
- **Llevarse gelatinas.** Pura diversión: sin daño ni PvP. Reglas puras en `StealLock.canSteal` (no la tuya, quieta en
  su pedestal, sin candado, no llevas otra, te queda pedestal). Quien la lleva va a 11 de velocidad (el dueño a 16),
  tiene 45 s y un tiempo mínimo según la distancia (anti-teletransporte). Al llegar, la gelatina cambia de dueño y se
  guardan los dos jugadores.
- **Fusión.** 3 iguales (especie y rareza) → 1 de la rareza siguiente; los ingresos suben (3 · 1 → 4, 3 · 4 → 15…)
  y se liberan dos pedestales. Primero se usan las de reserva y los pedestales más altos.
- **Reserva.** Si una gelatina llega sin pedestal libre (solo pasa con la Tirada de suerte) queda en reserva: no genera
  ni se puede llevar, y sube sola al primer pedestal que se libere. Máximo 40 gelatinas guardadas.
- **Guardado.** Igual que Egg Truck Tycoon: `UpdateAsync` con bloqueo de sesión en el propio registro, reintentos,
  presupuesto, guardado cada 2 minutos, al salir y en `BindToClose`. Guarda también la hora para las ganancias sin
  conectar (50 % de los ingresos, tope de 4 horas, nada si es menos de 1 minuto).
- **Compras.** `ProcessReceipt` idempotente: el `PurchaseId` y la gelatina o las monedas se escriben en una sola
  escritura; los efectos en el mundo, después. Con un ID a 0 en `Config.luau` todo queda apagado y el botón no sale.
- **Interfaz sin texto.** Emojis y números, botones de 76 px con `UIScale`, a la derecha (lejos del joystick).
  Renacer pide dos toques. Sin chat propio, sin enlaces externos, sin datos fuera de Roblox.
- **Marca Nuvolet Games.** Cielo, tinta, nube, sol y hierba; fuente FredokaOne; dos nubes sonrientes en los extremos
  de la cinta.

## Lo que solo se puede comprobar en la CI o en el place de pruebas

`selene`, `luau-lsp`, `rojo build` y las specs de Lune no se pudieron ejecutar en la sesión que escribió el juego
(descargas de binarios bloqueadas): se comprobaron sintaxis y formato (StyLua 2.6.0) y las specs se calcularon a mano.
El aspecto de las gelatinas, el recorrido a saltitos, llevar y tocar y la escala de la interfaz en móvil se ven por
primera vez en el place de pruebas.

## Pendiente

Evento de fin de semana con gelatinas limitadas (IDEAS-LIDERES §2), tabla de récords, música y efectos, prueba de
humo con Luau Execution y que el análisis de tipos pase a ser obligatorio.
