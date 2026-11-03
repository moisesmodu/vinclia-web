# Voz de los cursos con VoiceStudio (en el Mac, gratis y para siempre)

Hoy los vídeos se narran con **Piper + davefx** (castellano de España, CC0) en la nube: 0 €, sin límite. VoiceStudio
(AGPL-3.0, local, sin cuotas) sirve para tener una voz más natural o **la voz de Moisés clonada** (solo con su permiso
expreso, que es suya) sin pagar créditos de ElevenLabs. Corre en el Mac porque necesita la GPU (Metal) y descarga los
modelos de HuggingFace, que la nube de estas sesiones tiene bloqueado.

## 1. Instalar (una vez, 10 minutos; lo hace la sesión del Mac o Moisés)

Mac con Apple Silicon y macOS 13.3 o posterior:

```bash
brew tap debpalash/tap
brew trust --cask debpalash/tap/voicestudio
brew install --cask debpalash/tap/voicestudio
```
(O el DMG de github.com/debpalash/VoiceStudio/releases/latest. Si macOS dice que la app «está dañada», es Gatekeeper:
ver docs/install/macos.md del repositorio.)

Abrir VoiceStudio → Model Manager → descargar un motor que hable castellano y permita clonar (mirar la columna de
idiomas y la licencia del modelo: **solo modelos con licencia comercial**; el motor y la licencia elegidos se anotan
aquí abajo).

## 2. Elegir la voz

- **Voz de catálogo** de castellano de España, o
- **Voz de Moisés**: Voice Cloning → 20-60 s de audio limpio leyendo un texto de los cursos → guardar como `moises`.

Probar con una frase de `guiones/c5/c5-01.json` y comparar con `muestras/` (Kokoro, davefx, ElevenLabs).

## 3. Conectarla al montaje (ya programado en `pipeline/voz.py`)

El servidor local escucha en `http://127.0.0.1:3900` (comprobar con
`curl http://127.0.0.1:3900/.well-known/voicestudio-speech`). `voz.py` usa la API compatible con OpenAI
(`POST /v1/audio/speech` con `model`, `voice`, `input`, `response_format: wav`):

```bash
MOTOR=openai TTS_URL=http://127.0.0.1:3900/v1/audio/speech TTS_MODEL=<motor> TTS_VOICE=moises \
  python3 pipeline/voz.py c5          # narración nueva → $WORK/out/c5
FORCE=1 python3 pipeline/montaje.py c5 # vídeos con la voz nueva
```
Si la ruta o los campos de VoiceStudio son otros, se cambian solo las líneas de `MOTOR == 'openai'` en `voz.py`
(el resto del montaje no cambia). `voz.json` guarda el motor y la voz de cada clase, así que se sabe qué vídeo lleva
qué voz.

## 4. Para siempre

- VoiceStudio en el Mac al arrancar (Ajustes del sistema → General → Ítems de inicio).
- Remote Control del Mac con la carpeta del repositorio, para que una sesión en la nube pueda narrar desde allí.
- Anotar aquí: motor ______, licencia ______, voz ______, fecha ______.

Coste: 0 €. ElevenLabs queda solo como opción de pago (≈ 1 crédito por carácter: un curso de 4 h son unos
200.000 créditos).
