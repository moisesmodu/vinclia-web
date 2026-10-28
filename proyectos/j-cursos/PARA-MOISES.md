# J · Cursos en Udemy · lo que tienes que hacer tú

Todo lo demás está hecho: vídeos, subtítulos, recursos, cuestionarios, imágenes, textos de la ficha y cupones.
**Dónde está todo:** la página privada de entrega (enlace abajo, en «Entrega»): ves cada vídeo, lo descargas y tienes al
lado el texto que se pega en Udemy. La estructura exacta de cada curso está en `udemy/c1-CURRICULO.md`,
`c2-CURRICULO.md` y `c4-CURRICULO.md` (y `c3-` cuando se grabe entero).

## 1. Abre la cuenta de instructor (10 min, una vez)

[udemy.com/teaching](https://www.udemy.com/teaching/) → «Conviértete en instructor» con tu correo. En el perfil:
foto, y esta biografía (pégala, cámbiala si quieres):

> Moisés Mora dirige en Lleida una academia de programación y robótica para niños y ha creado Numi, una familia de
> aplicaciones educativas: Numi Mates, Numi Pro, Numi Ment y Numi Tech, cursos de programación, robótica y ciudadanía
> digital que se usan en extraescolares de primaria. Sus cursos están pensados para que familias, profesores y pequeños
> negocios pasen a la práctica desde la primera clase, con actividades listas para usar.

Después: «Herramientas» → **Pagos** (datos fiscales: formulario W-8BEN como autónomo en España, y PayPal o Payoneer)
y **Programa de promociones** (activar las ofertas de Udemy: es donde vende el buscador).

## 2. Sube el curso 4 (gratis) y el curso 1 (unos 40 min cada uno)

Crear curso → «Curso» → título de `udemy/fichas.json`. En **Plan de estudios**, para cada sección de `c1-CURRICULO.md`:
«+ Sección» con su título → **Cargador masivo** (arrastra todos los MP4 de la sección; cada uno se convierte en una
clase con su nombre) → en cada clase: «Vista previa» si lo dice el currículo, **Recursos** (PDF de `recursos/`) y
**Subtítulos** (el `.vtt` del mismo nombre, idioma español). Al final de la sección, «+ Cuestionario» y copia las
preguntas del currículo. Después, **Página de aterrizaje**: copia título, subtítulo, descripción (`udemy/descripciones.md`),
idioma, nivel, categoría, imagen (`imagenes/c1-curso.png`) y vídeo promocional (`00 - Video promocional.mp4`).
**Precio:** el de la ficha. **Enviar a revisión.**

## 3. Sube el curso 2 igual (unos 45 min)

Mismo procedimiento con `c2-CURRICULO.md`.

## 4. Crea los cupones del día 1 (5 min, cuando Udemy apruebe cada curso)

Promociones → «Crear cupón» con los códigos y tipos de `MARKETING.md` §2. Envía tú el mensaje de lanzamiento de
`MARKETING.md` §3 a tu lista (nunca a familias de Algorithmics). Si quieres, responde «sí» y preparo los vídeos cortos
para que los publiques.

## 5. Activa las dos tareas programadas (2 clics)

Las de `TAREA-PROGRAMADA.md`: mensual (respuestas a alumnos en borrador, cupones y propuesta del siguiente curso) y
trimestral (actualización con fecha). Necesitan el token de la API de instructor de Udemy como secreto `UDEMY_TOKEN`.

---

## Decisiones que puedes cambiar (no hace falta hacer nada)

- **Voz:** Kokoro (gratis), una voz por curso. Si Udemy la rechazara por «sonar robótica» o prefieres más calidad,
  narrar c1 y c2 con ElevenLabs cuesta unos 400.000 créditos (un plan Pro de un mes): respóndeme «voz ElevenLabs» y lo
  rehago con la misma voz en todas las clases. Clonar tu voz: solo si me lo pides.
- **Oferta del plan escuela** de la clase extra (`UDEMY26`, un mes de prueba para centros): confírmala o cámbiala.
- **Precios de lista:** 44,99 € (c1) y 49,99 € (c2 y c3); Udemy los rebaja solo en sus promociones.

## Entrega

(enlace a la página privada de entrega: se rellena al publicarla)
