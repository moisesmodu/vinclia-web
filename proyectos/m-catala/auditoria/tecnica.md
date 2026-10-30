# Auditoría técnica · aprova-catala.vercel.app

Fecha: 2026-10-30 · Proyecto: `/home/user/vinclia-web/proyectos/m-catala` (Next.js 15.5.28, React 19.2.9) · Despliegue auditado: `dpl_CJoQc1VvacUNB1WiWRnoyoCdaDUL` (BUILD_ID local `eANe0GKERViqigj1bK__S`).
Herramientas: Playwright/Chromium (Pixel 7, 360×740, 768×1024, 1440×900), Lighthouse 12.8.2 (móvil, emulación moto g power), axe-core (bundle de Lighthouse 12; cdnjs/unpkg bloqueados por el proxy), curl, tsc 5.9.3, npm audit, `next build`.
Material bruto: `(scratch)/` (`crawl/results.json`, `lh/*.json`, `axe/*.json`, `api/*.body|*.hdr|ratelimit*.tsv`, `seo/*.json`, `capturas/*.png`, `build.txt`, `tsc.txt`, `audit.json`).

No se ha modificado el repositorio (sólo `npx next build` regeneró `.next/`, que está en `.gitignore`). Las únicas escrituras en producción fueron las inevitables para probar: 1 errata de prueba (`itemId: auditoria-test`, texto «Prova auditoria tecnica, ignorar.») en la tabla `contacte`, 3 correcciones LanguageTool contabilizadas y 15 sin cookie (ver §5).

---

## 0. Resumen de hallazgos (ordenados por gravedad)

