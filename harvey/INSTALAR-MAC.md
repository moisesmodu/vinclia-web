# Instalar Harvey en el Mac, paso a paso (20 minutos la primera vez)

Antes: el buzón `moises@oposita.digital` creado con su contraseña de aplicación (`CORREOS.md`), Claude Code instalado y
con sesión iniciada (`claude login`), y Homebrew.

```bash
# 1. Python 3.13 (Harvey lo exige; el python3 del sistema suele ser 3.9)
brew install python@3.13

# 2. El repositorio de la cartera, en la rama base, al día
cd ~ && { [ -d vinclia-web ] || git clone https://github.com/moisesmodu/vinclia-web.git; }
cd ~/vinclia-web && git fetch origin && git checkout claude/estrategia-ingresos-recurrentes-tx0rvw && git pull

# 3. Harvey, una carpeta por instancia (empezamos por Plaça)
git clone https://github.com/ethanplusai/harvey.git ~/harvey-placa

# 4. Copiar la configuración de la cartera (crea el entorno virtual e instala Harvey)
bash ~/vinclia-web/harvey/instalar.sh placa ~/harvey-placa

# 5. Credenciales
cd ~/harvey-placa && open -e .env
```

En `.env` rellena (el resto se deja vacío):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=moises@oposita.digital
SMTP_PASSWORD=<contraseña de aplicación de 16 caracteres>
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USERNAME=moises@oposita.digital
IMAP_PASSWORD=<la misma contraseña de aplicación>
REOON_API_KEY=<clave gratuita de reoon.com/email-verifier>
```

En `harvey.local.yaml` cambia dos líneas: `compliance.postal_address` (tu dirección postal, obligatoria bajo cada correo
en frío) y `channels.email.warmup.start_date` (la fecha de creación del buzón, formato AAAA-MM-DD).

```bash
# 6. Comprobar y arrancar
source .venv/bin/activate
harvey status --check          # comprueba Claude, buzón, config
harvey warmup oposita.digital  # SPF, DKIM, DMARC, edad del dominio: tiene que acabar en READY (o decir qué falta)
harvey signals --confirm free  # activa las señales gratuitas (lee las webs de los negocios)
harvey discover --estimate     # cuántos negocios va a encontrar y qué cuesta (OpenStreetMap: 0 €)
harvey discover                # busca academias en las ciudades del ICP
harvey profile                 # lee sus webs (gratis) y saca nombres, correos y datos
harvey dashboard               # abre el panel: Today → Companies → Outbox
harvey run                     # el bucle: cada 30 minutos escribe, pregunta, espera tu aprobación
```

Qué ves en el panel: en **Companies**, los negocios encontrados y por qué encajan o no; en **Outbox**, cada correo
redactado esperando tu «Aprobar» (o «Editar»); en **Conversations**, las respuestas y los borradores de contestación.
Nada sale sin tu clic hasta que actives el autopilot (Settings → Sending), y no lo actives antes de haber aprobado dos
tandas a mano.

```bash
# 7. Dejarlo corriendo (lanza `harvey run` al iniciar sesión y lo reinicia si cae)
cat > ~/Library/LaunchAgents/cat.lunilla.harvey-placa.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>cat.lunilla.harvey-placa</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>-lc</string><string>cd ~/harvey-placa && source .venv/bin/activate && harvey run</string></array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/harvey-placa.log</string><key>StandardErrorPath</key><string>/tmp/harvey-placa.log</string>
</dict></plist>
PLIST
launchctl load ~/Library/LaunchAgents/cat.lunilla.harvey-placa.plist
tail -f /tmp/harvey-placa.log     # para ver qué hace
```

Las otras dos instancias, cuando la primera lleve una semana con respuestas:

```bash
git clone https://github.com/ethanplusai/harvey.git ~/harvey-ccse    && bash ~/vinclia-web/harvey/instalar.sh ccse    ~/harvey-ccse
git clone https://github.com/ethanplusai/harvey.git ~/harvey-lunilla && bash ~/vinclia-web/harvey/instalar.sh lunilla ~/harvey-lunilla
```
(cada una con su `.env`; si usan el mismo buzón con alias, `SMTP_USERNAME` es el usuario real y `persona.email` el alias.)

## Si prefieres que lo haga la sesión del Mac

Pega esto en la sesión del Mac (Remote Control en la carpeta del repositorio): «Instala Harvey siguiendo
harvey/INSTALAR-MAC.md: clona ethanplusai/harvey en ~/harvey-placa, ejecuta harvey/instalar.sh placa, y déjame el
.env abierto para que ponga la contraseña de aplicación y la clave de Reoon. Después ejecuta harvey status --check y
harvey warmup oposita.digital y dime qué falta.» La contraseña de aplicación la escribes tú en el archivo; no la pegues
en el chat.

## Problemas típicos

- `python3` es 3.9: usa `python3.13 -m venv .venv` (el instalador ya lo intenta).
- `harvey status` dice que Claude no está: `claude login` en el Mac.
- `harvey warmup` dice NOT READY por DKIM: falta el paso 5 de `CORREOS.md`.
- Correos marcados «guess» que no se envían: falta `REOON_API_KEY`.
- OpenStreetMap encuentra pocas academias: `SERPER_API_KEY` (2.500 gratis) y `harvey discover --provider serper`.
