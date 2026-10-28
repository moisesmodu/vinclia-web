# Proyecto P · Webs de herramientas y datos con AdSense

Fábrica de sitios estáticos de calculadoras y tablas con datos oficiales, en castellano y catalán, monetizados con
publicidad. Cada página resuelve un cálculo o da un dato real, nunca texto de relleno: es lo que exige la política de
Google contra el contenido escalado y lo que los resúmenes de IA no sustituyen.

| | Sitio 1 · NetoClaro | Sitio 2 · ImpuestoClaro | Sitio 3 · ChequeClaro |
|---|---|---|---|
| Tema | Nómina y laboral | Impuestos y autónomos | Cheque de pago, taxes y dinero en EE. UU. |
| Dominio propuesto | netoclaro.es | impuestoclaro.es | chequeclaro.com |
| Calculadoras | 20 (es + ca) | 20 (es + ca) | 17 (es-US, USD) |
| Fichas de datos citables | 10 (es + ca, con CSV) | 10 (es + ca, con CSV) | 4 (con CSV) |
| Páginas programáticas | 73 × 2 idiomas | 46 × 2 idiomas | 122 (15 estados, 78 estado × salario, 29 hora/año) |
| Páginas en total | 218 | 162 | 149 |

En producción (Vercel, sin dominio propio todavía): https://netoclaro.vercel.app/ e https://impuestoclaro.vercel.app/. El estado está en el panel.

## Estructura

```
proyectos/p-webs-adsense/
├── README.md · MARKETING.md · TAREA-PROGRAMADA.md · PARA-MOISES.md
└── fabrica/                        un solo código para todos los sitios
    ├── params/<pais>/pais.json      comunidades, moneda, idiomas
    ├── params/<pais>/<año>/         laboral.json y fiscal.json: cifras legales con su fuente (regla 8)
    ├── sitios/<sitio>/sitio.json    marca, colores, autor, titular, AdSense, Umami, calculadoras, colecciones
    ├── sitios/<sitio>/contenido/    texto de cada calculadora: <id>.es.md y <id>.ca.md
    ├── sitios/<sitio>/programaticas/  CSV que generan páginas (una fila = una página por idioma)
    ├── sitios/<sitio>/datos/        series históricas oficiales (SMI, IPREM, intereses)
    ├── sitios/<sitio>/palabras-clave.csv  mapa SEO de 200 palabras clave
    ├── src/lib/calc/                motores puros: ss, irpf, laboral, fiscal y us (EE. UU.), sin cifras dentro
    ├── src/calculadoras/<id>.ts     definición declarativa de cada calculadora (campos + cálculo)
    ├── src/fichas/<sitio>.ts        fichas de datos citables
    ├── src/plantillas/              plantillas de páginas programáticas
    ├── src/pages/[...ruta].astro    ruta única que genera todas las páginas
    ├── tests/                       186 pruebas de cálculo (vitest)
    └── scripts/                     comprobar, lighthouse, publicar, vista-previa
```

## Cómo funciona una calculadora

1. El motor, en `src/lib/calc`, aplica la norma paso a paso con las cifras de `params/es/<año>`.
2. La definición, en `src/calculadoras/<id>.ts`, declara los campos (número, desplegable, fecha, casilla) y devuelve
   un resultado: cifra destacada, cifras secundarias, desglose, tablas y avisos, siempre en los dos idiomas.
3. En la compilación se calcula el ejemplo con los valores por defecto y se pinta en HTML. Google ve un resultado
   real y la página se pinta sin esperar a JavaScript.
4. En el navegador, `src/lib/cliente.ts` recalcula al escribir. También guarda los datos en la URL para compartir
   el cálculo y permite imprimir o guardar en PDF.

Cada página de calculadora lleva una explicación corta, el método de cálculo publicado, las fuentes oficiales, la
fecha de actualización, el autor, preguntas frecuentes, enlaces internos y los datos estructurados `WebApplication`,
`FAQPage` y `BreadcrumbList`.

## Comandos

```bash
cd proyectos/p-webs-adsense/fabrica
npm ci
npm test                        # 249 pruebas de cálculo
npm run build:todos             # dist/nomina, dist/impuestos y dist/eeuu
npm run comprobar               # contenido completo, enlaces internos, títulos, datos pendientes
node scripts/lighthouse.mjs     # Lighthouse móvil sobre una muestra; falla por debajo de 95
SITIO=nomina npm run dev        # desarrollo
node scripts/vista-previa.mjs nomina   # copia con enlaces relativos para alojar en una subcarpeta
```

## Despliegue: un proyecto por sitio

Sigue `DESPLIEGUES.md` de la raíz. Esta sesión no tenía red ni secretos para desplegar, así que `DESPLIEGUE.md` deja los
pasos exactos a la sesión del Mac. Hay dos caminos:

- **A, recomendado: Cloudflare Pages.** Es gratis y admite uso comercial. Proyectos `netoclaro` e `impuestoclaro`.
  El flujo de GitHub Actions compila y publica los dos sitios en cada push a la rama base cuando existen los secretos
  `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
- **B: Vercel Pro.** Usa `vercel.json`, con Root Directory `proyectos/p-webs-adsense/fabrica`.

| Campo | Valor |
|---|---|
| Build / output | `npm run publicar` / `publicar` |
| Variables | `SITIO` = `nomina` o `impuestos`; `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` para el aviso legal |

Variables opcionales, sin tocar el código:

| Variable | Para qué |
|---|---|
| `ADSENSE_CLIENT` | Identificador `ca-pub-…`. Activa el consentimiento de Google (TCF 2.2), `ads.txt` y los anuncios. Sin él no hay anuncios ni banner. |
| `ADSENSE_SLOT_RESULTADO`, `ADSENSE_SLOT_FINAL` | Bloques de anuncio bajo el resultado y al final del contenido. |
| `UMAMI_ID`, `UMAMI_SRC` | Analítica sin cookies (Umami Cloud gratuito o autoalojado). |
| `GSC_VERIFICACION` | Metaetiqueta de verificación de Search Console, si no se verifica por DNS. |
| `SITE_URL` | URL pública mientras no haya dominio, por ejemplo `https://netoclaro.pages.dev`. |

`vercel.json` (y `public/_headers` en Cloudflare) da caché larga a los recursos con hash. La integración continua, en
`.github/workflows/p-webs-adsense.yml`, ejecuta pruebas, compilación, comprobaciones y Lighthouse en cada PR.

## Añadir cosas

- **Una calculadora:** crea el motor si hace falta, después `src/calculadoras/<id>.ts`, los textos
  `sitios/<sitio>/contenido/<id>.es.md` y `.ca.md` con el formato de `sueldo-neto` y el id en `calculadoras` de
  `sitio.json`. `npm test` la prueba automáticamente en los dos años y los dos idiomas.
