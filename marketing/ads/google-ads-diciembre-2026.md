# Propuesta de Google Ads · 300 €/mes desde diciembre de 2026 · CCSE (ccsefacil.com) y Plaça (oposita.digital)

> Pedida por la sesión del Mac el 1/11. **Es una propuesta: no se activa nada sin la aprobación mensual de Moisés**
> (SESIONES.md, VIABILIDAD §5). Solo búsqueda de Google, sin Display ni Performance Max. Mi recomendación va primero
> porque los números de los dos proyectos no son iguales.

## 0. Recomendación en tres líneas

1. **Plaça se lleva 220 €/mes**: margen de 55 € por cliente, CPA objetivo de 25 € (regla de la cartera), campaña ya
   preparada en `proyectos/b-oposiciones/marketing/google-ads/` y exámenes de TCAI, Bombers y Barcelona entre diciembre
   y febrero.
2. **CCSE se lleva 80 €/mes como prueba, no como inversión**: el margen por venta es de 9,2 € y el CPA previsto con
   anuncios es de 12 a 20 €. Solo compensa si se mide la venta cruzada a Tus Papeles (22 € más de margen) y el CPA real
   queda por debajo de 9 €. Si a las 3 semanas no, se apaga y el dinero pasa a Plaça.
3. **Sin medición de conversiones no se enciende nada.** Hay que llevar el `gclid` al pago de Stripe (sección 4): es un
   cambio pequeño en las dos webs y sin él solo veríamos clics.

## 1. Presupuesto y objetivos

| Campaña | Presupuesto | CPC previsto | Clics/mes | Conversión prevista | Ventas/mes | CPA previsto | CPA máximo | Margen por venta | Resultado previsto |
|---|---|---|---|---|---|---|---|---|---|
| Plaça · Búsqueda Cataluña | 220 € (7,30 €/día) | 0,60–0,80 € | 280–370 | 3–4 % (búsqueda con intención) | 9–14 | 16–24 € | **25 €** | 55 € (6 meses) | +300 a +550 € de margen a 6 meses por cada mes de campaña |
| CCSE · Búsqueda España | 80 € (2,65 €/día) | 0,30–0,50 € (concordancia exacta, cola larga) | 160–270 | 4 % | 6–11 | 7–13 € | **9 €** (12 € si se mide la venta cruzada a N) | 9,2 € (+22 € si compra N) | de −30 a +20 €: es una prueba |
| **Total** | **300 €** | | | | **15–25** | | | | |

Ubicación: Plaça en Cataluña (catalán y castellano); CCSE en toda España (castellano), con exclusión de Ceuta y
Melilla no necesaria. Horario: todo el día, con puja −30 % de 1:00 a 7:00. Dispositivos: móvil primero (la mayoría
del público de CCSE y de opositores busca desde el móvil), sin ajuste negativo en móvil.

## 2. Plaça · estructura, palabras clave y anuncios

Base: `marketing/google-ads/palabras-clave.csv` (29 palabras clave), `negativas.csv` (20) y `anuncios.csv` (6 anuncios
adaptables), importables en Google Ads Editor. Cambios respecto a lo preparado el 28/10:

- **URL finales a oposita.digital** (`https://oposita.digital/ca/mossos-esquadra` etc.) con `?utm_source=google&utm_medium=cpc&utm_campaign=placa-<grupo>`.
- **Prioridad por calendario** (presupuesto por grupo de anuncios, dentro de los 220 €):

| Grupo | Presupuesto | Por qué ahora | Palabras clave principales (concordancia de frase) | CPC máx. |
|---|---|---|---|---|
| TCAI ICS | 60 € | Examen de la estabilización previsto desde enero de 2027 | «test tcai ics», «test auxiliar infermeria ics», «temari tcai estabilització», «test tcai oposiciones cataluña» | 0,70 € |
| Bombers 81/26 | 50 € | Prueba de conocimientos pendiente; 300 plazas | «test bombers generalitat», «test bomber primera 81/26», «temari bombers generalitat test», «test bomberos generalitat» | 0,70 € |
| Ayuntamientos C2 (Barcelona 128/2026) | 50 € | Examen en febrero de 2027 | «test auxiliar administratiu ajuntament barcelona», «test auxiliar administrativo ayuntamiento cataluña», «temari comú ajuntaments test» | 0,80 € |
| Mossos | 40 € | 46/26 en curso; subir a 80 € cuando se anuncie la 46/27 | «test mossos d'esquadra», «test mossos 2027», «simulacro examen mossos», «preguntes test mossos» | 0,80 € |
| Generalitat C2 (870) | 20 € | Cola larga estable | «test auxiliar administratiu generalitat», «temari auxiliar administratiu generalitat test» | 0,80 € |

