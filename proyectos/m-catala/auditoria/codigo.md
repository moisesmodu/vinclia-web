# Auditoría de código, seguridad y contenido · Aprova (proyectos/m-catala)

Fecha: 30/10/2026 · Alcance: solo lectura sobre `app/api/**`, `lib/**`, `components/**`, `middleware.ts`, `next.config.mjs`, `config/*.json`, `motor/*.mjs`, `scripts/*.mjs`, `prisma/schema.prisma`, `generado/banc.json` y documentación. No se han buscado ni copiado claves. Las rutas son relativas a `proyectos/m-catala/`.

Severidad: **Crítico** (explotable hoy con impacto económico o de datos) · **Alto** (bug de producto o agujero de seguridad relevante) · **Medio** · **Bajo**.

---

## 1. Hallazgos críticos

### C1. `/api/tts` sintetiza texto arbitrario del cliente sin autenticación ni límite: coste ilimitado (ElevenLabs/Google/Azure)
**Archivo:** `app/api/tts/route.ts:11-15`, `lib/veu.ts:17-18`, `components/DemoVeu.tsx:7`
El comentario de la ruta dice «Els textos venen del banc, no de l'usuari», pero el texto se lee del query string (`text`, hasta 2.000 caracteres) y nunca se comprueba contra el banco. Con `?demo=1` y `ELEVENLABS_API_KEY` configurada, `sintetitzar()` elige ElevenLabs (150 $/M caracteres) para cualquier texto; sin `demo`, usa el proveedor de pago configurado. La ruta no llama a `limitar()` ni exige sesión, y la caché en memoria (`lib/veu.ts:10`) no ayuda porque cada texto distinto es una llamada nueva. Hoy `TTS_PROVEIDOR=navegador` limita el daño al caso `demo=1`.
**Reproducir:** `for i in $(seq 1000); do curl "https://…/api/tts?demo=1&text=$(python3 -c 'import random,string;print("".join(random.choices(string.ascii_letters,k=2000)))')"; done` → 2 M caracteres ≈ 300 $ en ElevenLabs.
**Corrección:** aceptar solo un `id` de texto del banco (dictado/CO/lectura oral/frase demo) y resolver el texto en servidor; limitar por IP y anonId; para la demo, un único texto fijo con caché persistente (Vercel Blob o `public/audio/cache`).

### C2. Las cuotas gratuitas se saltan con flags controlados por el cliente y con una cookie anónima falsificable
**Archivo:** `app/api/corregir/route.ts:24-27`, `app/api/simulacre/route.ts:18-24`, `lib/http.ts:22-30`
(a) En `/api/corregir`, `b.context === 'diagnostic' || 'simulacre'` exime de la cuota y del contador, y lo decide el cliente. (b) En `/api/simulacre`, la cuota solo se comprueba e incrementa cuando el cliente envía `inici: true`; el guardado del resultado no la verifica. (c) `anonId()` acepta cualquier valor que cumpla `/^[a-f0-9]{24}$/`, así que basta enviar una cookie `aprova_anon` nueva en cada petición para tener cuota infinita en `/api/corregir`, `/api/oral` y `/api/simulacre`. Además, la comprobación `findUnique` → `upsert` no es atómica (dos peticiones concurrentes pasan ambas). Con `ANTHROPIC_API_KEY` activa, cada corrección cuesta ≈ 0,013 $.
**Reproducir:** `curl -X POST /api/corregir -H 'content-type: application/json' -d '{"text":"<15+ palabras>","nivell":"C1","context":"diagnostic"}'` repetido sin límite; o `-H 'Cookie: aprova_anon=000000000000000000000001'` cambiando el sufijo.
**Corrección:** firmar `aprova_anon` con HMAC (como la sesión) o guardarlo en tabla al crearlo; hacer el conteo en servidor con `UPDATE … WHERE correccions < limit` (o `upsert` + comprobación del valor devuelto); eliminar la exención por `context` y en su lugar emitir un token de servidor de un solo uso al empezar diagnóstico/simulacro.

---

## 2. Hallazgos altos

### A1. Reglas propias «inseguras» se cuentan como errores seguros y varias regex tienen falsos positivos claros
**Archivo:** `lib/correccio/index.ts:70-72`, `lib/correccio/regles.ts:38,50,55,84,85-86,14,31,93`
`detectar()` marca `segur: r.segur !== false` (regles.ts:106), pero `corregir()` fusiona *todos* los `propis` en `errors` sin filtrar por `segur` (solo filtra los de LanguageTool). Así, reglas declaradas como duda («al + infinitiu», «número de», «tindre», «sentir la ràdio», «el mateix»…) se muestran como error seguro, bajan la nota de corrección (`heuristiques` usa `errors.length`) y se envían al LLM como «errors segurs». Falsos positivos concretos: `regles.ts:50` la lookahead `(?=[ ,.]*$)` solo afecta a «la mateixa», así que «el mateix dia», «els mateixos problemes» se marcan siempre; `:85-86` «hi han»/«hi havien» marcan «Hi han arribat tots», «hi havien anat» (correctos); `:38` «número de telèfon/compte» (correcto) se marca; `:84` marca «sapiguem/sapigueu», que el propio mensaje reconoce como formas correctas; `:55` «un mes tard» se corrige a «més tard»; `:14` «degut a» con valor participial («retard degut a la vaga») es correcto; `:93` «de El Periódico», «a El Vendrell» (flag `i`); `:31` «assentar-se» es válido con sentido de establecerse.
**Reproducir:** `POST /api/corregir` con «El mateix dia hi han arribat vint persones i ens han donat el número de compte.» → tres errores «segurs» en una frase correcta.
**Corrección:** en `index.ts` separar `propis.filter(e => e.segur)` → `errors` y el resto → `possibles`; arreglar las regex citadas (agrupar la lookahead, excluir participio tras «hi han», acotar «número de» a cuantificables) y añadir tests unitarios con frases correctas que no deben marcarse.