- **Páginas programáticas:** añade filas al CSV de `sitios/<sitio>/programaticas/`. Para una colección nueva, añade
  la colección en `sitio.json` (`plantilla`, `csv`, `slug` por idioma y `calc`) y su plantilla en `src/plantillas/`.
  Una plantilla solo es válida si sus tablas cambian de verdad entre filas.
- **Un año:** crea `params/es/<año>/` copiando el anterior, marca `"estado": "provisional"` hasta que salga el BOE y
  cambia `anioPorDefecto`.
- **Un país:** crea `params/<pais>/pais.json` (moneda y `locales`) y `params/<pais>/<año>/`, y el sitio con `"pais": "<pais>"`.
  `astro.config.mjs` pasa al código `PAIS`, `MONEDA` y `LOCALES`: el formato de importes (`eur`/`eur0` = moneda del sitio),
  los parámetros y las calculadoras que viajan al navegador son solo los del país. Añade su glob en `src/lib/params.ts` y
  en `src/lib/cliente.ts`. Ejemplo: EE. UU. (`params/us`, motor `src/lib/calc/us.ts`, calculadoras `src/calculadoras/us-*.ts`).
- **Un sitio de un solo idioma:** `"idiomas": ["es"]` en `sitio.json`; no se generan `/ca/` ni el CSV catalán. Los textos de
  interfaz que citan España (BOE, nómina) se sustituyen con `ui` y `textosDatos` en el `sitio.json` (ver `sitios/eeuu`).
- **Un sitio:** crea `sitios/<id>/sitio.json`, sus contenidos y sus fichas en `src/fichas/<id>.ts`, regístralas en
  `src/lib/rutas.ts` y crea otro proyecto con `SITIO=<id>` (DESPLIEGUE.md).

## Decisiones tomadas

- **Identidad de la familia Claro** (`MARCAS.md`, `marcas/tokens.json`): C abierta con línea de horizonte, apellido
  «Claro» en cada sitio y un verde propio por sitio. NetoClaro usa `#0E9F6E` y ImpuestoClaro `#14A38B` en la marca,
  sobre una cabecera tinta. Para texto, enlaces y la caja del resultado se usa un verde más oscuro de cada sitio, que
  pasa el contraste mínimo (4,5:1): el verde de la familia sobre blanco se queda en 3,4:1. Manrope e Inter van alojadas
  en el propio sitio en vez de cargarse desde Google Fonts: mismo aspecto, sin enviar la IP del visitante a Google y sin
  perder rendimiento (`font-display: optional`, CLS 0). Lleva la promesa «Números claros, sin letra pequeña» y el sello
  «Hecho en Lleida · Números claros», sin «cancela en un clic» porque no hay suscripción.

- **Astro 5 y no Astro 7.** Astro 7 exige Node 22.23 o superior, que no está ni en el contenedor ni en muchos
  entornos de compilación. Astro 5 da el mismo HTML estático.
- **Sin framework de interfaz.** Las calculadoras son HTML con un único script común de 12 KB comprimido, más un
  trozo de unos 1,3 KB por calculadora que solo se descarga en su página. Los parámetros se empaquetan sin notas
  ni fuentes.
- **Consentimiento con la herramienta gratuita de Google** («Privacidad y mensajes», certificada TCF 2.2), no con
  un gestor propio, que exigiría registrarse en IAB por unos 1.400 € al año. Consent Mode v2 arranca en «denegado».
- **AdSense y su consentimiento se cargan tras la primera interacción o a los 3 segundos.** Así no penalizan el
  rendimiento inicial ni el LCP. Los huecos de anuncio reservan 280 px de alto para no mover la página, y no se pintan
  hasta que hay cuenta y bloque.
- **Posición de los anuncios**, según el análisis del líder: bajo el resultado y al final del contenido, nunca
  antes del formulario. El anclado en móvil se activa desde «Anuncios automáticos» de AdSense.
- **Retención en nómina frente a IRPF real.** La retención usa la escala única estatal, que es como la calcula una
  nómina real. La cuota anual usa la escala de cada comunidad. La diferencia, que sale en la renta, es la principal
  ventaja frente a las calculadoras de los bancos.
- **2027 como año por defecto, marcado provisional.** Ya están aplicados el MEI de 2027, la jubilación a los 67 años,
  la escala de pensión de 2027, la solidaridad estimada y las cuotas de sociedades. El SMI, las bases y el IPREM de
  2027 se copian de 2026 hasta que salga el BOE. La página lo avisa.
- **Verifactu:** la fecha legal sigue siendo el 1/1/2027 para sociedades y el 1/7/2027 para el resto. El aplazamiento
  a 2028 está anunciado, pero no publicado, y la página lo explica así.
- **País Vasco y Navarra no se incluyen** porque su IRPF es foral. Se dice en la calculadora.
- **Autor: Moisés Mora**, titular de los dominios, con una página «Quiénes somos y método». Se declara el uso de IA
  en los borradores y que las cifras salen de la normativa y de pruebas automáticas, con revisión por muestreo.
- **Fuentes de los parámetros.** boe.es, seg-social.es y sede.agenciatributaria.gob.es no eran accesibles desde la
  sesión. Las cifras se contrastaron con resúmenes que citan esas normas (mutuas, despachos, sindicatos, AEAT
  citada) y se comprobaron con cálculos cruzados. Por ejemplo, la cuota catalana en 175.000 € coincide con la
  publicada por la AEAT y la retención del SMI coincide con la publicada en prensa. Los valores sin confirmar llevan
  `"verificado": false` en el JSON. La tarea semanal los revisa contra el BOE.
- **Simplificaciones declaradas en cada método:**
  - sin deducciones autonómicas;
  - la cuota de autónomos con la base mínima del tramo;
  - un tipo de interés por año en los recargos;
  - mínimos familiares estatales en la parte autonómica.

## Registro

| Fecha | Qué |
|---|---|
| 28/10/2026 | Fábrica, sitio 1 (20 calculadoras, 10 fichas, 146 páginas programáticas) y sitio 2 (20 calculadoras, 10 fichas, 92 páginas programáticas), en castellano y catalán. |
| 28/10/2026 | Sitio 3, ChequeClaro (EE. UU., es-US, USD): 17 calculadoras, 4 fichas, 122 páginas programáticas, parámetros 2026 (IRS Rev. Proc. 2025-32, SSA, DOL y 15 estados). irs.gov y las webs estatales estaban bloqueadas: cifras contrastadas con fuentes secundarias; las dudosas llevan `verificado: false`. Lighthouse móvil 100 en las 7 páginas de muestra. |

## Fichas de los sitios 3 a 7

