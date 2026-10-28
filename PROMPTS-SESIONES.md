# Prompts para abrir una sesión por proyecto

> Cada sesión se abre sobre el repo `moisesmodu/vinclia-web`, rama `claude/estrategia-ingresos-recurrentes-tx0rvw`.
> Copia el prompt tal cual. Todos empiezan igual: leer `SESIONES.md`, `CARTERA.md` y `VIABILIDAD.md`.
> Orden recomendado: A → N → B → Juegos → M → G (antes del 15/11) → I → J → L → O → P.

---

## A · CCSE nacionalidad (`proyectos/a-ccse`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto A en proyectos/a-ccse.

Producto: web y app (PWA + Android) para aprobar el examen CCSE de nacionalidad española. Contenido: las 300 preguntas oficiales del Instituto Cervantes (públicas; descárgalas de la fuente oficial y cítala), organizadas por las 5 tareas del examen, con explicación de cada respuesta generada con IA y revisada por lógica en castellano, árabe, francés, inglés, rumano, chino y ucraniano. Funciones: test por tema, simulacro de 25 preguntas en 45 minutos con nota, repaso espaciado de las falladas, progreso guardado sin registro (localStorage) y con cuenta opcional (correo). Gratis: 50 preguntas y 1 simulacro. Pago único de 9,99 € por 3 meses de acceso total (Stripe en modo prueba). Incluye una página "Cómo es el examen" con fechas, precio de 85 € y pasos para inscribirse, en los 7 idiomas, pensada para posicionar en Google.

Marketing orgánico dentro de la sesión: 20 páginas SEO (una por tema y una por idioma con "test CCSE gratis"), ficha de Google Play en los 7 idiomas, 10 guiones de vídeo corto. Prepara también el gancho para el proyecto N: en la pantalla final del simulacro, una tarjeta "Siguiente paso: tus trámites" que apunte a /nuevo-en-espana (puede ser un enlace vacío por ahora).

Criterio de hecho: desplegable en Vercel, pago en modo prueba funcionando, TWA para Android generado, los 4 archivos de SESIONES.md, informe final. Moisés solo debe: crear Stripe y pegar claves, crear el proyecto en Vercel y en Neon, y pulsar publicar en Google Play cuando le pases el paquete.
```

---

## N · Nuevo en España (`proyectos/n-nuevo-en-espana`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto N en proyectos/n-nuevo-en-espana. Si proyectos/a-ccse ya existe, reutiliza su base de código y su diseño: A y N son la misma marca.

Producto: guías paso a paso, con lista de documentos, plazos, tasas y errores frecuentes, para las personas regularizadas o recién llegadas a España, en castellano, árabe, francés, inglés, rumano, chino y ucraniano. Guías de la versión 1: renovación de la autorización de residencia (incluida la del Real Decreto 316/2026), empadronamiento, número de la Seguridad Social, tarjeta sanitaria, apertura de cuenta bancaria, homologación de títulos, canje y teórico del carnet de conducir, y camino a la nacionalidad (plazos de 2 y 10 años, CCSE y DELE A2). Cada guía termina con una lista de comprobación interactiva y un recordatorio de plazos por correo. Es información pública de fuentes oficiales, siempre citadas y fechadas, con aviso claro de que no es asesoramiento legal; nada de gestión de citas previas ni de tramitar en nombre de nadie. Gratis: la primera guía completa y los resúmenes de todas. Suscripción de 4,99 €/mes o pack de 19,90 € (Stripe en modo prueba).

Marketing orgánico: 30 páginas SEO con las preguntas que la gente busca en cada idioma ("cómo renovar residencia 2027", "empadronarse sin contrato"), 10 guiones de vídeo corto por idioma principal (castellano, árabe, francés), lista de comunidades (sin publicar). Tarea programada: revisar cada semana las fuentes oficiales y actualizar plazos y tasas.

Criterio de hecho: el de SESIONES.md. Moisés solo debe: claves de Stripe, Vercel y Neon.
```

---

## B · Oposiciones de cola larga (`proyectos/b-oposiciones`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto B en proyectos/b-oposiciones.