### A2. La probabilidad de aprobar está mal calibrada: producto de factores dependientes, umbral oral contado dos veces y mínimo de la parte escrita en escala incorrecta
**Archivo:** `lib/motor/diagnostic.ts:78-88`, `config/examens.json:46-47,50-52`, `components/Simulacre.tsx:60-63`
`probabilitatAprovar` multiplica Φ((nota−mínim)/9) para cada parte, cada área con mínimo y el global, como si fueran independientes, cuando derivan de las mismas notas. En C1 hay cinco factores y el oral aparece dos veces (parte `oral` mínimo 63,3 y área `oral` mínimo 19/30 = 63,3): un candidato exactamente en todos los umbrales recibe 0,5⁵ ≈ 3 % cuando lo razonable es ≈ 50 %. Además `parts.escrita.minim = 35.7` (25/70) se compara con una nota en porcentaje, de modo que ese factor casi siempre vale ≈ 1 y no representa el mínimo real de 25/40 del área 1 (que ya cubre el área). El oral «estimado» (`estimacio()` = media−8) se multiplica igual que una medida real. La escala θ→nota (`notaUs`) tampoco está anclada a ningún examen real: en B1/B2 las dificultades van de −0,6 a 0,8, así que con 12 aciertos θ se dispara hasta el tope y la nota prevista ronda 97-99 %.
**Reproducir:** `probabilitatAprovar(examens.C1, {us:65, escrit:62.5, oral:63.3})` → `probabilitat` ≈ 3-6 % con todas las notas en el mínimo.
**Corrección:** calcular una sola probabilidad por condición *efectiva* (área 1 ≥ 25/40, oral ≥ 19/30, global ≥ 65) y combinarlas con un mínimo o una simulación Monte Carlo con ruido correlacionado; eliminar `parts.*.minim` redundantes de C1 o ponerlos en la misma escala; no multiplicar áreas estimadas (o usar σ mayor).

### A3. El dictado y la lectura oral toleran una letra de diferencia en palabras de más de 5 letras: los errores que se quieren medir (acentos, b/v, s/ss) pasan por correctos
**Archivo:** `lib/motor/avaluar.ts:36` (`igual = x === y || (x.length > 5 && levenshtein(x, y) <= 1)`), usado en `:20-23` (dictat) y `lib/oral.ts:14`
`normalitzar()` conserva los acentos, pero la tolerancia de Levenshtein ≤ 1 hace que «història/historia», «arribava/arribaba», «necessari/necesari», «pressupost/presupost» cuenten como palabra correcta. Como el dictado se considera superado con ≥ 90 % de palabras «ok», un texto con todos los acentos mal puede marcarse como correcto, justo lo contrario del `focus` declarado en los ítems (`contenido/items/C1/dictat.json`: «accents», «l·l», «apòstrof»).
**Reproducir:** `avaluar(item c1-dictat-0003, "La infermera de l'hospital de Sant Pau ens va dir que l'analisi d'orina i la radiografia s'havien de repetir l'endema a les onze")` → `correcte: true`.
**Corrección:** en dictado usar igualdad exacta tras `normalitzar` (o una tolerancia solo para mayúsculas/puntuación) y marcar «quasi» cuando solo difieran acentos; conservar la tolerancia únicamente en la alineación del ASR.

### A4. El `success_url` de Checkout (`/api/checkout/confirmar`) es rejugable y cada visita renueva el pase 92 días desde hoy
**Archivo:** `app/api/checkout/confirmar/route.ts:17-20`, `lib/pagos.ts:106-111`, `app/api/stripe/webhook/route.ts:25-27`
`activarPassi()` fija `subscripcioFins = now + 92 días` sin comprobar si ya se activó para esa sesión de Checkout. El usuario que pagó un pase conserva en su historial la URL con `session_id=cs_…`; al volver a abrirla meses después, `ses.status === 'complete' && payment_status === 'paid'` sigue siendo cierto y se le conceden otros 92 días. Los reintentos del webhook de Stripe producen el mismo efecto. No hay tabla de eventos procesados (idempotencia) ni se manejan `charge.refunded`/`charge.dispute.created` (un reembolso no revoca el pase) ni se comprueba `ev.livemode`.
**Reproducir:** comprar el pase en modo prueba, esperar (o editar `subscripcioFins`), volver a cargar la URL de retorno → `subscripcioFins` vuelve a ser hoy + 92.
**Corrección:** guardar `ses.id`/`ev.id` en una tabla `PagamentProcessat` (único) y calcular `subscripcioFins` como `max(fins actual, created + 92 d)` a partir de `ses.created`; procesar reembolsos y disputas; rechazar eventos cuyo `livemode` no coincida con el modo.

