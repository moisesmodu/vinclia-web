# Juicio de cada idea y probabilidad de éxito a 6 meses

> Escrito el 24/10/2026. Horizonte: 6 meses (hasta finales de abril de 2027) y, como referencia, 12 meses. Las
> probabilidades son estimaciones razonadas de Claude a partir de la investigación de competencia, la ingeniería inversa
> de cada líder y la viabilidad con marketing; no son mediciones. Se revisan cada mes con datos reales del panel.

## 1. Qué cuenta como éxito a 6 meses

No "existir": tener tracción medible. Por tipo de proyecto:

| Tipo | Éxito a 6 meses |
|---|---|
| Suscripción o pago único (A, N, B, L, M, O) | Lanzado, con 50 clientes de pago o 300 €/mes, y una conversión medida |
| Cuentos (G) | 150 ventas en la campaña de Navidad y Reyes |
| Juegos | Un juego con lanzamiento completo en CrazyGames o Poki y 100 $/mes |
| Libros KDP (I) | 5 títulos publicados y 100 €/mes |
| Cursos (J) | 2 cursos publicados, 200 alumnos y 100 €/mes |
| Webs con AdSense (P) | 3 sitios publicados, AdSense aprobado y 20.000 páginas vistas al mes (los ingresos llegan después) |

## 2. Método

Para cada proyecto se estiman tres cosas: la probabilidad de estar lanzado con tracción a 6 meses, el ingreso mensual
típico si lo está, y su dispersión (los juegos tienen cola larga; los libros, poca). Con eso se simula la cartera
40.000 veces (método de Montecarlo) incluyendo dos riesgos comunes a todo: un 15 % de probabilidad de un choque que
reduzca todo a la mitad (un cambio de Google, meses sin tiempo de Moisés) y un 10 % de que no se lance nada porque las
cuentas (Stripe, Google Play, AdSense) no se abren. Ese 10 % es el riesgo real número uno: Vinclia se construyó y nunca
se lanzó por un teléfono de prueba.

## 3. Resultado de la simulación

| | 6 meses | 12 meses |
|---|---|---|
| Ingreso mensual mediano de la cartera | 500 € | 1.400 € |
| Rango central (del 25 % al 75 % de los casos) | 250 a 820 € | 760 a 2.200 € |
| Probabilidad de cubrir cuota y costes (350 €/mes) | 65 % | 87 % |
| **Probabilidad de llegar a 1.000 €/mes** | **17 %** | **66 %** |
| Probabilidad de 3.000 €/mes | menos del 1 % | 11 % |

Lectura honesta: **el objetivo de 1.000 €/mes a 6 meses es improbable (1 de cada 6)**; a 12 meses es probable (2 de
cada 3). Lo que sí es probable a 6 meses es cubrir la cuota de autónomo y los costes. La cartera funciona por
acumulación: ningún proyecto solo supera el 60 % de probabilidad de tracción, pero once apuestas con riesgos distintos
hacen muy improbable el cero (13 % de probabilidad de no cubrir ni 350 €/mes a 12 meses).

Aportación media esperada a 12 meses, de mayor a menor: CCSE 360 €, Oposiciones 300 €, Nuevo en España 170 €, Catalán
150 €, Juegos 140 €, Libros 120 €, Cursos 110 €, Webs 85 €, Exámenes 70 €, Cuentos 50 € (su pico es diciembre),
Lectura 50 €.

## 4. Juicio proyecto a proyecto

Formato: probabilidad de éxito a 6 meses · veredicto · por qué · criterio de parada (si se cumple, se para y se
reasigna el esfuerzo).

### A · CCSE nacionalidad — 55 % · ADELANTE, el primero
- **A favor:** demanda probada y recurrente (28.000 candidatos por convocatoria, mensual), contenido público, la app
  oficial está mal valorada y nadie explica en el idioma del candidato, se construye en una semana, garantía de
  devolución casi gratis con un 98 % de aptos.
- **En contra:** la app oficial es gratis; precio bajo (9,99 €) que no admite anuncios; las 300 preguntas son del
  Instituto Cervantes y hay que revisar el derecho de reproducción y actualizar cada año.
