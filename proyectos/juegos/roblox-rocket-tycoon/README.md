# Rocket Hop Tycoon (Roblox) · Nuvolet Games

Quinta experiencia de Roblox del catálogo (R4 en `../CATALOGO.md`, tras Egg Truck Tycoon, Jelly Tower Obby, Jelly
Pets y Snow Plow Simulator): **tycoon espacial** para toda la familia. Toma el bucle de los tycoons clásicos
(`../IDEAS-LIDERES.md` §2: comprar, producir, mejorar, renacer, vuelta diaria) y le pone el gancho de nuestro juego
web *Rocket Hop*: un cohete de **un botón** con el que saltas entre asteroides para recoger cristales raros.
Igual que los otros: código Luau en Git, mapa generado por código y publicación por la API Open Cloud desde GitHub
Actions. **Nadie abre Roblox Studio.**

**El bucle:** cada jugador recibe una base lunar (8 por servidor) → pisa la baldosa 🎁 y tiene su primer extractor
⛏️ → las rocas caen a la cinta, pasan por los escáneres ✨ y llegan a la refinería → la refinería llena la caja 🏦 →
la cobras pisando su baldosa → compras más baldosas (extractores, escáneres, muros 🧱, cúpulas 🏠, plataforma del
cohete 🚀, bandera, farolas, antena 📡 y el Observatorio 🔭) → con el cohete subes a los asteroides y recoges 💎
(cada uno +1 % de ingresos) → con el Observatorio, **renaces** con un multiplicador para siempre. Premio diario con
racha y ganancias mientras no estás (la mitad, hasta 4 horas).

## Estructura

```
default.project.json   Rojo 7: carpetas → árbol de Roblox (y los RemoteEvents)
rokit.toml             versiones fijadas: rojo 7.4.4, lune 0.8.9, selene 0.27.1, stylua 2.6.0
selene.toml stylua.toml .luaurc   lint, formato y modo estricto (iguales que Snow Plow)
src/shared/            ReplicatedStorage.Shared (servidor y cliente). Módulos puros, sin Roblox ni require:
  Config.luau          parcela, 22 botones (árbol de dependencias, precios, posiciones), cohete, asteroides,
                       cristales, renacer, premios, guardado e IDs de la tienda (0 = apagado)
  Buttons.luau         árbol: validar (sin ciclos, todo alcanzable), orden, visibles, reglas de compra,
                       siguiente botón (Instant Upgrade), limpiar el guardado
  Income.luau          extractores, escáneres, cúpulas, cristales, pase 2×, ticks, Cash Pack, formato corto
  Rebirth.luau         precio, multiplicador y si se puede renacer
  Offline.luau         ganancias sin conectar con tope
  Daily.luau           premio diario con racha de 7 días
  Rocket.luau          velocidades, combustible, techo, radio de vuelo y qué es alcanzable
  Crystals.luau        asteroides con semilla (al alcance del cohete), lluvia de meteoritos, tipo de cristal,
                       validación de las recogidas
  Layout.luau          dónde va cada parcela
  Rng.luau             generador con semilla (Park–Miller): misma secuencia en Lune y en Roblox
src/server/            ServerScriptService.Server
  Main.server.luau     arranque, RemoteEvents validados y limitados, entrada/salida
  Services/            DataService (bloqueo de sesión), MonetizationService (ProcessReceipt idempotente),
                       RateLimiter, Catalog, WorldBuilder (Luna), PlotService (parcelas), ItemBuilder (máquinas),
                       TycoonService (baldosas, ingresos, caja), RocketService (cohete, asteroides, cristales),
                       ProgressService (sin conectar, diario, renacer)
src/client/            Hud, RocketController (pilotar), CrystalSeeker (pedir cristales), OreView (rocas de la cinta)
tests/                 specs de Lune de los módulos puros: `lune run tests/run` (62 pruebas)
scripts/publish.sh     publica un .rbxl con Open Cloud (curl), con reintentos
(.github/workflows/roblox-rocket-tycoon.yml en la raíz del repositorio: flujo de GitHub Actions)
assets/                icono 512 y miniatura 1920×1080 (se suben a mano en la ficha)
```

