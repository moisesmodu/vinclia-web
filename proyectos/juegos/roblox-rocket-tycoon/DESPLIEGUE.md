# Despliegue de Rocket Hop Tycoon (Roblox) · pasos exactos

Todo se hace en la web (create.roblox.com y GitHub). **No hace falta Roblox Studio.** Unos 15 minutos la primera vez;
después cada fusión en `main` publica sola en el place de pruebas. Es el mismo proceso que *Snow Plow Simulator*
(`../roblox-snow-plow/DESPLIEGUE.md`), con su propia experiencia y sus propias variables `ROCKET_*`.

## 0. El flujo de GitHub Actions
El flujo ya está en `.github/workflows/roblox-rocket-tycoon.yml` (raíz del repositorio).

## 1. Crear la experiencia y el place de pruebas (create.roblox.com)
1. [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations) → **Create Experience** →
   plantilla vacía (*Baseplate*). Nombre: **Rocket Hop Tycoon**. Déjala **privada**.
2. Abre la experiencia: el número de la URL `.../experiences/<universeId>/...` es el **universeId**.
3. **Places** → el place inicial → su número es el **placeId de producción**.
4. **Places → Create place** → nombre «Pruebas»: su número es el **placeId de pruebas**.
5. En **cada** place: **Configure → Server size = 8** (una base por jugador, igual que `Config.MaxPlayers`).
6. **Avatar**: R15 (por defecto). DataStores: nada que activar.

## 2. Clave de Open Cloud
La CI usa el mismo secreto `ROBLOX_API_KEY` que los otros juegos: basta con ampliar esa clave.
1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) → **API Keys** → la
   clave que ya usa la CI → **Edit**.
2. **Access permissions → universe-places** → **Add experience** → **Rocket Hop Tycoon** → operación **write**
   (`universe-places:write`). Guarda. (La clave no cambia: no hay que tocar el secreto.)
3. Si aún no existe ninguna clave: créala como en `../roblox/DESPLIEGUE.md` §3 (IP `0.0.0.0/0`, caducidad 1 año) y
   pégala como secreto `ROBLOX_API_KEY`.

## 3. GitHub (en este orden)
1. **Settings → Secrets and variables → Actions → Secrets**: `ROBLOX_API_KEY` (si no estaba).
2. **Variables → New repository variable**: `ROCKET_UNIVERSE_ID` = universeId · `ROCKET_TEST_PLACE_ID` = place de
   pruebas.
3. **Settings → Environments → `production`** (ya existe por los otros juegos; si no, créalo) → **Required
   reviewers: Moisés** → *Save*. Comprueba que está así **antes** de seguir.
4. **Solo después** crea la variable `ROCKET_PLACE_ID` = place de producción. Sin ella el trabajo de producción no
   se lanza; con el entorno protegido, nunca publica sin tu aprobación.
5. Prueba: **Actions → Roblox · Rocket Hop Tycoon → Run workflow** en `main`. «Publicar en el place de pruebas»
   debe acabar con `Publicado en el place …`. Entra al place de pruebas (*Play*) y prueba:
   - apareces en tu base; pisa la baldosa 🎁 (primer extractor) y mira las rocas por la cinta;
   - espera, pisa la baldosa 🏦 junto a la refinería y cobra; compra los siguientes botones;
   - con 500 🪙 y el escáner, compra la plataforma 🚀; sube al cohete (tecla E o el aviso 🚀), mantén 🔥 o
     Espacio, muévete con el joystick, pósate en un asteroide y recoge el 💎;
   - comprueba que **Espacio no te baja del cohete** y que ⏏️ sí; en el móvil, que el joystick mueve el cohete;
   - sal y vuelve a entrar: la base, las monedas y los cristales siguen; aparece «🌙 … ➜ 🏦» si pasaron más de 2 min.

## 4. Tienda (pases y productos)
1. **Monetization → Passes → Create a Pass** y ponlo a la venta. Tres: **2× Cash** (≈ 199 R$, la base gana el
   doble), **Auto-Collect** (≈ 149 R$, las monedas van solas al bolsillo) y **Faster Rocket** (≈ 99 R$, el cohete
   vuela 1,5× más rápido).
2. **Monetization → Developer Products → Create**: **Cash Pack** (≈ 25 R$, 10 minutos de ingresos), **Instant
   Upgrade** (≈ 39 R$, el siguiente botón gratis) y **Meteor Shower** (≈ 49 R$, 16 cristales caen en tu base 90 s).
3. Copia cada ID en `src/shared/Config.luau` (campo `id` de `Config.GamePasses` y `Config.Products`) y abre un PR:
   al fusionar se publica en pruebas. Con 0 la función sigue apagada y su botón no aparece.

## 5. Ficha y madurez
1. **Places → producción → Configure → Basic info**: descripción, icono `assets/icon-512.png` y miniatura
   `assets/thumbnail-1920x1080.jpg`. Género: *Tycoon*.
2. **Experience Questionnaire**: sin violencia, sin sangre, sin apuestas (los cristales salen al azar pero son
   gratis y las probabilidades no se venden), sin chat de voz, sin enlaces externos, compras con Robux sí →
   resultado esperado **Minimal**.
3. Cuando el place de pruebas esté bien: aprueba en GitHub el trabajo de producción y, en **Settings → Privacy**,
   pulsa **Public**. Ese clic es solo de Moisés.

## Si algo falla
- `HTTP 401/403`: la clave no tiene `universe-places:write` sobre **Rocket Hop Tycoon** (paso 2), o la IP no está
  permitida.
- `HTTP 404`: universeId o placeId mal copiados (el place debe ser de ese universo).
- `HTTP 409/429`: otra publicación a la vez o límite de ritmo: el script reintenta.
- El cohete tiembla o no sube: sube `MaxForce` de `Thrust` en `RocketService.luau` (está en 200 000).
- No se recogen cristales estando encima: el servidor acepta hasta 14 studs; si hay mucha latencia, sube
  `Config.Crystals.serverExtra`.
- «🏠 ❌» al entrar: el servidor tiene más jugadores que parcelas; el tamaño de servidor debe ser 8 (paso 1.5).
