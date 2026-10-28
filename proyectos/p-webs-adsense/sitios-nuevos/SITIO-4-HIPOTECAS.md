# Sitio 4 · Vivienda e hipoteca (España, es/ca) · PisoClaro

Ficha completa para abrir el sitio con la fábrica (`fabrica/`), sin tocar el código existente. Datos buscados el 28/10/2026.

Archivos que acompañan esta ficha:

- `params-es-2026-vivienda.json`: los parámetros legales. Cada bloque lleva `fuente` y `verificado`.
- `palabras-clave-sitio-4.csv`: 200 palabras clave, 131 en castellano y 69 en catalán, con el formato de `fabrica/sitios/nomina/palabras-clave.csv`.

> **Aviso de verificación.** Desde la sesión no se podían abrir boe.es, bde.es, ine.es ni las sedes autonómicas: WebFetch no resuelve esos dominios. Todas las cifras salen de resultados de búsqueda que citan esas fuentes.
>
> - `verificado: true`: la cifra coincide en la fuente oficial citada o en dos fuentes independientes que citan la norma.
> - `verificado: false`: falta cotejarla.
>
> Ninguna cifra con `false` se publica sin pasar antes por la tarea semanal.

---

## 1. Marca

| | |
|---|---|
| **Nombre recomendado** | **PisoClaro** |
| Alternativas | HipotecaClara (la propuesta), CasaClara |
| Por qué no HipotecaClara | Existe un curso de pago «Método Hipoteca Clara» en Hotmart, lo que crea riesgo de confusión. Además, rompe el patrón masculino de la familia (Neto**Claro**, Impuesto**Claro**). «Hipoteca» deja fuera la compraventa, la plusvalía y el alquiler, que son la mitad del sitio. |
| Por qué PisoClaro | En las búsquedas no aparece ninguna empresa, web ni marca con ese nombre en España. Mantiene el apellido «Claro» y «piso» es como se dice en España. Cubre compra, hipoteca, venta y alquiler. Se lee igual en catalán («pis» y «piso» se entienden). |
| Comprobación de marcas | **No hecha en OEPM ni EUIPO** (no hay acceso). Hay que buscar «PisoClaro» en las clases 36 (servicios financieros e inmobiliarios) y 42 antes de comprar el dominio. Nota: el grupo sueco **Clar** compró el bróker hipotecario Finteca en España, así que conviene no acortar nunca la marca a «Clar». |
| Promesa (es) | «Lo que cuesta tu casa, con números claros.» |
| Promesa (ca) | «El que costa casa teva, amb números clars.» |
| Lema (es) | «Calculadoras de hipoteca, compraventa y alquiler con datos oficiales» |
| Lema (ca) | «Calculadores d’hipoteca, compravenda i lloguer amb dades oficials» |
| `marcaClaro.partes` | `["Piso", "Claro"]` |
| Sello | El de la familia: «Hecho en Lleida · Números claros» |

### Dominios .es candidatos, por orden

1. `pisoclaro.es`
2. `hipotecaclara.es`
3. `casaclara.es`

**No se ha podido comprobar la disponibilidad** (no hay acceso a whois ni a dominios.es). Hay que comprobarla en el registrador antes de fijar la marca. Si `pisoclaro.es` está cogido, la marca pasa a la siguiente opción libre y se cambia `marcaClaro.partes`.

### Colores (bloque `colores` de `sitio.json`)

Teal azulado propio, distinto del verde de NetoClaro (`#0E9F6E`) y del teal de ImpuestoClaro (`#14A38B`). Contrastes calculados con la fórmula WCAG:

```json
"colores": {
  "primario": "#0A6E80",
  "primarioOscuro": "#085766",
  "marca": "#0E98B0",
  "acento": "#FFD166",
  "cabecera": "#0B1F17",
  "fondo": "#FFFFFF",
  "tenue": "#F0F7F8",
  "superficie": "#FFFFFF",
  "tinta": "#0B1F17",
  "suave": "#4A5A5E",
  "borde": "#D6E5E8"
}
```

| Uso | Color | Contraste |
|---|---|---|
| Logotipo sobre la cabecera tinta | `#0E98B0` | 5,02:1 |
| Texto y enlaces sobre blanco | `#0A6E80` | 5,91:1 (pasa AA) |

Es el mismo patrón que los sitios 1 y 2: el color de marca no pasa AA sobre blanco (3,42:1) y por eso no se usa para texto.

---

## 2. Público y calendario

