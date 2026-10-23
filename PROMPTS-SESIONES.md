# Prompts para abrir una sesión por proyecto

> Cada sesión se abre sobre el repo `moisesmodu/vinclia-web`, rama `claude/estrategia-ingresos-recurrentes-tx0rvw`.
> Copia el prompt tal cual. Todos empiezan igual: leer `SESIONES.md`, `CARTERA.md` y `VIABILIDAD.md`.
> Orden recomendado: A → N → B → Juegos → M → G (antes del 15/11) → I → J → L → O.

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

## M · Catalán con IA por voz (`proyectos/m-catala`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto M en proyectos/m-catala.

Producto: tutor de catalán conversacional por voz y texto, para adultos que lo necesitan para oposiciones de la Generalitat, el arraigo o el trabajo. Niveles B2 y C1 según el marco de la Direcció General de Política Lingüística. Funciones: conversación guiada por situaciones reales (entrevista, oficina, médico, escuela de los hijos), corrección de errores con explicación en el idioma del usuario (castellano, árabe, francés, inglés, rumano), ejercicios del examen de nivell C (comprensión, expresión escrita corregida con IA), práctica de pronunciación con reconocimiento de voz y puntuación, plan semanal. Voz: reconocimiento con Whisper o equivalente barato; síntesis con el TTS más barato que suene bien en catalán (compara Google, Azure y OpenAI; deja ElevenLabs solo para la demo de la landing). Objetivo de coste: menos de 1,5 € por usuario y mes a 30 minutos de uso; mide y documenta. Gratis: 10 minutos al día. Suscripción de 9,99 €/mes (Stripe en modo prueba).

Marketing orgánico: 20 páginas SEO ("aprender catalán gratis", "examen nivell C", en los 5 idiomas), 10 guiones de vídeo, ficha de Google Play. Admite anuncios de búsqueda desde el mes 2 (100 €/mes): prepara la campaña sin activarla.

Criterio de hecho: el de SESIONES.md, con una demo de conversación real que Moisés pueda probar desde el móvil. Moisés solo debe: claves de Stripe, Vercel, Neon y la clave del proveedor de TTS elegido.
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
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto I en proyectos/i-kdp.

Producto: catálogo de libros de actividades para niños de 6 a 12 años sobre lógica, pensamiento computacional y programación sin pantalla, en castellano y catalán, para Amazon KDP en tapa blanda (y versión Kindle donde tenga sentido). Esta sesión entrega 5 títulos listos para subir: por ejemplo, "Lógica para peques 6-8", "Pensamiento computacional 8-10", "Scratch paso a paso", "Pasatiempos de programación", "Lògica per a nens" (catalán). Cada título: 60 a 100 páginas de actividades generadas con IA y verificadas (soluciones correctas, dificultad progresiva), maquetadas en PDF de interior con las medidas de KDP, portada en PDF con lomo calculado, descripción optimizada con palabras clave, 7 palabras clave y categorías, precio con margen de 2 a 5 € calculado con la calculadora de KDP. Construye el generador como pipeline reutilizable (tema → actividades → PDF) para que cada título nuevo cueste una tarea programada. Declaración de contenido generado con IA preparada según la política de KDP.

Marketing: ninguno pagado. Fichas optimizadas y plan de lanzamiento escalonado (3 títulos al día como máximo permite Amazon). Tarea programada: cada 2 semanas, 2 títulos nuevos y revisión de ventas.

Criterio de hecho: 5 paquetes completos (interior, portada, ficha) en el almacenamiento del proyecto, pipeline documentado, informe. Moisés solo debe: abrir la cuenta de KDP y subir los paquetes siguiendo PARA-MOISES.md.
```

---

## J · Cursos en Udemy (`proyectos/j-cursos`)

```
Lee primero SESIONES.md, CARTERA.md y VIABILIDAD.md de este repo y cúmplelos. Construye el proyecto J en proyectos/j-cursos.

Producto: dos cursos en vídeo para Udemy (y después Hotmart): "Programación para niños desde casa: guía para padres" (Scratch y lógica, 3 horas) y "IA práctica para pequeños negocios y autónomos" (4 horas), en castellano. Cada curso: guion completo por lección (lecciones de 5 a 8 minutos), diapositivas generadas (HTML a vídeo o imágenes), demostraciones de pantalla grabadas con Playwright donde haga falta, voz con ElevenLabs (clona la de Moisés solo si él lo pide; si no, voz neutra de catálogo), montaje automático con ffmpeg, subtítulos, ejercicios y cuestionarios por sección, descripción y palabras clave optimizadas para el buscador de Udemy, miniatura. Tope de créditos de voz: documenta el gasto. Entrega los vídeos en el almacenamiento del proyecto, no en git.

Marketing: ninguno pagado; cupones de lanzamiento preparados y plan de reseñas iniciales. Tarea programada: cada mes, responder preguntas de alumnos (borradores para aprobar) y proponer el siguiente curso.

Criterio de hecho: los dos cursos completos y listos para subir, con la estructura exacta que pide Udemy. Moisés solo debe: abrir la cuenta de instructor y subir siguiendo PARA-MOISES.md.
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
