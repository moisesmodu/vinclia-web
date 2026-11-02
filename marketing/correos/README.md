# Correos aprobados, listos para enviar

`semana-1.json`: los 9 correos de la semana 1 aprobados por Moisés el 1/11 (A-05 ×3, N-05, B-05, M-01 ×2, P-08, P-11)
con destinatario público, remitente de marca (dominios verificados en Resend) y respuesta a hola@numimates.com.

Envío (sesión del Mac o cualquier sesión con permiso de envío y `RESEND_API_KEY`):

```bash
node scripts/enviar-correos-marketing.mjs marketing/correos/semana-1.json --simular   # revisa
node scripts/enviar-correos-marketing.mjs marketing/correos/semana-1.json             # envía y anota en marketing/ENVIADOS.md
```

La sesión de marketing en la nube preparó el envío el 1/11, pero su política de permisos bloquea las transacciones
hacia fuera (envío de correo), así que no salieron desde ahí.

Direcciones usadas y su fuente (buscador; las webs oficiales no eran alcanzables desde la nube): Accem Catalunya
`catalunya@accem.es` (carta de servicios 2015), CEAR Catalunya `ccar@cear.es` (directorio del Ministerio de Inclusión),
Creu Roja Lleida `lleida@cruzroja.es` (listado 2020), Càritas Lleida `caritasdiocesana@caritaslleida.net` (tríptico del
bisbat, 2013), CCOO sector Generalitat `gene@ccoo.cat` (documentos del sector), CNL de Lleida `lleida@cpnl.cat` y UdL
Institut de Llengües `il.escola@udl.cat` (directorio de paeria.cat), Col·legi d'Economistes `cec@coleconomistes.cat`
(pla d'acció 2021), La Mañana `lamanyana@lamanyana.cat` (guia de la Diputació, 2009). Si alguno rebota, buscar el
formulario de contacto en la web oficial.

Sin correo público (usar el formulario de su web): UGT Serveis Públics (ugt.cat), Intersindical-CSC
(intersindical-csc.cat), CATAC-IAC (sindicat.net), Col·legi de Graduats Socials de Lleida (graduados-sociales.com, tel.
973 24 03 25), Segre (segre.com, tel. 973 24 80 00). Pendientes de lista propia: 5 gestorías de Lleida (P-07) y 3 AMPA
o escoles bressol (G-08).
