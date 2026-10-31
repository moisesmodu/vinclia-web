import crypto from 'node:crypto';
import { db, hayDb } from '@/lib/db';
import { corregir } from '@/lib/correccio';
import { tasca as tascaDe } from '@/lib/datos';
import { json, error, limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_CARACTERS = 6000;
const DIES_CONSERVACIO = 90;

/** Codis de candidat admesos: VALIDESA_CODIS="V01,V02,…" (una tanda concreta). Sense la variable, V01–V20 (es documenta a VALIDESA.md). */
function codiValid(codi: string): boolean {
  const llista = (process.env.VALIDESA_CODIS ?? '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
  if (llista.length) return llista.includes(codi);
  return /^V(0[1-9]|1\d|20)$/.test(codi);
}
/** El rol professor exigeix VALIDESA_CLAU (variable d'entorn) al cos: sense clau configurada, no s'accepten notes de professor. */
function clauProfessorValida(clau: unknown): boolean {
  const esperada = process.env.VALIDESA_CLAU ?? '';
  const rebuda = String(clau ?? '');
  if (!esperada || esperada.length !== rebuda.length) return false;
  return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(rebuda));
}
const esborrarEl = () => new Date(Date.now() + DIES_CONSERVACIO * 864e5);

/** Prova de validesa: el candidat envia la redacció i el codi; l'app la corregeix i es guarda (90 dies) per comparar amb la nota del professor. */
export async function POST(req: Request) {
  if (!(await limitar(req, 'validesa', 10))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const codi = String(b?.codi ?? '').trim().slice(0, 20).toUpperCase();
  const text = String(b?.text ?? '').trim();
  const t = tascaDe(String(b?.tascaId ?? ''));
  if (!codiValid(codi) || !t || text.split(/\s+/).length < 60) return error('dades');
  if (text.length > MAX_CARACTERS) return error('llarg', 413);
  const professor = b?.notaProfe && typeof b.notaProfe === 'object';
  if (professor && !clauProfessorValida(b?.clau)) return error('clau', 401);
  const r = await corregir(t.nivell, text, t, 'ca');
  const notaApp = { criteris: Object.fromEntries(Object.entries(r.criteris).map(([k, v]) => [k, v.nota])), nota: r.nota, motor: r.motor, errors: r.errors.length };
  if (professor) {
    const notaProfe = Object.fromEntries(['adequacio', 'coherencia', 'correccio', 'riquesa'].map((k) => [k, Math.min(10, Math.max(0, Number((b.notaProfe as Record<string, unknown>)[k]) || 0))]));
    if (hayDb()) await db.validesa.create({ data: { codi, tascaId: t.id, text, notaApp, notaProfe, observacions: b?.observacions ? String(b.observacions).slice(0, 2000) : null, esborrarEl: esborrarEl() } });
    return json({ ok: true, notaApp });
  }
  if (hayDb()) await db.validesa.create({ data: { codi, tascaId: t.id, text, notaApp, esborrarEl: esborrarEl() } });
  return json({ ok: true, notaApp, resultat: r });
}

/** Supressió dels textos: DELETE amb {clau: VALIDESA_CLAU}; per defecte només els caducats (esborrarEl < ara); amb {tot:true}, tots. */
export async function DELETE(req: Request) {
  if (!(await limitar(req, 'validesa-esborrar', 5))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  if (!clauProfessorValida(b?.clau)) return error('clau', 401);
  if (!hayDb()) return error('Base de dades no configurada', 503);
  const r = await db.validesa.deleteMany({ where: b?.tot ? {} : { OR: [{ esborrarEl: { lt: new Date() } }, { esborrarEl: null, creat: { lt: new Date(Date.now() - DIES_CONSERVACIO * 864e5) } }] } });
  return json({ ok: true, esborrats: r.count });
}