- **Público:** compradores de primera vivienda (25–40 años), hipotecados con tipo variable, vendedores (plusvalía y IRPF), propietarios que alquilan e inquilinos. Toda España, con foco en Cataluña, la Comunitat Valenciana, Madrid, Andalucía y Baleares. El catalán cubre Cataluña, la Comunitat Valenciana y Baleares.
- **Picos:**
  - cada día 1–3 de mes, con el Euríbor del mes anterior;
  - cada mes con el IRAV;
  - enero, por los cambios de ITP y los coeficientes de plusvalía;
  - primavera, por las compraventas;
  - abril–junio, por la renta (venta de vivienda y deducción).
- **Momento actual (octubre de 2026):**
  - el Euríbor está en máximos del año: 3,247 % de media en septiembre, sin verificar en el BOE;
  - el BCE subió los tipos en junio y en septiembre;
  - el RDL 29/2026 cambia la plusvalía desde el 1/12/2026 y crea deducciones y exenciones, pero está pendiente de convalidación;
  - la Comunitat Valenciana bajó el ITP al 9 % el 1/6/2026.

  Son ganchos de actualidad reales para el lanzamiento.

---

## 3. Las 20 calculadoras

Para todas:

- motor nuevo en `src/lib/calc/vivienda.ts`, sin cifras dentro;
- parámetros en `params/es/<año>/vivienda.json`, a partir de `params-es-2026-vivienda.json`;
- definición en `src/calculadoras/<id>.ts`.

Las rutas son las del CSV de palabras clave.

