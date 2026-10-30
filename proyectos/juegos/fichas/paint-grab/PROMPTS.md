# Paint Grab · art and music prompts

Image model: Higgsfield `gpt_image_2_5` ("GPT Image 2.5 Flare"): covers at `high` quality, `2k` (2.75 credits each);
menu background at `medium`, `1k` (0.5). **Total: 8.75 credits** (checked in the transaction history). One request at
a time (the first batch of 4 was rejected with 429 and charged nothing).
Music: ElevenLabs `eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits, $0.18). The run reported
"Instrumental: False", so it was checked with one `eleven_scribe_v1` transcription (176 credits): empty transcript,
no vocals.

**Cover 16:9**
> Game cover art for a casual mobile/web game called "PAINT GRAB". Top-down slightly tilted view of a sunny school
> playground made of grey asphalt with white chalk-drawn hopscotch squares and basketball court lines. Big areas of the
> ground are painted in bright flat colours (pink, blue, green, yellow) with clean blocky edges, like captured
> territory. In the centre, a chunky cute round pink blob painter character with big happy eyes and rosy cheeks zooms
> forward leaving a thick glossy pink paint trail behind it that curves into a loop; nearby, a cute blue blob painter
> and a yellow blob painter with surprised faces chase with their own trails. Paint splashes and drops flying. Big bold
> playful 3D title text "PAINT GRAB" at the top centre, letters filled with different bright paint colours with thick
> dark outline and drips. Clean flat vector cartoon style, thick dark outlines, vibrant saturated colours, high
> contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 2:3**: same scene, vertical, title "stacked on two lines" at the top, painter in the lower middle.
**Cover 1:1**: same scene, square, pink and blue painters only.

**Menu background (no text)**
> Title screen background illustration for a cartoon territory painting game, no text at all. Top-down view of a sunny
> school playground of grey asphalt with white chalk-drawn hopscotch squares and basketball court lines, bright flat
> paint patches (pink, blue, green, yellow) with blocky edges only near the left and right edges of the image, small
> paint splashes. Two cute round blob painter characters with happy faces, one pink near the far right edge and one
> blue near the far left edge, each leaving a short paint trail. The whole central vertical band of the image is calm
> plain asphalt with only faint chalk lines, left empty for a big play button and logo. Clean flat vector cartoon
> style, thick dark outlines, vibrant colours, no text, no letters, no numbers, no watermark.

**Music**
> Playful, energetic, cheerful instrumental loop for a cartoon casual game about painting a school playground. Bouncy
> pizzicato strings, xylophone and marimba, bright whistling-style synth lead, funky slap bass, handclaps and snappy
> drums, 124 BPM, major key, mischievous and fun, steady energy, seamless loop feel, no big intro or ending.
> Instrumental only, no vocals, no singing, no voices. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers cropped to 1920×1080, 800×1200, 800×800, itch 630×500 and a 512 px
icon; menu background to 1280×720 JPG quality 78 (`public/assets/menu-bg.jpg`, 91 KB); music to mono 64 kbps with a
0.8 s fade-out (`public/assets/music.mp3`, 257 KB). Everything inside the game (painters, faces, yard, chalk drawings,
icons, territory) is drawn by code.
