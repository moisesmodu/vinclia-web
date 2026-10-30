# Tiny Harbor · store listings for the portals

Packages: `paquetes/tiny-harbor/tiny-harbor-crazygames.zip`, `-poki.zip`, `-gamedistribution.zip`, `-gamemonetize.zip`,
`-itch.zip` (index.html at the root of each zip, 0.7 MB zipped, 1.6 MB unpacked). Covers: `portadas/`. Screenshots
1920×1080: `capturas/` (plus portrait 390×844 for review).

## Common data
- **Name:** Tiny Harbor
- **Developer / studio name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app
  · **contact / support e-mail (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
- **Genre / category:** Idle · Management · Casual (CrazyGames: *Casual* → *Idle*; Poki: *Idle games* / *Management*)
- **Tags:** idle, management, harbor, boats, tycoon, crane, casual, cosy, kids, mobile
- **Controls:** touch (drag a boat with one finger, tap a price sign), mouse (click and drag, click)
- **Platforms:** desktop and mobile, landscape and portrait (the harbour rearranges itself when the screen turns)
- **Orientation:** both
- **Language:** no text in the game (numbers and icons only); listing in English
- **Audience:** all ages. No violence, no chat, no purchases, no personal data
- **Save:** yes, automatic (port, upgrades, stars, boat colours; on CrazyGames, in the player's account through
  `SDK.data`). Offline earnings once the player has a tugboat or the harbour pilot (capped at 2 hours)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts

**Short description (≤ 140 characters)**
> Drag boats to the crane, load the cargo and set sail. Grow a tiny dock into a busy harbor with one finger!

**Description**
> Tiny Harbor is a cosy idle harbour game you play with one finger. Boats line up at the anchorage: drag one to a
> crane, watch the crates swing on board, then drag the full boat out to the open sea. Every boat that sails pays.
>
> Spend your coins on the price signs along the quay: more cranes, faster cranes, bigger boats, better cargo, more
> room at the anchorage, a tugboat that brings boats to the cranes and a harbour pilot who sends full boats away on
> his own. Soon the harbour runs by itself, and it keeps earning while you are away.
>
> • Three ports to grow: fishing village, tropical island and big city port
> • Something new to buy every minute or two
> • Prestige: finish the city port and start again with a permanent bonus
> • Boat colours and flags to unlock with stars, plus a daily gift
> • One finger to play, no text, saves automatically
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Drag a waiting boat to a free crane. When it is full (green tick), drag it to the open sea with the arrows to get
> paid. Tap a green price sign to buy an upgrade. Buy the lighthouse to open the next port.

**Short instructions (itch.io "Instructions" field)**
> Drag boat → crane · Drag full boat → open sea · Tap a green sign to upgrade

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `tiny-harbor-crazygames.zip`. Type: HTML5. Adapts to any size (base 1280×720).
- Covers: `tiny-harbor-1920x1080.jpg` (landscape), `tiny-harbor-800x1200.jpg` (portrait), `tiny-harbor-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart`/`gameplayStop` (also around every ad);
  midgame ad only at natural pauses (back from the menu, never on the first play of the session, and when a port is
  finished), at most once every 3 minutes and never right after a rewarded ad; rewarded ads always optional (double
  boat: every boat pays ×2 for 60 s; ×2 offline earnings; ×2 port stars); cloud save with `SDK.data`; `happytime` when
  a port is finished; English; under 50 MB; no external links; audio muted during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a **playable link**: send `https://juegos-casuales.vercel.app/tiny-harbor/`
and, once accepted, upload `tiny-harbor-poki.zip`.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at natural pauses; optional `rewardedBreak`; no purchases or external links; adapts to 16:9 and portrait;
  1.6 MB initial download (limit 8 MB); works with an ad blocker.
- "Why is your game a good fit for Poki?":
  > Idle management games keep players for long sessions, and there are few on the web that play with one finger.
  > Tiny Harbor turns the genre's loop (load, sell, upgrade, automate) into a tactile drag: boat to crane, crane to
  > sea. Three ports as chapters, prestige, something to buy every minute or two. No text, 1.6 MB, mobile and desktop.

### GameDistribution / GameMonetize
- Files: `tiny-harbor-gamedistribution.zip`, `tiny-harbor-gamemonetize.zip` (they need the game id from their panel
  in `juegos.json` → `ids`, then rebuild). Same texts and covers.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `tiny-harbor-itch.zip` and tick *This file will be played in the browser*.
- Viewport 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `tiny-harbor-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `13-tutorial-zarpar.jpg`.
- Classification: Games · Genre: Simulation · Tags: idle, management, harbor, boats, cozy, casual, 2d, kids.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes*
  (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés presses "Public".