| # | id | Título es / ca | Qué calcula | Fórmula o método | Parámetros legales (fuente · valor 2026 · verificado) | Afiliación que encaja |
|---|---|---|---|---|---|---|
| 1 | `simulador-hipoteca` | Simulador de hipoteca / Simulador d’hipoteca | Cuota mensual, intereses totales y coste total; modo fijo, variable (Euríbor + diferencial) y mixto (X años fijo y luego variable) | Sistema francés: `C = P·i / (1 − (1+i)^−n)`, con `i = TIN/12` y `n` el número de meses. En el mixto se recalcula al final del tramo fijo con el capital pendiente. | Euríbor 12 m (BdE/BOE): 2,954 % en agosto ✔, 3,247 % en septiembre ✘. Valor por defecto: hipoteca media del INE de julio de 2026 (180.785 €, 26 años, 3,01 %) ✔ | Bróker hipotecario con licencia del Banco de España (programa de hipotecas.me: 30 % de sus honorarios; H2B Hipotecas en Awin). CPL de bancos (ING Hipotecas en Kwanko, condiciones sin confirmar) |
| 2 | `revision-hipoteca-euribor` | Revisión de la hipoteca con el Euríbor / Revisió de la hipoteca amb l’Euríbor | Nueva cuota tras la revisión anual o semestral y diferencia mensual y anual | La misma fórmula con capital pendiente, plazo restante y `TIN = Euríbor del mes de revisión + diferencial` (el contrato fija qué mes: normalmente dos meses antes) | Serie mensual del Euríbor (BdE) ✔/✘ por mes; IRPH Entidades: pendiente (null) | Bróker (cambio a tipo fijo); comparador de hipotecas |
| 3 | `hipoteca-fija-o-variable` | ¿Hipoteca fija o variable? / Hipoteca fixa o variable? | Coste total de una oferta fija frente a una variable en tres escenarios de Euríbor (constante, +1 punto, −1 punto) y Euríbor de equilibrio | Simulación mes a mes con revisión anual. El Euríbor de equilibrio se busca por bisección. | Euríbor actual (BdE). Tipos iniciales medios del INE: fijo 3,03 % y variable 2,97 % (julio de 2026) ✔ | Bróker |
| 4 | `cuanta-hipoteca-puedo-pedir` | ¿Cuánta hipoteca puedo pedir? / Quanta hipoteca puc demanar? | Préstamo máximo y precio máximo de vivienda según ingresos netos, deudas y ahorro | `cuota_max = ingresos_netos × esfuerzo − otras_deudas`; `P = cuota_max · (1 − (1+i)^−n) / i`. El precio máximo es el menor de `P / 0,8` y `P + ahorro − gastos de compra`. | **No hay norma.** El 35 % de esfuerzo y el 80 % de financiación son práctica bancaria. Se rotulan como «criterio de la mayoría de bancos», son editables y no se atribuyen al BdE ✘ | Bróker (es el lead de más intención) |
| 5 | `ahorro-entrada-piso` | Ahorro para la entrada del piso / Estalvi per a l’entrada del pis | Cuánto dinero hace falta el día de la firma: entrada más impuestos más gastos | `entrada = precio × (1 − financiación)` + ITP o IVA+AJD + notaría + registro + gestoría + tasación | Usa los de las calculadoras 6 a 9. Gestoría y tasación tienen precio libre: el usuario los introduce ✘ | Bróker; cuenta remunerada para ahorrar la entrada |
| 6 | `gastos-compraventa` | Gastos de compraventa de vivienda / Despeses de compravenda d’habitatge | Desglose completo por comunidad, vivienda nueva o usada, con tipos reducidos | Suma de las calculadoras 7, 8 y 9 más gestoría y tasación. Los gastos de la escritura de hipoteca no se suman porque los paga el banco (Ley 5/2019, art. 14.1.e). | ITP o AJD por comunidad (ver 7 y 8); aranceles (ver 9); reparto de gastos según la Ley 5/2019 ✘ | Bróker; seguro de hogar |
| 7 | `itp-vivienda` | ITP de vivienda de segunda mano / ITP d’habitatge de segona mà | Cuota de ITP con el tipo general o la escala, más los tipos reducidos si se cumplen los requisitos | `cuota = base × tipo`. Las escalas son progresivas por tramos. La base es el mayor entre el precio y el valor de referencia de Catastro. | Madrid 6 % ✔; Andalucía 7 % ✔; Cataluña 10/11/12/13 % por tramos de 600.000 / 900.000 / 1.500.000 € (DL 5/2025) ✔; Comunitat Valenciana 9 % desde el 1/6/2026 (antes 10 %) ✔; Canarias 6,5 % ✘; Cantabria 9 % ✘; Castilla-La Mancha 9 % ✘; Castilla y León 8 % ✘; Murcia 7,75 % ✘; La Rioja 7 % ✘; Galicia 8 % ✘; Aragón, Asturias, Baleares y Extremadura por escala ✘; Navarra 6 % y País Vasco 4 % (forales) ✘ | Bróker |
| 8 | `iva-ajd-obra-nueva` | IVA y AJD de vivienda nueva / IVA i AJD d’habitatge nou | Impuestos de la primera transmisión | `IVA = precio × 10 %` (4 % en VPO de régimen especial); `AJD = precio × tipo autonómico`. En Canarias, IGIC. | IVA del 10 %, art. 91.Uno.1.7.º LIVA ✔; 4 %, art. 91.Dos.1.6.º ✘. AJD: Madrid 0,75 % ✔, Andalucía 1,2 % ✔, Cataluña 1,5 % ✔, Comunitat Valenciana 1,4 % desde el 1/6/2026 ✔, Navarra 0,5 % ✘, Baleares 1,5 % (2 % desde 1 M€) ✘, resto pendiente. IGIC: 5 % o 7 % según la fuente ✘ | Bróker; promotoras (sin programa localizado) |
| 9 | `notaria-registro` | Notaría y registro de la compraventa / Notaria i registre de la compravenda | Arancel notarial y registral de la escritura de compraventa, más IVA | Escalas acumulativas: notaría, RD 1426/1989, anexo I, n.º 2, con 5 % de rebaja; registro, RD 1427/1989, n.º 2 | Notaría: hasta 6.010,12 € fijo 90,15 €; después 4,5 ‰, 1,5 ‰, 1 ‰, 0,5 ‰ y 0,3 ‰ (hasta 6.010.121,04 €) ✔. Registro: 24,04 € fijo; 1,75 ‰, 1,25 ‰ y 0,75 ‰ ✔; desde 150.253,04 €, 0,5 ‰ y 0,4 ‰ ✘. Copias, folios y gestoría: precio libre ✘ | — (solo AdSense) |
| 10 | `tabla-amortizacion` | Tabla de amortización de la hipoteca / Taula d’amortització de la hipoteca | Cuadro mes a mes y año a año: cuota, intereses, capital y pendiente. Descargable en CSV. | Sistema francés iterativo | Ninguno legal | Bróker |
| 11 | `amortizacion-anticipada` | Amortización anticipada: cuota o plazo / Amortització anticipada: quota o termini | Ahorro de intereses al reducir cuota o plazo, comisión aplicable y nueva cuota o nuevo plazo | Recalcula con el nuevo capital. Plazo: `n = −ln(1 − P·i/C) / ln(1+i)`. Comisión = `min(tope × importe, pérdida financiera)`. | Ley 5/2019, art. 23 ✔. Variable: 0,25 % los 3 primeros años **o** 0,15 % los 5 primeros (según el contrato) y 0 % después. Fija: 2 % los 10 primeros años y 1,5 % después. Solo préstamos desde el 16/6/2019. | Bróker; productos de ahorro e inversión (con cuidado: YMYL) |
| 12 | `cambiar-hipoteca-de-banco` | ¿Compensa cambiar la hipoteca de banco? / Surt a compte canviar la hipoteca de banc? | Ahorro neto de una subrogación o novación: diferencia de cuotas menos comisiones, tasación y registro | Valor actual de la diferencia de cuotas frente a los costes. Registro de la subrogación: n.º 2 con 90 % de reducción sobre el capital pendiente. | Ley 5/2019, art. 23 ✔; reducción registral del 90 % ✔ (en resultados); comisión de novación de variable a fija: fuentes discrepantes (0,05 % o 0,15 %) ✘, no se usa | Bróker (subrogación) |
| 13 | `tae-hipoteca` | TAE de la hipoteca con vinculaciones / TAE de la hipoteca amb vinculacions | TAE real con seguros y nómina vinculados; compara la oferta bonificada con la no bonificada | TAE por iteración (Newton) sobre los flujos del préstamo: capital menos gastos a cargo del cliente frente a cuotas más primas | Metodología del anexo de la Orden EHA/2899/2011, por cotejar ✘ | Bróker; comparador de seguros de vida y hogar |
| 14 | `plusvalia-municipal` | Plusvalía municipal (objetiva y real) / Plusvàlua municipal (objectiva i real) | Cuota por los dos métodos y cuál conviene; exención si no hay ganancia | Objetivo: `VC_suelo × coef(años) × tipo`. Real: `(venta − compra) × VC_suelo / VC_total × tipo`. Se elige el menor; 0 si hay pérdida (RDL 26/2021). | Tipo máximo 30 % (art. 108.4 TRLRHL) ✔. Coeficientes vigentes: columna 2024 del RDL 8/2023 (el RDL 16/2025 se derogó el 27/1/2026), de 0,15 (menos de 1 año) a 0,40 (20 años o más) ✘ (parcial). **Desde el 1/12/2026**, RDL 29/2026: 20+ años 0,30; 9 años 0,25; 10 años 0,22; 14–17 años 0,11; resto pendiente; solo si se convalida ✘. Tipo municipal: CSV por ordenanza. | Gestoría o asesoría fiscal; tasación |
| 15 | `ganancia-venta-vivienda` | IRPF por vender tu vivienda / IRPF per vendre el teu habitatge | Ganancia patrimonial y cuota de IRPF del ahorro; exenciones por reinversión y por ser mayor de 65 | `ganancia = venta − gastos de venta − (compra + gastos e impuestos de compra)`, aplicada a la escala del ahorro | Escala del ahorro de `fabrica/params/es/2026/fiscal.json`. Arts. 38.1 y 33.4.b LIRPF. Exención del RDL 29/2026 para ventas del 8/10/2026 al 31/12/2027: requisitos sin confirmar; se muestra solo como aviso ✘ | Asesoría fiscal; enlace a ImpuestoClaro (sitio 2) |
| 16 | `deduccion-vivienda-habitual` | Deducción por vivienda habitual (régimen transitorio) / Deducció per habitatge habitual (règim transitori) | Deducción anual de quien compró antes de 2013 | `15 % × min(pagado en el año, 9.040 €)` = máximo 1.356 € | LIRPF, DT 18.ª: 15 %, 9.040 € y 1.356 € ✔ | Enlace a ImpuestoClaro |
| 17 | `ibi` | IBI de tu vivienda / IBI del teu habitatge | Cuota anual del IBI y prorrateo entre comprador y vendedor | `cuota = base liquidable × tipo municipal`; prorrateo por días | Horquilla del art. 72 TRLRHL para urbana, 0,4–1,10 % ✘. Tipos por municipio: tabla anual de Catastro (CSV por crear) | Seguro de hogar |
| 18 | `subida-alquiler` | Subida del alquiler (IRAV o IPC) / Pujada del lloguer (IRAV o IPC) | Nueva renta según el índice del contrato | `renta × (1 + índice)`. Contratos desde el 26/5/2023 con cláusula de índice: IRAV. Contratos anteriores: lo que diga el contrato. | IRAV (INE): septiembre de 2026 2,54 %, agosto 2,47 %, julio 2,49 % ✘ (cifras de prensa) | Seguro de impago de alquiler |
| 19 | `rentabilidad-alquiler` | Rentabilidad del alquiler / Rendibilitat del lloguer | Rentabilidad bruta, neta y después de IRPF de un piso en alquiler | `bruta = renta anual / precio total`; `neta = (renta − IBI − comunidad − seguro − mantenimiento − intereses − amortización del 3 % del valor de construcción) / inversión` | Reducción por arrendamiento de vivienda (art. 23.2 LIRPF): el RDL 29/2026 la cambia para contratos desde el 1/12/2026. Se piden los porcentajes antes de publicar ✘ | Seguro de impago; gestión de alquiler |
| 20 | `alquilar-o-comprar` | ¿Alquilar o comprar? / Llogar o comprar? | Patrimonio a N años en los dos caminos | Comprar: entrada + gastos + cuotas + IBI + mantenimiento − revalorización. Alquilar: rentas con IRAV + rendimiento del ahorro no invertido. Las hipótesis son editables. | Usa las calculadoras 1, 6, 17 y 18. Revalorización y rentabilidad del ahorro: hipótesis del usuario, sin valor por defecto «oficial» | Bróker |