### A5. El limitador de peticiones vive en memoria por instancia: inútil en Vercel (fuerza bruta, spam y agotamiento de la API pública de LanguageTool)
**Archivo:** `lib/http.ts:9-19`; usado en todas las rutas (`entrar:9`, `registre:9`, `recuperar:11`, `corregir:14`, `validesa:9`, `alerta:6`, `contacte:5`, `errata:6`, `oral:14`, `simulacre:10`)
Cada función serverless tiene su propio `Map`, se recicla en frío y Vercel reparte las peticiones entre muchas instancias, así que el límite de «10 por minuto» no se cumple en la práctica. Consecuencias: fuerza bruta de contraseñas en `/api/auth/entrar` (solo frena el coste de scrypt), inserciones masivas en `Contacte`, `Alerta` y `Validesa`, y consumo del cupo compartido de `api.languagetool.org` (20 req/min para toda la app), que hace que `comprovarLT` devuelva `ok:false` y la corrección degrade a «regles» para todos los usuarios.
**Reproducir:** lanzar 200 peticiones paralelas a `/api/auth/entrar` desde una IP; la mayoría responde 401 y no 429.
**Corrección:** límite persistente (tabla `Us`/Postgres con ventana, Upstash/Vercel KV) o, como mínimo, bloqueo progresivo por cuenta tras N fallos de login; autoalojar LanguageTool o poner cola con límite global.

### A6. `/api/validesa` es público, sin tope de longitud y guarda texto libre de candidatos de forma indefinida
**Archivo:** `app/api/validesa/route.ts:11-22`, `prisma/schema.prisma` modelo `Validesa`, `components/FormValidesa.tsx`
Cualquiera que acierte un código `V00`–`V99` (100 posibilidades) puede enviar redacciones ilimitadas (sin `slice` en `text`, solo mínimo de 60 palabras), cada una corregida con LanguageTool y, si hay clave, con el LLM, y almacenada entera en Postgres. El rol «professor» se autodeclara en el cliente y sobrescribe `notaProfe` sin autenticación, lo que permite falsear la prueba de validez que condiciona el lanzamiento (MONETIZACION.md §5). La página promete «No es guarda cap nom», pero el texto puede contenerlos.
**Reproducir:** `POST /api/validesa {"codi":"V01","tascaId":"c1-escrit-0001","text":"<60 palabras>×1000","notaProfe":{"adequacio":10,…}}`.
**Corrección:** proteger la ruta con un secreto de evento (query o cabecera) distinto para candidato y profesor, limitar `text` a 8.000 caracteres, fijar fecha de borrado (p. ej. 90 días) y documentarlo en la política de privacidad.

### A7. Ítems premium con sus respuestas se sirven a cualquier visitante en la página de simulacro y en la caché del Service Worker
**Archivo:** `app/[lang]/simulacre/[id]/page.tsx:9-10`, `public/sw.js:10-13`, `app/api/banc/route.ts:15`
La página estática del simulacro pasa al cliente los 45 ítems completos (con `resposta`, `variants`, `pista`) sin mirar si el usuario es premium: entre los tres simulacros de C1 son 135 de 172 ítems, es decir, la mayor parte del banco de pago queda en el HTML/RSC público. Además el SW cachea `/api/banc` con la respuesta premium y la conserva tras cerrar sesión o caducar la suscripción, y cachea todas las navegaciones (incluida `/ca/compte` con el correo) en dispositivos compartidos.
**Reproducir:** `curl https://…/ca/simulacre/c1-simulacre-1 | grep -o '"resposta"' | wc -l`.
**Corrección:** servir los ítems del simulacro desde una ruta que compruebe sesión/cuota y los devuelva sin `resposta` (corrección en servidor), o al menos mezclarlos sólo tras `inici` autorizado; excluir `/compte` y las respuestas de `/api/banc` de la caché del SW y vaciarla en `sortir`.

---

## 3. Hallazgos medios

### M1. Sesión sin revocación ni rotación; secreto derivado de `DATABASE_URL` si falta `AUTH_SECRET`
**Archivo:** `lib/auth.ts:10-14,34-55`, `app/api/auth/nova-clau/route.ts:15-16`, `app/api/auth/sortir/route.ts`
El token es `id:caduca.HMAC` válido 60 días; «Sortir» solo borra la cookie y cambiar la contraseña no invalida las sesiones existentes (un atacante que robó la cookie sigue dentro). Si `AUTH_SECRET` no está definida, el secreto sale de la cadena de conexión de Neon (rotarla cierra todas las sesiones; compartirla en logs permite forjar sesiones). `comprobarClave` lanza `RangeError` (500) si el hash guardado tiene longitud distinta; `nova-clau` no limita la longitud de la contraseña (registro sí, 200). El login revela si el correo existe por tiempo (sin scrypt cuando no hay usuario, `entrar:12-13`) y el registro con 409 (`existeix`).
**Corrección:** incluir en el MAC un `versioSessio`/hash de la contraseña (como ya hace `tokenRecuperacion`), exigir `AUTH_SECRET` en producción, ejecutar scrypt con un hash ficticio cuando el usuario no existe, limitar longitudes.

