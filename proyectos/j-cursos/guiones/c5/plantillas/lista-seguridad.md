# Lista de comprobación: errores, inventos y seguridad

Curso «Vibe coding: crea apps y webs con IA sin saber programar». Clase 7.

Pásala después de cada cambio importante y siempre antes de publicar.

---

## 1. Casos raros

- [ ] Campos vacíos: no sale «NaN», «undefined» ni «Infinity».
- [ ] Cero, números negativos y números enormes.
- [ ] Decimales con coma (86,40) y con punto (86.40).
- [ ] Textos muy largos, con tildes, eñes y apóstrofos.
- [ ] Pulsar dos veces seguidas el mismo botón.
- [ ] En el móvil: se ve entero y los botones se pueden tocar.
- [ ] La consola (F12) no muestra nada en rojo.

## 2. Si algo falla

1. Qué hiciste: «He escrito 0 en personas y he pulsado Calcular».
2. Qué salió: copia el resultado o el error de la consola tal cual.
3. Qué esperabas: «Que no deje poner menos de 1».
4. Termina con: «No cambies nada más».

## 3. Inventos de la IA (alucinaciones)

- [ ] Si sale «… is not a function» o «… is not defined», puede ser una función inventada.
- [ ] Pide: «Usa solo funciones estándar que existan en todos los navegadores».
- [ ] Si propone instalar una librería que no conoces, pregunta en qué web oficial aparece y búscala tú.
- [ ] Comprueba los cálculos con la calculadora del móvil.

## 4. Claves y contraseñas

- [ ] Ninguna clave de API, contraseña ni token en el chat.
- [ ] Ninguna clave dentro del HTML: cualquiera la ve con «Ver código fuente».
- [ ] Las claves viven en un servidor o en los ajustes de secretos de la herramienta.

## 5. Datos personales

- [ ] En el chat, datos inventados: «Ana», «cliente A». Nada de DNI, teléfonos, direcciones ni datos de salud.
- [ ] Pregunta a la IA: «¿Esta app envía algún dato fuera del navegador? ¿Adónde?».
- [ ] Guardar en el navegador (localStorage) sirve para apps personales, no para recoger datos de clientes.
- [ ] Si pides nombre, correo o teléfono a otras personas: aviso de privacidad, casilla de consentimiento si vas a enviar publicidad y un sitio seguro donde guardarlos.

## 6. Cuándo llamar a alguien que sepa

| Si tu app… | Haz esto |
|---|---|
| Cobra dinero | Servicio de pago reconocido y revisión técnica |
| Guarda datos de clientes | Revisión técnica y aviso de privacidad |
| Tiene cuentas y contraseñas | Revisión técnica antes de publicar |
| Usa una clave secreta | Que viva en un servidor, no en la web |
| La van a usar muchas personas | Revisión técnica antes de abrirla al público |
