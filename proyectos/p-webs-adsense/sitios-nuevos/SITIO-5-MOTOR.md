# Sitio 5 · Coche y seguros (España, es/ca) · MotorClaro

Ficha completa para abrir el sitio con la fábrica (`fabrica/`). Datos buscados el 28/10/2026.

Archivos que acompañan esta ficha:

- `params-es-2026-motor.json`: los parámetros, cada bloque con `fuente` y `verificado`.
- `palabras-clave-sitio-5.csv`: 200 palabras clave (143 es / 57 ca), con el formato del sitio 1.

> **Numeración.** En el README del proyecto este sitio es el **6** («Coche y seguros») y el 5 es «Calendario y fechas». Aquí se sigue la numeración del encargo (sitio 5). Hay que unificarla en el README, que esta carpeta no toca.
>
> **Aviso de verificación.** boe.es, dgt.es y las sedes autonómicas no eran accesibles: WebFetch no resuelve esos dominios. Las cifras se han contrastado con resultados de búsqueda.
>
> - `verificado: true`: la fuente oficial coincide, o coinciden dos fuentes que citan la norma.
> - `verificado: false`: falta cotejarla.
> - `null`: el dato no se publica.

---

## 1. Marca

| | |
|---|---|
| **Nombre** | **MotorClaro** |
| Alternativa | CocheClaro |
| Comprobación | La búsqueda de «MotorClaro», «Motor Claro» y «CocheClaro» en España no da ninguna empresa, web ni marca. **No se ha consultado OEPM ni EUIPO** (clases 36, 39 y 42): hay que hacerlo antes de comprar el dominio. |
| Por qué «Motor» y no «Coche» | Cubre coche, moto y furgoneta (IVTM, ITV, cambio de nombre) y suena igual en catalán («motor»). «Cotxe» y «coche» obligarían a elegir idioma. |
| Promesa (es) | «Lo que cuesta tu coche, con números claros.» |
| Promesa (ca) | «El que costa el teu cotxe, amb números clars.» |
| Lema (es) | «Calculadoras de impuestos, ITV y costes del coche con datos oficiales» |
| Lema (ca) | «Calculadores d’impostos, ITV i costos del cotxe amb dades oficials» |
| `marcaClaro.partes` | `["Motor", "Claro"]` |

### Dominios .es candidatos, por orden

1. `motorclaro.es`
2. `cocheclaro.es`
3. `circulaclaro.es`

**No se ha podido comprobar la disponibilidad**: no hay acceso a whois. Hay que comprobarla en el registrador.

### Colores

Verde hoja, más amarillento que los de los sitios 1, 2 y 4, para distinguirlo dentro de la familia. Contrastes calculados con la fórmula WCAG:

```json
"colores": {
  "primario": "#3B7A1E",
  "primarioOscuro": "#2F6118",
  "marca": "#5BA829",
  "acento": "#FFD166",
  "cabecera": "#0B1F17",
  "fondo": "#FFFFFF",
  "tenue": "#F3F8EF",
  "superficie": "#FFFFFF",
  "tinta": "#0B1F17",
  "suave": "#4D5A47",
  "borde": "#DCE7D4"
}
```

| Uso | Color | Contraste |
|---|---|---|
| Marca sobre la cabecera tinta | `#5BA829` | 5,79:1 |
| Texto y enlaces sobre blanco | `#3B7A1E` | 5,27:1 (pasa AA) |
| Marca sobre blanco | `#5BA829` | 2,97:1: nunca para texto |

**Se evita a propósito** cualquier parecido con la DGT: ni azul institucional ni el amarillo y negro de sus señales en bloques grandes.

---

## 2. Público y calendario

- **Público:** conductores particulares que compran o venden un coche usado (cambio de nombre e ITP), pagan el impuesto de circulación, pasan la ITV, dudan entre eléctrico y combustión o entre renting y compra, o calculan un viaje. También autónomos (coste por km, kilometraje exento).
- **Idiomas:** castellano y catalán en las 20 calculadoras y en las fichas. Las páginas por municipio en catalán solo para municipios catalanes, valencianos y baleares. El README proponía el catalán en una segunda fase; el coste marginal en la fábrica es bajo y en Cataluña no hay competencia en catalán.
- **Picos:**
  - marzo–junio y septiembre–noviembre: padrones del IVTM (Madrid del 1/4 al 1/6; Barcelona y Zaragoza del 15/4 al 15/6; Málaga del 2/3 al 6/5; València del 1/9 al 2/11; ✘);
  - verano, por los viajes y el carburante;
  - diciembre y enero, por la compra de coche, la Orden de precios medios nueva y los cambios de tasas;
  - las ayudas Auto+, con solicitudes hasta el 31/12/2026 según una fuente.