Preparadas para la tarea que abre un sitio nuevo cada 6 a 8 semanas (TAREA-PROGRAMADA.md, tarea 2).

Fuente de RPM, volumen, riesgo y mercado: tabla «Catálogo de sitios del proyecto P» de `VIABILIDAD.md` (24/10/2026).
Todos los sitios salen de la misma fábrica (`fabrica/`): `sitio.json`, `contenido/*.md`, `programaticas/*.csv` y `params/<pais>/<anio>/`.
Solo tráfico orgánico. Ningún volumen de búsqueda de esta ficha es medido: la prioridad es de criterio.

Reglas comunes a los cinco sitios:

- **Contenido a escala** (política *scaled content abuse*): una página programática solo se publica si su fila trae un dato propio y verificable (tipo, importe, fecha). Nada de páginas que solo cambian el nombre del municipio.
- **YMYL**: autor con nombre, revisor cuando toque, método de cálculo visible, fuente oficial enlazada y fecha de actualización en cada página.
- **No suplantar**: ni escudos, ni logotipos, ni nombres que parezcan de un organismo (IRS, DGT, SEPE, Catastro). Aviso visible de «sitio independiente».
- **AdSense**: ningún anuncio dentro del formulario ni pegado a un botón. El bloque que va bajo el resultado queda separado y rotulado «Publicidad». Como máximo, un anuncio por pantalla en móvil sobre el pliegue.
- **Caducidad**: cada bloque de `params/<pais>/<año>/` lleva `fuente`, `verificado` y, si toca, `provisional`. Si un año no tiene datos oficiales, la página usa los del último año vigente y lo dice.

---

### Sitio 3 · Finanzas e impuestos de EE. UU. en español

> **Estado (28/10/2026):** construido como **ChequeClaro** en `fabrica/sitios/eeuu` (año fiscal 2026; los parámetros están en `params/us/2026/laboral.json` y `fiscal.json`, no en `federal.json`/`estados.json` como proponía esta ficha). Pendiente: EITC, ITIN, casillas del W-2, Obamacare y fechas de la temporada 2027 (filas «nueva» de `palabras-clave.csv`), y la versión 2027 de los parámetros cuando el IRS publique la Rev. Proc.

#### Público y mercado
- Hispanohablantes residentes en EE. UU. (≈ 60 M). Trabajadores asalariados, por horas, *1099* y familias con hijos.
- Estados prioritarios por población hispana (Census, ACS): TX, CA, FL, NY, IL, AZ, NJ, CO, GA, NC, NV, NM.
- Picos: enero–15 de abril (*tax season*), noviembre–enero (*open enrollment* del seguro médico), enero (nuevos W-4 y salario mínimo).

#### Idiomas
- Español de EE. UU. (`es-US`). Vocabulario real de búsqueda: «taxes», «cheque», «W-2», «reembolso», «aplicar» se aceptan. Moneda USD, formato `1,234.56`.
- Sin versión inglesa al principio: la competencia fuerte está en inglés.

#### RPM y volumen
- RPM 15–40 $. Volumen alto. Competencia en español débil.
- Es el sitio que abre las redes premium: Mediavine (programa Journey desde ≈ 10.000 sesiones/mes; Mediavine completo, 50.000) y Raptive (umbral en páginas vistas, revisar en su web al solicitar). Ambas exigen tráfico mayoritario de EE. UU., que este sitio tiene de origen.

#### Calculadoras y tablas iniciales

| # | Calculadora o tabla | Fuente oficial (organismo · dato) |
|---|---|---|
| 1 | Calculadora de cheque de pago (*paycheck*) por estado | IRS Pub. 15-T (método de porcentaje); departamentos de impuestos estatales (tablas de retención) |
| 2 | Retención federal según el W-4 | IRS Pub. 15-T y formulario W-4 del año |
| 3 | FICA: Seguro Social y Medicare | SSA (tope salarial anual); IRS (0,9 % adicional de Medicare) |
| 4 | Estimador de reembolso de impuestos (*tax refund*) | IRS Rev. Proc. anual de ajustes por inflación (tramos y deducción estándar) |
| 5 | Crédito tributario por hijos (CTC/ACTC) | IRS (importes, umbrales de reducción, parte reembolsable) |
| 6 | Crédito por ingreso del trabajo (EITC) | IRS (tabla EITC por hijos y estado civil) |
| 7 | Impuesto de trabajo por cuenta propia (*self-employment*, 1099) | IRS Schedule SE (92,35 %, 15,3 %) |
| 8 | Subsidio del seguro médico (*premium tax credit*, Obamacare) | HHS (líneas de pobreza, FPL); IRS (porcentaje aplicable); CMS (planes de referencia) |
| 9 | Salario por hora a anual y horas extra (*overtime*) | DOL Wage and Hour Division (FLSA); leyes estatales de horas extra (CA diaria) |
| 10 | Tabla de salario mínimo por estado | DOL WHD (tabla estatal) y departamentos de trabajo estatales |
| 11 | ¿Necesito ITIN? y fechas de presentación del W-7 | IRS (formulario W-7, agentes certificadores, plazos) |
| 12 | Leer tu W-2 casilla por casilla y comprobar lo retenido | IRS (instrucciones del W-2 y W-3) |

#### Páginas programáticas posibles
- `programaticas/estados.csv`: 51 filas (50 estados + DC). Plantilla «cheque de pago en {estado}».
- `programaticas/salario-estado.csv`: 51 estados × 12 salarios (30.000–120.000 $) = 612 filas. Publicar solo los 12 estados prioritarios al principio (144 filas).
- `programaticas/salario-hora-estado.csv`: 12 estados × 10 tarifas (12–40 $/h) = 120 filas.
- `programaticas/fpl-hogar.csv`: tamaños de hogar 1–8 × 3 tramos de ingreso = 24 filas para «¿califico para Obamacare con X $?».
- `programaticas/eitc-hijos.csv`: 4 filas (0–3 hijos) × 2 estados civiles = 8 filas.

#### Arquitectura de parámetros
```
params/us/pais.json                  moneda USD, locale es-US, formatos
params/us/2027/federal.json          tramos por estado civil, deducción estándar,
                                     FICA (6,2 %, tope SSA; 1,45 % + 0,9 % > 200.000 $),
                                     tablas Pub. 15-T, CTC, EITC, límites 401(k)/HSA,
                                     FPL de HHS, porcentaje aplicable ACA
params/us/2027/estados.json          por estado (clave AL…WY, DC):
                                       tipo: none | flat | progresivo
                                       tramos y deducción estándar estatal
                                       exención personal y por dependiente
                                       SDI / PFML: tasa y tope (CA, NJ, NY, RI, HI, WA, MA, CO, OR, CT…)
                                       salario_minimo y salario_minimo_propinas
                                       impuestos_locales (NYC, Yonkers, Ohio, Pensilvania EIT, Maryland condado)
                                       reciprocidad entre estados
params/us/2026/...                   misma estructura para comparar y para la temporada de impuestos 2026
```
- Estados sin impuesto sobre el salario: AK, FL, NV, NH, SD, TN, TX, WA, WY. Se marcan `tipo: none`.
- Cada estado guarda `fuente` (URL del departamento estatal) y `vigente_desde`.

