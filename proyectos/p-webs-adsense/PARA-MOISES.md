# Para Moisés · Proyecto P (webs de herramientas con AdSense)

Cinco tareas, en este orden. Las tres que pediste son las tareas 1, 4 y 5. Las tareas 2 y 3 las exigen la plataforma y la ley: en esta sesión no hay credenciales de Cloudflare ni de Vercel, y el aviso legal necesita tu NIF.

## 1. Comprar los 2 dominios (5 minutos, unos 8–12 € al año cada uno)

He propuesto tres opciones por sitio, en orden de preferencia. Desde esta sesión no he podido comprobar si están libres, porque el proxy bloquea el registro de dominios. Compra la primera libre de cada lista en [DonDominio](https://www.dondominio.com/es/), [Arsys](https://www.arsys.es/dominios) o cualquier registrador de .es.

| Sitio | Opción 1 (la que lleva el código) | Opción 2 | Opción 3 |
|---|---|---|---|
| 1 · Nómina y laboral («NetoClaro») | **netoclaro.es** | calculanomina.es | sounet.es |
| 2 · Impuestos y autónomos («ImpuestoClaro») | **impuestoclaro.es** | cuotaclara.es | irpfacil.es |
| 3 · Finanzas de EE. UU. en español (dentro de 6–8 semanas; **no comprar aún**) | chequeclaro.com | taxesclaros.com | nominaclara.com |

Si compras otra opción, dímelo: se cambia una línea en `fabrica/sitios/<sitio>/sitio.json`.

He descartado «CuentaClara» para el sitio 2 porque ABANCA comercializa cuentas «Cuenta Clara» para autónomos.

## 2. Publicar en Cloudflare Pages (4 minutos, gratis)

He elegido Cloudflare Pages en lugar de Vercel porque su plan gratuito permite uso comercial y el de Vercel no. Así no hay gasto nuevo.

1. Crea la cuenta en [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Ve a **Workers & Pages → Create → Pages → Connect to Git** y elige `moisesmodu/vinclia-web`.
3. Crea un proyecto por sitio con estos datos:

| Campo | Sitio 1 | Sitio 2 |
|---|---|---|
| Project name | `netoclaro` | `impuestoclaro` |
| Production branch | `claude/estrategia-ingresos-recurrentes-tx0rvw` | igual |
| Root directory | `proyectos/p-webs-adsense/fabrica` | igual |
| Build command | `npm run publicar` | igual |
| Build output directory | `publicar` | igual |
| Variables de entorno | `SITIO=nomina`, `NODE_VERSION=22` | `SITIO=impuestos`, `NODE_VERSION=22` |

4. En cada proyecto, entra en **Custom domains** y añade el dominio que compraste. Cloudflare te dice qué DNS poner en el registrador.

Antes de tener dominio, cada proyecto queda en una URL temporal `https://netoclaro.pages.dev` e `https://impuestoclaro.pages.dev`.

**Opcional:** para activar la analítica sin cookies, crea una cuenta gratuita en [cloud.umami.is](https://cloud.umami.is/signup) y añade los dos sitios. Después pega el «Website ID» de cada uno como variable `UMAMI_ID` en su proyecto de Cloudflare. Hasta entonces el sitio funciona igual, solo que sin estadísticas.

## 3. Tu NIF para el aviso legal (30 segundos)

La Ley de Servicios de la Sociedad de la Información obliga a mostrar el NIF del titular. Respóndeme con el NIF que quieras usar, el tuyo de autónomo o el de tu empresa, y lo pongo en los dos `sitio.json`. Ahora mismo pone `PENDIENTE-NIF`.

## 4. AdSense: cuenta, código y mensaje de consentimiento (10 minutos)

Hazlo cuando el sitio 1 ya cargue en su dominio.

1. Ve a [adsense.google.com/start](https://adsense.google.com/start/) y añade **netoclaro.es**.
2. Copia tu identificador de editor, con formato `ca-pub-1234567890123456`. Pégalo como variable `ADSENSE_CLIENT` en los dos proyectos de Cloudflare, o mándamelo y lo pongo yo.
   - El código ya genera la etiqueta de verificación, el archivo `ads.txt`, el consentimiento de Google y los huecos de anuncio.
3. En AdSense ve a **Privacidad y mensajes → RGPD → Crear mensaje**. Elige los dos sitios y los idiomas castellano y catalán, y pulsa **Publicar**.
   - Es la gestión de consentimiento gratuita y certificada TCF 2.2 de Google, obligatoria en Europa.
4. Cuando Google apruebe la cuenta, crea en **Anuncios → Por bloque de anuncios** dos bloques «Display» llamados `bajo-resultado` y `fin-contenido`. Pásame sus identificadores, que van en `ADSENSE_SLOT_RESULTADO` y `ADSENSE_SLOT_FINAL`.

## 5. Search Console (3 minutos)

1. Ve a [search.google.com/search-console](https://search.google.com/search-console). Pulsa **Añadir propiedad → Dominio** y escribe `netoclaro.es`.
2. Elige verificar con Cloudflare: es un clic si el DNS ya está allí.
3. En **Sitemaps** envía `https://netoclaro.es/sitemap.xml`.
4. Repite los tres pasos con `impuestoclaro.es`.

Para que la tarea semanal lea los datos, añade en claude.ai el conector de Google Search Console si está disponible: **Ajustes → Conectores**. Si no lo está, el informe semanal se basa en el sitemap y en la indexación comprobada con `site:` y te avisa.