`✔` = `verificado: true` en el JSON; `✘` = `false`. Si el JSON tiene `null`, la calculadora pide el dato o no se publica.

### Ejemplos de comprobación para `tests/`

Calculados con los motores descritos.

| Caso | Datos | Resultado |
|---|---|---|
| Cuota | 150.000 € a 30 años al 3,01 % | 633,22 €/mes; 77.957,52 € de intereses |
| Cuota | 200.000 € a 30 años al 3,01 % | 844,29 €/mes |
| Hipoteca media del INE (julio de 2026) | 180.785 € a 26 años al 3,01 % | 836,14 €/mes |
| Revisión | 150.000 € pendientes, 25 años, diferencial 0,60 | Con el Euríbor de septiembre de 2026 (3,247 %): 779,14 €. Con el de septiembre de 2025 (2,172 %): 693,66 € (+85,48 €/mes). Usa dos cifras sin verificar. |
| Notaría | Compraventa de 200.000 € | Escala: 358,44 €; con la rebaja del 5 %: 340,51 € (sin IVA, copias ni folios) |
| Registro | Compraventa de 200.000 € | 196,16 € (depende del tramo del 0,5 ‰, sin verificar) |

---

## 4. Páginas programáticas

Regla común: una fila solo se publica si trae un dato propio y verificable (tipo, importe o fecha). Plantillas nuevas en `src/plantillas/`; los CSV van en `sitios/vivienda/programaticas/`.

