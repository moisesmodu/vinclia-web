# Prompts de arte y música de Bike Flip

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` para las 3 portadas; el fondo del menú en
calidad `medium` y `1k`. Música: ElevenLabs `eleven_music_v2_5`, 32 s, una sola toma (900 créditos).
Nota: la primera petición en lote de las 4 imágenes devolvió 429 (límite de ritmo, otros agentes generando a la vez);
se enviaron de una en una y salieron todas a la primera.

**Portada 16:9**
> Game cover art for a casual mobile/web game called "BIKE FLIP". A chunky cute cartoon teal dirt bike with big black
> knobby wheels doing a backflip high in the air over a desert canyon gap, ridden by a small cheerful rider in a purple
> suit and a big yellow helmet, motion swirl lines showing the flip, bright orange turbo flames from the exhaust. Warm
> sunset sky in peach and orange with soft clouds, orange-red sandstone mesas and sandy hills, a checkered finish flag
> on the right, a few golden stars floating. Big bold playful 3D title text "BIKE FLIP" in yellow with thick dark
> outline at the top center. Clean flat vector cartoon style, thick dark outlines, vibrant saturated colors, high
> contrast, readable at small thumbnail size, no other text, no watermark.

**Portada 2:3** («Vertical game cover art…», título «at the top», mesetas «below») y **1:1** («Square game cover
art…», sin la bandera): la misma escena.

**Fondo del menú (sin texto, 16:9)**
> Title screen background illustration for a cartoon dirt bike game, no text at all. A chunky cute teal dirt bike with
> big black knobby wheels and a small rider in a purple suit and big yellow helmet doing a wheelie on the right side on
> top of an orange sandstone hill. Warm sunset sky in peach and soft orange with a few soft clouds, orange-red desert
> mesas and sandy hills fading into the distance, the left and center areas fairly empty sky for UI buttons. Clean flat
> vector cartoon style, thick dark outlines, vibrant colors, no text, no letters, no watermark.

**Música**
> Energetic, bouncy, cheerful instrumental loop for a cartoon dirt bike stunt casual game. Surf-rock electric guitar
> twang, punchy drums, funky bass, hand claps and a little synth lead, 128 BPM, major key, no vocals, seamless loop
> feel, steady energy, no big intro or ending. 32 seconds.

## Posproceso
```bash
convert c169.png -resize 1920x1080^ -gravity center -extent 1920x1080 -quality 88 portadas/bike-flip-1920x1080.jpg
convert c23.png  -resize 800x1200^  -gravity center -extent 800x1200  -quality 88 portadas/bike-flip-800x1200.jpg
convert c11.png  -resize 800x800^   -gravity center -extent 800x800   -quality 88 portadas/bike-flip-800x800.jpg
convert c169.png -resize 630x500^   -gravity center -extent 630x500   -quality 88 portadas/bike-flip-itch-630x500.jpg
convert c11.png  -resize 512x512 portadas/bike-flip-icono-512.png
convert bg.png   -resize 1280x720^  -gravity center -extent 1280x720  -quality 78 ../../bike-flip/public/assets/menu-bg.jpg
ffmpeg -i music-raw.mp3 -ac 1 -b:a 64k -af "afade=t=out:st=31.2:d=0.8" ../../bike-flip/public/assets/music.mp3
```
Resultado: fondo 76 KB, música 256 KB.
