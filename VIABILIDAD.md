# Plan de viabilidad y costes reales totales · 10 proyectos

> Elaborado el 23/10/2026 sobre la lista confirmada por Moisés. Marketing contabilizado como coste real.
> Las cifras de publicidad son referencias públicas de 2026 para España (Meta: clic 0,42–0,80 €; Google Ads
> educación: 1,5–3 € por clic en búsquedas competidas, 0,5–1,5 € en cola larga; instalación Android: 1,5–3 $).
> Todo lo demás son hipótesis explícitas: se revisan con datos reales al mes de cada lanzamiento.

## 0. Hipótesis comunes (las que mandan)

| Hipótesis | Valor | Por qué |
|---|---|---|
| Visitante → pago en web de autoservicio | 2 % con anuncios, 4 % desde búsqueda con intención ("test CCSE") | Estándar de productos de menos de 20 € |
| Instalación de app → pago | 3 % | Estándar apps educativas |
| Baja mensual en suscripciones | 15 % (exámenes: se van al aprobar) | Vida media 4–6 meses |
| Coste por clic Meta / TikTok | 0,60 € | Media España 2026 |
| Coste por clic Google búsqueda cola larga | 0,80 € | Educación España, términos poco competidos |
| Coste por instalación Android | 2 € | Media 2026 |
| Comisión de tienda (Google Play) | 15 % | Programa de pequeños desarrolladores |
| Stripe | 1,5 % + 0,25 € | Tarjetas europeas |
| Contenido orgánico (artículos, vídeos, fichas de tienda) | 0 € en dinero; 3–6 meses hasta dar tráfico | Lo produce Claude; los vídeos gastan créditos de Higgsfield |

**Coste de captar un cliente (CAC) con anuncios, derivado de lo anterior:**
- Meta / TikTok → web: 0,60 € / 2 % = **30 €** por cliente.
- Google búsqueda cola larga → web: 0,80 € / 4 % = **20 €** por cliente.
- Google Play (anuncios de instalación): 2 € / 3 % = **67 €** por cliente. **No compensa en ningún proyecto**: Play solo
  sirve por posicionamiento orgánico en la tienda (ASO).

**Regla que sale de aquí:** un producto solo puede pagar anuncios si deja más de 30 € de margen por cliente a lo largo de
su vida. Los de menos de 10 € de margen (CCSE, cuentos en PDF, Nuevo en España suelto) viven **solo de orgánico, tienda de
apps, boca a boca y afiliados**. Las suscripciones de 9,99 €/mes con 5–6 meses de vida sí pueden pagar anuncios de búsqueda.

## 1. Ficha por proyecto