### M2. La nota de «correcció» se presenta como fiable aunque LanguageTool haya fallado o no esté disponible
**Archivo:** `lib/correccio/index.ts:78-83,87`, `components/Correccio.tsx:19,26`
`orientativa: k !== 'correccio'` fija siempre `false` para corrección, también cuando `lt.ok === false` y el motor es `regles` (≈ 80 regex). El usuario ve 9-10/10 en corrección con la API pública caída o con el cupo agotado (ver A5), y en el simulacro eso decide el «apte». El mensaje en castellano de LT es el catalán (`languagetool.ts:32`, `es: m.message`).
**Corrección:** `orientativa: !lt.ok` para corrección y mostrar aviso «sense LanguageTool»; traducir o al menos etiquetar el idioma del mensaje.

### M3. Sincronización localStorage ↔ servidor con «último escribe, gana» sobre el estado completo: pérdida silenciosa de progreso
**Archivo:** `lib/estat.ts:45-69`, `app/api/progres/route.ts:11,20-23`
Cada cambio envía el estado entero (debounce 1,5 s) y `sincronitzarDesDelServidor` sustituye el estado local completo si el remoto es > 2 s más nuevo; un segundo dispositivo o una pestaña antigua puede machacar sesiones hechas sin conexión. `PUT` falla en silencio (`catch {}`) y devuelve 413 por encima de 900 KB sin aviso al usuario. `GET` devuelve el `Progres` más reciente de cualquier `nivell` mientras `PUT` lo guarda por nivel; `nivell` y `perfil.nivell` no se validan (`String(b.nivell ?? 'cap')`).
**Corrección:** fusionar por colecciones (`respostes`, `targetes`, `sessions` por unión; `ratxa.dies` por unión) o al menos avisar del conflicto; validar `nivell ∈ NIVELLS`; mostrar estado de sincronización.

### M4. `PAGO_DEMO=1` en producción concede premium gratis a cualquier cuenta
**Archivo:** `lib/pagos.ts:23-24`, `app/api/checkout/route.ts:20-27`
El modo demo activa `subscripcioEstat: 'demo'` (premium) con un POST; basta un despliegue con la variable heredada de las pruebas. `esPremium` también acepta `past_due` indefinidamente (`auth.ts:70`) si Stripe no actualiza.
**Corrección:** permitir demo solo con `NODE_ENV !== 'production'`; tratar `past_due` como premium solo durante N días.

### M5. Llamadas externas sin tiempo máximo
**Archivo:** `lib/correo.ts:10` (Resend), `app/api/oral/route.ts:31` (Whisper, cuerpo de audio sin límite de tamaño), `lib/veu.ts:26,31,35,38` (Google/Azure/Matxa/ElevenLabs)
Sin `AbortController`, una API colgada mantiene la función hasta el `maxDuration` (60 s) y, en `recuperar`, bloquea la respuesta del login. En `/api/oral` la transcripción Whisper (de pago/GPU) se ejecuta *antes* de comprobar la cuota (líneas 31 vs 41-44) y `segons` lo decide el cliente (puede enviar 0: solo se cargan 5 s).
**Corrección:** `AbortSignal.timeout(8000)` en todas; comprobar cuota antes de transcribir; limitar el blob (p. ej. 2 MB) y estimar los segundos en servidor a partir del tamaño o de la respuesta de Whisper.

### M6. Datos abiertos a cualquiera en `/api/simulacre`: envenenamiento de la cohorte y filas basura
**Archivo:** `app/api/simulacre/route.ts:12,24-25,34-40`
`nota` solo se exige `number` (acepta `NaN`, `1e308`), `arees` es JSON arbitrario sin tope, `simulacreId`/`convocatoria` no se validan contra el banco. Un script puede insertar miles de filas y desplazar los percentiles que se muestran a los usuarios («millor que el 90 % de la cohort»).
**Corrección:** validar rangos (0-100), `simulacreId ∈ BANC.simulacres`, `convocatoria ∈ convocatories`, limitar una fila por anonId/simulacro/día y calcular la cohorte solo con filas con sesión o con `inici` registrado.

### M7. `prisma db push` en cada build de producción
**Archivo:** `scripts/db-preparar.mjs:6`, `package.json` (`build`)
`db push` no genera historial de migraciones y puede eliminar columnas/tablas con datos al cambiar el esquema; además acopla el build a la disponibilidad de Neon.
**Corrección:** `prisma migrate deploy` con migraciones versionadas, fuera del `build` de Vercel.

### M8. Cabeceras de seguridad incompletas: sin CSP ni protección contra clickjacking
**Archivo:** `next.config.mjs:6-7`
Hay `nosniff`, `Referrer-Policy` y `Permissions-Policy`, pero no `Content-Security-Policy` (la app usa `dangerouslySetInnerHTML` en `guia/[slug]/page.tsx:21,26` e inserta contenido del LLM en títulos) ni `X-Frame-Options`/`frame-ancestors`. HSTS lo pone Vercel en `.vercel.app`, pero no al mover a `aprova.cat` salvo configurarlo.
**Corrección:** CSP con `default-src 'self'`, `frame-ancestors 'none'`, `connect-src` acotado; `Strict-Transport-Security` explícito.

