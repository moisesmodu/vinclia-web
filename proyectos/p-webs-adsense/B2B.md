# B2B · Widget de las calculadoras Claro para profesionales

Línea de ingresos que no depende de AdSense. Las calculadoras de NetoClaro, ImpuestoClaro, ChequeClaro y HogarClaro se
incrustan en webs de terceros:

- **Gratis**, con un enlace «Calculadora de NetoClaro» (follow): nos trae enlaces entrantes y visitas.
- **Profesional**, 9 €/mes o 90 €/año, IVA incluido, 1 dominio: sin enlace, con su logo y sus colores, y aviso por
  correo de cambios normativos.
- **Agencia**, 29 €/mes, IVA incluido: hasta 10 dominios (gestorías con varias webs, agencias que hacen webs de
  gestorías e inmobiliarias).

Página: `/para-profesionales/` en cada sitio. Código y alta de clientes: README, «Widget para profesionales».
**Regla dura: no se envía ningún correo ni mensaje a terceros sin aprobación de Moisés.** Este documento deja la lista
y la plantilla preparadas; el envío lo hace él.

## 1. Perfiles de cliente

| Perfil | Qué calculadoras | Por qué paga | Plan |
|---|---|---|---|
| **Gestoría o asesoría laboral** (2–15 personas, web propia en WordPress) | Sueldo neto, finiquito, despido, paro, coste empresa, cuota de autónomos | Sus clientes preguntan lo mismo cada semana. La calculadora en su web responde, retiene la visita y genera citas. No pueden mantener al día el SMI, el IRPF y las cotizaciones | Profesional |
| **Asesoría fiscal / de autónomos** | IRPF, IVA, 303, 130, factura, tarifa plana, neto de autónomo | Picos de consulta en cada trimestre y en la renta | Profesional |
| **Inmobiliaria o intermediario hipotecario** | Simulador de hipoteca, gastos de compraventa, ITP, plusvalía | El comprador calcula sin salir de su web; la calculadora con su marca le da imagen | Profesional |
| **Agencia web de despachos y pymes** | Cualquiera | Lo revenden a varios clientes como «calculadora siempre al día» | Agencia |
| **Banco pequeño, cooperativa de crédito, caja rural** | Hipoteca, depósitos, sueldo neto | Necesitan contenido útil y no tienen equipo para mantenerlo | Agencia o acuerdo a medida |
| **Blog de finanzas personales, medios locales, sindicatos y asociaciones de autónomos** | Sueldo neto, paro, renta | Contenido útil gratis | **Gratis** (nos interesa por el enlace) |
| **Asesores y *tax preparers* hispanos en EE. UU.** | Cheque de pago, reembolso, 1099 | Igual que una gestoría, en español | Profesional (ChequeClaro) |

## 2. El mensaje

> **Las calculadoras que tus clientes buscan en Google, dentro de tu web y siempre al día.**
> Sueldo neto, finiquito, IRPF, cuota de autónomos, hipoteca… Las copias en un minuto, se ven bien en el móvil y,
> cuando cambia el SMI o el IRPF, se actualizan solas. Gratis con un enlace pequeño, o con tu marca por 9 € al mes.

Tres argumentos, en este orden:

1. **Ahorra tiempo:** «¿cuánto me queda neto?» y «¿cuánto es mi finiquito?» se contestan solos, y la consulta que
   llega ya trae los números.
2. **Siempre al día:** cuando cambia una norma, el cambio llega a todas las webs. Un plugin de WordPress no lo hace.
3. **Sin riesgos:** sin cookies, sin anuncios dentro del widget y sin datos personales (todo se calcula en el
   navegador del visitante). Cancela en un clic.

Lo que no decimos: que sustituye al asesor. Al contrario, el widget le trae clientes con la pregunta hecha.

## 3. Cómo encontrar 50 gestorías y asesorías con web propia y sin calculadora

Objetivo: una hoja con 50 candidatas, **25 de Cataluña y 25 del resto de España**, revisadas a mano. La prepara una
sesión (o Moisés) en unas 2 horas; no se contacta a nadie hasta que Moisés la apruebe.

**Fuentes (públicas, sin comprar bases de datos):**

