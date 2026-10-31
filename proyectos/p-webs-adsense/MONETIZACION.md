# Monetización · Proyecto P (NetoClaro e ImpuestoClaro)

Plan del primer euro según SESIONES.md, «Monetizar primero». Se actualiza cada lunes con las cifras reales del informe
semanal (TAREA-PROGRAMADA.md). Última actualización: 28/10/2026, sin datos reales todavía.

## Cómo se cobra

- **Solo AdSense.** El visitante no paga nada. No hay precio ni pantalla de pago, porque las calculadoras son gratis.
- **Dos bloques de anuncio por página:** uno bajo el resultado y otro al final del texto. Nunca hay anuncios antes del
  formulario.
- **Nada de anuncios de pago para traer visitas.** Las visitas llegan por SEO.
- El cobro real empieza cuando Google aprueba la cuenta de AdSense. Para eso hacen falta:
  1. el dominio propio;
  2. el sitio cargando en ese dominio;
  3. el código de verificación pegado.
  Moisés hace estos tres pasos (PARA-MOISES.md, tareas 1 y 2).

## Los anuncios ya están preparados: con el `ca-pub` no hay que tocar código

| Cuándo | Qué hace la sesión del Mac | Qué pasa en el sitio |
|---|---|---|
| Moisés manda el `ca-pub-…` | Pone la variable `ADSENSE_CLIENT` y redespliega | Se generan `ads.txt` y la meta de verificación. También se carga el consentimiento de Google (TCF 2.2, rechazado por defecto) y el script de AdSense, de forma diferida. Con los **anuncios automáticos** activados en AdSense, ya se sirven anuncios |
| Moisés crea los dos bloques en AdSense («bajo-resultado» y «fin-contenido») | Pone `ADSENSE_SLOT_RESULTADO` y `ADSENSE_SLOT_FINAL` y redespliega | Aparecen los dos huecos fijos, que reservan 280 px y no mueven la página |

Sin `ca-pub` no se carga nada de Google, así que la página sigue con Lighthouse 100. El paso a paso está en
DESPLIEGUE.md, en el apartado «Después».

## Segunda vía: afiliación (más rápida que AdSense)

Los bloques «Publicidad · Enlace patrocinado» ya están bajo el resultado de las calculadoras que encajan (`AFILIACION.md`).
Se encienden solos con la variable `AFILIADO_<ID>`. Funcionan sin dominio propio y sin esperar a que Google apruebe
AdSense, así que pueden dar el primer euro antes.

| Programa | Pago | Dónde va | Altas necesarias para el primer euro |
|---|---|---|---|
| Xolo (gestoría de autónomos) | 29 € por cliente | Neto de autónomo, precio por hora, «¿autónomo o asalariado?» | 1 alta. Con una conversión del 0,3 % sobre unas 330 visitas a esas calculadoras |
| Qonto (cuenta de negocio) | 20 € por cuenta activa | Tarifa plana, factura | 1 cuenta |
| Quipu (facturación) | 30 % de la cuota durante 12 meses | Factura, IVA, 303, 130, Verifactu | 1 cliente, unos 3–5 € al mes durante un año |

**Fecha prevista del primer euro con afiliación:** unos 7–10 días después de que Moisés se dé de alta en Xolo y Qonto y
lleguen las primeras visitas de foros (las 100 primeras visitas, más abajo). Es una estimación y depende sobre todo de
la tasa de conversión, que hoy no conocemos.

## Previsión de RPM, en euros por 1.000 páginas vistas

Son estimaciones y no datos medidos. Las he sacado de rangos públicos de AdSense para España en nichos de finanzas
personales. Las páginas en catalán y el tráfico desde el móvil rinden menos. La cifra real se sabrá en la segunda semana
con anuncios.

| Sitio | Bajo | Medio | Alto | Motivo |
|---|---|---|---|---|
| NetoClaro (nómina y laboral) | 2 € | 4 € | 7 € | Anunciantes de empleo, bancos y gestorías de nóminas. Mucho tráfico desde el móvil |
| ImpuestoClaro (impuestos y autónomos) | 3 € | 6 € | 10 € | Anunciantes de gestorías online, software de facturación y bancos para autónomos, que pujan más alto. Picos en enero, abril, julio y octubre por los modelos trimestrales, y de abril a junio por la renta |

## Visitas necesarias

Una visita de calculadora genera de media unas 1,3 páginas vistas, porque el visitante suele pasar a la calculadora
relacionada o a una ficha de datos.

