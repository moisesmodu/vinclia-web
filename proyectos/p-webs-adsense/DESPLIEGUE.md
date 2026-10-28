# Despliegue del proyecto P · para la sesión del Mac

> Escrito por la sesión del proyecto P el 28/10/2026 siguiendo `DESPLIEGUES.md` §4. Esta sesión en la nube no puede
> desplegar: `node scripts/comprobar-entorno.mjs` da bloqueados `api.vercel.com` y los demás servicios, y no hay
> `VERCEL_TOKEN`, `VERCEL_TEAM_ID` ni `LEGAL_*`. PR: https://github.com/moisesmodu/vinclia-web/pull/6, rama
> `claude/p-webs-adsense-fabrica`.

El proyecto P no usa Neon, Stripe ni Resend: son dos sitios estáticos. Solo hacen falta dos proyectos de Vercel, uno por
sitio, en el equipo `moisesmodu-3705s-projects`.

## 1. Datos de cada proyecto

| | Sitio 1 | Sitio 2 |
|---|---|---|
| Proyecto de Vercel | `netoclaro` | `impuestoclaro` |
| Root Directory | `proyectos/p-webs-adsense/fabrica` | `proyectos/p-webs-adsense/fabrica` |
| Framework | Other (ninguno) | Other (ninguno) |
| Install / Build / Output | lo fija `vercel.json`: `npm ci` · `npm run publicar` · `publicar` | igual |
| Node | 22.x | 22.x |
| Rama de producción | `claude/estrategia-ingresos-recurrentes-tx0rvw` (después de fusionar el PR #6) | igual |
| Dominio (cuando Moisés lo compre) | `netoclaro.es` y `www.netoclaro.es` | `impuestoclaro.es` y `www.impuestoclaro.es` |

### Variables de entorno (production y preview)

| Variable | Sitio 1 | Sitio 2 | De dónde sale |
|---|---|---|---|
| `SITIO` | `nomina` | `impuestos` | fijo |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | sí | sí | los secretos `LEGAL_*` del entorno (DESPLIEGUES.md §1). Rellenan el aviso legal y la privacidad. Sin ellos sale `PENDIENTE-NIF`. |
| `SITE_URL` | `https://netoclaro.vercel.app` hasta tener dominio; después se borra | `https://impuestoclaro.vercel.app`, igual | URL que da Vercel |
| `UMAMI_ID` | ID del sitio en Umami | ID del sitio en Umami | opcional: [cloud.umami.is](https://cloud.umami.is) (gratis), añadir los dos sitios |
| `ADSENSE_CLIENT` | `ca-pub-…` | el mismo | cuando Moisés cree la cuenta de AdSense (PARA-MOISES.md, tarea 2) |
| `ADSENSE_SLOT_RESULTADO`, `ADSENSE_SLOT_FINAL` | IDs de bloque | IDs de bloque | AdSense → Anuncios → Por bloque de anuncios, cuando apruebe la cuenta |

## 2. Comandos, en orden (desde la raíz del repositorio)

```bash
git fetch origin && git checkout claude/p-webs-adsense-fabrica   # o la rama base cuando el PR esté fusionado
export T="--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID"

# 2.1 Crear los dos proyectos conectados al repositorio, con su carpeta raíz y la variable SITIO
for par in netoclaro:nomina impuestoclaro:impuestos; do
  nombre=${par%%:*}; sitio=${par##*:}
  curl -sS -X POST "https://api.vercel.com/v10/projects?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"name\":\"$nombre\",\"framework\":null,\"rootDirectory\":\"proyectos/p-webs-adsense/fabrica\",
         \"nodeVersion\":\"22.x\",
         \"gitRepository\":{\"type\":\"github\",\"repo\":\"moisesmodu/vinclia-web\"},
         \"environmentVariables\":[
           {\"key\":\"SITIO\",\"value\":\"$sitio\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"},
           {\"key\":\"SITE_URL\",\"value\":\"https://$nombre.vercel.app\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"},
           {\"key\":\"LEGAL_NOM\",\"value\":\"$LEGAL_NOM\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"},
           {\"key\":\"LEGAL_NIF\",\"value\":\"$LEGAL_NIF\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"},
           {\"key\":\"LEGAL_EMAIL\",\"value\":\"$LEGAL_EMAIL\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"},
           {\"key\":\"LEGAL_ADRECA\",\"value\":\"$LEGAL_ADRECA\",\"target\":[\"production\",\"preview\"],\"type\":\"plain\"}]}"
done

# 2.2 Rama de producción: la rama base de la cartera (Vercel → Project → Settings → Git → Production Branch),
#     o por API si tu versión lo admite:
for nombre in netoclaro impuestoclaro; do
  curl -sS -X PATCH "https://api.vercel.com/v9/projects/$nombre?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d '{"productionBranch":"claude/estrategia-ingresos-recurrentes-tx0rvw"}'
done

# 2.3 Primer despliegue de producción ahora mismo, sin esperar a la fusión (desde la carpeta de la fábrica)
cd proyectos/p-webs-adsense/fabrica
for nombre in netoclaro impuestoclaro; do
  vercel link --yes --project $nombre $T && vercel deploy --prod $T && rm -rf .vercel
done

# 2.4 Comprobación (deben dar 200 y el título del sitio)
curl -s https://netoclaro.vercel.app/calculadora-sueldo-neto/ | grep -o "<title>[^<]*"
curl -s https://impuestoclaro.vercel.app/calculadora-irpf/ | grep -o "<title>[^<]*"
curl -s -o /dev/null -w "%{http_code}\n" https://netoclaro.vercel.app/sitemap.xml
```

`vercel link` solo enlaza la carpeta, porque los proyectos ya existen desde el paso 2.1. Se borra `.vercel` entre uno y
otro porque los dos comparten carpeta. La variable `SITIO` del proyecto decide qué sitio se compila.

## 3. Cuando Moisés compre los dominios

```bash
vercel domains add netoclaro.es netoclaro $T && vercel domains add www.netoclaro.es netoclaro $T
vercel domains add impuestoclaro.es impuestoclaro $T && vercel domains add www.impuestoclaro.es impuestoclaro $T
# Borrar SITE_URL de los dos proyectos (el dominio de sitio.json pasa a ser la URL canónica) y redesplegar:
vercel env rm SITE_URL production --yes $T   # dentro de cada proyecto enlazado
```

En el registrador hay que poner los DNS que indique Vercel: un registro A `76.76.21.21` para el dominio raíz y un
CNAME `cname.vercel-dns.com` para `www`. Si el registrador es DonDominio, Arsys u otro, es un formulario de un minuto
que la sesión del Mac puede rellenar con el navegador de Moisés.

## 4. Al terminar

- Anota las URL de producción en `panel/data/proyectos.json` (p-webs-adsense → `enlaces`) y cambia `estado` a `lanzado`.
- Responde en el PR #6 con las URL, o dímelo con `send_message` a la sesión del proyecto P.
- Search Console: si la sesión del Mac tiene el navegador con la cuenta de Google de Moisés, puede añadir las dos
  propiedades, verificar por DNS y enviar `sitemap.xml`. Si no, queda en PARA-MOISES.md, tarea 3.
