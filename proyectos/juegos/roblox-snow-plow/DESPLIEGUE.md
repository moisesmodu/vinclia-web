# Despliegue de Snow Plow Simulator (Roblox) · pasos exactos

Todo se hace en la web (create.roblox.com y GitHub). **No hace falta Roblox Studio.** Unos 15 minutos la primera vez;
después cada fusión en `main` publica sola en el place de pruebas. Es el mismo proceso que *Jelly Pets*
(`../roblox-jelly-pets/DESPLIEGUE.md`), con su propia experiencia y sus propias variables `SNOW_*`.

**Fecha límite: publicar en producción antes del 1 de diciembre** (el calendario de Adviento empieza el 1 a las
00:00 UTC, que son la 01:00 en España). Lo ideal es tenerlo en pruebas a mediados de noviembre.

## 1. Crear la experiencia y el place de pruebas (create.roblox.com)
1. [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations) → **Create Experience** →
   plantilla vacía (*Baseplate*). Nombre: **Snow Plow Simulator**. Déjala **privada**.
2. Abre la experiencia: el número de la URL `.../experiences/<universeId>/...` es el **universeId**.
3. **Places** → el place inicial → su número es el **placeId de producción**.
4. **Places → Create place** → nombre «Pruebas»: su número es el **placeId de pruebas**.
5. En **cada** place: **Configure → Server size = 12** (igual que `Config.MaxPlayers`).
6. **Avatar**: R15 (por defecto). DataStores: nada que activar.

## 2. Clave de Open Cloud
La CI usa el mismo secreto `ROBLOX_API_KEY` que los otros juegos: basta con ampliar esa clave.
1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) → **API Keys** → la
   clave que ya usa la CI → **Edit**.
2. **Access permissions → universe-places** → **Add experience** → **Snow Plow Simulator** → operación **write**
   (`universe-places:write`). Guarda. (La clave no cambia: no hay que tocar el secreto.)
3. Si aún no existe ninguna clave: créala como en `../roblox/DESPLIEGUE.md` §3 (IP `0.0.0.0/0`, caducidad 1 año) y
   pégala como secreto `ROBLOX_API_KEY`.

## 3. GitHub (en este orden)
1. El flujo ya está en `.github/workflows/roblox-snow-plow.yml` (raíz del repositorio).
2. **Settings → Secrets and variables → Actions → Secrets**: `ROBLOX_API_KEY` (si no estaba).
3. **Variables → New repository variable**: `SNOW_UNIVERSE_ID` = universeId · `SNOW_TEST_PLACE_ID` = place de
   pruebas.
4. **Settings → Environments → `production`** (ya existe por los otros juegos; si no, créalo) → **Required
   reviewers: Moisés** → *Save*. Comprueba que está así **antes** de seguir.
5. **Solo después** crea la variable `SNOW_PLACE_ID` = place de producción. Sin ella el trabajo de producción no se
   lanza; con el entorno protegido, nunca publica sin tu aprobación.
6. Prueba: **Actions → Roblox · Snow Plow Simulator → Run workflow** en `main`. «Publicar en el place de pruebas»
   debe acabar con `Publicado en el place …`. Entra al place de pruebas (*Play*) y prueba: quitar nieve hasta llenar
   la barra ❄️, vaciarla en el depósito (círculo azul), comprar una mejora de pala (el carrito se ensancha), abrir un
   huevo 🥚 (el compañero te sigue), abrir el Parque 🌲 en la puerta de hielo, salir y volver a entrar (todo sigue).

## 4. Tienda (pases y productos)
1. **Monetization → Passes → Create a Pass** y ponlo a la venta. Tres: **2× Snow** (≈ 199 R$, la nieve vale el
   doble), **Bigger Backpack** (≈ 149 R$, mochila ×2) y **Auto-Collect** (≈ 249 R$, imán que recoge alrededor).
2. **Monetization → Developer Products → Create**: **Snow Storm** (≈ 49 R$, nieve 3× más rápida 10 minutos en ese
   servidor, para todos), **Coin Pack** (≈ 25 R$) y **Lucky Egg** (≈ 49 R$, compañero Raro o mejor).
3. Copia cada ID en `src/shared/Config.luau` (campo `id` de `Config.GamePasses` y `Config.Products`) y abre un PR:
   al fusionar se publica en pruebas. Con 0 la función sigue apagada y su botón no aparece.

## 5. Ficha y madurez
1. **Places → producción → Configure → Basic info**: descripción, icono `assets/icon-512.png` y miniatura
   `assets/thumbnail-1920x1080.jpg`. Género: *Simulator*. En diciembre, menciona el calendario de Adviento.
2. **Experience Questionnaire**: sin violencia, sin sangre, sin apuestas (los huevos se abren con monedas del juego;
   el Huevo de la suerte da siempre Raro o mejor y las probabilidades se ven en el juego), sin chat de voz, sin
   enlaces externos, compras con Robux sí → resultado esperado **Minimal**.
3. Cuando el place de pruebas esté bien: aprueba en GitHub el trabajo de producción y, en **Settings → Privacy**,
   pulsa **Public**. Ese clic es solo de Moisés.

## Si algo falla
- `HTTP 401/403`: la clave no tiene `universe-places:write` sobre **Snow Plow Simulator** (paso 2), o la IP no está
  permitida.
- `HTTP 404`: universeId o placeId mal copiados (el place debe ser de ese universo).
- `HTTP 409/429`: otra publicación a la vez o límite de ritmo: el script reintenta.
- La pala no recoge nada al ir muy rápido (por ejemplo con un objeto de velocidad de otro juego): el antitrampas
  descarta ese vistazo; si pasa a menudo, sube `Config.AntiCheat.speedSlack`.
- El calendario no sale: solo aparece del 1 al 25 de diciembre (UTC). Para probarlo antes, cambia temporalmente
  `Config.Advent.month` al mes actual en una rama y publícala solo en pruebas.
