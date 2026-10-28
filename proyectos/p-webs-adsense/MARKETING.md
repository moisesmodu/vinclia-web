# Marketing · Proyecto P (solo SEO)

Moisés lo ha fijado así: **solo SEO y nunca anuncios de pago**. Pagar tráfico para un sitio que vive de la publicidad
pierde dinero (VIABILIDAD.md). Por eso no hay guiones de vídeo, ficha de Google Play ni redes, a diferencia de los
demás proyectos de la cartera.

## 1. Lo que ya está hecho

| | NetoClaro (nómina) | ImpuestoClaro (impuestos) |
|---|---|---|
| Calculadoras con texto propio, en castellano y catalán | 20 × 2 | 20 × 2 |
| Fichas de datos citables con CSV descargable | 10 × 2 | 10 × 2 |
| Páginas programáticas con datos que cambian por fila | 146 | 92 |
| Mapa de palabras clave | 200 (`fabrica/sitios/nomina/palabras-clave.csv`) | 200 (`fabrica/sitios/impuestos/palabras-clave.csv`) |
| Lighthouse móvil, muestra de 8 páginas | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

SEO técnico incluido en la fábrica:

- **Indexación:**
  - canónica por página;
  - `hreflang` es/ca/x-default en la cabecera y en el `sitemap.xml`;
  - `robots.txt`;
  - URL cortas con la palabra clave (`/calculadora-finiquito/`, `/ca/calculadora-quitanca/`).
- **Datos estructurados:**
  - `WebApplication`, `FAQPage` y `BreadcrumbList` en cada calculadora;
  - `Dataset` con descarga CSV y licencia CC BY 4.0 en las fichas;
  - `WebSite`, `Organization` y `AboutPage`.
- **Señales de confianza en temas de dinero:** autor con nombre, página de método, fuentes oficiales enlazadas,
  fecha de actualización, aviso de parámetros provisionales y declaración del uso de IA.
- **Resultado visible sin JavaScript:** el ejemplo calculado viene en el HTML, así que Google ve una cifra real.

## 2. Mapas de palabras clave (200 por sitio)

Columnas de cada CSV:

- `palabra_clave` e `idioma`;
- `intencion`: calcular, tabla, plazo, comprobar o comparar;
- `ruta_destino` y `tipo_destino`: calc, ficha, prog o nueva;
- `prioridad`;
- `grupo`;
- `enlaza_desde`: la página que debe enlazar al destino.

| | NetoClaro | ImpuestoClaro |
|---|---|---|
| Castellano / catalán | 130 / 70 | 127 / 73 |
| Ya cubiertas por una página | 144 | 146 |
| Cola de páginas nuevas para la tarea semanal | 56 | 54 |

Todas tienen intención de uso, no informativa. Es la búsqueda que los resúmenes de IA de Google no se quedan.

Las prioridades se asignaron por criterio, porque no hay herramienta de volúmenes de pago. Tienen en cuenta la
estacionalidad: pagas extra en junio y diciembre, renta de abril a junio, cambios de enero. Search Console las
corrige desde la primera semana con datos.

## 3. Enlazado interno (implementado)

- **Calculadora → calculadora:** 6 hermanas en el bloque «Otras calculadoras».
- **Calculadora → fichas:** las fichas de datos de su tema.
- **Calculadora → programáticas:** hasta 24 páginas de su colección. Por ejemplo, sueldo neto enlaza a «sueldo neto
  de 30.000 € brutos» y a «sueldo neto en Cataluña».
- **Programática → calculadora:** un botón «Calcula tu caso» abre la calculadora con los datos de la fila ya
  rellenados (`?bruto=30000`).
- **Programática → programática:** los 4 vecinos de la serie (28.000, 29.000, 31.000, 32.000 €) y las 15 comunidades
  restantes.
- **Ficha → calculadora** y **portada → todo**, con migas de pan en cada página.
- **Idioma:** cada página enlaza a su versión en el otro idioma.
- **Pendiente:** la columna `enlaza_desde` del CSV marca qué página existente debe enlazar a cada página nueva. La
  tarea semanal la aplica al crearlas.

## 4. Las 10 fichas «citables» de cada sitio