- **Momento actual:**
  - MOVES III terminó en 2025 y el programa Auto+ lo sustituye (hasta 4.500 €, ✘);
  - la rebaja fiscal de los carburantes terminó el 30/9/2026;
  - la nueva Orden HAC/1501/2025 de precios medios está en vigor desde el 1/1/2026.

---

## 3. Las 20 calculadoras

Para todas:

- motores en `src/lib/calc/vehiculos.ts`;
- parámetros en `params/es/<año>/vehiculos.json`, a partir de `params-es-2026-motor.json`.

Como dice el README, **el seguro no se calcula con precios**: no se prometen primas. Las calculadoras de seguro trabajan con el valor del coche y con la elección de cobertura.

| # | id | Título es / ca | Qué calcula | Fórmula o método | Parámetros (fuente · valor 2026 · verificado) | Afiliación |
|---|---|---|---|---|---|---|
| 1 | `impuesto-circulacion` | Impuesto de circulación (IVTM) / Impost de circulació (IVTM) | Cuota anual en el municipio elegido, bonificación de eléctricos, ECO o históricos, y prorrateo por alta o baja | `cuota = cuota_mínima(CVF) × coeficiente_municipal × (1 − bonificación)`; prorrateo trimestral (art. 96) | Art. 95.1 TRLRHL, cuotas mínimas de turismos: menos de 8 CVF 12,62 €; 8–11,99: 34,08 €; 12–15,99: 71,94 €; 16–19,99: 89,61 €; 20 o más: 112,00 € ✔. Coeficiente máximo 2 ✔. Bonificación de hasta el 75 % por carburante o motor ✔ y de hasta el 100 % para históricos ✘. Madrid, 8–11,99 CVF: 59,00 € ✘ | Comparador de seguros de coche (es la página de más tráfico) |
| 2 | `caballos-fiscales` | Caballos fiscales del coche / Cavalls fiscals del cotxe | Potencia fiscal y tramo del IVTM | Combustión: `CVF = T × (0,785·D²·R)^0,6 × N`, con T = 0,08 en cuatro tiempos y 0,11 en dos tiempos. Eléctrico: `CVF = kW / 5,152`. Lo primero es leerlos de la ficha técnica. | RD 2822/1998, anexo V ✘ (fórmulas sin cotejar) | — |
| 3 | `itp-coche` | ITP del coche usado / ITP del cotxe de segona mà | Impuesto del comprador entre particulares | `base = max(precio pactado, precio medio de la Orden × % por años de uso)`; `cuota = base × tipo autonómico`, o cuota fija si la comunidad la tiene | Orden HAC/1501/2025 (BOE-A-2025-26357, en vigor el 1/1/2026) ✔. Tabla de % por años (100, 84, 67, 56, 47, 39, 34, 28, 24, 19, 17, 13, 10) ✘. Tipos: Madrid 4 % ✘, Cataluña 5 % ✘, Andalucía 4 % (8 % con más de 15 CVF) ✘; resto pendiente | Comparador de seguros (el comprador necesita póliza el mismo día); informe de historial del vehículo |
| 4 | `cambio-de-nombre` | Cuánto cuesta el cambio de nombre / Quant costa el canvi de nom | Coste total de la transferencia: ITP, tasa DGT y gestoría opcional | Suma | Tasa 1.5 de la DGT: 55,70 € ✘; ciclomotor (1.2): 27,85 € ✘; ITP de la calculadora 3. Gestoría: precio libre, la introduce el usuario. | Seguro de coche; gestoría online (programa sin localizar) |
| 5 | `impuesto-matriculacion` | Impuesto de matriculación por emisiones / Impost de matriculació per emissions | Cuota del IEDMT según el CO₂ WLTP y la comunidad | `cuota = base sin IVA × tipo(epígrafe CO₂) × (1 + incremento autonómico)` | Ley 38/1992, art. 70: 0 % / 4,75 % / 9,75 % / 14,75 % con cortes en 120 / 160 / 200 g/km. Los límites exactos de cada tramo discrepan entre fuentes ✘. Las comunidades pueden subirlo hasta un 15 % (siete lo han hecho, lista pendiente) ✘ | Renting; financiación de coche |
| 6 | `precio-final-coche-nuevo` | Precio final del coche nuevo / Preu final del cotxe nou | Precio con impuestos: base + IEDMT + IVA del 21 % + tasa de matriculación − ayuda Auto+ | Suma con el orden fiscal correcto: el IVA no grava el IEDMT | IVA del 21 % ✔. Tasa de matriculación: **pendiente** (null). Auto+ (calculadora 15) | Renting; financiación; seguro |
| 7 | `cuando-pasar-itv` | Cuándo me toca la ITV / Quan em toca la ITV | Fecha de la próxima ITV según tipo, fecha de matriculación y última inspección | Reglas por antigüedad | RD 920/2017, turismos particulares: exento hasta 4 años, cada 2 años de 4 a 10 y anual después ✔ (administracion.gob.es, 24/3/2026). Motos, furgonetas y otros: por transcribir ✘ | Seguro (aviso de vencimiento); talleres (sin programa) |
| 8 | `precio-itv` | Precio de la ITV por comunidad / Preu de la ITV per comunitat | Tarifa según comunidad, combustible y tipo de vehículo | Consulta de la tabla y suma de la tasa de tráfico si se cobra aparte | Precios orientativos de gasolina: Cataluña 52,27 €, País Vasco 47,50 €, Madrid 44,94 €, Andalucía 40,60 €, Comunitat Valenciana 39,27 €, Galicia 38,15 €, Castilla y León 36,80 €, Canarias 29,50 € ✘ (comparador privado). En comunidades liberalizadas, el precio es por estación. | — |
| 9 | `etiqueta-ambiental` | Qué etiqueta DGT tiene mi coche / Quina etiqueta DGT té el meu cotxe | Distintivo CERO, ECO, C, B o sin etiqueta | Árbol de decisión por tecnología, norma Euro y, en su defecto, fecha de matriculación | Criterios DGT ✘. Enlace a la consulta oficial por matrícula, sin imitar el diseño de la DGT. | Seguro; coches ECO o CERO |
| 10 | `coste-viaje` | Coste de un viaje en coche / Cost d’un viatge en cotxe | Combustible o electricidad más peajes, por persona | `km × consumo/100 × precio + peajes`; reparto entre pasajeros | Precio de carburante: el script mensual guarda el último dato con fecha. Muestras: gasolina 95 a 1,86 €/l y gasóleo A a 1,84 €/l (14/9/2026, Geoportal vía prensa) ✘ | Tarjetas de carburante (sin programa localizado) |
| 11 | `coste-por-km` | Coste real por kilómetro / Cost real per quilòmetre | € por km sumando fijos (seguro, IVTM, ITV, depreciación) y variables (combustible, neumáticos, mantenimiento) | `(fijos anuales + variables) / km anuales`; comparación con los 0,26 €/km exentos | 0,26 €/km, Orden HFP/792/2023 ✔ | Seguro de coche |
| 12 | `coste-anual-coche` | Cuánto cuesta mantener un coche al año / Quant costa mantenir un cotxe a l’any | Coste total anual y mensual (coste total de propiedad) | Suma de las calculadoras 1, 7, 8, 10 y 13 más el seguro y el mantenimiento del usuario | Usa los de las calculadoras 1, 7, 8, 10 y 13. Seguro: lo introduce el usuario. Referencia de mercado (Kelisto, 2.º trimestre de 2026): 1.411,94 € de prima media, todas las modalidades ✘. No se usa como valor por defecto. | Comparador de seguros |
| 13 | `depreciacion-coche` | Depreciación del coche / Depreciació del cotxe | Valor fiscal por años y pérdida anual | `valor = precio medio × % por años de uso` (Hacienda), con alternativa de curva propia del usuario | Orden HAC/1501/2025, tabla de % ✘ | Venta de coche usado (compraventa online, sin programa confirmado) |
| 14 | `valor-venal` | Valor venal de tu coche / Valor venal del teu cotxe | Valor venal, aproximado por el valor fiscal, y diferencia con el valor de mercado ante un siniestro total | Calculadora 13 más la comparación con el valor de mercado que introduce el usuario | Orden HAC/1501/2025 ✔ (existencia) / ✘ (tabla) | **Seguro**: elegir terceros o todo riesgo según el valor (el mejor contexto para la afiliación de seguros) |
| 15 | `ayudas-coche-electrico` | Ayudas para comprar un coche eléctrico (Auto+) / Ajuts per comprar un cotxe elèctric (Auto+) | Importe de la ayuda según tecnología, precio y fabricación en la UE | Tabla de importes | Auto+: hasta 4.500 € (eléctrico ≤ 35.000 € sin impuestos y fabricado en la UE); 3.375 € sin fabricación en la UE; descuento mínimo del concesionario de 1.000 €; solo etiqueta CERO; 2 años de permanencia ✘. Importes del tramo de 35.000–45.000 €: pendientes. | Concesionarios o marcas (sin programa); renting de eléctricos |
| 16 | `electrico-o-combustion` | ¿Eléctrico o de combustión? / Elèctric o de combustió? | Coste total a N años y kilómetro de equilibrio | Calculadora 12 para cada opción, con IVTM bonificado, Auto+, consumo y precio de energía | Ver calculadoras 1, 10, 15 y 19 | Renting; comparador de tarifas eléctricas |
| 17 | `renting-o-compra` | ¿Renting o compra? / Rènting o compra? | Coste total del renting frente a compra al contado o financiada, con valor residual | Valor actual de los flujos: cuotas de renting frente a entrada + cuotas del préstamo + seguro + mantenimiento − valor residual | Ninguno legal; IVA del 21 % ✔ (el particular no lo deduce) | **Renting** (CPL; programas por confirmar) |
| 18 | `prestamo-coche` | Cuota del préstamo para el coche / Quota del préstec per al cotxe | Cuota, intereses y TAE de la financiación del concesionario o del banco | Sistema francés más TAE por iteración con comisión de apertura | Ninguno legal (Ley 16/2011 de crédito al consumo para la TAE) ✘ | Préstamos personales (CPL) |
| 19 | `coste-recarga-electrico` | Cuánto cuesta cargar un coche eléctrico / Quant costa carregar un cotxe elèctric | € por recarga y por cada 100 km en casa o en un cargador público | `kWh/100 km × precio kWh / eficiencia de carga` | El precio de la luz lo introduce el usuario (el PVPC cambia cada hora). Sin valor por defecto inventado. | Comparador de tarifas de luz; instalador de cargador |
| 20 | `multa-velocidad` | Multa por exceso de velocidad y puntos / Multa per excés de velocitat i punts | Cuantía, puntos y si es delito, según límite de la vía y velocidad | Consulta de la tabla del anexo IV; reducción del 50 % por pronto pago | RDL 6/2015: leve hasta 100 €, grave 200 €, muy grave 500 €; pronto pago −50 % en 20 días ✘. Tabla del anexo IV: por transcribir del BOE (null) | Seguro (defensa jurídica) |

