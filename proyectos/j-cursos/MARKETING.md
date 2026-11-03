# J · Cursos en Udemy · marketing (sin pago)

> Escenario: **sin anuncios** (VIABILIDAD §1: «J · ¿Anuncios? No»). El tráfico lo trae el buscador de Udemy; nosotros
> ponemos las 30 primeras valoraciones, los vídeos cortos y la venta cruzada. **Nada se publica ni se envía sin que
> Moisés lo apruebe**: aquí está todo preparado.

## 1. Lo que manda en Udemy (y cómo lo cubrimos)

| Palanca | Qué hacemos |
|---|---|
| Título con la búsqueda literal (fórmula del líder: resultado + herramienta + «para» + público) | «Enseña a programar a tu hijo con Scratch: guía para padres», «Crea robots con micro:bit y Maqueen para niños y profes», «Ahorra horas con IA y ChatGPT para autónomos y pymes», «Bienestar digital en familia: pantallas y redes seguras» (`udemy/fichas.json`) |
| Valoraciones tempranas (Udemy pide la valoración hacia el 25 % del curso) | Clases 1-3 de cada curso pensadas como «wow» y gratuitas en vista previa; cupones de lanzamiento dirigidos (abajo) |
| Cursos que se terminan | Clases de 5-8 minutos, una tarea de 10 minutos al final de cada una, cuestionario por sección |
| «Actualizado» | Tarea trimestral: revisión con fecha en la clase extra (y en el título del curso 3, que es el que caduca) |
| Venta cruzada | Clase extra en cada curso → los otros cursos con cupón propio (97 % para el instructor), la app Numi Tech y los cuadernos de KDP |
| Curso gratuito como imán | «Bienestar digital en familia» (c4), gratis, lleva en su última clase a c1 y c2 |

## 2. Cupones

Reglas vigentes que hemos encontrado (blog de instructores de Udemy, 2026; **comprobar en el panel al crearlos**): cupón
gratuito **abierto** = 10 canjes y 5 días; cupón gratuito **dirigido** = hasta 100 canjes y 31 días; 3 cupones por curso y
mes en total; con cupón o enlace propio el instructor cobra el **97 %** (sin él, el 37 %).

| Momento | Curso | Tipo | Código propuesto | Para quién |
|---|---|---|---|---|
| Día 1 | c1, c2, c3 | Gratis dirigido (100 canjes, 31 días) | `LANZAMIENTO-C1`, `-C2`, `-C3` | Lista de lanzamiento (abajo): conseguir las **30 primeras valoraciones** por curso |
| Día 1 | c1, c2, c3 | Gratis abierto (10 canjes, 5 días) | `PRIMEROS10-C1`… | Primer vídeo corto de cada curso |
| Desde el día 1, siempre activo | c1, c2, c3 | Precio propio, el mínimo que permita Udemy (≈ 12,99-14,99 €) | `NUMI-C1`, `NUMI-C2`, `NUMI-C3` | Web de Numimates, clase extra, vídeos cortos, boletín: **97 % para Moisés** |
| Cada mes | el que menos venda | Gratis dirigido | `MES-AAAAMM` | Reactivar valoraciones si bajan |
| Plan escuela de Numi Tech | — | Un mes de prueba para centros | `UDEMY26` | Aparece en la clase extra de c1 y c2 (Moisés confirma la oferta antes de publicar) |

Enlaces de cupón: `https://www.udemy.com/course/<slug>/?couponCode=<CÓDIGO>`; los `slug` salen al crear el curso
(propuestos en `cursos/c*.json`: `programacion-ninos-padres`, `robotica-microbit-maqueen`, `ia-autonomos-pymes`,
`bienestar-digital-familia`). La plantilla `guiones/c3/plantillas/enlaces-y-cupones.md` y los recursos de las clases extra
tienen marcadores `[ENLACE]`/`[CUPÓN]` que la tarea programada rellena cuando existan.

## 3. Las 30 primeras valoraciones (plan de 30 días por curso)

1. **Lista de lanzamiento** (Moisés la elige; nunca datos de alumnos o familias de Algorithmics, regla 7): contactos
   propios, docentes conocidos, AMPA con las que ya colabora Numi, asociaciones de autónomos de Lleida (curso 3),
   compañeros de Numi Tech que dan extraescolares (curso 2). Objetivo: 60-80 personas por curso (la mitad lo terminará).
