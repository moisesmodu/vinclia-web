# Prompts de arte y música de Tow Truck (reutilizables cambiando el tema)

Modelo de imagen: Higgsfield `gpt_image_2_5`, calidad `high`, resolución `2k` para las 3 portadas (2,75 créditos cada una); el fondo del menú
en calidad `medium` y `1k` (0,5). Total 8,75 créditos (historial de transacciones del 30/10/2026). Una imagen por llamada, ninguna repetida. Música: ElevenLabs `eleven_music_v2_5`, 32 s,
una sola toma (900 créditos de ElevenLabs), comprobada sin voz con una transcripción de Scribe (texto vacío, 176
créditos).

Paleta propia (distinta de Egg Truck, que es cielo azul y colinas verdes): **granja al atardecer**, cielo morado →
coral → dorado, sol bajo, colinas rosadas y ocres, grúa turquesa con pluma amarilla, remolque rojo.

**Portada 16:9**
> Game cover art for a casual mobile/web game called "TOW TRUCK". A chunky cute teal cartoon tow truck with big black
> wheels and a little yellow crane hook on the back, driving over a bumpy farm hill and pulling a small red wooden
> trailer hitched with a short chain. On the trailer: wobbly wooden barrels, crates and two fluffy white cartoon sheep
> with happy faces bouncing a little in the air. Warm sunset farm scene: orange, pink and golden sky, rolling golden
> wheat hills, a red barn and a windmill in the distance. Big bold playful 3D title text "TOW TRUCK" in cream yellow
> with thick dark purple outline at the top center. Clean flat vector cartoon style, thick outlines, vibrant saturated
> colors, high contrast, readable at small thumbnail size, no other text, no watermark.

**Portada 2:3**
> Vertical game cover art for a casual mobile/web game called "TOW TRUCK". Big bold playful 3D title text "TOW TRUCK"
> in cream yellow with thick dark purple outline at the top. Below it, a chunky cute teal cartoon tow truck with a
> friendly face, big black wheels with yellow hubs and a yellow crane hook on the back, driving up a bumpy farm hill
> toward the viewer at a slight angle and pulling a small red wooden trailer hitched with a short chain. On the
> trailer: wobbly wooden barrels, crates and two fluffy white cartoon sheep with happy faces bouncing in the air. Warm
> sunset farm scene: orange, pink and golden sky, low sun, rolling golden wheat hills, a red barn and a windmill in
> the distance. Clean flat vector cartoon style, thick outlines, vibrant saturated colors, high contrast, readable at
> small thumbnail size, no other text, no watermark.

**Portada 1:1**
> Square game icon cover art for a casual mobile/web game called "TOW TRUCK". Big bold playful 3D title text "TOW
> TRUCK" in cream yellow with thick dark purple outline across the top. Below, large and centered, a chunky cute teal
> cartoon tow truck with a friendly face, big black wheels with yellow hubs and a yellow crane hook, pulling a small
> red wooden trailer hitched with a short chain, with wobbly wooden barrels, crates and two fluffy white cartoon sheep
> with happy faces bouncing on it. Warm sunset farm background: orange, pink and golden sky, low sun, golden wheat
> hills, a red barn. Clean flat vector cartoon style, thick outlines, vibrant saturated colors, high contrast, readable
> at small thumbnail size, no other text, no watermark.

**Fondo del menú (sin texto, 16:9)**
> Title screen background illustration for a cartoon farm driving game, no text at all. A chunky cute teal cartoon tow
> truck with a friendly face, big black wheels with yellow hubs and a yellow crane hook, parked on the right side on a
> low golden hill at the bottom right, with a small red wooden trailer behind it carrying wooden crates, barrels and a
> fluffy white sheep. Warm sunset farm sky: orange, pink and purple, low sun, soft pink clouds, rolling golden wheat
> hills fading into the distance, a small red barn and windmill far away. The left and center areas are fairly empty
> sky and soft hills for UI buttons. Clean flat vector cartoon style, thick outlines, vibrant colors, no text, no
> letters, no watermark.

En vertical el menú recorta el fondo hacia la derecha (origen x = 0,68): se ve la cara de la grúa y el botón de jugar
queda en el cielo.

**Música (instrumental, 32 s)**
> Upbeat, bouncy, cheerful country instrumental loop for a cartoon farm tow-truck physics driving game. Playful banjo
> and acoustic guitar picking, fiddle accents, walking upright bass, light brushed drums and claps, 120 BPM, major key,
> warm sunset farm mood. Purely instrumental, no vocals, no singing, no voice. Seamless loop feel, steady energy, no
> big intro or ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg): portadas a 1920×1080, 800×1200, 800×800, itch 630×500 (recorte centrado) e icono
512×512 (de la 1:1); fondo del menú a 1280×720 en JPG calidad 78 (104 KB); música a mono 64 kbps con fundido final de
0,8 s (`ffmpeg -i in.mp3 -af "afade=t=out:st=31.2:d=0.8" -ac 1 -b:a 64k music.mp3`, 251 KB).