#### Riesgos de políticas de Google y cómo cumplirlos
- **Suplantación del IRS**: nada de «IRS» en el dominio ni logotipos federales. Aviso: «No somos el IRS ni una agencia del gobierno».
- **ITIN y trámites**: no vender ni intermediar la solicitud; enlazar a IRS.gov y a agentes certificadores. Evita la categoría de «servicios gubernamentales engañosos».
- **Inmigración**: no dar asesoría migratoria. Solo datos fiscales.
- **YMYL**: revisor con credencial (EA o CPA) en las páginas de créditos y seguro médico.
- **Contenido a escala**: las 612 páginas por estado y salario solo si muestran retención estatal, SDI y neto distintos.

#### Monetización
- AdSense desde el día 1. Solicitar Mediavine Journey al pasar ≈ 10.000 sesiones/mes; Raptive cuando llegue a su umbral.
- Afiliación prudente después: software de impuestos con versión en español y comparadores de seguro médico con licencia.

#### 30 primeras palabras clave

| # | Palabra clave | Idioma | Intención | Página destino propuesta |
|---|---|---|---|---|
| 1 | calculadora de cheque de pago Texas | es-US | calcular | /cheque-de-pago-texas/ |
| 2 | calculadora de cheque de pago California | es-US | calcular | /cheque-de-pago-california/ |
| 3 | calculadora de cheque de pago Florida | es-US | calcular | /cheque-de-pago-florida/ |
| 4 | cuánto me descuentan de taxes en mi cheque | es-US | calcular | /calculadora-cheque-de-pago/ |
| 5 | calculadora de salario neto por hora | es-US | calcular | /calculadora-salario-por-hora/ |
| 6 | cuánto es 20 dólares la hora al año | es-US | calcular | /20-dolares-la-hora-al-ano/ |
| 7 | 50000 al año cuánto es por hora | es-US | calcular | /50000-al-ano-por-hora/ |
| 8 | calculadora de taxes 2026 reembolso | es-US | calcular | /calculadora-reembolso-taxes/ |
| 9 | cuánto me van a regresar en los taxes con 2 hijos | es-US | calcular | /calculadora-reembolso-taxes/ |
| 10 | calculadora crédito por hijos 2026 | es-US | calcular | /calculadora-credito-por-hijos/ |
| 11 | califico para el crédito EITC | es-US | comprobar | /calculadora-eitc/ |
| 12 | tabla EITC 2026 | es-US | tabla | /tabla-eitc/ |
| 13 | cómo sacar el ITIN | es-US | comprobar | /necesito-itin/ |
| 14 | fecha límite para declarar taxes 2027 | es-US | plazo | /fechas-taxes-2027/ |
| 15 | cuándo llega el reembolso de taxes | es-US | plazo | /cuando-llega-reembolso-taxes/ |
| 16 | cómo llenar el W-4 para que me quiten menos | es-US | calcular | /calculadora-w4/ |
| 17 | qué significa cada casilla del W-2 | es-US | comprobar | /casillas-w2/ |
| 18 | cuánto paga un 1099 de impuestos | es-US | calcular | /calculadora-impuestos-1099/ |
| 19 | calculadora self employment tax | es-US | calcular | /calculadora-impuestos-1099/ |
| 20 | califico para Obamacare con mis ingresos | es-US | comprobar | /calculadora-subsidio-obamacare/ |
| 21 | límite de ingresos para Obamacare 2027 | es-US | tabla | /tabla-ingresos-obamacare/ |
| 22 | salario mínimo por estado 2027 | es-US | tabla | /salario-minimo-por-estado/ |
| 23 | salario mínimo en California 2027 | es-US | tabla | /salario-minimo-california/ |
| 24 | calculadora de overtime | es-US | calcular | /calculadora-overtime/ |
| 25 | cuánto descuentan de Social Security y Medicare | es-US | calcular | /calculadora-fica/ |
| 26 | cuánto me quitan de taxes en Nueva York | es-US | calcular | /cheque-de-pago-nueva-york/ |
| 27 | cheque de pago Illinois cuánto me queda | es-US | calcular | /cheque-de-pago-illinois/ |
| 28 | taxes en Texas no hay impuesto estatal cuánto me descuentan | es-US | comprobar | /cheque-de-pago-texas/ |
| 29 | tramos de impuestos federales 2027 | es-US | tabla | /tramos-impuestos-federales/ |
| 30 | cuánto me queda de 60000 al año en Florida | es-US | calcular | /cheque-de-pago-florida-60000/ |

---

### Sitio 4 · Vivienda e hipoteca (España)

#### Público y mercado
- Compradores de vivienda, inquilinos, propietarios que venden o alquilan. España, con foco en Cataluña, Madrid, Comunitat Valenciana y Andalucía.
- Picos: enero (Euríbor nuevo y cambios de ITP), primavera (compraventas), al publicar el índice de alquiler.

#### Idiomas
- Castellano y catalán (`es`/`ca`), igual que los sitios 1 y 2.

#### RPM y volumen
- RPM 6–12 €. Volumen alto. Las cabeceras («simulador hipoteca») son de bancos; la entrada es por comunidad y municipio.

#### Calculadoras y tablas iniciales

| # | Calculadora o tabla | Fuente oficial (organismo · dato) |
|---|---|---|
| 1 | Simulador de cuota de hipoteca (fija, variable, mixta) | Banco de España (Euríbor y tipos oficiales de referencia, mensual) |
| 2 | Revisión de hipoteca variable con el Euríbor del mes | Banco de España / BCE (Euríbor 12 meses) |
| 3 | Gastos de compraventa: ITP o IVA + AJD por comunidad | Leyes de tributos cedidos de cada comunidad (BOE y boletines autonómicos) |
| 4 | Tabla ITP y AJD 2027 por comunidad | Ídem, con tipos reducidos (jóvenes, familia numerosa, VPO) |
| 5 | Notaría y registro de la compraventa | Aranceles: RD 1426/1989 (notarios) y RD 1427/1989 (registradores) |
| 6 | Plusvalía municipal (método objetivo y real) | TRLRHL art. 107 (coeficientes anuales por LPGE/RDL); ordenanzas fiscales municipales (tipo) |
| 7 | IBI por municipio | Dirección General del Catastro (tipos de gravamen de IBI por municipio, anual) |
| 8 | Índice de referencia del alquiler | MIVAU (Sistema Estatal de Referencia del Precio del Alquiler); Agència de l'Habitatge de Catalunya (índex de referència) |
| 9 | Subida del alquiler permitida (índice IRAV) | INE (índice de referencia de arrendamientos de vivienda, mensual) |
| 10 | Cuánta hipoteca puedo pedir según sueldo | Banco de España (recomendación de esfuerzo); Ley 5/2019 (información precontractual) |
| 11 | Comisión por amortización anticipada | Ley 5/2019 de crédito inmobiliario (límites por tipo de hipoteca) |
| 12 | Ganancia patrimonial por venta de vivienda (enlace al sitio 2) | AEAT (tramos del ahorro) |