## Cómo se publica

1. **PR** que toque `proyectos/juegos/roblox-rocket-tycoon/**`: StyLua, selene, `lune run tests/run`,
   `rojo build -o build.rbxl` y el `.rbxl` como artefacto; `luau-lsp analyze` como aviso.
2. **Push a `main`**: lo mismo y publica en el **place de pruebas** (`ROCKET_UNIVERSE_ID`, `ROCKET_TEST_PLACE_ID`).
3. **Producción** (`ROCKET_PLACE_ID`): trabajo aparte en el entorno `production`, con **aprobación manual** de
   Moisés. Sin esa variable no se lanza.

Sin la clave o los IDs, la publicación dice «omitida» y termina en verde. Pasos de la cuenta en `DESPLIEGUE.md`.
En local (con Rokit): `rokit install`, `lune run tests/run`, `rojo build default.project.json -o build.rbxl`.

## Decisiones

- **Árbol de botones como datos.** Cada botón dice qué necesita; `Buttons.validate` comprueba ids, tipos, precios,
  que no haya ciclos, que todo sea alcanzable y que haya un botón gratis para empezar. Las specs compran siempre el
  más barato visible hasta el final y comprueban que ninguna baldosa cae encima de otra ni de una máquina.
- **Ingresos en el servidor, rocas en el cliente.** El servidor suma `Income.perSecond` cada segundo (sin física
  ni `Touched` que fallen). Las rocas de la cinta las dibuja cada cliente con tweens (solo parcelas cercanas, tope
  de 160): no cuestan red.
- **El cohete.** Modelo de bloques con `VehicleSeat`. Al subir el dueño, el servidor le da la propiedad de red;
  el cliente lo mueve con `LinearVelocity` y `AlignOrientation` (física de Roblox): mantener 🔥/Espacio sube,
  soltar planea, joystick en horizontal. Combustible de 4 s que se rellena posado; techo de 72 studs y radio de
  70 alrededor de la plataforma. Los asteroides se reparten con semilla y las specs comprueban que todos se
  alcanzan con el 80 % del depósito. Nadie más puede sentarse; un cohete vacío vuelve solo a los 6 s y uno muy
  fuera de su zona, al momento.
- **Cristales validados.** El cliente pide el cristal; el servidor exige que exista, sea de tu parcela, estés a
  ≤ 14 studs, no recojas dos en 0,15 s y no hayas viajado más de lo posible desde la última recogida.
  Azul 1 (80 %), rosa 3 (17 %), dorado 10 (3 %); +1 % de ingresos cada uno, tope ×3 (+0,5 por renacimiento).
- **Guardado y compras.** DataService de Snow Plow: `UpdateAsync` con bloqueo de sesión, reintentos, presupuesto,
  autoguardado y `BindToClose`; `ProcessReceipt` idempotente (el `PurchaseId` va en la misma escritura). Instant
  Upgrade elige el botón dentro de esa escritura; si ya está todo, da un Cash Pack.
- **Interfaz sin texto**, botones de 64 px a la derecha, botón de empuje de 130 px abajo a la derecha. Sin chat
  propio ni enlaces externos. Los bucles del cliente empiezan después de poner la interfaz.

## Lo que solo se puede comprobar en la CI o en el place de pruebas

`selene`, `luau-lsp` y `rojo build` no se pudieron ejecutar al escribir el juego. Las 62 specs sí se ejecutaron con
una máquina virtual de Luau (luau-web en Node, simulando `require` y `@lune/process`) y pasan; el formato se comprobó
con StyLua 2.6.0. El vuelo del cohete (propiedad de red, `VehicleSeat` en móvil, Espacio sin bajarse), el aspecto
de la base y la escala de la interfaz se ven por primera vez en el place de pruebas.

## Pendiente

Música y sonidos, tabla de récords, cosméticos del cohete (como en la web) y que el análisis de tipos sea obligatorio.