Producto: plataforma de tests para oposiciones que las grandes apps no cubren: en la versión 1, Auxiliar Administratiu de la Generalitat de Catalunya, Auxiliar Administrativo de ayuntamientos de Cataluña (temario común), Mossos d'Esquadra (escala básica), Bombers de la Generalitat y Auxiliar de Enfermería del ICS. Para cada una: temario oficial troceado en temas a partir de la convocatoria del DOGC/BOE (cítala), banco de 300 a 500 preguntas por oposición generadas con IA a partir del texto legal, verificadas con una segunda pasada que comprueba la respuesta contra la fuente, con explicación y referencia al artículo. Tests por tema, simulacros con el formato real de la convocatoria, repaso espaciado, estadísticas, en castellano y catalán. Gratis: 20 preguntas por oposición. Suscripción de 9,99 €/mes (Stripe en modo prueba). Diseña el motor para que añadir una oposición nueva sea un archivo de configuración más el PDF de la convocatoria: así nace el proyecto L.

Marketing orgánico: una página SEO por oposición y por tema ("test auxiliar administratiu Generalitat gratis"), página "Convocatorias 2027" actualizable, 10 guiones de vídeo. Tarea programada: cada semana, nuevas preguntas y vigilancia de convocatorias nuevas en el DOGC. Este proyecto sí admite anuncios de búsqueda desde el mes 2 (100 €/mes, VIABILIDAD §1): prepara la campaña y las palabras clave, sin activarla.

Criterio de hecho: el de SESIONES.md. Moisés solo debe: claves de Stripe, Vercel y Neon.
```

---

## Juegos · web (CrazyGames, Poki, itch.io) y Roblox (`proyectos/juegos`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto Juegos en proyectos/juegos.

Objetivo de esta sesión: el primer juego web completo, listo para enviar a CrazyGames, Poki e itch.io, y la plantilla para que cada juego siguiente cueste una sesión. Juego: casual, de una mecánica, partidas de 1 a 3 minutos, controles de ratón y táctil, sin texto para que funcione en cualquier país (el público que paga está en EE. UU. y Reino Unido). Elige el género con datos: mira las categorías con más juegos nuevos y mejor valoración en CrazyGames y Poki y escoge un hueco. Pila: Phaser 3 + TypeScript + Vite, exportación HTML5 estática. Integra el SDK de CrazyGames (anuncios en pausas naturales, guardado) y el SDK de Poki de forma intercambiable. Arte y música generados con Higgsfield y ElevenLabs con tope de 60 créditos; lo que falte, con gráficos por código. Incluye pantalla de inicio, tutorial de 10 segundos, puntuación, dificultad progresiva y reinicio en 1 clic. Prueba de rendimiento en móvil de gama media.

Entrega además: plantilla reutilizable en proyectos/juegos/plantilla, lista de los 11 juegos siguientes con género y gancho, textos y capturas para las fichas de los tres portales, y un documento proyectos/juegos/ROBLOX.md con el plan para el primer juego de Roblox publicado por Open Cloud API (Rojo + Luau, publicación sin abrir Studio), sin construirlo todavía. Tarea programada: cada 2 semanas, un juego nuevo con la plantilla y revisión de los anteriores.

Criterio de hecho: el de SESIONES.md, más el juego jugable en una URL de Vercel. Moisés solo debe: crear las cuentas de desarrollador en CrazyGames, Poki e itch.io y pulsar enviar con el paquete y los textos que le dejes.
```

---

## M · Certificados oficiales de catalán, B1 a C2 (`proyectos/m-catala`)