### Ejemplos para `tests/`

| Caso | Datos | Resultado | Estado |
|---|---|---|---|
| Matriculación | 25.000 € sin IVA, 135 g/km | Tramo del 4,75 %: 1.187,50 € | Cuenta propia, según la tabla del JSON |
| Caballos fiscales de un eléctrico | 100 kW | 100 / 5,152 = 19,41 CVF: tramo de 16–19,99 | Fórmula ✘ |
| IVTM con cuota máxima legal | Turismo de 8–11,99 CVF | 34,08 × 2 = 68,16 € | Coincide con lo que se publica para Barcelona ✘ |
| Viaje | 600 km × 6 l/100 km × 1,85 €/l | 66,60 € | — |

---

## 4. Páginas programáticas

Cada fila exige su dato oficial del año. CSV en `sitios/motor/programaticas/`.

| Colección | Slug es / ca | CSV y columnas | Filas | Dato propio por fila | Calculadora |
|---|---|---|---|---|---|
| Impuesto de circulación por municipio | `impuesto-circulacion-{slug}` / `impost-circulacio-{slug}` (ca solo para municipios de Cataluña, la Comunitat Valenciana y Baleares) | `ivtm-municipios.csv`: INE, municipio, provincia, cuota por tramo de CVF o coeficiente, bonificaciones de eléctricos, ECO e históricos, plazo de pago, URL de la ordenanza, año, `verificado` | Fase 1: municipios de más de 100.000 habitantes (≈ 63) más los catalanes de más de 50.000. Fase 2: más de 20.000 habitantes (≈ 400). | Cuotas, bonificación y plazo | `impuesto-circulacion?m=…` |
| ITP del coche usado por comunidad | `itp-coche-{slug}` / `itp-cotxe-{slug}` | `comunidades-vehiculos.csv`: tipo, cuotas fijas, exenciones por antigüedad, URL de la norma | 19 | Tipo y exenciones | `itp-coche?ca=…` |
| Precio de la ITV por comunidad | `precio-itv-{slug}` / `preu-itv-{slug}` | `itv-comunidades.csv`: tarifa oficial por tipo y combustible, o «liberalizado» con horquilla de estaciones, fecha | 17 (solo con tarifa oficial o datos de estaciones) | Tarifas | `precio-itv` |
| Cambio de nombre por modelo y año (fase 2) | `cambio-de-nombre-{marca}-{modelo}-{anio}` | `precios-medios.csv` a partir de los anexos de la Orden HAC/1501/2025: marca, modelo, versión, años, precio medio | Unos 300 modelos más vendidos × años = se limita a 600 | Precio medio oficial, base del ITP y coste en 3 comunidades | `cambio-de-nombre?…` |
| Impuesto de matriculación por comunidad (solo las que tienen tipo propio) | `impuesto-matriculacion-{slug}` | `matriculacion-comunidades.csv` | ≈ 8 (las 7 con tipo propio y Canarias) | Tipos autonómicos | `impuesto-matriculacion` |

