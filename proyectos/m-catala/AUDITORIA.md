# Auditoría completa de Aprova (proyecto M) · 30/10/2026

Alcance: la web en producción (https://aprova-catala.vercel.app), el código de `proyectos/m-catala`, el contenido, el mercado y la
viabilidad. Método: pruebas automáticas sobre producción (rastreo de rutas, Lighthouse, axe, API), revisión de código archivo por archivo,
capturas de todas las pantallas en Pixel 7 y escritorio, e investigación de mercado con fuentes. Los informes detallados están en
`auditoria/tecnica.md`, `auditoria/codigo.md` y `auditoria/mercado.md`; este documento es la síntesis y la decisión.

## 0. Veredicto en diez líneas

1. **Producto**: prototipo muy completo (flujo entero sin registro, pagos, PWA, dos idiomas, 392 ítems validados) con una identidad propia
   que ya no parece de plantilla. Madurez: **beta temprana**. Apto para la prueba con 20 candidatos en entorno controlado; **no apto para
   cobrar** hasta cerrar los puntos de la sección 6.
2. **El número estrella está mal**: la probabilidad de aprobar multiplica factores dependientes, cuenta el oral dos veces y, si se salta el
   oral, lo estima a la baja; un candidato en los mínimos sale con ≈ 3 % y quien aprueba la parte escrita ve «2 %». Es el primer número que
   ve el usuario y hoy no es creíble. Arreglo de una sesión.
3. **Dinero en riesgo**: `/api/tts` sintetiza cualquier texto sin autenticación ni límite (con ElevenLabs, 300 $ por 2 M de caracteres); las
   cuotas gratuitas se saltan con un campo del cliente o una cookie inventada; el pase de convocatoria se renueva gratis recargando la URL
   de vuelta de Stripe. Arreglo de una tarde.
4. **Mercado**: el C1 de la DPL son 2.000–4.000 presentados al año y lo suspende la mayoría (41 % de aptos en 2023). El dinero está en el
   **C2** (13.068 inscritos en 2026, requisito docente prorrogado hasta 2027-28) y, fuera de Cataluña, en la JQCV (30.000 matrículas). Hoy
   Aprova no tiene C2.
5. **Competencia**: existe un competidor directo que el proyecto no había mapeado, **Catfy** (PWA, A1–C2, corrección escrita y oral con IA,
   simulacros, gratis en lanzamiento). Parla.cat (gratis, Generalitat) cubre el 80 % de la preparación.
6. **Necesidad real**: la gente paga por corrección creíble y acompañamiento (academias 300–480 €, CPNL 263 € con 8.000 en lista de
   espera), no por tests. Aprova solo tiene hueco si publica una prueba de validez ≥ 80 % y hace del pase de convocatoria el producto.
7. **Portada**: «Un de cada quatre suspèn» se queda corta para el C1 (suspenden 3 de cada 5 en 2023); la cifra correcta es más fuerte.
8. **Viabilidad económica**: coste variable < 0,35 €/usuario/mes, margen > 90 %. Ingresos realistas: 1–4 k€ el primer año, 8–20 k€ al
   tercero con C2, JQCV y licencias B2B. **Negocio complementario, no principal**; cumple el objetivo interno de 25 suscriptores (250 €/mes).
9. **Técnica**: sólida en lo básico (104 rutas sin errores, Lighthouse 89–99 en rendimiento, 100 en buenas prácticas, PWA offline, webhook
   y cookies bien) y floja en lo que no se ve: rate limiting que en Vercel no limita nada, sin CSP, contraste del gris pequeño 3,1:1,
   hreflang y metadatos duplicados en casi todas las páginas, sin tests unitarios y 37 errores silenciados.
10. **Decisión recomendada**: seguir, con tres condiciones antes del cobro real: corregir seguridad y probabilidad (sección 6, fases 0–1),
    hacer la prueba de validez y añadir el C2. Estimación total hasta cobro real: 5–6 sesiones de trabajo más una tarde de Moisés.

## 1. Funcionalidad y técnica (producción)

Detalle, tablas por ruta y material bruto en `auditoria/tecnica.md`. Medido el 30/10/2026 sobre producción con Chromium (Pixel 7 emulado).

**Lo que está bien**
- 104 rutas rastreadas: 103 responden 200 y la inexistente da 404; 0 enlaces internos rotos de 157; 0 desbordamientos horizontales a
  360, 768 y 1440 px. TTFB 40–80 ms; 315–331 KiB transferidos por página; First Load JS 103–143 kB; `tsc` sin errores.
- Lighthouse móvil (rendimiento / accesibilidad / buenas prácticas / SEO): portada 89 / 96 / 100 / 100 (LCP 2,4 s); preus 97 / 96 / 100 / 91;
  guía C1 92 / 96 / 100 / 100; comencar 99 / 92 / 96 / 100.
- API: webhook sin firma → 400; métodos no permitidos → 405; cuerpos inválidos → 400 o 413; cookies HttpOnly, Secure y SameSite=Lax; HSTS,
  nosniff y Referrer-Policy presentes. La corrección gramatical detecta los 6 errores del texto de prueba en 0,9–1,3 s.
- PWA instalable (manifest válido, iconos, service worker activo) y la pantalla Avui se recarga sin red desde el service worker.

**Defectos**
| Gravedad | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| Alta | 30 POST seguidos a la corrección: ningún 429. El limitador es un `Map` en memoria y cada petición cae en otra instancia de Vercel; afecta también a login (fuerza bruta), registro, contacto, alerta y errata | `lib/http.ts:11` | Upstash Redis o tabla en Neon |
| Alta | 15 POST sin cookie `aprova_anon`: 15 × 200. La cuota gratuita se salta borrando la cookie | `app/api/corregir/route.ts:20-25`, `lib/http.ts:22` | Cookie firmada y conteo en servidor (ver sección 2) |
| Alta | Sin Content-Security-Policy ni X-Frame-Options en ninguna respuesta: clickjacking posible en entrar y compte | `next.config.mjs:7-9` | Añadir CSP y `frame-ancestors 'none'` |
| Alta (accesibilidad) | Gris `#8A92AB` sobre blanco = 3,09:1 en textos de 11–13 px (barra inferior, textos terciarios, pie): 46 nodos marcados por axe en las 6 páginas; es la única causa de no llegar a 100 en accesibilidad | `app/globals.css:13`, `components/BarraMovil.tsx:21` | Terciario `#6B7390` (4,6:1) o 14 px mínimo |
| Alta (accesibilidad) | El botón «Fes el diagnòstic gratuït» de las 62 guías se ve azul oscuro sobre azul (2,2:1): la regla `.prosa a` pisa el blanco del botón | `app/globals.css:134`, `app/[lang]/guia/[slug]/page.tsx:25` | Excluir `.boton-primari` de `.prosa a` |
| Media (SEO) | hreflang incorrecto en 95 de 96 páginas (apunta a la raíz, sin x-default); 35 páginas sin canonical ni Open Graph (portada y preus incluidas); 27 títulos y 31 descripciones duplicados del layout; 7 páginas sin h1; sitemap con `lastmod` de ahora y sin 62 rutas públicas; favicon.ico y apple-icon.png 404 | `app/[lang]/layout.tsx:19-25`, `app/sitemap.ts` | Metadatos por página; hreflang por ruta; sitemap con fechas reales |
| Media | `GET /api/progres` devuelve 401 a cada carga anónima: error de consola en 17 páginas y penaliza buenas prácticas | `lib/estat.ts:57-60` | No llamar sin sesión |
| Media | Sin modelo de lenguaje en producción: los criterios de adecuación, coherencia y riqueza salen de heurística y se marcan como orientativos; dos reglas mal etiquetadas; Stripe en modo prueba (`prova:true`) | `/api/yo`, `lib/correccio` | Clave de modelo en Vercel; etiquetas de regla |
| Media (accesibilidad) | `aria-pressed` en `role="radio"` (axe crítico, 3 nodos por pregunta) y barra de progreso sin nombre accesible | `components/ItemVista.tsx:77`, `DemoItem.tsx:29`, `ui/Segments.tsx:4` | Quitar `aria-pressed`; `aria-label` en la barra |
| Media | `npm audit`: postcss ≤ 8.5.22 (3 altas) y deepmerge-ts < 8 (alta, vía Prisma); preus con `force-dynamic` (sin caché ni bfcache) | `package.json` | Actualizar; preus estático con revalidación |

No medido: flujo de pago real, sesión autenticada (no se creó cuenta en la prueba técnica), Safari y Firefox reales, endpoints que exigen
sesión (oral, tts, portal, subscripció).

## 2. Código, seguridad y motor pedagógico

Detalle con archivo y línea en `auditoria/codigo.md`. Lo que importa:

| Gravedad | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| **Crítica** | Síntesis de voz de texto arbitrario sin autenticación ni límite; con `demo=1` usa ElevenLabs: coste ilimitado para un tercero | `app/api/tts/route.ts:11-15`, `lib/veu.ts:17` | Aceptar solo ids de textos del banco; frase de demo fija y cacheada; límite por IP |
| **Crítica** | Cuotas gratuitas evitables: `context:'diagnostic'` exime de la cuota, el simulacro solo cuenta si el cliente envía `inici:true`, y la cookie `aprova_anon` acepta cualquier valor de 24 hex | `app/api/corregir/route.ts:24`, `app/api/simulacre/route.ts:18-23`, `lib/http.ts:25-27` | Cookie firmada (HMAC), conteo atómico en SQL, token de servidor de un solo uso para diagnóstico y simulacro |
| Alta | Probabilidad de aprobar mal calibrada: producto de factores dependientes, umbral oral contado dos veces, mínimo de la parte escrita (35,7) en escala distinta; oral no medido se estima como media − 8 | `lib/motor/diagnostic.ts:78-96`, `config/examens.json:46-52` | Una probabilidad por condición efectiva (área 1 ≥ 25/40, oral ≥ 19/30, global ≥ 65) combinada por simulación con ruido correlacionado; sin oral, dar solo la parte escrita |
| Alta | Reglas propias «inseguras» contadas como errores seguros y falsos positivos («el mateix dia», «hi han arribat», «número de telèfon», «degut a» participial) que bajan la nota | `lib/correccio/index.ts:70-72`, `lib/correccio/regles.ts` | Separar seguras de posibles; revisar las regex con el lote de validez |
| Alta | Dictado y oral toleran una letra de diferencia en palabras de más de 5 letras: «historia», «arribaba», «presupost» pasan por correctas | `lib/motor/avaluar.ts:36` | Tolerancia 0 en dictados (los acentos y grafías son el objetivo) |
| Alta | El `success_url` de Checkout es rejugable: cada visita renueva el pase 92 días; sin idempotencia ni reembolsos ni `livemode` | `app/api/checkout/confirmar/route.ts:17-20`, `lib/pagos.ts:106-111` | Tabla de pagos procesados (único por sesión/evento); `fins = max(actual, created + 92 d)` |
| Alta | Rate limiting en memoria por instancia: inútil en Vercel (fuerza bruta en login, spam en formularios, agotamiento de la API pública de LanguageTool) | `lib/http.ts:9-19` | Upstash Redis (gratis) o tabla en Neon con ventana |
| Alta | `/api/validesa` público, sin tope de longitud, códigos adivinables y rol «professor» autodeclarado: la prueba de validez se puede falsear | `app/api/validesa/route.ts:11-22` | Códigos aleatorios por tanda y clave de profesor en variable de entorno |
| Alta | Los 45 ítems premium de cada simulacro, con respuestas, van en el HTML público; el service worker cachea `/api/banc` premium y `/ca/compte` tras cerrar sesión | `app/[lang]/simulacre/[id]/page.tsx:9-10`, `public/sw.js:10-20` | Cargar ítems de simulacro desde API con sesión; no cachear rutas privadas |
| Media | Sesión sin revocación; secreto derivado de `DATABASE_URL` si falta `AUTH_SECRET`; `PAGO_DEMO=1` daría premium gratis en producción | `lib/auth.ts:12,34-55` | `AUTH_SECRET` obligatorio; versión de sesión en `Usuari`; eliminar `PAGO_DEMO` fuera de desarrollo |
| Media | La nota de «correcció» se presenta como fiable aunque LanguageTool falle; cabeceras sin CSP ni anti-clickjacking; `prisma db push` en cada build | `lib/correccio/index.ts:80`, `next.config.*`, `package.json` | Marcar «sense LanguageTool»; CSP y `X-Frame-Options`; migraciones |
| Media | RGPD y legal: sin borrado de cuenta en la app, NIF vacío, referencia a la plataforma ODR (cerrada en 2025), alertas sin baja | `lib/legal.ts:13,65`, `app/api/alerta` | Botón de borrado, NIF real, quitar ODR, enlace de baja en cada correo |
| Media | Racha: congelaciones encadenadas entre meses; plan cortado a 200 días; sincronización localStorage ↔ servidor «el último gana» sobre el estado completo | `lib/motor/ratxa.ts`, `lib/motor/pla.ts`, `lib/estat.ts` | Fusión por campo; recorte por convocatoria |

**Contenido** (banco compilado el 28/10): 392 ítems (B1 100, B2 120, C1 172), 22 textos, 14 tareas, 9 simulacros, 30 reglas en 6 idiomas.
Formalmente limpio (0 duplicados, 0 avisos seguros de LanguageTool). Problemas: **ningún ítem ha pasado revisión humana**; 29 pares
nivel-punto tienen menos de 8 ítems (B2 «puntuació» tiene 1; C1 «ser-estar», «perífrasis», «concordança» tienen 2); las dificultades de B1 y
B2 están en [−0,6; 0,8], así que el test adaptativo apenas discrimina; los tres simulacros de C1 comparten la misma redacción y reutilizan
el banco de práctica (quien practica ve en el simulacro ítems que ya ha hecho). Muestra de 25 ítems revisada: 21 correctos; 4 discutibles
en catalán normativo («prova-te'l» también es válido; «no obstant» solo está admitido; ser/estar de localización; «degut a» aceptado por la
GIEC). Hay que corregirlos antes de la prueba de validez.

## 3. Mercado, necesidad real y competencia

Detalle y fuentes (URL y año) en `auditoria/mercado.md`.

| Dato | Valor | Fuente |
|---|---|---|
| Presentados DPL 2023 (récord) | 8.306; aptos 5.731 (69 %) | llengua.gencat.cat, sept. 2023 |
| C1 DPL 2023 | 2.048 presentados, **41,3 % aptos** | ídem |
| C2 DPL 2023 / 2024 / 2026 | 5.369 presentados / ≈ 8.300 examinados / 13.068 inscritos | 3cat, c2catala.cat |
| B1 / B2 DPL 2023 | 239 / 392 presentados | ídem |
| CIFALC 2023 | 4.966 candidatos (969 de C1), 62 % aptos | Jornada CIFALC 2024 |
| Salut 2025 | 1.071 examinados, 79 % aptos | Departament de Salut |
| CPNL | > 41.000 alumnos por trimestre, 8.000–9.000 en lista de espera; C1 120 h 262,67 € | CPNL 2025-26 |
| JQCV (Valencia) | ≈ 30.000 matrículas/año; tasa C1/C2 23,39 € | GVA 2024-25 |
| Tasas DPL 2026 | A2–B2 23,90 €; C1/C2 **57,45 €** | DPL 2026 |
| Academias C1 | 299–484 € (AulaCatalà, General d'Estudis Lleida); EOI 275–334 €; UPF 270 € | webs 2025-26 |
| Apps | Duolingo Super ≈ 7,3 €/mes; Babbel 7,99–15,99 €/mes; Busuu 57,99 €/año | 2026 |

**Lo que cambia respecto a lo que suponíamos**
- «Un de cada quatre suspèn» es cierto para el C2 y para Salut, pero para el C1 suspenden **3 de cada 5** (modelo antiguo; del nuevo modelo
  2024–26 no hay dato público: pedirlo por transparencia). La portada debe usar la cifra del C1 cuando el usuario elige C1.
- El mercado castellanohablante del C1 con intención digital es de **1.300–2.300 personas al año**. Sin el C2, el techo es muy bajo.
- **Catfy** (catfy.app) hace casi lo mismo que Aprova, con IA y gratis en lanzamiento, solo en catalán. Define el precio del «test + plan»
  en 0 €. Aprova solo puede cobrar por lo que demuestre: validez publicada, oral por sonidos, versión en castellano, probabilidad calibrada.
- Las academias de oposiciones **no preparan el C1** (Adams solo tiene «Catalán básico» gratuito): hueco para acuerdos y para SEO en castellano
  («qué nivel de catalán piden las oposiciones del ICS», «prueba de catalán Mossos 46/26»).
- Google Ads admite catalán y no restringe la preparación de exámenes; con 100 €/mes y CPC 0,8–2 € salen 1–2 pagos al mes (CAC 50–100 €,
  por encima del tope de 25 €). Solo en castellano, solo en enero y abril–mayo.

**Mercado accesible** (hipótesis explícitas en `auditoria/mercado.md` §8): TAM ≈ 80.000 personas-año en el dominio lingüístico; SAM 9.000–12.000
con C2 (1.300–2.300 sin él); SOM a 12 meses 60–100 pagadores (2.500–4.000 €), a 36 meses 150–400 pagadores más 3–5 licencias B2B (8–20 k€/año).
Conversión diagnóstico → pago a planificar en 1,5–2 %, no 3–5 %, mientras Catfy sea gratis.

**Juicio sobre la necesidad**: existe, pero es estrecha y estacional (enero y abril–mayo). El dolor real es suspender el C1 (57,45 € y un año
de espera, o la plaza) y nadie lo cuantifica; la disposición a pagar está en la corrección de la redacción y el acompañamiento. Aprova es
viable como producto complementario de margen alto, no como negocio principal.

## 4. Entorno visual y experiencia (capturas en Pixel 7 y 1280 px, producción)

**Lo que funciona**
- La identidad ya no parece de plantilla: portada azul cuadriculada con en Volat como punto final, logotipo con trazado, una sola familia tipográfica ancha. Coherente en todas las pantallas (cabecera, pie, hojas de examen, sello).
- La hoja de examen (`.full`) con bombolla de letra, corrección en el sitio y «Per què?» con la regla citada es la mejor pantalla del producto: clara, rápida, con la fuente (DIEC2/Optimot) a un toque.
- Precios: un precio grande, selector de tres planes, aviso de modo prueba. Sin trucos.
- Convocatorias con fecha de prueba, ventana de inscripción, tasa y enlace oficial, marcadas como previstas.

**Defectos encontrados (por gravedad)**
| Gravedad | Pantalla | Qué pasa | Corrección |
|---|---|---|---|
| **Crítica (credibilidad)** | Resultado del diagnóstico | Quien salta el bloque oral recibe casi siempre «2 %» aunque la parte escrita esté aprobada (72 %/35,7 en la prueba local). Causa: `lib/motor/diagnostic.ts:96` estima la oral como `media − 8` (mínimo 25) y esa estimación entra tres veces en el producto de probabilidades (parte oral, área oral y global). El primer número que ve el usuario es una cifra inventada y desmoralizante. | Si no hay dato oral, calcular la probabilidad **solo de la parte escrita** y mostrarla como «probabilitat d'aprovar la part escrita», con la oral «sense mesurar»; o pedir 60 s de lectura en voz alta antes de dar un global. |
| Alta | Resultado del diagnóstico | La frase explicativa dice «no apte per l'oral» cuando la oral no se ha medido; contradice la etiqueta «estimació» de la barra. | Excluir áreas estimadas de `fraseResultat`. |
| Alta | Mapa de dominio | Tras un solo ítem muestra «60 % · 1» en seis puntos: una confianza del 60 % con n=1 es ruido presentado como dato. | Mostrar «—» hasta n ≥ 3 y un intervalo o «pocs ítems» debajo. |
| Alta | Convocatòries | Aparece «Universitats (CIFALC) · octubre 2026» con prueba el 9/10/2026, ya pasada, en primera posición. | Filtrar convocatorias con prueba anterior a hoy; ordenar por inscripción. |
| Media | Practicar, Simulacre, Escriure | Listas de 7, 9 y 14 «hojas» idénticas con marcas de registro: la hoja de examen se ha convertido en la tarjeta repetida que la marca quería evitar. | Reservar `.full` para el ítem que se responde; las listas como lista (línea superior, título, meta). |
| Media | Simulacre (lista) | La cabecera de B1 y B2 anuncia «Comprensió oral · 40 min», pero el simulacro solo cubre la parte escrita y lo dice en letra pequeña. | Decir arriba «Simulacre de la part escrita (l'oral arriba a la sessió 2)». |
| Media | Diagnòstic, bloque 4 | «Bloc 4 de 4 · uns 1 minuts» (concordancia). | `minutsAprox(1)` → «1 minut». |
| Media | Avui | Tres medidas en una línea («1 dia · Et queden 2 congelacions») con tipografías distintas; la racha de 1 día con llama roja es prematura. | Mostrar la llama a partir de 3 días; una métrica por línea. |
| Media | Portada | El párrafo de 4 líneas bajo el titular es largo para móvil; el bloque «Properes inscripcions» repite «Universitats (CIFALC)» para B2 y C1 con el mismo texto. | Acortar el párrafo a dos frases; agrupar convocatorias iguales. |
| Baja | Portada | La hoja de demo se superpone al azul solo 32 px; en escritorio queda alineada a la izquierda con 400 px vacíos a la derecha. | Centrar la hoja o ponerla a dos columnas con «Properes inscripcions». |
| Baja | Pie | El pie ocupa más que el contenido en pantallas cortas (Practicar, Oral); el logotipo del pie compite con el de la cabecera. | Pie compacto en las pantallas de app (rutas con barra inferior). |
| Baja | Sello NO APTE | En Volat «sorpres» aparece atenuado si la captura coincide con la animación; el sello y el personaje compiten. | Volat pequeño (40 px) bajo el sello, no al lado. |
| Baja | Castellano | La versión es correcta pero algunos términos del examen quedan en catalán («Ús de la llengua», «apte») sin explicación. | Glosario de una línea la primera vez. |

**Lo que falta para «la mejor herramienta» (producto, no estética)**
1. **Oral**: hoy es lectura en voz alta con el reconocimiento del navegador y una puntuación por palabras reconocidas, marcada como aproximada. Un candidato al C1 necesita la prueba oral real (exposición y diálogo). Es la mayor carencia frente a la promesa de la portada.
2. **Audio**: dictados y comprensión oral dependen de la voz del móvil del usuario (calidad irregular; en algunos Android no hay voz en catalán y se muestra el texto).
3. **Corrección escrita**: sin clave de modelo de lenguaje en producción, adecuación, coherencia y riqueza salen de heurísticas y se marcan como orientativas. La promesa «corrección con la rúbrica oficial» solo se cumple con la clave puesta y la prueba de validez hecha.
4. **C2** no está (sesión 2); la portada lo lista como «Sessió 2», correcto pero visible.
5. **Prueba social**: cero testimonios, cero cifras de usuarios, cero «quién está detrás». Para cobrar por corregir hace falta una página «Com corregim» con el método y la prueba de validez publicada.
6. **Onboarding**: no se pide la fecha de examen con precisión (se elige convocatoria), no hay recordatorio por correo/push salvo alerta de inscripción.

## 5. Estimación

**Coste de funcionamiento** (COSTES.md, confirmado): 0,02 €/usuario/mes hoy; 0,20–0,35 € con modelo de lenguaje, Google TTS y Whisper propio.
Fijos: Vercel compartido, Neon gratis, dominio 12–15 €/año, Upstash gratis. Por debajo del tope de 20 €/mes de nuevo gasto.

**Esfuerzo hasta poder cobrar** (sesiones de trabajo de Claude de 4–6 h; «Moisés» marca lo que solo puede hacer él):

| Fase | Qué | Esfuerzo | Bloquea |
|---|---|---|---|
| 0. Seguridad y dinero | TTS solo por id y cacheado; cookie anónima firmada y cuotas atómicas; pase idempotente; rate limiting en Upstash; `AUTH_SECRET` obligatorio; quitar `PAGO_DEMO`; CSP; validesa con códigos aleatorios y clave de profesor; ítems de simulacro por API | 1 sesión | cobro real, prueba de validez |
| 1. Fiabilidad del producto | Probabilidad recalculada por condición efectiva y sin oral inventado; dictado sin tolerancia; reglas seguras/posibles separadas y falsos positivos corregidos; aviso cuando LanguageTool falla; mapa con n ≥ 3; convocatorias pasadas fuera; 4 ítems discutibles corregidos; tests unitarios del motor | 2 sesiones | prueba de validez |
| 2. Prueba de validez | 20 candidatos y un profesor (Moisés, una tarde); análisis y ajuste del corrector; publicación del resultado como página | 1 sesión + Moisés | cobro real |
| 3. C2 y contenido | Modelo C2 DPL (texto 70 %, oral 30 %), tareas y simulacros C2; 250 ítems nuevos para llegar a 8 por punto en B1/B2/C1; 50 ítems/semana con revisión humana de muestra; dificultades B1/B2 ampliadas | 3–4 sesiones | SAM ×3–4 |
| 4. Legal y lanzamiento | NIF, borrado de cuenta, baja de alertas, texto ODR; `STRIPE_MODO=real`; portada con la cifra del C1 y el pase como oferta principal; SEO en castellano para opositores; listas en vez de hojas repetidas | 1 sesión | cobro real |
| 5. Sesión 2 | Simulacro oral con examinador de voz, Android, fase JQCV/valencià, B2B (hospitales, academias, colegios) | 4–6 sesiones | crecimiento |

Total hasta cobro real (fases 0, 1, 2 y 4): **5–6 sesiones de Claude más una tarde de Moisés**. Con C2 (fase 3): 9–10 sesiones.

**Ingresos previstos** (con los datos de mercado, no con las hipótesis anteriores): primer año 60–100 pagadores, 2.500–4.000 €; tercer año
8–20 k€ con C2, JQCV y licencias. El objetivo interno de VIABILIDAD (25 suscriptores, 250 €/mes a 12 meses) está dentro del rango.
Primer euro: no antes de cerrar las fases 0–2; si la prueba de validez se hace en noviembre, cobro real en diciembre y pico de demanda en
la inscripción de la DPL (20–28 de enero de 2027).

## 6. Plan de acción (orden)

1. Hoy mismo: fase 0 (seguridad y dinero). No hay excusa para dejar `/api/tts` abierto ni el pase rejugable.
2. Esta semana: fase 1 (probabilidad, dictado, reglas) y corregir la portada: cifra del C1, pase de convocatoria como oferta principal.
3. Moisés: conseguir los 20 candidatos y el profesor (sigue siendo la única tarea suya; PARA-MOISES.md no cambia).
4. Después de la validez: fase 4 y cobro real. En paralelo, fase 3 (C2).
5. Mes 2: anuncios solo si la conversión real es ≥ 1,5 % y solo en castellano en temporada.
6. Registrar en `panel/data/proyectos.json`: competidor Catfy, cifra del C1, SOM revisado.

## 7. Lo que esta auditoría no ha podido medir

Datos DPL 2024–2026 por nivel (no publicados; pedir por transparencia); volúmenes de búsqueda y CPC reales (Keyword Planner con cuenta);
la validez de la corrección frente a un profesor (requiere la prueba); el comportamiento con usuarios reales (no hay analítica instalada:
instalar Vercel Analytics o Plausible antes de la prueba); el audio sintetizado y Whisper (sin proveedor configurado); la compatibilidad
con iOS Safari real (solo Chromium emulado).

## 8. Estado tras los arreglos (31/10/2026)

Todo lo que era un arreglo está hecho y desplegado en https://aprova-catala.vercel.app; lo que es producto nuevo (C2, 250 ítems, prueba
de validez con candidatos) sigue pendiente y es lo único que separa la app del cobro real.

| Hallazgo | Estado |
|---|---|
| TTS de texto libre sin límite | **Cerrado**: solo ids del banco o la frase de demo fija; límite por IP y anónimo; timeouts |
| Cuotas evitables (cookie, `context`, `inici`) | **Cerrado**: cookie anónima firmada, conteo atómico en SQL, diagnóstico exento una vez al mes, simulacro con inicio comprobado |
| Pase rejugable, sin idempotencia ni reembolsos | **Cerrado**: tabla `Pagament`, `fins = max(actual, creado + 92 d)`, `livemode`, reembolso, disputa y baja de suscripción (eventos añadidos al webhook de Stripe) |
| Limitador en memoria | **Cerrado**: tabla `Limit` compartida entre instancias; en demo local sigue en memoria |
| Sin CSP ni X-Frame-Options | **Cerrado** (CSP con `'unsafe-inline'` en scripts: un nonce rompería el renderizado estático) |
| Validesa falseable | **Cerrado**: 20 códigos aleatorios y clave de profesor en variables de Vercel; textos con caducidad de 90 días |
| Ítems premium en el HTML y en la caché | **Cerrado**: ítems por API tras inicio autorizado; service worker sin rutas privadas y vaciado al salir |
| Sesión sin revocación, secreto derivado, `PAGO_DEMO` | **Cerrado**: `AUTH_SECRET` obligatorio, versión de sesión, salir de todos los dispositivos, demo solo fuera de producción |
| Probabilidad mal calibrada y oral inventado | **Cerrado**: simulación con condiciones efectivas (candidato en los mínimos ≈ 40 %), sin oral se da la probabilidad de la parte escrita y se dice |
| Dictado tolerante, reglas con falsos positivos, nota fiable sin LanguageTool | **Cerrado**: tolerancia 0, reglas corregidas y las inseguras como «posible error», aviso cuando LanguageTool falla |
| Racha, plan a 200 días, estado «el último gana» | **Cerrado**: tope de congelaciones, plan hasta la convocatoria, fusión por campo |
| RGPD y legal | **Cerrado** salvo el NIF: borrado de cuenta, baja de alertas, texto ODR retirado; `LEGAL_NIF` lo pone Moisés |
| Contraste, botón ilegible, aria, hreflang, canonical, OG, h1, sitemap, favicon, preus dinámico, 401 en consola | **Cerrado** |
| Listas como hojas, convocatoria pasada, mapa con n=1, Hoy, pie, concordancias, cifra del C1, pase como oferta | **Cerrado** |
| 7 ítems discutibles, B2 puntuación con 1 ítem, redacciones repetidas en los simulacros | **Cerrado** (8 ítems nuevos de puntuación; 400 ítems) |
| Tests unitarios | **Cerrado**: 17 pruebas del motor (`npm test`) |
| Dependencias con avisos (postcss vía Next, deepmerge-ts vía Prisma) | **Abierto**: solo se cierran con Next 16 y Prisma 7 |
| C2, 250 ítems para 8 por punto, revisión humana, prueba de validez, analítica | **Abierto** (producto nuevo, no arreglo) |

Verificación: `tsc` y `next build` limpios, `npm test` 17/17, prueba de punta a punta en Pixel 7 en local y en producción (registro y Checkout
incluidos) sin errores de JavaScript. Variables nuevas en Vercel: `VALIDESA_CLAU`, `VALIDESA_CODIS`; `AUTH_SECRET` ya existía. Las sesiones
abiertas antes del despliegue caducan (formato de token nuevo).
