# Lista de comprobación de seguridad para tu app

Curso «Vibe coding: crea apps y webs con IA sin saber programar».

**Cómo usar esta lista**

- Repásala antes de enseñar tu app a otras personas y cada vez que añadas algo importante.
- Marca cada casilla solo cuando lo hayas **comprobado tú**, no cuando la IA diga que está hecho.
- Si tu app maneja pagos, datos de salud o muchos usuarios, esta lista no basta: pide una revisión a un programador.

---

## 1. Claves y contraseñas

- [ ] No hay ninguna clave de API ni contraseña en el HTML ni en el JavaScript de la página (búscalo con «Ver código fuente»).
- [ ] Las claves están en variables de entorno: en `.env` en tu ordenador y en el panel de variables de la plataforma.
- [ ] El archivo `.env` está en `.gitignore` y no aparece en GitHub.
- [ ] Nunca has pegado una clave en el chat de la IA.
- [ ] Cada proyecto tiene su propia clave.
- [ ] Sabes dónde borrar una clave y crear otra si se filtra.

## 2. Gasto

- [ ] Límite de gasto mensual puesto en cada servicio que se paga por uso.
- [ ] Avisos por correo de consumo activados.
- [ ] Sabes qué plan tienes en cada herramienta y cuándo se renueva.

| Servicio | Plan | Límite puesto | Fecha de renovación |
|---|---|---|---|
| [ej. constructor de apps] | | | |
| [ej. IA por uso] | | | |

## 3. Usuarios y datos

- [ ] Has pedido expresamente que cada usuario solo vea sus propios datos.
- [ ] Lo has comprobado con dos cuentas de prueba distintas.
- [ ] Sin iniciar sesión no se puede entrar en las pantallas privadas.
- [ ] Si usas Supabase: las reglas de acceso (seguridad por filas) están activadas en todas las tablas.
- [ ] La clave de servicio de Supabase (la secreta) no está en la web.
- [ ] Si pides nombre, teléfono o correo: hay aviso de privacidad y, si envías publicidad, casilla de consentimiento.

## 4. Copias de seguridad

- [ ] El código está en Git y tiene una copia en GitHub (o, como mínimo, un zip reciente).
- [ ] Sabes volver a una publicación anterior en tu alojamiento (Netlify guarda las anteriores).
- [ ] Exportas los datos de la base de datos de vez en cuando.
- [ ] Si la app guarda en el navegador: tiene un botón para exportar los datos.

## 5. Antes de publicar

- [ ] La has probado en ordenador y en móvil.
- [ ] Has probado con datos raros: campos vacíos, textos muy largos, números negativos.
- [ ] No hay datos reales de clientes en las pruebas.
- [ ] Sabes a quién llamar si algo se rompe.