| Proyecto | Precio | Margen por cliente (vida) | CAC orgánico | CAC con anuncios | ¿Anuncios? | Clientes/mes para 300 €/mes | Mes de equilibrio | Peor caso 12 meses |
|---|---|---|---|---|---|---|---|---|
| **A · CCSE nacionalidad** | 9,99 € pago único (3 meses) | 8,5 € (web 9,2 / Play 8,2) | 0 € · 3–4 meses hasta tráfico (ASO + TikTok en 6 idiomas) | 20–30 € → **pierde dinero** | No. Solo orgánico, ASO, comunidades | 35 compras/mes | Mes 5–6 | −15 € dominio |
| **N · Nuevo en España** | 4,99 €/mes o pack 19,90 € | 22 € | 0 € · se vende dentro de A (venta cruzada) y por TikTok/WhatsApp | 30 € → marginal | No, salvo prueba de 150 € en Google búsqueda en árabe/francés | 14 clientes nuevos/mes | Mes 6–8 | −15 € |
| **M · Catalán con IA por voz** | 9,99 €/mes | 40 € (voz cuesta 1–2 €/usuario/mes) | 0 € · "aprender catalán", "nivell C"; 4–6 meses | 20 € (búsqueda) | **Sí**, 100 €/mes desde el mes 2: 5 clientes/mes extra | 8 nuevos/mes | Mes 7–9 | −15 € dominio − 1.100 € anuncios |
| **B · Oposiciones cola larga** | 9,99 €/mes | 55 € (6 meses de vida) | 0 € · 1 página por convocatoria, 4–6 meses | 20 € (búsqueda) | **Sí**, 100 €/mes desde el mes 2: 5 clientes/mes extra | 6 nuevos/mes | Mes 6–8 | −15 € − 1.100 € |
| **L · Motor de exámenes** (PAU, DELE, nivell C) | 9,99 €/mes | 36 € (4 meses) | 0 € · DELE es mundial (inglés, chino, portugués); 4–6 meses | 25–40 € (búsqueda en inglés es más cara) | Todavía no; orgánico primero | 9 nuevos/mes | Mes 8–10 | −15 € |
| **O · Lectura en voz alta niños** | 6,99 €/mes | 38 € | 0 € · escuelas, redes de padres, 4–6 meses | 30 € (Meta padres) → marginal | Prueba de 150 € en el mes 4; seguir solo si CAC < 25 € | 8 nuevos/mes | Mes 8–10 | −15 € − 150 € |
| **G · Cuentos personalizados** | 7,90 € PDF · 34,90 € impreso | 7 € PDF · 10 € impreso | 0 € · TikTok/Instagram, Navidad, afiliados al 20 % (7 € por libro) | 30 € → **pierde dinero** | No. Afiliados y orgánico | 30 ventas/mes | Diciembre o nunca | −15 € dominio − 150 € prueba Navidad |
| **Juegos** (H web + Q Roblox) | Publicidad en portales; Robux | 50–70 % de la publicidad; en Roblox ≈ 25 % de lo que gasta el jugador | 0 € · la plataforma distribuye | No existe | No. Opcional Roblox: anuncios patrocinados en Robux, 0 € hasta tener ingresos | 1 juego con tracción | Mes 3–6 (web); Roblox lotería | −30 $ (Roblox Premium necesario para cobrar) |
| **I · Libros KDP** | 9,90–14,90 € | 2–5 € por libro | 0 € · buscador de Amazon | Amazon Ads: 3–5 € por venta → solo en lanzamiento | Opcional, 20 €/título el primer mes | 100 ventas/mes (30 títulos × 3) | Mes 6–9 | 0 € (−200 € si se usan Amazon Ads) |
| **J · Cursos Udemy** | 15–40 € | 5–12 € por alumno (Udemy se queda 63 % si lo trae) | 0 € · buscador de Udemy | No existe | No | 40 alumnos/mes | Mes 3–5 | 0 € |
| **P · Webs con AdSense** (añadido 24/10; catálogo de 7 sitios más abajo) | Publicidad: RPM 1,5–3 € con AdSense en utilidades, 4–12 € en finanzas en España, 15–40 $ en EE. UU. en español | No hay cliente: 1.000 páginas vistas ≈ 2–3 € | 0 € · solo SEO; 6–12 meses hasta tráfico estable por sitio | **Nunca**: pagar tráfico para un sitio de anuncios pierde dinero | No | 120.000 páginas vistas/mes (≈ 5 sitios × 25.000) | Mes 9–14 | −60 € (5 dominios) |

Notas por proyecto:
- **A y N son una sola marca.** A trae el tráfico (el examen se busca en todos los idiomas) y N es la suscripción que
  convierte a esos mismos usuarios. Juntas, el margen por usuario sube a ≈ 30 €. Sin N, A no da para 1.000 €/mes.
- **M tiene coste variable real:** síntesis y reconocimiento de voz. Con ElevenLabs a tarifa de plan son 3–5 €/usuario/mes
  si habla 30 minutos; con TTS más barato (Google/OpenAI, ≈ 0,4 €) se queda en 1–2 €. Se construye con el barato y se
  deja ElevenLabs para la demo y las voces premium.
- **G no es un negocio de anuncios, es de Navidad.** Con afiliados (cuentas de maternidad e Instagram familiar al 20 %)
  el coste de captación lo paga la venta. Fuera de Navidad, ventas residuales.
- **Juegos: lotería con el techo más alto.** Un juego web decente en CrazyGames/Poki: 200–2.000 $/mes. Roblox: de 0 a
  decenas de miles, pero el 90 % de las experiencias no llega a cobrar nada. Se juega a catálogo (12 web + 3 Roblox al año).
- **I y J son lentos y seguros:** ingresos pequeños desde el mes 2–3, sin marketing, acumulativos.
- **P (webs con AdSense) es el más lento y el más pasivo.** Lo que manda es el tráfico: a 2,5 € por cada 1.000 páginas
  vistas, 300 €/mes exigen 120.000 páginas vistas al mes. Un sitio nuevo tarda 6–12 meses en salir del "sandbox" de
  Google. Se juega a catálogo de 5 sitios de **herramientas y datos** (calculadoras, calendarios, conversores), no de
  artículos: los resúmenes de IA de Google están recortando el 20–40 % de los clics informativos, pero la gente sigue
  entrando a usar una calculadora. El riesgo regulatorio es la política de Google contra el contenido escalado con IA:
  cada página debe aportar un cálculo o un dato real (INE, BOE, DOGC, datos abiertos), nunca texto de relleno. Las redes premium
  (Ezoic, Mediavine, Raptive) exigen desde 2026 tráfico anglosajón o 250.000 usuarios/mes: con tráfico español, AdSense
  es la vía hasta pasar de 100.000 páginas vistas; después, Ad Manager propio. Primer pago (70 €) entre los meses 4 y 8.


