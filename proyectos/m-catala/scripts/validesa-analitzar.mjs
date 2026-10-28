#!/usr/bin/env node
// Analitza la prova de validesa: coincidència app–professor per criteri (±1,5 sobre 10), per redacció (≥ 3 de 4 criteris i mateix apte),
// acord apte/no apte i correlació. Llegeix la taula Validesa (DATABASE_URL) o un JSON (--json=fitxer amb [{codi, notaApp, notaProfe}]).
// Escriu validesa/informe-<data>.md. Llindar de llançament: ≥ 80 % de redaccions coincidents (VALIDESA.md).
import fs from 'node:fs';
const jsonArg = (process.argv.find((a) => a.startsWith('--json=')) ?? '').split('=')[1];
let files = [];
if (jsonArg) files = JSON.parse(fs.readFileSync(jsonArg, 'utf8'));
else {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  files = (await db.validesa.findMany({ where: { notaProfe: { not: null } } })).map((v) => ({ codi: v.codi, notaApp: v.notaApp, notaProfe: v.notaProfe }));
  await db.$disconnect();
}
const CRIT = ['adequacio', 'coherencia', 'correccio', 'riquesa'];
const area = (c) => ((c.adequacio + c.coherencia + c.correccio * 1.5 + c.riquesa) / 4.5) * 4;
const rows = files.map((f) => {
  const a = f.notaApp.criteris ?? f.notaApp, p = f.notaProfe;
  const coinc = CRIT.map((k) => Math.abs((a[k] ?? 0) - (p[k] ?? 0)) <= 1.5);
  const apteA = area(a) >= 25, apteP = area(p) >= 25;
  return { codi: f.codi, coinc, n: coinc.filter(Boolean).length, apteA, apteP, ok: coinc.filter(Boolean).length >= 3 && apteA === apteP, areaA: area(a), areaP: area(p) };
});
const n = rows.length;
const pct = (x) => (n ? Math.round((100 * x) / n) : 0);
const corr = (xs, ys) => { const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length; const num = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0); const den = Math.sqrt(xs.reduce((s, v) => s + (v - mx) ** 2, 0) * ys.reduce((s, v) => s + (v - my) ** 2, 0)); return den ? num / den : 0; };
const informe = `# Informe de validesa · ${new Date().toISOString().slice(0, 10)}

Redaccions amb nota del professor: **${n}**. Coincidents (≥ 3 de 4 criteris ±1,5 i mateix apte): **${rows.filter((r) => r.ok).length} (${pct(rows.filter((r) => r.ok).length)} %)**. Llindar: 80 %. **${n >= 20 && pct(rows.filter((r) => r.ok).length) >= 80 ? 'ES POT LLANÇAR' : n < 20 ? 'FALTEN REDACCIONS' : 'NO ES LLANÇA: cal ajustar el corrector'}**

| Criteri | Coincidència |
|---|---|
${CRIT.map((k, i) => `| ${k} | ${pct(rows.filter((r) => r.coinc[i]).length)} % |`).join('\n')}

Acord apte/no apte: ${pct(rows.filter((r) => r.apteA === r.apteP).length)} %. Correlació de la nota d'àrea (app vs professor): ${n > 2 ? corr(rows.map((r) => r.areaA), rows.map((r) => r.areaP)).toFixed(2) : 'n/d'}.

| Codi | App (/40) | Professor (/40) | Criteris coincidents | Coincideix |
|---|---|---|---|---|
${rows.map((r) => `| ${r.codi} | ${r.areaA.toFixed(1)} | ${r.areaP.toFixed(1)} | ${r.n}/4 | ${r.ok ? 'sí' : 'no'} |`).join('\n')}
`;
fs.mkdirSync('validesa', { recursive: true });
const f = `validesa/informe-${new Date().toISOString().slice(0, 10)}.md`;
fs.writeFileSync(f, informe);
console.log(informe);
console.log(`→ ${f}`);
