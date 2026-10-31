# Auditoría de mercado · Aprova (preparación de certificados oficiales de catalán B1–C2)

Fecha: 30/10/2026. Autor: análisis de mercado por encargo (sesión de auditoría del proyecto M). Fuentes: búsqueda web (WebSearch); la descarga directa de páginas (WebFetch) estaba bloqueada en esta sesión para `gencat.cat`, `govern.cat`, `cpnl.cat`, `3cat.cat`, `naciodigital.cat`, `elnacional.cat`, `racocatala.cat`, `catfy.app` y `reddit.com`, así que **todas las cifras proceden de los extractos indexados de esas páginas**, no de una lectura íntegra. Donde el extracto no da la cifra lo digo y marco la **(estimación)**.

Documentos del proyecto contrastados: `proyectos/m-catala/MONETIZACION.md`, `COSTES.md`, `MARKETING.md`. `VIABILIDAD.md` **no existe en el repo** (se cita desde MONETIZACION §3 y CAMPANYA.md como «VIABILIDAD §0/§5»); las hipótesis que se mencionan de él son: 4 % de conversión diagnóstico→pago desde búsqueda con intención, 25 suscriptores y 250 €/mes a 12 meses, escenario S1 orgánico con 100 €/mes de anuncios desde el mes 2.

---

## 0. Resumen ejecutivo

- **El mercado existe y crece, pero es pequeño, estacional y casi todo él es C2 de docentes**, no C1 de castellanohablantes. En 2023 la DPL examinó a 8.306 personas (5.369 C2, 2.048 C1, 392 B2, 239 B1, 258 A2); en abril de 2024 solo el C2 reunió ≈ 8.300 examinandos y en 2026 una fuente secundaria da 13.068 inscritos al C2. El C1 (el núcleo de Aprova) ronda las **2.000–4.000 personas/año** en la DPL más ≈ 1.000 en CIFALC y ≈ 1.000 en Salut.
- **La afirmación «un de cada quatre suspèn» es aproximadamente cierta para el C2 (78,6 % aptos en 2023) y para la prueba de Salut (79 % aptos en 2025), y se queda muy corta para el C1 de la DPL (41,3 % aptos en 2023: suspenden 3 de cada 5)**. Es el mejor argumento de venta de Aprova y hoy el proyecto no lo usa con la cifra real.
- **Hay competencia gratuita directa que el proyecto no tiene mapeada**: **Catfy** (catfy.app, PWA + Google Play, A1–C2 con IA, simulacros, corrección de escritos y oral con IA, plan hasta el día del examen; «gratis durante el lanzamiento»), **AprènCatalà** (450+ ejercicios gratis, A1–C1), **Qüestiocat** (5.000 tests, 2023), **c2catala.cat**, además de **Parla.cat** (gratis, 307.000 registrados históricos) y los modelos oficiales de examen publicados por la DPL y el Govern balear.
- **La disposición a pagar está anclada muy abajo**: el examen oficial C1 cuesta 57,45 €; un libro 32–38 €; el curso C1 del CPNL (120 h, presencial, con profesor) 262,67 €; una academia online 299–484 €. Un 9,99 €/mes es defendible solo si la corrección de redacciones tiene validez demostrada (VALIDESA.md) y se vende como «el corrector» más que como «la app».
- **TAM/SAM/SOM (hipótesis explícitas en §8)**: TAM ≈ 60.000 personas/año que preparan un certificado oficial de catalán/valenciano en el dominio lingüístico (≈ 1,0–1,5 M€/año si todas gastaran lo que cuesta un libro); SAM (C1/B2 en Cataluña con intención digital) ≈ 9.000–14.000 personas/año ≈ 400–900 k€; SOM a 12 meses **25–60 pagadores, 1.500–3.500 € de ingresos**, coherente con el objetivo interno de 25 suscriptores; a 36 meses 150–400 pagadores/año (7–18 k€/año) si se añade el C2 de docentes y el segmento B2B.
- **Juicio honesto**: sí hay gente que paga (las academias cobran 300–480 € por lo mismo), pero paga por **la corrección humana y la sensación de acompañamiento**, no por los tests. Para la mayoría basta Parla.cat + un libro + los modelos oficiales. Aprova solo tiene hueco si (a) su corrección con rúbrica coincide con la de un profesor ≥ 80 %, (b) ataca el C2 de docentes (10× el volumen del C1) y (c) se posiciona en castellano para quien busca «nivel C de catalán oposiciones», donde Catfy y los recursos de la Generalitat están solo en catalán.

---

## 1. Tamaño del mercado

### 1.1 Pruebas de la Direcció General / Departament de Política Lingüística (DPL)

| Convocatoria | Nivel | Inscritos | Presentados | Aptos | % aptos | Fuente (año) |
|---|---|---|---|---|---|---|
| 2021 | C2 | 2.363 | – | – | – | 3cat, «Rècord per obtenir el C2… prop de 7.000» (abr. 2023) https://www.3cat.cat/3catinfo/record-per-obtenir-el-c2-de-catala-amb-prop-de-7000-persones-examinant-se-alhora/noticia/3161379/ |
| 2022 | Todos | – | 5.314 | 4.197 | 78,98 % | Racó Català / Diari de la llengua (sept. 2023) https://www.racocatala.cat/noticia/61369/record-dexaminands-8.306-daprovats-5.731-proves-catala-principat |
| 2023 | A2 | – | 258 | – | 76,36 % | llengua.gencat.cat «Més de 5.000 persones obtenen el certificat» (sept. 2023) https://llengua.gencat.cat/en/detalls/noticia/Mes-de-5.000-persones-obtenen-el-certificat-de-coneixement-de-catala |
| 2023 | B1 | – | 239 | – | 68,62 % | ídem |
| 2023 | B2 | – | 392 | – | 77,55 % | ídem |
| 2023 | **C1** | – | **2.048** | ≈ 845 | **41,26 %** | ídem; Diari de la llengua https://www.diaridelallengua.cat/record-dexaminands-en-les-proves-de-catala-a-catalunya/ |
| 2023 | **C2** | ≈ 7.000 | **5.369** | ≈ 4.221 | **78,62 %** | ídem; 3cat (abr. 2023) |
| 2023 | Total | – | **8.306** | **5.731** | 69,0 % | ídem (récord histórico) |
| 2024 | C2 | – | **≈ 8.300** (14 localidades, 20/4/2024) | – | – | 3cat «Més de 8.000 persones s'han examinat del nivell C2» https://www.3cat.cat/3catinfo/mes-de-8000-persones-sexaminen-avui-del-nivell-c2-de-catala-en-14-localitats-catalanes/noticia/3288308/ ; ElNacional (abr. 2024) https://www.elnacional.cat/ca/societat/obligatorietat-c2-catala-mestres-professors-partir-curs-2025-26-dispara-examens_1200581_102.html |
| 2024 | C1 | – | – | – | – | **Sin dato público.** Primer año del nuevo modelo de prueba C1 (llengua.gencat.cat, ficha C1). (estimación: 2.500–3.500 presentados, por la presión de ICS/Generalitat) |
| 2024 | Certificados expedidos (todos los niveles) | – | – | **≈ 6.700**, de ellos **4.876 C2** (>70 %) | – | Racó Català (ene.–feb. 2025) https://www.racocatala.cat/noticia/67377/certificats-nivell-superior-catala-c2-baten-nou-record-4.900-2024 ; El Punt Avui https://www.elpuntavui.cat/societat/article/5-societat/2525687-record-de-certificats-c2-de-nivell-superior-de-catala-al-2024.html |
| 2025 | Todos | – | – | – | – | Resultados publicados el 4/9/2025; **no se ha encontrado nota de prensa con totales**. 3cat (2026) dice que los certificados C2 crecieron «per quart any consecutiu» y siguen en récord desde 2022 https://www.3cat.cat/3catinfo/augment-record-de-certificats-de-nivell-superior-de-catala/noticia/3344924/ (estimación 2025: 10.000–12.000 presentados en total, 7.000–8.500 C2, 2.500–3.500 C1) |
| 2026 | C2 | **13.068** inscritos (prueba escrita 11/4/2026) | – | – | – | c2catala.cat (fuente secundaria, 2026) https://c2catala.cat/examen-c2-catala/ ; calendario oficial https://llengua.gencat.cat/ca/detalls/noticia/dates-de-les-proves-2026 |
| 2026 | 2.ª ventana (sept.) A2–C2 | **tope 2.000** solicitudes; A1 tope 1.000 | – | – | – | llengua.gencat.cat, terminis https://llengua.gencat.cat/ca/serveis/acreditacio_coneixements/certificats_de_catala/convocatoria_de_proves/terminis/index.html |

