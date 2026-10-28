# Prompts de arte y música de Jelly Stack

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` (2,75 créditos por imagen) para las tres
portadas; el fondo del menú en calidad `medium` y `1k` (0,5). Total: **8,75 créditos** (una sola tanda, sin repeticiones).
Música: ElevenLabs `eleven_music_v2_5`, 32 s, una sola toma (900 créditos de ElevenLabs, 0,18 $).

**Portada 16:9**
> Game cover art for a casual mobile/web game called "JELLY STACK". A tall, slightly wobbly tower of colourful cute
> jelly blocks (strawberry pink, lime green, lemon yellow, grape purple, orange, mint) stacked on top of each other,
> each jelly block glossy and translucent with a white shine highlight and thick dark outline, the top jelly block
> has a happy cute face with big eyes and rosy cheeks, one small piece of jelly wobbling as it falls off the side.
> Bright candy gradient sky from pink to light blue with soft clouds and a few sparkles. Big bold playful 3D bubbly
> title text "JELLY STACK" in bright pink and yellow with thick dark outline at the top left. Clean flat vector
> cartoon style, thick outlines, vibrant saturated colours, high contrast, readable at small thumbnail size, no other
> text, no watermark.

**Portada 2:3**: la misma escena con «a very tall tower … in the centre» y el título «at the top».
**Portada 1:1**: la misma escena, título «at the top».

**Fondo del menú (sin texto)**
> Title screen background illustration for a cartoon jelly stacking game, no text at all. A tall slightly wobbly
> tower of colourful cute glossy jelly blocks (pink, green, yellow, purple, orange, mint) with thick dark outlines
> standing on the right side of the image on a soft green candy hill, the top block has a cute happy face. Bright
> candy gradient sky from light pink to sky blue with soft white clouds and a few sparkles; the left and centre areas
> fairly empty sky for UI buttons. Clean flat vector cartoon style, thick outlines, vibrant colours, no text, no
> letters, no watermark.

**Música**
> Bouncy, bubbly, cheerful instrumental loop for a cute cartoon jelly stacking casual game. Plucky pizzicato and
> marimba, squishy bubbly synth blips, light boingy bass, soft claps, 120 BPM, major key, playful and sweet, no
> vocals, seamless loop feel, steady energy, no big intro or ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg): portadas a 1920×1080, 800×1200, 800×800 (recorte centrado) y 630×500 para itch.io,
icono 512×512 desde la cuadrada; fondo a 1280×720 en JPG calidad 78 (en vertical el juego encuadra la torre, a la
derecha del dibujo, y rellena el cielo de arriba con un degradado del mismo color); música a mono 64 kbps con fundido
final de 0,8 s (256 KB).

En el juego no hay más imágenes: bloques de gelatina, caras, chispas, nubes, hierba y cielo se dibujan por código con
la misma paleta (contorno #2b2340, colores planos de caramelo).