| Colección | Slug es / ca | CSV y columnas | Filas | Dato que cambia por fila | Calculadora que abre |
|---|---|---|---|---|---|
| Gastos de compra por comunidad (incluye el ITP) | `gastos-compra-vivienda-{slug_es}` / `despeses-compra-habitatge-{slug_ca}` | `comunidades-vivienda.csv`: código, nombre es/ca, ITP general o escala, reducidos con requisitos, AJD, ejemplo de 150.000/200.000/300.000 €, URL de la norma, `verificado` | 19 (País Vasco y Navarra marcadas como forales) | Tipos, requisitos y ejemplo calculado | `gastos-compraventa?ca=MD` |
| Cuota por importe y plazo | `hipoteca-{importe}-euros-{anos}-anos` / `hipoteca-{importe}-euros-{anys}-anys` | `hipoteca-importe.csv`: importe y plazo | 14 importes (80.000–400.000 €) × 3 plazos (20/25/30) = 42 | Cuota con el Euríbor del mes y con el tipo fijo medio del INE, intereses totales y tabla anual | `simulador-hipoteca?p=…&a=…` |
| Sueldo necesario para una hipoteca | `sueldo-para-hipoteca-{importe}-euros` / `sou-per-hipoteca-{importe}-euros` | `sueldo-hipoteca.csv` | 12 (100.000–400.000 €) | Ingreso neto mínimo al 30/35/40 %, con plazos de 25 y 30 años | `cuanta-hipoteca-puedo-pedir` |
| Revisión con el Euríbor del mes | `revision-hipoteca-euribor-{mes}-{anio}` / `revisio-hipoteca-euribor-{mes}-{any}` | `euribor-mensual.csv` (script mensual) | 1 nueva al mes; se conservan 24 | Euríbor oficial, variación anual y subida para 100.000/150.000/200.000 € | `revision-hipoteca-euribor` |
| Subida del alquiler por mes | `subida-alquiler-irav-{mes}-{anio}` / `pujada-lloguer-irav-{mes}-{any}` | `irav-mensual.csv` | 1 al mes | IRAV oficial y ejemplos de 700, 900 y 1.200 € | `subida-alquiler` |
| Plusvalía por municipio | `plusvalia-{municipio}` / `plusvalua-{municipi}` | `plusvalia-municipios.csv`: INE, municipio, tipo %, coeficientes propios o «máximo legal», bonificaciones, URL del BOP, fecha | Fase 1: 50 capitales y los municipios catalanes de más de 50.000 habitantes (≈ 70). Fase 2: más de 20.000 habitantes (≈ 400). | Tipo y coeficientes de la ordenanza | `plusvalia-municipal?m=…` |
| IBI por municipio (fase 2) | `ibi-{municipio}` / `ibi-{municipi}` | `ibi-municipios.csv` (tabla anual de Catastro) | ≈ 400 | Tipo de gravamen del año | `ibi` |