#### Páginas programáticas posibles
- `programaticas/comunidades.csv`: 19 filas (ITP y AJD por comunidad, ya existe en la fábrica).
- `programaticas/plusvalia-municipios.csv`: municipios de más de 20.000 habitantes con ordenanza publicada ≈ 400 filas (INE padrón + tipo de la ordenanza).
- `programaticas/ibi-municipios.csv`: ≈ 400 filas (tipo de Catastro por municipio).
- `programaticas/alquiler-municipios-cat.csv`: municipios catalanes de zona tensionada ≈ 270 filas (índex de referència).
- `programaticas/hipoteca-importe.csv`: 12 importes (100.000–400.000 €) × 3 plazos = 36 filas «cuota de hipoteca de X € a Y años».

#### Parámetros que hay que crear
```
params/es/2027/vivienda.json   ITP y AJD por comunidad (general y reducidos),
                               coeficientes de plusvalía por años, aranceles notariales
                               y registrales, límites de comisión Ley 5/2019
params/es/2027/euribor.json    serie mensual del Euríbor (Banco de España)
sitios/vivienda/datos/plusvalia-tipos-2027.csv, ibi-tipos-2027.csv, irav-mensual.csv
```

#### Riesgos de políticas de Google y cómo cumplirlos
- **YMYL financiero**: el simulador da cifras orientativas; aviso de que la oferta vinculante la da la entidad (FEIN).
- **No suplantar** bancos ni el Catastro.
- **Contenido a escala**: una página de municipio solo si tiene su tipo de ordenanza o de IBI del año.
- **Datos caducados**: el Euríbor se actualiza cada mes con un script; si falta, la página dice «último dato: mes X».

#### Monetización
- AdSense (anuncios de banca y seguros pagan bien). Después, afiliación a comparadores de hipotecas o tasadoras, marcada como publicidad.

#### 30 primeras palabras clave

| # | Palabra clave | Idioma | Intención | Página destino propuesta |
|---|---|---|---|---|
| 1 | simulador hipoteca Euríbor 2027 | es | calcular | /simulador-hipoteca/ |
| 2 | calcular cuota hipoteca 200000 euros 30 años | es | calcular | /hipoteca-200000-euros-30-anos/ |
| 3 | cuota hipoteca 150000 a 25 años | es | calcular | /hipoteca-150000-euros-25-anos/ |
| 4 | revisión hipoteca Euríbor enero 2027 | es | calcular | /revision-hipoteca-euribor/ |
| 5 | cuánta hipoteca puedo pedir con mi sueldo | es | calcular | /cuanta-hipoteca-puedo-pedir/ |
| 6 | gastos de compraventa de vivienda calcular | es | calcular | /calculadora-gastos-compraventa/ |
| 7 | ITP Madrid 2027 calcular | es | calcular | /itp-madrid/ |
| 8 | ITP Andalucía vivienda usada | es | calcular | /itp-andalucia/ |
| 9 | ITP Comunidad Valenciana 2027 | es | calcular | /itp-comunidad-valenciana/ |
| 10 | tabla ITP por comunidades 2027 | es | tabla | /datos/itp-por-comunidad/ |
| 11 | AJD hipoteca y obra nueva por comunidad | es | tabla | /datos/ajd-por-comunidad/ |
| 12 | calculadora plusvalía municipal | es | calcular | /calculadora-plusvalia-municipal/ |
| 13 | plusvalía municipal Madrid calcular | es | calcular | /plusvalia-madrid/ |
| 14 | coeficientes plusvalía 2027 | es | tabla | /datos/coeficientes-plusvalia/ |
| 15 | gastos de notaría y registro compra piso | es | calcular | /calculadora-notaria-registro/ |
| 16 | calcular IBI de mi piso | es | calcular | /calculadora-ibi/ |
| 17 | índice de referencia del alquiler calcular | es | calcular | /indice-referencia-alquiler/ |
| 18 | subida del alquiler 2027 IRAV calcular | es | calcular | /calculadora-subida-alquiler/ |
| 19 | comisión amortización anticipada calcular | es | calcular | /calculadora-amortizacion-anticipada/ |
| 20 | amortizar hipoteca reducir cuota o plazo | es | comparar | /amortizar-cuota-o-plazo/ |
| 21 | hipoteca fija o variable qué me sale mejor | es | comparar | /hipoteca-fija-o-variable/ |
| 22 | simulador hipoteca 2027 | ca | calcular | /ca/simulador-hipoteca/ |
| 23 | calcular quota hipoteca | ca | calcular | /ca/simulador-hipoteca/ |
| 24 | ITP Catalunya 2027 habitatge | ca | calcular | /ca/itp-catalunya/ |
| 25 | despeses de compravenda pis Catalunya | ca | calcular | /ca/calculadora-despeses-compravenda/ |
| 26 | calculadora plusvàlua municipal Barcelona | ca | calcular | /ca/plusvalua-barcelona/ |
| 27 | índex de referència de preus de lloguer | ca | calcular | /ca/index-referencia-lloguer/ |
| 28 | preu màxim lloguer zona tensionada | ca | comprobar | /ca/index-referencia-lloguer/ |
| 29 | pujada del lloguer 2027 IRAV | ca | calcular | /ca/calculadora-pujada-lloguer/ |
| 30 | quanta hipoteca puc demanar amb el meu sou | ca | calcular | /ca/quanta-hipoteca-puc-demanar/ |

---

### Sitio 5 · Calendario y fechas

#### Público y mercado
- Toda España, con ventaja clara en Cataluña: casi sin competencia en catalán.
- Trabajadores, familias con hijos en edad escolar, gestorías, ayuntamientos que enlazan.
- Picos: octubre–enero (calendario del año siguiente), junio–septiembre (calendario escolar), puentes.

#### Idiomas
- Castellano y catalán (`es`/`ca`).

#### RPM y volumen
- RPM 1–3 €. Volumen masivo; entra en Discover. RPM bajo compensado por volumen y enlaces de ayuntamientos.

