# Trick Floor · portal listings

Packages: `paquetes/trick-floor/trick-floor-crazygames.zip`, `trick-floor-poki.zip`, `trick-floor-itch.zip` (index.html at
the root, 0.67 MB; the shared scripts also build `-gamedistribution` and `-gamemonetize`). Covers: `portadas/`.
Screenshots 1920×1080: `capturas/01` to `08`; portrait phone (390×844): `capturas/09` and `10`.

## Common data
- **Name:** Trick Floor
- **Developer name (all portals):** Nuvolet Games · "Tiny games, big smiles." · web https://juegos-casuales.vercel.app
  (planned domain nuvolet.games) · studio icon: `fichas/estudio-icono-512.png`
- **Contact / support email (every form):** hola@numimates.com
- **Genre / category:** Platformer · Troll / trap platformer · Casual (CrazyGames: *Platformer*; Poki: *Platform games* / *Skill*)
- **Tags:** platformer, troll, traps, jelly, castle, levels, jump, funny, kids, mobile, keyboard, short levels
- **Controls:** keyboard (arrows or A/D to run; Up, W, Z or Space to jump, hold for a higher jump); touch (big
  on-screen left, right and jump buttons; multi-touch)
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (landscape preferred)
- **Language:** no text in the game (only numbers, icons and the title); listing in English
- **Audience:** all ages. Mild cartoon slapstick only (the jelly hero squishes and pops back at the start), no chat,
  no purchases, no personal data
- **Save:** yes (unlocked levels, stars and fewest deaths per level; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.
- **Ads:** interstitial only between levels, at most once every 3 finished levels and never on the first level of a
  session, never on deaths; rewarded ad (optional) = skip the level, offered after 3 deaths or on the give-up panel.

## Texts

**Short description (≤ 140 characters)**
> Nothing is what it seems in the jelly castle. Floors drop, spikes pop and the door runs away. Can you outsmart 25 levels?

**Description**
> Trick Floor is a cheeky platformer set in a wobbly jelly castle. Run, jump and reach the door... if the level lets you.
>
> Every level hides one to five tricks that only show themselves when they fire: floor tiles that drop the moment you
> step on them, spikes that pop out of nowhere, ceilings that fall, fake platforms, darts that shoot out of the walls,
> gravity that flips you onto the ceiling and an exit door that gets up and runs away.
>
> Dying is part of the fun: you pop back at the start of the level in half a second, the trick resets, and now you
> know. Beat each level with as few deaths as you can to earn up to three stars.
>
> • 25 short handmade levels in five jelly colours
> • Tight controls: coyote time, jump buffering, variable jump height
> • Instant respawn, no game over, a death counter instead
> • Three stars per level, progress saved
> • Keyboard or big thumb-friendly touch buttons, landscape or portrait
> • No text: everyone can play
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Arrow keys or A/D to run, Up, W or Space to jump (hold for a higher jump). On touch screens use the arrow buttons
> bottom left and the jump button bottom right. Reach the door, and remember where the traps were!

**Short instructions (itch.io "Instructions" field)**
> ←/→ or A/D = run · ↑, W or Space = jump · Reach the door · Every level has a trick!

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `trick-floor-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size).
- Covers: `trick-floor-1920x1080.jpg` (landscape), `trick-floor-800x1200.jpg` (portrait), `trick-floor-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart` when a level starts and `gameplayStop`
  at the door, on the give-up panel, in menus and around ads; ads only through the SDK (`midgame` between levels, at
  most every 3 levels; optional `rewarded` to skip a level); save with `SDK.data`; `happytime` on three stars;
  English; under 50 MB; no external links; audio muted during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a playable link: send the Vercel URL
(`https://juegos-casuales.vercel.app/trick-floor/`) and, once accepted, upload `trick-floor-poki.zip` to Poki for Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at the natural break between levels (never on the first level, never on deaths); optional `rewardedBreak`
  to skip a level; no purchases or external links; adapts to any aspect ratio; 1.6 MB download (limit 8 MB); works
  with an ad blocker.
- Form text ("Why is your game a good fit for Poki?"):
  > Troll platformers are some of the most watched and shared web games, but most look harsh. Trick Floor brings the
  > same "the level lies to you" surprise to a bright jelly castle that kids and parents enjoy: 25 short levels,
  > instant respawn, no text, keyboard and thumb-friendly touch controls, 1.6 MB.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `trick-floor-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `trick-floor-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `08-nivel-superado.jpg`.
- Classification: Games · Genre: Platformer · Tags: platformer, troll, traps, jelly, cute, short, 2d, keyboard, touch.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés clicks "Public".

## Screenshots
| File | Shows |
|---|---|
| `01-menu.jpg` | Title screen (menu art, play, level select, stars) |
| `02-niveles.jpg` | Level select with stars and padlocks |
| `03-tutorial.jpg` | Level 1 with the 10 s keyboard tutorial |
| `04-techo-cae.jpg` | Level 5: the ceiling falls |
| `05-suelo-cae.jpg` | Level 1: the floor in front of the door drops |
| `06-gravedad.jpg` | Level 18: gravity flip, the door has run away to the ceiling |
| `07-puerta-huye.jpg` | Level 10: the door runs away on little legs |
| `08-nivel-superado.jpg` | Level complete: stars, deaths, best |
| `09-movil-menu.jpg`, `10-movil-juego.jpg` | Portrait phone 390×844 with the touch buttons |
