# Despliegue · Proyecto P (para la sesión del Mac, según DESPLIEGUES.md §3)

Comprobador del entorno en la sesión que construyó esto, el 28/10/2026: `api.vercel.com`, `api.cloudflare.com` y los
demás servicios aparecen bloqueados, y no hay `VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN` ni `LEGAL_*`. Por eso no se pudo
desplegar desde la nube. PR #6, rama `claude/p-webs-adsense-fabrica`.

## Qué necesita

- **Dos sitios estáticos**, un proyecto por sitio: `netoclaro` (`SITIO=nomina`) e `impuestoclaro` (`SITIO=impuestos`).
  No necesitan Neon, Stripe ni Resend.
- **Código:** `proyectos/p-webs-adsense/fabrica`. Se instala con `npm ci` y se compila con `npm run publicar`, que deja
  la salida en `publicar/`. Requiere Node 22.
- **Variables:**

| Variable | Valor | Obligatoria |
|---|---|---|
| `SITIO` | `nomina` o `impuestos` | sí |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | secretos del titular (DESPLIEGUES.md §1). Rellenan el aviso legal; sin ellos sale `PENDIENTE-NIF` | sí |
| `SITE_URL` | **`https://netoclaro.app`** (nomina) o **`https://impuestoclaro.es`** (impuestos): dominios propios activos desde el 31/10/2026; son la URL canónica, del sitemap y de `hreflang`. Los `*.vercel.app` siguen sirviendo **sin redirección** (la canónica ya apunta al dominio) | sí |
| `GOOGLE_SITE_VERIFICATION` (o `GSC_VERIFICACION`) | Valor de la metaetiqueta `google-site-verification` de Search Console, **uno por sitio** (propiedad de prefijo de URL). Si Moisés verifica por DNS (propiedad de dominio, TXT en Vercel DNS) no hace falta | no |
| `VERCEL_ANALYTICS` | Vercel Web Analytics (sin cookies) se carga solo cuando el build corre en Vercel (`VERCEL=1`); `1` lo fuerza y `0` lo apaga. Está activado en el panel de los dos proyectos | no |
| `UMAMI_ID` | ID de cada sitio en [cloud.umami.is](https://cloud.umami.is), gratis | no |
| `ADSENSE_CLIENT` | `ca-pub-…` que mande Moisés | cuando lo mande |
| `ADSENSE_SLOT_RESULTADO`, `ADSENSE_SLOT_FINAL` | IDs de los bloques «bajo-resultado» y «fin-contenido», que se crean en AdSense cuando apruebe la cuenta | cuando existan |
| `AFILIADO_<ID>` (`AFILIADO_QUIPU`, `AFILIADO_XOLO`, `AFILIADO_QONTO`…) | Enlace de afiliado `https://…` que mande Moisés (ids en `fabrica/afiliados.json`). Enciende el bloque «Publicidad · Enlace patrocinado» en las calculadoras de ese programa | cuando lo mande |

## Camino A (recomendado) · Cloudflare Pages, gratis y con uso comercial

El flujo `.github/workflows/p-webs-adsense.yml` ya compila y publica los dos sitios en cada push a la rama base, en
cuanto existen los secretos. La sesión del Mac solo hace la configuración inicial.

```bash
# A.1 Crear los dos proyectos de Pages (producción = rama «main» de Pages; se publican por subida directa)
export CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…     # DESPLIEGUES.md §1
npx wrangler@3 pages project create netoclaro --production-branch main
npx wrangler@3 pages project create impuestoclaro --production-branch main

# A.2 Secretos y variables del repositorio para el flujo de GitHub Actions
gh secret set CLOUDFLARE_API_TOKEN -R moisesmodu/vinclia-web --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID -R moisesmodu/vinclia-web --body "$CLOUDFLARE_ACCOUNT_ID"
for v in LEGAL_NOM LEGAL_NIF LEGAL_EMAIL LEGAL_ADRECA; do gh secret set $v -R moisesmodu/vinclia-web --body "${!v}"; done
gh variable set SITE_URL_NOMINA -R moisesmodu/vinclia-web --body "https://netoclaro.pages.dev"
gh variable set SITE_URL_IMPUESTOS -R moisesmodu/vinclia-web --body "https://impuestoclaro.pages.dev"
# Opcionales: UMAMI_ID_NOMINA, UMAMI_ID_IMPUESTOS; más tarde ADSENSE_CLIENT y
# ADSENSE_SLOT_{RESULTADO,FINAL}_{NOMINA,IMPUESTOS}

# A.3 Primer despliegue sin esperar a la fusión del PR #6 (desde el Mac)
git fetch origin && git checkout claude/p-webs-adsense-fabrica && cd proyectos/p-webs-adsense/fabrica && npm ci
SITIO=nomina SITE_URL=https://netoclaro.pages.dev npm run publicar && npx wrangler@3 pages deploy publicar --project-name netoclaro --branch main
SITIO=impuestos SITE_URL=https://impuestoclaro.pages.dev npm run publicar && npx wrangler@3 pages deploy publicar --project-name impuestoclaro --branch main
# (con los LEGAL_* exportados en el terminal; después de fusionar, cada push a la base publica solo)

# A.4 Dominios, cuando Moisés los compre: añadir y apuntar el DNS que indique Cloudflare
for par in netoclaro:netoclaro.es impuestoclaro:impuestoclaro.es; do
  curl -sS -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/${par%%:*}/domains" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"${par##*:}\"}"
done
gh variable delete SITE_URL_NOMINA -R moisesmodu/vinclia-web; gh variable delete SITE_URL_IMPUESTOS -R moisesmodu/vinclia-web
```

Para los .es, en el registrador basta un CNAME (o un ALIAS en la raíz) hacia `netoclaro.pages.dev` e
`impuestoclaro.pages.dev`. También se puede pasar la gestión de DNS a Cloudflare, que es gratis.

## Camino B (alternativa) · Vercel Pro (previsto en la cartera)

`proyectos/p-webs-adsense/fabrica/vercel.json` ya fija la instalación, la compilación y la salida.

```bash
export T="--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID"
git fetch origin && git checkout claude/p-webs-adsense-fabrica && cd proyectos/p-webs-adsense/fabrica
for par in netoclaro:nomina impuestoclaro:impuestos chequeclaro:eeuu; do
  n=${par%%:*}; s=${par##*:}
  vercel project add $n $T
  vercel link --yes --project $n $T
  printf "$s" | vercel env add SITIO production $T
  printf "https://$n.vercel.app" | vercel env add SITE_URL production $T
  for v in LEGAL_NOM LEGAL_NIF LEGAL_EMAIL LEGAL_ADRECA; do printf "${!v}" | vercel env add $v production $T; done
  vercel deploy --prod --yes $T
  rm -rf .vercel          # los dos proyectos comparten carpeta
done
# Root Directory = proyectos/p-webs-adsense/fabrica y rama de producción = la base, en Project → Settings → Git,
# si se conectan al repositorio para desplegar en cada push.
# Dominios: vercel domains add netoclaro.es netoclaro $T ; vercel domains add impuestoclaro.es impuestoclaro $T ; vercel domains add chequeclaro.com chequeclaro $T
```

## Comprobación tras desplegar

Las tres primeras deben dar 200 y el título del sitio. Sustituye por `*.vercel.app` en el camino B.

```bash
curl -s https://netoclaro.pages.dev/calculadora-sueldo-neto/ | grep -o "<title>[^<]*"
curl -s https://impuestoclaro.pages.dev/calculadora-irpf/ | grep -o "<title>[^<]*"
curl -s -o /dev/null -w "%{http_code}\n" https://netoclaro.pages.dev/sitemap.xml
curl -s https://netoclaro.pages.dev/aviso-legal/ | grep -c "PENDIENTE-NIF"   # debe dar 0
```

Después, abre una calculadora en el móvil y cambia una cifra: el resultado se actualiza al momento.

## Después

- Anota las URL en `panel/data/proyectos.json`, en la ficha `p-webs-adsense`, dentro de `enlaces`, y cambia `estado`
  a `lanzado`.
- Cuando Moisés mande el `ca-pub-…`, ponlo como variable `ADSENSE_CLIENT` del repositorio (A) o del proyecto (B) y
  redespliega.
  Activa los anuncios automáticos en AdSense. Cuando cree los bloques «bajo-resultado» y «fin-contenido», pon sus IDs
  en `ADSENSE_SLOT_RESULTADO` y `ADSENSE_SLOT_FINAL` y redespliega. No hay que tocar código (MONETIZACION.md).
- Correo (DESPLIEGUES.md §6): `LEGAL_EMAIL=hola@numimates.com` y **no** definas `LEGAL_EMAIL_SITIO` hasta tener los
  dominios. Sin variable, el código ya usa hola@numimates.com.
- Añade al final de este archivo: `Ejecutado el <fecha>`.

Ejecutado el 28/10/2026 desde la sesión del Mac, camino B (Vercel Pro): https://netoclaro.vercel.app/ e https://impuestoclaro.vercel.app/ con SITIO, SITE_URL y LEGAL_* en production.

### Redespliegue (sesión del Mac, 28-10-2026, 04:09)
Redesplegados `netoclaro` e `impuestoclaro` con el commit bef9859 (marca de la familia Claro), desde `proyectos/p-webs-adsense/fabrica`. Comprobado: calculadoras con título 2027 y aviso legal sin `PENDIENTE-NIF`.

Ejecutado el 2026-10-28

### Redespliegue (sesión del Mac, 28-10-2026, 04:49)
Redesplegados `netoclaro` e `impuestoclaro` con el commit b542950 (correo hola@numimates.com) y `LEGAL_EMAIL=hola@numimates.com` en production (DESPLIEGUES.md §6): el aviso legal ya no muestra el correo personal.

Ejecutado el 2026-10-28

## Redespliegue del 28/10 por la noche (rediseño + sitio 3)

El PR #6 trae el rediseño de la fábrica, los bloques de afiliación y el **sitio 3, ChequeClaro** (`SITIO=eeuu`, finanzas
de EE. UU. en español, USD, solo castellano).

