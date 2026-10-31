# Para Moisés · proyecto M (Aprova)

El despliegue está hecho desde la sesión (Vercel `aprova-catala`, Neon `cartera-m-catala` por la integración de Vercel, Stripe de Numi Mates
en modo prueba con los tres precios y el webhook, Resend, datos legales). Demo: **https://aprova-catala.vercel.app** (pruébala desde el
móvil: diagnóstico completo y simulacro de C1).

Lo único que te toca a ti, en orden:
1. **Conseguir los 20 candidatos reales al C1 y un profesor para la prueba de validez** (academias de oposiciones de Lleida, CNL de Lleida,
   UdL o EOI). Borrador de correo listo en `marketing/comunitats.md` (final del archivo); protocolo en `VALIDESA.md`; los candidatos
   entran en https://aprova-catala.vercel.app/ca/validesa con uno de los 20 códigos de la variable `VALIDESA_CODIS` (Vercel → aprova-catala →
   Environment Variables; la clave del profesor es `VALIDESA_CLAU`, en el mismo sitio). Sin el 80 % de coincidencia no se lanza.
2. **Crear las dos tareas programadas** con un clic en claude.ai/code → tareas programadas: el prompt y el cron exactos están en
   `TAREA-PROGRAMADA.md` (semanal: 50 ítems validados y fechas oficiales; mensual: informe de coste por usuario).
3. **Proveedor de voz (opcional, solo si quieres audio sintetizado en vez de la voz del móvil):** añadir como secreto del entorno
   `GOOGLE_TTS_API_KEY` (o `AZURE_TTS_KEY`) y poner `TTS_PROVEIDOR=google` en Vercel → aprova-catala → Environment Variables. Hoy los
   dictados y la comprensión oral usan la voz en catalán del propio navegador (gratis). La corrección por criterios con modelo de
   lenguaje necesita `ANTHROPIC_API_KEY` (o `BSC_API_URL` de Salamandra) como secreto del entorno; sin ella corrige con LanguageTool y
   reglas y marca los criterios de adecuación, coherencia y riqueza como orientativos.
4. **Mes 2: aprobar o no los anuncios de búsqueda** (100 €/mes). Campaña preparada en `marketing/google-ads/`, sin activar.
5. **Antes de cobrar: poner el NIF** en la variable `LEGAL_NIF` de Vercel (hoy el aviso legal dice «pendent») y, si quieres, el dominio
   `aprova.cat` (12–15 €/año). Hasta entonces, `aprova-catala.vercel.app`.

Nada más. Las respuestas de soporte las deja redactadas la tarea semanal aquí debajo para que pulses «enviar».
