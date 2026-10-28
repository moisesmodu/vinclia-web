# Juegos · catálogo HTML5 para CrazyGames, Poki e itch.io

Juegos casuales de una mecánica, sin texto, en inglés por defecto (EE. UU. y Reino Unido pagan la publicidad).
Un juego nuevo cada 2 semanas con la plantilla. El primero es **Egg Truck**.

| Carpeta | Qué es |
|---|---|
| `comun/` | Lo que comparten todos los juegos: adaptador de portal (CrazyGames v3, Poki v2, itch.io, web), guardado, sonido sintetizado, iconos y botones sin texto, pantallas de menú, tutorial y fin de partida, configuración de Vite |
| `plantilla/` | Juego mínimo completo (toca para saltar) con todo el ciclo: anuncio al reiniciar, revivir con anuncio, récord, tutorial de 10 s, reinicio en un clic. Se copia con `npm run nuevo` |
| `egg-truck/` | Juego 1. Conducción con físicas: mantén pulsado para acelerar, suelta para frenar, lleva el huevo sin romperlo |
| `fichas/<juego>/` | Textos de las fichas de los tres portales, portadas en los tamaños exigidos y capturas |
| `paquetes/<juego>/` | Zips listos para subir (uno por portal) |
| `scripts/` | Compilar, empaquetar, crear juego nuevo, servidor de pruebas y prueba de rendimiento |
| `CATALOGO.md` | Los 11 juegos siguientes con género y gancho |
| `ROBLOX.md` | Plan del primer juego de Roblox publicado por Open Cloud (sin construir) |

## Marca
Estudio **Nuvolet Games** («Tiny games, big smiles.», `MARCAS.md` y `marcas/tokens.json`). La nube del estudio sale en la
pantalla de carga de todos los juegos (`index.html` de cada juego y de la plantilla), el favicon es
`marcas/logos/juegos-icono.svg` y el sitio usa el logotipo, Fredoka y Nunito, y el pie común. Dentro del juego, la
paleta es la de cada título.

## Comandos
```bash
cd proyectos/juegos
npm install
GAME=egg-truck npm run dev        # desarrollo con recarga (http://localhost:5173)
npm run build                     # web propia: dist/<juego>/ + dist/index.html (catálogo). Es lo que despliega Vercel
npm run paquetes                  # builds por portal (dist-portales/) y zips en paquetes/<juego>/
npm run nuevo -- mi-juego "My Game" "One-line description"   # juego nuevo desde la plantilla
npm run typecheck
npm run test:rendimiento          # móvil de gama media emulado (ver más abajo); escribe <juego>/rendimiento.json
npm run test:sdk                  # ciclo completo con SDK simulados de CrazyGames y Poki (tras npm run paquetes)
```

## Despliegue en Vercel (lo hace la sesión del Mac con `DESPLIEGUE.md`; luego cada push publica)
1. vercel.com → Add New → Project → importar `moisesmodu/vinclia-web`.
2. **Root Directory: `proyectos/juegos`**. Framework: Other. El resto lo lee de `vercel.json` (build `npm run build`,
   salida `dist`).
3. Rama de producción: la que se fusione (`claude/estrategia-ingresos-recurrentes-tx0rvw` o `main`).
4. No hace falta ninguna variable de entorno: los SDK de los portales se cargan solos en sus builds; la web propia no
   lleva anuncios (añadir AdSense for Games es una mejora posterior, ver `MARKETING.md`).

URL resultante: `https://<proyecto>.vercel.app/egg-truck/` (y el catálogo en la raíz).

## Cómo funciona el adaptador de portal
`comun/portal.ts` expone una sola interfaz: `init`, `loadingDone`, `gameplayStart/Stop`, `commercialBreak`,
`rewardedBreak`, `happyTime`, `getItem/setItem`. El portal se elige **al compilar** con `VITE_PORTAL`:

| Portal | SDK | Anuncios | Guardado |
|---|---|---|---|
| `crazygames` | `sdk.crazygames.com/crazygames-sdk-v3.js` | `ad.requestAd('midgame' / 'rewarded')` | `SDK.data` (en la cuenta del jugador si ha iniciado sesión) |
| `poki` | `game-cdn.poki.com/scripts/v2/poki-sdk.js` | `commercialBreak()` / `rewardedBreak()` | localStorage (Poki no tiene guardado en la nube) |
| `itch`, `web` | ninguno | ninguno (el botón de revivir no aparece) | localStorage |

Reglas que cumple cada juego (las piden ambos portales):
- `gameplayStart()` al empezar a jugar y `gameplayStop()` al morir, al ir al menú y durante los anuncios.
- Intersticial **solo en pausa natural**: al reiniciar la partida (nunca en la primera de la sesión). El portal decide
  la frecuencia; si no hay anuncio, el juego sigue al instante.
- Anuncio con recompensa **siempre opcional**: revivir una vez por partida.
- Audio silenciado durante el anuncio y con la pestaña oculta.
- Sin enlaces externos en los builds de portal; sin compras; 16:9 adaptable a cualquier proporción.
- Si el SDK no carga (bloqueador de anuncios o sin red), el juego funciona igual.