#### Calculadoras y tablas iniciales

| # | Calculadora o tabla | Fuente oficial (organismo · dato) |
|---|---|---|
| 1 | Festivos nacionales y autonómicos del año | BOE (resolución anual de la Dirección General de Trabajo) |
| 2 | Festivos locales por municipio | Boletines autonómicos (DOGC, BOCM, DOGV, BOJA…) con las dos fiestas locales de cada municipio |
| 3 | Calendario laboral por provincia | BOE + boletines autonómicos y provinciales |
| 4 | Calendario escolar por comunidad | Consejerías y Departament d'Educació (resolución anual) |
| 5 | Días entre dos fechas | Cálculo puro (sin dato externo) |
| 6 | Días hábiles para plazos administrativos | Ley 39/2015 art. 30 (sábados inhábiles) + festivos del BOE y autonómicos |
| 7 | Días laborables del año por comunidad | BOE + boletines autonómicos |
| 8 | Puentes del año por comunidad | Derivado de los festivos oficiales |
| 9 | Sumar o restar días, semanas o meses a una fecha | Cálculo puro |
| 10 | Cambio de hora 2027 | BOE (orden del calendario de cambio de hora) |
| 11 | Semana del año (número de semana ISO) | Norma ISO 8601 |
| 12 | Edad exacta y días vividos | Cálculo puro |

#### Páginas programáticas posibles
- `programaticas/festivos-municipios.csv`: municipios de más de 10.000 habitantes ≈ 750 filas; Cataluña completa (947 municipios, todos en el DOGC). Total inicial ≈ 1.600 filas.
- `programaticas/provincias.csv`: 52 filas (calendario laboral por provincia).
- `programaticas/comunidades.csv`: 19 filas (calendario escolar y festivos autonómicos).
- `programaticas/anios.csv`: año en curso y siguiente (2 filas por plantilla).

#### Parámetros que hay que crear
```
params/es/2027/calendario.json   festivos nacionales y autonómicos, fechas de cambio de hora
sitios/calendario/datos/festivos-locales-2027.csv   municipio, código INE, fecha1, fecha2, boletín, URL
sitios/calendario/datos/calendario-escolar-2027-2028.csv   comunidad, inicio y fin por etapa, vacaciones
```

#### Riesgos de políticas de Google y cómo cumplirlos
- **Contenido a escala**: cada página de municipio lleva sus dos fiestas locales con enlace al boletín. Sin dato oficial, no se publica.
- **Datos erróneos**: un festivo mal puesto hace perder la confianza. Validación cruzada con el boletín y fecha de comprobación visible.
- **Discover**: imágenes propias y titulares sin cebo.

#### Monetización
- AdSense con más formatos por página (las páginas son largas). Volumen alto compensa el RPM bajo.
- Enlaces internos hacia los sitios 1 y 2 (paga extra, calendario fiscal), que pagan más.

#### 30 primeras palabras clave

| # | Palabra clave | Idioma | Intención | Página destino propuesta |
|---|---|---|---|---|
| 1 | calendario laboral 2027 | es | tabla | /calendario-laboral-2027/ |
| 2 | festivos 2027 España | es | tabla | /festivos-2027/ |
| 3 | calendario laboral 2027 Madrid | es | tabla | /calendario-laboral-2027-madrid/ |
| 4 | festivos Madrid 2027 | es | tabla | /festivos-2027-madrid/ |
| 5 | calendario laboral 2027 Valencia | es | tabla | /calendario-laboral-2027-valencia/ |
| 6 | festivos locales 2027 Sevilla | es | tabla | /festivos-2027-sevilla/ |
| 7 | puentes 2027 | es | tabla | /puentes-2027/ |
| 8 | calendario escolar 2027-2028 Madrid | es | tabla | /calendario-escolar-2027-2028-madrid/ |
| 9 | calendario escolar 2026-2027 Andalucía | es | tabla | /calendario-escolar-2026-2027-andalucia/ |
| 10 | días entre dos fechas | es | calcular | /dias-entre-fechas/ |
| 11 | calcular días hábiles plazo administrativo | es | calcular | /calculadora-dias-habiles/ |
| 12 | cuántos días laborables tiene 2027 | es | calcular | /dias-laborables-2027/ |
| 13 | sumar días a una fecha | es | calcular | /sumar-dias-fecha/ |
| 14 | cambio de hora octubre 2027 | es | plazo | /cambio-de-hora-2027/ |
| 15 | en qué semana del año estamos | es | calcular | /numero-de-semana/ |
| 16 | calendario laboral 2027 Zaragoza | es | tabla | /calendario-laboral-2027-zaragoza/ |
| 17 | festivos 2027 Málaga | es | tabla | /festivos-2027-malaga/ |
| 18 | cuántos días faltan para Navidad | es | calcular | /dias-para-navidad/ |
| 19 | calendari laboral 2027 Catalunya | ca | tabla | /ca/calendari-laboral-2027-catalunya/ |
| 20 | festius 2027 Barcelona | ca | tabla | /ca/festius-2027-barcelona/ |
| 21 | festius locals 2027 Girona | ca | tabla | /ca/festius-2027-girona/ |
| 22 | festius locals 2027 Lleida | ca | tabla | /ca/festius-2027-lleida/ |
| 23 | festius 2027 Tarragona | ca | tabla | /ca/festius-2027-tarragona/ |
| 24 | festius locals 2027 Sabadell | ca | tabla | /ca/festius-2027-sabadell/ |
| 25 | calendari escolar 2027-2028 Catalunya | ca | tabla | /ca/calendari-escolar-2027-2028/ |
| 26 | ponts 2027 Catalunya | ca | tabla | /ca/ponts-2027/ |
| 27 | dies entre dues dates | ca | calcular | /ca/dies-entre-dates/ |
| 28 | calcular dies hàbils termini | ca | calcular | /ca/calculadora-dies-habils/ |
| 29 | festius 2027 Illes Balears | ca | tabla | /ca/festius-2027-illes-balears/ |
| 30 | calendari laboral 2027 València | ca | tabla | /ca/calendari-laboral-2027-valencia/ |

---

### Sitio 6 · Coche y seguros

#### Público y mercado
- Conductores en España: compra y venta de coche usado, impuesto de circulación, ITV, multas.
- Picos: enero–abril (padrón del IVTM según municipio), verano (viajes y carburante), fin de año (compra de coche).

#### Idiomas
- Castellano. Catalán solo en las páginas de municipios catalanes en una segunda fase (el catálogo marca mercado «España»).

#### RPM y volumen
- RPM 5–10 €. Volumen medio-alto. Aseguradoras pujan fuerte; los datos por municipio son el diferencial.

#### Calculadoras y tablas iniciales

