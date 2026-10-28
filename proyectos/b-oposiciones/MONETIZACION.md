# Monetización · Plaça (proyecto B)

> SESIONES.md, «Monetizar primero». Se actualiza cada semana con las cifras reales (lo hace la tarea programada).
> Despliegue: 28/10/2026 en https://placa-oposicions.vercel.app. **Primer euro: objetivo el 11/11/2026** (14 días).

## 1. Precio
| Plan | Precio | Por mes | Qué desbloquea |
|---|---|---|---|
| Mensual | 9,99 € | 9,99 € | Todas las preguntas de las 5 oposiciones, simulacros completos, repaso, estadísticas |
| Trimestral | 23,97 € | 7,99 € | Lo mismo |
| Anual | 71,88 € | 5,99 € | Lo mismo |

IVA incluido. Gratis: 20 preguntas por oposición, sin registro. Cancelación en un clic. Stripe (cuenta Numi Mates).
Margen por cliente: unos 55 € de vida (6 meses de media, VIABILIDAD §1).

## 2. El pago en la primera sesión (ya construido)
1. **Visita** a una página de oposición o de tema (SEO o enlace de una comunidad) → botón «Fes un test gratis».
2. **Test gratis** de 10 preguntas, sin registro, con explicación y artículo en cada respuesta.
3. **Justo al acabar**, la pantalla de resultado ofrece el pago con un motivo concreto de esa oposición: «Això eren preguntes
   gratis. Mossos d'Esquadra en té 346», el simulacro completo con su formato (30 preguntas, 35 minutos) y el precio con IVA.
4. **Un botón** → si no hay cuenta, registro (correo y contraseña) y de ahí **directo a Stripe Checkout**. Dos pantallas entre
   «lo quiero» y «pagado»: registro y Stripe.
5. **Recuperación (un aviso como máximo):** la sesión de pago caduca a las 2 horas con recuperación de Stripe activada; el
   webhook `checkout.session.expired` manda **un** correo con el enlace nuevo (Resend, remitente noreply@numimates.com,
   respuesta a hola@numimates.com), y la app muestra **una vez** el aviso «Tens el pagament a mitges» en la práctica y en la cuenta.

## 3. Embudo esperado (hipótesis; se sustituye por datos reales cada semana)
| Paso | % del paso anterior | De 100 visitas |
|---|---|---|
| Visita a la página de la oposición o del tema | — | 100 |
| Empieza el test gratis | 45 % | 45 |
| Termina el test (ve la oferta) | 70 % | 32 |
| Pulsa «Desbloquejar» | 10 % | 3,2 |
| Crea la cuenta | 75 % | 2,4 |
| Paga en Stripe | 65 % | **1,6** |
| Recupera tras el aviso | +15 % de los que no pagaron | +0,1 |

