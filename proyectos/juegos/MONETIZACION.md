# Monetización · Juegos (Nuvolet Games)

Regla de SESIONES.md «Monetizar primero». En los juegos no se cobra al jugador: el dinero viene de la **publicidad que
sirve cada portal** y se reparte con el desarrollador. Por eso el embudo es de partidas, no de clientes. Todas las cifras
son estimaciones con su horquilla; se sustituyen por las reales con el primer informe de cada portal.

## 1. Modelo de ingresos por canal

| Canal | Cómo paga | Anuncios que pone el juego | Reparto | Cobro |
|---|---|---|---|---|
| **CrazyGames** | Reparto de la publicidad de las sesiones de tu juego | Intersticial (*midgame*) al reiniciar y con recompensa al revivir, por su SDK v3 (ya integrado) | 50–70 % para el desarrollador según sus términos de 2026 | Mensual por **Tipalti**, con umbral de 100 € (lo abre Moisés) |
| **Poki** | Reparto de la publicidad de las sesiones | `commercialBreak` y `rewardedBreak` (integrado) | 50 % del tráfico que trae Poki, 100 % del tráfico que traemos nosotros con su enlace | Mensual, tras aceptación y contrato |
| **GameDistribution** | Reparto de la publicidad en las miles de webs que cargan el juego | `showAd` intersticial y con recompensa (integrado) | Según su contrato (en torno al 50 %) | Mensual con umbral |
| **GameMonetize** | Reparto de la publicidad | `showBanner` (integrado, sin recompensa) | Según su contrato | Mensual con umbral |
| **itch.io** | Donación voluntaria | Ninguno | 90 % (itch se queda el 10 % por defecto) | PayPal o Stripe de itch |
| **Web propia** (`juegos-casuales.vercel.app`) | AdSense for Games / H5 Games Ads | Pendiente (cuenta de AdSense) | 68 % de AdSense | Mensual, umbral 70 € |
| **Roblox** (Egg Truck Tycoon) | Pases y productos en Robux; DevEx a dólares | — | ≈ 0,0038 $/Robux (0,0054 $ en gasto de adultos de EE. UU. verificados) | DevEx desde 30.000 Robux |

En itch.io, el precio es **gratis con donación sugerida de 2 $** («pay what you want», mínimo 0). Un juego web de un
minuto no se vende, pero algunos jugadores dejan propina; además itch sirve de escaparate y de página de devlog.

## 2. Ingresos estimados por cada 1.000 partidas

Supuestos: con el límite de frecuencia de los portales salen de 0,3 a 0,6 anuncios por partida; el eCPM de anuncios
HTML5 en EE. UU. y Reino Unido es de 6 a 15 $ y en mezcla mundial de 2 a 5 $; el reparto para el desarrollador es del
50 %.

| Escenario | Anuncios por 1.000 partidas | eCPM | Ingreso bruto | Para nosotros |
|---|---|---|---|---|
| Mal (tráfico mundial, pocos reinicios) | 300 | 2 $ | 0,60 $ | **0,30 $** |
| Medio (mezcla con un 30 % de EE. UU. y Reino Unido) | 450 | 5 $ | 2,25 $ | **1,10 $** |
| Bien (público anglosajón, muchas partidas por sesión) | 600 | 12 $ | 7,20 $ | **3,60 $** |

Lectura: con **1 $ por cada 1.000 partidas**, 100 €/mes piden unas 100.000 partidas al mes por juego. Un juego medio
en un portal grande hace de 50.000 a 500.000; uno destacado, millones. Por eso se juega a catálogo y por eso cada
partida corta (de 1 a 3 minutos) con reinicio en un clic multiplica los anuncios por sesión.

Ingresos objetivo (VIABILIDAD, objetivo de mes 12: 150 €/mes para Juegos): equivalen a 1 juego con lanzamiento completo
en CrazyGames, o a 4 juegos con 40.000 partidas al mes cada uno en los portales no exclusivos.

## 3. Embudo (de partida a euro)