1. **Google Maps y búsqueda local:** «gestoría Lleida», «assessoria laboral Girona», «asesoría autónomos Zaragoza»…
   Ciudades medianas primero (Lleida, Girona, Tarragona, Reus, Manresa, Vic, Terrassa, Sabadell; fuera: Zaragoza,
   Valladolid, Murcia, Córdoba, Castellón, Logroño, Pamplona, Albacete). En capitales grandes hay mucha competencia y
   agencias que ya les venden calculadoras.
2. **Directorios de colegios profesionales:** Col·legi de Gestors Administratius de Catalunya, Consejo General de
   Colegios de Gestores Administrativos, colegios de graduados sociales (Barcelona, Lleida, Girona, Tarragona) y REAF
   (asesores fiscales). Dan nombre y web de cada despacho.
3. **Buscador con huella de WordPress:** `"gestoría" "asesoría laboral" inurl:blog` y similares, para encontrar
   despachos que publican artículos (son los que más ganan con una calculadora junto a cada artículo).

**Filtro de cada candidata (2 minutos por web):**

| Comprobación | Cómo | Se queda si… |
|---|---|---|
| Web propia y viva | Abrir la web; mirar el año del pie o del último artículo | Actualizada en 2025–2026 |
| Sin calculadora | Buscar en Google `site:<dominio> calculadora` y `site:<dominio> simulador`; mirar el menú | No tiene, o tiene una tabla estática o un PDF |
| Publica contenido | Sección blog/noticias con artículos de nómina, renta o autónomos | Tiene al menos 3 artículos en el último año |
| Gestor de contenidos | Ver el código (`wp-content`) o Wappalyzer | WordPress, Wix o similar: pegar el código es trivial |
| Contacto público | Correo genérico de la web (info@, hola@), no personal | Hay un correo de empresa publicado |

**Hoja (`b2b-candidatas.csv`, fuera del repositorio público si contiene correos):** nombre, ciudad, comunidad, web,
correo genérico, tipo (laboral/fiscal/inmobiliaria), CMS, artículos al año, calculadora recomendada, URL del artículo
donde encajaría, notas. Solo datos de empresa publicados en su web; nada de personas físicas ni datos que no sean de
contacto profesional (RGPD, interés legítimo B2B, con baja en un clic en el primer correo).

**Prioridad:** primero las que tienen un artículo concreto donde encaja una calculadora (por ejemplo, «Novedades del
SMI 2026» sin calculadora): el correo puede citar ese artículo y llevar el código ya preparado para él.

## 4. Plantilla de correo de presentación (la envía Moisés)

Asunto (menos de 50 caracteres): **Calculadora de sueldo neto para vuestra web**

> Hola, equipo de {{despacho}}:
>
> He leído vuestro artículo «{{titulo_articulo}}». Soy Moisés Mora, de Lleida, y hago NetoClaro, unas calculadoras de
> nómina, finiquito e IRPF con las cifras oficiales de 2026 y 2027.
>
> Os he preparado la calculadora de {{calculadora}} con vuestro color, para pegarla debajo de ese artículo. Así se ve:
> {{enlace_vista_previa}}
>
> Es gratis (lleva un enlace pequeño a NetoClaro). Si la queréis con vuestro logo y sin enlace, son 9 € al mes, IVA
> incluido, y se cancela en un clic. Cuando cambien el SMI o el IRPF, se actualiza sola.
>
> Si os interesa, respondéis a este correo y os mando el código. Si no, no os escribiré más.
>
> Un saludo,
> Moisés Mora · NetoClaro · hola@numimates.com

En catalán, para Cataluña:

> Hola, equip de {{despacho}}:
>
> He llegit el vostre article «{{titulo_articulo}}». Soc en Moisés Mora, de Lleida, i faig NetoClaro, unes calculadores
> de nòmina, finiquito i IRPF amb les xifres oficials del 2026 i el 2027.
>
> Us he preparat la calculadora de {{calculadora}} amb el vostre color, per enganxar-la sota aquest article. Així es
> veu: {{enlace_vista_previa}}
>
> És gratuïta (porta un enllaç petit a NetoClaro). Si la voleu amb el vostre logo i sense enllaç, són 9 € al mes, IVA
> inclòs, i es cancel·la en un clic. Quan canviïn el SMI o l’IRPF, s’actualitza sola.
>
> Si us interessa, responeu aquest correu i us envio el codi. Si no, no us escriuré més.
>
> Salutacions,
> Moisés Mora · NetoClaro · hola@numimates.com

