# Jelly Merge art and music prompts

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers; the menu background at
quality `medium`, `1k`; one batch of four: 3 × 2.75 + 0.5 = **8.75 Higgsfield credits** (checked in the transaction
history: four charges on 30/10/2026 at 05:52:32–33 UTC; balance 583.54 → 574.79). Music: ElevenLabs
`eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits); the run reported "Instrumental: False", so it was checked
with one Scribe transcription: empty transcript, it is instrumental (176 credits).

The characters are our own: round jelly blobs with faces in candy colours, and the Nuvolet Games cloud (the studio's
mascot) as the little cloud that carries the next jelly and as the big cloud that floats away. No fruit, no look-alike
of any known merge game.

**Cover 16:9**
> Game cover art for a casual web merge puzzle game called "JELLY MERGE". A big round glass jar filled with a happy
> pile of round squishy jelly blobs with cute faces (big shiny eyes, rosy cheeks, little smiles), in candy colors from
> tiny pink to orange, lemon, lime, mint, sky blue, grape and a big coral one, each size bigger than the last. Two
> matching mint jellies squishing together into a bigger jelly with a sparkly pop. Above the jar a small fluffy white
> cloud with a cute face holds the next jelly ready to drop. At the top right a big fluffy white smiling cloud with
> sparkles floats away into the bright blue sky. Big bold playful 3D title text "JELLY MERGE" in pink and yellow with
> thick dark purple outline at the top left. Clean flat vector cartoon style, thick outlines, glossy jelly highlights,
> vibrant saturated colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 2:3**
> Vertical game cover art for a casual web merge puzzle game called "JELLY MERGE". Title at the top: big bold playful
> 3D text "JELLY MERGE" in pink and yellow with thick dark purple outline. Below, a tall round glass jar stacked with
> round squishy jelly blobs with cute faces (big shiny eyes, rosy cheeks), candy colors pink, orange, lemon, lime, mint,
> sky blue, grape, sizes from tiny to huge, two matching jellies squishing together into a bigger one with a sparkly
> pop. A small fluffy white cloud with a cute face hovers above the jar holding the next tiny jelly. A big smiling white
> cloud with sparkles floats up out of the jar into the blue sky. Clean flat vector cartoon style, thick outlines,
> glossy jelly highlights, vibrant saturated colors, high contrast, readable at small thumbnail size, no other text,
> no watermark.

**Cover 1:1**
> Square game cover art for a casual web merge puzzle game called "JELLY MERGE". Close-up of two matching round
> squishy mint-green jelly blobs with cute happy faces squishing together into one bigger jelly with a sparkly pop
> burst, more cute candy-colored jelly blobs (pink, orange, lemon, sky blue, grape) piled in a round glass jar around
> them, a big smiling fluffy white cloud with sparkles floating away at the top. Big bold playful 3D title text
> "JELLY MERGE" in pink and yellow with thick dark purple outline at the bottom. Clean flat vector cartoon style, thick
> outlines, glossy jelly highlights, vibrant saturated colors, high contrast, readable at small thumbnail size, no
> other text, no watermark.

**Menu background (no text)**
> Title screen background illustration for a cute cartoon jelly merge puzzle game, no text at all. On the right third:
> a round glass jar on a green grassy hilltop, filled with a happy pile of round squishy jelly blobs with cute faces in
> candy colors (pink, orange, lemon, lime, mint, sky blue, grape), small ones on top and big ones at the bottom; a
> small fluffy white cloud with a cute face above the jar. The left and center of the image are fairly empty bright
> blue sky with a few soft white clouds, for a big title and round buttons. Rolling green hills at the bottom. Clean
> flat vector cartoon style, thick outlines, vibrant colors, no text, no letters, no watermark.

**Music**
> Cute, bouncy, cheerful instrumental loop for a cartoon jelly merge puzzle game about squishy jelly blobs and fluffy
> clouds. Plucky marimba and glockenspiel, soft ukulele strums, squishy synth bass, light claps and shaker, dreamy
> happy mood, 112 BPM, major key, no vocals, instrumental only, seamless loop feel, steady gentle energy, no big intro
> or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers to 1920×1080, 800×1200, 800×800, itch 630×500 (centre crop of the
16:9) and icon 512×512 (from the 1:1); favicon 64×64 from the 1:1; menu background to 1280×720 JPG quality 78
(`jelly-merge/public/assets/menu-bg.jpg`, 71 KB; in portrait the menu frames the jar on the right, `bgPortraitOrigin`
0.78); music to mono 64 kbps with a 0.8 s fade at the end (`jelly-merge/public/assets/music.mp3`, 251 KB).

In-game graphics are drawn by code and baked into textures (`src/cosmeticos.ts`, `src/scenes/Boot.ts`): nine jelly
sizes, each with its own face (dots, sparkly eyes, tongue, cat mouth, star eyes, toothy grin, heart cheeks, a crown on
the king) in three moods (normal, blink, worried) and five palettes; the glass jar (back and front), the top line, the
aim dots, the Nuvolet cloud with a face, sparkles, four sky themes and the shop previews: 0 bytes of extra downloads.