### M9. Inyección de atributo en `lib/md.ts` (comillas en la URL del enlace)
**Archivo:** `lib/md.ts:2,4,11`
`esc()` no escapa `"`, y el `href` se inserta sin volver a escapar: `[x](/a" onmouseover="alert(1))` genera `<a href="/a" onmouseover="alert(1)">`. Hoy el Markdown es de primera mano (`contenido/seo`), así que el riesgo es bajo, pero el helper se anuncia como «segur». La tabla accede a `files[0]` sin comprobar que exista.
**Corrección:** escapar `"` y `'` en `esc()`, validar la URL con `new URL()` y rechazar esquemas distintos de `http(s)`/relativos.

### M10. Legal y RGPD: sin borrado de cuenta en la app, NIF vacío publicado, plataforma ODR desaparecida, alertas sin baja
**Archivo:** `lib/legal.ts:13,43-44,65`, `app/api/alerta/route.ts`, `components/AccionsCompte.tsx`, `prisma/schema.prisma`
No hay ruta ni botón para suprimir la cuenta y sus datos (`Usuari` → cascada a `Progres`, pero `Simulacre`/`Correccio` quedan con `SetNull` y `Validesa` no se vincula); la política dice «demana-ho i ho fem en 30 dies». `LEGAL_NIF` vacío produce «NIF pendent de publicar», incumpliendo el art. 10 LSSI mientras se cobre. El texto de condiciones remite a la plataforma europea ODR, cerrada el 20/7/2025 (Reglamento (UE) 2024/3228). Las alertas por correo se dan de alta sin doble opt-in y no existe enlace de baja (el consentimiento «revocable en un clic» no es cierto). La política de privacidad dice que se guardan «els textos que envies a corregir»: `Correccio` guarda solo agregados (bien), pero `Validesa` sí guarda el texto sin plazo. Encargados: se citan Vercel, Neon, Stripe, Resend, Anthropic/BSC, LanguageTool, Google/Microsoft; faltan el proveedor de Whisper (si se activa) y ElevenLabs (demo). El desistimiento de 14 días está (art. 102 RDL 1/2007) y es más generoso que la excepción del art. 103.m; correcto. Las cookies son técnicas (`aprova_sessio`, `aprova_anon`) y no hace falta banner; la `aprova_anon` de 400 días usada también para «cohort» roza lo analítico: conviene decirlo.
**Corrección:** ruta `DELETE /api/compte` con borrado/anonimización en cascada y botón; exigir `LEGAL_NIF` antes de `STRIPE_MODO=real`; quitar la referencia a ODR; enlace de baja firmado en cada correo de alerta; plazo de conservación para `Validesa`.

### M11. Plan: se corta a 200 días y las últimas semanas quedan sin simulacro si la convocatoria está lejos
**Archivo:** `lib/motor/pla.ts:31,37-40`
`total = min(200, dies)`: para quien elige la DPL de mayo 2027 hoy (≈ 190 días) va justo, pero con CIFALC junio 2027 o próximas ediciones el plan termina antes del examen y la «semana del simulacro» no existe. `recalibrar` solo cambia el área de los bloques futuros, nunca la duración ni el reparto 40/40/20 (que sí cuadra: 10→4/4/2, 15→6/6/3, 20→8/8/4).
**Corrección:** generar el plan por ventanas (p. ej. 8 semanas) ancladas a la fecha de prueba, con regeneración semanal.

### M12. Racha: las congelaciones se encadenan entre meses (hasta 4 días seguidos) y el compromiso no caduca
**Archivo:** `lib/motor/ratxa.ts:25-31,51-56`
Al retroceder, las ausencias de final de mes consumen congelaciones de ese mes y las del principio del siguiente, las del siguiente: 4 días sin practicar mantienen la racha. `progresCompromis` no indica cuándo acaba el compromiso ni lo cierra; en `Avui.tsx:98` la barra se muestra indefinidamente. Fechas en hora local (`avuiISO`), coherente con «cambio a medianoche local»; los viajes entre zonas pueden duplicar o saltar un día (aceptable).
**Corrección:** limitar la congelación a días consecutivos ≤ 2 independientemente del mes; cerrar el compromiso al llegar a `inici + dies`.

### M13. Accesibilidad: grupos `role="radio"` sin navegación con flechas, `confirm('?')`/`alert()` y campos solo con placeholder
**Archivo:** `components/Comencar.tsx:36`, `components/ItemVista.tsx:73-77`, `components/Diagnostic.tsx:180`, `components/Preus.tsx:22`, `components/Avui.tsx:58`, `components/AccionsCompte.tsx:16`, `components/Simulacre.tsx:108`, `components/FormAlerta.tsx:13`, `components/FormContacte.tsx:12-13`, `components/FormulariEntrar.tsx:33-34`
Los «radios» son botones independientes (cada uno tabulable, sin roving tabindex ni flechas), lo que contradice el patrón ARIA; en `ItemVista` el rol desaparece tras responder. Cancelar la suscripción pide confirmación con el texto «?». El fin de tiempo del simulacro usa `alert()` bloqueante. Varios inputs carecen de `<label>` o `aria-label` (solo placeholder). Positivo: `:focus-visible` global (`globals.css:41`), skip-link, `aria-live` en resultados, `Dial` con `role="img"`.
**Corrección:** usar `<input type="radio">` visualmente oculto o `fieldset` + teclado; `confirm` con texto del diccionario o diálogo propio; `aria-label` en formularios.

