import { db, hayDb } from '@/lib/db';
import { corregir } from '@/lib/correccio';
import { tasca as tascaDe } from '@/lib/datos';
import { json, error, limitar } from '@/lib/http';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
/** Prova de validesa: el candidat envia la redacció i el codi; l'app la corregeix i es guarda per comparar amb la nota del professor. */
export async function POST(req: Request) {
  if (!limitar(req, 'validesa', 10)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const codi = String(b?.codi ?? '').trim().slice(0, 20);
  const text = String(b?.text ?? '').trim();
  const t = tascaDe(String(b?.tascaId ?? ''));
  if (!/^V\d{2}$/i.test(codi) || !t || text.split(/\s+/).length < 60) return error('dades');
  const r = await corregir(t.nivell, text, t, 'ca');
  const notaApp = { criteris: Object.fromEntries(Object.entries(r.criteris).map(([k, v]) => [k, v.nota])), nota: r.nota, motor: r.motor, errors: r.errors.length };
  if (b?.notaProfe && typeof b.notaProfe === 'object') {
    if (hayDb()) await db.validesa.create({ data: { codi: codi.toUpperCase(), tascaId: t.id, text, notaApp, notaProfe: b.notaProfe, observacions: b?.observacions ? String(b.observacions).slice(0, 2000) : null } });
    return json({ ok: true, notaApp });
  }
  if (hayDb()) await db.validesa.create({ data: { codi: codi.toUpperCase(), tascaId: t.id, text, notaApp } });
  return json({ ok: true, notaApp, resultat: r });
}