### Catálogo de sitios del proyecto P, ordenado por lo que pagan (24/10/2026)

| Orden | Sitio | Nicho y RPM estimado | Volumen | Riesgo | Mercado |
|---|---|---|---|---|---|
| 1 | **Nómina y laboral** (sueldo neto, finiquito, despido, paro, baja, horas extra) | Finanzas-laboral, 4–8 € | Muy alto y recurrente cada mes | Bancos dominan la búsqueda principal; cola larga y catalán abiertos | España (es/ca) |
| 2 | **Impuestos y autónomos** (IRPF, IVA, cuota 2027, modelos trimestrales, Verifactu) | Finanzas-legal, 5–12 € | Alto, con pico en 2027 por la obligación de Verifactu | Tema de dinero: exige autor, método y fuentes | España (es/ca) |
| 3 | **Finanzas e impuestos de EE. UU. en español** (calculadora de nómina por estado, créditos fiscales, ITIN, W-2, seguro médico) | Finanzas EE. UU., 15–40 $ | Alto (60 M de hispanohablantes) | Competencia en inglés fuerte, en español débil; abre Mediavine y Raptive | EE. UU. (es) |
| 4 | **Vivienda e hipoteca** (hipoteca, ITP y AJD por comunidad, índice de alquiler, plusvalía) | Banca y seguros, 6–12 € | Alto | Cabeceras tomadas por bancos; cola larga por comunidad y municipio | España (es/ca) |
| 5 | **Calendario y fechas** (festivos por municipio, calendario laboral y escolar, días entre fechas) | Utilidad, 1–3 € | Masivo; entra en Discover; casi sin competencia en catalán | RPM bajo compensado por volumen; atrae enlaces de ayuntamientos | España y Cataluña (es/ca) |
| 6 | **Coche y seguros** (impuesto de circulación por municipio, ITV, cambio de nombre, seguro) | Seguros, 5–10 € | Medio-alto | Aseguradoras pujan fuerte; datos por municipio son diferenciales | España |
| 7 | **Salud cotidiana y bebé** (embarazo, percentiles, dosis pediátricas) | Salud, 2,5–7 € | Muy alto | Tema sensible: solo calculadoras con fuente oficial y revisor | España, Latinoamérica |

Ritmo: un sitio nuevo cada 6–8 semanas; cada uno tarda 6–12 meses en madurar. Con los 7 en marcha y madurados, el
escenario 'bien' de P sube de 600 € a 1.500–2.500 €/mes; el 'mal' se mantiene en 100 €/mes porque el riesgo de Google
es común a todos.

## 2. Qué cuesta el marketing en total (12 meses)

| Capa | Coste en dinero | Coste en otra cosa |
|---|---|---|
| **Orgánico**: 30 artículos por marca, 60 vídeos cortos por marca, fichas de tienda en 6 idiomas, página por convocatoria | 0 € | Créditos de Higgsfield y ElevenLabs para vídeo y voz (si se agotan: 20–50 €/mes); cuentas de TikTok/Instagram/YouTube a tu nombre; 3–6 meses de espera |
| **Pagado prudente**: Google búsqueda para B y M (100 €/mes cada uno desde el mes 2), pruebas de 150 € en N, O y G | 2.650 € (2.200 + 450) | Ninguno |
| **Plataforma**: Udemy 63 %, Amazon 40 %, Play 15 %, CrazyGames/Poki 30–50 %, Roblox ≈ 75 % | 0 € por adelantado | Se descuenta de la venta; ya está en los márgenes de arriba |
| **Afiliados** (cuentos): 20 % por venta | 0 € por adelantado | Se descuenta de la venta |
| **Herramientas**: afiliados (Rewardful o propio), analítica (Plausible o Umami autoalojado) | 0–20 €/mes | — |

## 3. Costes totales reales a 12 meses (tres escenarios)

| | S0 · Sin anuncios | S1 · Prudente (recomendado) | S2 · Agresivo (solo si S1 demuestra CAC < 25 €) |
|---|---|---|---|
| Infraestructura (Vercel Pro, teléfono no, dominios ×5, Google Play, Roblox Premium) | 420 € | 420 € | 420 € |
| Créditos extra de vídeo y voz | 0–300 € | 300 € | 600 € |
| Anuncios | 0 € | 2.650 € | 10.000 € (1.000 €/mes desde el mes 3) |
| Herramientas | 0 € | 120 € | 240 € |
| **Inversión total 12 meses** | **420–720 €** | **≈ 3.500 €** | **≈ 11.300 €** |
| Ingresos esperados en el mes 12 (mal / bien) | 600 / 2.000 €/mes | 1.300 / 3.500 €/mes | 2.500 / 7.000 €/mes |
| Mes en que los ingresos mensuales superan los costes mensuales | Mes 4–6 | Mes 6–8 | Mes 8–10 |
| Mes en que se recupera toda la inversión acumulada | Mes 7–9 | Mes 10–13 | Mes 14–18 |
| **Peor caso (nada funciona)** | **−720 €** | **−3.500 €** | **−11.300 €** |

