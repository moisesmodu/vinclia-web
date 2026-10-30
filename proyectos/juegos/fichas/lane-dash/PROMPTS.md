# Lane Dash art and music prompts (reusable by changing the theme)

Image model: Higgsfield `gpt_image_2_5`, quality `high`, resolution `2k` for the three covers; the menu background at
quality `medium`, resolution `1k`. Submitted as one batch of 4 (no 429). Music: ElevenLabs `eleven_music_v2_5`, 32 s,
one take (900 ElevenLabs credits, $0.18), checked for vocals with Scribe v1 (empty transcript = instrumental, 176
credits, $0.04).

**Cover 16:9**
> Game cover art for a casual mobile/web game called "LANE DASH". A chunky cute cartoon shopping cart, bright red with
> a turquoise handle, with a big happy face with big eyes on its front, full of colorful groceries (a baguette, apples,
> a milk carton), zooming at high speed straight towards the viewer down a long bright supermarket aisle in strong
> perspective, the aisle floor with three lanes converging to a vanishing point, tall colorful shelves on both sides.
> The cart is jumping over a stack of cardboard boxes, golden coins and a yellow price-tag 'deal' token flying around
> it, speed lines. Big bold playful 3D title text "LANE DASH" in yellow with thick dark outline at the top center.
> Clean flat vector cartoon style, thick dark outlines, vibrant saturated colors, high contrast, readable at small
> thumbnail size, no other text, no watermark.

Note: the model wrote "DEAL" on the small price tag of the 16:9 cover. It is acceptable (cover, not in-game); drop the
word 'deal' from the prompt next time.

**Cover 2:3** and **1:1**: the same scene, vertical framing (vanishing point high, title at the top) or square.

**Menu background (no text)**
> Title screen background illustration for a cartoon supermarket runner game, no text at all. A chunky cute cartoon
> shopping cart, bright red with a turquoise handle and a big happy face with big eyes on its front, full of colorful
> groceries, standing on the right side of the image in a bright supermarket aisle seen in perspective, colorful
> shelves with fruit, cans and boxes on both sides, glossy light floor, the left and center areas fairly calm and
> uncluttered (aisle floor and soft background) for UI buttons. Clean flat vector cartoon style, thick outlines,
> vibrant colors, no text, no letters, no labels, no price numbers, no watermark.

**Music**
> Upbeat, energetic, cheerful instrumental loop for a cartoon endless runner casual game set in a supermarket. Driving
> funky bass, bright electric guitar stabs, bouncy synth lead melody, punchy drums with claps, a hint of playful
> shopping-mall jingle, 132 BPM, major key, no vocals, instrumental only, seamless loop feel, steady high energy, no big
> intro or ending. 32 seconds.

Post-processing (ImageMagick and ffmpeg): covers cropped to 1920×1080, 800×1200, 800×800 and 630×500 (JPG q88), icon
512×512 cropped from the square cover (also the 64×64 favicon); background 1280×720 JPG q78; music mono 64 kbps with a
0.8 s fade-out at the end.
