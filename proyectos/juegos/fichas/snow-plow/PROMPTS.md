# Prompts de arte y música de Snow Plow

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` para las tres portadas y calidad
`medium`, `1k` para el fondo del menú (las 4 en un solo lote). Música: ElevenLabs `eleven_music_v2_5`, 32 s, una sola
toma (900 créditos). Todo salió bien a la primera: no hubo repeticiones.

**Portada 16:9**
> Game cover art for a casual mobile/web game called "SNOW PLOW". A chunky cute orange-and-red cartoon snow plow truck
> with a big shiny yellow front plow blade and big black wheels, driving on a snowy hill at night, pushing a tall wobbly
> pile of colorful wrapped Christmas presents (red, green, blue, gold boxes with ribbons and bows) in front of its blade,
> a few presents tumbling. Snowy rolling hills, pine trees with colorful Christmas lights, Santa's red sleigh waiting on
> the next hill, deep night-blue sky with stars and gently falling snowflakes. Big bold playful 3D title text
> "SNOW PLOW" in white and icy blue with thick dark outline and snow on top, at the top center. Clean flat vector
> cartoon style, thick outlines, vibrant saturated colors, high contrast, readable at small thumbnail size, no other
> text, no watermark.

**Portada 2:3**: la misma escena en vertical ("driving up a snowy hill", "Santa's red sleigh in the distance", título
arriba). **Portada 1:1**: la misma escena en cuadrado, sin el trineo, título arriba.

**Fondo del menú (sin texto, 16:9)**
> Title screen background illustration for a cartoon Christmas driving game, no text at all. A cute chunky
> orange-and-red cartoon snow plow truck with a yellow front blade pushing a small pile of colorful wrapped presents,
> parked on the right side on a snowy hilltop, pine trees with colorful Christmas lights near it. Deep night-blue sky
> with stars and gently falling snowflakes, soft snowy rolling hills fading into the distance, the left and center areas
> fairly empty sky for UI buttons. Clean flat vector cartoon style, thick outlines, vibrant colors, no text, no letters,
> no watermark.

**Música**
> Cheerful, bouncy instrumental Christmas loop for a cartoon snow plow driving casual game. Jingling sleigh bells,
> glockenspiel and celesta melody, pizzicato strings, light upright bass, soft brushed drums, 120 BPM, major key,
> festive and playful, no vocals, seamless loop feel, steady energy, no big intro or ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg):
```bash
convert c169.png -resize 1920x1080^ -gravity center -extent 1920x1080 -quality 88 snow-plow-1920x1080.jpg
convert c23.png  -resize 800x1200^  -gravity center -extent 800x1200  -quality 88 snow-plow-800x1200.jpg
convert c11.png  -resize 800x800 -quality 88 snow-plow-800x800.jpg
convert c169.png -resize 630x500^   -gravity center -extent 630x500   -quality 88 snow-plow-itch-630x500.jpg
convert c11.png  -resize 512x512 snow-plow-icono-512.png
convert bg.png   -resize 1280x720^  -gravity center -extent 1280x720  -quality 78 ../../snow-plow/public/assets/menu-bg.jpg
ffmpeg -i music.mp3 -ac 1 -b:a 64k -af "afade=t=out:st=31.2:d=0.8" ../../snow-plow/public/assets/music.mp3
```
En el juego todo lo demás se dibuja por código con el mismo estilo (contorno grueso, colores planos): quitanieves,
regalos en 4 colores con lazo, trineo, abetos con luces que parpadean, colinas nevadas, luna, estrellas y nieve.