| # | Sev. | Hallazgo | Dónde |
|---|---|---|---|
| 1 | **Alto** | El límite de peticiones es en memoria por instancia y **no funciona en Vercel**: 30 POST seguidos a `/api/corregir` → 0×429 (cada petición cayó en una instancia distinta; ver `x-vercel-id`). Lo mismo aplica a `/api/auth/entrar` (fuerza bruta de contraseñas), `/api/auth/registre`, `/api/contacte`, `/api/alerta`, `/api/errata`, `/api/simulacre`. | `lib/http.ts:11` (`limitar`) |
| 2 | **Alto** | La cuota gratuita de correcciones (3/mes) se salta **borrando la cookie `aprova_anon`**: 15 POST sin cookie → 15×200 (15 llamadas al motor). Combinado con #1, el motor de corrección (LanguageTool y, si se activa, el LLM) es consumible sin límite por un anónimo. | `app/api/corregir/route.ts:20-25`, `lib/http.ts:22` (`anonId`) |
| 3 | **Alto** | Sin **Content-Security-Policy** ni **X-Frame-Options**/`frame-ancestors` en ninguna respuesta (clickjacking posible en `/ca/entrar`, `/ca/compte`, `/ca/preus`). Lighthouse: «No CSP found in enforcement mode». | `next.config.mjs:7-9` |
| 4 | **Alto** (a11y) | **Contraste 3,09:1** del gris `#8A92AB` (`--color-terciari`) sobre blanco en texto de 11-13 px: barra de navegación móvil (5 enlaces en todas las páginas), notas `text-terciari`, pie. WCAG AA exige 4,5:1. axe lo marca *serious* en las 6 páginas analizadas (46 nodos en total) y es la única causa de que Accessibility no llegue a 100 en Lighthouse. | `app/globals.css:13`, `components/BarraMovil.tsx:21`, `components/Pie.tsx`, `app/[lang]/page.tsx` |
| 5 | **Alto** (a11y) | CTA «Fes el diagnòstic gratuït» de las **62 páginas de guía** renderiza texto `#141C3A` sobre `#2140D6` (**2,2:1**): la regla `.prosa a { text-tinta }` pisa el `text-white` de `.boton-primari`. | `app/globals.css:134` vs `app/[lang]/guia/[slug]/page.tsx:25` |
| 6 | **Medio** | SEO: **95 de 96 páginas HTML con `hreflang` incorrecto** (todas las no-guía apuntan a `/ca` y `/es` raíz, sin `x-default`), **sin `canonical`** en 35 páginas no-guía, **sin Open Graph/Twitter** en 35 páginas (incl. portada y precios), **19 títulos duplicados** `Aprova · El teu certificat de català…` (comencar, simulacre, escriure, oral, practica, avui, diagnostic, mapa, pla, entrar, contacte, validesa, legal/*, practica/*, simulacre/*) y **21 descripciones duplicadas** (incl. `/ca/preus`, `/ca/guia`). Lighthouse SEO 91 en `/ca/preus` por meta description «genérica» (la detecta como igual al layout). | `app/[lang]/layout.tsx:19-25`, páginas sin `generateMetadata` |
| 7 | **Medio** | `GET /api/progres` devuelve **401 en cada carga de página** para todo usuario sin sesión (17 páginas del rastreo, 2 en el diagnóstico) → error en consola en todas las vistas de app, penaliza Best Practices (96 en `/ca/comencar`) y el `fetch` nunca lee el cuerpo. Debería no llamarse si no hay sesión (p. ej. flag en `localStorage`/cookie legible) o responder 204. | `lib/estat.ts:57-60`, `app/api/progres/route.ts:9` |
| 8 | **Medio** | `npm audit --omit=dev`: **4 high, 1 moderate** — `postcss ≤8.5.22` (XSS en stringify, lectura arbitraria de `.map` vía `sourceMappingURL`, arrastra `next` como moderate), `deepmerge-ts <8` (agotamiento de pila, vía `@prisma/config`/`prisma`). Son dependencias de build, no de runtime en el navegador, pero conviene subir `next` y `prisma`. | `package.json` |
| 9 | **Medio** (a11y) | `aria-pressed` en elementos `role="radio"` (**critical** en axe, 3 nodos por pregunta del diagnóstico y de la práctica) y `role="progressbar"` sin nombre accesible (**serious**, en `/ca/comencar`, `/ca/diagnostic` y donde se use `Segments`). | `components/ItemVista.tsx:77`, `components/DemoItem.tsx:29`, `components/ui/Segments.tsx:4` |
| 10 | **Medio** | Motor de corrección **sin LLM en producción**: `motor: "lt"`, criterios de adequació/coherència/riquesa marcados `orientativa: true` y calculados por heurística. La corrección gramatical sí funciona (6/6 errores detectados, 0,9-1,3 s), pero la promesa de «rúbrica oficial» de premium se apoya en heurísticas. Además dos reglas están mal etiquetadas (`y→i` sale como `ortografia-essa-sorda-sonora-x`; `el divendres→divendres` como `verbs-incoatius-irregulars`). | `lib/correccio/*`, variables de entorno del despliegue |
| 11 | **Medio** | `/ca/avui`, `/ca/diagnostic`, `/ca/entrar`, `/ca/practica/mini`, `/ca/practica/repas`, `/ca/simulacre/c1-simulacre-1` se sirven **sin `<h1>`** en el HTML (y `/ca/avui` tampoco lo tiene tras hidratar para un usuario nuevo: axe `page-has-heading-one`). | `components/Avui.tsx:36-37`, `components/FormulariEntrar.tsx`, `components/Practica.tsx` |
| 12 | **Bajo** | Falta `favicon.ico` y `apple-icon.png` (404; `apple-touch-icon` apunta a `/icons/icon-192.png`, válido pero no es el tamaño 180 recomendado) y falta `<meta name="apple-mobile-web-app-capable">`. `background_color`/`theme_color` del manifest `#FFFFFF`: splash blanco sin marca. | `app/manifest.ts`, `app/[lang]/layout.tsx` |
| 13 | **Bajo** | `/ca/preus` es `force-dynamic` (`cache-control: private, no-store`, TTFB 172 ms frente a 40-60 ms del resto) sólo para leer la sesión; impide bfcache y CDN. | `app/[lang]/preus/page.tsx:7` |
| 14 | **Bajo** | Sitemap: `lastModified` siempre «ahora» (78 URLs cambian de fecha cada petición), y faltan páginas públicas indexables: `/ca/convocatories` sí está pero no `/ca/contacte`, `/ca/validesa`, `/ca/legal/*`, ni las 28 `/escriure/[tasca]`, 16 `/practica/[tipus]` y 18 `/simulacre/[id]` prerenderizadas. | `app/sitemap.ts` |
| 15 | **Bajo** | Sin ESLint configurado en el proyecto (`npx next lint` no ejecutable, no hay `.eslintrc`/`eslint.config`). | raíz del proyecto |
| 16 | **Bajo** | Service worker cachea con `addAll` sólo `/ca`, `/es`, `/ca/avui`; la primera visita offline a páginas no visitadas devuelve el shell de `/ca/avui` (correcto como fallback) pero sin página «sin conexión» explícita. `aprova-v1` sin versionado por build: los chunks `_next/static` quedan cacheados hasta que cambia la constante. | `public/sw.js` |

Lo que **funciona bien**: 103/104 rutas 200 (la 404 es la esperada), 0 enlaces internos rotos (157 distintos), sin desbordamiento horizontal en ningún viewport, TTFB 40-80 ms en estáticas, LCP 1,5-2,4 s en móvil emulado, CLS ≤0,08, HSTS con preload, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, cookies `HttpOnly; Secure; SameSite=Lax`, webhook rechaza firma inválida (400), validaciones de entrada coherentes (400/405/413), tsc sin errores, build limpio, First Load JS 103-143 kB.

---

## 1. Rastreo de rutas (Playwright, Pixel 7)

- 104 rutas: 78 del sitemap (39 ca + 39 es) + 26 añadidas. Resultado: **103 × 200, 1 × 404** (`/ca/ruta-que-no-existeix-404`, con `<meta name="robots" content="noindex">`, h1 «404»).
- Redirecciones: `/` → `/ca` (middleware por `Accept-Language`); `/ca/compte` y `/es/compte` → 307 a `/{lang}/entrar?seguent=/{lang}/compte`. `/fr` → 404 (correcto).
- **Errores de consola**: 18 en total = 17 × `GET /api/progres → 401` (una por cada página de app: comencar, diagnostic, avui, practica/*, mapa, simulacre/*, escriure, oral, pla, entrar, es/*) + 1 × 404 de la propia ruta inexistente. Ningún `pageerror` (excepción JS) en ninguna página.
- **Peticiones 4xx/5xx**: sólo las 17 de `/api/progres` y el 404 esperado. Los `net::ERR_ABORTED` de `?_rsc=` son prefetches de `<Link>` cancelados por Next (normales).
- Tiempos: TTFB mediana 60 ms (máx. 196 ms en `/es/comencar`); `DOMContentLoaded` 230-880 ms. La columna «ms» total de mi primera pasada (10,5 s en páginas de app) era un artefacto: `networkidle` nunca llega porque el `fetch('/api/progres')` del cliente no consume el cuerpo del 401; curl responde en 0,3 s.
- Peso: ~950 kB **descomprimidos** por página (JS 464 kB, RSC prefetch 250-310 kB, fuente Archivo 88 kB, CSS 39 kB). En transferencia (Lighthouse): **315-331 KiB**. El prefetch de RSC de la barra inferior (`/ca/avui`, `/ca/oral`… 16-17 kB cada uno) se repite en cada página.
- Sin desbordamiento horizontal en ninguna de las 104 rutas.
- Títulos repetidos: 19 páginas ca y 8 es comparten el título genérico del layout (ver §4).

La tabla completa de las 104 rutas está al final del documento (Anexo A).

## 2. Lighthouse 12.8.2 (móvil)

| Página | Perf. | Access. | Best Pract. | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/ca` | **89** | 96 | 100 | 100 | 1,4 s | 2,4 s | 350 ms | 0,006 | 2,7 s |
| `/ca/preus` | **97** | 96 | 100 | **91** | 0,9 s | 1,5 s | 130 ms | 0,08 | 1,0 s |
| `/ca/guia/examen-c1-catala-2027-model` | **92** | 96 | 100 | 100 | 1,4 s | 2,1 s | 270 ms | 0,079 | 2,5 s |
| `/ca/comencar` | **99** | **92** | **96** | 100 | 1,4 s | 2,0 s | 40 ms | 0,006 | 1,4 s |

Peores avisos por categoría (los que puntúan <1):

- **Performance** `/ca`: TBT 350 ms / Max Potential FID 400 ms (hidratación del hero + DemoItem), *forced reflow*, *render-blocking* CSS `a194fd8fdd7fee6b.css` (40-520 ms est.), *legacy JavaScript* 11-12 KiB en `chunks/1255-*.js`, *main-thread work* 2,0 s en la guía. Peso total 315-331 KiB; el mayor recurso es la fuente `archivo-latin-wdth-normal.woff2` (88 KiB) seguida de `4bd1b696-*.js` (55 KiB) y `1255-*.js` (46 KiB). `/ca/preus`: bfcache bloqueado por `Cache-Control: no-store` (página dinámica).
- **Accessibility**: `color-contrast` (peso 7) en las 4 páginas (barra móvil, `text-terciari`, pie; en la guía además el CTA 2,2:1); `aria-progressbar-name` en `/ca/comencar`.
- **Best Practices**: 100 salvo `/ca/comencar` (96) por `errors-in-console` (el 401 de `/api/progres`). Informativo en todas: **sin CSP**.
- **SEO**: `/ca/preus` 91 por `meta-description` (descripción genérica heredada). `canonical` «not applicable» (no existe) en las páginas no-guía.

## 3. Accesibilidad (axe-core) y contraste

Ejecutado en Pixel 7 sobre `/ca`, `/ca/preus`, `/ca/guia/examen-c1-catala-2027-model`, `/ca/comencar` (pantalla 1 y 3), `/ca/diagnostic` (tras completar las 3 pantallas: C1 → «DPL · prova de C1 2027» → Oposicions + Castellà → 15 min + Castellano; navegación en 2,8 s, primera pregunta «Ús de la llengua 1/12 · Lèxic») y `/ca/avui`.

| Página | Regla | Impacto | Nodos | Selector (ejemplo) | Descripción |
|---|---|---|---|---|---|
| `/ca` | color-contrast | serious | 12 (+6 indeterminados) | `nav.fixed > a[href$="avui"]`, `section.contenedor-portada p.text-terciari`, `section.seccio p.mt-3.text-terciari` | `#8A92AB` sobre `#FFFFFF` = 3,09:1 en 11-13 px |
| `/ca/preus` | color-contrast | serious | 7 (+5) | barra móvil ×5, `main#contingut p.mt-2.text-terciari`, `footer li.pt-2.text-terciari` | ídem |
| `/ca/guia/examen-c1…` | color-contrast | serious | 7 | barra móvil ×5, `footer li`, **`a.boton-primari`** (`#141C3A` sobre `#2140D6` = **2,2:1**, 17 px bold) | CTA de la guía ilegible |
| `/ca/comencar` | aria-progressbar-name | serious | 1 | `.segments[role=progressbar]` | sin `aria-label` |
| `/ca/comencar` | color-contrast | serious | 6 | barra móvil ×5, `footer li` | 3,09:1 |
| `/ca/diagnostic` | **aria-allowed-attr** | **critical** | 3 | `.opcio[role="radio"]:nth-child(1..3)` | `aria-pressed` no permitido en `role=radio` |
| `/ca/diagnostic` | aria-progressbar-name | serious | 1 | `.segments.mt-3` (bloques 0/4) | sin nombre |
| `/ca/diagnostic` | color-contrast | serious | 6 | barra móvil ×5, pie | 3,09:1 |
| `/ca/avui` | color-contrast | serious | 5 | barra móvil ×4 (el activo va en `text-tinta`), pie | 3,09:1 |
| `/ca/avui` | page-has-heading-one | moderate | 1 | `html` | sin h1 en el estado «haz primero el diagnóstico» |

Sin violaciones de `label`, `link-name`, `button-name`, `html-lang`, `landmark`, `list` ni `heading-order`. Los radios del onboarding tienen `role="radiogroup"` + `aria-label` y nombres accesibles correctos.

**Ratios WCAG calculados** (fórmula de luminancia relativa, sRGB):

| Combinación | Color efectivo | Ratio | AA texto normal (4,5) | AA texto grande / UI (3,0) |
|---|---|---|---|---|
| Blanco al 85 % sobre `#2140D6` (hero, `text-white/85`, 19-21 px) | `#DEE2F9` | **5,91:1** | Pasa | Pasa |
| Blanco 100 % sobre `#2140D6` (botones primarios) | — | 7,47:1 | Pasa | Pasa |
| `#8A92AB` sobre `#FFFFFF` (terciari, 11-13 px) | — | **3,09:1** | **Falla** | Pasa sólo si fuera ≥18,66 px bold / 24 px |
| `#2140D6` sobre blanco (enlaces) | — | 7,47:1 | Pasa | Pasa |
| `#141C3A` sobre `#2140D6` (CTA guía por cascada) | — | **2,2:1** | Falla | Falla |

Corrección sugerida: `--color-terciari` a ≥ `#6B7390` (4,5:1) o usar `--color-secundari #5B6480` (6,2:1) en la barra móvil; en `.prosa a` excluir `.boton-primari` (`.prosa a:not([class*="boton"])`).

## 4. SEO

Analizadas 96 páginas HTML (78 sitemap + 18 extra) a partir del HTML servido (`seo/paginas.json`).

- **Title**: portada «Aprova · Sabràs si aproves abans de pagar la taxa» (49 car.), guías con títulos propios (p. ej. «Examen C1 de català 2027: model, dates i mínims · Aprova», 56 car.), `/ca/preus` «Preu clar · Aprova». **27 páginas** (19 ca + 8 es) heredan el título genérico del layout: `/ca/comencar`, `/ca/simulacre`, `/ca/escriure`, `/ca/oral`, `/ca/practica`, `/ca/avui`, `/ca/diagnostic`, `/ca/mapa`, `/ca/pla`, `/ca/entrar`, `/ca/contacte`, `/ca/validesa`, `/ca/legal/*` (4), `/ca/practica/mini|repas`, `/ca/simulacre/c1-simulacre-1` y equivalentes es. **Medio**.
- **Meta description**: portada 188 car. (algo larga, >160); guías 150-160 car. correctas; **21 ca + 10 es duplicadas** con la frase del layout «El teu certificat de català, del B1 al C2.» (42 car.), incluidas `/ca/preus`, `/ca/guia`, `/ca/convocatories`, `/ca/comencar`. **Medio**.
- **Canonical**: sólo en las 62 guías. Faltan en portada, preus, convocatories, guia (índice), comencar, simulacre, escriure, oral, practica, legales, etc. (35 páginas). **Medio**.
- **hreflang**: las guías tienen pares ca/es correctos; **las otras 35 páginas declaran `ca=/ca`, `es=/es`** (heredado de `layout.tsx:25`), es decir, `/ca/preus` dice que su alternativa es `/es` en vez de `/es/preus`. Ninguna página tiene `x-default`. Lighthouse `hreflang` pasa porque la sintaxis es válida; el error es semántico. **Medio**.
- **Open Graph / Twitter**: sólo en las 62 guías (`og:title/description/locale/type=article`, `twitter:card=summary`), **sin `og:image`** en ninguna y **sin OG** en portada, preus, comencar y resto (35 páginas). **Medio**.
- **JSON-LD**: `FAQPage` válido en las 62 guías. Ninguna `Organization`/`WebSite`/`SoftwareApplication`/`Product` (precios) ni `BreadcrumbList`. **Bajo**.
- **H1**: único en 89 páginas; **0 h1** en `/ca/avui`, `/ca/diagnostic`, `/ca/entrar`, `/ca/practica/mini`, `/ca/practica/repas`, `/ca/simulacre/c1-simulacre-1`, `/es/avui` (HTML del servidor; componentes cliente). Jerarquía h1→h2→h3 correcta en portada y guías.
- **Enlaces internos**: 157 href internos distintos en las 96 páginas → **0 rotos**, 0 redirigidos (las verificaciones devolvieron 200). Externos: `llengua.gencat.cat`, `www.cifalc.cat`, `educacio.gencat.cat` (no verificados).
- **Sitemap**: 78 URLs, todas 200 y con `hreflang` en `xhtml:link`. Incoherencias: `lastmod` = instante de la petición; faltan `/contacte`, `/validesa`, `/legal/*` y las 62 rutas SSG de `escriure/[tasca]`, `practica/[tipus]`, `simulacre/[id]` que sí se prerenderizan y enlazan. `/ca/avui`, `/mapa`, `/pla`, `/diagnostic` correctamente fuera (app privada), aunque no llevan `noindex`.
- **robots.txt**: `Allow: /`, `Disallow: /api/, /ca/compte, /es/compte`, `Sitemap:` correcto. `html lang` correcto en 54 ca / 42 es. `/ca/entrar` sin `noindex` (indexable, título genérico).

## 5. API (curl, `api/resultados.tsv`)

Nota: las rutas pedidas `/api/correccio` y `/api/webhook` **no existen** (404 HTML); las reales son `/api/corregir` y `/api/stripe/webhook`, que son las probadas.

| Endpoint | Caso | Código | ms | Cuerpo / observación |
|---|---|---|---|---|
| GET `/api/yo` | sin sesión | 200 | 132-321 | `{"usuari":null,"pagaments":"stripe","prova":true}` → Stripe en **modo test** en producción |
| POST `/api/auth/registre` | `{}` | 400 | 132 | `{"error":"email"}` |
| POST `/api/auth/registre` | email inválido | 400 | 135 | `{"error":"email"}` |
| POST `/api/checkout` | sin sesión, plan mensual | 200 | 135 | `{"url":"/ca/entrar?seguent=/ca/preus"}` (devuelve 200 en vez de 401; el cliente redirige) |
| POST `/api/checkout` | sin sesión, plan `xxx` | 200 | 135 | misma redirección; el plan no se valida hasta tener sesión (orden razonable, no hay fuga) |
| POST `/api/correccio` | ruta pedida | 404 | 123 | HTML 404 de Next (no JSON) |
| POST `/api/corregir` | texto vacío | 400 | 143 | `{"error":"curt"}` (mínimo 15 palabras) |
| POST `/api/corregir` | 54 palabras, 3 errores sembrados | 200 | **915 / 1349** (servidor `ms: 466`) | `motor:"lt"`; **detecta los 3**: `plaç→termini`, `recolzar→donar suport a`, `tenim que→hem de`, y además `y→i`, `son→són` y `el divendres→divendres` (6 errores); `nota 20/40`; criterios `orientativa:true` (sin LLM) |
| POST `/api/corregir` | cuerpo no JSON | 400 | 312 | `{"error":"curt"}` |
| POST `/api/corregir` | 8.400 caracteres | 413 | 152 | `{"error":"llarg"}` |
| POST `/api/errata` | `{}` | 400 | 142 | `{"error":"dades"}` |
| POST `/api/errata` | válido | 200 | 370 | `{"ok":true,"guardat":true}` (guardado en BD; sin autenticación ni límite efectivo → spam posible) |
| POST `/api/alerta` | email inválido | 400 | 214 | `{"error":"dades"}` |
| POST `/api/contacte` | `{}` | 400 | 162 | `{"error":"text"}` |
| POST `/api/simulacre` | `{}` | 400 | 338 | `{"error":"dades"}` |
| GET `/api/simulacre` | cohorte | 200 | 296-1032 | `{"cohort":{"n":11,"percentil":100}}` — expone recuento de simulacros sin auth (bajo) |
| GET `/api/banc` | sin sesión | 200 | 256 | 172 ítems C1 completos (banco gratuito expuesto; previsto para el SW offline) |
| POST `/api/webhook` | ruta pedida | 404 | 133 | HTML 404 |
| POST `/api/stripe/webhook` | sin firma | **400** | 158 | `{"error":"signatura invàlida"}` ✔ |
| GET `/api/corregir`, `/api/auth/registre`, `/api/contacte`, `/api/stripe/webhook` | método no permitido | **405** | 146-333 | cuerpo vacío, sin cabecera `Allow` |

**Cabeceras de seguridad** (iguales en HTML y API):
`strict-transport-security: max-age=63072000; includeSubDomains; preload` ✔ · `x-content-type-options: nosniff` ✔ · `referrer-policy: strict-origin-when-cross-origin` ✔ · `permissions-policy: microphone=(self)` ✔ (no restringe camera/geolocation/payment) · **`content-security-policy`: ausente** ✘ · **`x-frame-options`: ausente** ✘ · `x-powered-by`: ausente ✔ · API `cache-control: no-store` ✔.

**Cookies**: `aprova_anon=…; Path=/; Max-Age=34560000 (400 días); Secure; HttpOnly; SameSite=lax` ✔ (observada). La cookie de sesión (`lib/auth.ts:48`) se emite con `httpOnly, sameSite:'lax', secure` según código; no se ha creado una cuenta en producción para observarla. Nota: 400 días supera el tope de Chrome (400) justo y el de Safari ITP (7 días para cookies de script; al ser de servidor, 400). Sin banner de cookies: sólo técnicas, coherente con `/ca/legal/galetes`.

**Límite de peticiones**: 30 POST `/api/corregir` seguidos con la misma cookie → `2×200, 28×402 quota`, **0×429**. Cada petición llegó a una instancia distinta (`x-vercel-id` iad1::7r24x, dbhc8, rh4n7, 9vddt…), por lo que el `Map` en memoria de `limitar()` nunca acumula. 15 POST sin cookie → **15×200**: la cuota mensual se evita porque `anonId()` genera un id nuevo si no llega cookie. Recomendación: Upstash/Vercel KV o `@vercel/firewall` rate limit por IP, y ligar la cuota anónima también a IP+UA o exigir cuenta a partir de la 2.ª corrección.

## 6. PWA

- `manifest.webmanifest` 200, `application/manifest+json`, válido: `name`, `short_name`, `start_url: /ca/avui`, `scope: /`, `display: standalone`, `lang: ca`, iconos 192/512 + maskable 512 (**los 3 cargan**, PNG 6-16 kB), `theme_color`/`background_color` `#FFFFFF`. `<link rel="manifest">` y `<meta name="theme-color">` presentes.
- **Service worker** `/sw.js` (1,5 kB, `Cache-Control: no-cache`): registra con `scope: /`, `state: activated`. Caché `aprova-v1` tras visitar 5 páginas: 30 entradas (HTML de `/ca`, `/es`, `/ca/avui`, `/ca/comencar`, `/ca/preus`, guía; chunks `_next/static`; fuentes).
- **Instalable**: cumple los requisitos de Chrome (HTTPS, manifest con name/icons 192+512/start_url/display, SW con handler `fetch`). No medido con el evento `beforeinstallprompt` (no disparable en headless).
- **Offline**: con `context.setOffline(true)`, recarga de `/ca/avui` → **200 desde el SW** (`fromServiceWorker: true`), se pinta la página («Fes primer el diagnòstic per tenir un pla» + pie; captura `capturas/avui-offline-pixel7.png`). Navegar offline a `/ca/practica/mini` (no visitada) → fallback a `/ca/avui` cacheado (200). El estado local (`localStorage aprova:estat:v1`) hace que la minisesión funcione si `/api/banc` estaba cacheado.
- Pendientes: sin página «sin conexión» dedicada (el fallback muestra «Avui» con URL distinta), nombre de caché sin hash de build, `/apple-icon.png`/`favicon.ico` 404, sin `apple-mobile-web-app-capable`, splash blanco.

## 7. Compatibilidad / viewports

| Viewport | Página | scrollWidth / innerWidth | Desbordamiento | Captura |
|---|---|---|---|---|
| 360×740 (Galaxy) | `/ca` | 360 / 360 | No | `capturas/_ca-galaxy-360.png` |
| 360×740 | `/ca/diagnostic` | 360 / 360 | No | `capturas/_ca_diagnostic-galaxy-360.png` |
| 768×1024 (iPad) | `/ca` | 768 / 768 | No | `capturas/_ca-ipad-768.png` |
| 768×1024 | `/ca/diagnostic` | 768 / 768 | No | `capturas/_ca_diagnostic-ipad-768.png` |
| 1440×900 | `/ca` | 1440 / 1440 | No | `capturas/_ca-desktop-1440.png` |
| 1440×900 | `/ca/diagnostic` | 1440 / 1440 | No | `capturas/_ca_diagnostic-desktop-1440.png` |
| Pixel 7 | `/ca/comencar` ×3, `/ca/diagnostic`, `/ca/avui` | 412 / 412 | No | `capturas/comencar-paso{1,2,3}-pixel7.png`, `diagnostic-pixel7.png`, `avui-pixel7.png` |

Las 104 rutas del rastreo en Pixel 7 tampoco desbordan. Observación visual: el diagnóstico a 1440 px queda en una columna de ~600 px centrada (correcto para lectura); la barra inferior fija sólo aparece <640 px y el pie reserva `pb-20` para no quedar tapado. No se han probado Safari/WebKit ni Firefox (sólo Chromium instalado).

## 8. Repositorio (solo lectura)

- **`npx tsc --noEmit -p .`**: **0 errores**, 11,5 s.
- **Lint**: no hay configuración ESLint (`.eslintrc*`/`eslint.config.*` ausentes; `next lint` no definido en `scripts`). No ejecutado.
- **`npm audit --omit=dev --json`**: **5 vulnerabilidades: 0 critical, 4 high, 1 moderate, 0 low**.
  - high `postcss ≤8.5.22` (3 avisos: XSS vía `</style>` sin escapar, lectura arbitraria de ficheros por `sourceMappingURL`, fix incompleto) → arrastra `next 15.5.28` (moderate).
  - high `deepmerge-ts <8.0.0` (agotamiento de pila) → `@prisma/config` → `prisma 6.19.3`.
- **`npx next build`**: OK en 36 s, sin warnings. Rutas y tamaños (First Load JS compartido **103 kB**: `1255-*.js` 46,6 kB + `4bd1b696-*.js` 54,2 kB + 1,9 kB; middleware 34,8 kB):

| Ruta | Tamaño | First Load JS | Tipo |
|---|---|---|---|
| `/_not-found` | 205 B | 103 kB | ○ |
| `/[lang]` (ca, es) | 2,65 kB | 120 kB | ● ISR 1d |
| `/[lang]/avui` | 6,45 kB | 130 kB | ● |
| `/[lang]/comencar` | 3,25 kB | 117 kB | ● |
| `/[lang]/compte` | 2,15 kB | 116 kB | ● |
| `/[lang]/contacte` | 608 B | 114 kB | ● |
| `/[lang]/convocatories` | 737 B | 115 kB | ● |
| `/[lang]/diagnostic` | 5,34 kB | **143 kB** | ● |
| `/[lang]/entrar` | 2,67 kB | 116 kB | ● |
| `/[lang]/escriure` | 179 B | 106 kB | ● |
| `/[lang]/escriure/[tasca]` (28) | 1,56 kB | 122 kB | ● |
| `/[lang]/guia` | 179 B | 106 kB | ● |
| `/[lang]/guia/[slug]` (62) | 179 B | 106 kB | ● |
| `/[lang]/legal/[doc]` (8) | 205 B | 103 kB | ● |
| `/[lang]/mapa` | 4,8 kB | 129 kB | ● |
| `/[lang]/oral` | 2,61 kB | 119 kB | ● |
| `/[lang]/pla` | 2,46 kB | 120 kB | ● |
| `/[lang]/practica` | 179 B | 106 kB | ● |
| `/[lang]/practica/[tipus]` (16) | 4,34 kB | 136 kB | ● |
| `/[lang]/preus` | 1,6 kB | 115 kB | ● |
| `/[lang]/simulacre` | 179 B | 106 kB | ● |
| `/[lang]/simulacre/[id]` (18) | 3,74 kB | **141 kB** | ● |
| `/[lang]/validesa` | 1,63 kB | 104 kB | ● |
| `/api/*` (23 rutas) | 205 B | 103 kB | ƒ |
| `/icon.svg`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml` | 0-205 B | 0-103 kB | ○ |

Observación: el build local marca `/[lang]/preus` como ● (SSG) mientras el despliegue lo sirve `no-store`; conviene revisar si el despliegue tiene otra versión o si `force-dynamic` se añadió después del build auditado localmente. Bundles razonables; el mayor coste de red es la fuente variable Archivo (88 KiB) y el prefetch RSC de la barra de navegación.

## 9. Lo que no se ha podido medir

- Flujo de pago real (Stripe en modo test; no se ha creado cuenta ni sesión de checkout).
- Cookie de sesión en vivo (no se ha registrado ningún usuario en producción).
- `beforeinstallprompt` real y comportamiento en iOS/Safari (sólo Chromium headless).
- `/api/oral`, `/api/tts`, `/api/portal`, `/api/subscripcio/*`, `/api/checkout/confirmar` (requieren sesión o claves de terceros).
- Lighthouse en condiciones reales de red: se ha usado la limitación simulada por defecto (Slow 4G, CPU ×4); los valores de laboratorio varían ±5 puntos entre ejecuciones.

---

## Anexo A. Tabla de rutas (Playwright, Pixel 7)

kB = bytes descomprimidos de todas las respuestas; «Pet. 4xx/5xx» excluye prefetches abortados (`ERR_ABORTED`).

| Ruta | HTTP | Redirige a | Err. consola | Pet. 4xx/5xx | TTFB ms | DOMContentLoaded ms | kB (sin comprimir) | Peticiones |
|---|---|---|---|---|---|---|---|---|
| /ca | 200 |  | 0 | 0 | 59 | 329 | 947 | 30 |
| /ca/comencar | 200 |  | 1 | 1 | 61 | 302 | 946 | 31 |
| /ca/preus | 200 |  | 0 | 0 | 172 | 409 | 877 | 29 |
| /ca/convocatories | 200 |  | 0 | 0 | 48 | 307 | 919 | 30 |
| /ca/guia | 200 |  | 0 | 0 | 53 | 253 | 1092 | 32 |
| /ca/simulacre | 200 |  | 0 | 0 | 56 | 246 | 3323 | 36 |
| /ca/escriure | 200 |  | 0 | 0 | 45 | 237 | 2679 | 35 |
| /ca/oral | 200 |  | 2 | 2 | 47 | 231 | 1217 | 47 |
| /ca/practica | 200 |  | 0 | 0 | 47 | 266 | 1041 | 35 |
| /ca/guia/calendari-convocatories-catala-2027 | 200 |  | 0 | 0 | 124 | 337 | 970 | 29 |
| /ca/guia/castellanismes-mes-frequents-examen-catala | 200 |  | 0 | 0 | 234 | 737 | 974 | 29 |
| /ca/guia/catala-administratiu-ics-c1 | 200 |  | 0 | 0 | 118 | 314 | 960 | 29 |
| /ca/guia/catala-ajuntaments-oposicions-nivell | 200 |  | 0 | 0 | 99 | 305 | 960 | 29 |
| /ca/guia/catala-arrelament-b1-b2-estrangers | 200 |  | 0 | 0 | 102 | 318 | 961 | 29 |
| /ca/guia/catala-bombers-generalitat-nivell | 200 |  | 0 | 0 | 152 | 380 | 958 | 29 |
| /ca/guia/catala-docents-c2-decret | 200 |  | 0 | 0 | 135 | 342 | 961 | 29 |
| /ca/guia/catala-ics-infermeria-c1 | 200 |  | 0 | 0 | 102 | 394 | 959 | 29 |
| /ca/guia/catala-ics-tcai-zelador-b1 | 200 |  | 0 | 0 | 118 | 306 | 959 | 29 |
| /ca/guia/catala-mossos-esquadra-prova-de-catala | 200 |  | 0 | 0 | 153 | 354 | 959 | 29 |
| /ca/guia/catala-oposicions-generalitat-cossos-a1-a2-c1 | 200 |  | 0 | 0 | 129 | 344 | 959 | 29 |
| /ca/guia/catala-subaltern-generalitat-b2 | 200 |  | 0 | 0 | 141 | 385 | 959 | 29 |
| /ca/guia/certificat-catala-cpnl-equivalencies | 200 |  | 0 | 0 | 107 | 326 | 964 | 29 |
| /ca/guia/certificat-catala-salut-prescriu-te-el-catala | 200 |  | 0 | 0 | 90 | 292 | 961 | 29 |
| /ca/guia/com-aprovar-el-c1-de-catala-en-3-mesos | 200 |  | 0 | 0 | 134 | 333 | 965 | 29 |
| /ca/guia/examen-b1-catala-2027 | 200 |  | 0 | 0 | 99 | 302 | 960 | 29 |
| /ca/guia/examen-b2-catala-2027-prova | 200 |  | 0 | 0 | 109 | 319 | 960 | 29 |
| /ca/guia/examen-c1-catala-2027-model | 200 |  | 0 | 0 | 55 | 278 | 962 | 29 |
| /ca/guia/examen-c2-catala-2027 | 200 |  | 0 | 0 | 110 | 321 | 958 | 29 |
| /ca/guia/examens-catala-universitats-cifalc-2027 | 200 |  | 0 | 0 | 115 | 336 | 965 | 29 |
| /ca/guia/expressio-escrita-c1-text-argumentatiu | 200 |  | 0 | 0 | 131 | 335 | 963 | 29 |
| /ca/guia/inscripcio-dpl-catala-gener-2027 | 200 |  | 0 | 0 | 119 | 342 | 965 | 29 |
| /ca/guia/nivell-c1-catala-que-es | 200 |  | 0 | 0 | 103 | 324 | 962 | 29 |
| /ca/guia/on-treure-el-c1-de-catala-lleida | 200 |  | 0 | 0 | 136 | 318 | 964 | 29 |
| /ca/guia/per-i-per-a-examen-c1 | 200 |  | 0 | 0 | 130 | 368 | 964 | 29 |
| /ca/guia/probabilitat-d-aprovar-catala-diagnostic | 200 |  | 0 | 0 | 105 | 327 | 966 | 29 |
| /ca/guia/pronoms-febles-en-hi-examen-catala | 200 |  | 0 | 0 | 156 | 369 | 967 | 29 |
| /ca/guia/prova-oral-c1-catala | 200 |  | 0 | 0 | 114 | 344 | 1049 | 30 |
| /ca/guia/quin-nivell-de-catala-demanen-les-oposicions | 200 |  | 0 | 0 | 129 | 377 | 974 | 29 |
| /ca/guia/us-de-la-llengua-c1-errors-frequents | 200 |  | 0 | 0 | 128 | 323 | 966 | 29 |
| /es | 200 |  | 0 | 0 | 43 | 265 | 947 | 30 |
| /es/comencar | 200 |  | 1 | 1 | 196 | 398 | 915 | 31 |
| /es/preus | 200 |  | 0 | 0 | 99 | 327 | 877 | 29 |
| /es/convocatories | 200 |  | 0 | 0 | 189 | 416 | 919 | 30 |
| /es/guia | 200 |  | 0 | 0 | 157 | 355 | 1093 | 32 |
| /es/simulacre | 200 |  | 0 | 0 | 116 | 315 | 3323 | 36 |
| /es/escriure | 200 |  | 0 | 0 | 98 | 282 | 2679 | 35 |
| /es/oral | 200 |  | 2 | 2 | 192 | 387 | 1217 | 45 |
| /es/practica | 200 |  | 0 | 0 | 117 | 345 | 1041 | 35 |
| /es/guia/calendari-convocatories-catala-2027 | 200 |  | 0 | 0 | 148 | 365 | 970 | 29 |
| /es/guia/castellanismes-mes-frequents-examen-catala | 200 |  | 0 | 0 | 132 | 344 | 974 | 29 |
| /es/guia/catala-administratiu-ics-c1 | 200 |  | 0 | 0 | 99 | 304 | 960 | 29 |
| /es/guia/catala-ajuntaments-oposicions-nivell | 200 |  | 0 | 0 | 239 | 500 | 960 | 29 |
| /es/guia/catala-arrelament-b1-b2-estrangers | 200 |  | 0 | 0 | 92 | 327 | 961 | 29 |
| /es/guia/catala-bombers-generalitat-nivell | 200 |  | 0 | 0 | 124 | 354 | 958 | 29 |
| /es/guia/catala-docents-c2-decret | 200 |  | 0 | 0 | 174 | 409 | 961 | 29 |
| /es/guia/catala-ics-infermeria-c1 | 200 |  | 0 | 0 | 144 | 382 | 959 | 29 |
| /es/guia/catala-ics-tcai-zelador-b1 | 200 |  | 0 | 0 | 109 | 317 | 959 | 29 |
| /es/guia/catala-mossos-esquadra-prova-de-catala | 200 |  | 0 | 0 | 103 | 329 | 959 | 29 |
| /es/guia/catala-oposicions-generalitat-cossos-a1-a2-c1 | 200 |  | 0 | 0 | 138 | 354 | 959 | 29 |
| /es/guia/catala-subaltern-generalitat-b2 | 200 |  | 0 | 0 | 134 | 562 | 959 | 29 |
| /es/guia/certificat-catala-cpnl-equivalencies | 200 |  | 0 | 0 | 153 | 399 | 964 | 29 |
| /es/guia/certificat-catala-salut-prescriu-te-el-catala | 200 |  | 0 | 0 | 102 | 295 | 961 | 29 |
| /es/guia/com-aprovar-el-c1-de-catala-en-3-mesos | 200 |  | 0 | 0 | 130 | 353 | 965 | 29 |
| /es/guia/examen-b1-catala-2027 | 200 |  | 0 | 0 | 97 | 317 | 960 | 29 |
| /es/guia/examen-b2-catala-2027-prova | 200 |  | 0 | 0 | 106 | 331 | 960 | 29 |
| /es/guia/examen-c1-catala-2027-model | 200 |  | 0 | 0 | 143 | 507 | 962 | 29 |
| /es/guia/examen-c2-catala-2027 | 200 |  | 0 | 0 | 123 | 338 | 959 | 29 |
| /es/guia/examens-catala-universitats-cifalc-2027 | 200 |  | 0 | 0 | 100 | 307 | 965 | 29 |
| /es/guia/expressio-escrita-c1-text-argumentatiu | 200 |  | 0 | 0 | 176 | 370 | 964 | 29 |
| /es/guia/inscripcio-dpl-catala-gener-2027 | 200 |  | 0 | 0 | 111 | 321 | 965 | 29 |
| /es/guia/nivell-c1-catala-que-es | 200 |  | 0 | 0 | 118 | 370 | 962 | 29 |
| /es/guia/on-treure-el-c1-de-catala-lleida | 200 |  | 0 | 0 | 138 | 356 | 964 | 29 |
| /es/guia/per-i-per-a-examen-c1 | 200 |  | 0 | 0 | 115 | 309 | 964 | 29 |
| /es/guia/probabilitat-d-aprovar-catala-diagnostic | 200 |  | 0 | 0 | 105 | 303 | 966 | 29 |
| /es/guia/pronoms-febles-en-hi-examen-catala | 200 |  | 0 | 0 | 190 | 393 | 968 | 29 |
| /es/guia/prova-oral-c1-catala | 200 |  | 0 | 0 | 101 | 317 | 1049 | 30 |
| /es/guia/quin-nivell-de-catala-demanen-les-oposicions | 200 |  | 0 | 0 | 177 | 397 | 975 | 29 |
| /es/guia/us-de-la-llengua-c1-errors-frequents | 200 |  | 0 | 0 | 109 | 362 | 966 | 29 |
| /ca/diagnostic | 200 |  | 2 | 2 | 146 | 396 | 1385 | 52 |
| /ca/avui | 200 |  | 1 | 1 | 49 | 295 | 1168 | 46 |
| /ca/practica/mini | 200 |  | 1 | 1 | 151 | 547 | 1181 | 46 |
| /ca/practica/repas | 200 |  | 1 | 1 | 152 | 879 | 1181 | 46 |
| /ca/mapa | 200 |  | 1 | 1 | 73 | 775 | 1162 | 47 |
| /ca/simulacre/c1-simulacre-1 | 200 |  | 1 | 1 | 62 | 310 | 1905 | 46 |
| /ca/pla | 200 |  | 1 | 1 | 105 | 493 | 1270 | 49 |
| /ca/entrar | 200 |  | 0 | 0 | 48 | 266 | 1093 | 42 |
| /ca/compte | 200 | /ca/entrar?seguent=/ca/compte | 0 | 0 | 37 | 384 | 1093 | 44 |
| /ca/contacte | 200 |  | 0 | 0 | 46 | 251 | 1051 | 34 |
| /ca/validesa | 200 |  | 0 | 0 | 68 | 276 | 934 | 30 |
| /ca/legal/avis-legal | 200 |  | 0 | 0 | 84 | 289 | 873 | 29 |
| /ca/legal/privadesa | 200 |  | 0 | 0 | 98 | 354 | 874 | 29 |
| /ca/legal/galetes | 200 |  | 0 | 0 | 66 | 261 | 996 | 34 |
| /ca/legal/condicions | 200 |  | 0 | 0 | 85 | 312 | 873 | 28 |
| /ca/ruta-que-no-existeix-404 | 404 |  | 1 | 1 | 45 | 120 | 348 | 5 |
| /manifest.webmanifest | 200 |  | 0 | 0 | 51 | 149 | 1 | 1 |
| /robots.txt | 200 |  | 0 | 0 | 56 | 149 | 0 | 1 |
| /icon.svg | 200 |  | 0 | 0 | 43 | 135 | 0 | 1 |
| /sw.js | 200 |  | 0 | 0 | 41 | 128 | 1 | 1 |
| / | 200 | /ca | 0 | 0 | 47 | 489 | 947 | 31 |
| /es/avui | 200 |  | 1 | 1 | 187 | 401 | 1169 | 47 |
| /es/diagnostic | 200 |  | 2 | 2 | 161 | 377 | 1386 | 52 |
| /es/entrar | 200 |  | 0 | 0 | 112 | 351 | 1031 | 35 |
| /es/compte | 200 | /es/entrar?seguent=/es/compte | 0 | 0 | 51 | 392 | 1094 | 43 |
| /es/legal/privadesa | 200 |  | 0 | 0 | 80 | 270 | 874 | 29 |
