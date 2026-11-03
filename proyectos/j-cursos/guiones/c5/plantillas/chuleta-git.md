# Chuleta de Git y GitHub

Curso «Vibe coding: crea apps y webs con IA sin saber programar».

**Cómo usar esta chuleta**

- Escribe las órdenes en la terminal, dentro de la carpeta de tu proyecto (`cd ~/proyectos/mi-proyecto`).
- Lo que va entre [corchetes] lo cambias por lo tuyo.
- Ritmo de trabajo: **pides a la IA, pruebas en el navegador y, si funciona, commit.**
- Antes de dejar que un agente (Cursor, Claude Code) toque tus archivos, haz un commit.

---

## Una sola vez en tu ordenador

| Orden | Para qué |
|---|---|
| `git config --global user.name "[Tu nombre]"` | Tu nombre en cada versión |
| `git config --global user.email "[tu correo]"` | Tu correo en cada versión |

## Una vez por proyecto

| Orden | Para qué |
|---|---|
| `git init -b main` | Convierte la carpeta en un repositorio |
| `echo .env > .gitignore` | Que Git nunca guarde el archivo de claves |

## Cada vez que algo funciona

| Orden | Para qué |
|---|---|
| `git status` | Ver qué ha cambiado (`--short` para la versión corta) |
| `git diff --stat` | Cuántas líneas han cambiado en cada archivo |
| `git add .` | Incluir todos los cambios en la próxima foto |
| `git commit -m "[qué cambia]"` | Guardar la foto con una nota |
| `git log --oneline` | Ver el historial, una versión por línea |

Notas que sirven: «Añado horario de verano», «Arreglo el botón de WhatsApp». Notas que no sirven: «cambios», «prueba».

## Cuando algo se rompe

| Situación | Orden |
|---|---|
| Aún no has hecho commit y quieres deshacer | `git restore [archivo]` |
| Quieres un archivo como estaba en una versión antigua | `git checkout [código] -- [archivo]` y después commit |
| No sabes qué ha pasado | `git status` y `git diff` antes de tocar nada |

El código de cada versión (por ejemplo `9c598bd`) lo ves con `git log --oneline`.

## Subir a GitHub

1. Crea una cuenta gratuita en GitHub y un repositorio nuevo y vacío (puede ser privado).
2. Copia las órdenes que te enseña GitHub, parecidas a estas:
   - `git remote add origin https://github.com/[tu-usuario]/[proyecto].git`
   - `git push -u origin main`
3. La primera vez te pedirá iniciar sesión (la contraseña de la cuenta no sirve: autoriza en el navegador).
4. Después de cada commit: `git push`.

## Sin terminal: GitHub Desktop (Windows y Mac, gratis)

| Quieres… | En GitHub Desktop |
|---|---|
| Empezar con tu carpeta | File → Add local repository |
| Guardar una versión | Escribe la nota abajo a la izquierda y pulsa Commit |
| Subir a GitHub | Publish repository (la primera vez), Push origin (después) |
| Deshacer un cambio | Clic derecho en el archivo → Discard changes |
| Ver el historial | Pestaña History |

## Nunca

- Nunca subas a GitHub contraseñas, claves de API ni el archivo `.env`.
- Nunca borres la carpeta oculta `.git`: ahí está todo tu historial.
