# Pantallas y datos: el plan de tu app

Curso «Vibe coding: crea apps y webs con IA sin saber programar» · Sección 5.

Rellena esta plantilla antes de pedir código. Te servirá para dos cosas: darle a la IA un plan claro y comprobar después que ha hecho lo que pediste. Si algo no está aquí, no lo has pedido.

**Reglas rápidas**

- Una o dos pantallas en tu primera app. Menos pantallas, menos cosas que fallan.
- Guarda lo que pasó y calcula el resto (rachas, totales, porcentajes).
- No pongas contraseñas, claves ni datos personales de nadie en el chat.

---

## 1. La app en una frase

[Qué hace y para quién. Ejemplo: una app para apuntar mis hábitos cada día y ver mis rachas, en mi móvil.]

## 2. Dibuja cada pantalla

Dibuja en papel un rectángulo alto (el móvil) y apunta aquí lo que hay de arriba abajo.

**Pantalla 1: [nombre]**

| Zona | Qué se ve | Qué puedo hacer |
|---|---|---|
| Arriba | | |
| En medio | | |
| Abajo | | |

Ejemplo (app de hábitos):

| Zona | Qué se ve | Qué puedo hacer |
|---|---|---|
| Arriba | Fecha, título, «2 de 4 hechos hoy» | Nada, solo mirar |
| En medio | Campo y botón «Añadir», lista de hábitos | Añadir, marcar hoy, editar, borrar |
| Abajo | Semana, gráfico, instalar, copia | Descargar y recuperar copia |

**Pantalla 2 (si la necesitas): [nombre]**

| Zona | Qué se ve | Qué puedo hacer |
|---|---|---|
| | | |

## 3. Los datos que se guardan

Una fila por dato. Si un dato se puede calcular a partir de otros, no lo guardes: apúntalo en el punto 4.

| Dato | Ejemplo | Para qué sirve |
|---|---|---|
| | | |
| | | |
| | | |

Ejemplo (cada hábito):

| Dato | Ejemplo | Para qué sirve |
|---|---|---|
| id | 1793696400000 | Distinguir dos hábitos iguales |
| nombre | Leer 10 minutos | Lo que ves en la lista |
| creado | 2026-11-03 | No contar días de antes |
| hechos | 2026-11-01, 2026-11-02 | Rachas, semana y gráfico |

## 4. Lo que se calcula (y sus reglas exactas)

La IA no sabe qué quieres contar. Escribe la regla, también para los casos raros.

| Cálculo | Regla exacta | Caso raro |
|---|---|---|
| | | |
| | | |

Ejemplo: Racha · días seguidos hechos hasta hoy · si hoy aún no está hecho, cuenta hasta ayer.

## 5. Dónde se guardan los datos

- [ ] En el navegador (localStorage): datos míos, en mi dispositivo. Gratis y sin servidor.
- [ ] En un servidor con base de datos: datos de otras personas, o compartidos entre varios dispositivos. Necesita revisión técnica y cumplir la protección de datos.

Recuerda: localStorage se queda en ese navegador y en ese dispositivo, y se pierde si borras los datos del navegador. Ofrece descargar y recuperar una copia en JSON.

## 6. El plan en versiones

Cada versión es una instrucción a la IA y debe funcionar por sí sola. Guarda cada una en su carpeta.

| Versión | Qué añade | ¿Probada? |
|---|---|---|
| v1 | | |
| v2 | | |
| v3 | | |
| v4 | | |

## 7. Instrucción para que la IA revise el plan

> Voy a hacer una app personal en un solo archivo index.html, sin librerías. Te paso mi plan: [pega los puntos 1 a 6]. No escribas código todavía. Dime qué falta, qué es confuso y si los datos que guardo bastan para todo lo que quiero calcular.

---

Última revisión: [fecha].
