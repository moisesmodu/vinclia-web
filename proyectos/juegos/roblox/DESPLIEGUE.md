# Despliegue de Egg Truck Tycoon (Roblox) · pasos exactos

Todo se hace en la web (create.roblox.com y GitHub). **No hace falta instalar Roblox Studio.** Unos 15 minutos la
primera vez; después cada fusión en `main` publica sola en el place de pruebas.

## 1. Cuenta (Moisés)
1. Cuenta de Roblox con correo verificado y verificación de identidad (necesaria para vender pases y, más tarde,
   para DevEx). Activa la verificación en dos pasos.

## 2. Crear la experiencia y el place de pruebas (create.roblox.com)
1. [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations) → **Create Experience**
   → plantilla vacía (*Baseplate*). Nombre: **Egg Truck Tycoon**. Queda **privada** (no la pongas pública).
2. Abre la experiencia → **Configure** (o *Overview*): el número de la URL
   `.../experiences/<universeId>/...` es el **universeId**.
3. **Places** → el place inicial → su número es el **placeId** de **producción**.
4. **Places → Create place** → nombre «Pruebas»: su número es el **ROBLOX_TEST_PLACE_ID**.
5. En la experiencia: **Places → (cada place) → Configure → Server size = 12** (el juego tiene 12 parcelas).
6. DataStores: no hay que activar nada; funcionan en cualquier place publicado (el juego guarda solo).
7. **Avatar**: tipo de avatar **R15** (por defecto).

## 3. Clave de Open Cloud
1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) → **API Keys →
   Create API Key**. Nombre: `github-egg-truck`.
2. **Access permissions → Add API system → universe-places** → elige la experiencia **Egg Truck Tycoon** →
   operación **write** (`universe-places:write`). La CI de ahora solo necesita esta. (Cuando lleguen las pruebas de
   humo y el panel: añadir `universe.place.luau-execution-session:write` y `universe-datastores.objects:read`, con
   la misma experiencia.)
3. **Security → Accepted IP addresses**: `0.0.0.0/0` (las máquinas de GitHub cambian de IP). Caducidad: 1 año.
4. **Save & Generate key** → copia la clave (solo se ve una vez).

## 4. GitHub (repositorio de la web o el propio `egg-truck-roblox` si se separa)
1. El flujo ya está en `.github/workflows/roblox.yml` (raíz del repositorio). Comprueba en PR (formato, lint, tests,
   `rojo build`) y publica en el place de pruebas al hacer push a `main` o a la rama base de la cartera.
2. **Settings → Secrets and variables → Actions → Secrets → New repository secret**:
   `ROBLOX_API_KEY` = la clave del paso 3.
3. **Variables → New repository variable**:
   `ROBLOX_UNIVERSE_ID` = universeId · `ROBLOX_TEST_PLACE_ID` = place de pruebas.
4. **Settings → Environments → New environment** → `production` → **Required reviewers: Moisés** → *Save*.
   **Solo después** crea la variable `ROBLOX_PLACE_ID` = place de producción (sin ella el trabajo de producción no
   se lanza; con el entorno protegido, nunca publica sin tu aprobación).
5. Prueba: **Actions → Roblox · Egg Truck Tycoon → Run workflow** en `main`. El trabajo «Publicar en el place de
   pruebas» debe acabar con `Publicado en el place …`. Entra al place de pruebas desde la web (botón *Play* en su
   página, con la experiencia privada solo tú puedes) y graba 20 s de conducción.

## 5. Tienda (pases y productos)
1. Experiencia → **Monetization → Passes → Create a Pass** (sube el icono `assets/icon-512.png` o cualquiera) y
   pon precio (*Sales → Item for sale*). Crea tres: **2× Cash** (≈ 199 R$), **Big Truck** (≈ 149 R$),
   **Second Farm** (≈ 249 R$).
2. **Monetization → Developer Products → Create**: **Golden Egg** (≈ 25 R$) e **Instant Repair** (≈ 15 R$).
3. Copia cada ID en `src/shared/Config.luau` (`Config.GamePasses` y `Config.Products`) y abre un PR: la CI publica
   en pruebas al fusionar. Con 0, la función sigue apagada.

## 6. Ficha y madurez
1. **Places → producción → Configure → Basic info**: descripción (desde `fichas/` cuando exista), icono
   `assets/icon-512.png` y miniatura `assets/thumbnail-1920x1080.jpg`.
2. **Experience Questionnaire** (madurez y cumplimiento): sin violencia, sin sangre, sin apuestas, sin chat de voz,
   sin enlaces externos, compras de Robux sí → resultado esperado **Minimal**. Envía el cuestionario.
3. Cuando el place de pruebas esté bien: aprueba en GitHub el trabajo de producción y, en **Settings → Privacy**,
   pulsa **Public**. Ese clic es solo de Moisés.

## Si algo falla
- `HTTP 401/403`: la clave no tiene `universe-places:write` sobre esa experiencia, o la IP no está permitida.
- `HTTP 404`: universeId o placeId mal copiados (el place debe ser de ese universo).
- `HTTP 409/429`: otra publicación a la vez o límite de ritmo: el script reintenta.
- El camión va hacia atrás o gira al revés: cambia `driveSign` o `steerSign` en `Config.luau` (−1 ↔ 1).
