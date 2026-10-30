# Prompts de arte y música de Penalty Season

Modelo de imagen: Higgsfield `gpt_image_2_5`; portadas en calidad `high` y resolución `2k` (2,75 créditos cada una),
fondo del menú en calidad `medium` y `1k` (0,5). Total: **8,75 créditos**. Música: ElevenLabs `eleven_music_v2_5`,
32 s, una sola toma (900 créditos de ElevenLabs) y una transcripción de control con `eleven_scribe_v1` (176 créditos)
porque la ejecución marcó «Instrumental: False»: la transcripción salió vacía, es decir, sin voz.

Sin equipos, jugadores, ligas ni logotipos reales: camisetas lisas sin escudos ni números.

**Portada 16:9**
> Game cover art for a casual mobile/web football game called "PENALTY SEASON". A cute chunky cartoon fox striker in a
> plain orange jersey (no logos, no numbers) kicking a white and blue football toward a goal, the ball flying with a
> curved motion trail. A cute round cartoon bear goalkeeper in a plain green jersey with big gloves diving sideways
> with a surprised face. Bright green striped pitch, white goal net, colourful cartoon stadium crowd of blurred shapes
> behind, floodlights, confetti, sunny blue sky. Big bold playful 3D title text "PENALTY SEASON" in yellow with thick
> dark purple outline at the top center. Clean flat vector cartoon style, thick dark outlines, vibrant saturated flat
> colors, high contrast, readable at small thumbnail size, no other text, no real brands, no logos, no watermark.

**Portada 2:3**
> Vertical game cover art for a casual mobile/web football game called "PENALTY SEASON". Big bold playful 3D title
> text "PENALTY SEASON" in yellow with thick dark purple outline at the top, stacked on two lines. Below: a cute chunky
> cartoon fox striker in a plain orange jersey (no logos, no numbers) about to kick a white and blue football, and
> behind him a goal with a cute round cartoon bear goalkeeper in a plain green jersey with big gloves, crouched ready
> to dive. Bright green striped pitch, colourful cartoon stadium crowd shapes and floodlights, confetti. Clean flat
> vector cartoon style, thick dark outlines, vibrant saturated flat colors, high contrast, no other text, no real
> brands, no logos, no watermark.

**Portada 1:1**
> Square game cover art for a casual mobile/web football game called "PENALTY SEASON". A cute chunky cartoon fox
> striker in a plain orange jersey (no logos, no numbers) celebrating with arms up in front of a goal, a white and blue
> football bulging the white net, a cute round cartoon bear goalkeeper in a plain green jersey sitting on the grass
> dazed. Bright green striped pitch, colourful cartoon stadium crowd shapes, confetti and floodlights. Big bold playful
> 3D title text "PENALTY SEASON" in yellow with thick dark purple outline at the top center, two lines. Clean flat
> vector cartoon style, thick dark outlines, vibrant saturated flat colors, high contrast, readable at thumbnail size,
> no other text, no real brands, no logos, no watermark.

**Fondo del menú (sin texto, 16:9, hueco central para el botón de jugar también en vertical)**
> Title screen background illustration for a cartoon football penalty game, no text at all. View from behind the
> penalty spot toward a big white goal with net in a colourful cartoon stadium at golden evening, bright floodlights,
> crowd as simple colourful rounded shapes, bunting flags without symbols. A white and blue football resting on the
> penalty spot at the bottom center. A cute round cartoon bear goalkeeper in a plain green jersey standing in the goal
> on the right side. The center and left areas fairly calm and uncluttered for UI buttons. Clean flat vector cartoon
> style, thick dark outlines, vibrant flat colors, no text, no letters, no numbers, no logos, no watermark.

**Música (bucle de estadio, instrumental)**
> Instrumental only, no vocals, no singing, no chanting voices. Upbeat, bouncy stadium-energy loop for a cartoon
> football penalty shootout casual game. Punchy marching-band snare and big stadium drums, brass stabs, playful horns,
> funky bass, handclaps, 124 BPM, major key, bright and cheerful, steady energy, seamless loop feel, no big intro or
> ending. 32 seconds.

Posproceso (ImageMagick y ffmpeg): portadas a 1920×1080, 800×1200, 800×800, itch 630×500 e icono 512×512 (desde la
cuadrada); favicon 64×64 desde el icono; fondo a 1280×720 en JPG calidad 78 (133 KB); música a mono 64 kbps con
fundido final de 0,8 s (257 KB).

En el juego, todo lo demás se dibuja por código con el mismo estilo (contorno grueso, colores planos): 16 especies
de animales con cara (de frente, de espaldas y de perfil), porteros y lanzadores por equipación, 16 escudos, 6
equipaciones, 6 balones, iconos y el estadio en perspectiva real (gradas con público, vallas sin texto, césped
segado, red y portería), horneado en texturas al arrancar. Efectos de sonido sintetizados (0 bytes).