1. Redesplegar `netoclaro` e `impuestoclaro` desde la rama `claude/p-webs-adsense-fabrica`, con el camino B y las mismas
   variables.
2. Crear `chequeclaro` con el mismo bucle del camino B: `SITIO=eeuu` y `SITE_URL=https://chequeclaro.vercel.app`.
3. Anotar las URL en el panel y escribir aquí «Ejecutado el …».

### Redespliegue y sitio 3 (sesión del Mac, 29-10-2026, 13:22)
- `netoclaro` e `impuestoclaro` redesplegados con el commit 7c82651 (rediseño y bloques de afiliación).
- `chequeclaro` creado con el camino B (`SITIO=eeuu`, `LEGAL_*` con `LEGAL_EMAIL=hola@numimates.com`). **Ojo:**
  `chequeclaro.vercel.app` ya era de otra cuenta de Vercel (una web ajena, «El Cheque Claro»), así que el sitio está en
  **https://cheque-claro.vercel.app** y `SITE_URL` apunta ahí (la URL canónica y el sitemap usan esa dirección). Vercel le dio
  también `chequeclaro-rho.vercel.app`.
- Comprobado: los tres sitios dan 200 con su título y su sitemap, y el aviso legal muestra hola@numimates.com.
- Panel: `enlaces.ChequeClaro` añadido en la ficha `p-webs-adsense`.