| Objetivo | NetoClaro (RPM medio 4 €) | ImpuestoClaro (RPM medio 6 €) |
|---|---|---|
| **Primer euro** | ~250 páginas vistas, unas 190 visitas | ~170 páginas vistas, unas 130 visitas |
| **100 €/mes con un solo sitio** | ~25.000 páginas vistas al mes, unas 650 visitas al día | ~16.700 páginas vistas al mes, unas 430 visitas al día |
| **100 €/mes repartidos entre los dos** | ~12.500 páginas vistas al mes | ~8.300 páginas vistas al mes |

En el escenario bajo, el objetivo de 100 €/mes necesita el doble de tráfico. En el alto, la mitad.

## Embudo, de la visita al euro

| Paso | Porcentaje esperado | Comentario |
|---|---|---|
| Página indexada en Google | 60–80 % de las 380 páginas en 4–6 semanas | El sitemap se envía a Search Console el mismo día en que se conecta el dominio |
| Impresión en Google → clic | CTR del 2–5 % en posiciones 5–15 | Los títulos llevan el año y la cifra («Sueldo neto 2026»). Las búsquedas de cola larga tienen poca competencia |
| Clic → página vista con anuncio | ~85 % | El resto rechaza el consentimiento o usa un bloqueador. Sin consentimiento siguen saliendo anuncios no personalizados, pero valen menos |
| Página vista → ingreso | RPM de la tabla anterior | Sin clics forzados. Los anuncios van después del resultado, cuando el visitante ya tiene lo que buscaba |

## De dónde salen las 100 primeras visitas, sin pagar anuncios

Todo lo que se publique fuera lo aprueba Moisés antes, y cada respuesta resuelve primero la duda de quien pregunta.

1. **Search Console, desde el primer día con dominio.** Hay que enviar el sitemap y pedir la indexación de las 10
   calculadoras principales. Con eso llegan 20–40 visitas en las dos primeras semanas, por búsquedas muy concretas como
   «finiquito 2026 calculadora» o «cuota autónomos 2027».
2. **Respuestas útiles en foros donde ya se pregunta esto.** Son unas 40–60 visitas.
   - **Dónde:** r/spain y r/askspain en Reddit, los hilos de nóminas y de autónomos de Forocoches, y foros de
     autónomos como los de Infoautónomos o Emprendedores.
   - **Cómo:** se responde con el cálculo hecho y el enlace a la calculadora con los datos ya puestos. El enlace
     guarda los datos en la propia dirección.
   - **Ritmo:** entre 5 y 10 respuestas por semana, que la sesión deja redactadas para que Moisés las publique.
3. **Fichas de datos citables.** Hay 10 por sitio, con CSV descargable: SMI, IPREM, tramos de IRPF, bases de cotización,
   cuotas de autónomos…
   - **Para quién:** periodistas y blogs de finanzas que buscan una tabla con la fuente oficial.
   - **Cómo:** se ofrece la ficha cuando una de estas cifras cambia, por ejemplo con el SMI de 2027 o los tramos de
     autónomos.
   - **Qué se espera:** unas 10–20 visitas y algún enlace entrante.
4. **Contactos de Moisés.** Se comparte la calculadora de sueldo neto y la de cuota de autónomos con conocidos que
   tengan nómina o sean autónomos. Son unas 10 visitas, y además sirven para encontrar errores reales.

## Fecha prevista del primer euro

No se puede cumplir la regla de los 14 días después del despliegue, y lo digo claramente. Los sitios están desplegados
desde el 28/10 en `*.vercel.app`, pero:

- Google no aprueba AdSense en un subdominio de `vercel.app`, así que hace falta el dominio propio;
- la revisión de la cuenta suele tardar entre unos días y 2–4 semanas.

| Paso | Fecha si los dominios se compran el 30/10 |
|---|---|
| Dominios comprados y conectados; Search Console y solicitud de AdSense el mismo día | 30–31/10 |
| Primeras visitas orgánicas y de foros | 3–14/11 |
| Aprobación de AdSense, en el mejor caso / en el caso típico | 7/11 / 20–28/11 |
| **Primer euro de AdSense** (llega con las primeras ~200 páginas vistas con anuncios) | **mejor caso 13/11 · previsto 30/11/2026** |
| Primer pago efectivo de Google, cuando el saldo supera 70 € | Probablemente en enero o febrero de 2027 |

Cada día de retraso en la compra de los dominios retrasa el primer euro un día.

## Cifras reales (se actualiza cada lunes)

| Semana | Páginas indexadas | Visitas | Páginas vistas | RPM real | Ingresos | Nota |
|---|---|---|---|---|---|---|
| 26/10–01/11 | 0 | 0 | 0 | — | 0 € | Desplegados en vercel.app, a la espera de los dominios |
