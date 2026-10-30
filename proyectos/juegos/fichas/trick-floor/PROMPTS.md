# Trick Floor art and music prompts

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers; the menu background at
quality `medium`, `1k`: 3 × 2.75 + 0.5 = **8.75 Higgsfield credits** (checked in the transaction history). Music: ElevenLabs `eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits), checked for
vocals with a Scribe transcription (empty transcript: instrumental, 176 credits).

**Cover 16:9**
> Game cover art for a casual web platformer game called "TRICK FLOOR". A cute round mint-green jelly cube hero with big
> shiny eyes and a surprised open mouth, mid-jump inside a bright candy jelly castle hall, while the pink jelly floor
> tiles under him crumble and drop away, little spikes popping out of the floor, and a cheeky castle exit door with tiny
> legs running away on the right. Wobbly translucent jelly blocks in pink, lemon yellow, mint and grape purple, glossy
> highlights, pastel sky through castle windows, floating sparkles. Big bold playful 3D title text "TRICK FLOOR" in
> yellow with thick dark purple outline at the top center. Clean flat vector cartoon style, thick outlines, vibrant
> saturated colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 2:3**: same scene in a tall jelly castle tower, a jelly block falling from the ceiling, title at the top.
**Cover 1:1**: big hero close-up, floor tile dropping with spikes, door running in the background, title at the bottom.

**Menu background (no text)**
> Title screen background illustration for a cartoon platformer game, no text at all. A cute round mint-green jelly cube
> character with big shiny eyes standing happily on the right side on a pink jelly block floor inside a bright candy
> jelly castle hall, a castle door beside him. Pastel pink and lilac walls with jelly towers, arched windows showing
> soft blue sky and clouds, glossy wobbly jelly blocks in pink, lemon, mint and grape. The left and center areas calm
> and fairly empty for UI buttons. Clean flat vector cartoon style, thick outlines, vibrant colors, no text, no
> letters, no watermark.

**Music**
> Playful, mischievous, bouncy instrumental loop for a cartoon troll-platformer game set in a jelly castle. Pizzicato
> strings, plucky marimba, cheeky bassoon and tuba bass, light glockenspiel sparkles, soft brushed drums, sneaky
> tiptoe feel with a sudden bouncy groove, 120 BPM, major key with sly chromatic turns, no vocals, instrumental only,
> seamless loop feel, steady energy, no big intro or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers to 1920×1080, 800×1200, 800×800, itch 630×500 (centre crop of the
16:9) and icon 512×512 (from the 1:1); menu background to 1280×720 JPG quality 78 (`trick-floor/public/assets/menu-bg.jpg`);
music to mono 64 kbps with a 0.8 s fade at the end (`trick-floor/public/assets/music.mp3`, 256 KB).

In-game graphics (jelly blocks in five palettes, castle wall, spikes, darts, spring, door, hero and its six faces,
icons) are drawn by code in `src/scenes/Boot.ts` and baked into textures once: 0 bytes of extra downloads.