Lectura: el C2 se ha multiplicado por 5–6 entre 2021 y 2026 por el requisito docente; el C1 es un mercado de **2.000–4.000 personas/año** en la DPL con una tasa de aptos muy baja (41 % en el modelo antiguo; sin dato del nuevo). B2 y B1 son residuales en la DPL (<500/año cada uno) porque quien los necesita (sanidad B1, policía local B2) suele acreditarlos vía CPNL o la prueba interna de la oposición.

### 1.2 Otras vías de certificación en Cataluña

| Organismo | Dato | Fuente (año) |
|---|---|---|
| **CIFALC** (universidades) | 2023: **4.966 candidatos**, 2.002 externos (40 %), **969 de C1**, 504 de lenguaje jurídico, 174 PDI; **62 % aptos**; 16 convocatorias (17 en 2024-25) | Jornada CIFALC, UdG, 11/7/2024 (pptx UPC) https://www.upc.edu/slt/ca/politica-linguistica/servei-llengues-terminologia/participem/documents/jornada-acreditacio-cifalc-juliol-2024-final-pptx.pdf |
| **Departament de Salut** («Prescriu-te el català», pruebas propias B1/B2/C1 desde 2025, A2 desde 2026, equivalentes a la DPL) | 2024: 850 profesionales obtuvieron certificado. Ene.–feb. 2025: **1.071 examinados, 79 % aptos (21 % suspenden)**. 2.ª edición: 1.640–1.655 inscritos; exámenes ene.–feb. 2026 | govern.cat (3.ª edición) https://govern.cat/salapremsa/notes-premsa/789696/ ; Nació Digital (2025) https://naciodigital.cat/societat/el-21-de-participants-suspenen-lexamen-de-catala-del-departament-de-salut.html ; VilaWeb (2025) https://www.vilaweb.cat/noticies/sanitaris-no-aproven-examen-catala-salut/ ; bases 2026 https://canalsalut.gencat.cat/web/.content/_Professionals/Recursos/serveis_linguistics/proves-oficials/Bases-de-les-proves-dels-certificats-de-coneixements-de-llengua-catalana-del-Departament-de-Salut-de-2026.pdf |
| **EOI** | Ya **no convocan prueba libre de C1 de catalán**, solo C2. Matrícula curso: 275 € + 30 € (A1/A2/C1/C2), 286 € (B1/B2); 2026-27: 303,55–333,65 €; bonificación 50 % en C1/C2 de catalán | Redopositor (2026) https://redopositor.com/blog/ca-on-treure-c1-catala-oposicions-cpnl-universitat-preu/ ; EOI Martorell/Mollet/Lleida (2025-26) https://agora-eoi.xtec.cat/eoimartorell/secretaria/taxes-preus-publics/ |
| **CPNL** (cursos) | Récord: **>41.000 alumnos inscritos en un trimestre** (2025) con 43.000 plazas; 42.000 plazas en el 1T 2026; listas de espera >9.000 (2024), ≈ 8.000 «muchos docentes y sanitarios»; Memòria 2024: **11.660 inscripciones de B1**; online ≈ 10–16 % según centro (Tarragona 784/4.957; VO3 622/3.388; Cornellà 10,7 %) | Nació Digital https://naciodigital.cat/societat/record-dinscripcions-als-cursos-de-catala-mes-de-41000alumnes.html ; VilaWeb https://www.vilaweb.cat/noticies/inscripcions-cpnl-cursos-de-catala/ ; 3cat pla de xoc https://www.3cat.cat/324/pla-de-xoc-per-impulsar-el-catala-mes-places-i-cursos-del-consorci-i-un-nou-certificat-basic/noticia/3336847/ ; Memòria CPNL 2024 https://www.cpnl.cat/media/upload/arxius/gerencia/Economia%20i%20finances/Mem%C3%B2ries/03-CPNL-Memoria_2024.pdf |

(estimación) Inscripciones del CPNL en Suficiència (C1) y Superior (C2): el B1 ya supone 11.660; los niveles C1–C2 suelen ser el 15–20 % de las inscripciones ⇒ **15.000–25.000 inscripciones/año en C1–C2** (una persona hace 2–3 módulos trimestrales ⇒ 6.000–10.000 personas).

### 1.3 Territorios vecinos (mercado adicional, ver §7)

| Territorio | Dato | Fuente (año) |
|---|---|---|
| **JQCV (Comunitat Valenciana)** | **≈ 30.000 matrículas** para las pruebas de 2024; 43.000 plazas en 24 sedes; C1 es el nivel con más certificados históricos (283.473, 31 % del total). Tasas 2025: C1/C2 23,39 €, B1/B2 18,71 € | Valencia Plaza (2024) https://valenciaplaza.com/valenciaplaza/jqcv-registra-30000-matriculas-pruebas-2024 ; Alicante Plaza https://alicanteplaza.es/alicanteplaza/lajuntaqualificadoraapruebaelcalendariodelosexamenesdevalencianode2024con43000plazas ; CSIF (2025) https://www.csif.es/es/noticia/portada/comunidadvalencianaeducacion/articulo/64316 |
| **Illes Balears** | >8.000 inscritos en la convocatoria de enero de 2021 (todos los niveles); 7.910 en 2018. Tasas 2026: C1/C2 24,29 €, A2–B2 17,11 € | Nou Diari (2021) https://www.noudiari.es/?p=230299 ; Menorca.info (2018); caib.es (2026) https://www.caib.es/webgoib/ca/-/convocat%C3%B2ria-proves-de-maig-de-2026-inscripci%C3%B3 |
| **Andorra** | Récord: 1.020 inscritos (2026), por los requisitos de residencia | Diari d'Andorra (2026) https://www.diariandorra.ad/nacional/260421/ |

### 1.4 ¿«Un de cada quatre suspèn»?

| Prueba | % aptos | Suspenden | Veredicto |
|---|---|---|---|
| DPL C2 2023 | 78,62 % | ≈ 1 de cada 5 | la frase es casi exacta |
| DPL C2 2022 (todos los niveles) | 78,98 % | 1 de cada 5 | ídem |
| Salut (B1–C1) 2025 | 79 % | 1 de cada 5 | ídem |
| CIFALC 2023 (todos) | 62 % | ≈ 2 de cada 5 | se queda corta |
| **DPL C1 2023** | **41,26 %** | **≈ 3 de cada 5** | **muy corta**: en el C1 suspende la mayoría |
| DPL B1 2023 | 68,62 % | ≈ 1 de cada 3 | se queda corta |

