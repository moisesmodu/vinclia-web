# Prompts de arte y música de Hook Hop (reutilizables cambiando el tema)

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` (2,75 créditos por imagen); el fondo del
menú en calidad `medium` y `1k` (0,5). Total: 8,75 créditos, las cuatro en un solo lote, a la primera. Música:
ElevenLabs `eleven_music_v2_5`, 32 s, una sola toma (900 créditos de ElevenLabs, 0,18 $), más una transcripción con
Scribe v1 (176 créditos, 0,035 $) para comprobar que no tiene voz (transcripción vacía: instrumental).

**Portada 16:9**
> Game cover art for a casual mobile/web game called "HOOK HOP". A cute chunky cartoon brown monkey with a big
> cream-colored face, big happy eyes and a wide grin, swinging mid-air on a green jungle vine hanging from a round
> wooden anchor knot, one arm stretched holding the vine, curly tail, flying through a bright lush jungle. Floating
> yellow bananas in the air along a dotted arc, a bouncy red mushroom with white spots below, layered jungle canopy with
> big leaves in several greens, warm sunlight beams, light blue sky gaps. Big bold playful 3D title text "HOOK HOP" in
> yellow with thick dark outline at the top center. Clean flat vector cartoon style, thick dark outlines, vibrant
> saturated colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Portada 2:3** (más lianas encima, seta abajo) y **1:1** (mono centrado, plátanos alrededor): la misma escena,
título arriba.

**Fondo del menú (sin texto)**
> Title screen background illustration for a cartoon jungle game, no text at all. A cute chunky cartoon brown monkey
> with a big cream-colored face and a happy grin hanging from a green vine on the right side of the image, a few yellow
> bananas nearby. Bright lush jungle with layered big leaves in several greens, light blue sky gaps and warm sunbeams,
> the left and center areas fairly open and calm for UI buttons. Clean flat vector cartoon style, thick outlines,
> vibrant colors, no text, no letters, no watermark.

**Música**
> Playful, bouncy, cheerful instrumental loop for a cartoon jungle monkey swinging casual game. Marimba and kalimba
> melody, bongos and congas, light shakers, plucky upright bass, whistle-like flute accents, 124 BPM, major key, no
> vocals, seamless loop feel, steady energy, no big intro or ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg): portadas a 1920×1080, 800×1200, 800×800 y 630×500 (recorte centrado); icono 512×512
recortado de la portada cuadrada por debajo del título (solo la cara del mono); fondo a 1280×720 en JPG calidad 78;
música a mono 64 kbps con fundido final de 0,8 s.
En el juego, el mono (tres caras), los nudos, las lianas, los plátanos, las setas, el río y las tres capas de la jungla
(colinas lejanas, árboles y dosel de hojas) están dibujados por código con el mismo estilo (contorno grueso, colores
planos) y horneados en texturas al arrancar; el mono marrón con cara crema copia las portadas.
