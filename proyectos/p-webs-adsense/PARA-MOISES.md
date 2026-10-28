# Para Moisés · Proyecto P (webs de herramientas con AdSense)

Tres tareas que exigen a una persona. El despliegue en Vercel, los datos del aviso legal y la analítica los hace la
sesión del Mac con `DESPLIEGUE.md`. No hace falta que crees proyectos ni pegues claves.

## 1. Comprar los 2 dominios (5 minutos, unos 8–12 € al año cada uno)

He propuesto tres opciones por sitio, en orden de preferencia. Desde la sesión en la nube no he podido comprobar si
están libres, porque el registro de dominios está bloqueado por la red. Compra la primera libre de cada lista en
[DonDominio](https://www.dondominio.com/es/) o en cualquier registrador de .es, y dímelo. La sesión del Mac la conecta
a Vercel.

| Sitio | Opción 1 (la que lleva el código) | Opción 2 | Opción 3 |
|---|---|---|---|
| 1 · Nómina y laboral («NetoClaro») | **netoclaro.es** | calculanomina.es | sounet.es |
| 2 · Impuestos y autónomos («ImpuestoClaro») | **impuestoclaro.es** | cuotaclara.es | irpfacil.es |
| 3 · Finanzas de EE. UU. en español (dentro de 6–8 semanas; **no comprar aún**) | chequeclaro.com | taxesclaros.com | nominaclara.com |

He descartado «CuentaClara» para el sitio 2 porque ABANCA tiene cuentas «Cuenta Clara» para autónomos.

## 2. AdSense: cuenta, código y mensaje de consentimiento (10 minutos)

Hazlo cuando netoclaro.es ya cargue.

1. Ve a [adsense.google.com/start](https://adsense.google.com/start/) y añade **netoclaro.es**.
2. Copia tu identificador de editor (`ca-pub-1234567890123456`) en el PR o en un mensaje. La sesión lo pone como
   `ADSENSE_CLIENT` en los dos proyectos.
   - Así se activan la verificación, `ads.txt`, el consentimiento de Google y los anuncios.
3. En AdSense ve a **Privacidad y mensajes → RGPD → Crear mensaje**. Elige los dos sitios y los idiomas castellano y
   catalán, y pulsa **Publicar**.
   - Es la gestión de consentimiento gratuita y certificada TCF 2.2 de Google, obligatoria en Europa.

## 3. Search Console (3 minutos)

1. Ve a [search.google.com/search-console](https://search.google.com/search-console). Pulsa
   **Añadir propiedad → Dominio** con `netoclaro.es` y después con `impuestoclaro.es`.
2. Verifica cada una con el registro TXT que te dé Google en el registrador. La sesión del Mac puede hacerlo por ti si
   tiene tu navegador abierto.
3. En **Sitemaps** envía `https://netoclaro.es/sitemap.xml` y `https://impuestoclaro.es/sitemap.xml`.

Para que el informe semanal lea los datos, conecta Search Console en claude.ai (**Ajustes → Conectores**) si aparece.