| Paso | Qué lo mueve | Porcentaje esperado |
|---|---|---|
| Ficha vista → partida | Portada (personaje grande y título de dos palabras) | 3–8 % de clics en la miniatura del portal |
| Partida → segunda partida | Tutorial de 10 s, primera estrella a los 3 s, reinicio en un clic | 45–65 % |
| Partida → anuncio | Intersticial al reiniciar (el portal limita la frecuencia) | 30–60 % |
| Muerte → revivir con anuncio | Botón de revivir (opcional, una vez por partida) | 5–15 % |
| Día 1 → vuelve día 2 | Récord guardado, estrellas acumuladas, banderines | 8–15 % (lo que mira CrazyGames para el lanzamiento completo) |

## 4. Las 100 primeras partidas sin pagar anuncios
1. **Prueba del lanzamiento básico de CrazyGames**: al aceptarlo, CrazyGames manda tráfico de prueba (miles de
   partidas) para medir retención. Es la fuente principal.
2. **Web propia**: 14 páginas SEO + 5 por juego nuevo, y el catálogo enlazado entre sí.
3. **itch.io**: página pública con devlog (r/WebGames e itch traen las primeras decenas de partidas).
4. Comunidades de `MARKETING.md` (r/WebGames, r/IndieDev, foro de Phaser), siempre con aprobación de Moisés.
5. Profesores de Algorithmics, con la página para escuelas (sin datos de alumnos).

## 5. Qué hace falta para el primer euro (en orden)
1. **Cuenta de desarrollador en CrazyGames** (Moisés) y subir `egg-truck-crazygames.zip` con las fichas de
   `FICHAS.md`. Revisión: de unos días a 2 semanas.
2. **Lanzamiento básico** en CrazyGames: tráfico de prueba durante unas 2 semanas. Si la retención supera su referencia,
   pasa al **lanzamiento completo**, que es cuando generan ingresos de verdad.
3. **Datos de cobro en Tipalti** (Moisés, desde el panel de CrazyGames cuando lo pida): titular autónomo, IBAN y
   formulario fiscal W-8BEN (no residente en EE. UU.).
4. En paralelo, sin esperar: **GameDistribution** y **GameMonetize** (Moisés abre la cuenta y me pasa el *Game ID* de
   cada juego; recompilo con `ids` en `juegos.json`), **itch.io** con donación sugerida y **Poki** con la URL de
   Vercel.
5. Web propia: solicitar **AdSense for Games** cuando el sitio tenga 20 páginas y algo de tráfico (con el juego 3 ya
   las tiene).

**Fecha prevista del primer euro devengado:** diciembre de 2026 (CrazyGames en lanzamiento completo o GameDistribution
sirviendo anuncios). **Primer cobro en cuenta:** enero–febrero de 2027, cuando se pase el umbral de 100 € de Tipalti; antes
si GameDistribution o itch.io llegan a su umbral.

## 6. Calendario de los 3 siguientes juegos (la plantilla multiplica las sesiones)
Cada juego nuevo sale con los 5 paquetes (CrazyGames, Poki, GameDistribution, GameMonetize, itch.io), sus 5 páginas
SEO y entra en el catálogo de la web propia. Más juegos = más partidas por jugador que llega a la web y más fichas en
cada portal.

| Juego | Estado (28/10/2026) | Envío a portales | Por qué ahora |
|---|---|---|---|
| **Bike Flip** (coches tipo plataforma por niveles, voltereta = turbo) | En construcción con el motor de Egg Truck | Semana del 3/11 | El género con más partidas por título en Poki |
| **Snow Plow** (quitanieves que empuja regalos hasta el trineo) | En construcción | Antes del 20/11 | Los portales destacan juegos de Navidad desde finales de noviembre |
| **Jelly Stack** (apilar gelatina, un toque) | En construcción | Semana del 10/11 | Hipercasual de apilar: el 79 % del tiempo de juego en CrazyGames es hipercasual |
| *(4.º)* **Rocket Hop** (propulsar y aterrizar en plataformas móviles) | En construcción | Semana del 17/11 | Reutiliza la física; amplía al público de juegos espaciales |

A partir de ahí, la tarea programada saca **2 juegos web por semana** (`TAREA-PROGRAMADA.md`) y **1 experiencia de
Roblox al mes** (`roblox/`).

## 7. Cómo se mide
Cada lunes la tarea programada lee los informes de los portales que Moisés deje en `proyectos/juegos/datos/` (o los
paneles cuando haya acceso) y apunta en `panel/data/proyectos.json` partidas, ingresos, eCPM real y retención por juego.
Con 3 juegos con datos se sustituyen las horquillas de este documento por las reales.