- **Parada:** si a los 3 meses de publicado hay menos de 20 ventas con más de 2.000 visitas al mes, el producto no
  convierte y se replantea el precio o el gancho.

### N · Nuevo en España — 40 % · ADELANTE CON CONDICIONES (después de A)
- **A favor:** un millón de personas renuevan su autorización entre abril y junio de 2027, justo en el mes 6; nadie les
  habla en su idioma con fuentes oficiales; se vende dentro de A.
- **En contra:** la disposición a pagar 4,99 €/mes por información que las ONG dan gratis es incierta; riesgo de
  parecer asesoramiento legal; exige mantenimiento continuo cuando cambia la norma.
- **Condición:** lanzar la guía de renovación en marzo de 2027 como producto único de 19,90 €, antes que la suscripción.
- **Parada:** si en la ola de renovación de 2027 no pasa de 100 ventas, se convierte en contenido gratuito de A y se
  explora la venta a ayuntamientos.

### B · Oposiciones de cola larga — 50 % · ADELANTE
- **A favor:** hueco real (nadie cubre Mossos, ayuntamientos ni ICS en catalán), disposición a pagar probada
  (OpositaTest cobra 15,99 €), 8.474 plazas anunciadas en 2026, el líder borra el historial al cancelar y nosotros no.
- **En contra:** la calidad de las preguntas es todo (un error legal destruye la confianza); ingresos estacionales
  por convocatoria; derechos de autor si se copian preguntas de academias.
- **Parada:** si a los 4 meses la conversión de prueba a pago es inferior al 3 % con más de 500 usuarios de prueba.

### L · Motor de exámenes — 25 % · APARCAR hasta que B tenga datos
- **A favor:** el DELE es mundial y el motor ya existirá; la PAU vende décimas, no aprobados.
- **En contra:** tres mercados distintos a la vez diluyen; el material del DELE tiene copyright; la corrección de oral y
  escrito es cara a 9,99 €.
- **Condición de arranque:** B con 100 suscriptores. Entonces, primero DELE A2 'nacionalidad' en inglés y árabe,
  enlazado con la marca Nuevo en España.

### M · Catalán con IA por voz — 35 % · ADELANTE CON CONDICIONES
- **A favor:** demanda récord (42.000 plazas del CPNL en un trimestre y grupos llenos), requisito en oposiciones y
  sanidad, nadie ofrece simulacro oral del C1 con rúbrica; pila abierta del BSC.
- **En contra:** la calidad de la voz y la corrección en catalán es el producto entero y es difícil; el modelo de voz
  Matxa es de uso no comercial; coste por usuario real; la Generalitat o el proyecto AINA podrían lanzar algo gratis.
- **Condición:** antes de la web, una prueba con 20 candidatos reales al C1 midiendo si la corrección coincide con la
  de un profesor. Si no coincide en el 80 % de los casos, se para.

### O · Lectura en voz alta — 20 % · APARCAR como investigación
- **A favor:** nadie lo hace en castellano y catalán para familias; preocupación pública por la lectura; canal escolar.
- **En contra:** el reconocimiento de voz infantil es el riesgo técnico más alto de la cartera; no hay corpus abierto en
  español ni catalán; privacidad de menores; Google o Microsoft pueden añadir catalán gratis. A 6 meses es casi
  imposible tener tracción; a 12 o 18, sí.
- **Plan:** beta gratuita en 5 escuelas a cambio de audio con consentimiento. Producto de pago solo en 2027-28.

### G · Cuentos personalizados — 35 % · ADELANTE SOLO SI EMPIEZA ESTA SEMANA
- **A favor:** regalo emocional con pico de Navidad, el PDF en minutos es un gancho que Wonderbly no tiene, catalán
  sin competencia real, coste de prueba mínimo.
- **En contra:** quedan tres semanas para el 15 de noviembre; el margen del impreso es fino hasta confirmar precios de
  imprenta; sin anuncios la primera Navidad depende de afiliados y vídeos; Aventopía ya ocupa la posición 'IA' en
  España.
- **Parada:** si el 31 de diciembre hay menos de 40 ventas, se mantiene en piloto automático para Sant Jordi y Reyes
  de 2028 sin más desarrollo.