Las propuestas del README `/itp-madrid/` e `/itp-<comunidad>/` se funden en «gastos de compra en <comunidad>». Dos páginas por comunidad con los mismos datos serían contenido duplicado. Las palabras clave del ITP apuntan a esa página.

Total de la fase 1: 19 + 42 + 12 + 24 + 24 + ≈ 70 ≈ **191 páginas por idioma**. Más 20 calculadoras y 10 fichas, son unas **442 URL**.

---

## 5. Palabras clave

`palabras-clave-sitio-4.csv` tiene 200 filas: 131 en castellano y 69 en catalán.

| Tipo de destino | Filas |
|---|---|
| calc | 95 |
| prog | 78 |
| ficha | 19 |
| nueva (cola de la tarea semanal) | 8 |

Las 8 de «nueva» son: índice de referencia del alquiler, IBI por municipio, deducción por alquiler (RDL 29/2026) y tipos de IBI.

- **Prioridades:** son de criterio, porque no hay herramienta de volúmenes. Pesan:
  - el pico mensual del Euríbor y del IRAV;
  - las comunidades con más compraventas (Andalucía, Cataluña, Madrid, Comunitat Valenciana);
  - la novedad del ITP valenciano al 9 %;
  - los coeficientes de plusvalía de diciembre de 2026.
- **Años:** «2027» en las palabras clave porque el sitio se abrirá en diciembre de 2026 o enero de 2027 (un sitio cada 6–8 semanas), como en el sitio 1.

---

## 6. RPM previsto

| | |
|---|---|
| RPM de la página con madurez | **6–12 €** (horquilla de `VIABILIDAD.md` para banca y seguros) |
| RPM previsto los primeros 6 meses | **3–6 €** |

Razonamiento, sin cifras de CPC inventadas:

1. **Anunciantes:** hipoteca, compraventa y seguro de hogar atraen a bancos, brókeres y aseguradoras. Es la vertical que más puja en AdSense en España, por encima de laboral (sitio 1: 4–8 €).
2. **Por qué menos al principio:**
   - el tráfico inicial es de cola larga y de móvil, que paga menos que el de escritorio;
   - las páginas de alquiler (inquilinos) y de plusvalía (herencias) atraen menos puja que las de hipoteca;
   - el consentimiento TCF en España deja una parte de las impresiones sin personalizar.
3. **Mezcla esperada:**
   - en las calculadoras de hipoteca, el RPM estará en la parte alta;
   - en alquiler y plusvalía, en la parte baja.

   No hay datos propios: los sitios 1 y 2 aún no tienen cuenta de AdSense. Hay que recalibrar con los tres primeros meses de datos.
4. **Afiliación:** suma más que AdSense en las calculadoras 1, 4, 11 y 12 si se firma con un bróker que pague por hipoteca firmada. Lo publicado por hipotecas.me es el 30 % de sus honorarios, cookie de 90 días; sin verificar las condiciones reales. Siempre rotulado como publicidad y nunca dentro del formulario.

---

## 7. Competidores y cómo diferenciarse

