# Plantilla: tickets y hoja de gastos

Clase c3-21. La IA lee y ordena; tú compruebas cada total. Qué gasto es deducible y cómo lo decide tu gestoría, no la IA.

## 1. El circuito de un ticket
1. Foto del ticket el mismo día (tapa los datos de clientes si los hay).
2. La IA extrae los datos en una tabla.
3. Compruebas fecha, proveedor y total con el papel.
4. Lo pegas en tu hoja de gastos.
5. Guardas el original como te indique tu gestoría.

## 2. Instrucciones para copiar
**De la foto a la tabla**
> Te paso la foto de un ticket de compra para mi [negocio]. Extrae en una tabla: fecha, proveedor, concepto resumido, base, IVA y total. Si algún dato no se lee bien, escribe ilegible en lugar de suponerlo.

**Clasificar**
> Clasifica estos gastos usando solo estas categorías que me ha dado mi gestoría: [categorías]. Si dudas en alguno, ponlo en «dudas» en lugar de elegir. Gastos: [lista].

**Fórmula de suma por categoría**
> Tengo una hoja de [Google Sheets / Excel] con los gastos. La columna [C] es la categoría y la [F] es el total. Dame la fórmula para sumar el total de cada categoría y explícamela paso a paso como si nunca hubiera usado fórmulas.

Ejemplo en Google Sheets (en castellano): `=SUMAR.SI(C:C; "Suministros"; F:F)`. Pruébala siempre con dos gastos que sepas sumar a mano.

## 3. Columnas de la hoja
| Fecha | Proveedor | Concepto | Categoría | Base | IVA | Total | Comprobado |
|---|---|---|---|---|---|---|---|
| | | | | | | | Sí / No |

## 4. Una vez al mes
- [ ] La suma de la hoja coincide con los tickets o los cargos del banco.
- [ ] La columna «Comprobado» está completa.
- [ ] Los gastos dudosos están anotados para preguntar a la gestoría.
