# Harvey · el agente comercial B2B de la cartera

[Harvey](https://github.com/ethanplusai/harvey) (MIT, ethanplusai) es un agente de ventas autónomo que corre en tu
ordenador sobre tu suscripción de Claude: **busca negocios** (OpenStreetMap, gratis), **lee sus webs**, **escribe
correos en frío** con un dato real de cada uno, **los envía** desde tu buzón cuando tú los apruebas, **lee las
respuestas**, contesta objeciones y lleva la conversación a una prueba o una reunión. Sus 11 skills (Markdown)
llevan el método: prospección, cualificación, redacción, objeciones, oferta, señales de compra. Esta carpeta lo deja
**configurado para la cartera**: tres instancias, cada una con su producto, su público y sus reglas.

| Instancia | Vende | A quién | Oferta | Objetivo del correo |
|---|---|---|---|---|
| `placa` | Plaça (oposita.digital) | Academias de oposiciones de Cataluña | Licencia de grupo (4 €/alumno y mes, mínimo 10) con 30 días gratis para todos sus alumnos | Que activen el código de prueba |
| `ccse` | CCSE en tu idioma (ccsefacil.com) | Escuelas de español, centros examinadores CCSE, ONG de acogida | Afiliación al 30 % con código propio + accesos gratis para el profesorado | Que pidan el código |
| `lunilla` | Lunilla (lunilla.cat) | Escoles bressol, llibreries infantils i botigues de joguines (Lleida i Catalunya) | Conte de regal per a la classe o la botiga; targeta regal amb QR i afiliació | Que acepten el cuento de regalo |

Cada instancia es una copia de Harvey con su `harvey.local.yaml` (gana sobre el `harvey.yaml` del repo de Harvey)
y sus `skills/product_knowledge.md`, `skills/competitive_intel.md` y `skills/email_rules.md` (reglas de redacción en
castellano y catalán, voz de MARCAS.md).

## Guías paso a paso

- `CORREOS.md`: qué buzones faltan, cómo crearlos en Google Workspace y los registros DNS (con `scripts/dns-google-workspace.mjs`).
- `INSTALAR-MAC.md`: instalación en el Mac comando a comando, y el prompt para que lo haga la sesión del Mac.

## Qué exige tu identidad (una vez)

1. **Un buzón que envíe y reciba** (Harvey lee las respuestas por IMAP o Gmail). Opciones, de mejor a peor:
   - Google Workspace en un dominio secundario (≈ 7 €/mes; dentro de la regla de 20 €/mes): por ejemplo
     `moises@oposita.digital` para Plaça, y alias para las otras dos. Harvey recomienda **no usar el dominio
     principal** por reputación; los dominios de marca ya tienen el DNS en Vercel, así que los registros MX, SPF,
     DKIM y DMARC los pone la sesión del Mac en dos minutos.
   - Un buzón SMTP+IMAP (Fastmail, ≈ 3 €/mes) en ese mismo dominio.
   - Nunca el correo personal ni nada de Algorithmics (SESIONES.md).
2. **Calentar el buzón 2–4 semanas** antes de enviar en frío (TrulyInbox, 22 $/mes, o enviar a mano los primeros
   días). Harvey no manda nada hasta `warmup.start_date + min_days` si lo configuras.
3. **Un verificador de correo gratuito** (Reoon, 600 comprobaciones al mes): sin él, Harvey no envía a direcciones
   que no haya verificado.
4. **Aprobar los correos** en el Outbox del panel de Harvey (`harvey dashboard`). Autopilot solo después de ver dos
   tandas aprobadas a mano.

## Instalación en el Mac (sesión del Mac o tú, 10 minutos)

```bash
cd ~ && git clone https://github.com/ethanplusai/harvey.git harvey-placa   # una carpeta por instancia
cd ~/vinclia-web && bash harvey/instalar.sh placa ~/harvey-placa            # copia la configuración de la cartera
cd ~/harvey-placa && source .venv/bin/activate
# rellena .env (buzón y verificador), después:
harvey status --check && harvey signals --confirm free && harvey discover --estimate
harvey discover && harvey profile && harvey dashboard     # revisa prospectos y aprueba los primeros correos
harvey run                                                # el bucle (cada 30 minutos)
```

Repite con `ccse` y `lunilla` (carpetas `~/harvey-ccse`, `~/harvey-lunilla`, cada una con su buzón o alias).
`harvey train <url>` no hace falta: la ficha de producto ya está escrita; si lo ejecutas, conserva nuestro
`email_rules.md` y la lista `do_not_contact`.

## Qué mira Harvey y qué no

- Descubre negocios por categoría y ciudad en OpenStreetMap (gratis; cobertura parcial: las academias y escoles
  bressol suelen estar, las ONG no siempre). Para completar, `harvey discover --provider serper` (2.500 búsquedas
  gratis) cuando Moisés tenga la clave.
- Nunca LinkedIn (desactivado; va contra sus condiciones).
- No escribe a los dominios de `do_not_contact`: nuestras webs, Algorithmics, competidores.
- Cada correo lleva la línea de baja en castellano («responde "no, gracias"») y la dirección postal de Moisés
  (`compliance.postal_address`: rellenar con `LEGAL_ADRECA`).
- Límite de 15 correos al día por instancia, de lunes a viernes de 9 a 18, horario de Madrid.

## Cómo encaja con el resto

- Harvey hace el canal **B2B por correo** (academias, escuelas, ONG, librerías). Las piezas para grupos, Reddit y
  redes siguen en `marketing/` y las publica Moisés o el plugin Hyper Marketing.
- Las respuestas que Harvey no sepa tratar (quejas, legales, precio fuera de tabla) van a Moisés; el agente
  `/harvey` de este repo las redacta en la voz de la marca.
- Cada lunes, la tarea semanal lee `harvey export` y `harvey companies` (CSV) de cada instancia si Moisés los deja
  en `harvey/datos/` y los anota en `marketing/MEDICION.md`.
