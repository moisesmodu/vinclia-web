# Rope Cut art and music prompts

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers; the menu background at
quality `medium`, `1k`: 3 × 2.75 + 0.5 = **8.75 Higgsfield credits** (checked in the transaction history, 30/10/2026
01:02 UTC). Music: ElevenLabs `eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits); the run reported
"Instrumental: False", so it was checked with one Scribe transcription: empty transcript, it is instrumental (176 credits).

The monster is our own character (a round lime-green jelly blob with big eyes, sitting on a wooden crate): no frog and
no look-alike of any known rope-cutting game.

**Cover 16:9**
> Game cover art for a casual web physics puzzle game called "ROPE CUT". A round shiny striped red-and-white wrapped
> candy hanging from two colorful ropes tied to golden pegs, one rope being sliced by a sparkling swipe trail, the candy
> swinging down toward a very cute round lime-green jelly blob monster with a huge happy open mouth, tiny tongue and
> big shiny eyes, sitting on a wooden crate on the right. Floating soap bubbles, golden stars to collect, a small blue
> air puffer. Bright cardboard-box candy workshop background in sky blue and warm yellow. Big bold playful 3D title
> text "ROPE CUT" in yellow with thick dark purple outline at the top center. Clean flat vector cartoon style, thick
> outlines, vibrant saturated colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 2:3**: same style; title at the top, the candy on three ropes with one snapping, three stars along its path, a
bubble, and the monster looking up from its crate at the bottom.
**Cover 1:1**: close-up of the monster catching the falling candy under a cut rope, stars and bubbles, title at the bottom.

**Menu background (no text)**
> Title screen background illustration for a cartoon physics puzzle game, no text at all. A very cute round lime-green
> jelly blob monster with big shiny eyes and a happy open mouth sitting on a wooden candy crate on the right side, a
> striped red-and-white wrapped candy hanging from a colorful rope on a golden peg above it. Bright sky blue cardboard
> candy workshop wall with soft clouds, a few floating soap bubbles and small golden stars near the edges. The left and
> center areas calm and fairly empty for a big round play button and UI. Clean flat vector cartoon style, thick
> outlines, vibrant colors, no text, no letters, no watermark.

**Music**
> Gentle, playful, curious instrumental loop for a cute cartoon physics puzzle game about cutting ropes to feed candy
> to a jelly monster. Plucky pizzicato strings, soft marimba and celesta, warm ukulele, light finger snaps and a soft
> bouncy upright bass, relaxed thinking-puzzle mood, 100 BPM, major key, no vocals, instrumental only, seamless loop
> feel, steady gentle energy, no big intro or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers to 1920×1080, 800×1200, 800×800, itch 630×500 (centre crop of the
16:9) and icon 512×512 (from the 1:1); menu background to 1280×720 JPG quality 78 (`rope-cut/public/assets/menu-bg.jpg`;
in portrait the menu frames the right side, where the monster is); music to mono 64 kbps with a 0.8 s fade at the end
(`rope-cut/public/assets/music.mp3`, 256 KB).

In-game graphics (the monster and its five faces, six candy skins, five hats, ropes, pegs, bubbles, puffers, spike
bars, wind, four themed boards, icons) are drawn by code in `src/scenes/Boot.ts` and `src/cosmeticos.ts` and baked into
textures once: 0 bytes of extra downloads. Ropes are drawn as one stretched image per chain link, never as live Graphics.
