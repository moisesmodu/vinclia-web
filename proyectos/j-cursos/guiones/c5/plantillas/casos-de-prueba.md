# Plantilla: casos de prueba para comprobar cálculos

Curso «Vibe coding: crea apps y webs con IA sin saber programar» · Clase c5-21.

La IA escribe código que parece correcto, pero no suele ejecutarlo. Un fallo de un céntimo no da ningún error: el número simplemente sale mal. Por eso, antes de fiarte, compara la app con casos que has calculado tú, a mano o con la calculadora.

## 1. Reglas para las cuentas con dinero
- Todas las cuentas, en **céntimos** (números enteros). Solo se divide entre 100 para mostrar el resultado.
- Redondea **en cada paso** (importe de línea, descuento, IVA) al céntimo más cercano; si queda justo en la mitad, hacia arriba. Confirma con tu gestoría cómo redondeas tú.
- El **tipo de IVA** no lo decide la IA: te lo dice tu gestoría.

## 2. Casos de ejemplo (Reformas Jordi)
| Caso | Cuenta a mano | Debe salir | ¿La app coincide? |
|---|---|---|---|
| 0,10 € + 0,20 € | 0,30 | 0,30 € | |
| 3 × 0,70 € | 2,10 | 2,10 € | |
| 12,5 m² × 19,99 € | 249,875 | 249,88 € | |
| IVA 21 % de 21,50 € | 4,515 | 4,52 € | |
| IVA 10 % de 1,45 € | 0,145 | 0,15 € | |
| 99,95 € − 10 % + IVA 21 % | 89,95 + 18,8895 | 108,84 € | |
| Cantidad «-2» | — | Aviso: no puede ser negativo | |
| Precio vacío | — | Aviso: falta este dato | |
| «1.234,5» | 1234,50 | 1234,50 € | |

## 3. Tus casos (de tu oficio)
Elige casos con decimales, con medios céntimos y con descuentos. Calcula cada uno tú.

| Caso | Cuenta a mano | Debe salir | ¿La app coincide? |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## 4. Casos raros que conviene probar
- [ ] Números a la española: coma decimal y punto de miles.
- [ ] Un descuento mayor del 100 % (debe dar aviso).
- [ ] Letras en un campo de número.
- [ ] Una línea vacía al final de la tabla.
- [ ] Un total de cuatro cifras: en formato español sale sin punto (1016,28 €). No es un fallo.

## 5. Instrucción para que la app se compruebe sola
> Añade un enlace «Comprobar cálculos» que pase estos casos y muestre una tabla con lo que he calculado a mano, lo que da la app y si coincide: [pega tu tabla]. No cambies las cuentas para que cuadren: si un caso falla, dímelo.

Vuelve a pulsar «Comprobar cálculos» cada vez que cambies algo en la app.