Fase 1: ≈ 80 + 19 + 17 + 8 ≈ **124 páginas en castellano** y ≈ 50 en catalán. Con las 20 calculadoras y las 10 fichas en los dos idiomas son **unas 234 URL**. La fase 2 (municipios de más de 20.000 habitantes y modelos) multiplica por cuatro.

Lo que **no** se hace:

- páginas de ZBE por ciudad antes de tener la ordenanza de cada una (van a la cola «nueva»);
- páginas «coste del viaje de A a B», porque la distancia no viene de una fuente oficial y la página sería fina.

---

## 5. Palabras clave

`palabras-clave-sitio-5.csv` tiene 200 filas: 143 en castellano y 57 en catalán.

| Tipo de destino | Filas |
|---|---|
| calc | 90 |
| prog | 80 |
| ficha | 22 |
| nueva | 8 |

Las 8 de «nueva» son: calendario de pago del IVTM, ZBE de Madrid, Barcelona y Lleida, cambio de nombre por modelo y matriculación en Canarias.

Prioridad 1:

- el impuesto de circulación en las seis capitales más grandes;
- la etiqueta DGT;
- el cambio de nombre;
- la ITV;
- las ayudas Auto+.

En catalán pesan Lleida, Girona y Tarragona, por cercanía con el editor y por la falta de competencia.

