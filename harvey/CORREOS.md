# Los buzones de Harvey: qué falta, cómo se crean y qué registros lleva cada dominio

Situación el 3/11/2026: numimates.com ya tiene correo (Google Workspace, `hola@numimates.com`). Los dominios de
marca **oposita.digital, ccsefacil.com y lunilla.cat** solo tienen el correo de envío de Resend en el subdominio `send`
(no hay MX en la raíz), así que se les puede activar Gmail sin tocar nada. Harvey necesita un buzón que **envíe y
reciba** (lee las respuestas por IMAP), con nombre de Moisés, en un dominio de marca y nunca en el principal.

## 1. Los correos que faltan

| Buzón | Para qué | Tipo en Workspace | Coste |
|---|---|---|---|
| **moises@oposita.digital** | Harvey · instancia Plaça (academias de oposiciones). Es el primero: el producto con más margen B2B | Usuario nuevo | 1 licencia (≈ 7 €/mes en Business Starter) |
| **moises@ccsefacil.com** | Harvey · instancia CCSE (escuelas de español, ONG) | Para empezar, **alias** del usuario anterior (gratis); usuario propio cuando la instancia tenga respuestas | 0 € hasta que se separe |
| **moises@lunilla.cat** | Harvey · instancia Lunilla (escoles bressol, llibreries) y los mensajes a afiliadas | Igual: alias ahora, usuario propio después | 0 € hasta que se separe |
| hola@oposita.digital, hola@ccsefacil.com, hola@lunilla.cat, hola@tuspapeles.app | Contacto público de cada web (hoy todas remiten a hola@numimates.com) | Alias de `hola@numimates.com` | 0 € |

Con los alias, todas las respuestas llegan al mismo buzón `moises@oposita.digital`; Harvey distingue las conversaciones
por hilo. Cuando dos instancias corran a la vez y se pisen, se crea un usuario por instancia.

## 2. Crearlos en Google Workspace (15 minutos, en admin.google.com)

1. **Añadir los dominios**: Cuenta → Dominios → Gestionar dominios → Añadir dominio → `oposita.digital` → tipo
   **dominio secundario** (permite usuarios propios). Repite con `ccsefacil.com` y `lunilla.cat`. Google los
   verifica solo si usas la misma cuenta que Search Console (los TXT `google-site-verification` ya están en el DNS);
   si pide otro TXT, cópialo y pásaselo a Claude: `node scripts/dns-google-workspace.mjs oposita.digital --verificacion "<valor>"`.
2. **Activar Gmail en cada dominio**: en la misma pantalla, «Configurar Gmail» → Google pide el MX
   `smtp.google.com` (prioridad 1). Lo pone Claude: `node scripts/dns-google-workspace.mjs oposita.digital`
   (añade MX y SPF; no toca Resend ni DMARC). Vuelve y pulsa «Activar Gmail».
3. **Crear el usuario** `moises@oposita.digital` (Usuarios → Añadir usuario, nombre Moisés Mora) y, en su ficha,
   «Correos alternativos» → `moises@ccsefacil.com` y `moises@lunilla.cat`.
4. **Alias de contacto**: en el usuario de `hola@numimates.com`, «Correos alternativos» → `hola@oposita.digital`,
   `hola@ccsefacil.com`, `hola@lunilla.cat`, `hola@tuspapeles.app`.
5. **DKIM** (para no caer en spam): Aplicaciones → Google Workspace → Gmail → Autenticar correo → elige
   `oposita.digital` → «Generar registro nuevo» → copia el valor TXT y pásaselo a Claude:
   `node scripts/dns-google-workspace.mjs oposita.digital --dkim "v=DKIM1; k=rsa; p=…"` → vuelve y pulsa
   «Iniciar autenticación». Repite para los otros dos dominios.
6. **Contraseña de aplicación para Harvey**: entra en Gmail como `moises@oposita.digital` → myaccount.google.com →
   Seguridad → activa la verificación en dos pasos → «Contraseñas de aplicaciones» → nombre «Harvey» → copia los 16
   caracteres. Es lo que va en `SMTP_PASSWORD` e `IMAP_PASSWORD` del `.env` de Harvey (nunca en el chat ni en el repo).
7. **Enviar como alias** desde Gmail (solo para los correos que mandes tú a mano): Gmail → Ajustes → Cuentas →
   «Enviar como» → añade los alias.

Comprobación: `harvey warmup oposita.digital` tiene que decir que SPF, DKIM y DMARC están bien. Y manda un correo de
prueba desde `moises@oposita.digital` a `hola@numimates.com` y contesta: Harvey leerá esa respuesta en su primer ciclo.

## 3. Calentamiento (obligatorio con un buzón nuevo)

Un buzón recién creado que manda 15 correos en frío el primer día acaba en spam para siempre. En
`harvey.local.yaml`, `channels.email.warmup.start_date` = el día de creación: Harvey no manda nada en frío durante 14
días y después sube de 5 a 15 al día. Mientras tanto, usa ese buzón para los correos normales (los 9 de
`marketing/correos/semana-1.json`, respuestas, afiliadas de Lunilla): eso también calienta. Si quieres acortar a una
semana, TrulyInbox (22 $/mes) y `harvey trulyinbox connect`.

## 4. Lo que NO hace falta

- Instantly, Apollo, ZoomInfo, LinkedIn: no. Harvey descubre negocios en OpenStreetMap (gratis) y, si quieres más,
  Serper (2.500 búsquedas gratis).
- Cuentas nuevas de Google Cloud: no, si usas SMTP+IMAP con contraseña de aplicación (es lo que está configurado).
- Un verificador de correo sí: Reoon, 600 comprobaciones al mes gratis (`REOON_API_KEY`). Sin él, Harvey no envía
  a direcciones que no haya verificado.
