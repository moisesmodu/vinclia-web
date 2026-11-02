# Estado de la sesión del Mac (2/11/2026) — para la sesión que la sustituya

## Reglas de Moisés
- **Nunca abrir ni usar Brave**, ni minimizado ni con osascript: solo API, CLI o Playwright headless (executablePath `~/Library/Caches/ms-playwright/chromium_headless_shell-1248/...`).
- Actuar sin preguntar lo que sea de criterio técnico; pedir autorización explícita solo para lo que bloquea el sistema de permisos (correos reales, cupones o cobros reales, BD de producción).
- Credenciales en `~/.config/cartera/secretos.env` (y `panel_ro.env`, `panel_db.env`); nunca imprimirlas.

## Hecho y en producción
- Dominios propios con DNS en Vercel, SSL, Resend verificado y remitentes por dominio: ccsefacil.com (A), tuspapeles.app (N), oposita.digital (B), lunilla.cat (G), netoclaro.app e impuestoclaro.es (P).
- Search Console: los 6 dominios verificados por TXT y con los sitemaps enviados. Web Analytics activo en las 8 webs.
- Auditoría y mejoras publicadas en A, N, B, G, P (4 sitios), M y la web de juegos (`AUDITORIA.md` en cada rama). Lunilla rediseñada («La hora del cuento»), 16 vistas previas completas y JSON-LD con envío y devoluciones.
- B: 70 páginas de convocatoria con los 35 procesos verificados en DOGC, BOE y BOP; páginas de auxiliar por ayuntamiento (Barcelona, Figueres).
- Stripe real en A, N, B y G: productos con el nombre de marca, sufijo en el extracto (pagos únicos), HERMANOS20 en real; atribución gclid en A y B.
- AdSense pub-1805394669180486: netoclaro.app e impuestoclaro.es verificados y en revisión (hasta 4 semanas).
- Panel de mando (https://cartera-moisesmodu-3705s-projects.vercel.app/): Hoy, Proyectos, Tareas, Marketing (con botón «Enviar todos» de los 9 correos), Ventas, Usuarios, Suscripciones y Juegos. BD propia `cartera-panel`; lectura de las BD de las apps con el rol `panel_ro`.
- Juegos: 18 en itch.io. GameMonetize los rechazó por calidad (y «no aceptan juegos con IA»), CrazyGames rechazó Egg Truck. **Juegos aparcados por decisión de Moisés.**

## Numi Mates y Numitech en el panel (commit ed56658)
- Ya aparecen en Hoy, Proyectos, Ventas y Suscripciones (Stripe «Numi Mates Premium» repartido).
- Faltan los usuarios: la DATABASE_URL de `mates-numi` es sensitive y no está en Neon accesible. Hace falta que Moisés pegue la conexión en `~/mates-numi/.env.local` o cree el rol `panel_ro` con el SQL de panel/DESPLIEGUE.md (esquema `mates`) y guarde DB_RO_NUMI en `cartera`.
- Faltan las visitas: añadir `@vercel/analytics` en los repos `numimates` y `numimates-web`.

## Pendiente de Moisés (también en el panel → Tareas)
1. Panel → Marketing → Correos → «Enviar todos (9)».
2. Pegar los mensajes de B en los grupos (~/Desktop/MENSAJES-OPOSITA.html).
3. AdSense → Privacidad y mensajes → mensaje RGPD (logotipos ya subidos) → Publicar.
4. Google Play: identidad verificada → crear la app «Test CCSE Nacionalidad 2026» y subir el AAB (~/Desktop/google-play/ccse-1.0.1.aab).
5. Cuentas a su nombre: Instagram @lunilla.cuentos, Google Ads (ID de cliente para importar las campañas en pausa), afiliados de Xolo.
6. Dominios: nuvolet.games y aprovacatala.cat (cuando retome juegos y M).
7. Pagos de prueba reales en A, B y G (N hecho: 19,90 € reembolsado).

## Esperando su autorización
- Motor de ventas en A, N, B y G: captación de correos con consentimiento, secuencias automáticas, ofertas de lanzamiento en Stripe real (A −20 % hasta el 30/11, B primer mes a 4,99 €, G −15 % tapa dura hasta el 10/12) y tabla de contactos en sus BD. Frase: «autorizo captar correos con consentimiento, enviar secuencias automáticas a quien se apunte, crear las ofertas de lanzamiento en Stripe real y añadir la tabla de contactos en las bases de datos».

## Bucle
Cada 30 min (:13 y :43): fetch, desplegar commits nuevos de las ramas de proyecto o líneas «Pendiente de ejecutar» de DESPLIEGUE.md, verificar y anotar en el panel.
