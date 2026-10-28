# Para Moisés · Juegos (5 tareas, unos 2 minutos cada una, en este orden)

Todo lo demás está hecho: el juego, los paquetes, los textos y las portadas. Nada se publica hasta que tú pulses.

1. **Publicar la web del juego en Vercel** (no he podido hacerlo yo: esta sesión no tiene acceso a Vercel).
   [vercel.com/new](https://vercel.com/new) → importar `moisesmodu/vinclia-web` → **Root Directory: `proyectos/juegos`** →
   Deploy. Sin variables de entorno. Pásame la URL (`https://….vercel.app/egg-truck/`): la necesita Poki en el paso 3.

2. **CrazyGames**: crear la cuenta de desarrollador en [developer.crazygames.com](https://developer.crazygames.com/)
   → *Upload game* → subir `proyectos/juegos/paquetes/egg-truck/egg-truck-crazygames.zip`, las 3 portadas de
   `fichas/egg-truck/portadas/` y copiar los textos de `fichas/egg-truck/FICHAS.md` (apartado CrazyGames) → *Submit*.
   Para cobrar te pedirán los datos de pago (Tipalti) más adelante.

3. **Poki**: crear la cuenta en [developers.poki.com](https://developers.poki.com/) → *Submit your game* → pegar la URL
   de Vercel del paso 1 y el texto "Why is your game a good fit" de `FICHAS.md`. Si lo aceptan, te pedirán exclusividad
   web: avísame antes de firmar.

4. **itch.io**: crear la cuenta en [itch.io/register](https://itch.io/register) → [itch.io/game/new](https://itch.io/game/new)
   → *Kind: HTML* → subir `egg-truck-itch.zip`, marcar *played in the browser*, portada `egg-truck-itch-630x500.jpg`,
   capturas de `fichas/egg-truck/capturas/`, textos de `FICHAS.md` → guardar como **Public**.

5. **Visto bueno a la tarea programada** (un juego nuevo cada 2 semanas y revisión de los anteriores): claude.ai/code →
   *Scheduled tasks* → *New* → pegar el prompt de `proyectos/juegos/TAREA-PROGRAMADA.md`. O dime "créala" y la creo yo.

Los zips se descargan desde GitHub: abre el archivo en la rama del PR y pulsa *Download raw file*.