---

## 6. RPM previsto

| | |
|---|---|
| RPM con madurez | **5–10 €** (`VIABILIDAD.md`, vertical de seguros) |
| RPM previsto los primeros 6 meses | **2,5–5 €** |

Razonamiento:

1. **Las aseguradoras y los comparadores pujan alto** en «seguro de coche». El sitio no ataca esa cabecera: atrae intención cercana (cambio de nombre, coche nuevo, valor venal) y AdSense le sirve esos anuncios por contexto.
2. **Mucho volumen de bajo valor:** IVTM, ITV, etiqueta y multas tienen mucho volumen pero intención administrativa, que paga menos que hipoteca. Por eso queda por debajo del sitio 4.
3. **Estacionalidad fuerte:** primavera, por los padrones del IVTM. Las páginas de coche nuevo, eléctrico y renting suben la media en diciembre y enero.
4. **Afiliación, una vez validado el tráfico:**
   - seguro (cuando el usuario acaba de comprar o tiene el valor del coche delante);
   - renting y préstamo de coche (CPL).

   Programas vistos: Mapfre Coche en Affilitizer desde el 23/2/2026 y Prima CPL en Kwanko (cerrado); condiciones sin confirmar. Solo con mediadores inscritos en la DGSFP, `rel="sponsored"` y rotulado.