## Egg Truck: decisiones
- **Género elegido con datos** (no se pudo abrir crazygames.com ni poki.com desde este contenedor por la política de
  red; datos de búsqueda web y del panel):
  - Poki, informe *Game Intelligence: car games* (29/09/2026, 12 meses de partidas en EE. UU.): los coches son el 10 %
    de todas las partidas; los **coches tipo plataforma son el 7 % de los títulos y el 30 % de las partidas**, y casi
    todo es un único juego (Drive Mad, 23 % de las partidas de coches). Es decir: demanda alta y oferta escasa.
  - CrazyGames, abril de 2026: el hipercasual se lleva el 78,8 % del tiempo de juego y el puzle el 20,6 % (dato de
    prensa, no verificado en origen).
  - Hueco elegido: **conducción con físicas de una pulsación** (hipercasual con algo de puzle de equilibrio). El gancho
    que lo distingue de los clones de Drive Mad o Hill Climb: **la carga frágil**. El huevo se agrieta con cada golpe
    (tres avisos visibles en la cara del huevo) y se rompe si cae al suelo. Así cada salto es una decisión.
- Una mecánica: **mantener = acelerar** (en el aire, inclina atrás); **soltar = frenar** (en el aire, inclina adelante).
  También responde a teclado (espacio, flechas, W, D) para escritorio.
- Partidas de 1 a 3 minutos: el terreno se genera por tramos (llano, colina, baches, rampa) y la dificultad sube hasta
  los 400 m (colinas más altas, más rampas, baches más duros). Hitos con banderín cada 100 m.
- Sin texto: solo cifras e iconos. El nombre "EGG TRUCK" es la marca (va igual en todos los países).
- Física Matter.js a 60 Hz fijos con acumulador: el juego va a la misma velocidad a 30 que a 120 FPS.
- Terreno horneado en texturas por bloques y destruido detrás de la cámara: memoria y cuerpos físicos constantes.
- Peso: 1,6 MB en total (Phaser 1,2 MB + fondo 70 KB + música 256 KB). Poki exige menos de 8 MB y CrazyGames 50 MB.
- Arte: 4 imágenes con Higgsfield (GPT Image 2.5): portadas en 16:9, 2:3, 1:1 y fondo del menú. En el juego, todo
  dibujado por código con el mismo estilo (contorno grueso, colores planos). Música: 1 pista de 32 s con ElevenLabs
  Music v2.5. Efectos de sonido sintetizados en el navegador (motor, golpes, estrellas): 0 bytes.
- Guardado: récord, estrellas acumuladas, partidas jugadas, tutorial visto y sonido.

## Gasto de IA de esta sesión
| Herramienta | Uso | Créditos |
|---|---|---|
| Higgsfield | 3 portadas en alta calidad 2K (2,75 cada una) + fondo de menú en calidad media 1K (0,5) | 8,75 de los 60 de tope (comprobado en el historial de transacciones) |
| ElevenLabs | 1 pista de música de 32 s (Music v2.5) | 900 créditos de ElevenLabs (0,18 $) |

El tope de 60 se ha aplicado a Higgsfield. En ElevenLabs los créditos son otra unidad (1.500 ≈ 0,30 $), así que se ha
limitado a una pista.

## Rendimiento (ver `egg-truck/rendimiento.json`)
Prueba automática `npm run test:rendimiento`: Chromium emulando un móvil de gama media (800×360 apaisado, táctil,
DPR 2, **CPU 4 veces más lenta**), piloto automático conduciendo y reiniciando partidas. Resultado y lectura en el
informe de la sesión y en `rendimiento.json`. Resultado del 28/10/2026: **CPU por fotograma 4,2 ms de mediana, 10 ms
en el p95 y 15,4 ms en el p99** (con la CPU a ×4); es decir, la lógica y el envío de dibujo caben en el presupuesto de
60 FPS (16,7 ms) en un móvil de gama media; carga hasta el menú en 2,1 s con la CPU a ×4; sin errores en 90 s de
partidas con reinicios. `npm run test:sdk` comprueba el ciclo de anuncios y guardado con SDK simulados de
CrazyGames y Poki (sin errores). Este contenedor no tiene GPU (pinta por software), así que los FPS que
se ven aquí son mucho más bajos que en un teléfono. Lo que se mide y vale para el móvil es el **tiempo de CPU por
fotograma**. **Pendiente:** probarlo en un móvil Android real de gama media antes de enviarlo a Poki, que revisa a mano.

## Siguiente juego en una sesión
1. `npm run nuevo -- <slug> "<Title>" "<description>"`.
2. Escribir la mecánica en `<slug>/src/scenes/Play.ts`. Lo demás ya funciona: menú, tutorial, fin de partida, anuncios y
   guardado.
3. Arte: 3 portadas y 1 fondo con Higgsfield (≈ 9 créditos, mismos prompts que `fichas/egg-truck/PROMPTS.md`
   cambiando el tema); música: 1 pista con ElevenLabs.
4. `npm run build && npm run test:rendimiento`, capturas, fichas copiando `fichas/egg-truck/FICHAS.md`, `npm run paquetes`.
5. Añadir la fila al catálogo de `CATALOGO.md` y al panel.