Conclusión: **para el producto estrella (C1) la cifra real es «3 de cada 5 suspenden» (modelo antiguo, 2023). No hay dato público del nuevo modelo (2024–2026).** Hay que pedirlo por transparencia a la DPL (ver recomendación 2) y usarlo en la landing.

---

## 2. Demanda digital y comunidades

### 2.1 Volumen de búsquedas (Google España)

**No hay dato público**: ni Keyword Planner ni Semrush/Ahrefs son accesibles desde esta sesión y ningún artículo indexado publica volúmenes para estas palabras. Estimación razonada a partir del número de candidatos (≈ 25.000 candidatos DPL + 5.000 CIFALC + 1.600 Salut + 40.000 alumnos CPNL/trimestre; cada candidato hace 10–30 búsquedas relacionadas en los 3 meses previos) y de la estacionalidad (picos en enero por la inscripción y en abril–mayo por los exámenes):

| Palabra clave | Estimación media mensual (ES) | Pico (ene., abr.–may.) | Nota |
|---|---|---|---|
| «nivell C català» / «nivel C catalán» | 1.000–2.000 | ×2–3 | término histórico, mucha intención informativa |
| «examen C1 català» / «examen C1 catalán» | 500–1.000 | ×3 | intención de preparación |
| «certificat C1 català» / «certificado C1 catalán» | 500–1.000 | ×2 | mezcla con equivalencias/convalidación |
| «model examen C1 català» / «models d'examen C1» | 300–800 | ×4 | la Generalitat y el Govern balear ya lo sirven gratis |
| «prova B2 català» / «nivell B2 català» | 200–500 | ×2 | residual en DPL |
| «preparar C1 català» | 100–300 | ×3 | long tail, poca competencia |
| «català C1 online» / «curs C1 català online» | 100–300 | ×2 | compite con UOC, AulaCatalà, UPF |
| «test nivell català» / «test de nivel catalán» | 1.000–3.000 | plano | mayoritariamente curiosos; es la puerta del diagnóstico gratuito |
| **C2 (no previsto en el proyecto):** «examen C2 català», «C2 català docents» | 2.000–5.000 | ×4 | mayor volumen que todo el C1 junto |

Total estimado del clúster de «certificados de catalán»: **8.000–15.000 búsquedas/mes** en España, de las que quizá un 30–40 % en castellano. Marcar todo como **(estimación)**; la primera semana con Search Console y una campaña de 20 € en Keyword Planner la sustituye por datos reales.

### 2.2 Comunidades

| Comunidad | Tamaño | Fuente (año) |
|---|---|---|
| r/catalunya (Reddit, en catalán) | 112.000 miembros, +5,3 %/año | GummySearch (2025-26) https://gummysearch.com/r/catalunya/ |
| r/catalan (aprendices, en inglés) | **sin dato**; (estimación) 25.000–40.000; en 2023 un usuario lo describía como «no muy conocido» | libreddit (2023) |
| Canales/grupos Telegram y Facebook de opositores (OpositaTest, por CCAA incl. Generalitat) | sin cifra pública; (estimación) 2.000–15.000 miembros por grupo | OpositaTest https://blog.opositatest.com/los-grupos-de-facebook-llegan-a-opositatest/ |
| Blogs de oposiciones con artículos específicos de «català C1 oposicions» | Redopositor (decenas de artículos 2026 sobre C1/C2, ICS, Mossos), Adams, OpositaTest | https://redopositor.com/blog/ca-nivell-catala-cada-oposicio-catalunya-2026/ |
| TikTok @aprendecatalan_ (Marta Compte, para castellanohablantes) | 20.000 seguidores | Ara (2024) https://es.ara.cat/lengua/aprender-catalan-salir-casa-10-influencers-lengua_130_4777296.html |
| YouTube Easy Catalan | 25.000 suscriptores | Público (patrocinado, 2025) |
| YouTube Català al Natural | 10.600 suscriptores | thoughtleaders.io https://app.thoughtleaders.io/youtube/catala-al-natural |
| YouTube Catalán Fácil (Gemma Chacín, venezolana, en castellano) | 17.000 (2021) | Voz de América https://www.vozdeamerica.com/a/6066577.html |
| YouTube De mica en mica (C1–C2 valencià, correcciones de redacciones) | 7.000 (2022) | Raco.cat |
| Consumo de contenido en catalán en redes | +72 % en 2025 | Nació Digital https://naciodigital.cat/next/creadors/el-consum-de-contingut-en-catala-a-les-xarxes-socials-augmenta-un-72-el-2025.html |

Lectura: las comunidades de aprendices son pequeñas (decenas de miles) y la conversación sobre «la prova de C1» ocurre sobre todo en **blogs de oposiciones y grupos cerrados de opositores**, no en Reddit. El viral de la enfermera «el puto catalán» (YouTube, 2025) muestra que la queja del castellanohablante obligado a examinarse es un tema vivo y polarizado: oportunidad de posicionamiento («apruébalo sin dramas») y riesgo reputacional si la marca se asocia a él.

---

## 3. Competencia