- **Negativas añadidas** a las 20 existentes: «gratis pdf», «descargar», «academia», «curso presencial», «sueldo»,
  «convocatoria boe» (quien busca la convocatoria no busca tests), «mossos series», «bombers barcelona ajuntament» (otro
  cuerpo, no cubierto).
- **Anuncios**: los 6 adaptables existentes (5 títulos y 2 descripciones) con dos títulos nuevos fijados en posición 1
  y 2 por grupo: «Test TCAI ICS 2027 · 20 gratis» / «Amb l'article de la llei»; «Test Bombers 81/26» / «Simulacre de 70
  preguntes». Extensiones: enlaces de sitio (Convocatòries 2027, Preus, Simulacre, Blog), llamadas («Sense permanència»,
  «Historial que no s'esborra», «Català i castellà»), fragmentos (Oposicions: Mossos, Bombers, ICS, Generalitat,
  Ajuntaments).
- **Página de destino**: la de cada oposición (ya tiene el test gratis arriba, la oferta al acabar y la FAQ del
  simulacre). No se crea página de aterrizaje aparte.

## 3. CCSE · estructura, palabras clave y anuncios (prueba de 80 €)

Una campaña, dos grupos, **concordancia exacta** para no pagar búsquedas informativas, CPC máximo 0,40 €.

| Grupo | Presupuesto | Palabras clave (exacta) | Negativas propias |
|---|---|---|---|
| Test CCSE | 50 € | [test ccse], [test ccse 2026], [test ccse 2027], [simulacro ccse], [preguntas examen ccse], [examen ccse preguntas], [practicar examen ccse], [app examen ccse] | gratis pdf, descargar, respuestas pdf, instituto cervantes inscripción, resultados, fechas, exentos, dele, a2, precio examen, 85 euros, cita |
| Nacionalidad por residencia | 30 € | [examen nacionalidad española test], [test nacionalidad española], [preguntas examen nacionalidad española], [examen de nacionalidad preguntas] | abogado, requisitos, expediente, tarjeta, plazo, denegada, jura |

Anuncios adaptables (títulos ≤ 30 caracteres, descripciones ≤ 90), uno por grupo:

**Grupo Test CCSE**
- Títulos: «Test CCSE 2026: 300 preguntas» · «25 preguntas gratis sin registro» · «Explicado en tu idioma» · «Simulacro de 25 en 45 minutos» · «9,99 € pago único, 90 días» · «Garantía de aprobado» · «Español, árabe, francés, rumano»
- Descripciones: «Las 300 preguntas oficiales del manual 2026, explicadas en 7 idiomas. Test gratis sin registro.» · «Simulacro real, repaso de fallos y lectura en voz alta. No es oficial del Instituto Cervantes.»
- URL final: `https://ccsefacil.com/es?utm_source=google&utm_medium=cpc&utm_campaign=ccse-test` · rutas: /test/gratis

**Grupo Nacionalidad**
- Títulos: «Examen de nacionalidad: test» · «Aprueba el CCSE a la primera» · «300 preguntas explicadas» · «Gratis: 25 preguntas y simulacro» · «Después, tus trámites en N» · «Pago único 9,99 €»
- Descripciones: «Prepara el examen CCSE de nacionalidad con las preguntas oficiales explicadas en tu idioma.» · «Y al aprobar, la guía de la nacionalidad paso a paso en Tus Papeles. Hecho en Lleida.»
- URL final: `https://ccsefacil.com/es/examen?utm_source=google&utm_medium=cpc&utm_campaign=ccse-nacionalidad`

Extensiones: enlaces de sitio (Test gratis, Cómo es el examen, Fechas 2027, Precio), llamadas («Sin suscripción»,
«Cancela en un clic», «7 idiomas»). Idiomas de la campaña: castellano (los grupos en árabe y francés solo si la prueba
en castellano pasa el corte: el público árabe busca en árabe y el CPC es más bajo, pero sin datos no se abre).

