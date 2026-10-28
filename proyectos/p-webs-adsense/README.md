# Proyecto P · Webs de herramientas y datos con AdSense

Fábrica de sitios estáticos de calculadoras y tablas con datos oficiales, en castellano y catalán, monetizados con
publicidad. Cada página resuelve un cálculo o da un dato real, nunca texto de relleno: es lo que exige la política de
Google contra el contenido escalado y lo que los resúmenes de IA no sustituyen.

| | Sitio 1 · NetoClaro | Sitio 2 · ImpuestoClaro |
|---|---|---|
| Tema | Nómina y laboral | Impuestos y autónomos |
| Dominio propuesto | netoclaro.es | impuestoclaro.es |
| Calculadoras | 20 (es + ca) | 20 (es + ca) |
| Fichas de datos citables | 10 (es + ca, con CSV) | 10 (es + ca, con CSV) |
| Páginas programáticas | 73 × 2 idiomas | 46 × 2 idiomas |
| Páginas en total | 218 | 162 |

Las URL temporales, el resultado de Lighthouse y el estado están en el informe del PR y en el panel.

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
    ├── src/lib/calc/                motores puros: ss, irpf, laboral, fiscal (sin cifras dentro)
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
npm test                        # 186 pruebas de cálculo
npm run build:todos             # dist/nomina y dist/impuestos
npm run comprobar               # contenido completo, enlaces internos, títulos, datos pendientes
node scripts/lighthouse.mjs     # Lighthouse móvil sobre una muestra; falla por debajo de 95
SITIO=nomina npm run dev        # desarrollo
node scripts/vista-previa.mjs nomina   # copia con enlaces relativos para alojar en una subcarpeta
```

## Despliegue: un proyecto por sitio en Cloudflare Pages

Se usa Cloudflare Pages porque su plan gratuito permite uso comercial. El plan Hobby de Vercel lo prohíbe.
`vercel.json` también funciona si Moisés prefiere usar el plan Pro que ya tiene previsto.

| Campo | Valor |
|---|---|
| Root directory | `proyectos/p-webs-adsense/fabrica` |
| Build command | `npm run publicar` |
| Output directory | `publicar` |
| Variables | `SITIO` = `nomina` o `impuestos`, más `NODE_VERSION` = `22` |

Variables opcionales, sin tocar el código:

| Variable | Para qué |
|---|---|
| `ADSENSE_CLIENT` | Identificador `ca-pub-…`. Activa el consentimiento de Google (TCF 2.2), `ads.txt` y los anuncios. Sin él no hay anuncios ni banner. |
| `ADSENSE_SLOT_RESULTADO`, `ADSENSE_SLOT_FINAL` | Bloques de anuncio bajo el resultado y al final del contenido. |
| `UMAMI_ID`, `UMAMI_SRC` | Analítica sin cookies (Umami Cloud gratuito o autoalojado). |
| `GSC_VERIFICACION` | Metaetiqueta de verificación de Search Console, si no se verifica por DNS. |
| `SITE_URL` | URL pública mientras no haya dominio, por ejemplo `https://netoclaro.pages.dev`. |

`public/_headers` da caché larga a los recursos con hash. La integración continua, en
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
- **Un país:** crea `params/<pais>/pais.json` y `params/<pais>/<año>/`, y el sitio con `"pais": "<pais>"`. Los motores
  de España no sirven para otro país: el sitio 3 (EE. UU.) tendrá sus propios motores en `src/lib/calc/us/`.
- **Un sitio:** crea `sitios/<id>/sitio.json`, sus contenidos y sus fichas en `src/fichas/<id>.ts`, regístralas en
  `src/lib/rutas.ts` y despliega otro proyecto de Cloudflare con `SITIO=<id>`.

## Decisiones tomadas

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

## Fichas de los sitios 3 a 7

Ver la sección siguiente, preparada para la tarea que abre un sitio nuevo cada 6 a 8 semanas.
