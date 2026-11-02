// Prueba en navegador del aviso de recuperación: sale una vez a quien dejó el pago a medias y no vuelve a salir.
// Uso: con `next start` en :3000 → node scripts/prueba-recuperacion.cjs
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const B = "http://localhost:3000";
  let fallos = 0;
  const ok = (c, t) => { console.log(`${c ? "✔" : "✘"} ${t}`); if (!c) fallos++; };
  await p.goto(`${B}/es`);
  ok(!(await p.getByText("Te quedaste a medias").isVisible()), "Sin pago a medias no hay aviso");
  await p.evaluate(() => localStorage.setItem("nee-pago-pendiente", JSON.stringify({ plan: "pack", ts: Date.now() - 10 * 60 * 1000 })));
  await p.goto(`${B}/es/guias/empadronamiento`);
  await p.getByText("Te quedaste a medias").waitFor({ timeout: 5000 }).catch(() => {});
  ok(await p.getByText("Te quedaste a medias").isVisible(), "Con un pago a medias aparece el aviso");
  const href = await p.getByRole("link", { name: "Retomar el pago" }).getAttribute("href");
  ok(href === "/es/precios?plan=pack&desde=recuperacion", `El aviso lleva al mismo plan (${href})`);
  await p.goto(`${B}/es`);
  await p.waitForTimeout(800);
  ok(!(await p.getByText("Te quedaste a medias").isVisible()), "El aviso no se repite (máximo uno)");
  await p.goto(`${B}/es/guias/empadronamiento`);
  ok(await p.getByRole("link", { name: "Desbloquear las 8 guías" }).isVisible(), "La guía gratis termina con la oferta");
  await b.close();
  console.log(fallos ? `${fallos} FALLOS` : "Todo correcto");
  process.exit(fallos ? 1 : 0);
})();