Son tablas con datos oficiales o calculadas con el motor, cada una con su CSV, una caja «Cómo citar estos datos» y
licencia CC BY 4.0. Son el activo para conseguir enlaces.

**NetoClaro** (bajo `/datos/`):

1. Evolución del salario mínimo de 2000 a 2026, con el real decreto de cada año.
2. Tabla de bruto a neto, de 15.000 a 100.000 €.
3. Bases mínimas y máxima de cotización por grupo.
4. Tipos de cotización de 2026 frente a 2027, solidaridad incluida.
5. Tramos de la cuota de autónomos.
6. Cuantías y duración del paro.
7. IPREM de 2004 a 2026.
8. Calendario de la edad de jubilación de 2013 a 2027.
9. Indemnización por despido de 1 a 30 años de antigüedad.
10. Retención de IRPF según salario e hijos.

**ImpuestoClaro** (bajo `/datos/`):

1. Escalas autonómicas del IRPF.
2. IRPF por comunidad y salario.
3. Tipo marginal por comunidad.
4. Calendario fiscal de 2027.
5. Tipos de IVA con ejemplos.
6. Escala del ahorro.
7. Tipos fijos de retención.
8. Interés legal y de demora desde 2015.
9. Dietas exentas y kilometraje.
10. Mínimo personal y familiar por comunidad.

## 5. Conseguir enlaces (preparado; nada se envía sin aprobación de Moisés)

Destinatarios naturales de las fichas:

| Destinatario | Qué les sirve | Canal |
|---|---|---|
| Gestorías y asesorías laborales de Lleida y Cataluña con blog | Tabla de bruto a neto, calendario fiscal 2027, tramos de autónomos | Correo al responsable del blog |
| Colegios de graduados sociales (Lleida, Barcelona) y de economistas | Calculadoras en catalán, escalas autonómicas | Correo a comunicación |
| Medios locales (Segre, La Mañana, Diari Ara, El Periódico en catalán) | Datos nuevos cada enero: SMI, cuota de autónomos, IRPF por comunidad | Nota con la tabla del año |
| Sindicatos y asociaciones de autónomos (UPTA, ATA, Pimec) | Cuota de autónomos, tarifa plana, Verifactu | Formulario de contacto |
| Webs municipales y servicios de empleo locales | Paro, subsidio, finiquito en catalán | Correo al servicio de promoción económica |
| Profesores de FOL y de economía de la empresa | Fichas con CSV para clase | Correo o foros docentes |

Plantilla de correo en castellano (para la versión catalana se cambia el idioma, no la estructura):

> Asunto: Tabla de [dato] 2027 con fuente oficial, libre para citar
>
> Hola, [nombre]. He publicado una tabla de [dato] actualizada con el [norma/BOE], descargable en CSV y con licencia
> libre citando la fuente: [URL]. Si os sirve para [vuestro artículo / la web del colegio], podéis enlazarla o
> descargarla. Cualquier error que veáis lo corrijo el mismo día.
> Moisés Mora · [sitio]

Ritmo: 5 correos al mes por sitio, preparados por la tarea semanal en una carpeta para que Moisés los apruebe.
Nunca intercambio de enlaces, compra de enlaces ni artículos patrocinados, porque Google los penaliza.

## 6. Calendario de contenido

| Mes | Qué se publica o actualiza |
|---|---|
| Diciembre | Calendario fiscal del año siguiente, paga de Navidad, previsión de SMI y cuotas |
| Enero | SMI, bases y tipos de cotización, cuota de autónomos, escalas autonómicas nuevas, modelos del 4T |
| Marzo–junio | Renta: obligación de declarar, IRPF por comunidad, deducciones |
| Junio–julio | Paga de verano, vacaciones, finiquitos de fin de temporada |
| Septiembre–octubre | Presupuestos autonómicos, Verifactu, cambios del año siguiente |

## 7. Cómo se mide

Cada semana, con Search Console cuando esté conectada, se miden clics, impresiones, CTR, posición y las páginas con
impresiones sin clics, que son las primeras candidatas a mejorar. Umami da las páginas vistas por calculadora.

Objetivo y regla de parada (JUICIO.md): 20.000 páginas vistas al mes entre los sitios en 6 meses. Si ningún sitio
pasa de 5.000, se revisa antes de abrir más dominios.
