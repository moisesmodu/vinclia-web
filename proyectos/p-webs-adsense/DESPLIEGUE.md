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
| `SITE_URL` | `https://netoclaro.pages.dev` o `https://impuestoclaro.pages.dev` hasta tener dominio; después se borra | hasta tener dominio |
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
for par in netoclaro:nomina impuestoclaro:impuestos; do
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
# Dominios: vercel domains add netoclaro.es netoclaro $T ; vercel domains add impuestoclaro.es impuestoclaro $T
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