Ejecutado el 2026-10-29

## Portal CalculaClaro (puerta de entrada a toda la familia)

`SITIO=portal` genera una portada con buscador de las 57 calculadoras y enlaces por interés a cada sitio
(`scripts/portal.mjs`, que lee `familia.json`). Se crea como un proyecto más del camino B:

```bash
n=calculaclaro; vercel project add $n $T && vercel link --yes --project $n $T
printf "portal" | vercel env add SITIO production $T
printf "https://calculaclaro.vercel.app" | vercel env add PORTAL_URL production $T
for v in LEGAL_NOM LEGAL_NIF LEGAL_EMAIL LEGAL_ADRECA; do printf "${!v}" | vercel env add $v production $T; done
vercel deploy --prod --yes $T && rm -rf .vercel
```

Cuando cambie la dirección de un sitio, por ejemplo al conectar un dominio, se edita su `url` en `fabrica/familia.json`.
Después se redespliegan los sitios, porque el pie «Familia Claro» de cada uno enlaza a los demás, y también el portal.
Si el proyecto `calculaclaro` sale con otro nombre, como pasó con `cheque-claro`, hay que poner su URL en
`familia.json` → `portal.url`.

Portal ejecutado el 29/10/2026 desde la sesión en la nube (salida ya compilada, Build Output API): https://calculaclaro.vercel.app/ (proyecto `calculaclaro`). Pendiente: redesplegar netoclaro, impuestoclaro y chequeclaro para que salga el pie «Familia Claro».