```
Lee primero SESIONES.md, CARTERA.md, VIABILIDAD.md y M-CATALA-PRODUCTE.md de este repo y cúmplelos, y en panel/data/proyectos.json los campos lider, examenes, hallazgos y mejoras del proyecto m-catala. Construye el proyecto M en proyectos/m-catala.

Producto: la app para aprobar los certificados oficiales de catalán (B1, B2, C1 y C2) de la Direcció General de Política Lingüística, las universidades (CIFALC), el CPNL y Salut. No enseña catalán "en general": entrena exactamente las partes de cada examen con sus pesos, tiempos y mínimos (están en M-CATALA-PRODUCTE.md, sección 2) y dice cada día la probabilidad de aprobar. Público: opositores (el C1 es la llave del empleo público), sanitarios (el ICS exige C1), docentes (C2), inmigrantes (B1 y B2) y quien vive en Cataluña y no se atreve a hablar. Interfaz en catalán y castellano; explicaciones también en inglés, árabe, rumano y francés.

Sesión 1, lo que se construye (sección 7 del documento de producto): entrada de 3 pantallas sin registro; diagnóstico adaptativo de 12 a 15 minutos por áreas del examen que devuelve probabilidad de aprobar, nota por área, 3 puntos débiles y 3 sonidos difíciles; plan hacia la fecha de la convocatoria elegida (calendario DPL y universidades 2027 del documento) con sesiones de 10 a 20 minutos y aviso de la ventana de inscripción; práctica diaria (huecos normativos, transformación, detección de castellanismos, dictados con audio, léxico) con botón "¿Por qué?" con la regla citada y repaso espaciado FSRS de cada error (ts-fsrs); mapa de dominio con confianza por punto; corrección escrita por criterios con la rúbrica oficial en menos de 60 segundos (LanguageTool con las reglas de Softcatalà para lo seguro, modelo de lenguaje para adecuación y coherencia, "posible error" cuando dude); simulacro escrito completo de B1, B2 y C1 con los modelos oficiales públicos, tiempos reales, mínimos y comparación con la cohorte; oral básica: lectura en voz alta con puntuación de pronunciación por fonema (Whisper catalán de Projecte AINA y alineamiento forzado) sobre el catálogo de sonidos difíciles para castellanohablantes. Racha desacoplada con minisesión de 2 minutos, dos congelaciones al mes y pantalla de compromiso. Gratis: diagnóstico, un simulacro al mes, minisesiones, 3 correcciones y 10 minutos de oral al mes. Premium: 9,99 €/mes, 59,99 €/año o pase de convocatoria de 3 meses a 24,99 € (Stripe en modo prueba), con aviso 7 días antes de renovar, cancelación en un clic y 14 días de devolución. Contenido generado con los modelos catalanes del BSC (Salamandra o ALIA) y validado con LanguageTool; deja un lote de 50 ítems marcados para revisión humana por muestreo. Mide y documenta el coste por usuario y mes (objetivo: menos de 1,5 € a 30 minutos de uso). Voz: TTS barato con buen catalán (Matxa si la licencia lo permite, si no Google o Azure); ElevenLabs solo en la demo de la landing.

Lo que NO se hace: gamificación por encima del aprendizaje, corazones que castigan el error, avatares, itinerarios rígidos. Queda para la sesión 2: simulacro oral completo con examinador de voz, C2, liga por convocatoria, reto de 60 días y Android.

Marketing orgánico: 30 páginas SEO en catalán y castellano ("examen C1 català 2027 model", "nivell B2 català prova", "qué nivel de catalán piden las oposiciones", una por cuerpo y nivel), calendario de convocatorias 2027 con alertas por correo, 10 guiones de vídeo en catalán con errores típicos, ficha de Google Play. Admite anuncios de búsqueda desde el mes 2 (100 €/mes): prepara la campaña sin activarla. Tarea programada: cada semana, 50 ítems nuevos validados y revisión de las fechas oficiales; cada mes, el informe de coste por usuario.

Criterio de hecho: el de SESIONES.md, con una demo que Moisés pueda probar desde el móvil haciendo el diagnóstico completo y un simulacro de C1, y la prueba de validez preparada (protocolo y formulario para que 20 candidatos reales comparen la corrección de la app con la de un profesor; no se lanza sin el 80 % de coincidencia). Moisés solo debe: claves de Stripe, Vercel, Neon y del proveedor de voz, y conseguir los 20 candidatos de prueba (academias de Lleida o el CNL).
```

---

## G · Cuentos personalizados (`proyectos/g-cuentos`) · fecha límite 15/11

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto G en proyectos/g-cuentos. La tienda debe poder abrirse el 15 de noviembre para vender para Navidad y Reyes.

Producto: cuentos infantiles personalizados de calidad. El cliente rellena nombre, edad, ciudad, mascota, afición y un valor o miedo a tratar; elige colección (dormir, valores, hermanito nuevo, mi ciudad) e idioma (castellano o catalán). El sistema genera texto con claude-sonnet-5-5 a partir de plantillas narrativas fijas de 12 páginas revisadas por ti, y 12 ilustraciones con Higgsfield con un personaje y estilo consistentes (define 2 protagonistas, niño y niña, con hoja de personaje; nada de fotos del niño). Vista previa gratuita de 3 páginas antes de pagar. Formatos: PDF a 7,90 € y libro impreso tapa dura a 34,90 € mediante impresión bajo demanda con API (Gelato o Lulu; investiga precio real para España y ajusta el precio si el margen baja de 8 €). Maquetación automática a PDF de imprenta con sangrado. Stripe en modo prueba, correo de entrega con Resend, pedido a imprenta automático al pagar. Tope de créditos de Higgsfield en esta sesión: 80; genera 2 cuentos de muestra completos y reutiliza sus ilustraciones en la landing.

