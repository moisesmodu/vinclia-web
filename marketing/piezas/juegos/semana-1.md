# Piezas · Nuvolet Games · Semana 1 (2–8 nov 2026)

> Nada de esto se publica sin la aprobación de Moisés (`marketing/APROBAR.md`). En todas las piezas se dice que somos los autores («I made this» / «we're a two-person studio in Lleida, Spain») y que parte del arte y del contenido se hizo con ayuda de IA cuando la plataforma lo pida.
> Primero se aporta (el juego gratis, el detalle técnico, la respuesta a la duda) y después va el enlace. Una sola publicación por comunidad y semana, y se responde a todos los comentarios. Sin reseñas inventadas, sin cuentas falsas, sin votos propios.
> Enlaces: `https://juegos-casuales.vercel.app` (la portada lleva los 18 juegos). En portales, el tráfico que traemos nosotros con el enlace del portal se paga mejor (Poki, 100 %): cuando Poki o CrazyGames publiquen Egg Truck, las piezas de redes pasan a enlazar a la ficha del portal y la web propia queda para Reddit y foros.

Objetivo de la semana: que Egg Truck tenga su página pública en itch.io, que las comunidades de desarrolladores y de juegos web lo prueben, y que la marca Nuvolet exista en redes con un hilo de lanzamiento. Lo que decide el dinero (el lanzamiento completo en CrazyGames) depende de la retención, no de estas piezas; estas piezas traen las primeras partidas y los primeros comentarios con fallos reales.

Orden del día: J-02 (itch.io público) va primero; J-01 y J-05 el martes solo si itch.io ya está público.

---

## J-01 · Reddit r/WebGames
- **Canal:** Reddit, r/WebGames (https://www.reddit.com/r/WebGames/). [verificar] en la barra lateral si exige flair «[Dev]» o un día concreto para juegos propios antes de publicar
- **Idioma:** en
- **Día previsto:** sáb 7 nov (después de que itch.io esté público) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde su cuenta personal con historial (no una cuenta de marca recién creada)
- **Enlace con medición:** `https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=reddit&utm_medium=post&utm_campaign=j-01`
- **Estado:** ⬜ pendiente de aprobación

**Título (85 caracteres):**

> [Egg Truck] One-button hill driving: hold to go, release to brake, don't crack the egg

**Texto (publicación de enlace; si el sub exige texto, usar este como primer comentario):**

> I made this. It's a one-minute driving game: one button (or one finger on mobile), hold to accelerate, release to brake, and the egg in the back cracks a little more every hard landing. Three cracks and it's over. No download, no sign-up, no text, runs on a Chromebook.
>
> Play: https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=reddit&utm_medium=post&utm_campaign=j-01
>
> Built with Phaser, fixed-step physics so it plays the same on a slow laptop. I'd love to know where it stops being fun; the 300 m flag is where most people quit and I'm not sure if that's the difficulty curve or the terrain.

**Respuesta modelo 1 · «The controls feel floaty / I keep flipping»**

> Fair. The flip happens when you hold through the top of a hill; release just before the crest and the truck noses down. I tuned it so the first 100 m forgive that and then stop forgiving. If it's still flipping on flat ground for you, tell me your browser and I'll check the fixed-step timing on it.

**Respuesta modelo 2 · «Does it work on mobile?»**

> Yes, same page, touch anywhere to hold. It's a PWA, so «Add to Home Screen» makes it full screen and it plays offline after the first load. If the tap feels late on your phone, that's on me: say which phone and I'll look at it.

---

## J-02 · itch.io devlog #1
- **Canal:** itch.io, página de Egg Truck (https://nuvoletgames.itch.io/egg-truck), sección Devlog; se publica junto con el cambio de la página de borrador a pública
- **Idioma:** en
- **Día previsto:** sáb 7 nov · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde la cuenta de la marca en itch.io
- **Enlace con medición:** `https://juegos-casuales.vercel.app/?utm_source=itch&utm_medium=post&utm_campaign=j-02`
- **Estado:** ⬜ pendiente de aprobación

**Título:** Egg Truck is out: one button, one egg, one minute

> Hi. We're Nuvolet Games, a tiny studio from Lleida, Spain. Egg Truck is our first game and it's live on this page: free, pay what you want, no download.
>
> **What it is.** You drive a little truck over rolling hills with one button. Hold to accelerate, release to brake. There's an egg in the back and it cracks a bit on every hard landing. Three cracks and the run ends. Flags every 100 m, stars in the air after a ramp, and a reset that takes one click so you're back in before you've finished sighing. A run lasts about a minute. That's the whole game, on purpose.
>
> **How it's made.** Phaser 3. The physics run at a fixed step, so a slow laptop and a gaming PC get the same hills and the same crack timing; we got tired of games that are easier on faster machines. The terrain is generated and then baked into chunks, so the first frame is cheap and scrolling never stutters. There's no text anywhere in the game: the tutorial is a hand icon that holds and releases, which means it plays the same in any language and on a classroom Chromebook. Some of the art was made with AI tools and then cleaned up by hand; we say so here because we'd want to know.
>
> **What's next.** Bike Flip (a stunt bike where the flip is your turbo) and Snow Plow (push the presents to the sleigh before the snow buries them) are in the works for November. Egg Truck is also submitted to CrazyGames and Poki; if it shows up there, the version here stays and keeps updating.
>
> **What we'd like from you.** Where did you stop playing, and why? Was it a crash that felt unfair, a hill you couldn't read, or just enough? A sentence is plenty. If you hit a bug, say your browser and we'll fix it this week.
>
> Thanks for playing. Tiny games, big smiles.
>
> More of ours: https://juegos-casuales.vercel.app/?utm_source=itch&utm_medium=post&utm_campaign=j-02

(Unas 330 palabras.)

---

## J-03 · Reddit r/playmygame y r/IndieDev
- **Canal:** Reddit, r/playmygame (https://www.reddit.com/r/playmygame/) y r/IndieDev (https://www.reddit.com/r/IndieDev/). r/playmygame exige ser parte del equipo, dar un enlace jugable directo y describir el juego; el formato de campos de abajo es el que usan las publicaciones del sub. [verificar] las reglas actuales en la barra lateral el mismo día
- **Idioma:** en
- **Día previsto:** jue 12 nov (semana 2) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde su cuenta personal con historial
- **Enlace con medición:** `https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=reddit&utm_medium=post&utm_campaign=j-03`
- **Estado:** ⬜ pendiente de aprobación

**r/playmygame · título:** [PC] (Web) Egg Truck: one-button hill driving, don't crack the egg

> **Game Title:** Egg Truck
> **Playable Link:** https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=reddit&utm_medium=post&utm_campaign=j-03
> **Platform:** Web (desktop and mobile browser, no download, works on Chromebook)
> **Description:** A one-minute driving game. Hold one button to accelerate, release to brake, and carry an egg over rolling hills without cracking it. Every hard landing adds a crack; three and the run ends. Flags every 100 m, stars after ramps, one-click restart. No text, no sign-up. Made with Phaser, fixed-step physics, generated terrain. Part of the art was made with AI tools and cleaned up by hand.
> **Free to Play Status:** Free (pay what you want on itch.io, free on the web)
> **Involvement:** I'm the developer. Nuvolet Games is a tiny studio from Lleida, Spain; this is our first release and feedback on where it stops being fun is what I'm after.

**r/IndieDev · título:** Our first game is a one-button truck with an egg in the back. Here's what the egg taught us.

> We're a tiny studio from Lleida (Spain) and we just put out Egg Truck, a one-minute, one-button driving game. The hook is dumb and it works: there's an egg in the back and it cracks on every hard landing.
>
> Three things we learned shipping it:
>
> 1. **The egg is the tutorial.** We had a text tutorial. Then we had a hand icon. Then we realised the egg cracking on the first bad landing teaches «land flat» better than anything we wrote, so the tutorial is now 10 seconds and the first crack.
> 2. **Fixed-step physics or nothing.** Our first build was easier on fast machines. Fixed step at 60 Hz with interpolation fixed it, and the crack timing is now identical everywhere, which matters when players compare distances.
> 3. **Bake the terrain.** Generating hills per frame looked fine on a desktop and stuttered on a Chromebook. Now terrain is generated once per chunk and baked to textures. First frame is cheap, scrolling is flat.
>
> It's free in the browser, no download: https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=reddit&utm_medium=post&utm_campaign=j-03
>
> Happy to answer anything about the portal SDKs (CrazyGames, Poki, GameDistribution) too; integrating three at once was its own small adventure.

---

## J-04 · Foro de Phaser (showcase)
- **Canal:** Phaser Discourse, categoría Showcase (https://phaser.discourse.group/c/showcase)
- **Idioma:** en
- **Día previsto:** sáb 14 nov (semana 2) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde una cuenta del foro a nombre de Nuvolet Games (creada ese día; en este foro las cuentas de estudio son lo normal)
- **Enlace con medición:** `https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=phaser-forum&utm_medium=post&utm_campaign=j-04`
- **Estado:** ⬜ pendiente de aprobación

**Título:** Egg Truck: one-button hill driving with fixed-step physics and baked terrain (Phaser 3)

> Hello. Sharing our first Phaser 3 release, Egg Truck, a one-button hill-driving game where you carry an egg that cracks on hard landings. Play (no download): https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=phaser-forum&utm_medium=post&utm_campaign=j-04
>
> A few technical notes, in case they're useful to anyone building something similar:
>
> **Fixed-step physics.** The simulation runs at a fixed 60 Hz step decoupled from the render loop, with interpolation for the sprites. The game is deterministic across machines, so a 300 m run means the same thing on a Chromebook and on a desktop, and the «crack» threshold (vertical impact speed over a fixed value, three strikes) behaves identically everywhere.
>
> **Baked terrain.** Hills are generated from a seeded noise function in chunks ahead of the truck, then baked into render textures once per chunk. The physics body is a chain of short segments built from the same samples. Generating and drawing per frame stuttered on low-end hardware; baking fixed it, and chunks behind the player are recycled.
>
> **One-button input.** Pointer down and up, keyboard space, and gamepad A all map to the same «hold» state. The truck has torque while held and engine braking when released; the air tilt is a small torque applied while airborne, which is what makes «release before the crest» a learnable skill.
>
> **Portal SDKs.** The same build has thin adapters for the CrazyGames SDK v3 (midgame and rewarded), Poki (commercialBreak, rewardedBreak) and GameDistribution, chosen at build time by a flag, so the gameplay code never knows which portal it's on. Happy to share how we structured that if there's interest.
>
> Feedback on feel, difficulty or performance on your hardware is very welcome. Nuvolet Games, Lleida, Spain.

(Unas 290 palabras.)

---

## J-05 · Discord de desarrolladores de CrazyGames
- **Canal:** Discord oficial de CrazyGames para desarrolladores (enlace de invitación desde el panel de desarrollador: https://developer.crazygames.com/). Canal de presentaciones o de preguntas, según cómo esté organizado el servidor
- **Idioma:** en
- **Día previsto:** mar 10 nov (semana 2) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, con la cuenta de Discord vinculada a la cuenta de desarrollador
- **Enlace con medición:** ninguno en el mensaje (en Discord no se enlaza la web propia; el juego ya está en su panel)
- **Estado:** ⬜ pendiente de aprobación

**Mensaje (≈ 560 caracteres):**

> Hi all. Moisés here, Nuvolet Games, a two-person studio in Lleida, Spain. We make tiny one-minute browser games with Phaser. Our first one, Egg Truck (one-button hill driving, don't crack the egg), is in review on the portal right now, with SDK v3 midgame and rewarded ads already wired in. Two questions, if anyone has recent experience: what day-1 retention did you see when a basic launch got promoted to full, and is 1–2 weeks still the usual review time this quarter? Thanks, and happy to test other people's games in return.

---

## J-06 · Hilo de lanzamiento para X y Bluesky (5 publicaciones)
- **Canal:** X y Bluesky, cuenta de la marca @nuvoletgames (si no está libre, @nuvolet_games; anotar cuál). Mismo hilo en las dos redes
- **Idioma:** en
- **Día previsto:** dom 15 nov (semana 2) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde la cuenta de la marca
- **Enlace con medición:** `https://juegos-casuales.vercel.app/?utm_source=x&utm_medium=post&utm_campaign=j-06` (en Bluesky, `utm_source=bluesky`)
- **Estado:** ⬜ pendiente de aprobación

**1/5**
> We're Nuvolet Games, a tiny studio from Lleida, Spain. Today we're opening our shelf: 18 small browser games, each one playable in under a minute, no download, no sign-up. Tiny games, big smiles. 🧵
>
> GIF: la portada de la web con las 18 miniaturas, un cursor que pasa por encima y cada carátula hace su pequeña animación; termina sobre Egg Truck.

**2/5**
> First up: Egg Truck. One button. Hold to go, release to brake. There's an egg in the back and it cracks a little on every hard landing. Three cracks and you're done. Most people quit at the 300 m flag. Can you pass it?
>
> GIF: 6 segundos de partida, una rampa grande, aterrizaje plano, el huevo sonríe; luego un aterrizaje duro y la primera grieta.

**3/5**
> Why one button? Because the games are for the bus stop, the school Chromebook and the five minutes before dinner. No text anywhere, so they play the same in any language. Built with Phaser, fixed-step physics so a slow laptop isn't a harder game.
>
> GIF: pantalla partida: un dedo manteniendo y soltando a la izquierda, el camión reaccionando a la derecha.

**4/5**
> Coming in November: Bike Flip (the flip is your turbo) and Snow Plow (push the presents to the sleigh before the snow buries them). Egg Truck is also submitted to CrazyGames and Poki. Part of our art is made with AI tools and cleaned up by hand; we say so.
>
> GIF: 3 segundos de Bike Flip con una voltereta y el turbo, corte a Snow Plow empujando regalos.

**5/5**
> Play everything free, right now, in your browser: https://juegos-casuales.vercel.app/?utm_source=x&utm_medium=post&utm_campaign=j-06
> Tell us where a game stops being fun. That sentence is worth more to us than a like. 🌥️
>
> GIF: la nube Nuvolet de la pantalla de carga sonriendo y un «play» que aparece.

---

## J-07 · Texto de publicación del vídeo 1 («Don't crack it.»)
- **Canal:** TikTok, YouTube Shorts e Instagram Reels, cuenta de la marca (@nuvoletgames)
- **Idioma:** en
- **Día previsto:** sáb 21 nov (semana 3, cuando exista la cuenta de la marca) · segons/según `marketing/CALENDARIO.md`
- **Quién publica:** Moisés, desde la cuenta de la marca
- **Enlace con medición:** en la biografía: `https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=tiktok&utm_medium=bio&utm_campaign=j-07` (Shorts: `utm_source=youtube`; Reels: `utm_source=instagram`)
- **Estado:** ⬜ pendiente de aprobación

**Texto en pantalla (ya en el guion):** *POV: you're the egg*

**Pie de publicación (TikTok y Reels):**

> POV: you're the egg and the driver only has one button. 🥚🚚
> Hold to go, release to brake, land flat or crack. Free in your browser, no download. Link in bio.
> How far did you get before the third crack? Comment your metres.
> #eggtruck #browsergame #onebuttongame #indiegame #hillclimb #casualgames #webgame #gamedev #tinygames #nuvoletgames

**Título y descripción (YouTube Shorts):**

> Título: POV: you're the egg (Egg Truck, one-button driving game) #shorts
> Descripción: One button. Hold to go, release to brake. Don't crack the egg. Free browser game by Nuvolet Games, no download: https://juegos-casuales.vercel.app/play/egg-truck/?utm_source=youtube&utm_medium=bio&utm_campaign=j-07 · Part of the art was made with AI tools and cleaned up by hand. #eggtruck #browsergame #indiegame

**Comentario fijado (todas las plataformas):**

> Play it free here: link in bio. Made by two people in Lleida, Spain. Tell us where it stops being fun.
