# Paper Glide art and music prompts (reusable by changing the theme)

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers (2.75 credits each); the
menu background at quality `medium`, resolution `1k` (0.5). Submitted one at a time. Total **8.75 Higgsfield
credits** (checked in the transaction history: 30/10/2026 01:02:39, 01:04:21, 01:06:23 and 01:08:19 UTC).
Music: ElevenLabs `eleven_music_v2_5`, 32 s, one take (900 ElevenLabs credits, $0.18). The run reported
"Instrumental: False", so it was checked with Scribe v1: empty transcript = no vocals (176 credits, $0.04).

**Cover 16:9**
> Game cover art for a casual mobile/web game called "PAPER GLIDE". A big cute white paper airplane with a friendly
> cartoon face (big eyes, happy smile) and a red stripe on its wings, soaring high over a colourful cartoon town and
> green park, leaving a swirly dotted trail. Visible swirling turquoise updraft air currents lifting it, a few golden
> coins in a curved arc, a red balloon and a small blue bird nearby, a glowing yellow boost ring. Bright blue sky with
> soft fluffy clouds, sunny. Big bold playful 3D title text "PAPER GLIDE" in yellow with thick dark outline at the top
> center. Clean flat vector cartoon style, thick dark outlines, vibrant saturated flat colors, high contrast, readable
> at small thumbnail size, no other text, no watermark.

**Cover 2:3**
> Vertical game cover art for a casual mobile/web game called "PAPER GLIDE". A big cute white paper airplane with a
> friendly cartoon face (big eyes, happy smile) and red stripes on its wings, soaring upward in the middle of the
> image, riding swirling turquoise updraft air currents with arrows, a curved arc of golden coins, a red balloon, a
> small blue bird and a glowing yellow boost ring nearby. Below: a colourful cartoon town with a clock tower and a green
> park with a fountain. Bright blue sky, fluffy clouds, sunny. Big bold playful 3D title text "PAPER GLIDE" in yellow
> with thick dark outline at the top, on two lines. Clean flat vector cartoon style, thick dark outlines, vibrant
> saturated flat colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Cover 1:1**
> Square game cover art for a casual mobile/web game called "PAPER GLIDE". A big cute white paper airplane with a
> friendly cartoon face (big eyes, happy smile) and red stripes on its wings, flying diagonally up across the center,
> riding a swirling turquoise updraft air current with arrows, a curved arc of golden coins behind it, a red balloon
> and a small blue bird, a glowing yellow boost ring. Below: a colourful cartoon town and green park. Bright blue sky,
> fluffy clouds. Big bold playful 3D title text "PAPER GLIDE" in yellow with thick dark outline at the top center.
> Clean flat vector cartoon style, thick dark outlines, vibrant saturated flat colors, high contrast, readable at small
> thumbnail size, no other text, no watermark.

**Menu background (no text)**
> Title screen background illustration for a cartoon paper airplane gliding game, no text at all. A cute white paper
> airplane with a friendly face and red wing stripes gliding to the right, placed slightly right of center at about
> two thirds of the image height, riding a soft swirling turquoise updraft. A few golden coins in a gentle arc behind
> it. Bottom edge: a colourful cartoon town with rooftops, a clock tower, green park trees. The upper half and the
> left third are mostly open bright blue sky with a few soft white clouds, empty for UI buttons. Clean flat vector
> cartoon style, thick dark outlines, vibrant flat colors, no text, no letters, no logo, no watermark.

(The model placed the plane in the upper right; in portrait the menu crops the background at 79 % from the left so the
plane sits between the title and the play button.)

**Music**
> Airy, uplifting, light instrumental loop for a cartoon paper airplane gliding casual game. Soft plucked acoustic
> guitar, glockenspiel and airy flute pads, gentle bouncy bass, light shaker, 104 BPM, major key, breezy and
> optimistic, feeling of flying through a sunny sky. Instrumental only, no vocals, no singing, no voice. Seamless loop
> feel, steady energy, no big intro or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers to 1920×1080, 800×1200, 800×800, 630×500 (itch) and a 512 px icon;
menu background to 1280×720 JPG quality 78 (`paper-glide/public/assets/menu-bg.jpg`, 92 KB); music to mono 64 kbps
with a 0.8 s fade-out (`paper-glide/public/assets/music.mp3`, 257 KB).
