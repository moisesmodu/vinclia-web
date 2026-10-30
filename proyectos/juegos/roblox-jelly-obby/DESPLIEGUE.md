# Despliegue de Jelly Tower Obby (Roblox) · pasos exactos

Todo se hace en la web (create.roblox.com y GitHub). **No hace falta Roblox Studio.** Unos 15 minutos la primera vez;
después cada fusión en `main` publica sola en el place de pruebas. Es el mismo proceso que *Jelly Pets*
(`../roblox-jelly-pets/DESPLIEGUE.md`), con su propia experiencia y sus propias variables `OBBY_*`.

## 1. Crear la experiencia y el place de pruebas (create.roblox.com)
1. [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations) → **Create Experience** →
   plantilla vacía (*Baseplate*). Nombre: **Jelly Tower Obby**. Déjala **privada**.
2. Abre la experiencia: el número de la URL `.../experiences/<universeId>/...` es el **universeId**.
3. **Places** → el place inicial → su número es el **placeId de producción**.
4. **Places → Create place** → nombre «Pruebas»: su número es el **placeId de pruebas**.
5. En **cada** place: **Configure → Server size = 20**.
6. **Avatar**: R15 (por defecto). DataStores: nada que activar.

## 2. Clave de Open Cloud
La CI usa el mismo secreto `ROBLOX_API_KEY` que los otros dos juegos: basta con ampliar esa clave.
1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) → **API Keys** → la
   clave que ya usa la CI → **Edit**.
2. **Access permissions → universe-places** → **Add experience** → **Jelly Tower Obby** → operación **write**
   (`universe-places:write`). Guarda. (La clave no cambia: no hay que tocar el secreto.)
3. Si aún no existe ninguna clave: créala como en `../roblox/DESPLIEGUE.md` §3 (IP `0.0.0.0/0`, caducidad 1 año) y
   pégala como secreto `ROBLOX_API_KEY`.

## 3. GitHub (en este orden)
1. El flujo va en `.github/workflows/roblox-jelly-obby.yml` (raíz del repositorio; copia de `ci/roblox-jelly-obby.yml`).
2. **Settings → Secrets and variables → Actions → Secrets**: `ROBLOX_API_KEY` (si no estaba).
3. **Variables → New repository variable**: `OBBY_UNIVERSE_ID` = universeId · `OBBY_TEST_PLACE_ID` = place de
   pruebas.
4. **Settings → Environments → `production`** (ya existe por los otros juegos; si no, créalo) → **Required
   reviewers: Moisés** → *Save*. Comprueba que está así **antes** de seguir.
5. **Solo después** crea la variable `OBBY_PLACE_ID` = place de producción. Sin ella el trabajo de producción no se
   lanza; con el entorno protegido, nunca publica sin tu aprobación.
6. Prueba: **Actions → Roblox · Jelly Tower Obby → Run workflow** en `main`. «Publicar en el place de pruebas» debe
   acabar con `Publicado en el place …`. Entra al place de pruebas (*Play*) y prueba: subir 3–4 fases, caer (vuelves
   al checkpoint), tocar baba, una almohadilla y un trampolín, salir y volver a entrar (sigues en tu fase).

## 4. Tienda (pases y producto)
1. **Monetization → Passes → Create a Pass** y ponlo a la venta. Tres: **Speed Coil** (≈ 99 R$), **Gravity Coil**
   (≈ 99 R$) y **Trails** (≈ 149 R$, estelas especiales).
2. **Monetization → Developer Products → Create**: **Skip Stage** (≈ 15–25 R$).
3. Copia cada ID en `src/shared/Config.luau` (campo `id` de `Config.GamePasses` y `Config.Products`) y abre un PR:
   al fusionar se publica en pruebas. Con 0 la función sigue apagada y su botón no aparece.
4. Opcional: **Badges → Create** «Cima de la torre» y su ID en `Config.FinishBadgeId`.

## 5. Ficha y madurez
1. **Places → producción → Configure → Basic info**: descripción, icono `assets/icon-512.png` y miniatura
   `assets/thumbnail-1920x1080.jpg`.
2. **Experience Questionnaire**: sin violencia (la baba te devuelve al checkpoint, sin daño), sin sangre, sin
   apuestas, sin chat de voz, sin enlaces externos, compras con Robux sí → resultado esperado **Minimal**.
3. Cuando el place de pruebas esté bien: aprueba en GitHub el trabajo de producción y, en **Settings → Privacy**,
   pulsa **Public**. Ese clic es solo de Moisés.

## Si algo falla
- `HTTP 401/403`: la clave no tiene `universe-places:write` sobre **Jelly Tower Obby** (paso 2), o la IP no está
  permitida.
- `HTTP 404`: universeId o placeId mal copiados (el place debe ser de ese universo).
- `HTTP 409/429`: otra publicación a la vez o límite de ritmo: el script reintenta.
- Un jugador vuelve a su checkpoint sin motivo: busca `movimiento imposible` en los registros del servidor
  (Creator Hub → Analytics → Error report) y sube `Config.AntiCheat.maxHorizontalSpeed`.
