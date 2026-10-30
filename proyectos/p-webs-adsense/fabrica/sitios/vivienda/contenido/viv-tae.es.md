---
slug: calculadora-tae-hipoteca
titulo: "TAE de la hipoteca con vinculaciones: calculadora"
h1: "TAE de la hipoteca con vinculaciones"
descripcion: "Calcula la TAE real de una hipoteca bonificada con seguros y productos vinculados y compárala con la oferta sin bonificar: cuota, coste total y si compensa."
resumen: "Pon el TIN con y sin bonificaciones y lo que cuestan los seguros: verás la TAE de cada opción y cuánto ganas o pierdes en todo el plazo bonificándote."
palabraClave: "calcular tae hipoteca"
actualizado: 2026-10-30
fuentes:
  - nombre: "Orden EHA/2899/2011 de transparencia bancaria (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-16970"
  - nombre: "Ley 5/2019 reguladora de los contratos de crédito inmobiliario (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "Banco de España: Portal del Cliente Bancario, préstamo hipotecario"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
faq:
  - p: "¿Por qué la TAE es mayor que el TIN?"
    r: "Porque incluye los gastos a tu cargo (tasación, comisión de apertura) y las primas de los productos vinculados que exige el banco para darte ese TIN."
  - p: "¿Estoy obligado a contratar el seguro de vida?"
    r: "No. El banco puede ofrecer un interés más bajo si lo contratas, pero no puede obligarte, salvo el seguro de daños del inmueble, que sí es obligatorio y puedes contratar con quien quieras."
  - p: "¿La TAE de una variable es fija?"
    r: "No. Se calcula con el Euríbor del momento y cambiará en cada revisión. Sirve para comparar ofertas el mismo día."
---
Muchos bancos ofrecen un interés más bajo si contratas **seguros**, domicilias la **nómina** o usas su **tarjeta**. La **TAE** pone todo en una sola cifra para comparar ofertas.

## Cómo se calcula

1. **Dinero que recibes** = importe − gastos a tu cargo (tasación y comisión de apertura).
2. **Pagos mensuales** = cuota con el TIN + primas de los seguros prorrateadas por mes + otros productos vinculados.
3. **TAE**: se busca por el método de Newton el interés mensual *r* que iguala lo que recibes con el valor actual de los pagos, y TAE = (1 + r)^12 − 1. Es el método del anexo de la Orden EHA/2899/2011, simplificado a cuotas mensuales iguales.
4. Se repite para la oferta **sin bonificar** (sin productos vinculados) y se compara el coste total.

## Ejemplo

**180.000 € a 30 años**. Con bonificaciones, TIN del **2,60 %**, seguro de vida de 300 € y de hogar de 250 € al año; sin bonificar, TIN del **3,40 %**; tasación de 350 €:

- TAE bonificada: **3,14 %**; TAE sin bonificar: **3,47 %**;
- bonificarte te ahorra unos **11.456 €** en todo el plazo, si los seguros no suben.

Las primas del seguro de vida suelen subir con la edad: pide el precio de los próximos años.