Conversión de visita a pago: **≈ 1,7 %** con tráfico de comunidad; 3-4 % con tráfico de búsqueda con intención ("test mossos
2026"). **Para el primer euro hacen falta unas 60-100 visitas cualificadas.** Para 50 suscriptores (criterio de éxito de JUICIO.md),
unas 3.000 visitas al mes.

## 4. Las 100 primeras visitas, sin anuncios
El SEO (246 URLs) tarda de 3 a 6 meses: no llega en 14 días. Las primeras visitas salen de comunidades donde ya está el
opositor. **Ninguna publicación sale sin la aprobación de Moisés** (SESIONES.md, regla 1): los textos están listos abajo.

| Canal | Oposición | Visitas esperadas | Por qué ahora |
|---|---|---|---|
| Grupos de Telegram de Bombers 81/26 (academias y opositores) | Bombers | 25 | Plazo cerrado el 29/09; examen de 70 preguntas pendiente: buscan tests ya |
| Grupos de Telegram/WhatsApp de la estabilización del ICS (TCAI e infermeria) | TCAI | 25 | Examen previsto desde enero de 2027 |
| Hilos de Forocoches y Mediavida «Mossos 2026/2027» y r/oposiciones | Mossos | 20 | 46/26 en marcha; la 46/27 se anunciará en primavera |
| Grupos de Facebook «Oposicions Generalitat de Catalunya» y «Oposicions ajuntaments Catalunya» | Generalitat y ajuntaments | 20 | Barcelona 128/2026 examina en febrero de 2027 |
| Delegados sindicales (CCOO, UGT, Intersindical, CATAC) con la página Convocatòries 2027 como recurso | Todas | 10 | Enlazan recursos gratis a su afiliación |
| **Total** | | **100** | |

### Mensajes listos (catalán; versión castellana igual)
- **Bombers:** «He fet una web amb tests per al temari de la 81/26 (bomber/a de primera): 350 preguntes amb l'article de la
  llei a cada resposta i simulacres de 70 preguntes amb la penalització real. 20 preguntes gratis sense registre:
  https://placa-oposicions.vercel.app/ca/bombers-generalitat — si trobeu un error, cada pregunta té un botó per avisar.»
- **TCAI ICS:** «Tests del temari de TCAI de la convocatòria 100-2025 de l'ICS, en català i castellà, amb la llei a cada
  resposta: https://placa-oposicions.vercel.app/ca/tcai-ics (20 preguntes gratis, sense registre).»
- **Mossos:** «Per a la 46/26 i la propera: tests per tema dels 21 temes i simulacres de 30 preguntes en 35 minuts amb −1/4,
  com a l'examen: https://placa-oposicions.vercel.app/ca/mossos-esquadra»
- **Generalitat i ajuntaments:** «Tests de la 870 (auxiliar administratiu C2) i del temari comú d'ajuntaments, amb casos
  pràctics i l'article de cada resposta: https://placa-oposicions.vercel.app/ca/auxiliar-administratiu-generalitat»
- **Sindicats:** «Hem fet una pàgina gratuïta amb les convocatòries de Catalunya per al 2027 (35 processos, places, terminis i
  dates d'examen), actualitzada cada setmana: https://placa-oposicions.vercel.app/ca/convocatorias. Si us és útil, podeu
  enllaçar-la.»

## 5. Fecha del primer euro
- **28/10:** desplegado; pago probado hasta Stripe Checkout en modo prueba.
- **Antes del 2/11:** Moisés aprueba y publica los 5 mensajes (10 minutos). Cobro real activado (`STRIPE_MODO=real` con la clave
  live de Numi Mates en Vercel) y probado con un pago real reembolsado.
- **2/11-11/11:** 100 visitas → 1-2 suscripciones previstas. **Primer euro: 11/11/2026 como tarde.**
- Si el 11/11 no hay ningún pago con más de 100 visitas: revisar la oferta (texto y momento) y el precio de entrada (prueba de 7 días
  por 0,99 €) antes de buscar más tráfico.

## 6. Cifras reales (las rellena la tarea semanal)
| Semana | Visitas | Tests gratis terminados | Clics en pagar | Pagos | Ingresos | Bajas |
|---|---|---|---|---|---|---|
| 28/10-3/11 | — | — | — | 0 | 0 € | 0 |

## 7. Estado del cobro real
- Modo prueba: funciona en producción hasta Stripe Checkout (sesiones `cs_test_…`).
- **Modo real: pendiente.** Falta poner en Vercel la clave live de Numi Mates (`STRIPE_LIVE_SECRET_KEY`) y `STRIPE_MODO=real`,
  crear productos y webhook en modo real (`STRIPE_MODO=real NODE_USE_ENV_PROXY=1 node scripts/stripe-preparar.mjs
  https://placa-oposicions.vercel.app`) y hacer **un pago real de 9,99 € con una tarjeta de verdad y reembolsarlo**
  (`stripe refunds create --payment-intent …` o desde el panel). Ese pago exige una tarjeta real: lo hace Moisés o la sesión del Mac.