| # | Calculadora o tabla | Fuente oficial (organismo · dato) |
|---|---|---|
| 1 | Impuesto de circulación (IVTM) por municipio | TRLRHL art. 95 (cuota mínima por caballos fiscales); ordenanzas fiscales municipales (coeficiente) |
| 2 | Caballos fiscales del coche | RD 2822/1998 (Reglamento General de Vehículos, fórmula CVF) |
| 3 | ITP de coche usado (cambio de nombre) | Orden HFP anual de precios medios de venta (BOE) + tabla de depreciación; tipo por comunidad |
| 4 | Coste total del cambio de titularidad | DGT (tasa 1.5 de la LPGE) + ITP autonómico |
| 5 | Cuándo me toca la ITV | RD 920/2017 (frecuencias por tipo y antigüedad) |
| 6 | Precio de la ITV por comunidad | Tarifas publicadas por las comunidades con precio regulado |
| 7 | Impuesto de matriculación por CO₂ | Ley 38/1992 art. 70 (tramos de CO₂ WLTP); tipos autonómicos |
| 8 | Etiqueta ambiental y acceso a ZBE | DGT (clasificación por emisiones); ordenanzas de ZBE municipales |
| 9 | Multas y puntos por infracción | RDL 6/2015 (Ley de Tráfico, cuadro de sanciones y anexo II de puntos) |
| 10 | Coste de combustible de un viaje | MITECO (precios de carburantes por estación, diario) |
| 11 | Coste por kilómetro de tener un coche | MITECO (carburante) + IVTM + ITV oficiales |
| 12 | Valor venal del coche para el seguro | Orden HFP de precios medios (BOE) |

#### Páginas programáticas posibles
- `programaticas/ivtm-municipios.csv`: municipios de más de 20.000 habitantes con ordenanza ≈ 400 filas.
- `programaticas/comunidades.csv`: 19 filas (ITP de vehículos, precio de ITV).
- `programaticas/precios-medios.csv`: modelos más vendidos de la Orden HFP ≈ 300 filas «cambio de nombre de un {modelo} de {año}».
- `programaticas/caballos-municipio.csv`: 5 tramos de CVF × 50 capitales = 250 filas.

#### Parámetros que hay que crear
```
params/es/2027/vehiculos.json   cuotas mínimas IVTM, tasas DGT, tipos ITP vehículos por comunidad,
                                tramos de matriculación, frecuencias ITV, tabla de depreciación
sitios/coche/datos/ivtm-coeficientes-2027.csv   municipio, código INE, coeficiente por tramo, ordenanza
sitios/coche/datos/precios-medios-2027.csv      marca, modelo, años, valor (Orden HFP)
```

#### Riesgos de políticas de Google y cómo cumplirlos
- **Suplantación de la DGT**: nada de colores ni logotipo de la DGT; no ofrecer «trámites DGT» de pago.
- **Seguros**: no prometer precios de pólizas. Si hay afiliación, se marca como publicidad.
- **Contenido a escala**: una página de municipio solo con su coeficiente de ordenanza del año.

#### Monetización
- AdSense (anuncios de seguros pagan bien). Después, afiliación a comparadores de seguros con licencia de mediador.

#### 30 primeras palabras clave

| # | Palabra clave | Idioma | Intención | Página destino propuesta |
|---|---|---|---|---|
| 1 | calcular impuesto de circulación | es | calcular | /calculadora-impuesto-circulacion/ |
| 2 | impuesto de circulación Madrid 2027 | es | calcular | /impuesto-circulacion-madrid/ |
| 3 | impuesto de circulación Barcelona | es | calcular | /impuesto-circulacion-barcelona/ |
| 4 | impuesto de circulación Valencia 2027 | es | calcular | /impuesto-circulacion-valencia/ |
| 5 | impuesto de circulación Sevilla | es | calcular | /impuesto-circulacion-sevilla/ |
| 6 | cuánto pago de impuesto de circulación por caballos | es | tabla | /datos/ivtm-por-caballos/ |
| 7 | calcular caballos fiscales coche | es | calcular | /calculadora-caballos-fiscales/ |
| 8 | cuánto cuesta el cambio de nombre de un coche | es | calcular | /calculadora-cambio-de-nombre/ |
| 9 | calcular ITP coche usado | es | calcular | /calculadora-itp-coche/ |
| 10 | ITP coche usado Madrid | es | calcular | /itp-coche-madrid/ |
| 11 | ITP coche usado Cataluña | es | calcular | /itp-coche-cataluna/ |
| 12 | tabla precios medios Hacienda coches 2027 | es | tabla | /datos/precios-medios-hacienda/ |
| 13 | cuándo me toca pasar la ITV | es | plazo | /cuando-pasar-itv/ |
| 14 | ITV coche de 10 años cada cuánto | es | plazo | /cuando-pasar-itv/ |
| 15 | precio ITV Andalucía 2027 | es | tabla | /precio-itv-andalucia/ |
| 16 | precio ITV Cataluña | es | tabla | /precio-itv-cataluna/ |
| 17 | calcular impuesto de matriculación | es | calcular | /calculadora-impuesto-matriculacion/ |
| 18 | qué etiqueta DGT tiene mi coche | es | comprobar | /etiqueta-ambiental/ |
| 19 | puedo entrar en la ZBE de Madrid con mi coche | es | comprobar | /zbe-madrid/ |
| 20 | multa por exceso de velocidad cuánto y cuántos puntos | es | tabla | /multas-velocidad/ |
| 21 | cuadro de multas y puntos 2027 | es | tabla | /datos/multas-y-puntos/ |
| 22 | calcular gasolina de un viaje | es | calcular | /calculadora-coste-viaje/ |
| 23 | cuánto cuesta mantener un coche al año | es | calcular | /calculadora-coste-coche/ |
| 24 | valor venal de mi coche | es | calcular | /calculadora-valor-venal/ |
| 25 | impuesto de circulación coche eléctrico bonificación | es | calcular | /impuesto-circulacion-electrico/ |
| 26 | cambio de nombre moto precio | es | calcular | /calculadora-cambio-de-nombre-moto/ |
| 27 | plazo para pagar impuesto de circulación 2027 | es | plazo | /plazo-impuesto-circulacion/ |
| 28 | impuesto de circulación Zaragoza 2027 | es | calcular | /impuesto-circulacion-zaragoza/ |
| 29 | impuesto de circulación Málaga | es | calcular | /impuesto-circulacion-malaga/ |
| 30 | tasa DGT cambio de titularidad 2027 | es | tabla | /datos/tasas-dgt/ |

---

### Sitio 7 · Salud cotidiana y bebé

#### Público y mercado
- Embarazadas, madres y padres de bebés y niños pequeños. España y Latinoamérica (español neutro).
- Sin estacionalidad fuerte; volumen constante.

