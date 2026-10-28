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

Después: anotar la URL en `panel/data/cartera.json` → `panelUrl`, y añadir al final de este archivo `Ejecutado el <fecha>`.