| Competidor | Qué ofrece | Precio | Lo que NO ofrece y Aprova sí | Fuente (año) |
|---|---|---|---|---|
| **Parla.cat** (DPL, IRL, CPNL) | Cursos A2–C1 autoformativos, «Rambla virtual», modalidad con tutor de pago; 307.000 registrados desde 2008 (+73/día); 1,1 M€ invertidos en versión móvil (≈ 2020); ecosistema Aula mestra, Simtest, reconocimiento de voz | Gratis (libre) / tutoría de pago vía CPNL | No hay diagnóstico con probabilidad de aprobar; no simula el examen actual con tiempos; corrección solo con tutor de pago; sin C2; interfaz anticuada | tramits.gencat.cat https://tramits.gencat.cat/ca/tramits/tramits-temes/Curs-de-catala-en-linia-Parla_cat ; ElNacional https://www.elnacional.cat/en/culture/learn-catalan-language-online-free_450255_102.html ; govern.cat 1,1 M€ https://govern.cat/salapremsa/notes-premsa/397972/ |
| **Catfy** (catfy.app) · **competidor directo no listado en el proyecto** | PWA + Google Play; A1–C2 + lenguaje jurídico; «cuando fallas te muestra la regla»; simulacros con la estructura oficial; **corrección de escritos y oral con IA según criterios de los correctores**; plan hasta el día del examen con recordatorios; blog SEO con calendario 2026-27 y guías por nivel (mismas páginas que las 30 de Aprova) | «Gratis durante el lanzamiento» / «examen completo sin suscripción» | Sin probabilidad de aprobar explícita; sin oral «por sonido»; solo en catalán (no capta al castellanohablante que busca en castellano); sin validez publicada de la corrección | https://catfy.app/ ; https://catfy.app/blog/examen-c1-catala.html ; https://catfy.app/blog/convocatories-examens-catala.html |
| **AprènCatalà** (aprencatala.cat) | 450+ ejercicios interactivos A1–C1, «preparación de los exámenes oficiales», sin registro | Gratis | Sin redacciones, sin oral, sin simulacro cronometrado, sin plan | https://aprencatala.cat/ |
| **Qüestiocat** (app) | 5.000 preguntas tipo test para pruebas oficiales (DPL, CIFALC, IEB…) | (no encontrado; probable freemium) | Solo test | dBalears (2023) https://www.dbalears.cat/ara/tendencies/2023/04/03/378737/ |
| **c2catala.cat** | Guías, «posa't a prova», estructura C2, datos de inscritos | Gratis (web de contenidos) | Sin práctica corregida | https://c2catala.cat/ |
| **CATgrafia** (correccioencatala.cat) + curso de expresión escrita C1 con tutora 6 meses | Ortografía; curso escrito C1 | Precio no publicado | Solo escrito | https://correccioencatala.cat/curs-expresio-escrita-c1-de-catala/ |
| **CPNL** presencial/online | Suficiència 45 h: 98,50 € (49,25/29,55 reducido); C1 120 h: 262,67 €; Superior C2 90 h: 245,50 € (2026-27); +1,50 € seguro; listas de espera | 98–263 € | Sin simulacro cronometrado ni corrección inmediata; horarios fijos; plazas limitadas | https://www.cpnl.cat/xarxa/cnlmontserrat/cursos-de-catala/preus-dels-cursos/ ; Redopositor (2026) |
| **EOI** | Cursos C1/C2 anuales; ya no hay prueba libre de C1 de catalán | 275–334 € + 30 € (50 % bonificado en C1/C2 catalán) | Un curso escolar entero; sin preparación específica de la prueba DPL | EOI Martorell/Mollet (2025-26) |
| **UPF Idiomes** (curso preparación C1 + examen CIFALC) | 30 h presenciales + 45 h online | 270 € (60 € comunidad UPF); examen CIFALC externo 120 € | Sin app, sin IA | https://www.upf.edu/web/idiomesupf/cursos/catala/preparacio-acreditacio-c1 |
| **AulaCatalà** (online, clases en directo) | Curso C1 100 % online, campus virtual, BCN/Girona/Lleida/Tarragona/Tortosa/Perpinyà | 299–325 € | Sin diagnóstico ni corrección instantánea | https://www.aulacatala.cat/cursos/c1/ |
| **General d'Estudis (Lleida)** | Curso C1 + 3 simulacros: 330 €; + 10 simulacros (6 meses): 465–484 €; pack 10 simulacros suelto | 330–484 € | Sin oral automático | https://generalestudis.com/ca/curso/preparacio-del-nivell-c1-de-catala-10-simulacions-d-examen/ |
| **UdL** (curso C1 90 h semipresencial) | 237,60 € (UdL) / 338,40 € (externos), 2019-20 | 238–338 € | — | UdL |
| **Academias de oposiciones** (Adams, OpositaTest, Redopositor) | Adams solo tiene «Catalán Básico 1» gratuito; el resto remite al CPNL; Redopositor produce el SEO de «català C1 oposicions» | 0 € (gancho) | Ninguna prepara el C1 en serio: **hueco de partnership** | https://www.adams.es/producto/cursos-gratuitos/catalan-basico-1-55202/ |
| **Libros** | Castellnou *Nivell de Suficiència C1*: 38,50 €; Abadia de Montserrat *A punt 5 (C1)*: 32 € + cuaderno 20 €; Teide *10 exàmens de català C1* (2023, Marta Bartolí): precio no hallado, serie B1 ≈ 18–19 €; Barcanova: solo C2 encontrado | 18–40 € | Sin corrección, sin oral, sin tiempos | Alibri https://www.alibri.es/en/libro/690926/ ; CPNL material 2026-27 https://www.cpnl.cat/media/upload/arxius/cnlbarcelona/Material%20Did%C3%A0ctic%20curs%202026-2027_1r%20%20TR%20intermedi%20i%20sufici%C3%A8ncia.pdf |
| **Duolingo** catalán | Solo desde castellano (hay que poner la cuenta en español); criticado por VilaWeb (2024) | Gratis / Super ≈ 7,33 €/mes ES, ≈ 84 €/año | A1–A2 real, nada de examen | VilaWeb https://www.vilaweb.cat/noticies/catala-llengua-segona-duolingo/ |
| **Mondly, Bilinguae, Catalan Verbs, Easy Catalan** | Vocabulario/escucha | Gratis–freemium | Nada de examen | mezzoguild (2026) https://www.mezzoguild.com/online-catalan-courses/ |
| **Optimot / Softcatalà / LanguageTool** | Consulta lingüística, corrector ortogramatical gratuito | Gratis | Sin rúbrica, sin examen; **Aprova ya los usa como motor** | — |
| **Modelos oficiales** | DPL publica criterios y modelos; el Govern balear publica todas las pruebas anteriores desde 2020–21 con soluciones | Gratis | Sin corrección de producción | https://www.caib.es/webgoib/ca/-/certificat-de-nivell-c1 |

Síntesis: la única propuesta que nadie gratuito ofrece bien es **(1) corrección fiable de la redacción argumentativa de 250 palabras con la rúbrica oficial (adecuación, coherencia, corrección, riqueza) en < 1 min, (2) probabilidad de aprobar calibrada contra resultados reales y (3) oral evaluado por pronunciación/sonidos**. Catfy afirma tener (1) con IA; el diferencial de Aprova tiene que ser la **validez demostrada** (VALIDESA.md) y la **versión en castellano**.

---

## 4. Precio y disposición a pagar

| Referencia | Precio | Fuente (año) |
|---|---|---|
| Tasa examen DPL A2–B2 | 23,90 € (2026) | llengua.gencat.cat taxes https://llengua.gencat.cat/ca/serveis/acreditacio_coneixements/certificats_de_catala/convocatoria_de_proves/inscripcio_taxes_bonif/ |
| Tasa examen DPL **C1 y C2** | **57,45 €** (2026); familia numerosa/monoparental 40,25 € (general) / 28,75 € (especial); exención parados sin prestación y jubilados | ídem; Redopositor (2026) |
| Tasa IRL (fuera del dominio) C1 | 60 € | llull.cat https://www.llull.cat/certificats/ |
| Examen CIFALC C1 por libre (UPF) | 120 € | UPF |
| Tasa JQCV C1/C2 | 23,39 € (2025) | CSIF |
| Tasa Balears C1/C2 | 24,29 € (2026) | caib.es |
| Duolingo Super (ES) | ≈ 7,33 €/mes; ≈ 84 €/año (precio de lista en ofertas) | ReSubs / Chollometro (2026) |
| Babbel (precio UE verificado 11/10/2026, Francia) | 15,99 €/3 meses; 11,99 €/mes en 6 meses; **7,99 €/mes en anual (95,88 €)** | mindomax (2026) https://www.mindomax.com/babbel-prix |
| Busuu Premium | 57,99 €/año; Premium Plus 69,90 €/año; ≈ 5,95 €/mes | ídem; wwwhatsnew (2026) |
| Preply (profesor de catalán) | 16–45 $/clase de 50 min | preply.com (2026) |
| italki (profesor de catalán) | 9–22 $/clase; preparación de exámenes 14 $ | italki.com (2026) |
| Exam Lift (Cambridge) | Gratis con compras in-app (A2–B2 for Schools) | cambridgeenglish.org |
| Curso C1 CPNL 120 h | 262,67 € | CPNL |
| Curso C1 academia online | 270–484 € | UPF, AulaCatalà, General d'Estudis |
| Libro C1 | 32–38,50 € | Alibri, CPNL |

Contraste con los precios de Aprova (9,99 €/mes · 59,99 €/año · pase 24,99 €/3 meses):
- El **pase de convocatoria a 24,99 €** está bien anclado («menos que un libro, menos que la mitad de la tasa»). Es el producto que más encaja con un mercado estacional de 3 meses.
- El **mensual a 9,99 €** está por encima de Duolingo Super/Busuu/Babbel anual (6–8 €/mes) pero muy por debajo de una clase particular (15–40 €/h). Solo se sostiene si el usuario percibe la corrección como «un profesor», no como «una app».
- El **anual a 59,99 €** tiene poco sentido para quien se examina una vez; sirve para docentes que encadenan C1→C2 o para licencias B2B. Babbel/Busuu anclan el anual en 58–96 €.
- (estimación) Disposición a pagar del opositor castellanohablante: **20–40 € por convocatoria** la mayoría; 60–120 € una minoría con fecha de examen y suspenso previo. Las academias demuestran que existe un segmento (centenares/año en Lleida y Barcelona) que paga 300–480 € por simulacros corregidos.

