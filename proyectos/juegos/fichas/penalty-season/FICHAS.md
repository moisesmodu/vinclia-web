# Penalty Season · fichas para los portales

Paquetes: `paquetes/penalty-season/penalty-season-crazygames.zip`, `-poki.zip`, `-gamedistribution.zip`,
`-gamemonetize.zip`, `-itch.zip` (index.html en la raíz). Portadas: `portadas/`. Capturas 1920×1080: `capturas/`
(`p-*.jpg`: comprobación en móvil vertical 390×844).

## Datos comunes
- **Name:** Penalty Season
- **Developer:** Nuvolet Games · «Tiny games, big smiles.» · web https://juegos-casuales.vercel.app
  · **contact / support email (all forms):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
- **Genre / category:** Sports · Football (soccer) · Casual. CrazyGames: *Sports* → *Soccer*; Poki: *Sports games* /
  *Soccer games*.
- **Tags:** penalty, soccer, football, sports, shootout, goalkeeper, swipe, league, management, animals, casual, mobile
- **Controls:** mouse or finger: swipe to shoot, click/tap the goal to dive. Keyboard for dives: ← / → / ↑ (or A / D).
- **Platforms:** desktop and mobile, landscape and portrait. **Orientation:** both (landscape preferred).
- **Language:** no text in the game (numbers and icons only); listing in English.
- **Audience:** all ages. No violence, no chat, no purchases, no personal data. Fictional animal teams only: no real
  clubs, players, leagues or logos.
- **Save:** yes (season, squad, coins, cosmetics; on CrazyGames in the player's account).
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts (English)

**Short description (≤ 140 characters)**
> Swipe to shoot, tap to save! Win penalty shootouts, upgrade your animal squad and lead your club to the top of the league.

**Description**
> Penalty Season is a quick-fire penalty shootout game with a light football-manager twist.
>
> Shoot with one swipe: the direction aims, the speed sets the power and a curved swipe bends the ball around the
> keeper. Watch the keeper sway on his line and strike when he leans the wrong way. Hit it too hard and it flies over
> the bar!
>
> Then pull on the gloves. Read the opponent's run-up: just before the kick he glances at the corner he wants... most
> of the time. Tap the goal to dive. Go too early and a clever striker will switch sides.
>
> Between matches, run your club: a ten-match season in a league of cute animal teams, a live league table, coins to
> upgrade your five strikers (power and accuracy) and your keeper (reflexes), and team morale that rises with every
> win. Finish top to win promotion; three divisions stand between you and the title.
>
> • One swipe to shoot, one tap to save: learn it in seconds
> • Five kicks each, then sudden death: matches last one to two minutes
> • Full season with league table, promotion and three divisions
> • Squad upgrades, team morale, daily reward, kits and ball skins
> • No text: plays the same in every language; phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Swipe up from the ball to shoot: the direction aims, a faster swipe hits harder (too hard goes over the bar) and a
> curved swipe bends the shot. When the opponent shoots, tap the spot in the goal where you want your keeper to dive
> (or use the arrow keys). Win the shootout, earn coins, upgrade your squad and win the league!

**Short instructions (itch.io "Instructions" field)**
> Swipe = shoot (curve it!) · Tap the goal = dive · Win the league to go up a division

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `penalty-season-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and aspect).
- Covers: `penalty-season-1920x1080.jpg` (landscape), `penalty-season-800x1200.jpg` (portrait),
  `penalty-season-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart`/`gameplayStop` (start of each match, end of
  each match, menus, around every ad); midgame ad only between matches and never before the first match of the
  session; rewarded ads always optional (retake one missed penalty per match, ×2 match coins); save through
  `SDK.data`; English; under 50 MB; no external links; audio muted during ads; `happytime` on a league title.
- Form: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and asks first for a playable link: send the Vercel URL
(`https://juegos-casuales.vercel.app/penalty-season/`) and, once accepted, upload `penalty-season-poki.zip`.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  between matches (not before the first); `rewardedBreak` optional; no purchases or external links; any aspect ratio;
  about 1.7 MB download (limit 8 MB); works with an ad blocker.
- "Why is your game a good fit for Poki?":
  > Sports with light management is one of the stickiest formats on the web, but penalty games are usually one-off
  > shootouts. Penalty Season wraps a one-swipe shootout (with curve and a readable keeper tell) in a ten-match season,
  > a league table, squad upgrades and three divisions, so every match matters. No text, 1-2 minute matches, 1.7 MB,
  > mobile and desktop.

### GameDistribution / GameMonetize
- Files: `penalty-season-gamedistribution.zip` and `penalty-season-gamemonetize.zip`. They need the *Game ID* from each
  portal's dashboard in `juegos.json` → `ids` and a rebuild (`npm run paquetes`); without it the game runs without ads.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `penalty-season-itch.zip`, tick *This file will be played in the browser*.
- Viewport 1280×720, *Mobile friendly*, *Fullscreen button*, *Automatically start on page load: no*.
- Cover image: `penalty-season-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-shop.jpg`.
- Classification: Games · Genre: Sports · Tags: soccer, football, penalty, sports, management, swipe, casual, 2d.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes*
  (graphics and music).
- Contact on the page: hola@numimates.com. Visibility: **Draft** until Moisés presses "Public".
