# Para Moisés · Juegos (5 tareas, unos 2 minutos cada una)

Lo demás está hecho: el juego, los paquetes, los textos y las portadas. El despliegue en Vercel lo hace la sesión del
Mac con `DESPLIEGUE.md`. Nada se publica hasta que tú pulses.
Mientras tanto puedes jugarlo aquí (página privada tuya): https://claude.ai/artifact/JGnchXupFQeV1Dm1aLb2sv

1. **CrazyGames**: crear la cuenta de desarrollador en [developer.crazygames.com](https://developer.crazygames.com/)
   → *Upload game* → subir `proyectos/juegos/paquetes/egg-truck/egg-truck-crazygames.zip`, las 3 portadas de
   `fichas/egg-truck/portadas/` y copiar los textos de `fichas/egg-truck/FICHAS.md` (apartado CrazyGames) → *Submit*.
   Los datos de cobro (Tipalti) te los pedirán más adelante.

2. **Poki**: crear la cuenta en [developers.poki.com](https://developers.poki.com/) → *Submit your game* → pegar la URL
   `https://juegos-casuales.vercel.app/egg-truck/` (cuando la sesión del Mac la haya publicado) y el texto "Why is your
   game a good fit" de `FICHAS.md`. Si lo aceptan te pedirán exclusividad web: avísame antes de firmar.

3. **itch.io**: crear la cuenta en [itch.io/register](https://itch.io/register) → [itch.io/game/new](https://itch.io/game/new)
   → *Kind: HTML* → subir `egg-truck-itch.zip`, marcar *played in the browser*, portada `egg-truck-itch-630x500.jpg`,
   capturas de `fichas/egg-truck/capturas/`, textos de `FICHAS.md` → **Public**.

4. **GameDistribution** (reparte el juego a miles de webs y paga por publicidad): cuenta en
   [gamedistribution.com/developers](https://gamedistribution.com/developers/) → *Add game* → copia el **Game ID** que
   te dan y pásamelo (o pégalo en `juegos.json` → `ids.gamedistribution`); yo recompilo y te dejo el zip para subir.

5. **GameMonetize**: cuenta en [gamemonetize.com](https://gamemonetize.com/) → *Upload game* → igual que el anterior,
   pásame el Game ID (`ids.gamemonetize`).

Los zips se descargan desde GitHub: abre el archivo en la rama del PR y pulsa *Download raw file*.
La tarea programada quincenal (`TAREA-PROGRAMADA.md`) se crea cuando des el visto bueno a la ola (CARTERA.md).