---

## 5. Requisitos legales y normativos 2025–2026

| Ámbito | Estado a 30/10/2026 | Fuente (año) |
|---|---|---|
| **Docentes (C2)** | Decreto de régimen lingüístico (mayo 2024): C2 obligatorio para nuevos docentes desde 2025-26; TSJC suspendió cautelarmente y levantó la suspensión en dic. 2025; **junio 2026: Educació aplaza y flexibiliza**: se accede a la bolsa 2026-27 con C1 + compromiso de obtener el C2 antes de fin de 2026-27 (Redopositor: 2027-28 para la bolsa con resolución EDF/2328/2026, solicitudes hasta 8/2/2027); quien no lo acredite queda excluido; el C2 pasa de 5 puntos de mérito a requisito; prioridad de adjudicación a quien ya lo tiene. Para el personal ya en servicio «a partir de 2027-28 si el Departament lo determina». Solo **25 % de los docentes** tiene el C2 (2024); 30 % en Terres de l'Ebre. Plantilla pública ≈ 81.000–82.300 docentes (2023-24/2024-25) + 1.650 plazas en 2025-26. | 3cat https://www.3cat.cat/3catinfo/educacio-ajorna-el-requisit-del-c2-de-catala-per-als-nous-docents-per-la-manca-de-personal-acreditat/noticia/3417150/ ; VilaWeb https://www.vilaweb.cat/noticies/educacio-ajorna-exigencia-c2-catala-nous-docents/ ; Aldia (26/6/2026) https://www.aldia.cat/gent/noticia-educacio-amplia-periode-dacreditacio-requisit-c2-catala-als-nous-docents-20260626105048.html ; Redopositor https://redopositor.com/blog/ca-borsa-interins-docents-catalunya-2026-2027-requisits/ ; betevé (2024) https://beteve.cat/societat/nomes-25-per-cent-docents-nivell-c2-catala/ ; Diari de l'Educació (2023) |
| **ICS / sanidad** | Convocatoria 100-2025 (Resolució SLT/2380/2025, DOGC 26/6/2025): **6.037 plazas fijas en 74 categorías**; **C1** para enfermería (1.713 plazas) y auxiliar administrativo (1.295); **B1** para TCAI y celador; quien no acredita hace prueba apto/no apto dentro del proceso; exámenes: 8 categorías el 18/10/2026 (UPF) y las masivas desde enero de 2027. Salut exigirá el C1 «tal com diu la normativa» (3cat, 2024); programa Prescriu-te el català (3.ª edición 2026). | Redopositor https://redopositor.com/blog/ca-oposicions-ics-2026-convocatoria-100-2025-6037-places/ ; https://redopositor.com/blog/ca-infermeria-ics-2026-1713-places-oposicio/ ; 3cat https://www.3cat.cat/3catinfo/salut-exigira-el-c1-de-catala-als-sanitaris-que-optin-a-una-placa-tal-com-diu-la-normativa/noticia-amp/3276760/ |
| **Mossos d'Esquadra** | Convocatoria 46/26 (Resolució ISP/1763/2026, DOGC 8/6/2026): **1.587 plazas** (634 reservadas a mujeres); 4.ª prueba = catalán **C1** (redacción 180 palabras, 5 bloques, oral, 70 % para aprobar), eliminatoria, con exención por certificado. Policía local: nivel por ayuntamiento (B2 en Tarragona). | Redopositor https://redopositor.com/blog/ca-prova-catala-mossos-2026-exempcio-c1/ ; OpositaTest https://blog.opositatest.com/convocatoria-mossos-desquadra/ |
| **Generalitat (cuerpos generales)** | Cos administratiu (DOGC 2/2/2026, 366 plazas, 201 libres) y auxiliar (114 plazas): **C1** exigido; prueba obligatoria y eliminatoria (comprensión + redacción + oral) para quien no lo acredite. Advocacia y A1: C1. | Redopositor https://redopositor.com/blog/ca-oposicions-administratiu-generalitat-2026-requisits-temari/ ; OpositaTest (2026) |
| **Certificados válidos** | Ordre PLG/58/2025 (9/4/2025) y su modificación Ordre PLG/144/2026 (30/7/2026) fijan qué títulos acreditan catalán ante las administraciones. Los de Salut son equivalentes a la DPL. | llengua.gencat.cat tabla https://llengua.gencat.cat/web/.content/serveis/certificats_de_catala/taules-acreditacions-reconegudes/certificats-catalunya.pdf ; Redopositor https://redopositor.com/blog/ca-certificats-catala-valids-oposicions-2026-ordre-plg-144/ |
| **Modelo de examen DPL** | Decret 37/2024 (6/2/2024) regula A2–C2; **Decret 233/2025 (28/10/2025, DOGC 30/10/2025) añade el A1** (demanda por arraigo); nuevo modelo de C1 desde la convocatoria 2024 (65/100 y 31,5 en el área 1 eliminatoria; en Salut 25,2/40 en expresión escrita); **2026: convocatoria única** A2–C2 (inscripción 20–28/1/2026; C2 11/4, B2 25/4, C1 9/5, B1 16/5, A2 30/5; resultados 2/9/2026) + 2.ª ventana en septiembre con tope de 2.000 + A1 (21/11/2026, tope 1.000). Previsión 2027 (Redopositor): C2 3/4/2027, C1 8/5/2027, inscripción finales de enero. | laadministracionaldia (2025) https://laadministracionaldia.inap.es/noticia.asp?id=1259968 ; llengua.gencat.cat dates 2026 ; Redopositor calendari https://redopositor.com/blog/ca-calendari-examens-catala-2026-2027-oposicions/ |
| **Tasas 2026** | A2–B2: 23,90 €; **C1–C2: 57,45 €** (bonif. 30 %/50 % familia numerosa; exenciones) | llengua.gencat.cat |
| **Arraigo** | El informe de arraigo exige acreditar ≥ 45 h de catalán (10.000–15.000 regularizaciones/año en Cataluña); el nuevo A1 responde a esa demanda; criterios Ref. 1/2025 v3 (17/11/2025). No requiere B1+. **Segmento fuera del alcance de Aprova (B1–C2).** | Nació Digital (opinión) https://naciodigital.cat/opinio/la-llengua-catalana-i-la-regularitzacio-el-que-el-qui-el-com-i-el-quan.html ; Generalitat consulta Decret 233/2025 |

Implicación: el **calendario 2027 del proyecto (inscripción 20–28 de enero) es coherente** con lo publicado; la gran novedad es que el C2 docente sigue vivo pero con prórroga hasta 2027-28, lo que **alarga dos años una demanda de ≈ 13.000 inscritos/año en C2**.

---

## 6. Canal

