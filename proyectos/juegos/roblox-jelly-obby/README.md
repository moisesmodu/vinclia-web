# Jelly Tower Obby (Roblox) · Nuvolet Games

Tercera experiencia de Roblox del catálogo (R2 en `../CATALOGO.md`; idea en `../IDEAS-LIDERES.md` §2: los
*escape / obby* son el segundo grupo por jugadores a la vez). Igual que *Egg Truck Tycoon* y *Jelly Pets*: código Luau
en Git, mundo generado por código y publicación por la API Open Cloud desde GitHub Actions. **Nadie abre Roblox
Studio.**

**El juego:** una torre de gelatina de **40 fases** que sube en espiral alrededor de una columna central, en 4 zonas
de 10 con su color: 🍓 Fresa, 🍏 Lima, 🫐 Arándano y 🍇 Uva. Cada fase va de un checkpoint (esquina) al siguiente, por
encima de plataformas de gelatina:

| Obstáculo | Desde | Qué hace |
|---|---|---|
| Plataforma y viga estrecha | 🍓 | Normales; las vigas se estrechan hasta 1,2 studs |
| Gelatina que se encoge | 🍓 | Al pisarla tiembla, se encoge y desaparece (vuelve a los 3 s) |
| Almohadilla | 🍓 | Te lanza ≈ 14 studs hacia arriba |
| Cinta | 🍏 | Te lleva a favor (verde) o en contra (amarillo), siempre más lenta que andar |
| Baldosa que desaparece | 🍏 | Se aclara y desaparece poco después de pisarla |
| Trampolín | 🍏 | Te lanza ≈ 25 studs |
| Plataforma móvil | 🫐 | Va y viene de lado |
| Baba | 🫐 | Charco verde que hay que saltar; tocarlo te devuelve a tu checkpoint (sin daño) |
| Plataforma giratoria | 🍇 | Barra que gira; se salta cuando queda alineada |

La dificultad sube fase a fase (huecos más largos, plataformas más pequeñas, tiempos más cortos, más velocidad).
Al llegar a la cima: monedas extra, +1 🏆 y el botón 🔁 **Reiniciar torre** (vuelves a la fase 1 con +25 % de
monedas, hasta ×4). La lista de jugadores enseña 🏔️ (checkpoint más alto) y 🏆 (veces en la cima).

**Monedas:** cada checkpoint nuevo da monedas (más cuanto más alto) y sirven para comprar **estelas** ✨.
**Premio diario** 🎁 con racha de 7 días. **Tienda** (IDs a 0 = apagada hasta pegarlos en `Config.luau`):
producto ⏭️ **Saltar fase**; pases ⚡ **Bobina de velocidad**, 🪐 **Bobina de gravedad** (herramientas: con ellas en la
mano el servidor sube WalkSpeed o JumpHeight) y 🌈 **Estelas** (3 estelas especiales).

## Estructura

```
default.project.json   Rojo 7: carpetas → árbol de Roblox (y los RemoteEvents)
rokit.toml             versiones fijadas: rojo 7.4.4, lune 0.8.9, selene 0.27.1, stylua 2.6.0
selene.toml stylua.toml .luaurc   lint, formato y modo estricto (iguales que Jelly Pets)
src/shared/            ReplicatedStorage.Shared (servidor y cliente). Módulos puros, sin Roblox:
  Config.luau          física, torre, zonas, obstáculos, monedas, estelas, diario, IDs de la tienda (0 = apagado)
  Rng.luau             generador con semilla (Park–Miller): misma secuencia en Lune y en Roblox
  Stages.luau          generador de la torre: piezas, curva de dificultad y reglas de salto (alcance y altura)
  Checkpoint.luau      avanzar solo de 1 en 1, saltar fase (+1, nunca más allá de la última), reiniciar, anti-trampas
  Rewards.luau         monedas por checkpoint y por la cima, multiplicador de reinicios, reglas de las estelas
  Daily.luau           premio diario con racha de 7 días
src/server/            ServerScriptService.Server
  Main.server.luau     genera y construye la torre, RemoteEvents validados y limitados, entrada/salida, BindToClose
  Services/            DataService (guardado con bloqueo de sesión), MonetizationService (pases, Saltar fase,
                       ProcessReceipt idempotente), RateLimiter, TowerBuilder (Parts de la torre), ObstacleService
                       (gelatinas, baldosas, móviles, baba), StageService (checkpoints, caídas, teletransportes,
                       cima, reinicio, bobinas, estelas, diario)
src/client/            StarterPlayerScripts.Client: Hud (interfaz) y Launcher (impulso de almohadillas/trampolines)
tests/                 specs de Lune de los módulos puros: `lune run tests/run`
scripts/publish.sh     publica un .rbxl con Open Cloud (curl), con reintentos
(.github/workflows/roblox-jelly-obby.yml en la raíz del repositorio: flujo de GitHub Actions)
assets/                icono 512 y miniatura 1920×1080 (se suben a mano en la ficha)
```