---

## 7. Competidores y cómo diferenciarse

| Competidor | Qué tiene | Hueco |
|---|---|---|
| **Rastreator, Acierto, Kelisto, Check24** | Comparadores de seguros con guías de IVTM, ITV y cambio de nombre; índices de precios propios | Todo lleva al formulario del seguro; calculadoras genéricas y sin datos por municipio ni norma |
| **RACE, Mapfre Motor, Línea Directa (blogs)** | Autoridad y guías | Texto, no cálculo; sin catalán |
| **impuestocirculacion.es, todosobreautos.com, ultimamatricula.com, verificatucoche.es, impuestosde.com** | Calculadoras de IVTM e ITP por municipio y comunidad (competencia directa en la cola larga) | Datos sin fecha ni norma citada, tablas contradictorias entre ellas (ITP de Galicia y de la Comunitat Valenciana); sin catalán |
| **Gestorías online** (gestoria247, tramitatucoche, pagatucoche) | Contenido de cambio de nombre para captar el trámite | Sesgadas a vender la gestión |
| **coches.net, Autofácil, Motor16, Xataka** | Noticias de ayudas y etiquetas | Noticia, no calculadora |
| **DGT** (sede y etiqueta por matrícula) | Fuente oficial | No calcula costes: se enlaza, no se imita |

Cómo diferenciarse:

1. **Cada municipio con su ordenanza enlazada y su año.** Los competidores publican cifras sin fecha y se contradicen.
2. **El catalán en las calculadoras y en los municipios catalanes**, donde no hay competencia.
3. **Coste total, no impuestos sueltos:** coste anual y por km, eléctrico frente a combustión, renting frente a compra, todo enlazado.
4. **Sin formulario antes del resultado y sin precios de seguro inventados.**
5. **Estado legal claro:** «MOVES III terminó; Auto+ hasta el 31/12/2026, por confirmar»; «tabla de depreciación de la Orden HAC/1501/2025».

---

## 8. Las 10 fichas de datos citables

En `/datos/` (`/ca/dades/`), con CSV y CC BY 4.0, en `src/fichas/motor.ts`.

| # | Ficha | Ruta es | Datos | Fuente |
|---|---|---|---|---|
| 1 | Cuotas mínimas del impuesto de circulación por caballos fiscales y máximo legal | `/datos/ivtm-por-caballos/` | Cuota mínima y × 2 por tramo y clase de vehículo | TRLRHL art. 95 |
| 2 | Impuesto de circulación en las 50 capitales y ciudades grandes | `/datos/impuesto-circulacion-capitales/` | Cuota por tramo, bonificación de eléctricos y plazo | Ordenanzas fiscales 2026–2027 |
| 3 | ITP del coche usado por comunidad | `/datos/itp-coche-por-comunidad/` | Tipo, cuotas fijas y exenciones | Normativa autonómica |
| 4 | Tabla de depreciación de Hacienda por años de uso | `/datos/tabla-depreciacion-hacienda/` | % por años y ejemplo | Orden HAC/1501/2025 |
| 5 | Tramos del impuesto de matriculación por CO₂ y tipos autonómicos | `/datos/tramos-impuesto-matriculacion/` | Epígrafes y tipos | Ley 38/1992 art. 70; leyes autonómicas |
| 6 | Frecuencia de la ITV por tipo de vehículo y antigüedad | `/datos/frecuencia-itv/` | Reglas | RD 920/2017 |
| 7 | Precio de la ITV por comunidad | `/datos/precio-itv-por-comunidad/` | Tarifa oficial o horquilla | Tarifas autonómicas |
| 8 | Tasas de la DGT | `/datos/tasas-dgt/` | Importe por trámite | DGT / LPGE |
| 9 | Multas y puntos por velocidad | `/datos/multas-velocidad-puntos/` | Cuadro del anexo IV | RDL 6/2015 |
| 10 | Precio medio mensual de la gasolina y el gasóleo | `/datos/precio-carburantes-mensual/` | Serie mensual | Boletín Petrolero UE / MITECO |

**Para conseguir enlaces** (según MARKETING.md):