Marketing orgánico: landing con los 2 cuentos de muestra, 15 páginas SEO ("cuento personalizado con nombre", "regalo abuelos Navidad"), 20 guiones de vídeo corto para TikTok e Instagram, programa de afiliados al 20 % (enlaces con código, panel mínimo) para cuentas de maternidad. Nada de anuncios. Tarea programada: cada día, pedidos, incidencias y soporte; cada semana, informe.

Criterio de hecho: el de SESIONES.md, más un pedido de prueba de punta a punta (pago de prueba, PDF generado, pedido a imprenta en modo sandbox). Moisés solo debe: claves de Stripe, Vercel, Neon y cuenta de la imprenta.
```

---

## I · Libros en Amazon KDP (`proyectos/i-kdp`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto I en proyectos/i-kdp. Punto de partida: reutiliza el material de Numimates (repositorio público moisesmodu/numimates): los imprimibles de Numi Tech (imprimeix.html y las guías tech-guide-*.js de los cursos Robot, Creadors, Robòtica y Digital), las actividades sin pantalla de sus 108 sesiones y los ejercicios de Numi Mates (curriculum.js, de 1º de primaria a 4º de ESO) como banco para los cuadernos; lee NUMI-TECH-ESTAT.md antes de nada. El contenido está en catalán: tradúcelo al castellano y conserva la edición catalana.

Producto: catálogo de libros de actividades para niños de 6 a 12 años sobre lógica, pensamiento computacional y programación sin pantalla, en castellano y catalán, para Amazon KDP en tapa blanda (y versión Kindle donde tenga sentido). Esta sesión entrega 5 títulos listos para subir: por ejemplo, "Lógica para peques 6-8", "Pensamiento computacional 8-10", "Scratch paso a paso", "Pasatiempos de programación", "Lògica per a nens" (catalán). Cada título: 60 a 100 páginas de actividades generadas con IA y verificadas (soluciones correctas, dificultad progresiva), maquetadas en PDF de interior con las medidas de KDP, portada en PDF con lomo calculado, descripción optimizada con palabras clave, 7 palabras clave y categorías, precio con margen de 2 a 5 € calculado con la calculadora de KDP. Construye el generador como pipeline reutilizable (tema → actividades → PDF) para que cada título nuevo cueste una tarea programada. Declaración de contenido generado con IA preparada según la política de KDP.

Marketing: ninguno pagado. Fichas optimizadas y plan de lanzamiento escalonado (3 títulos al día como máximo permite Amazon). Tarea programada: cada 2 semanas, 2 títulos nuevos y revisión de ventas.

Criterio de hecho: 5 paquetes completos (interior, portada, ficha) en el almacenamiento del proyecto, pipeline documentado, informe. Moisés solo debe: abrir la cuenta de KDP y subir los paquetes siguiendo PARA-MOISES.md.
```

---

## J · Cursos en Udemy (`proyectos/j-cursos`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos, y en panel/data/proyectos.json el campo lider del proyecto j-cursos. Construye el proyecto J en proyectos/j-cursos.

Punto de partida: NO se escribe desde cero. Moisés ya tiene Numimates (repositorio público moisesmodu/numimates, app en app.numimates.com; web en moisesmodu/numimates-web): cuatro apps sobre un mismo motor (Numi Mates, primaria; Numi Pro, ESO; Numi Ment, adultos; Numi Tech, programación y robótica). Numi Tech tiene cuatro cursos completos y revisados: Robot (6-8 años, 32 sesiones, tech-c1.js), Creadors (9-11, 32 sesiones, tech-c3.js), Robòtica con micro:bit y Maqueen (10-12, 32 sesiones, tech-c2.js, simulador y exportación a MakeCode) y Digital (9-12, 12 sesiones, tech-c5.js), cada uno con guía del profesor (tech-guide-*.js), presentaciones (presenta.html), imprimibles (imprimeix.html), solucionario (tech-sol.js) y 212 animaciones. Lee NUMI-TECH-ESTAT.md del repo antes de nada. El contenido está en catalán (y en castellano donde exista): tradúcelo al castellano de España con revisión por muestreo.

