---
slug: simulador-hipoteca
titulo: "Simulador de hipoteca 2027: cuota, intereses y Euríbor"
h1: "Simulador de hipoteca"
descripcion: "Calcula la cuota mensual de tu hipoteca fija, variable o mixta, los intereses totales y el cuadro por años, con el tipo medio del INE y el último Euríbor."
resumen: "Pon el importe, el plazo y el interés: verás la cuota de cada mes, cuánto pagarás de intereses y cómo baja la deuda año a año, sin dejar tus datos."
palabraClave: "simulador hipoteca 2027"
actualizado: 2026-10-30
fuentes:
  - nombre: "Ley 5/2019 reguladora de los contratos de crédito inmobiliario (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "INE: Estadística de Hipotecas, julio de 2026"
    url: "https://www.ine.es/dyngs/Prensa/H0726.htm"
  - nombre: "Banco de España: tipos de interés de referencia oficiales"
    url: "https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html"
  - nombre: "Banco de España: Portal del Cliente Bancario, préstamo hipotecario"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
faq:
  - p: "¿Qué interés pongo si aún no tengo oferta?"
    r: "Por defecto usamos el tipo medio de las hipotecas sobre vivienda que publica el INE (3,01 % en julio de 2026). Es una media: tu oferta dependerá de tus ingresos, tu ahorro y las vinculaciones que aceptes."
  - p: "¿Qué diferencia hay entre TIN y TAE?"
    r: "El TIN es el interés que se aplica al capital y con él se calcula la cuota. La TAE suma además las comisiones y los seguros vinculados, y sirve para comparar ofertas. Tienes la calculadora de TAE en este mismo sitio."
  - p: "¿Por qué casi toda la cuota son intereses al principio?"
    r: "En el sistema francés la cuota es fija, pero los intereses se calculan sobre la deuda pendiente. Al principio la deuda es máxima y los intereses también; con los años pesa más el capital."
  - p: "¿El simulador sirve para una hipoteca mixta?"
    r: "Sí. Elige «Mixto», indica los años a tipo fijo y el Euríbor y el diferencial del tramo variable. Al acabar el tramo fijo la cuota se recalcula con el capital pendiente."
---
Este simulador calcula la **cuota mensual** de una hipoteca con el sistema francés, el que usan todos los bancos en España, y te enseña cuánto pagarás de **intereses** y cuánto debes al final de cada año.

Puedes simular tres tipos de hipoteca: **fija** (el interés no cambia), **variable** (Euríbor más un diferencial, revisado cada año) y **mixta** (unos años a tipo fijo y el resto variable).

## Cómo se calcula

1. **Interés mensual.** El TIN anual se divide entre 12. Con un 3,01 %, el interés de cada mes es el 0,2508 % de lo que debes.
2. **Cuota.** Con el capital *P*, el interés mensual *i* y el número de cuotas *n*, la cuota es C = P·i / (1 − (1 + i)^−n). Es la misma todos los meses mientras no cambie el interés.
3. **Intereses y capital de cada mes.** Los intereses del mes son la deuda pendiente por *i*; el resto de la cuota amortiza capital y reduce la deuda.
4. **Variable y mixta.** En cada revisión anual el interés pasa a ser el Euríbor más el diferencial, y la cuota se recalcula con la deuda pendiente y los meses que quedan. El simulador supone que el Euríbor que escribes se mantiene todo el plazo. El interés nunca baja de cero (Ley 5/2019).

## Ejemplo

La hipoteca media que registró el INE en julio de 2026 fue de **180.785 € a 26 años** con un interés medio del **3,01 %**. Su cuota es de **836,14 € al mes**: en 312 cuotas devuelves 260.875,78 €, de los que 80.090,78 € son intereses.

Con 200.000 € a 30 años al mismo 3,01 %, la cuota sería de 844,29 €.

## Antes de firmar

El banco tiene que darte la **FEIN** (ficha europea de información normalizada) con la cuota, la TAE y el cuadro de amortización de tu oferta, y el notario te asesora gratis al menos un día antes de la firma. Este simulador es orientativo: la cifra que vale es la de la FEIN.
