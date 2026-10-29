# Despliegue de Jelly Pets (Roblox) · pasos exactos

Todo se hace en la web (create.roblox.com y GitHub). **No hace falta Roblox Studio.** Unos 15 minutos la primera vez;
después cada fusión en `main` publica sola en el place de pruebas. Es el mismo proceso que *Egg Truck Tycoon*
(`../roblox/DESPLIEGUE.md`), con su propia experiencia y sus propias variables `JELLY_*`.

## 1. Crear la experiencia y el place de pruebas (create.roblox.com)
1. [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations) → **Create Experience** →
   plantilla vacía (*Baseplate*). Nombre: **Jelly Pets**. Déjala **privada**.
2. Abre la experiencia: el número de la URL `.../experiences/<universeId>/...` es el **universeId**.
3. **Places** → el place inicial → su número es el **placeId de producción**.
4. **Places → Create place** → nombre «Pruebas»: su número es el **placeId de pruebas**.
5. En **cada** place: **Configure → Server size = 8** (el mapa tiene 8 bases).
6. **Avatar**: R15 (por defecto). DataStores: nada que activar.

## 2. Clave de Open Cloud
La CI usa el mismo secreto `ROBLOX_API_KEY` que Egg Truck Tycoon, así que basta con ampliar esa clave:
1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) → **API Keys** → la
   clave `github-egg-truck` → **Edit**.
2. **Access permissions → universe-places** → **Add experience** → **Jelly Pets** → operación **write**
   (`universe-places:write`). Guarda. (La clave no cambia: no hay que tocar el secreto.)
3. Si aún no existe ninguna clave: créala como en `../roblox/DESPLIEGUE.md` §3 (IP `0.0.0.0/0`, caducidad 1 año) con
   las dos experiencias y pégala como secreto `ROBLOX_API_KEY` (paso 3.2).

## 3. GitHub
1. El flujo ya está en `.github/workflows/roblox-jelly-pets.yml` (raíz del repositorio).
2. **Settings → Secrets and variables → Actions → Secrets**: `ROBLOX_API_KEY` (si no estaba).
3. **Variables → New repository variable**: `JELLY_UNIVERSE_ID` = universeId · `JELLY_TEST_PLACE_ID` = place de
   pruebas.
4. **Settings → Environments → `production`** (ya existe por Egg Truck Tycoon; si no, créalo) → **Required reviewers:
   Moisés** → *Save*. **Solo después** crea la variable `JELLY_PLACE_ID` = place de producción. Sin ella el trabajo de
   producción no se lanza; con el entorno protegido, nunca publica sin tu aprobación.
5. Prueba: **Actions → Roblox · Jelly Pets → Run workflow** en `main`. «Publicar en el place de pruebas» debe acabar con
   `Publicado en el place …`. Entra al place de pruebas (*Play* en su página) y prueba: comprar en la cinta, fusionar
   3 comunes, el candado y, con una segunda cuenta o un amigo, llevarse una gelatina y tocar al que se la lleva.

## 4. Tienda (pases y productos)
1. **Monetization → Passes → Create a Pass** (icono: `assets/icon-512.png` o cualquiera) y ponlo a la venta. Tres:
   **2× Coins** (≈ 199 R$), **Extra Pads** (≈ 149 R$), **Faster Lock** (≈ 99 R$).
2. **Monetization → Developer Products → Create**: **Lucky Roll** (≈ 49 R$, gelatina Épica o mejor) y **Coin Pack**
   (≈ 25 R$).
3. Copia cada ID en `src/shared/Config.luau` (campo `id` de `Config.GamePasses` y `Config.Products`) y abre un PR: al
   fusionar se publica en pruebas. Con 0 la función sigue apagada y su botón no aparece.

## 5. Ficha y madurez
1. **Places → producción → Configure → Basic info**: descripción, icono `assets/icon-512.png` y miniatura
   `assets/thumbnail-1920x1080.jpg`.
2. **Experience Questionnaire**: sin violencia (llevarse gelatinas no tiene daño), sin sangre, sin apuestas (la
   Tirada de suerte da siempre una gelatina Épica o mejor; las probabilidades están en `Config.luau`), sin chat de
   voz, sin enlaces externos, compras con Robux sí → resultado esperado **Minimal**.
3. Cuando el place de pruebas esté bien: aprueba en GitHub el trabajo de producción y, en **Settings → Privacy**,
   pulsa **Public**. Ese clic es solo de Moisés.

## Si algo falla
- `HTTP 401/403`: la clave no tiene `universe-places:write` sobre **Jelly Pets** (paso 2), o la IP no está permitida.
- `HTTP 404`: universeId o placeId mal copiados (el place debe ser de ese universo).
- `HTTP 409/429`: otra publicación a la vez o límite de ritmo: el script reintenta.
- Un servidor con más de 8 jugadores deja sin base al noveno: revisa *Server size = 8* en los dos places.
