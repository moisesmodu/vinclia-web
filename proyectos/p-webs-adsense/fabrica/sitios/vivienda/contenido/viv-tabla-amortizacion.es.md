---
slug: tabla-amortizacion-hipoteca
titulo: "Tabla de amortización de la hipoteca mes a mes"
h1: "Tabla de amortización de la hipoteca"
descripcion: "Genera el cuadro de amortización de tu hipoteca por años o mes a mes: cuota, intereses, capital amortizado y deuda pendiente, con el sistema francés."
resumen: "Pon el importe, el plazo y el interés: verás cuánto de cada cuota son intereses y cuánto capital, y cuánto debes después de cada año o de cada mes."
palabraClave: "tabla amortización hipoteca"
actualizado: 2026-10-30
fuentes:
  - nombre: "Ley 5/2019 reguladora de los contratos de crédito inmobiliario (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "Banco de España: Portal del Cliente Bancario, préstamo hipotecario"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
  - nombre: "INE: Estadística de Hipotecas, julio de 2026"
    url: "https://www.ine.es/dyngs/Prensa/H0726.htm"
faq:
  - p: "¿Por qué amortizo tan poco al principio?"
    r: "Porque los intereses se calculan sobre la deuda pendiente, que al principio es máxima. Con 150.000 € al 3,01 %, el primer mes 376 € de los 712 € de cuota son intereses."
  - p: "¿Coincide con el cuadro de mi banco?"
    r: "Debería coincidir al céntimo si el interés es fijo y el banco usa meses iguales. Algunos bancos calculan los intereses por días reales y la cuota puede variar unos céntimos."
  - p: "¿Puedo descargar la tabla?"
    r: "Puedes imprimirla o guardarla en PDF con el botón de debajo del resultado, y copiar el enlace con tus datos para volver a ella."
---
El **cuadro de amortización** muestra, cuota a cuota, qué parte va a pagar **intereses** y qué parte reduce la **deuda**. Es la misma tabla que acompaña a la FEIN de tu banco.

## Cómo se calcula

1. **Cuota fija** con el sistema francés: C = P·i / (1 − (1 + i)^−n), con *i* = TIN / 12.
2. **Cada mes**: intereses = deuda pendiente × *i*; capital = cuota − intereses; deuda nueva = deuda − capital.
3. **Por años**: se suman las 12 cuotas, los intereses y el capital de cada año y se muestra la deuda al final del año y el porcentaje ya amortizado.
4. La última cuota se ajusta para que la deuda quede exactamente a cero.

## Ejemplo

**150.000 € a 25 años al 3,01 %**:

- cuota de **712,10 €** al mes;
- el primer año pagas 4.458,93 € de intereses y amortizas unos 4.086 €;
- hasta la cuota **25** no pagas más capital que intereses;
- en total, **63.629,22 € de intereses**.

Elige «Mes a mes» para ver las 300 cuotas.
