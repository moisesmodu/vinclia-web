# Pin Rescue art and music prompts

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers; the menu background at
quality `medium`, `1k`, one image at a time: 3 × 2.75 + 0.5 = **8.75 Higgsfield credits** (checked in the transaction
history, 30/10/2026 02:04–02:21 UTC). Music: ElevenLabs `eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits);
the run reported "Instrumental: False", so it was checked with one Scribe transcription: empty transcript, it is
instrumental (176 credits).

The hero is our own character (a round coral-pink jelly blob with a little green leaf sprout); the enemies are grumpy
purple slimes. No look-alike of any known pull-the-pin hero.

**Cover 16:9**
> Game cover art for a casual web physics puzzle game called "PIN RESCUE". A cutaway of a cosy stone tower with several
> chambers separated by big shiny golden pins with round ring handles. One pin is being pulled out sideways with a
> sparkle trail. Above: a chamber full of bright blue water and a chamber of glowing orange lava meeting and turning into
> grey stone with puffs of steam; a pile of shiny gold coins and gems sliding down a chute. At the bottom right: a very
> cute round coral-pink jelly blob hero with big shiny eyes, rosy cheeks and a tiny green leaf sprout on its head,
> cheering with open arms. A small grumpy purple slime with angry eyebrows in a side chamber. Big bold playful 3D title
> text "PIN RESCUE" in yellow with thick dark purple outline at the top center. Clean flat vector cartoon style, thick
> outlines, vibrant saturated colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 2:3**: same style; title at the top, a tall tower with stacked chambers, water pouring onto lava that turns to
stone, coins and gems sliding down a chute, a grumpy slime in a side chamber, the jelly hero cheering at the bottom as
coins rain down.
**Cover 1:1**: close-up of the jelly hero catching a shower of coins and gems after a golden pin slides out of a stone
wall; water meeting lava with steam on one side, a grumpy slime peeking from a chamber; title at the bottom.

**Menu background (no text)**
> Title screen background illustration for a cartoon pull-the-pin physics puzzle game, no text at all. A cosy grey stone
> tower cutaway in the centre with a few chambers and big shiny golden pins with round ring handles, a small pool of blue
> water and a small pool of orange lava at the top corners, a pile of gold coins and gems at the bottom. The cute
> coral-pink jelly hero standing happily at the bottom centre on the gold. The middle of the image, above the hero, is a
> calm, fairly empty soft dark stone wall area for a big round play button and UI. Blue sky with soft clouds and green
> hills at the far left and right edges. Clean flat vector cartoon style, thick outlines, vibrant colors, no text, no
> letters, no watermark.

**Music**
> Curious, playful, cheerful instrumental loop for a cute cartoon pull-the-pin puzzle game about a jelly hero collecting
> gold in a stone tower. Bouncy pizzicato strings, plucky marimba and glockenspiel, soft tuba bass, light woodblock and
> shaker, sneaky-but-happy puzzle mood, 104 BPM, major key, no vocals, instrumental only, seamless loop feel, steady
> gentle energy, no big intro or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers to 1920×1080, 800×1200, 800×800, itch 630×500 (centre crop of the
16:9) and icon 512×512 (from the 1:1); favicon 64×64 from the icon; menu background to 1280×720 JPG quality 78
(`pin-rescue/public/assets/menu-bg.jpg`; in portrait the menu frames the centre, where the hero and the empty wall are);
music to mono 64 kbps with a 0.8 s fade at the end (`pin-rescue/public/assets/music.mp3`, 256 KB).

In-game graphics (the jelly hero and its five faces in six skins, the slime, bombs, gems, six pin styles, four themed
towers, icons) are drawn by code in `src/scenes/Boot.ts`, `src/scenes/Play.ts` and `src/cosmeticos.ts` and baked into
textures; the walls of each level are baked into one texture when the level starts, and every material cell is written
into one 120×160 canvas texture drawn 4× (nearest filter): 0 bytes of extra downloads.
