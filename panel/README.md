# Panel de la cartera

Web estática (Next.js, exportación `out/`) que muestra el estado de todos los proyectos: camino hacia el objetivo,
rentabilidad, últimas acciones, mejoras, competencia, código abierto reutilizable, prompt de cada sesión y los
documentos del plan (`CARTERA.md`, `VIABILIDAD.md`, `SESIONES.md`, `PROMPTS-SESIONES.md`).

## De dónde salen los datos
- `data/cartera.json`: objetivos, escenario, costes fijos, decisiones pendientes de Moisés, reglas.
- `data/proyectos.json`: un objeto por proyecto. **Cada sesión de proyecto lo actualiza al terminar** (estado,
  acciones, ingresos, costes, clientes, enlaces, mejoras, competidores, repos, hallazgos, próximos pasos, paraMoises).
- Los prompts se leen de `../PROMPTS-SESIONES.md` (bloque de código que sigue a `proyectos/<clave>`); los documentos,
  de la raíz del repositorio. No se duplican.

## Desplegar en Vercel (una vez)
1. vercel.com → Add New → Project → importar `moisesmodu/vinclia-web`.
2. **Root Directory: `panel`**. Framework: Next.js. Deja activado "Include source files outside of the Root Directory"
   (necesario para leer los `.md` de la raíz).
3. Branch de producción: `claude/estrategia-ingresos-recurrentes-tx0rvw` (o `main` cuando se fusione).
4. Deploy. Cada push a esa rama vuelve a publicar el panel.

## En local
```bash
cd panel && npm install && npm run dev   # http://localhost:3000
```

## Mejoras previstas del panel
- Ingresos reales desde Stripe (webhook → `ingresosMes` por proyecto) en lugar de edición manual.
- Gráfica mensual de ingresos y costes a partir de `acciones` con importe.
- Aviso por correo semanal con lo que le toca a Moisés.

## Investigación sobre el propio panel (23/10/2026)
- Competencia: Baremetrics (75–749 $/mes), ChartMogul (gratis hasta ~10k MRR), ProfitWell (gratis), TrustMRR y las
  páginas "open" de Indie Hackers. Ninguna modela una cartera de 5–10 microproductos con costes, acciones y prompts.
- Código reutilizable: `nextjs/saas-starter` (MIT; webhooks de Stripe), `tremorlabs/template-dashboard-oss` (Apache-2.0;
  tarjetas y gráficos), `sdorra/content-collections` (MIT; Markdown tipado), `openrevenueorg/openrevenueorg` (MIT; lector de
  ingresos de Stripe/Paddle/LemonSqueezy para una página /open verificada).
- Hallazgos: Stripe no da el MRR hecho, hay que recorrer las suscripciones activas; Vercel Hobby prohíbe uso comercial
  y limita los cron a uno al día, así que el panel va en el plan Pro ya previsto o con cron de GitHub Actions.
- Siguientes mejoras: ingresos por fuente (Stripe por producto, portales de juegos, DevEx) con captura diaria a Neon;
  vista pública /open solo con cifras agregadas, como activo de marketing "build in public"; el resto tras contraseña.

## Copia publicada en claude.ai
`npm run instantanea` (desde `panel/`) genera `panel/instantanea/panel.html`, una versión de un solo archivo con navegación por
`#ancla`, para publicarla como página en claude.ai cuando Vercel no esté disponible. Es una copia fija: la versión viva es la de Vercel.