## Cómo se publica

1. **PR** que toque `proyectos/juegos/roblox-jelly-obby/**`: `stylua --check`, `selene src`, `lune run tests/run`,
   `rojo build -o build.rbxl` y el `.rbxl` como artefacto. `luau-lsp analyze` corre como aviso.
2. **Push a `main`**: lo mismo y publica en el **place de pruebas** (`OBBY_UNIVERSE_ID`, `OBBY_TEST_PLACE_ID`).
3. **Producción** (`OBBY_PLACE_ID`): trabajo aparte en el entorno `production` de GitHub, con **aprobación manual**.
   Sin esa variable ni siquiera se lanza.

Sin la clave o los IDs, la publicación dice «omitida» y termina en verde. Pasos de la cuenta en `DESPLIEGUE.md`.

En local (con Rokit): `rokit install`, `lune run tests/run`, `rojo build default.project.json -o build.rbxl`.

## Decisiones

- **Torre generada, siempre la misma.** `Stages.generate` con la semilla de `Config.Tower.seed` (cada fase con su
  propio generador). Cambiar la semilla da otra torre; las specs comprueban también otras semillas.
- **Todas las fases tienen solución.** Con la física por defecto (gravedad 196,2, andar 16, salto 7,2) se calcula
  el alcance de cada salto (`Stages.reach`) y solo se usa el 80 %. Las piezas que lanzan cuentan su propio largo como
  hueco (lanzan al tocarlas). Las specs prueban cada salto de las 40 fases, cintas más lentas que andar, charcos
  saltables, subida mínima por fase, sitio libre encima de cada trampolín y que nada choca con la columna.
- **Checkpoints validados en el servidor.** Solo cuenta el siguiente (k → k + 1), con el personaje de verdad encima y
  tras un tiempo mínimo creíble. Cada medio segundo se compara la posición: un salto horizontal imposible (más de
  100 studs/s y más de 40 studs) o caer 40 studs por debajo del checkpoint te devuelve a él. Saltarse checkpoints o
  teletransportarse no sirve de nada.
- **Impulso en el cliente.** Almohadillas y trampolines llevan el atributo `Launch`; el cliente impulsa a su propio
  personaje (en el servidor llegaría tarde). Gelatinas, baldosas, plataformas móviles (AlignPosition), giratorias
  (bisagra con motor) y baba van en el servidor, iguales para todos.
- **Guardado.** Igual que Jelly Pets: `UpdateAsync` con bloqueo de sesión, reintentos, presupuesto, guardado cada
  minuto, al llegar a la cima, al reiniciar, al salir y en `BindToClose`. Se guarda la fase, el récord, cimas,
  reinicios, monedas, estelas y el premio diario.
- **Compras.** `ProcessReceipt` idempotente: el `PurchaseId` y la fase nueva (o las monedas de reembolso si ya no se
  puede saltar) van en una sola escritura; el teletransporte, después. El botón ⏭️ solo sale con ID ≠ 0 y antes de la
  última fase: la cima hay que pisarla.
- **Interfaz sin texto.** Emojis y números, botones de 76 px con `UIScale`, a la derecha (lejos del joystick).
  Reiniciar pide dos toques. Sin chat propio, sin enlaces externos.
- **Marca Nuvolet Games.** Cielo, tinta, nube, sol y hierba; fuente FredokaOne; nube sonriente en la entrada y en la
  cima.

## Lo que solo se puede comprobar en la CI o en el place de pruebas

`selene`, `luau-lsp`, `rojo build` y las specs de Lune no se pudieron ejecutar en la sesión que escribió el juego
(descargas de binarios bloqueadas): se comprobaron sintaxis y formato (StyLua 2.6.0), y el generador y sus
aserciones se ejecutaron en una copia exacta en JavaScript (todas correctas con 6 semillas). La sensación de los
saltos, que las plataformas móviles y giratorias lleven bien al personaje, el impulso de los trampolines y la
interfaz en móvil se ven por primera vez en el place de pruebas.

## Pendiente

Evento de fin de semana (torre con semilla distinta y estela limitada), tabla de récords global (OrderedDataStore),
música y efectos de sonido, contador de tiempo por subida.