| Pregunta | Respuesta | Fuente (año) |
|---|---|---|
| ¿Google Ads permite anunciar preparación de exámenes de lengua? | Sí; no hay política específica contra la preparación de exámenes (las restricciones afectan a servicios de «hacer el examen por ti», títulos falsos, etc.). Las academias (Adams, AulaCatalà, General d'Estudis) ya anuncian. | Google Ads Policy Center (en inglés es la versión vinculante) https://support.google.com/adspolicy/ |
| ¿Se puede anunciar en catalán? | **Sí**: el catalán figura con «Sí» tanto en idioma de interfaz como en **segmentación por idioma** de Google Ads. Ojo al precedente del gallego (2019): anuncios rechazados por «idioma no admitido en el texto»; el catalán no tiene ese problema, pero conviene que la landing esté en el mismo idioma que el anuncio. | support.google.com/google-ads/answer/6333734 ; elDiario.es (2019) https://www.eldiario.es/galicia/google-veta-anuncios-eventos-gallego_1_1906987.html |
| CPC orientativo «examen C1 català» | **Sin dato público para España.** Referencias: educación EE. UU. 4,81 $ (2026, LocaliQ, −23 % interanual) y 6,23 $ (2025); abogados en Cataluña 1–5 €; Meta Ads educación España 0,59 €. (estimación) palabras clave en catalán de examen: **0,40–1,20 €/clic** (poca puja: academias pequeñas y la Generalitat no puja); en castellano «nivel C catalán oposiciones»: 0,80–2,00 €. Con 100 €/mes ⇒ 80–200 clics ⇒ 20–50 diagnósticos ⇒ 1–2 pagos/mes (CAC 50–100 €, por encima del límite de 25 € de MARKETING §2 hasta que el embudo mejore). | webtonic (2026) https://www.webtonic.io/blog/education-coaching-google-ads-statistics ; superads (Meta ES) https://www.superads.ai/facebook-ads-costs/cpc-cost-per-click/education/spain |
| Acuerdos con academias | Hueco real: las academias de oposiciones (Adams, OpositaTest, Redopositor, academias de Lleida) **no preparan el C1** y lo necesitan para sus alumnos de ICS/Generalitat/Mossos. Redopositor ya es el principal productor de SEO en catalán sobre el tema: candidato a afiliado/partner de contenidos. | Redopositor (2026) |
| CNL / CPNL | Tiene listas de espera (8.000–9.000) y una plataforma propia (Parla.cat): no comprará, pero puede **recomendar** una herramienta gratuita de autodiagnóstico a quien no obtiene plaza; el CPNL ya coordina cursos de C2 con colegios profesionales (2025-26). | CPNL https://www.cpnl.cat/noticies/35192/ |
| Bibliotecas / Òmnium / Plataforma per la Llengua | Canales de difusión sin coste; Plataforma per la Llengua ya hace apps (CatalApp, Apparella't). Riesgo: que perciban una app de pago en castellano como competencia o como «castellanización». | plataforma-llengua.cat |
| Colegios profesionales y hospitales (B2B) | Salut forma 1.600–2.700 profesionales/año en catalán con UCF; el CPNL coordina C2 con colegios: el comprador B2B existe y ya paga formación. | Nació Digital pla de xoc sanitat https://naciodigital.cat/societat/pla-de-xoc-pel-catala-a-la-sanitat-es-formaran-2700-professionals-fins-al-novembre.html |

---

## 7. Riesgos

| Riesgo | Evidencia | Gravedad | Mitigación |
|---|---|---|---|
| **Dependencia del calendario oficial** | Una sola convocatoria anual A2–C2 (inscripción en enero, exámenes abril–mayo) + ventana de septiembre con tope de 2.000. Demanda concentrada en 4–5 meses; verano muerto. | Alta | Pase de convocatoria; CIFALC (17 convocatorias/año), Salut (ene.–feb.), JQCV (octubre) y Balears (enero y mayo) desestacionalizan si se cubren sus modelos. |
| **Que la Generalitat lance una app gratuita** | Ya existe Parla.cat (1,1 M€ en versión móvil), Simtest, el pla de xoc (más plazas, nuevo certificado básico), y Catfy/AprènCatalà cubren gratis el nicho; el Govern balear publica todos los exámenes con soluciones. | Alta (ya materializado parcialmente) | No competir en «ejercicios»; competir en corrección validada, probabilidad de aprobar y castellano como lengua de interfaz. |
| **Derechos sobre los modelos de examen** | No se ha encontrado licencia explícita en los modelos de la DPL; los exámenes anteriores publicados por el Govern balear y las «mostres» de la DPL son obras de la Administración. Catfy declara «no afiliado a ningún organismo examinador». | Media | Generar ítems propios (ya lo hace el motor), usar los oficiales solo como referencia de formato, declarar la no afiliación en la landing y evitar el nombre «DPL» en la marca. |
| **Variación dialectal** | El estándar del examen DPL admite las variantes del català central y nord-occidental (Lleida: «lo» artículo, «-o» en 1.ª persona) en la expresión oral, pero la escritura se corrige con la normativa IEC; el valencià (JQCV) y el balear tienen estándares propios (AVL; Govern balear). | Media | Rúbrica de corrección parametrizada por territorio; en oral no penalizar variantes aceptadas; versión «valencià» separada si se entra en JQCV. |
| **Reconocimiento entre territorios** | Cataluña reconoce los certificados de la JQCV y de las universidades valencianas (DOGC 5610) y los del Govern balear; Balears reconoce los de la JQCV y de la Generalitat (con excepciones: no los certificados de la Generalitat expedidos con la ESO). Las tablas se actualizan por orden (PLG/58/2025, PLG/144/2026). | Baja | Un titular de C1 JQCV puede opositar en Cataluña: el mercado valenciano es adicional y no canibaliza. |
| **JQCV como mercado adicional** | ≈ 30.000 matrículas/año (2024), 43.000 plazas, C1 es el nivel más demandado; tasas bajas (23,39 €); examen en octubre (desestacionaliza). | Oportunidad | Segunda fase: contenidos en valencià normativo AVL y modelo JQCV (estructura diferente). |
| **Validez de la corrección** | COSTES.md: hoy «criterios por heurística» + LanguageTool; Sonnet 5.5 a 0,15 €/usuario. Si no coincide con el profesor, el único producto de pago se cae. | Crítica | Mantener la condición previa de VALIDESA ≥ 80 % antes del cobro real (ya prevista). |
| **Castellanización percibida** | Marca en castellano y precios en una herramienta de lengua catalana; el entorno (Òmnium, Plataforma) es sensible. | Media | Interfaz bilingüe con catalán por defecto; mensaje «aprueba y úsalo», no «sácate el requisito». |
| **Tamaño del C1 castellanohablante** | 2.000–4.000 presentados/año en DPL; buena parte son catalanohablantes que no tienen el título por edad o escolarización. | Alta | Añadir C2 (13.000 inscritos) y B2 sanitario/policial desde el día 1 de cobro. |

---

## 8. Mercado accesible: TAM / SAM / SOM

Hipótesis explícitas (todas marcadas; cambiar una celda cambia el resultado):

| Hipótesis | Valor | Base |
|---|---|---|
| Candidatos DPL/año (2025–2027) | 22.000–28.000 (de ellos C2 11.000–14.000; C1 2.500–4.000; B2 400–800; B1 300–600; A2 300–600; ventanas extra 2.000–3.000) | §1.1 |
| Candidatos CIFALC/año | ≈ 5.000 (969 C1 en 2023) | §1.2 |
| Candidatos Salut/año | 1.500–2.500 | §1.2 |
| Alumnos CPNL en Suficiència/Superior | 6.000–10.000 personas/año | §1.2 (estimación) |
| JQCV | ≈ 30.000 matrículas | §1.3 |
| Balears | 8.000–10.000 inscritos/año | §1.3 |
| % de candidatos de C1/B2 en Cataluña con lengua inicial castellana u otra | 50–60 % | Encuesta de usos lingüísticos 2023: ≈ 30 % de la población tiene el catalán como lengua inicial; entre quienes carecen del título es mayor la proporción no catalanohablante (estimación) |
| % que busca ayuda online más allá de los modelos oficiales | 60–70 % | (estimación) |
| % que paga por algo (libro, curso o app) | 35–50 % | Ventas de libros + plazas CPNL C1 + academias (estimación) |
| % que paga por una app, habiendo gratis | 5–10 % | Tasas freemium de Duolingo/Busuu 5–8 % (estimación) |
| ARPU de Aprova por pagador | 35–45 €/año (mezcla 60 % pase 24,99, 30 % mensual 2 meses, 10 % anual) | MONETIZACION §1 |

**TAM** (personas que preparan un certificado oficial de catalán/valenciano en el dominio lingüístico, por año): DPL 25.000 + CIFALC 5.000 + Salut 2.000 + CPNL C1–C2 8.000 + JQCV 30.000 + Balears 9.000 ≈ **≈ 80.000 personas-año**; en gasto, si cada una gastara lo que cuesta un libro (35 €): **≈ 2,8 M€/año**; el gasto real (CPNL 100–263 €, academias 300–480 €, libros 35 €) sitúa el gasto en preparación en **4–8 M€/año (estimación)**.

**SAM** (lo que Aprova puede servir hoy: B1–C2 del modelo DPL/CIFALC/Salut en Cataluña, interfaz ca/es, PWA):
- Núcleo actual (B2 + C1): 3.500–5.500 candidatos DPL+CIFALC+Salut × 60–70 % con intención digital ⇒ **2.500–3.800 personas/año**; con el 50–60 % castellanohablante al que se dirige el producto: **1.300–2.300**.
- Con el C2 (modelo DPL ya cubierto por el motor en gran parte): + 11.000–14.000 × 60 % ⇒ **+7.000–8.500**.
- SAM total: **9.000–12.000 personas/año**; a 35–45 € ARPU sobre el 100 % ⇒ **320–540 k€** de techo teórico; sobre el 35–50 % que paga por algo ⇒ **110–270 k€/año realistas de bolsa de gasto digital**.

**SOM**:
- **12 meses** (S1 orgánico, sin C2, sin B2B): 2.000 visitas/mes orgánicas (MONETIZACION §3) ⇒ 300 diagnósticos ⇒ 3–5 % ⇒ 9–15 pagos/mes en temporada (ene.–may.), 2–4 fuera ⇒ **60–100 pagadores/año ≈ 2.500–4.000 €**; si la conversión real es del 1,5–2 % (más propio de un mercado con gratis de calidad): **25–50 pagadores ≈ 1.000–2.000 €**. El objetivo interno (25 suscriptores, 250 €/mes) está dentro del rango, en su parte alta.
- **36 meses** (con C2, JQCV y 3–5 licencias B2B de 20–50 asientos a 4–6 €/asiento/mes): **150–400 pagadores/año + 1.500–4.000 € B2B ⇒ 8–20 k€/año**. Es un negocio complementario, no una empresa: el coste variable (0,20–0,35 €/usuario/mes, COSTES.md) lo hace rentable desde el primer centenar de pagadores, pero no paga un salario.

Sensibilidad: la variable que más mueve el SOM no es el precio sino **(1) incluir el C2** (×3–4 el SAM) y **(2) la conversión diagnóstico→pago** (3–5 % supuesto; 1,5–2 % probable con Catfy gratis al lado).

---

## 9. Juicio honesto: ¿paga alguien por esto o le basta con Parla.cat y un libro?

1. **A la mayoría le basta con lo gratis.** Parla.cat (A2–C1), AprènCatalà, Catfy en fase gratuita, los modelos del Govern balear con soluciones y un libro de 35 € cubren el 80 % de la preparación. La tasa de aptos del C2 (79 %) dice que la mayoría de los candidatos al C2 aprueba sin más.
2. **Pero el C1 lo suspende la mayoría (41 % aptos en 2023)**, y el suspenso cuesta 57,45 € de tasa, un año de espera y, para un opositor del ICS o de la Generalitat, la plaza. Ese dolor es real y hoy nadie lo cuantifica en una landing. Es el único argumento que justifica 24,99 €.
3. **Lo que la gente paga de verdad es la corrección de la redacción y la sensación de ir acompañada**: por eso existen academias a 300–480 € y cursos CPNL a 263 € con listas de espera de 8.000 personas. Aprova compite ahí solo si la corrección es creíble (VALIDESA ≥ 80 %) y la muestra con transparencia («esta nota la daría un corrector en 8 de cada 10 casos»).
4. **El mercado de castellanohablantes para el C1 es pequeño (1.300–2.300 personas/año con intención digital)**; el dinero está en el **C2 de docentes (13.000 inscritos en 2026, prorrogado hasta 2027-28)** y, geográficamente, en la **JQCV (30.000 matrículas)**. Un producto solo-C1-para-castellanohablantes llega, con suerte, a 25–50 pagadores el primer año; con C2 y B2B, a unos cientos.
5. **Catfy es el competidor que decide el precio**: si mantiene el modelo gratuito con IA, Aprova no puede cobrar por «tests + plan»; tiene que cobrar por lo que Catfy no demuestra (validez, oral por sonidos, castellano, probabilidad calibrada) y plantearse un gratis más generoso.
6. **Veredicto**: viable como producto complementario de bajo coste (margen >90 %) con ingresos de 1–4 k€ el primer año y 8–20 k€ al tercero; **no viable como negocio principal** sin (a) C2, (b) B2B con hospitales/colegios/academias y (c) una prueba pública de validez que lo diferencie de la IA genérica.

---

## 10. Diez recomendaciones concretas

1. **Añadir el C2 (modelo DPL) al alcance antes de activar el cobro real.** Es 3–4 veces el C1 en candidatos (≈ 8.300 en 2024, 13.068 inscritos en 2026) y la prórroga docente hasta 2027-28 garantiza dos convocatorias más de demanda. Reutilizar motor, simulacros y corrector; el oral del C2 (exposición + interacción) se añade después.
2. **Pedir por transparencia a la DPL los datos 2024–2026 por nivel** (inscritos, presentados, aptos; portal de transparencia de la Generalitat, plazo legal de un mes) y a la CIFALC los de 2024–2025. Publicar la cifra real de aptos del C1 nuevo en la landing y en las 30 páginas SEO («en 2023 suspendió el 59 % del C1»): es el argumento de venta y hoy no se usa.
3. **Rehacer el mapa competitivo del proyecto incluyendo Catfy, AprènCatalà, Qüestiocat y c2catala.cat**; probar Catfy a fondo (corrección IA, oral, plan) y fijar explícitamente los tres diferenciales que se comunicarán: validez publicada de la corrección, oral por sonidos, versión en castellano. Si Catfy pasa a cobrar, reconsiderar el precio del pase.
4. **Hacer del pase de convocatoria (24,99 €) el producto principal y el mensual un secundario**; mover el aviso de pago para que la primera oferta que ve el usuario sea el pase con fecha («hasta el 8 de mayo de 2027»). Mantener el anual solo para docentes C1→C2 y licencias.
5. **Publicar la prueba de validez como contenido** («20 redacciones, un profesor y la app: coincidencia del X %») con metodología, en catalán y castellano. Es la única pieza de marketing que ningún competidor gratuito puede copiar sin hacer el trabajo.
6. **Diseñar el SEO en castellano para la intención de opositor** («qué nivel de catalán piden las oposiciones del ICS 2026», «prueba de catalán Mossos 46/26», «C1 catalán auxiliar administrativo Generalitat») y enlazar cada página con el diagnóstico gratuito; Redopositor domina en catalán, casi nadie en castellano. Objetivo: 40 % del tráfico en castellano.
7. **Partnerships con quien ya tiene al alumno y no prepara el C1**: academias de oposiciones (Adams, OpositaTest, academias de Lleida), Redopositor (afiliación 20 % sobre pases), UCF/Prescriu-te el català (Salut) y colegios profesionales que coordinan C2 con el CPNL. Oferta: código gratuito de 3 meses para sus alumnos y licencia de grupo a 4–6 €/asiento.
8. **Ajustar el embudo a conversiones del 1,5–2 %** en el plan financiero (no 3–5 %) mientras exista una alternativa gratuita con IA, y medir desde la primera semana con Search Console + 20 € en Keyword Planner para sustituir las estimaciones de volumen de búsqueda de §2.1.
9. **Anuncios: solo en castellano, solo enero y abril–mayo, con tope de CAC de 25 €**. Catalán admitido en Google Ads, pero las búsquedas en catalán las captan ya Redopositor, Catfy y la Generalitat de forma orgánica; el hueco pagado está en el castellanohablante que busca «nivel C catalán oposiciones» (CPC estimado 0,80–2 €).
10. **Preparar una fase 2 «valencià / JQCV»** (30.000 matrículas/año, examen en octubre, tasa 23,39 €) con rúbrica y estándar AVL separados, y aprovechar que los certificados se reconocen entre territorios; antes, verificar en los modelos oficiales de la DPL si existe una licencia de reutilización y, en su ausencia, mantener el 100 % de ítems propios y la declaración de no afiliación.

---

## Anexo A. Fuentes principales (URL · año)

- llengua.gencat.cat, «Més de 5.000 persones obtenen el certificat de coneixement de català» (sept. 2023): https://llengua.gencat.cat/en/detalls/noticia/Mes-de-5.000-persones-obtenen-el-certificat-de-coneixement-de-catala
- Racó Català, «Rècord d'examinands (8.306) i d'aprovats (5.731)» (2023): https://www.racocatala.cat/noticia/61369/
- Diari de la llengua, «Rècord d'examinands en les proves de català a Catalunya» (2023): https://www.diaridelallengua.cat/record-dexaminands-en-les-proves-de-catala-a-catalunya/
- 3cat, «Rècord per obtenir el C2… prop de 7.000» (abr. 2023): https://www.3cat.cat/3catinfo/record-per-obtenir-el-c2-de-catala-amb-prop-de-7000-persones-examinant-se-alhora/noticia/3161379/
- 3cat, «Més de 8.000 persones s'han examinat del nivell C2 de català en 14 localitats» (abr. 2024): https://www.3cat.cat/3catinfo/mes-de-8000-persones-sexaminen-avui-del-nivell-c2-de-catala-en-14-localitats-catalanes/noticia/3288308/
- Racó Català / El Punt Avui, «Rècord de certificats C2… 4.900 el 2024» (2025): https://www.racocatala.cat/noticia/67377/ ; https://www.elpuntavui.cat/societat/article/5-societat/2525687-record-de-certificats-c2-de-nivell-superior-de-catala-al-2024.html
- 3cat, «Augment rècord de certificats de nivell superior de català» (2026): https://www.3cat.cat/3catinfo/augment-record-de-certificats-de-nivell-superior-de-catala/noticia/3344924/
- c2catala.cat, «Examen C2 de català» (2026, 13.068 inscritos): https://c2catala.cat/examen-c2-catala/
- llengua.gencat.cat, fechas 2026 y plazos: https://llengua.gencat.cat/ca/detalls/noticia/dates-de-les-proves-2026 ; https://llengua.gencat.cat/ca/serveis/acreditacio_coneixements/certificats_de_catala/convocatoria_de_proves/terminis/index.html
- llengua.gencat.cat, tasas y bonificaciones 2026: https://llengua.gencat.cat/ca/serveis/acreditacio_coneixements/certificats_de_catala/convocatoria_de_proves/inscripcio_taxes_bonif/
- Redopositor, «On treure el C1 de català per opositar i quant costa» (2026): https://redopositor.com/blog/ca-on-treure-c1-catala-oposicions-cpnl-universitat-preu/
- UPC/CIFALC, Jornada d'acreditació (jul. 2024): https://www.upc.edu/slt/ca/politica-linguistica/servei-llengues-terminologia/participem/documents/jornada-acreditacio-cifalc-juliol-2024-final-pptx.pdf
- Nació Digital, «El 21 % de participants suspenen l'examen de català del Departament de Salut» (2025): https://naciodigital.cat/societat/el-21-de-participants-suspenen-lexamen-de-catala-del-departament-de-salut.html
- CPNL, Memòria 2024: https://www.cpnl.cat/media/upload/arxius/gerencia/Economia%20i%20finances/Mem%C3%B2ries/03-CPNL-Memoria_2024.pdf ; precios: https://www.cpnl.cat/xarxa/cnlmontserrat/cursos-de-catala/preus-dels-cursos/
- Nació Digital, «Rècord d'inscripcions als cursos de català: més de 41.000 alumnes» (2025): https://naciodigital.cat/societat/record-dinscripcions-als-cursos-de-catala-mes-de-41000alumnes.html
- Valencia Plaza, «La JQCV registra cerca de 30.000 matrículas para las pruebas de 2024»: https://valenciaplaza.com/valenciaplaza/jqcv-registra-30000-matriculas-pruebas-2024
- Catfy: https://catfy.app/ ; AprènCatalà: https://aprencatala.cat/
- 3cat, «Educació ajorna el requisit del C2 de català per als nous docents» (jun. 2026): https://www.3cat.cat/3catinfo/educacio-ajorna-el-requisit-del-c2-de-catala-per-als-nous-docents-per-la-manca-de-personal-acreditat/noticia/3417150/
- Redopositor, ICS 100-2025 (2026): https://redopositor.com/blog/ca-oposicions-ics-2026-convocatoria-100-2025-6037-places/ ; Mossos 46/26: https://redopositor.com/blog/ca-prova-catala-mossos-2026-exempcio-c1/
- laadministracionaldia.inap.es, Decret 233/2025 (2025): https://laadministracionaldia.inap.es/noticia.asp?id=1259968
- Google Ads, idiomas admitidos: https://support.google.com/google-ads/answer/6333734 ; elDiario.es, veto al gallego (2019): https://www.eldiario.es/galicia/google-veta-anuncios-eventos-gallego_1_1906987.html
- Precios apps: mindomax (Babbel/Busuu UE, verificado 11/10/2026) https://www.mindomax.com/babbel-prix ; ReSubs Duolingo ES https://resubs.app/es/subscriptions/duolingo ; Preply/italki perfiles de catalán (2026).

## Anexo B. Datos que no se han podido obtener (y cómo conseguirlos)

| Dato | Por qué falta | Cómo obtenerlo |
|---|---|---|
| Inscritos/presentados/aptos DPL 2024, 2025 y 2026 por nivel | No hay nota de prensa indexada; las páginas de gencat no se podían descargar en esta sesión | Solicitud de acceso a la información pública (transparencia.gencat.cat) a la DPL; o leer directamente llengua.gencat.cat/ca/detalls/noticia/ de septiembre 2024/2025/2026 |
| % aptos del nuevo C1 (2024–2026) | ídem | ídem |
| CIFALC 2024–2025 | Solo la jornada de julio 2024 (datos 2023) | cifalc.cat / solicitud a la secretaría (UdG) |
| JQCV 2025 matrículas y % aptos C1 | No indexado | jqcv.gva.es / nota de la Conselleria tras el 4/10/2025 |
| Volúmenes de búsqueda | Sin acceso a Keyword Planner/Semrush | Cuenta Google Ads + Search Console la primera semana |
| CPC real | ídem | Campaña piloto de 20 € en enero |
| Precio de Qüestiocat, Teide *10 exàmens C1*, Barcanova C1 | No indexado | Google Play / librerías |
| Miembros de r/catalan y de los grupos de Telegram | Reddit bloqueado; Telegram no indexa | Consulta manual |
