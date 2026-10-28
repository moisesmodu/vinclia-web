# Marketing · Juegos

Escenario S1 (VIABILIDAD §5): **sin anuncios pagados, nunca**. El canal es el portal: CrazyGames y Poki traen al
jugador y se quedan su parte de la publicidad. El trabajo de marketing es: fichas que conviertan, portadas que se
pulsen, buena retención (que es lo que decide el lanzamiento completo en CrazyGames) y una web propia para el tráfico
directo, que en Poki se paga al 100 %.

## 1. Lo ya hecho en esta sesión
- **Fichas** de Egg Truck para los tres portales, en inglés: `fichas/egg-truck/FICHAS.md`.
- **Portadas** en los tamaños exigidos (1920×1080, 800×1200, 800×800, 630×500 e icono de 512): `fichas/egg-truck/portadas/`.
- **Capturas** a 1920×1080: `fichas/egg-truck/capturas/`.
- **Web propia** (Vercel, carpeta `dist/`): catálogo, el juego a pantalla completa y **14 páginas SEO** generadas desde
  `seo/paginas.json`, más `sitemap.xml` y `robots.txt`:
  - Egg Truck: `/play/egg-truck/` (con el juego incrustado), `/egg-truck/how-to-play/`, `/egg-truck/tips/`,
    `/egg-truck/for-schools/`, `/egg-truck/faq/`.
  - Categorías que se llenan solas con cada juego nuevo (por las `etiquetas` de `juegos.json`): one-button games,
    physics driving games, car games for kids, short games, Chromebook games, games without text, egg games,
    hill climb style games, no-download games.
  - **Decisión:** SESIONES.md pide un mínimo de 20 páginas SEO. Con un solo juego, 20 páginas serían contenido
    escaso, justo lo que Google penaliza. Se hacen 14 con contenido real y cada juego nuevo añade 4 guías propias y
    entra en las categorías. Con el juego 3 se pasa de 20.

## 2. Ficha de Google Play (para el proyecto 8, Android; no se publica todavía)
- **Título (30):** Egg Truck: One-Button Driving
- **Descripción corta (80):** Hold to drive, release to brake. Don't crack the egg!
- **Descripción larga:** la de `fichas/egg-truck/FICHAS.md` más: "Plays offline. No sign-up. Tiny download."
- **Categoría:** Racing · Clasificación: Everyone · Anuncios: sí (AdMob) · Contenido con IA: declarado.
- Idiomas de la ficha: inglés (EE. UU. y Reino Unido); castellano y catalán con la versión Android, por la regla de
  SESIONES.md (el juego no tiene texto, así que solo se traduce la ficha):
  - ES: *Egg Truck: conduce con un dedo*. "Mantén para acelerar, suelta para frenar. ¡Que no se rompa el huevo!"
  - CA: *Egg Truck: condueix amb un dit*. "Mantén premut per accelerar, deixa anar per frenar. Que no es trenqui l'ou!"

## 3. Diez guiones de vídeo corto (TikTok, Shorts, Reels; 10 a 20 s, sin voz, con texto en pantalla en inglés)
Se graban con el piloto automático de `scripts/perf.mjs` o jugando, en vertical (390×844), con la música del juego.
1. **"Don't crack it."** Plano del huevo sonriendo → rampa enorme → aterrizaje perfecto. Texto: *POV: you're the egg*.
2. **Fallo épico.** Salto, voltereta, el huevo sale volando a cámara lenta y se rompe. Texto: *Every. Single. Time.*
3. **Récord.** Contador subiendo, banderín de 100, 200, 300. Texto: *Can you beat 300 m?* (reto en comentarios).
4. **Tres grietas.** Primer plano del icono del huevo agrietándose una vez, dos veces, y llegada justa al banderín.
5. **Un botón.** Pantalla partida: dedo manteniendo/soltando y el camión reaccionando. Texto: *One button. That's it.*
6. **Antes/después.** Primera partida (se rompe en 10 m) contra la décima (400 m). Texto: *10 minutes later…*
7. **ASMR de estrellas.** Arco de estrellas tras una rampa, sonido de cada una. Texto: *the sound 🔊*.
8. **Clase.** "Physics lesson": a cámara lenta, la inclinación en el aire y el aterrizaje plano. Para profesores.
9. **Reto a un amigo.** Texto: *Send this to the friend who drives like this* + choque.
10. **Detrás de la pantalla.** Timelapse del terreno generándose (vista del depurador de físicas). Para la comunidad
    de desarrolladores (r/IndieDev, X).

## 4. Comunidades donde publicar (nunca sin aprobación de Moisés)
| Comunidad | Qué publicar | Cuándo |
|---|---|---|
| r/WebGames (Reddit) | Enlace a la web propia + GIF | Tras el lanzamiento en CrazyGames |
| r/incremental_games, r/IndieGaming, r/IndieDev | Devlog corto con el gancho del huevo | Igual |
| r/phaser y foro de Phaser (phaser.discourse.group) | Showcase técnico (física a paso fijo, terreno horneado) | Cualquier momento |
| itch.io (devlog de la página del juego) | Notas de cada actualización | Cada actualización |
| HTML5GameDevs (foro), IndieDB | Ficha del juego | Tras el lanzamiento |
| Discord de CrazyGames para desarrolladores | Dudas de integración, feedback | Al enviar |
| TikTok / YouTube Shorts de la marca de juegos | Los 10 guiones | 2 por semana cuando haya cuenta |
| Profesores de Algorithmics (sin datos de alumnos) | Enlace a `/egg-truck/for-schools/` | Opcional |

## 5. Plan por portal y qué se mira
1. **CrazyGames** primero (subida abierta, sin exclusividad): lanzamiento básico, después el completo si la retención
   supera a su referencia. Se mira cada semana: partidas, minutos medios, valoración y comentarios.
2. **Poki**: enviar la URL de Vercel (revisión manual). Si lo aceptan, Poki pide exclusividad web: entonces se retira
   de otros portales web salvo CrazyGames si el contrato lo permite (decisión de Moisés en ese momento, ⏸).
3. **itch.io**: publicación propia, gratis; poco tráfico, sirve de escaparate y de página de devlog.
4. **Web propia**: anuncios con **AdSense for Games / H5 Games Ads** cuando haya tráfico. Necesita cuenta de AdSense
   (la misma del proyecto P). Mejora pendiente, no bloquea.

## 6. Afiliados
No aplica: los portales pagan por publicidad. Alternativa a futuro: licencias no exclusivas de 300 a 800 $ por juego a
portales menores (GameDistribution, GameMonetize) cuando haya 3 juegos con datos de CrazyGames.