### M14. Calidad: sin tests unitarios, 37 `catch` vacíos, configuración JSON forzada con `as unknown as`, componentes de una sola línea
**Archivo:** `lib/correccio/index.ts:71` (`Promise.all([comprovarLT(text), Promise.resolve(null)])`, código muerto), `lib/datos.ts:13-22`, `components/Simulacre.tsx:81`, `app/[lang]/convocatories/page.tsx:14`, `components/Diagnostic.tsx:163-183` vs `components/Simulacre.tsx:129-141` (dos componentes casi idénticos de pregunta con opciones), `scripts/e2e.mjs:9` (Playwright cargado desde `npm root -g`, no declarado)
No hay ninguna prueba unitaria del motor (θ, probabilidad, racha, FSRS, regex) ni de las rutas; solo un e2e que depende de una instalación global. Los `catch {}` ocultan fallos de persistencia (`corregir:35`, `oral:46`, `tts:17`, `estat.ts:38,52`). Los JSON de `config/` y `generado/banc.json` se tipan por aserción sin validación (un `nivells` mal escrito pasa a producción). Hay 34 ternarios `idioma === 'ca' ? … : …` con texto fuera de `lib/i18n.ts` (p. ej. `Diagnostic.tsx:64-65,120,144,146`, `FormValidesa.tsx` y `validesa/page.tsx` completos, `DemoVeu.tsx:7`); el diccionario ca/es sí tiene paridad total (364 claves).
**Corrección:** Vitest con casos para `diagnostic.ts`, `ratxa.ts`, `regles.ts`, `avaluar.ts`; `zod` para `config/*.json` en `motor/comprobar.mjs`; registrar errores (`console.error` como mínimo) en los `catch`; mover textos a i18n; extraer `PreguntaOpcions`.

---

## 4. Hallazgos bajos

- **B1.** `app/api/auth/registre/route.ts:18`: `nivell`/`convocatoria` se guardan sin validar tipo ni valor (un objeto provoca 500 de Prisma). → validar contra `NIVELLS` y `convocatories`.
- **B2.** `app/api/progres/route.ts:8-13` no comprueba `hayDb()`; sin `DATABASE_URL` devuelve 500 en vez de 503 como el resto.
- **B3.** `lib/correccio/llm.ts:33` trunca el texto a 6.000 caracteres pero `corregir` admite 8.000: los últimos párrafos no se evalúan sin aviso. Prompt injection: el texto del candidato va dentro del prompt; la salida se renderiza como texto (sin XSS), pero `resum`/`comentari` pueden ser manipulados por el propio texto.
- **B4.** `lib/correccio/regles.ts:28`: la forma propuesta para «et dones compte» es «me n'adono» (persona equivocada).
- **B5.** `lib/motor/repas.ts:17`: grado «Easy» automático con `stability > 10` acelera demasiado los intervalos (`maximum_interval` 180 días) para una app con examen a 3-6 meses; no se usa «Hard». `enable_fuzz` hace el `due` no determinista en tests.
- **B6.** `lib/oral.ts:13-30`: una palabra clave cuenta como pronunciada bien si el ASR la reconoció; los reconocedores normalizan al léxico, así que e/o abiertas, vocal neutra o essa sonora no se discriminan realmente (la app lo avisa en `d.aproximat`, bien). `notaOralDesDePronuncia` da 35-90 %: suelo de 35 % aunque no se entienda nada. Defendible solo como estimación etiquetada; no debería entrar en la probabilidad con la misma σ.
- **B7.** `lib/veu.ts:10,46`: caché de audio en memoria (hasta 500 buffers) por instancia; `cache.clear()` total al llegar a 501. Mejor Vercel Blob/KV con clave SHA.
- **B8.** `lib/estat.ts:22` usa `toISOString().slice(0,7)` (UTC) para el mes de cuotas mientras `ratxa.ts` usa fecha local; `lib/http.ts:32` también UTC. Coherente servidor/cliente, pero la cuota «del mes» cambia a las 01:00/02:00 hora peninsular.
- **B9.** `middleware.ts:6`: `/\bca\b/` también acepta `ca-FR` o `ca` en cualquier posición; la elección ignora el orden/`q`. Menor.
- **B10.** `components/Mapa.tsx:22`: `0.6 * confianca + 40 * retencio` → máximo 100 solo si ambos son 1; tarjetas con `n === 0` quedan en «—» aunque haya tarjetas FSRS del punto.
- **B11.** `app/api/banc/route.ts:16`: `Object.fromEntries(Object.entries(...))` copia innecesaria; `nivell` no validado.
- **B12.** `public/sw.js:3`: precache de `/ca/avui` y fallback a esa página para cualquier navegación fallida (incluida `/es/...`).
- **B13.** README afirma «25 avisos restantes» de LanguageTool; el informe `contenido/revisio/lt-2026-10-28.json` registra 124 avisos (todos bajo excepción) y 0 «segurs». El lote de revisión humana (`lot-2026-10-28.json`) tiene los 50 ítems en `pendent` y `revisor` vacío: **ningún ítem tiene `revisio: huma`**.
- **B14.** `motor/compilar.mjs:37-39`: la elección de la tarea escrita por simulacro usa `barajar` reseeded por `n` e índice `(n-1) % len`: los tres simulacros de C1 comparten `c1-escrit-0003` (hay 4 tareas) y B1-1 y B1-2 comparten `b1-escrit-0003`. → elegir sin reemplazo con una sola semilla por nivel.
- **B15.** `lib/datos.ts` (sin `server-only`) exporta `BANC` completo; hoy solo lo importan server components, pero un import accidental desde un `'use client'` enviaría 864 KB con todas las respuestas al navegador. → añadir `import 'server-only'`.

