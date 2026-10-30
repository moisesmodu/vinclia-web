# Tarea programada · Juegos

**Frecuencia:** lunes y jueves a las 10:17 (hora de Madrid): un juego web nuevo en cada ejecución (2 por semana) y,
el primer lunes de cada mes, además, la siguiente experiencia de Roblox de `CATALOGO.md`.
Cron: `CRON_TZ=Europe/Madrid 17 10 * * 1,4`.

**Cómo la crea Moisés (un clic):** en claude.ai/code → *Scheduled tasks* → *New*, repositorio `moisesmodu/vinclia-web`,
pegar el prompt de abajo con la frecuencia indicada. (No se ha creado desde esta sesión: CARTERA.md dice que las tareas
programadas se crean cuando Moisés da el visto bueno.)

## Prompt
```
Lee SESIONES.md, CARTERA.md y proyectos/juegos/README.md y CATALOGO.md, y cúmplelos. Trabaja en una rama nueva desde
claude/estrategia-ingresos-recurrentes-tx0rvw y abre un PR hacia ella al acabar.

1. Revisión de los juegos publicados (siempre):
   - Lee el último informe de cada portal que Moisés haya dejado en proyectos/juegos/datos/ (capturas o CSV de
     CrazyGames y Poki) y el panel. Si no hay datos nuevos, dilo en el informe.
   - Para cada juego: npm run build && npm run test:rendimiento (GAME=<slug>) y node scripts/sdk-test.mjs crazygames
     y poki. Si algo falla, arréglalo antes que nada.
   - Lee los comentarios de los jugadores que Moisés haya copiado y aplica las mejoras pequeñas que pidan varias
     personas (máximo una por juego y quincena). Sube la versión y regenera paquetes con npm run paquetes.
2. Juego nuevo (siempre; y si es el primer lunes del mes, también la siguiente experiencia de Roblox en roblox/):
   - Toma el siguiente de CATALOGO.md. npm run nuevo -- <slug> "<Title>" "<description>".
   - Escribe la mecánica en <slug>/src/scenes/Play.ts (reutiliza el motor de egg-truck si el catálogo lo dice).
   - Arte con Higgsfield (3 portadas y 1 fondo, tope 15 créditos) con los prompts de fichas/egg-truck/PROMPTS.md
     cambiando el tema; música con ElevenLabs (1 pista de 32 s). Lo que falte, por código.
   - Tutorial de 10 s, dificultad progresiva, partidas de 1 a 3 minutos, reinicio en 1 clic: ya vienen en la plantilla.
   - Prueba: typecheck, build, test:rendimiento (p95 de CPU por fotograma por debajo de 12 ms con CPU x4),
     sdk-test en los dos portales, capturas.
   - Fichas: copia fichas/egg-truck/FICHAS.md a fichas/<slug>/ y adáptala; 4 páginas SEO del juego en seo/paginas.json
     y etiquetas en juegos.json.
   - npm run paquetes. Los zips quedan en paquetes/<slug>/.
3. Actualiza panel/data/proyectos.json (acciones, enlaces, próximos, paraMoises). En enlaces, en el mismo push en que
   se crea cada juego: «<Juego> · jugar» (https://juegos-casuales.vercel.app/<slug>/) y «<Juego> · guía» (/play/<slug>/), y
   las fichas de CrazyGames, Poki e itch.io en cuanto existan y la fila del registro de CARTERA.md.
4. Informe a Moisés (en el PR y en el chat): juego nuevo con enlace de Vercel, qué cambió en los anteriores, datos de
   los portales, créditos de IA gastados, y la lista exacta de lo que él tiene que pulsar (subir el zip X a CrazyGames,
   enviar la URL Y a Poki). Nada se publica sin su aprobación.
5. Cada 6 juegos (JUICIO.md): si ninguno ha pasado del lanzamiento básico en CrazyGames, propón cambiar el reparto de
   géneros del catálogo con los datos.
```
