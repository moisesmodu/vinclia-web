# Marketing · Plaça (proyecto B)

Escenario: S1 prudente (VIABILIDAD §1 y §5). Orgánico desde el día 1. Anuncios de búsqueda de 100 €/mes **preparados y sin
activar**: se encienden en el mes 2 solo con la aprobación mensual de Moisés. Nada se publica fuera sin su visto bueno.

## 1. SEO: ya ejecutado (lo genera la app en cada despliegue)

| Tipo de página | Ruta | Cuántas | Búsqueda que ataca |
|---|---|---|---|
| Oposición | `/ca/<oposicion>` y `/es/<oposicion>` | 5 × 2 = 10 | "test auxiliar administratiu Generalitat gratis", "test mossos 2026", "test bombers generalitat", "test TCAI ICS", "test auxiliar administratiu ajuntament" |
| Tema | `/ca/<oposicion>/<tema>` y `/es/…` | 110 temas × 2 = 220 | "test tema 5 mossos", "test llei 26/2010", "test Estatut d'autonomia auxiliar", "test llei municipal catalunya" |
| Convocatorias 2027 | `/ca/convocatorias`, `/es/convocatorias` | 2 | "oposicions 2027 catalunya", "convocatòries generalitat 2027", "oposiciones cataluña 2027" |
| Precios, legales, contacto | | 14 | marca |

**Total: 246 URLs indexables** en el sitemap (`/sitemap.xml`), con `hreflang` ca/es, canónicas, datos estructurados
(`BreadcrumbList`, `FAQPage` en cada oposición, `ItemList` en convocatorias) y títulos con la cifra real de preguntas.
Cada página de tema enseña sus fuentes legales con enlace al BOE y una pregunta de ejemplo: contenido útil, no relleno
(la política de Google contra el contenido escalado castiga lo contrario).

**Lo que hace la tarea semanal con el SEO:** actualiza la página de convocatorias, sube el número de preguntas (los títulos
lo muestran), y cuando sale una convocatoria nueva crea su oposición (archivo de configuración + PDF) y con ella sus páginas.

