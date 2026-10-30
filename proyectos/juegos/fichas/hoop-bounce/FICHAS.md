# Hoop Bounce · store listings for the three portals

Packages: `paquetes/hoop-bounce/hoop-bounce-crazygames.zip`, `hoop-bounce-poki.zip`, `hoop-bounce-itch.zip` (index.html at
the zip root, 0.67 MB each; also `hoop-bounce-gamedistribution.zip` and `hoop-bounce-gamemonetize.zip`). Covers:
`portadas/`. Screenshots 1920×1080: `capturas/`.

## Common data
- **Name:** Hoop Bounce
- **Studio / developer name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app (planned domain nuvolet.games)
  · **contact / support email (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
  · game icon: `portadas/hoop-bounce-icono-512.png`
- **Genre / category:** Sports · Basketball · Casual (CrazyGames: *Sports* → subcategory *Basketball*; Poki: *Basketball games* / *Sports games*)
- **Tags:** basketball, hoop, one button, tap, sports, casual, combo, kids, mobile, physics
- **Controls:** tap or click anywhere to bounce the ball. Keyboard: Space, Up arrow or W.
- **Platforms:** desktop and mobile, portrait and landscape
- **Orientation:** both (made portrait-first; in landscape the court gets wider)
- **Language:** no text in the game (numbers and icons only; "HOOP BOUNCE" is the brand name); listing in English
- **Audience:** all ages. No violence (a miss is a dizzy-eyed bounce on the floor), no chat, no purchases, no personal data
- **Save:** yes (best score, coins and unlocked items; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts (English)

**Short description (≤ 140 characters)**
> Tap to bounce the ball into the moving hoop! Chain clean swishes for fire combos, grab the golden ball and beat your best.

**Description**
> Hoop Bounce is a one-tap basketball game with a very cute ball. Every tap bounces it up and nudges it towards the
> hoop. Time your taps so the ball drops through the hoop from above, and don't let it hit the floor!
>
> Swish it without touching the rim and your combo multiplier climbs: ×2, ×3, ×4... From ×3 the ball catches fire.
> After every basket the hoop jumps to the other side of the court, then it starts sliding, rising and falling, and
> slowly shrinking. Three rim hits and the run is over, but three swishes in a row win a life back.
>
> Watch out for the golden ball: bounce into it and for 8 seconds every basket counts double.
>
> • One tap to play: learn it in 10 seconds, no text needed
> • A moving, shrinking hoop that switches sides after every basket
> • Swish combos with fire, golden-ball bonus, beat your best score
> • Coins unlock new balls (watermelon, planet, emoji faces and more), nets and courts
> • Daily gift, short runs of 1 to 3 minutes, instant restart
> • Plays great in portrait and landscape, on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Tap, click or press Space to bounce the ball up and towards the hoop. Score by dropping it through the hoop from
> above. Clean swishes raise the combo; touching the rim three times or letting the ball hit the floor ends the run.
> Bounce into the golden orb for 8 seconds of double points.

**Short instructions (itch.io "Instructions" field)**
> Tap / click / Space = bounce · Drop it in from above · Swish = combo · 3 rim hits or the floor = game over

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `hoop-bounce-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and aspect ratio).
- Covers: `hoop-bounce-1920x1080.jpg` (landscape), `hoop-bounce-800x1200.jpg` (portrait), `hoop-bounce-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `gameplayStart`/`gameplayStop`; ads only through the SDK (midgame on
  restart, never before the first run of the session; optional rewarded ad to revive once per run and to double the
  coins of a run); `loadingStart/Stop`; save through `SDK.data`; English; under 50 MB; no external links; audio muted
  during ads; `happytime` on a new best. Tested with `scripts/sdk-test-espera.mjs crazygames` (no errors).
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for **a playable link**. Send the Vercel URL
(`https://juegos-casuales.vercel.app/hoop-bounce/`) and, once accepted, upload `hoop-bounce-poki.zip` in Poki for
Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  before every run except the first; optional `rewardedBreak`; no purchases or external links; any aspect ratio;
  1.6 MB initial download (limit 8 MB); works with an ad blocker. Tested with `scripts/sdk-test-espera.mjs poki` (no errors).
- Text for the form ("Why is your game a good fit for Poki?"):
  > Basketball is one of the most played sports themes on the web, and one-tap games keep players coming back. Hoop
  > Bounce mixes both with a cute ball that reacts with its face, a hoop that moves, shrinks and switches sides,
  > swish combos with fire and a golden-ball bonus. No text, 1–3 minute runs, 1.6 MB download, portrait-first.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `hoop-bounce-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 720×1280 (portrait) or 1280×720; tick *Mobile friendly*, *Fullscreen button* and leave *Automatically
  start on page load* off.
- Cover image: `hoop-bounce-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-diario.jpg`.
- Classification: Games · Genre: Sports · Tags: basketball, one-button, casual, arcade, 2d, cute, mobile.
- Pricing: *No payments*. AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés presses "Public".

## Technical notes
- No physics engine: the ball is a circle integrated by hand at a fixed 120 Hz step (accumulated from
  `game.loop.rawDelta`), the rim is two collision points, the backboard a rectangle and the net blocks shots from
  below (and deflects the ball back to the middle of the court so it never gets stuck). A basket counts when the ball
  centre crosses the rim line going down, after the whole ball has been above the rim.
- World: fixed height of 1200 units, width 680–1400 depending on the screen; the camera zooms the whole court to the
  screen. The court background is baked into one texture per screen size; ball faces are a separate upright image
  over the rotating ball skin.
- Difficulty by baskets: still hoop (0–2), sideways (3–7), up and down (8–13), both (14+), slowly faster; the rim
  shrinks from 212 to 150 units (ball diameter 92).
- Performance (`hoop-bounce/rendimiento.json`, 800×360 touch, DPR 2, CPU ×4, 45 s autopilot): CPU per frame 3.1 ms
  median, 7.7 ms p95, 13.7 ms p99 with the container at load average ≈ 6 (an earlier run at load ≈ 3.5 gave 1.7 /
  4.5 / 8.1 ms); menu loaded in 1.7 s; no errors.
