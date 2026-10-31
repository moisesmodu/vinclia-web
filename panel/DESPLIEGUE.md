# Despliegue del panel «La cartera» (para la sesión del Mac)

- **Proyecto de Vercel:** `cartera`. Framework: Next.js. **Root Directory: `panel`**. Build: `npm run build`. Salida: `out`
  (el panel es una exportación estática: `output: 'export'`). Sin variables de entorno, sin Neon, sin Stripe.
- **Rama de producción:** `claude/estrategia-ingresos-recurrentes-tx0rvw`, con la integración de Git activada para que
  cada push a esa rama vuelva a publicar el panel solo. Ignored Build Step: `git diff HEAD^ HEAD --quiet -- panel`.
- **Protección:** el panel contiene prompts, cifras y planes. Activar en Vercel → Settings → Deployment Protection la
  opción «Password Protection» (plan Pro) o «Vercel Authentication» para que solo Moisés lo vea. Si no hay plan Pro,
  dejarlo público pero avisar en el panel.

```bash
git fetch origin claude/estrategia-ingresos-recurrentes-tx0rvw && git checkout claude/estrategia-ingresos-recurrentes-tx0rvw && git pull
cd panel && npm install && npm run build         # comprobación local: out/index.html
vercel project add cartera --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project cartera --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel git connect --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID        # conecta moisesmodu/vinclia-web
# En Settings → General: Root Directory = panel; Settings → Git: Production Branch = claude/estrategia-ingresos-recurrentes-tx0rvw
vercel deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
```

## Publicación automática con cada push (sin conectar el repositorio a Vercel)

Como Vercel bloquea los despliegues automáticos de commits firmados por «Claude» en la integración de Git, el panel se
publica con el workflow `.github/workflows/panel.yml` (GitHub Actions, que sí tiene red). Solo hace falta que la sesión
del Mac guarde tres secretos en el repositorio, una vez:

```bash
gh secret set VERCEL_TOKEN --repo moisesmodu/vinclia-web --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --repo moisesmodu/vinclia-web --body "$VERCEL_TEAM_ID"
gh secret set VERCEL_PROJECT_ID --repo moisesmodu/vinclia-web --body "$(cat panel/.vercel/project.json | python3 -c 'import json,sys;print(json.load(sys.stdin)["projectId"])')"
```

Después, cada push a la rama base que toque `panel/`, `marcas/` o los `.md` publica el panel solo. El mismo patrón sirve
para cualquier otro proyecto que quiera publicarse con cada push.

Después: anotar la URL en `panel/data/cartera.json` → `panelUrl`, y añadir al final de este archivo `Ejecutado el <fecha>`.

Ejecutado el 31/10/2026. Proyecto `cartera` (prj_AlLDF7YHqfMUcty6H6yyNny4f4v9) conectado por Git a moisesmodu/vinclia-web,
Production Branch = la rama base, Root Directory `panel`. URL de producción:
https://cartera-moisesmodu-3705s-projects.vercel.app (Vercel Authentication, protección estándar: entra Moisés con su
cuenta de Vercel). Se quitó el dominio público `cartera-alpha.vercel.app` porque la protección estándar no lo cubría.
Ignored Build Step real: `git diff HEAD^ HEAD --quiet -- . ../marcas ../marketing '../*.md'` (el comando se ejecuta
dentro de `panel/`, así que `-- panel` nunca veía cambios). Next.js subido a 15.5.28: Vercel bloquea 15.5.6 por
vulnerabilidad. El workflow `.github/workflows/panel.yml` no hace falta mientras la integración de Git publique.