- autoescuelas de Lleida y Cataluña (etiqueta, multas, ITV);
- asociaciones de conductores y consumidores;
- medios locales cuando se publica el padrón del IVTM;
- concejalías de movilidad (ZBE, bonificaciones de eléctricos).

---

## 9. Riesgos de las políticas de Google y cómo cumplirlas

- **Suplantación de la DGT:**
  - ni logotipo, ni sus colores, ni la palabra «oficial»;
  - ningún «trámite DGT» de pago;
  - aviso de «sitio independiente» y enlace a la sede oficial.
- **Seguros:**
  - no prometer precios de póliza;
  - las referencias de mercado (Kelisto, Check24) solo como contexto citado, nunca como valor por defecto;
  - afiliación rotulada.
- **Contenido a escala:** municipio sin ordenanza del año = sin página; modelo sin precio medio oficial = sin página.
- **Datos caducados:**
  - carburante con fecha del dato, actualizado por script mensual;
  - Auto+ con fecha de fin de plazo y aviso si vence.

---

## 10. Borrador de `sitio.json`

```json
{
  "id": "motor",
  "pais": "es",
  "idiomas": ["es", "ca"],
  "dominio": "https://motorclaro.es",
  "nombre": "MotorClaro",
  "lema": {
    "es": "Calculadoras de impuestos, ITV y costes del coche con datos oficiales",
    "ca": "Calculadores d’impostos, ITV i costos del cotxe amb dades oficials"
  },
  "descripcion": {
    "es": "Impuesto de circulación de tu municipio, cambio de nombre e ITP, impuesto de matriculación, ITV, etiqueta DGT, ayudas Auto+ y coste real por kilómetro. En castellano y catalán, con la norma y la fecha de cada dato.",
    "ca": "Impost de circulació del teu municipi, canvi de nom i ITP, impost de matriculació, ITV, etiqueta DGT, ajuts Auto+ i cost real per quilòmetre. En català i castellà, amb la norma i la data de cada dada."
  },
  "anioPorDefecto": 2027,
  "calculadoras": ["impuesto-circulacion", "caballos-fiscales", "itp-coche", "cambio-de-nombre", "impuesto-matriculacion", "precio-final-coche-nuevo", "cuando-pasar-itv", "precio-itv", "etiqueta-ambiental", "coste-viaje", "coste-por-km", "coste-anual-coche", "depreciacion-coche", "valor-venal", "ayudas-coche-electrico", "electrico-o-combustion", "renting-o-compra", "prestamo-coche", "coste-recarga-electrico", "multa-velocidad"],
  "destacadas": ["impuesto-circulacion", "cambio-de-nombre", "cuando-pasar-itv", "etiqueta-ambiental", "coste-anual-coche", "ayudas-coche-electrico"],
  "rutasDatos": { "es": "datos", "ca": "dades" },
  "marcaClaro": {
    "familia": "Claro",
    "promesa": { "es": "Lo que cuesta tu coche, con números claros.", "ca": "El que costa el teu cotxe, amb números clars." },
    "sello": { "es": "Hecho en Lleida · Números claros", "ca": "Fet a Lleida · Números clars" },
    "fuentes": { "titulos": "Manrope", "texto": "Inter" },
    "partes": ["Motor", "Claro"]
  }
}
```

El README proponía `sitios/coche/` como carpeta. Aquí se usa `motor` para que coincida con la marca. Da igual cuál se elija, pero hay que usar el mismo id en `sitio.json`, `src/fichas/<id>.ts` y `SITIO=<id>`.

---

## 11. Pendiente antes de publicar

1. Leer en el BOE el art. 70 de la Ley 38/1992 (límites de los tramos), el anexo V del RD 2822/1998 (fórmula de los caballos fiscales), el anexo IV del RDL 6/2015 (cuadro de velocidad) y la tabla de porcentajes de la Orden HAC/1501/2025.
2. Confirmar las tasas DGT de 2026 en su sede: la 1.5 (55,70 €) y la de matriculación (sin dato).
3. Completar el ITP de vehículos de las 19 comunidades con su norma.
4. Crear `ivtm-municipios.csv` con las ordenanzas 2026 y 2027 de los municipios de más de 100.000 habitantes.
5. Confirmar Auto+ (importes por tramo de precio y plazos) en el portal del Ministerio de Industria y Turismo.
6. Comprobar las marcas en OEPM y EUIPO y los dominios.