| Competidor | Qué tiene | Hueco que deja |
|---|---|---|
| **idealista** (calculadora de hipotecas y gastos, idealista/hipotecas) | Marca y autoridad enormes; captura leads | Pide datos para captar el lead; sin catalán; sin método ni norma visibles por cifra |
| **Bankinter, BBVA, CaixaBank, ING** (simuladores, blog del Euríbor) | Dominan «simulador hipoteca» | Solo su producto; sin comparar fija y variable con escenarios; sin gastos por comunidad |
| **iAhorro, HelpMyCash, Kelisto, Rastreator, gibobs, hipotecas.me** | Comparadores y brókeres con mucho contenido | Están hechos para el lead, con formularios que bloquean el resultado; texto largo |
| **guiafiscal.es** | Fuerte en ITP, AJD y plusvalía por comunidad y municipio; muy actualizado en 2026 (aparece en casi todas las búsquedas) | Competidor directo en la cola larga. Sin catalán y sin calculadora de hipoteca integrada |
| **Fotocasa, habitaclia** (habitaclia en catalán) | Portales con calculadoras básicas | Calculadoras sin desglose legal |
| **Notariado y Registradores** | Fuente oficial de aranceles | Sin calculadora pensada para el comprador |

Cómo diferenciarse:

1. **El resultado primero y sin pedir datos personales.** El ejemplo calculado viene en el HTML.
2. **Catalán de verdad.** Es la única web con las 20 calculadoras en catalán para Cataluña, la Comunitat Valenciana y Baleares (habitaclia solo tiene lo básico).
3. **Norma y fecha en cada cifra**, con el estado legal claro, por ejemplo: «coeficientes del RDL 29/2026: pendientes de convalidación; hoy se aplican los de 2024». Los competidores mezclan tablas derogadas.
4. **Escenarios de Euríbor** en fija frente a variable y en la revisión, con el dato oficial del mes el día 2.
5. **Ligado a la familia Claro**, con enlaces a ImpuestoClaro (IRPF de la venta) y a NetoClaro (sueldo neto para «cuánta hipoteca puedo pedir»).

---

## 8. Las 10 fichas de datos citables

Todas bajo `/datos/` (`/ca/dades/`), con CSV, caja «Cómo citar estos datos» y licencia CC BY 4.0. Se definen en `src/fichas/vivienda.ts`.

| # | Ficha | Ruta es | Datos | Fuente |
|---|---|---|---|---|
| 1 | Euríbor a 12 meses mes a mes desde 2000 | `/datos/euribor-historico/` | Media mensual y variación anual | BdE / BOE |
| 2 | ITP de vivienda por comunidad 2027, con tipos reducidos y requisitos | `/datos/itp-por-comunidad/` | General, escala, reducidos y norma | Boletines autonómicos |
| 3 | AJD por comunidad 2027 | `/datos/ajd-por-comunidad/` | Tipo general y reducidos | Boletines autonómicos |
| 4 | Lo que cuesta comprar una vivienda de 200.000 € en cada comunidad | `/datos/gastos-compraventa-por-comunidad/` | Usada y nueva: impuestos, notaría, registro y total | Calculado con el motor |
| 5 | Coeficientes de plusvalía: 2024 vigentes frente al RDL 29/2026 | `/datos/coeficientes-plusvalia/` | Coeficiente por años y estado legal | TRLRHL art. 107.4; RDL 8/2023; RDL 29/2026 |
| 6 | Cuota de hipoteca por importe y plazo | `/datos/cuota-hipoteca-por-importe/` | Matriz de 80.000–400.000 € por 15–35 años con el Euríbor del mes | Calculado |
| 7 | IRAV mensual desde su creación | `/datos/irav-mensual/` | Índice mensual | INE |
| 8 | Aranceles de notaría y registro por precio de la vivienda | `/datos/aranceles-notaria-registro/` | Coste por tramos de 100.000 a 600.000 € | RD 1426/1989 y RD 1427/1989 |
| 9 | Hipotecas sobre viviendas del INE: número, importe medio, tipo medio y fijo o variable | `/datos/hipotecas-ine-mensual/` | Serie mensual. Julio de 2026: 43.372 hipotecas, 180.785 €, 3,01 %, 62,3 % fijas | INE |
| 10 | Hipoteca máxima según sueldo neto | `/datos/esfuerzo-hipotecario-por-sueldo/` | Sueldo de 1.200–5.000 € por esfuerzo del 30/35/40 % y plazo | Calculado; se rotula como criterio, no como norma |

**Destinatarios para conseguir enlaces** (según MARKETING.md; nada se envía sin aprobación):

- APIs y agencias inmobiliarias de Lleida y Cataluña con blog;
- asociaciones de consumidores (OCU, Asufin, Facua), sobre el Euríbor y la plusvalía;
- medios locales (Segre, La Mañana) cada mes con el Euríbor y el IRAV;
- oficinas locales de vivienda (Oficina d’Habitatge).

---

## 9. Riesgos de las políticas de Google y cómo cumplirlas

