# Para Moisés · Proyecto P (webs de herramientas con AdSense)

Tareas que exigen a una persona. El despliegue (Cloudflare Pages o Vercel), las variables y la analítica los hace la
sesión del Mac con `DESPLIEGUE.md`. No hace falta que crees proyectos ni pegues claves.

## 1. Comprar los dominios (mañana, 10 minutos)

No he podido comprobar desde aquí si están libres, porque la red bloquea los registros de dominios. Compra la primera
opción libre de cada fila en [DonDominio](https://www.dondominio.com/es/) o en tu registrador habitual.

| Prioridad | Sitio | Opción 1 (la que lleva el código) | Opción 2 | Opción 3 | Precio aproximado |
|---|---|---|---|---|---|
| ✅ Hecho | 1 · NetoClaro (nómina y laboral) | **netoclaro.app** (activo desde el 31/10) | — | — | — |
| ✅ Hecho | 2 · ImpuestoClaro (impuestos y autónomos) | **impuestoclaro.es** (activo desde el 31/10) | — | — | — |
| Recomendado, porque ya se está construyendo | 3 · ChequeClaro (finanzas de EE. UU. en español) | **chequeclaro.com** | taxesclaros.com | nominaclara.com | 10–15 €/año |
| Recomendado | Portal CalculaClaro (buscador de todas las calculadoras y puerta a cada sitio) | **calculaclaro.com** | calculaclaro.es | numerosclaros.com | 10–15 €/año |
| Recomendado, ya construido | 4 · HogarClaro (vivienda e hipotecas) | **hogarclaro.es** | hogarclaro.com | casaclara.es | 8–12 €/año |
| Opcional, para reservar el nombre | 5 · MotorClaro (coche) | motorclaro.es | cocheclaro.es | circulaclaro.es | 8–12 €/año |

- **Coste:** los dos imprescindibles suman unos 20 € al año. Los cinco juntos, unos 50 € al año.
- **«claro.com» no es posible:** «Claro» es la marca de telecomunicaciones de América Móvil, que tiene ese dominio.
  Por eso el portal se llama CalculaClaro, un nombre compuesto como el de los sitios.
- **Marcas que he cambiado:**
  - Para el sitio 2 he descartado «CuentaClara», porque ABANCA tiene cuentas «Cuenta Clara» para autónomos.
  - Para el sitio 4 he descartado «HipotecaClara», porque existe un curso de pago llamado «Método Hipoteca Clara», y
    «PisoClaro», porque ya hay una web de reseñas de pisos con ese nombre. Queda **HogarClaro**.
- **Después de comprar:** dime qué dominios has comprado. La sesión del Mac los conecta a Vercel con
  `DESPLIEGUE.md`. Si el registrador te pide DNS, son estos dos registros:
  - un registro **A** en `@` con el valor `76.76.21.21`;
  - un registro **CNAME** en `www` con el valor `cname.vercel-dns.com`.

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

## 4. NIF para el aviso legal (30 segundos, solo si hace falta)

La ley obliga a mostrar el NIF del titular. Si la sesión del Mac ya tiene el secreto `LEGAL_NIF`, no hagas nada. Si no
lo tiene, escribe en el PR #6 el NIF que quieras usar.

## 5. Afiliación: darte de alta en 3 programas (10 minutos cada uno, gratis)

Es la vía más rápida al primer euro, porque una sola alta de un autónomo vale más que miles de visitas con AdSense.
Los bloques ya están en las calculadoras de ImpuestoClaro y NetoClaro. Están apagados y se encienden solos en cuanto
haya enlace. El detalle de cada programa está en `AFILIACION.md`.

1. **Quipu**: [getquipu.com/es/referral](https://getquipu.com/es/referral). Paga el 30 % durante 12 meses. Va en la
   factura, el IVA, el 303, el 130 y Verifactu.
2. **Xolo**: [xolo.io/es-en/affiliate-program](https://www.xolo.io/es-en/affiliate-program). Paga 29 € por cliente. Va
   en el neto de autónomo, el precio por hora y «¿autónomo o asalariado?».
3. **Qonto**: [qonto.com/es/affiliate](https://qonto.com/es/affiliate). Paga 20 € por cuenta activa. Va en la tarifa
   plana.

Cuando te den cada enlace de afiliado, pégalo en el PR o en un mensaje. La sesión del Mac lo pone como
`AFILIADO_QUIPU`, `AFILIADO_XOLO` o `AFILIADO_QONTO` y redespliega.