Cursos a producir (en este orden):
1. "Programación para niños desde casa: guía para padres" (3 horas): a partir de Robot y Creadors. Habla al padre, no al niño: plan de 4 semanas, qué hacer cuando el niño se frustra, seguridad online; las sesiones de Numi son las actividades de cada semana y los imprimibles son los recursos descargables.
2. "Robótica con micro:bit y Maqueen para niños y profes" (4 horas): a partir de Robòtica; el simulador grabado con Playwright y el kit de compra de NUMI-TECH-KIT.md como lección de materiales.
3. "IA práctica para pequeños negocios y autónomos" (4 horas): este sí se escribe nuevo, con casos de autónomos españoles (facturación, Verifactu 2027, RGPD, atención al cliente).
4. Opcional y corto: "Bienestar digital en familia" a partir de Digital, como curso gratuito que trae alumnos a los otros.

Producción: guion por lección (5 a 8 minutos) generado desde las sesiones y guías; diapositivas a partir de presenta.html (reutiliza su diseño y color por curso) o Marp; demostraciones de pantalla del simulador grabadas con Playwright; voz con ElevenLabs (clona la de Moisés solo si lo pide; si no, voz neutra de catálogo) o Kokoro para borradores; montaje con ffmpeg; subtítulos; cuestionario por sección a partir del solucionario; miniaturas; descripción y palabras clave para el buscador de Udemy con la fórmula del líder (resultado + herramienta + "para" + público). Tope de créditos de voz: documenta el gasto. Entrega los vídeos en el almacenamiento del proyecto, no en git. Licencias: las piezas 3D de Kenney son CC0 y el resto es de Moisés; no uses nada con licencia no comercial.

Venta cruzada: una clase extra en cada curso que lleve a la app Numi Tech (cupón o plan escuela) y a los cuadernos de KDP; cupones propios al 97 % para la web de Numimates. Marketing: ninguno pagado; cupones de lanzamiento limitados para conseguir las 30 primeras valoraciones y plan de vídeos cortos a partir de las lecciones. Tarea programada: cada mes, responder preguntas de alumnos (borradores para aprobar), actualización trimestral con fecha en el título y propuesta del siguiente curso (Numi Mates y Pro: "matemáticas de primaria explicadas a los padres").

Criterio de hecho: los cursos 1 y 2 completos y listos para subir con la estructura exacta que pide Udemy, el 3 con guion y primera sección grabada, los 4 archivos de SESIONES.md e informe. Moisés solo debe: abrir la cuenta de instructor y subir siguiendo PARA-MOISES.md.
```

---

## L · Motor de exámenes multi-vertical (`proyectos/l-examenes`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto L en proyectos/l-examenes, reutilizando el motor de proyectos/b-oposiciones (si no existe aún, construye primero el motor con los criterios de B).

Producto: el motor de tests y simulacros aplicado a tres verticales nuevas, cada una con su propio dominio y marca pero el mismo código: (1) nueva PAU/EBAU 2027 por materia y comunidad autónoma, con exámenes resueltos de años anteriores (públicos) y generación de exámenes nuevos del mismo formato; (2) DELE y SIELE (A2 a C1) para estudiantes de español de todo el mundo, interfaz en inglés, chino, portugués y francés, con expresión escrita y oral corregidas por IA; (3) nivell C de català. Gratis: una muestra por vertical. Suscripción de 9,99 €/mes por vertical (Stripe en modo prueba).

Marketing orgánico: 20 páginas SEO por vertical en sus idiomas, fichas de Google Play, 10 guiones de vídeo por vertical. Sin anuncios hasta tener datos de B.

Criterio de hecho: el de SESIONES.md, con las tres verticales desplegables desde la misma base. Moisés solo debe: claves de Stripe, Vercel y Neon, y 3 dominios.
```

---

## O · Lectura en voz alta para niños (`proyectos/o-lectura`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto O en proyectos/o-lectura.

Producto: app (PWA + Android) en la que un niño de 5 a 8 años lee textos en voz alta, la app escucha, marca las palabras bien y mal leídas, mide palabras por minuto y precisión, y adapta la dificultad; en castellano y catalán. Reconocimiento con Whisper o equivalente afinado a voces infantiles (prueba 3 proveedores con grabaciones de prueba y documenta precisión y coste por minuto; objetivo menos de 0,5 € por niño y mes). Biblioteca inicial de 100 textos graduados generados con IA y revisados (sílabas, frases, cuentos cortos), con ilustración ligera. Panel para padres con progreso semanal por correo. Privacidad reforzada: audio no se guarda salvo consentimiento explícito; cumplimiento RGPD para menores. Gratis: 5 minutos al día. Suscripción de 6,99 €/mes (Stripe en modo prueba).