## 4. Medición de conversiones (obligatoria antes de encender)

Las dos webs ya miden el embudo con eventos de Vercel Web Analytics: CCSE `minitest_terminado`, `checkout_iniciado`,
`pago_completado`; Plaça `test_inicio`, `test_fin`, `oferta_clic`, `plan_clic`, `registro_ok`, `checkout_ir`. Sirven
para el diagnóstico del embudo, pero **Google Ads no los ve**. Para que la campaña optimice y para calcular el CPA real
hacen falta dos cosas, las dos sin cookies de terceros:

1. **`gclid` hasta Stripe (PR pequeño en A y en B, lo hace la tarea semanal o cada sesión de proyecto):** al cargar
   cualquier página con `gclid` o `utm_*` en la URL, guardarlos en `sessionStorage` (o en una cookie propia de 30 días,
   informada en la política de cookies) y pasarlos como `metadata.gclid`, `metadata.utm_source`, `metadata.utm_campaign`
   al crear la sesión de Checkout. Así cada pago de Stripe sabe de qué anuncio vino.
2. **Importación de conversiones fuera de línea**: cada lunes, la tarea semanal exporta de Stripe los pagos con
   `metadata.gclid` (fecha, importe, `gclid`) y los sube a Google Ads («Conversiones» → «Importar» → «De clics»), o
   por la API. Google Ads aprende de las ventas reales, no de clics. Para CCSE se importan dos conversiones: «Compra
   CCSE» (9,99 €) y «Compra Tus Papeles tras CCSE» (si el cliente de N viene con `utm_source=a-ccse` y un `gclid` de
   CCSE en los 30 días siguientes).
3. **Etiqueta de Google Ads en la web: no por ahora.** Exigiría un banner de consentimiento y Consent Mode en webs
   que hoy no usan cookies; la importación fuera de línea mide lo mismo con una semana de retraso.

Conversión principal de cada campaña: el pago (no el registro ni el clic en «precio»). Estrategia de puja: **CPC
manual con CPC mejorado** las 3 primeras semanas (sin historial no hay Smart Bidding fiable); después, «Maximizar
conversiones» con CPA objetivo solo si hay más de 15 conversiones importadas.

## 5. Regla de corte a las 3 semanas (21 de diciembre si se enciende el 1/12)

| Señal a los 21 días | Decisión |
|---|---|
| Grupo con 60 € gastados y 0 ventas importadas | Se pausa el grupo |
| Plaça con CPA combinado > 25 € | Se pausa la campaña entera hasta revisar palabras clave y página |
| Plaça con CPA ≤ 25 € y ≥ 5 ventas | Sigue; en enero se sube a 300 € si el CPA aguanta y Moisés aprueba |
| CCSE con CPA > 9 € (o > 12 € contando la venta cruzada a N medida) | Se apaga CCSE; sus 80 € pasan a Plaça (TCAI y Ayuntamientos) |
| CCSE con CPA ≤ 9 € | Sigue con 80 €; se abre un grupo en árabe con 30 € en enero (pico de inscripción del examen de enero) |
| Cualquier campaña | Aprobación mensual de Moisés; parada automática el día 21 si no la renueva |

Fecha de encendido propuesta: **lunes 1 de diciembre**, después de 4 semanas de orgánico (así el CPA de los anuncios
se compara con un orgánico medido y no con cero). Si el 24/11 Plaça ya tiene conversión orgánica medida, se puede
adelantar al 25/11 para aprovechar el calendario de TCAI.

## 6. Lo que decide Moisés (en una línea cada cosa)

1. ¿300 €/mes desde el 1/12 con el reparto 220/80? (Alternativa prudente: 220 € solo en Plaça y CCSE sin anuncios.)
2. ¿Se autoriza el PR de `gclid` a Stripe en A y B? (Sin él no se enciende nada.)
3. ¿Quién tiene la cuenta de Google Ads? Hay que crearla a nombre de Moisés (método de pago suyo); Claude importa los
   archivos de Google Ads Editor y deja todo en pausa para que él pulse «Activar».