`{{enlace_vista_previa}}` = la dirección `/embed/<slug>/?color=<su color>` del configurador. Un solo correo por
despacho y ningún recordatorio (el correo lo promete). Ritmo propuesto: 10 correos por semana, 5 semanas, y anotar
respuestas y altas en la hoja.

## 5. Previsión de ingresos

Estimaciones sin datos reales: se sustituyen por las cifras medidas en cuanto haya. Embudo de captación directa
(los 50 correos):

| Paso | Tasa supuesta | De 50 |
|---|---|---|
| Responden | 15–25 % | 8–12 |
| Ponen el widget gratis | 50 % de los que responden | 4–6 |
| Pasan a Profesional en 3 meses | 20–30 % de los que lo ponen | 1–2 |

Más la captación sola (página «Para profesionales», enlace «Pon esta calculadora en tu web» en cada calculadora y el
propio enlace del widget gratis en otras webs): supuesto de 1 alta de pago al mes desde el tercer mes con dominios
propios e indexación.

| Escenario | Clientes de pago al cabo de 6 meses | Ingresos al mes (IVA incluido) | Neto tras IVA y Stripe (~1,5 % + 0,25 €) |
|---|---|---|---|
| Bajo | 2 Profesional | 18 € | ~14 € |
| Medio | 5 Profesional + 1 Agencia | 74 € | ~59 € |
| Alto | 12 Profesional (3 anuales) + 3 Agencia | 168 € | ~134 € |

**Valor que no es dinero:** cada widget gratis en una web temática es un enlace entrante desde un dominio del sector,
que es lo que más le cuesta a un sitio nuevo de calculadoras. 20 webs con widget gratis equivalen a 20 enlaces de
calidad, que mejoran la posición de las 900 páginas de la familia y, con ella, el RPM de AdSense.

**Primer euro:** con Moisés enviando los 10 primeros correos la semana del 2/11, primer cliente Profesional previsto
entre el 16/11 y el 15/12/2026 (9 €). Si a los 30 días de enviar los 50 correos no hay ningún cliente de pago, la
línea se revisa (precio, perfil o mensaje) según JUICIO.md.

## 6. Marca blanca v2 (propuesta, no hecha)

La v1 es estática: claves en `widget-clientes.json` (público), comprobación del dominio en el navegador y alta o baja
a mano con redespliegue. Es suficiente para los primeros 10–20 clientes. Sus límites:

- **Copiable:** el HTML y el JS son públicos; alguien puede servir una copia sin enlace desde su servidor.
- **Bajas manuales:** si un cliente cancela en Stripe, sigue sin enlace hasta que se quite su línea y se redespliegue.
- **Altas manuales:** hasta 24 h laborables entre el pago y la clave.

**v2, con una función serverless gratuita (Vercel Functions, plan Hobby, o Cloudflare Workers):**

1. **Webhook de Stripe** (`checkout.session.completed`, `customer.subscription.updated` y `.deleted`) → función
   `/api/widget/stripe` que verifica la firma (`STRIPE_WEBHOOK_SECRET`), lee el campo «dominio» del Payment Link y
   guarda `{clave, dominios, plan, estado, color, logo}` en un almacén clave-valor gratuito (Vercel KV/Upstash o
   Cloudflare KV). Envía la clave al cliente por correo (Resend, `noreply@numimates.com`). Altas y bajas sin tocar el repo.
2. **Validación en servidor:** la página embed pide `/api/widget/estado?pro=<clave>` y la función compara la cabecera
   `Origin`/`Referer` de la petición del iframe (la pone el navegador; la web cliente no la puede falsear) con los
   dominios del almacén. Respuesta firmada (HMAC) y cacheada 1 hora en el CDN.
3. **Panel mínimo para el cliente:** `/api/widget/cliente` con enlace mágico por correo para cambiar color y logo, y
   enlace al portal de cliente de Stripe.
4. Coste: 0 € mientras haya menos de unos cientos de miles de peticiones al mes.

Se hace cuando haya 5 clientes de pago o la primera baja que no se pueda atender en el día.