---

## 5. Contenido (ESQUEMA.md vs banco real)

Script de lectura: `(scratch)/metricas.mjs` sobre `generado/banc.json` (compilado el 28/10/2026).

| Nivel | Ítems | buits | transf. | castell. | lèxic | dictat | gratis | diagnòstic | dificultat (min/máx/media) |
|---|---|---|---|---|---|---|---|---|---|
| B1 | 100 | 35 | 10 | 20 | 25 | 10 | 36 | 40 | −0,6 / 0,8 / 0,03 |
| B2 | 120 | 45 | 15 | 25 | 25 | 10 | 38 | 48 | −0,5 / 0,7 / 0,15 |
| C1 | 172 | 70 | 25 | 35 | 30 | 12 | 53 | 69 | −1,5 / 1,8 / 0,06 |
| **Total** | **392** | 150 | 50 | 80 | 80 | 32 | 127 (32 %) | 157 | revisio: 392 `sessio`, 0 `huma` |

- Todos los ítems son del área `us`; cumplen la forma del esquema (0 duplicados de enunciado, 0 `buits` sin `___`, 0 `opcions` incoherentes, 30 reglas con los 6 idiomas completos, todos los `punt`/`regla` existen).
- **Puntos del mapa con menos de 8 ítems:** B1 9 de 13 (ortografia-accents 5, apostrof-contraccions 4, ser-estar 5, preposicions 6, verbs-irregulars 5, temps-mode 3, perifrasis 6, concordanca 4, determinants 4); B2 12 de 19 (puntuacio **1**, concordanca 3, determinants 3, apostrof 4, ser-estar 4, verbs-irregulars 4, perifrasis 4, per-per-a 5, temps-mode 5, lexic-tematic 6, ortografia-consonants 7, relatius 7); C1 8 de 19 (ser-estar 2, perifrasis 2, concordanca 2, determinants 2, puntuacio 4, apostrof 5, per-per-a 5, ortografia-consonants 6). En el diagnóstico (12 ítems, prioridad a puntos no vistos) 7 puntos de C1 nunca se miden y C1 tiene puntos con un solo ítem diagnóstico (ser-estar, per-per-a, perifrasis, determinants).
- **Dificultad:** B1 y B2 concentradas en [−0,6; 0,8]: el adaptativo apenas discrimina por encima; solo C1 cubre el rango −2…2 del esquema (y no llega a los extremos).
- **Textos:** 22 (B1 lectura 4 + CO 5, B2 lectura 4 + CO 5, C1 lectura 4); todos dentro de los rangos de palabras. **Tareas:** 14 (B1 4 correus, B2 3 text-informatiu + 3 correus, C1 4 argumentatius amb 3 fonts); ESQUEMA menciona `nota`, `carta-formal`, `argumentatiu` sin ningún ejemplar. **Simulacros:** 9, todos `complet: true` (B1 30 ítems + 3 CO + 2 lectura + 1 correu; B2 40 + 3 + 2 + 2 tareas; C1 45 + 1 argumentativo); tres C1 con la misma redacción (B14). **Oral:** 15 sonidos, 14 lecturas (3 por nivel + 5 generales). **SEO:** 30 páginas ca/es.
- **LanguageTool:** 1.349 fragmentos, 124 con avisos, todos bajo excepción documentada, 0 seguros. **Revisión humana:** 0 ítems (lote de 50 pendiente).

### Muestra revisada (15 C1 + 10 B1, semilla 20261030)
Correctos en catalán normativo y con regla bien asignada: 21 de 25 (`c1-transformacio-0014/-0012/-0009/-0005`, `c1-lexic-0009/-0007/-0001`, `c1-buits-0014/-0011/-0037/-0009/-0034/-0063`, `b1-lexic-0001/-0017/-0020/-0011/-0021`, `b1-buits-0019/-0025/-0007`, `b1-castellanismes-0001`). Dudas:
1. **`c1-lexic-0003`** «Abans de comprar l'abric, ___ per veure si et va bé de talla» → única correcta «emprova-te'l». El DIEC2 recoge *provar* amb el sentit d'*emprovar* («prova't aquest vestit»), de modo que «prova-te'l» también es normativo: ítem con dos respuestas válidas.
2. **`c1-lexic-0016`** «La proposta és interessant; ___, no tenim pressupost» → «això no obstant», con «no obstant» como distractor. *No obstant* sol está admitido por el DIEC2/GIEC como connector (preferible «no obstant això» en registre formal): distractor discutible. La propia `regles.ts:48` lo trata como duda (`segur:false`).
3. **`b1-buits-0016`** «La parada de l'autobús 12 ___ davant del CAP» → «és»; y **`b1-castellanismes-0017`** «El lavabo està al fons del passadís» marcado como castellanismo. Es la cuestión ser/estar con localización de cosas que el propio README reconoce como duda normativa: la GIEC admite *estar* en bastantes contextos de localización; penalizarlo como error en B1 es arriesgado. Mejor usar ejemplos inequívocos (acontecimientos: «la reunió és a…»; estados: «està malalt»).
4. **`b2-castellanismes-0013`** y **`c1-castellanismes-0006`** «Degut a la pluja…» como error: la GIEC (2016) acepta la locución *degut a* (recomendando *a causa de* en registro formal); marcarla como castellanismo seguro en el examen es discutible. Mismo problema en `regles.ts:14`.
5. **`b1-buits-0007`** pista «el so fort s'escriu tj»: imprecisa (es el so africat sonor [dʒ] davant de a/o/u), aunque la respuesta «platja» es correcta.
6. **`c1-buits-0063`** «Benvolguda senyora___ Us escrivim» → coma: correcto según Optimot; el uso de dos puntos es frecuente y algún corrector lo aceptaría; sin problema.