#### Idiomas
- Español neutro. Catalán solo en una segunda fase para España (calendario vacunal catalán).

#### RPM y volumen
- RPM 2,5–7 €. Volumen muy alto. Tema sensible: solo calculadoras con fuente oficial y revisor.

#### Calculadoras y tablas iniciales

| # | Calculadora o tabla | Fuente oficial (organismo · dato) |
|---|---|---|
| 1 | Fecha probable de parto | SEGO (regla de Naegele, guía de asistencia) |
| 2 | Semanas de embarazo por fecha | SEGO / OMS (cálculo por FUR) |
| 3 | Calculadora de ovulación y días fértiles | OMS (ciclo menstrual; solo orientativa) |
| 4 | Percentiles de peso y talla 0–5 años | OMS (Child Growth Standards, tablas LMS) |
| 5 | Percentil de perímetro craneal | OMS (Child Growth Standards) |
| 6 | IMC infantil 5–19 años | OMS (Growth Reference 2007) |
| 7 | IMC adulto | OMS (clasificación del IMC) |
| 8 | Dosis pediátrica de paracetamol por peso | AEMPS-CIMA (ficha técnica, mg/kg) + revisor pediatra |
| 9 | Dosis pediátrica de ibuprofeno por peso | AEMPS-CIMA (ficha técnica, mg/kg) + revisor pediatra |
| 10 | Calendario de vacunas por edad | Consejo Interterritorial del SNS (calendario común) y calendarios autonómicos |
| 11 | Aumento de peso recomendado en el embarazo | IOM/NAM (rangos por IMC previo), citados por la SEGO |
| 12 | Edad corregida del prematuro | AEP (Asociación Española de Pediatría) |

#### Páginas programáticas posibles
- `programaticas/semanas-embarazo.csv`: 40 filas («semana {n} de embarazo»: tamaño, hitos según SEGO).
- `programaticas/percentiles-edad.csv`: 0–60 meses × 2 sexos = 122 filas (P3–P97 de la OMS).
- `programaticas/dosis-peso.csv`: 2 fármacos × 3 presentaciones × 15 pesos (4–40 kg) = 90 filas. Solo con revisor firmante.
- `programaticas/vacunas-comunidad.csv`: 19 filas (calendario de cada comunidad).

#### Parámetros que hay que crear
```
params/int/oms/crecimiento-lms.csv      tablas LMS de la OMS (no cambian por año)
params/es/2027/salud.json               calendario vacunal común y diferencias autonómicas
params/es/2027/medicamentos.json        dosis mg/kg, máximos diarios, presentación (de CIMA), revisor y fecha
```

#### Riesgos de políticas de Google y cómo cumplirlos
- **YMYL médico**: revisor sanitario colegiado con nombre, número de colegiado y fecha de revisión en cada página de dosis y percentiles.
- **No diagnosticar**: aviso «no sustituye la consulta con tu pediatra»; en dosis, enlace a la ficha técnica y botón «llama al 112 o a Toxicología» si se supera el máximo.
- **Contenido para niños**: el sitio es para adultos; no se marca como dirigido a menores (sin COPPA ni anuncios para niños).
- **Sin dato oficial, no se publica**: nada de remedios caseros ni recomendaciones sin fuente.

#### Monetización
- AdSense con categorías sensibles bloqueadas. Más tarde, red premium (Mediavine tiene buena demanda en familia y bebé, si el tráfico latinoamericano y de EE. UU. lo permite).
- Sin afiliación a productos sanitarios.

#### 30 primeras palabras clave

| # | Palabra clave | Idioma | Intención | Página destino propuesta |
|---|---|---|---|---|
| 1 | calculadora fecha probable de parto | es | calcular | /calculadora-fecha-parto/ |
| 2 | de cuántas semanas estoy embarazada | es | calcular | /calculadora-semanas-embarazo/ |
| 3 | calculadora de semanas de embarazo | es | calcular | /calculadora-semanas-embarazo/ |
| 4 | cuántos meses son 28 semanas de embarazo | es | calcular | /semana-28-embarazo/ |
| 5 | semana 20 de embarazo | es | tabla | /semana-20-embarazo/ |
| 6 | calculadora de ovulación | es | calcular | /calculadora-ovulacion/ |
| 7 | días fértiles calcular | es | calcular | /calculadora-ovulacion/ |
| 8 | percentil peso bebé OMS | es | calcular | /percentil-peso-bebe/ |
| 9 | percentil talla bebé niña | es | calcular | /percentil-talla-bebe/ |
| 10 | tabla percentiles OMS niños | es | tabla | /tabla-percentiles-oms/ |
| 11 | peso bebé 6 meses percentil | es | tabla | /percentil-bebe-6-meses/ |
| 12 | percentil perímetro craneal | es | calcular | /percentil-perimetro-craneal/ |
| 13 | calcular IMC niños | es | calcular | /calculadora-imc-infantil/ |
| 14 | calculadora IMC | es | calcular | /calculadora-imc/ |
| 15 | dosis paracetamol niños por peso | es | calcular | /dosis-paracetamol-ninos/ |
| 16 | dosis ibuprofeno niños por peso | es | calcular | /dosis-ibuprofeno-ninos/ |
| 17 | cuántos ml de Apiretal según peso | es | calcular | /dosis-paracetamol-ninos/ |
| 18 | dosis Dalsy 2% por kilo | es | calcular | /dosis-ibuprofeno-ninos/ |
| 19 | calendario de vacunas 2027 | es | tabla | /calendario-vacunas/ |
| 20 | vacunas a los 2 meses | es | tabla | /vacunas-2-meses/ |
| 21 | cuánto peso debo ganar en el embarazo | es | calcular | /calculadora-peso-embarazo/ |
| 22 | edad corregida bebé prematuro calcular | es | calcular | /calculadora-edad-corregida/ |
| 23 | semana 12 de embarazo | es | tabla | /semana-12-embarazo/ |
| 24 | fecha de concepción calcular | es | calcular | /calculadora-fecha-concepcion/ |
| 25 | cuánto debe pesar un bebé de 3 meses | es | tabla | /percentil-bebe-3-meses/ |
| 26 | calendario vacunal Cataluña 2027 | es | tabla | /calendario-vacunas-cataluna/ |
| 27 | calendario vacunal Madrid | es | tabla | /calendario-vacunas-madrid/ |
| 28 | cuántas semanas son 7 meses de embarazo | es | calcular | /calculadora-semanas-embarazo/ |
| 29 | percentil peso niño 2 años | es | tabla | /percentil-nino-2-anos/ |
| 30 | talla niño 4 años percentil OMS | es | tabla | /percentil-nino-4-anos/ |
