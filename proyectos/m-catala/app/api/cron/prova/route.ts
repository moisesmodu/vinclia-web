import { db, hayDb } from '@/lib/db';
import { json, error } from '@/lib/http';
import { enviarCorreo, hayCorreo } from '@/lib/correo';
import { enllacBaixa } from '@/lib/auth';
import { urlBase } from '@/lib/datos';

export const dynamic = 'force-dynamic';

/** Tasca diària (Vercel Cron, vegeu vercel.json): correus de la prova de 7 dies. Dia 5: «et queden 2 dies». Dia 8: «la prova ha acabat».
 *  Cada correu s'envia una sola vegada (camps correuProva5/correuProva8). Protegit amb CRON_SECRET (capçalera Authorization: Bearer). */
export async function GET(req: Request) {
  const clau = process.env.CRON_SECRET;
  if (!clau || req.headers.get('authorization') !== `Bearer ${clau}`) return error('no autoritzat', 401);
  if (!hayDb()) return json({ ok: true, enviats: 0, motiu: 'sense base de dades' });
  const ara = Date.now(); const dia = 86400000; const base = urlBase();
  const aviso = await db.usuari.findMany({ where: { correuProva5: null, provaFins: { gt: new Date(ara + 1.5 * dia), lte: new Date(ara + 2.5 * dia) }, subscripcioEstat: null }, take: 200 });
  const acabats = await db.usuari.findMany({ where: { correuProva8: null, provaFins: { lt: new Date(ara), gt: new Date(ara - 30 * dia) }, subscripcioEstat: null }, take: 200 });
  let enviats = 0;
  for (const u of aviso) {
    const ca = u.idioma !== 'es';
    const text = ca
      ? `Hola,\n\nEt queden 2 dies de prova a Aprova amb tot obert (sessió completa, simulacres, correccions i oral). Després, la minisessió i el repàs dels errors continuen sent gratis.\n\nSi vols continuar amb tot fins a la teva prova, el passi de convocatòria costa 24,99 € un sol cop: ${base}/ca/preus\n\nAprova\n\nPer no rebre més avisos: ${enllacBaixa(base, u.email)}`
      : `Hola,\n\nTe quedan 2 días de prueba en Aprova con todo abierto (sesión completa, simulacros, correcciones y oral). Después, la minisesión y el repaso de errores siguen siendo gratis.\n\nSi quieres seguir con todo hasta tu prueba, el pase de convocatoria cuesta 24,99 € una sola vez: ${base}/es/preus\n\nAprova\n\nPara no recibir más avisos: ${enllacBaixa(base, u.email)}`;
    if (!hayCorreo() || await enviarCorreo(u.email, ca ? 'Et queden 2 dies de prova' : 'Te quedan 2 días de prueba', text)) { await db.usuari.update({ where: { id: u.id }, data: { correuProva5: new Date() } }); enviats++; }
  }
  for (const u of acabats) {
    const ca = u.idioma !== 'es';
    const text = ca
      ? `Hola,\n\nLa prova de 7 dies ha acabat. La minisessió de 2 minuts i el repàs dels teus errors continuen gratis: ${base}/ca/avui\n\nPer tornar a tenir la sessió completa, els simulacres, les correccions i l'oral fins a la teva prova: passi de convocatòria, 24,99 € un sol cop, o 9,99 € al mes. ${base}/ca/preus\n\nAprova\n\nPer no rebre més avisos: ${enllacBaixa(base, u.email)}`
      : `Hola,\n\nLa prueba de 7 días ha terminado. La minisesión de 2 minutos y el repaso de tus errores siguen gratis: ${base}/es/avui\n\nPara volver a tener la sesión completa, los simulacros, las correcciones y el oral hasta tu prueba: pase de convocatoria, 24,99 € una sola vez, o 9,99 € al mes. ${base}/es/preus\n\nAprova\n\nPara no recibir más avisos: ${enllacBaixa(base, u.email)}`;
    if (!hayCorreo() || await enviarCorreo(u.email, ca ? 'La teva prova ha acabat' : 'Tu prueba ha terminado', text)) { await db.usuari.update({ where: { id: u.id }, data: { correuProva8: new Date() } }); enviats++; }
  }
  return json({ ok: true, enviats, avis: aviso.length, acabats: acabats.length });
}