### Juegos — 35 % · ADELANTE (barato, techo alto)
- **A favor:** la plataforma trae al jugador, un juego bueno paga todo el catálogo, Monkey Mart y Fisch demuestran que
  una o dos personas bastan; público de prueba en Algorithmics.
- **En contra:** lotería; CrazyGames rechaza clones; Roblox exige escalar si explota; la mediana de ingresos por
  desarrollador en Roblox fue de 1.575 $ en todo 2024.
- **Parada:** nunca por un juego; se revisa el catálogo a los 6 juegos: si ninguno pasa del lanzamiento básico, se
  cambia de género.

### I · Libros KDP — 60 % de publicar, 25 % de 100 €/mes · ADELANTE (sin expectativas)
- **A favor:** casi seguro que se publica; el nicho 'pensamiento computacional sin pantallas' está vacío en castellano
  y en catalán; se acumula sin mantenimiento.
- **En contra:** techo bajo (2 a 5 € por libro) y lento; Amazon.es tiene pocas reseñas en la categoría, señal de volumen
  moderado.
- **Parada:** no hace falta; si a los 6 meses vende menos de 20 libros al mes, se deja en piloto automático.

### J · Cursos Udemy — 60 % de publicar, 35 % de 100 €/mes · ADELANTE (sin expectativas)
- **A favor:** el nicho de 'IA para pequeños negocios' en español está desactualizado desde 2023; Udemy trae el
  tráfico; el curso para padres no existe.
- **En contra:** Udemy se queda el 63 % y cambia las reglas; ingreso por venta de 4 a 7 €; la voz sintética puede restar.
- **Parada:** no hace falta; se actualiza cada trimestre y se deja.

### P · Webs con AdSense — 45 % de tener 3 sitios y 20.000 páginas vistas · ADELANTE, cuanto antes
- **A favor:** el más pasivo; las calculadoras resisten a los resúmenes de IA; catalán sin oferta monetizada; el sitio
  de EE. UU. en español paga de 15 a 40 $ y abre las redes premium.
- **En contra:** el más lento (9 a 18 meses por dominio hasta 300 €/mes); dependencia total de Google; las redes premium
  se han cerrado al tráfico español; riesgo de 'contenido de poco valor' si se escala sin datos reales.
- **Por qué cuanto antes:** el reloj del posicionamiento empieza al publicar; cada mes de retraso es un mes de ingresos
  que se pierde en 2027.
- **Parada:** si a los 6 meses ningún sitio pasa de 5.000 páginas vistas al mes, se revisa el enfoque antes de abrir
  más dominios.

## 5. Juicio de la cartera entera

1. **Son demasiados proyectos para empezar a la vez.** Once frentes con una sola persona aprobando y abriendo cuentas
   es la receta para repetir Vinclia. El núcleo de arranque son cinco: **A, B, Juegos, P y G** (G solo si empieza esta
   semana). N entra tras A; I y J cuando haya un hueco porque no exigen nada; M tras su prueba; L y O, en 2027.
2. **El riesgo número uno no es el mercado, es la ejecución.** Ninguna cuenta está abierta todavía. Con Stripe, Google
   Play y AdSense abiertos esta semana, el 10 % de "no se lanza nada" desaparece y todas las probabilidades suben.
3. **Las ideas de mayor valor esperado son las que ya tienen demanda y precio probados** (A, B) y las que se acumulan
   solas (P, I, J, Juegos). Las de mayor riesgo técnico (O, M) deben demostrar la tecnología antes de construir producto.
4. **El objetivo de 1.000 €/mes es de 12 meses, no de 6.** Prometer otra cosa sería mentir. A 6 meses, el objetivo
   realista es cubrir la cuota y los costes (65 % de probabilidad) y tener 5 productos vivos con datos.
5. **La expansión internacional sube el techo, no la probabilidad.** Se aplica a lo que funcione a partir del mes 6.

## 6. Qué se revisa cada mes
Con los datos del panel: probabilidad actualizada por proyecto, aportación real frente a la esperada, y aplicación de
los criterios de parada. El primer repaso, el 24/11/2026.