2. **Mensaje** (borrador para pegar, no se envía solo):
   > «Hola, [nombre]. He publicado un curso en vídeo, [título], y te lo regalo esta semana con este enlace: [enlace con
   > cupón]. Solo te pido una cosa: si te resulta útil, deja una valoración sincera cuando lleves un par de clases. Las
   > tres primeras se ven en 20 minutos. ¡Gracias!»
3. **Recordatorio a los 7 días** solo a quien lo haya abierto (Udemy no da la lista: se pregunta en el mismo hilo).
4. **Medir:** valoraciones a los 30 días; si hay menos de 15, segundo cupón dirigido del mes con el mismo mensaje.
5. Nunca pedir 5 estrellas ni ofrecer nada a cambio de la valoración (va contra las normas de Udemy).

## 4. Vídeos cortos (plan de 12 semanas, 3 por semana)

Cada lección ya tiene voz, subtítulos y diapositivas: `pipeline/cortos.py` corta un fragmento de 30-60 s, lo pasa a
vertical 1080×1920 con los subtítulos grabados y una tarjeta final con el código de cupón. Los guiones (gancho de 2 s
+ fragmento + llamada) están en `marketing/cortos.json`; los primeros 10 ya montados en la entrega (`cortos/`).
Plataformas: TikTok, Instagram Reels y YouTube Shorts de la marca Numi (cuentas a nombre de Moisés). **Publicar solo
con su aprobación.**

| # | Curso | Gancho | Fragmento |
|---|---|---|---|
| 1 | c1 | «Tu hijo puede aprender a programar sin pantalla. Así:» | c1-01, juego de hacer de robot |
| 2 | c1 | «¿Por qué tu hijo se enfada cuando programa? Es buena señal» | c1-25 |
| 3 | c1 | «La frase que nunca debes decirle cuando se atasca» | c1-26 |
| 4 | c1 | «Un bucle explicado con unos calcetines» | c1-11 |
| 5 | c2 | «Este robot se para solo antes de chocar» | c2-14, demo del simulador |
| 6 | c2 | «El error que hace chocar a todos los robots» | c2-14, comparar |
| 7 | c2 | «Qué robot comprar para una extraescolar (y cuál no)» | c2-03 |
| 8 | c3 | «Responde así a una reseña de una estrella» | c3-01 |
| 9 | c3 | «Verifactu en 60 segundos: tu fecha» | c3-20 |
| 10 | c3 | «Lo que nunca debes pegar en ChatGPT» | c3-23 |
| 11 | c4 | «Tres ajustes del móvil de tu hijo que puedes hacer hoy» | c4-07 |
| 12 | c4 | «Cómo saber si una imagen está hecha con IA» | c4-04 |

## 5. Páginas SEO (20) para la web de Numimates

`marketing/seo/*.md`: 20 artículos generados de las clases (uno por clase con más búsqueda), con título, descripción
meta, el texto de la clase convertido en artículo y una llamada al curso con el cupón propio. Pensados para
`numimates.com/es/blog/` (o como descripción de los vídeos cortos en YouTube). Moisés decide si se publican; la web es
estática y bastaría con añadirlos a `numimates-web`.

## 6. Comunidades (para compartir, nunca sin aprobación)

- Grupos de Facebook de madres y padres por provincia y de educación en casa; grupos de AMPA de Cataluña y Aragón.
- Comunidades docentes: grupos de Telegram de profesorado de primaria y de tecnología, foros de micro:bit en español,
  la comunidad de Scratch en español (solo para compartir proyectos, no publicidad).
- Autónomos: asociaciones y cámaras de comercio de Lleida, foros de Infoautónomos, grupos de LinkedIn de pymes.
- Reddit: r/es, r/spain (solo si aporta, nunca anuncio).

## 7. Venta cruzada

- **Clase extra** de cada curso (c1-32, c2-38, c3-37, c4-08): siguiente paso natural + recursos con enlaces actualizados.
- **Numi Tech**: primera sesión gratis sin cuenta; plan escuela para centros con `UDEMY26`.
- **Cuadernos de KDP** (proyecto I): cuando estén publicados, la tarea programada añade los enlaces a los recursos de la
  clase extra y a las descripciones.
- **Siguiente curso propuesto:** «Matemáticas de primaria explicadas a los padres» (de Numi Mates y Numi Pro), mismo
  público que c1.

## 8. Expansión

Latinoamérica ya es el mayor mercado de Udemy en español: los cursos 1, 2 y 4 sirven tal cual (sin datos fiscales). El
curso 3 lleva datos de España: si vende, versión por país (México primero) cambiando solo la sección 5 y la 6. Después,
versión en inglés del curso 3 (`cursos/c3.json` + traducción de guiones; el montaje es el mismo).
