# Jelly Merge · portal listings

Packages: `paquetes/jelly-merge/jelly-merge-crazygames.zip`, `jelly-merge-poki.zip`, `jelly-merge-itch.zip` (index.html
at the root, 0.66 MB; the shared scripts also build `-gamedistribution` and `-gamemonetize`). Covers: `portadas/`.
Screenshots 1920×1080: `capturas/01` to `10`; portrait phone (390×844): `capturas/11` and `12`.

## Common data
- **Name:** Jelly Merge
- **Developer name (all portals):** Nuvolet Games · "Tiny games, big smiles." · web https://juegos-casuales.vercel.app
  (planned domain nuvolet.games) · studio icon: `fichas/estudio-icono-512.png`
- **Contact / support email (every form):** hola@numimates.com
- **Genre / category:** Puzzle · Merge · Casual (CrazyGames: *Puzzle* → *Merge*; Poki: *Puzzle games* / *Merge games*)
- **Tags:** merge, drop, puzzle, physics, jelly, cute, cloud, casual, relaxing, mobile, kids, brain
- **Controls:** mouse or touch. Move to aim, release (or click) to drop. Keyboard: arrows or A/D to aim, Space to drop.
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (portrait is the natural way on a phone)
- **Language:** no text in the game (only numbers, icons and the title); listing in English
- **Audience:** all ages. No violence (when the jar is full the jellies just look worried), no chat, no purchases, no
  personal data
- **Save:** yes (best score, coins, cosmetics, clouds made, daily streak; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.
- **Ads:** interstitial only when a new run starts after at least 3 finished runs (never on the first run of a session,
  never on revive); rewarded ads (always optional): revive once per run (the jellies at the top of the jar pop away)
  and ×2 coins on the game-over panel.

## Texts

**Short description (≤ 140 characters)**
> Drop squishy jelly blobs, merge matching ones into bigger jellies and float the biggest away as a cloud!

**Description**
> Jelly Merge is a cosy drop-and-merge physics puzzle with squishy jelly friends. A little cloud carries a jelly above
> a glass jar: move to aim, let go, and it drops in with a soft wobble. When two jellies of the same size touch, they
> squish together into the next size up, with a pop and a brand-new face.
>
> Nine sizes, from a tiny pink drop to the crowned king jelly. Make the king and it puffs into a smiling cloud that
> floats out of the jar: big bonus points, extra coins and room to breathe. Keep the pile under the line at the top:
> if a jelly stays above it for two seconds, the run is over.
>
> • One move: aim and release, learn it in 10 seconds
> • Soft jelly physics: every jelly squashes and wobbles when it lands
> • Chain merges for extra points and the floating cloud bonus
> • Runs of 2 to 5 minutes, instant restart
> • Coins for every run, a shop with jelly colour sets and sky themes, and a daily gift
> • Plays with one finger or the mouse, portrait or landscape; no text, everyone can play
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Move your finger or the mouse to aim the jelly under the little cloud, then release (or click) to drop it. Two
> jellies of the same size merge into the next size. Two of the second-biggest make the crowned king, which floats
> away as a cloud for bonus points. Keep the jellies below the line at the top of the jar.

**Short instructions (itch.io "Instructions" field)**
> Move = aim · Release = drop · Two of a size merge · Make the king to float a cloud away · Stay under the line!

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `jelly-merge-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and to portrait).
- Covers: `jelly-merge-1920x1080.jpg` (landscape), `jelly-merge-800x1200.jpg` (portrait), `jelly-merge-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart` when a run starts or is revived and
  `gameplayStop` on game over, in menus and around ads; ads only through the SDK (`midgame` when a new run starts, at
  most every 3 runs, never on the first; optional `rewarded` to revive once or double the coins); save with
  `SDK.data`; `happytime` on a new best and on every cloud; English; under 50 MB; no external links; audio muted
  during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a playable link: send the Vercel URL
(`https://juegos-casuales.vercel.app/jelly-merge/`, once the game is marked ready and deployed) and, once accepted,
upload `jelly-merge-poki.zip` to Poki for Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at the natural break before a new run (never on the first run, at most every 3 runs, never on revive);
  optional `rewardedBreak` to revive or double the coins; no purchases or external links; adapts to any aspect ratio;
  0.66 MB download (limit 8 MB); works with an ad blocker.
- Form text ("Why is your game a good fit for Poki?"):
  > Drop-and-merge physics puzzles are among the most played puzzles on the web, and most versions are fruit clones.
  > Jelly Merge brings its own cast: squishy jelly blobs with a different face for every size that squash and wobble
  > when they land, and a crowned king jelly that floats away as a cloud, emptying the jar for a big bonus. One move
  > (aim and release), no text, 2–5 minute runs, portrait-first on phones, a 0.66 MB download.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `jelly-merge-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `jelly-merge-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-noche-neon.jpg`.
- Classification: Games · Genre: Puzzle · Tags: merge, puzzle, physics, cute, casual, relaxing, short, 2d, touch, mouse.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés clicks "Public".

## Screenshots
| File | Shows |
|---|---|
| `01-menu.jpg` | Title screen (menu art, play, best score, coins, shop and sound) |
| `02-tutorial.jpg` | First run with the 10 s tutorial: slide to aim, lift to drop |
| `03-juego.jpg` | A busy jar, the aim dots down to the landing spot, the size ladder and the next bubble |
| `04-fusion.jpg` | Two jellies merge into the next size (+points) |
| `05-nube.jpg` | The crowned king puffs into a cloud that floats out of the jar |
| `06-peligro.jpg` | The pile crosses the line: worried faces, the line blinks red |
| `07-final.jpg` | Game over: score, best, coins and one-click restart |
| `08-tienda.jpg` | Shop: jelly colour sets and sky themes |
| `09-diario.jpg` | Daily gift with the 7-day streak |
| `10-noche-neon.jpg` | Neon jellies under the night sky (cosmetics) |
| `11-movil-menu.jpg`, `12-movil-juego.jpg` | Portrait phone 390×844, a jelly aimed and dropped with a real finger drag |
