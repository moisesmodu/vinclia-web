# Tarea programada · Proyecto P

Hay dos tareas. Moisés las crea con un clic en claude.ai/code → Tareas programadas, con el repositorio
`moisesmodu/vinclia-web`. Nada se programa sin su visto bueno (CARTERA.md).

## Tarea 1 · Semanal (lunes, 7:40, hora de Madrid)

Frecuencia: `CRON_TZ=Europe/Madrid 40 7 * * 1`

```text
Eres el operador del proyecto P (webs de herramientas con AdSense) de la cartera de Moisés. Lee SESIONES.md,
proyectos/p-webs-adsense/README.md y proyectos/p-webs-adsense/MARKETING.md y cúmplelos. Trabaja en una rama
nueva desde claude/estrategia-ingresos-recurrentes-tx0rvw y abre un PR hacia esa rama al terminar.

1. Normativa (10 minutos). Busca en el BOE, el DOGC y los boletines autonómicos de la última semana cambios
   que afecten a params/es/<año>/laboral.json o fiscal.json (SMI, IPREM, bases y tipos de cotización, escalas
   autonómicas del IRPF, Verifactu, tramos de autónomos, topes del paro, interés de demora). Si hay alguno,
   actualiza el JSON con su fuente, quita "provisional" de lo ya publicado, añade una prueba en
   fabrica/tests/motores.test.ts y apunta el cambio en el registro del README.
2. 20 páginas nuevas con datos. Toma de fabrica/sitios/<sitio>/palabras-clave.csv las filas con
   tipo_destino=nueva y prioridad más alta que aún no existan. Prioriza las que Search Console muestre con
   impresiones y sin página propia. Créalas añadiendo filas a los CSV de fabrica/sitios/<sitio>/programaticas/
   o una plantilla nueva en fabrica/src/plantillas si hace falta. Reglas: cada página debe traer una tabla o un
   cálculo que cambie de verdad respecto a las demás; nada de texto de relleno; si una variante no aporta
   datos distintos, no se crea. Reparte unas 10 por sitio activo, en castellano y catalán.
3. Calidad. En fabrica/: npm ci, npm test, npm run build:todos, npm run comprobar y
   node scripts/lighthouse.mjs. No publiques si algo falla o si Lighthouse móvil baja de 95. Revisa a mano
   (lee el HTML generado) 2 de las páginas nuevas, que es el 10 % de muestra.
4. Search Console. Si el conector está disponible, saca por sitio clics, impresiones, CTR, posición media,
   las 20 consultas con más impresiones y las páginas con impresiones y sin clics. Si no lo está, comprueba la
   indexación con búsquedas site: y dilo en el informe.
5. Panel. Actualiza en panel/data/proyectos.json el proyecto p-webs-adsense: acciones (fecha y qué),
   ingresosMes (si Moisés ha pasado la cifra de AdSense), hallazgos y próximos.
6. Informe. Abre el PR con un informe de no más de 15 líneas: cambios normativos, páginas nuevas con su URL,
   métricas de Search Console frente a la semana anterior, resultado de Lighthouse y lo que necesitas de Moisés
   (máximo 1 cosa). No publiques nada fuera del repositorio ni escribas a terceros.
```

## Tarea 2 · Siguiente sitio del catálogo (cada 6 a 8 semanas)

Frecuencia: `CRON_TZ=Europe/Madrid 22 10 1 * *` (el día 1 de cada mes). La propia tarea decide si toca: solo
construye si han pasado al menos 6 semanas desde el último sitio publicado.

```text
Eres el constructor del proyecto P. Lee SESIONES.md, VIABILIDAD.md («Catálogo de sitios del proyecto P»),
proyectos/p-webs-adsense/README.md (fichas de los sitios 3 a 7) y panel/data/proyectos.json (p-webs-adsense).
Mira en git log y en las acciones del panel la fecha del último sitio nuevo: si han pasado menos de 6 semanas,
termina sin cambios. Si no, construye con la fábrica (proyectos/p-webs-adsense/fabrica) el siguiente sitio del
catálogo que aún no exista en fabrica/sitios/, en el orden 3 → 4 → 5 → 6 → 7.

Pasos: parámetros por país y año en params/<pais>/<año>/ con fuente oficial por bloque; sitios/<id>/sitio.json
con marca y colores propios; mínimo 20 calculadoras con texto en los idiomas del sitio (método publicado,
fuentes oficiales, fecha y autor); 10 fichas de datos citables; 1 o 2 colecciones programáticas con CSV;
palabras-clave.csv con 200 filas; pruebas de cálculo; Lighthouse móvil ≥ 95 en la muestra.

Antes de empezar, comprueba la regla de parada de JUICIO.md: si ningún sitio pasa de 5.000 páginas vistas al
mes a los 6 meses del primero, no construyas y escribe el informe explicando por qué. Añade 3 dominios
propuestos a PARA-MOISES.md (nada se compra sin él) y abre un PR hacia
claude/estrategia-ingresos-recurrentes-tx0rvw.
```