Lectura: S0 casi no puede perder, pero llega tarde. S1 cuesta lo que un mes de alquiler y, si falla, el fallo se ve en el
mes 4 con datos reales, no en el mes 12. S2 no se decide ahora.

**Qué NO está en estos números:** tu suscripción de Claude (ya la pagas; las tareas programadas van contra ella), tu
cuota de autónomo (ya la pagas), impuestos sobre el beneficio, y tu tiempo (≈ 10 minutos al día aprobando publicaciones
y respuestas).

## 4. Cuántos clientes hacen falta para 1.000 €/mes y de dónde salen

Objetivo de cartera a 12 meses en S1 (escenario "mal", el que se puede prometer):

| Proyecto | Clientes activos o ventas/mes en el mes 12 | Ingreso/mes |
|---|---|---|
| A + N (Nuevo en España) | 60 compras CCSE + 50 suscriptores | 850 € |
| B + L (Exámenes) | 40 suscriptores | 400 € |
| M (Catalán) | 25 suscriptores | 250 € |
| O (Lectura) | 20 suscriptores | 140 € |
| G (Cuentos) | 10 ventas/mes fuera de Navidad; 150 en diciembre | 100 € (media) |
| Juegos | 1 juego con tracción de 12 | 150 € |
| I (KDP) | 60 ventas/mes | 180 € |
| J (Udemy) | 20 alumnos/mes | 150 € |
| P (Webs AdSense) | 5 sitios, 40.000 páginas vistas/mes en total | 100 € (600 € si un sitio despega en Discover o finanzas) |
| **Total** | | **≈ 2.300 €/mes** |

El objetivo de 1.000 €/mes se cumple si solo la mitad de esto se materializa. Ningún proyecto solo lo garantiza; la
cartera sí.

## 5. Decisiones que exige este plan
1. **Escenario:** S0 o S1. Recomiendo S1 con la regla de parar cada anuncio que no baje de 25 € por cliente al tercer mes.
2. **Cuentas que son tuyas y nadie más puede abrir:** Stripe, Google Play (25 $), Roblox (Premium para cobrar), Amazon KDP,
   Udemy, TikTok e Instagram de cada marca, Gelato (impresión de cuentos).
3. **Nombres de las marcas:** Nuevo en España, Exámenes, Niños, Juegos. Propongo nombres comerciales al abrir cada una.
4. **Presupuesto de anuncios:** ninguno hasta el mes 2 y nunca sin tu aprobación mensual.

## 6. Siguiente paso
Plan de desarrollo: una sesión de Claude por proyecto, con entregable cerrado y criterio de "hecho", en el orden
A → N → B → Juegos (primer juego web) → M → G (antes del 15/11) → I → J → L → O → P.

## 6. Expansión internacional (24/10/2026)

**Qué aporta en números.** El ingreso por usuario depende del país: tomando España como 1, Estados Unidos en español
vale de 1,2 a 1,5 en suscripciones y de 5 a 10 en publicidad; Latinoamérica vale de 0,3 a 0,5 pero con 10 veces más
población; Portugal, Italia y Francia valen de 0,8 a 1,1. Por eso el segundo mercado de casi todo es **Estados Unidos en
español**, no Latinoamérica.

**Qué cuesta abrir un país.** Dominio o carpeta (15 €), textos legales adaptados (IA más gestor), contenido y parámetros
del país (lo hace Claude), alta en el régimen OSS de IVA si las ventas a consumidores de la UE superan 10.000 €/año,
métodos de pago locales en México y Brasil. El marketing orgánico se repite por país (de 3 a 6 meses de retraso cada vez).

**Regla de secuencia.** Un proyecto abre su segundo país cuando en el primero tiene al menos 100 clientes de pago (o 20.000
páginas vistas al mes en P) y una conversión medida. Antes, nada: abrir países sin datos reparte el esfuerzo sin sumar
ingresos.

**Efecto en los escenarios a 12 meses.** Con la expansión aplicada desde el mes 6 a los proyectos que la permiten (P, G, I,
O, A, J y Juegos), el escenario 'bien' de la cartera pasa de 3.500 a unos 6.000 €/mes; el 'mal' no cambia, porque la
expansión solo se hace sobre lo que ya funciona.
