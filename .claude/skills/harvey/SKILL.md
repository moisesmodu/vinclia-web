---
name: harvey
description: Ronda comercial diaria de Harvey: publica o prepara las piezas aprobadas de hoy, envía los correos listos, revisa respuestas, mide y deja a Moisés solo lo que exige su identidad. Úsalo con /harvey (hoy) o /harvey semana.
---

# /harvey · la ronda comercial

Lanza al agente `harvey` (`.claude/agents/harvey.md`) con este encargo:

1. Día de hoy en `marketing/CALENDARIO.md` y en `marketing/campanas/lunilla-navidad-2026.md` §5 (si el argumento es
   `semana`, toda la semana en curso).
2. Para cada pieza ✅ de ese día: publicar o enviar si hay conector o permiso; si no, añadirla a la lista «copiar y
   pegar hoy» de `marketing/PARA-MOISES.md` (dónde, texto, enlace) y nada más.
3. Correos listos en `marketing/correos/*.json` sin enviar: enviarlos con `node scripts/enviar-correos-marketing.mjs`
   si hay permiso; registrar en `marketing/ENVIADOS.md`.
4. Respuestas recibidas (correo, comentarios) que se puedan leer: contestar en la voz de la marca o dejar la
   respuesta en `APROBAR.md`.
5. Medir lo del día anterior (Stripe por `metadata.proyecto`, Web Analytics por `utm_campaign`) y anotar en
   `MEDICION.md` §4 si es lunes.
6. Commit y push; informe de 10 líneas.

Argumentos: `/harvey` (hoy), `/harvey semana`, `/harvey lunilla` (solo la campaña de Navidad).
