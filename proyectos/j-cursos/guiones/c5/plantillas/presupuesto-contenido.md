# Plantilla: qué lleva un presupuesto y cómo sacarlo en PDF

Curso «Vibe coding: crea apps y webs con IA sin saber programar» · Clase c5-22.

## 1. Lista de comprobación de la hoja
- [ ] Tus datos: nombre o empresa, dirección, teléfono y NIF.
- [ ] Datos del cliente y dirección de la obra.
- [ ] Número de presupuesto (por ejemplo, 2026-001) y fecha.
- [ ] «Válido hasta»: fecha + 30 días (o el plazo que tú decidas).
- [ ] Partidas con concepto, cantidad, precio e importe.
- [ ] Subtotal, descuento si lo hay, base imponible, IVA con su tipo y total.
- [ ] Frase «Este documento es un presupuesto, no una factura».
- [ ] Espacio para la conformidad del cliente (fecha y firma).
- [ ] Las cuentas coinciden con tus casos de prueba.

## 2. Instrucción de la versión 3
> Paso 3. Añade arriba los datos del cliente (nombre, NIF, teléfono o correo y dirección de la obra), el número de presupuesto y la fecha. A la derecha, en vez del resumen, muestra la hoja del presupuesto como se imprimirá: mis datos, los del cliente, las líneas, los totales y «Válido hasta», 30 días después de la fecha. Añade un botón «Guardar en PDF» que use window.print, con estilos @media print para que solo se imprima la hoja. Sin librerías.

## 3. Guardar en PDF (Chrome o Edge)
1. Pulsa «Guardar en PDF» en la app.
2. En **Destino**, elige «Guardar como PDF».
3. En **Más ajustes**, quita «Encabezados y pies de página».
4. Guarda con un nombre claro: `Presupuesto 2026-001 Apellido.pdf`.
5. Abre el PDF y revísalo antes de enviarlo.

## 4. Instrucción de la versión 4
> Paso 4. Añade un botón «Guardar presupuesto» que lo guarde en localStorage y un panel «Guardados» con la lista: número, cliente, fecha y total, con botones Abrir, Duplicar y Borrar. Duplicar copia las líneas, el IVA y el descuento, pero deja el cliente vacío y pone el siguiente número y la fecha de hoy. Borrar pide confirmación. Indica en el panel que se guardan solo en este navegador.

## 5. Cuidado con los guardados
| Lo que pasa | Qué hacer |
|---|---|
| Solo existen en ese navegador | Usa siempre el mismo ordenador |
| Se pierden si borras los datos del navegador | Tu copia de verdad son los PDF |
| Llevan datos de clientes | Ordenador con contraseña y no compartido |
| Ya no los necesitas | Bórralos |
