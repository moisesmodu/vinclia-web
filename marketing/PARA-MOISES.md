# Para Moisés: lo único que exige tu identidad esta semana (máximo 5)

Todo lo demás lo hace Claude. Orden por impacto en el primer euro y en el posicionamiento. Fecha: 31/10/2026.

| # | Tarea | Tiempo | Dónde | Por qué |
|---|---|---|---|---|
| 1 | **Pegar los 5 mensajes de Plaça ya aprobados** (B-01 a B-05) en los grupos de Telegram/WhatsApp de Bombers y TCAI, los hilos de Mossos, los grupos de Facebook y el correo a los sindicatos. El lunes 2 y el miércoles 4 según el calendario. | 10 min | `marketing/piezas/b-oposiciones/semana-1.md` | Es el primer euro más cercano de toda la cartera: cobro real activo y mensajes aprobados |
| 2 | **Marcar ✅ en `APROBAR.md`** las piezas de la semana 1 (y ✖ con una palabra de motivo las que no). Empieza por A-01, A-02 y A-03: la inscripción del CCSE cierra el jueves 5. | 15 min | `marketing/APROBAR.md` | Sin tu ✅ no sale nada hacia fuera |
| 3 | **Search Console, 6 dominios.** Entra con tu cuenta de Google, «Añadir propiedad» → tipo **Dominio** → escribe `ccsefacil.com` → copia el valor `google-site-verification=…` que te da y **pégalo en el chat de esta sesión** (o de la del Mac). Repite con `tuspapeles.app`, `oposita.digital`, `lunilla.cat`, `netoclaro.app` e `impuestoclaro.es`. No pulses «Verificar» todavía: Claude pone el TXT en los DNS de Vercel con `scripts/search-console-txt.mjs` y te avisa para que pulses. | 2 min por dominio | https://search.google.com/search-console/welcome | Sin Search Console Google no recibe los sitemaps ni sabemos qué posiciona; es el paso que más acelera el SEO de las 6 webs |
| 4 | **Crear la cuenta de Instagram @lunilla.cuentos** (y la de TikTok si te da tiempo) con la biografía de G-05. | 5 min | https://www.instagram.com/accounts/emailsignup/ · texto en `piezas/g-cuentos/semana-1.md` (G-05) | Las afiliadas y los vídeos de Navidad salen desde ahí; la campaña abre el 15/11 |
| 5 | **Solicitar el programa de afiliados de Xolo** con el texto de P-09 (y Qonto y Quipu si el formulario lo permite). | 5 min | https://www.xolo.io/es-en/affiliate-program · texto en `piezas/p-webs-adsense/semana-1.md` (P-09) | 29 € por cliente: el primer euro de NetoClaro sin esperar a AdSense |

## Después de Search Console (mismo día, 10 minutos más, cuando Claude te avise de que el TXT está)

- Pulsar «Verificar» en cada propiedad y, dentro, «Sitemaps» → añadir `sitemap.xml`. Claude te deja la lista exacta.
- AdSense: con los dominios propios ya se puede solicitar para netoclaro.app (tarea 6 de la lista del panel).
- Bing Webmaster Tools → «Importar desde Search Console»: un clic y las 6 webs quedan también en Bing.

## La semana que viene (para que lo veas venir, sin hacer nada hoy)

- Pulsar «Public» en la página de Egg Truck en itch.io y pegar el devlog J-02 (desbloquea r/WebGames y r/playmygame el sábado 7).
- Cuentas de TikTok, Instagram y YouTube para **CCSE en tu idioma** y **Nuvolet Games** (los vídeos de A-07 y J-07 esperan a eso).
- Visita de 10 minutos al CNL o a una academia de Lleida si responden al correo de la prueba de validez (M-01, M-02).
- Decisión sin prisa: afiliados de A al 30 % sobre bruto o neto (afecta a las plantillas de academias de la semana 3).

## Lo que NO te pedimos (lo hacen las sesiones o la del Mac)

Poner `NEXT_PUBLIC_URL=https://oposita.digital` en Vercel para Plaça y redesplegar las 7 webs con el código SEO nuevo
(analítica, verificación, artículos); los TXT de verificación en los DNS; los artículos SEO y sus commits; la
producción de los vídeos; la actualización del panel cada lunes; las listas de comunidades y gestorías con sus correos.