### Redespliegue para el pie «Familia Claro» (sesión del Mac, 30-10-2026, 13:15)
`netoclaro`, `impuestoclaro` y `chequeclaro` redesplegados con el commit 6c21b92 (rediseño y portal). Comprobado: los tres
dan 200 y su pie «Familia Claro» enlaza a NetoClaro, ImpuestoClaro, ChequeClaro (https://cheque-claro.vercel.app) y al
portal https://calculaclaro.vercel.app.

Ejecutado el 2026-10-30

## 31/10: HogarClaro (sitio 4), calendario laboral 2027 y 600 páginas nuevas

El PR #6 (commit siguiente a 11a5d38) trae el sitio 4 **HogarClaro** (`SITIO=vivienda`), el calendario laboral 2027 de
NetoClaro y unas 700 páginas nuevas en NetoClaro, ImpuestoClaro y ChequeClaro.

1. Crear el proyecto `hogarclaro` con el camino B: `SITIO=vivienda`, `SITE_URL=https://hogarclaro.vercel.app` y
   los `LEGAL_*`. Si la URL sale con otro nombre, ponla en `fabrica/familia.json` (sitio `vivienda`, campo `url`).
2. Borrar el proyecto `pisoclaro` de Vercel. Lo creó la sesión en la nube antes de cambiar el nombre. Está en
   pisoclaro-three.vercel.app con la canónica mal puesta, porque pisoclaro.vercel.app es de otra web.
3. Redesplegar `netoclaro`, `impuestoclaro`, `chequeclaro` y `calculaclaro` (`SITIO=portal`, `PORTAL_URL=https://calculaclaro.vercel.app`).
   Así tienen las páginas nuevas y el pie «Familia Claro» con HogarClaro.

### HogarClaro y redespliegue de la familia (sesión del Mac, 31-10-2026, 01:14)
- Paso 1: `hogarclaro` creado con el camino B (`SITIO=vivienda`, `SITE_URL=https://hogarclaro.vercel.app`, `LEGAL_*` con
  `LEGAL_EMAIL=hola@numimates.com`). Vercel le dio esa misma dirección, así que `familia.json` no cambia.
- Paso 3: `netoclaro`, `impuestoclaro`, `chequeclaro` y `calculaclaro` redesplegados con el commit 9ba1791. `calculaclaro`
  no tenía variables (se subió ya compilado): ahora tiene `SITIO=portal`, `PORTAL_URL`/`SITE_URL=https://calculaclaro.vercel.app`
  y `LEGAL_*`, y se compila desde la rama como los demás.
- Comprobado: los cinco dan 200, su pie «Familia Claro» enlaza a los otros cuatro (también HogarClaro), el aviso legal muestra
  hola@numimates.com y `/calendario-laboral-2027/` de NetoClaro responde.
- Paso 2, pendiente (Moisés): borrar el proyecto `pisoclaro` en vercel.com → pisoclaro → Settings → Delete Project. Es un borrado
  definitivo, así que no lo hace la sesión.
- Panel: `enlaces.HogarClaro` añadido en la ficha `p-webs-adsense`.

Ejecutado el 2026-10-31

## SEO del 31/10/2026 (sesión de marketing): dominios propios, analítica y verificación

Hecho en el código (rama `claude/p-webs-adsense-fabrica`):

- **Vercel Web Analytics**: `src/layouts/Base.astro` carga `/_vercel/insights/script.js` (diferido, sin cookies) cuando el
  build corre en Vercel. Ya está activado en el panel de `netoclaro` e `impuestoclaro`; empieza a contar visitas y
  `utm_*` en cuanto se redespliegue.
- **Search Console**: la metaetiqueta sale con `GOOGLE_SITE_VERIFICATION` (o la antigua `GSC_VERIFICACION`). Alternativa
  sin redespliegue: propiedad de **dominio** y TXT en los DNS de Vercel (`scripts/search-console-txt.mjs` de la raíz del
  repositorio). Después: Search Console → Sitemaps → `https://netoclaro.app/sitemap.xml` y
  `https://impuestoclaro.es/sitemap.xml`.
- **Contenido**: la calculadora de paga extra (`/calculadora-paga-extra/` y `/ca/calculadora-paga-extra/`) lleva la guía
  «Paga extra de Navidad 2026» con ejemplo, 4 FAQ nuevas y título con el año.
- **AdSense**: con los dominios propios ya se puede solicitar la cuenta para `netoclaro.app` (y después
  `impuestoclaro.es`). Cuando llegue el `ca-pub-…`: `ADSENSE_CLIENT` en production y redesplegar; nada más.

Redespliegue pendiente (sesión del Mac o quien tenga permiso de despliegue), desde la raíz del repositorio en esta rama:

```bash
git fetch origin && git checkout claude/p-webs-adsense-fabrica
T="--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID"
for n in netoclaro impuestoclaro; do
  npx vercel@latest link --yes --project $n $T && npx vercel@latest deploy --prod --yes $T && rm -rf .vercel
done
# Comprobar: la portada carga /_vercel/insights/script.js y la canónica es el dominio propio
curl -s https://netoclaro.app/ | grep -o '_vercel/insights[^"]*\|<link rel="canonical"[^>]*>'
```

## Productos de pago propios (rama `claude/p-productos-digitales`)

Cuatro productos digitales que cobran desde la primera visita, sin backend (detalle en MONETIZACION.md):

| Variable (Production) | Proyecto Vercel | Producto | Precio |
|---|---|---|---|
| `PAGO_KIT_AUTONOMO_2027_URL` | impuestoclaro | Kit del autónomo 2027 | 9,90 € |
| `PAGO_PACK_DESPIDO_URL` | netoclaro | Pack despido y finiquito | 6,90 € |
| `PAGO_COMPARADOR_HIPOTECAS_URL` | hogarclaro | Comparador de hipotecas | 6,90 € |
| `PAGO_PLANIFICADOR_TAXES_2026_URL` | chequeclaro | Planificador de taxes 2026 | 7,99 $ |

1. **Modo real** (solo con el visto bueno de Moisés): desde `fabrica/`, con los dominios definitivos para que Stripe
   redirija a la página de descarga correcta:
   ```bash
   SITE_URL_NOMINA=https://netoclaro.app SITE_URL_IMPUESTOS=https://impuestoclaro.es \
   SITE_URL_VIVIENDA=https://hogarclaro.es SITE_URL_EEUU=https://chequeclaro.com \
   node scripts/stripe-productos.mjs --real
   ```
   (Sin `SITE_URL_<SITIO>` usa la URL de `familia.json`.) Imprime las cuatro `PAGO_…_URL=https://buy.stripe.com/…`.
2. Pegar cada variable en el proyecto de Vercel que toca (Production) y redesplegar ese proyecto. Sin la variable, la
   página dice «Disponible muy pronto» y bajo las calculadoras sigue el bloque de afiliado (si lo hay).
3. Comprobar: compra real de 6,90 € con tarjeta propia → la redirección lleva a `/descarga/<token>/` → descargar los
   dos archivos → reembolsar desde el panel de Stripe.

Si se cambia de dominio, basta volver a ejecutar el script con el `SITE_URL_<SITIO>` nuevo: actualiza la redirección
del mismo enlace (no hay que cambiar la variable). Regenerar los archivos: `node scripts/productos/generar.mjs`.