---

## 6. Métricas

| Métrica | Valor |
|---|---|
| Ficheros TS/TSX (app + lib + components) | 42 páginas/rutas en `app`, 22 en `lib`, 37 componentes (34 + 3 `ui`) |
| Líneas | 4.047 (app+lib+components) · 728 (motor+scripts) · `lib/i18n.ts` 156 líneas, 364 claves por idioma (paridad ca/es completa) |
| Rutas API | 23 (`auth` 5, pagos 6, contenido/uso 5, correcciones 3, formularios 3, `yo`) |
| Tablas Prisma | 9 (`Usuari`, `Progres`, `Simulacre`, `Correccio`, `Us`, `Alerta`, `Validesa`, `Contacte`, `Ajust`); índices: `Simulacre(nivell, convocatoria, nota)`, `Correccio(data)`, únicos en `email`, `stripeCustomerId`, `Alerta(email,nivell)`. Falta índice en `Correccio(usuariId)`, `Simulacre(usuariId|anonId)`, `Contacte(estat)`, `Us(actualitzat)` para el informe mensual |
| `any` / `as unknown as` | 0 / 7 |
| `catch` silenciados | 37 |
| `dangerouslySetInnerHTML` | 2 (JSON-LD y Markdown propio) |
| Textos fuera de i18n | 34 ternarios + `FormValidesa.tsx`, `validesa/page.tsx`, `lib/motor/narrativa.ts` |
| Tests | 0 unitarios; 1 e2e (`scripts/e2e.mjs`, Playwright global, no en `devDependencies`) |
| Contenido | 392 ítems (B1 100 · B2 120 · C1 172), 22 textos, 14 tareas, 9 simulacros, 30 reglas, 15 sonidos, 14 lecturas, 30 SEO; `banc.json` 864 KB |
| Puntos con < 8 ítems | B1 9/13 · B2 12/19 · C1 8/19 |

---

## 7. Valoración final de madurez (10 líneas)

1. El proyecto es un prototipo funcional muy completo para el tiempo invertido: flujo entero sin registro, pagos, PWA, i18n con paridad total y un pipeline de contenido con validación formal y LanguageTool.
2. La seguridad básica está bien planteada (scrypt, HMAC con `timingSafeEqual`, cookies HttpOnly/SameSite, firma del webhook, precios solo en servidor), pero la **autorización de cuotas y costes es de confianza en el cliente** (C1, C2) y el rate limiting no existe en la práctica (A5).
3. El riesgo económico inmediato está en `/api/tts` y en las exenciones de cuota; el riesgo de negocio, en el pase rejugable (A4).
4. El motor pedagógico tiene decisiones razonables (1PL, FSRS, 40/40/20) pero **la probabilidad de aprobar, el producto estrella, está mal calibrada por construcción** (A2) y el dictado no mide lo que dice medir (A3).
5. La corrección en tres capas es una buena idea, pero las reglas propias generan falsos positivos y se cuentan como seguros (A1), y la nota se presenta como fiable sin LanguageTool (M2): la prueba de validez con 20 candidatos probablemente fallará si no se corrige antes.
6. El contenido es formalmente limpio y de calidad lingüística alta en la muestra (21/25 sin reparos), pero **ningún ítem ha pasado revisión humana**, hay puntos del programa casi vacíos y las dificultades de B1/B2 no permiten un test adaptativo real.
7. Legal: textos bastante completos (encargados, desistimiento, cookies técnicas sin banner), con tres huecos a cerrar antes de cobrar: NIF, borrado de cuenta y baja de alertas; y una referencia obsoleta a la plataforma ODR.
8. Calidad de código: compacto y legible, pero sin pruebas unitarias, con errores silenciados y componentes de una sola línea difíciles de mantener; la configuración se tipa por aserción.
9. Prioridad sugerida: (1) C1, C2, A4, A5 en una tarde; (2) A1, A2, A3, M2 antes de la prueba de validez; (3) M10 antes de `STRIPE_MODO=real`; (4) tests del motor y refactor de componentes después.
10. Madurez global: **beta temprana** apta para la prueba con 20 candidatos en entorno controlado; no apta para cobro real hasta resolver los puntos (1)-(3).