Marketing orgánico: 20 páginas SEO ("mi hijo lee mal", "fluidez lectora primaria"), guía descargable para escuelas, 10 guiones de vídeo para padres, ficha de Google Play. Prueba de anuncios de 150 € prevista en el mes 4: prepara la campaña sin activarla.

Criterio de hecho: el de SESIONES.md, con una demo que Moisés pueda probar con un niño real desde el móvil. Moisés solo debe: claves de Stripe, Vercel, Neon y del proveedor de voz.
```

---

## P · Webs de herramientas con AdSense (`proyectos/p-webs-adsense`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos, y en panel/data/proyectos.json los campos lider, hallazgos y mejoras del proyecto p-webs-adsense (ahí están los umbrales reales de las redes publicitarias, las políticas de Google y los repositorios a reutilizar). Construye el proyecto P en proyectos/p-webs-adsense.

Objetivo de esta sesión: la fábrica de sitios y los dos primeros sitios publicados. Son sitios de HERRAMIENTAS Y DATOS, no de artículos: cada página debe ofrecer un cálculo, un dato real o una utilidad que la gente use (Google penaliza el contenido escalado con IA sin valor, y los resúmenes de IA recortan los clics informativos, pero no los de herramientas). Castellano y catalán en todos.

Fábrica (proyectos/p-webs-adsense/fabrica): plantilla Astro estática (o Next.js exportado) con rendimiento perfecto en móvil (Lighthouse 95+), diseño limpio y propio (nada de plantilla genérica), bloque de consentimiento de cookies con la gestión de consentimiento gratuita de Google (TCF 2.2) ya integrada, espacios de anuncio de AdSense preparados pero vacíos hasta tener la cuenta aprobada, sitemap, datos estructurados, páginas legales, analítica sin cookies (Umami), y un generador de páginas a partir de datos (CSV/JSON) para hacer páginas programáticas con datos oficiales. Despliegue en Cloudflare Pages o Vercel, un proyecto por sitio.

Catálogo (VIABILIDAD.md, «Catálogo de sitios del proyecto P»): 7 sitios ordenados por lo que pagan. En esta sesión se construyen los dos primeros: Sitio 1, "nómina y laboral" (sueldo neto 2027 con IRPF por comunidad incluida Cataluña, finiquito, indemnización por despido, paro, baja, cuota de autónomos 2027, horas extra, nómina), y Sitio 2, "impuestos y autónomos" (IRPF, IVA, modelos trimestrales, Verifactu 2027, retenciones, calculadora de factura). Cada calculadora con explicación corta, método de cálculo publicado, fuentes oficiales citadas, fecha de actualización y autor. Deja preparadas en el README las fichas de los sitios 3 a 7 (finanzas de EE. UU. en español, vivienda, calendario y festivos por municipio, coche y seguros, salud cotidiana) con sus 30 primeras palabras clave cada uno; el sitio 3 es el que abre las redes premium porque su tráfico es de EE. UU. Elige dominios cortos en .es para los sitios 1 y 2 y un .com para el 3 (propón 3 opciones por sitio en PARA-MOISES.md; nada se compra sin él). Arquitectura por país desde el primer día (SESIONES.md, regla 8): parámetros fiscales y legales en archivos por país y año.

Marketing: solo SEO. Para cada sitio, mapa de 200 palabras clave de cola larga con intención de uso, enlazado interno, y 10 fichas de datos "citables" (tablas con datos oficiales) que atraen enlaces. Nada de anuncios de pago, nunca. Tarea programada: cada semana, 20 páginas nuevas con datos actualizados, revisión de Search Console (cuando Moisés conecte la cuenta) e informe; cada 6 a 8 semanas, el siguiente sitio del catálogo por orden.

Criterio de hecho: el de SESIONES.md, más los dos sitios desplegados en URL temporal, con Lighthouse 95+ en móvil y 40 calculadoras entre los dos sitios, cada una con su página en castellano y catalán. Moisés solo debe: comprar los 2 dominios, crear la cuenta de AdSense y pegar el código de verificación, y conectar Search Console.
```