- **YMYL financiero:**
  - autor con nombre (Moisés Mora), método publicado y fecha;
  - aviso: «Cálculo orientativo. La oferta vinculante es la FEIN que entrega la entidad (Ley 5/2019).»;
  - nunca recomendar un banco concreto fuera de un bloque rotulado como publicidad.
- **Normas pendientes de convalidación** (RDL 29/2026):
  - doble cifra, «hoy» y «si se convalida», con la fecha de la Diputación Permanente;
  - la tarea semanal la revisa.
- **Contenido a escala:** el municipio sin tipo de ordenanza del año no se publica. La comunidad foral lleva sus datos propios o no se publica.
- **No suplantar:** ni logotipos de bancos, ni del Catastro, ni de notarios. Aviso de «sitio independiente».
- **Afiliación:**
  - solo con intermediarios inscritos en el registro del Banco de España;
  - `rel="sponsored"` y rotulado «Publicidad»;
  - nunca dentro del formulario.

---

## 10. Borrador de `sitio.json`

Para crear `fabrica/sitios/vivienda/sitio.json` cuando se abra el sitio. Las mismas claves que el sitio 1.

```json
{
  "id": "vivienda",
  "pais": "es",
  "idiomas": ["es", "ca"],
  "dominio": "https://pisoclaro.es",
  "nombre": "PisoClaro",
  "lema": {
    "es": "Calculadoras de hipoteca, compraventa y alquiler con datos oficiales",
    "ca": "Calculadores d’hipoteca, compravenda i lloguer amb dades oficials"
  },
  "descripcion": {
    "es": "Simulador de hipoteca con el Euríbor del mes, gastos de compraventa e ITP por comunidad, plusvalía, notaría y registro, y subida del alquiler con el IRAV. En castellano y catalán, con el método y las fuentes publicados.",
    "ca": "Simulador d’hipoteca amb l’Euríbor del mes, despeses de compravenda i ITP per comunitat, plusvàlua, notaria i registre, i pujada del lloguer amb l’IRAV. En català i castellà, amb el mètode i les fonts publicats."
  },
  "anioPorDefecto": 2027,
  "calculadoras": ["simulador-hipoteca", "revision-hipoteca-euribor", "hipoteca-fija-o-variable", "cuanta-hipoteca-puedo-pedir", "ahorro-entrada-piso", "gastos-compraventa", "itp-vivienda", "iva-ajd-obra-nueva", "notaria-registro", "tabla-amortizacion", "amortizacion-anticipada", "cambiar-hipoteca-de-banco", "tae-hipoteca", "plusvalia-municipal", "ganancia-venta-vivienda", "deduccion-vivienda-habitual", "ibi", "subida-alquiler", "rentabilidad-alquiler", "alquilar-o-comprar"],
  "destacadas": ["simulador-hipoteca", "revision-hipoteca-euribor", "gastos-compraventa", "cuanta-hipoteca-puedo-pedir", "plusvalia-municipal", "subida-alquiler"],
  "rutasDatos": { "es": "datos", "ca": "dades" },
  "marcaClaro": {
    "familia": "Claro",
    "promesa": { "es": "Lo que cuesta tu casa, con números claros.", "ca": "El que costa casa teva, amb números clars." },
    "sello": { "es": "Hecho en Lleida · Números claros", "ca": "Fet a Lleida · Números clars" },
    "fuentes": { "titulos": "Manrope", "texto": "Inter" },
    "partes": ["Piso", "Claro"]
  }
}
```

Los campos `colores`, `autor`, `titular`, `adsense`, `umami`, `searchConsole` y `programaticas` van como en el sitio 1. Los colores están en la sección 1 y las colecciones en la sección 4.

---

## 11. Pendiente antes de publicar

1. Cotejar en el BOE el Euríbor de septiembre de 2026: 3,247 % según la mayoría de fuentes y 3,238 % según Bankinter.
2. Completar el ITP y el AJD de las comunidades marcadas con `false`, con su boletín y la fecha de efecto.
3. Leer el RDL 29/2026 en el BOE (art. 10, coeficientes completos; exención por venta; deducción por alquiler) y seguir su convalidación.
4. Cotejar los tramos altos del arancel registral y el IGIC de la vivienda en Canarias.
5. Comprobar las marcas en OEPM y EUIPO y la disponibilidad de los dominios.
6. **Numeración:** el README llama «Sitio 5» a Calendario y «Sitio 6» a Coche. Este encargo numera Coche como sitio 5. Hay que decidir la numeración en el README; esta carpeta no lo toca.
