# Prompts de arte y música de Rocket Hop (reutilizables cambiando el tema)

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` (2,75 créditos por imagen); el fondo del
menú en calidad `medium` y `1k` (0,5). Total: 8,75 créditos. Música: ElevenLabs `eleven_music_v2_5`, 32 s, una sola
toma (900 créditos de ElevenLabs, 0,18 $).

**Portada 16:9**
> Game cover art for a casual mobile/web game called "ROCKET HOP". A chunky cute cartoon rocket, red and white with a
> round porthole window showing a happy cute face with big eyes, small yellow fins, a bright orange flame from its
> thruster, gently landing on a small floating purple-and-teal hovering platform with glowing landing lights. Deep
> blue-purple starry space sky, twinkling stars, a big ringed orange planet and a small green planet, a few more
> floating platforms in the distance. Big bold playful 3D title text "ROCKET HOP" in yellow with thick dark outline at
> the top center. Clean flat vector cartoon style, thick dark outlines, vibrant saturated colors, high contrast,
> readable at small thumbnail size, no other text, no watermark.

**Portada 2:3** y **1:1**: la misma escena, encuadre vertical (con más plataformas apiladas encima) o cuadrado, título
arriba.

**Fondo del menú (sin texto)**
> Title screen background illustration for a cartoon space game, no text at all. A chunky cute cartoon rocket, red and
> white with a round porthole window showing a happy cute face, small yellow fins, standing on a small floating
> purple-and-teal hovering platform on the right side of the image. Deep blue-purple starry space sky with twinkling
> stars, a big ringed orange planet in the upper right, the left and center areas fairly empty starry sky for UI
> buttons. Clean flat vector cartoon style, thick outlines, vibrant colors, no text, no letters, no watermark.

**Música**
> Playful, bouncy, cheerful instrumental loop for a cartoon space rocket casual game. Retro synth arpeggios, bubbly
> synth bass, light electronic drums, sparkly bell melody, 120 BPM, major key, no vocals, seamless loop feel, steady
> energy, no big intro or ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg): portadas a 1920×1080, 800×1200, 800×800 y 630×500 (recorte centrado); icono 512×512
recortado de la portada cuadrada; fondo a 1280×720 en JPG calidad 78; música a mono 64 kbps con fundido final de 0,8 s.
En el juego, el cohete, las plataformas, las estrellas y los planetas están dibujados por código con el mismo estilo
(contorno grueso, colores planos); las aletas amarillas y el morro rojo copian las portadas.
