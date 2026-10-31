# Coste por usuario y mes · Aprova (proyecto M)

**Objetivo (M-CATALA-PRODUCTE.md §5):** menos de **1,5 € por usuario y mes a 30 minutos de uso al día** (≈ 15 horas/mes). Lo que cuesta de
verdad es la voz (síntesis y reconocimiento) y la corrección con modelo de lenguaje; todo lo demás es casi fijo. La tarea mensual
(`TAREA-PROGRAMADA.md` §2) sustituye estas estimaciones por las cifras reales de las tablas `Us` y `Correccio` y escribe `costes/informe-<mes>.md`.

## 1. Perfil de uso de 30 minutos al día (15 h/mes), un usuario premium que lo usa todo
| Actividad | Cantidad al mes | Unidad de coste |
|---|---|---|
| Práctica (huecos, transformación, castellanismos, léxico) | 20 sesiones × 15 ítems | sin coste variable (banco compilado, corrección en el navegador) |
| Dictados y comprensión oral con audio | 60 audios × 180 caracteres = 10.800 caracteres (con caché por texto: los audios del banco se sintetizan una vez para todos) | TTS |
| Correcciones escritas con rúbrica | 12 textos × 250 palabras | LanguageTool + modelo de lenguaje |
| Lectura en voz alta (oral) | 20 lecturas × 40 s = 13 min | reconocimiento de voz |
| Simulacros | 2 al mes (incluyen 2 correcciones y 6 audios) | ya contado arriba |

## 2. Coste por componente (precios de lista, octubre de 2026)
| Componente | Proveedor configurado | Tarifa | Coste/usuario/mes |
|---|---|---|---|
| Síntesis de voz | **navegador** (SpeechSynthesis ca-ES, hoy) | 0 € | **0 €** |
| | Google Cloud TTS Standard (`TTS_PROVEIDOR=google`) | 4 $/M caracteres | 0,04 € (sin caché: 10.800 car.) |
| | Azure Neural (`azure`, ca-ES-JoanaNeural) | 16 $/M caracteres | 0,16 € |
| | Matxa-TTS autoalojado (si la licencia lo permite) | servidor ≈ 6 €/mes compartido | ≈ 0,02 € a 300 usuarios |
| | ElevenLabs (solo demo de la landing) | 150 $/M caracteres | 0 € para el usuario (solo la landing) |
| Corrección: LanguageTool | API pública (20 req/min) o autoalojado | 0 € / 5 €/mes el servidor | 0 € – 0,02 € |
| Corrección: criterios por modelo | Anthropic claude-sonnet-5-5 (`ANTHROPIC_API_KEY`) | 3 $/M entrada, 15 $/M salida (medido: ≈ 1.900 tokens entrada + 500 salida por texto) | 12 × (0,0057 + 0,0075) $ = **0,16 $ ≈ 0,15 €** |
| | Anthropic claude-haiku-5-5 | 1 $/M · 5 $/M | 0,05 € |
| | Salamandra 7B (BSC) en un vLLM propio | GPU compartida ≈ 60 €/mes | ≈ 0,20 € a 300 usuarios; 0,02 € a 3.000 |
| Reconocimiento de voz | **navegador** (Web Speech ca-ES, hoy) | 0 € | **0 €** |
| | Whisper catalán (AINA) en servidor propio (`WHISPER_URL`) | GPU/CPU ≈ 30 €/mes compartido | ≈ 0,10 € a 300 usuarios |
| | API de transcripción comercial (referencia) | 0,006 $/min | 13 min → 0,08 € |
| Vercel (Pro, compartido con la cartera) y Neon (gratis) | | 20 $/mes ÷ proyectos | ≈ 0,01 € |
| Stripe | 1,5 % + 0,25 € por cobro | | 0,40 € sobre 9,99 € |

## 3. Total
| Configuración | Coste variable/usuario/mes (30 min/día) | Margen sobre 9,99 € |
|---|---|---|
| **Hoy** (voz y reconocimiento del navegador, LanguageTool público, criterios por heurística) | **≈ 0,02 €** + Stripe 0,40 € | 9,5 € |
| Recomendada (Google TTS + Sonnet 5.5 + Web Speech + LT público) | **≈ 0,20 €** + Stripe 0,40 € | 9,4 € |
| Completa (Google TTS + Sonnet + Whisper propio + LT propio), 300 usuarios | **≈ 0,35 €** + Stripe | 9,2 € |
| Peor caso (Azure Neural + Sonnet + transcripción comercial, sin caché de audio) | ≈ 0,45 € + Stripe | 9,1 € |

Todas las configuraciones quedan **por debajo del objetivo de 1,5 €**. El umbral se superaría solo con ElevenLabs para todo el audio
(≈ 1,6 € solo en voz), que por eso queda reservado a la demo de la landing (VIABILIDAD.md, nota de M).

## 4. Cómo se mide (automático)
- `Us` (por persona y mes): `correccions`, `simulacres`, `oralSegons`, `ttsCaracters`, `sttSegons`. Lo incrementan `/api/corregir`, `/api/simulacre`,
  `/api/oral` y `/api/tts`.
- `Correccio`: `tokensIn`, `tokensOut`, `motor`, `ms` por corrección (latencia objetivo < 60 s; medido en producción sin modelo: 1–3 s con
  LanguageTool público).
- `motor/.cache/cost.log`: tokens de cada generación de ítems (coste de contenido, no de usuario: ≈ 0,05 € por 50 ítems con Haiku).
- Informe mensual: `costes/informe-<AAAA-MM>.md` (tarea programada mensual).