### Mapa de palabras clave (cola larga, catalán primero)
- **Por oposición:** test + [oposición] + (gratis | 2026 | 2027 | online | simulacre | preguntes | examen).
- **Por tema:** test + [norma] (Llei 26/2010, Llei 19/2014, Estatut d'autonomia, LBRL, Llei 39/2015, Llei 10/1994, Llei 5/1994, Llei 4/1997, Estatuto Marco, Llei 21/2000…) + [oposición].
- **Por convocatoria:** "convocatòria 870 generalitat", "convocatòria 46/26 mossos", "81/26 bombers", "100-2025 ICS", "128/2026 ajuntament barcelona".
- **Comparativas (mes 2, blog):** "OpositaTest Mossos alternativa", "quant costa una acadèmia de Mossos a Lleida/Girona/Tarragona", "millor app oposicions en català".
- La lista completa por oposición está en `oposiciones/*/oposicion.json → seo.palabrasClave`.

## 2. Ficha de Google Play (la PWA empaquetada como TWA; `android/twa-manifest.json`)

**Catalán**
- Nom: Plaça · Oposicions de Catalunya
- Descripció breu (80): Tests i simulacres d'oposicions catalanes amb l'article de la llei a cada resposta.
- Descripció llarga:
  Prepara les oposicions de la Generalitat, Mossos d'Esquadra, Bombers, l'ICS i els ajuntaments de Catalunya amb tests fets a partir dels textos legals oficials.
  • Tests per tema amb el temari de la teva convocatòria.
  • Simulacres amb el format real: mateix nombre de preguntes, temps i penalització.
  • Repàs espaiat (FSRS): l'app et torna a preguntar el que falles just abans que ho oblidis.
  • Cada resposta amb explicació, l'article exacte i el text literal de la font.
  • En català i en castellà: canvia d'idioma a cada pregunta.
  • Estadístiques per tema, ratxa diària i historial que no s'esborra mai.
  20 preguntes gratis per oposició, sense registre. Subscripció de 9,99 €/mes per a totes les oposicions. Les preguntes s'han generat amb intel·ligència artificial a partir de la normativa vigent i s'han verificat contra la font. Plaça no és cap administració pública.

**Castellano**
- Nombre: Plaça · Oposiciones de Cataluña
- Descripción breve (80): Tests y simulacros de oposiciones catalanas con el artículo de la ley en cada respuesta.
- Descripción larga: (misma estructura que la catalana) Prepara las oposiciones de la Generalitat, Mossos d'Esquadra, Bombers, el ICS y los ayuntamientos de Cataluña con tests hechos a partir de los textos legales oficiales. • Tests por tema • Simulacros con el formato real • Repaso espaciado • Explicación, artículo y texto literal de la fuente • Catalán y castellano • Estadísticas e historial permanente. 20 preguntas gratis por oposición, sin registro. Suscripción de 9,99 €/mes para todas. Preguntas generadas con IA a partir de la normativa vigente y verificadas contra la fuente. Plaça no es una administración pública.
- **Declaración de contenido con IA** (obligatoria en Play, regla 6 de SESIONES): marcar "La app contiene contenido generado por IA" y el texto de las descripciones de arriba.
- Categoría: Educación. Clasificación: PEGI 3. Icono: `public/icons/play-512.png`. Capturas: las de la prueba de móvil (ver README).
- Pagos dentro de la TWA: Google exige Play Billing para contenido digital vendido dentro de la app. Hasta integrarlo, la ficha
  de Play se publica con la app en modo "gratis" (20 preguntas) y la suscripción se contrata en la web. Decisión anotada en el README.

## 3. Diez guiones de vídeo corto (TikTok, Reels, Shorts · 25-40 s · catalán con subtítulos; versión castellana igual)

1. **"Aquesta pregunta va caure a l'examen"** · Gancho (0-3 s): pantalla con una pregunta real del simulacre de Mossos y cuenta atrás de 5 s. Cuerpo: se revela la respuesta y el artículo exacto de la Llei 10/1994. Cierre: "20 preguntes gratis, enllaç al perfil".
2. **"Silenci administratiu en 20 segons"** · Pizarra: positivo vs negativo (art. 24 Llei 39/2015), 2 ejemplos, pregunta trampa. CTA: test del tema 5 de Generalitat.
3. **"La penalització que et suspèn"** · Cálculo en pantalla: 75 preguntes, 50 encerts i 20 errors amb −1/4 = nota. "Deixar-la en blanc o arriscar?" CTA: simulacre amb penalització real.
4. **"3 errors que tothom fa amb l'Estatut"** · Article 2 (Generalitat), 55 (Parlament) i 76 (Consell de Garanties). Formato lista rápida.
5. **"Repàs espaiat: estudia menys, recorda més"** · Curva del olvido animada; la app te vuelve a preguntar lo que fallaste. Demostración de la cola "Repàs del dia".
6. **"Convocatòries 2027 a Catalunya"** · Mapa con plazas por cuerpo (de `/ca/convocatorias`). "Guarda aquest vídeo". Se rehace cada mes.
7. **"Bombers: classes de foc en 15 segons"** · A, B, C, D, F con un objeto real cada una. Pregunta final. CTA: test del tema 8.
8. **"TCAI de l'ICS: la pregunta de les úlceres per pressió"** · Escala y cambios posturales; pregunta tipo examen. CTA: test TCAI.
9. **"Un preu, totes les oposicions"** · Opositora que se presenta a Generalitat y ayuntamiento: "No paguis dues apps". Comparación de precio (9,99 € vs. 15,99 € por oposición en el líder). Sin nombrar marcas en el vídeo.
10. **"El teu historial no s'esborra"** · "Has cancel·lat i tornes a la propera convocatòria? Ho tens tot." Pantalla de estadísticas y exportación.

Producción: voz con el TTS más barato que suene bien en catalán; ElevenLabs solo para el vídeo de demo de la landing.
Créditos de Higgsfield/ElevenLabs **no gastados en esta sesión** (0): los guiones se graban con capturas reales de la app.

## 4. Comunidades donde publicar (preparado, **nunca sin aprobación**)
- Grupos de Telegram de opositores catalanes por cuerpo (Mossos 46/26, Bombers 81/26, Generalitat C2, ICS estabilització) y canales de academias que aceptan recursos gratis.
- Subreddits r/oposiciones y r/Catalunya (hilo de recursos), Forocoches/Mediavida (hilos de Mossos y Bombers), grupos de Facebook "Oposicions Generalitat de Catalunya".
- Discord y WhatsApp de estudiantes de FP de Cures Auxiliars d'Infermeria (TCAI) de Cataluña.
- Delegados sindicales y webs que listan convocatorias (CCOO, UGT, Intersindical, CATAC): ofrecer la página de convocatorias como recurso enlazable.
- Mensaje tipo: aporta valor (un simulacro gratis o el PDF de convocatorias del mes), sin spam; una publicación por comunidad y mes.

## 5. Referidos y afiliados
- **Referidos** (copiado del líder): un mes gratis para quien invita y para el invitado cuando el invitado paga. Pendiente de
  construir (mes 2): cupón de Stripe de 100 % un mes, enlace `?ref=<id>`.
- **Academias catalanas** (B2B, mes 3): licencia de 4-6 € por alumno y mes con panel de tutor (plan de acción del líder).
- Sin afiliados de pago en la v1: el margen (55 € por cliente) se reserva para la búsqueda de pago.

## 6. Campaña de búsqueda (preparada, **sin activar**)
- **Presupuesto:** 100 €/mes (≈ 3,30 €/día) desde el mes 2, con aprobación mensual. Solo búsqueda, sin Display ni Performance Max.
- **Estructura:** 1 campaña "Plaça - Busqueda Cataluña", ubicación Cataluña, idiomas catalán y castellano, 6 grupos de
  anuncios (Mossos, Generalitat C2, Ayuntamientos C2, Bombers, TCAI ICS, genéricas). Concordancia de frase, CPC máximo 0,50-0,80 €.
- **Archivos para Google Ads Editor:** `marketing/google-ads/palabras-clave.csv` (29 palabras clave), `negativas.csv` (20 negativas), `anuncios.csv` (6 anuncios adaptables con 5 títulos y 2 descripciones).
- **Conversión:** alta de suscripción (página `/cuenta?pagado=1`). Etiqueta de conversión sin cookies de terceros hasta tener banner de consentimiento: medir por Stripe (clientes con `utm_source=google`).
- **Prioridad por calendario:** Bombers 81/26 y TCAI ICS (exámenes previstos entre finales de 2026 y enero de 2027), Barcelona C2 (examen previsto para febrero de 2027), Mossos 46/27 cuando se anuncie.
- **Regla de parada (CARTERA):** si el coste por cliente no baja de 25 € al tercer mes, se apaga. Con 0,80 € por clic y un 4 % de conversión, el coste por cliente previsto es de 20 € y salen unos 5 clientes al mes.

## 7. Calendario
| Cuándo | Qué |
|---|---|
| Semana 1 | Despliegue, sitemap en Search Console (cuando Moisés lo conecte), vídeos 1-3 grabados |
| Semanas 2-4 | Un vídeo cada 2-3 días; convocatorias actualizadas cada lunes; 50 preguntas nuevas por semana |
| Mes 2 | Activar búsqueda (si Moisés aprueba), referidos, blog de comparativas |
| Mes 3 | B2B academias; medir activación, racha a 7 días y bajas |
