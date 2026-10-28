'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area, Idioma, Item } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { useEstat } from '@/lib/estat';
import { carregarBanc, type BancClient } from '@/lib/client/banc';
import { barrejar } from '@/lib/motor/avaluar';
import { novaTargeta, pendents, revisar } from '@/lib/motor/repas';
import { registrarDia, avuiISO } from '@/lib/motor/ratxa';
import { confiancaPunts } from '@/lib/motor/diagnostic';
import { sessioDe } from '@/lib/motor/pla';
import puntsJson from '@/config/punts.json';
import ItemVista from './ItemVista';

type Mode = 'buits' | 'transformacio' | 'castellanismes' | 'dictat' | 'lexic' | 'repas' | 'mini' | 'sessio';

/** Sessió de pràctica: per tipus, repàs espaiat (FSRS), minisessió de 2 minuts o la sessió del pla d'avui (40/40/20). */
export default function Practica({ idioma, mode }: { idioma: Idioma; mode: Mode }) {
  const d = t(idioma).practica;
  const [estat, actualitzar] = useEstat();
  const [banc, setBanc] = useState<BancClient | null>(null);
  const [cua, setCua] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [encerts, setEncerts] = useState(0);
  const [inici] = useState(Date.now());
  const perfil = estat?.perfil;

  useEffect(() => { if (perfil) carregarBanc(perfil.nivell).then(setBanc); }, [perfil]);

  useEffect(() => {
    if (!banc || !estat || cua) return;
    const items = banc.items.filter((x) => x.area === 'us');
    const perId = new Map(items.map((x) => [x.id, x]));
    const llavor = `${avuiISO()}-${mode}-${estat.respostes.length}`;
    const pend = pendents(estat.targetes).map((tg) => perId.get(tg.itemId)).filter((x): x is Item => !!x);
    const vistos = new Set(estat.respostes.slice(-200).map((r) => r.itemId));
    const nous = (filtre: (x: Item) => boolean) => barrejar(items.filter((x) => filtre(x) && !vistos.has(x.id)), llavor).concat(barrejar(items.filter((x) => filtre(x) && vistos.has(x.id)), llavor + 'b'));
    const punts = puntsJson.punts.filter((p) => p.nivells.includes(perfil!.nivell)) as { id: string; nivells: string[]; pes: number; nom: { ca: string; es: string } }[];
    const conf = confiancaPunts(estat.respostes, punts as never).sort((a, b) => a.confianca - b.confianca);
    const feblesIds = conf.slice(0, 4).map((c) => c.punt);
    let q: Item[] = [];
    if (mode === 'repas') q = pend.slice(0, 20);
    else if (mode === 'mini') q = [...pend.slice(0, 2), ...nous((x) => feblesIds.includes(x.punt)).slice(0, 3)];
    else if (mode === 'sessio') {
      const s = sessioDe(estat.pla);
      const minuts = s?.minuts ?? perfil!.minuts;
      const nRepas = Math.max(3, Math.round(minuts * 0.4 * 1.3)), nFeble = Math.max(4, Math.round(minuts * 0.4 * 1.3));
      const areaFeble: Area = estat.pla?.areaFeble ?? 'us';
      const feble = areaFeble === 'us' ? nous((x) => feblesIds.includes(x.punt)) : nous((x) => x.tipus === (areaFeble === 'escrit' ? 'transformacio' : 'buits'));
      q = [...pend.slice(0, nRepas), ...feble.slice(0, nFeble)];
      if (q.length < nRepas + nFeble) q = q.concat(nous(() => true).filter((x) => !q.includes(x)).slice(0, nRepas + nFeble - q.length));
    } else q = nous((x) => x.tipus === mode).slice(0, 10);
    const unics = Array.from(new Map(q.map((x) => [x.id, x])).values());
    setCua(unics);
  }, [banc, estat, cua, mode, perfil]);

  const item = cua?.[i];
  const idiomaExpl = perfil?.idiomaExpl ?? idioma;

  const registrar = (correcte: boolean) => {
    if (!item) return;
    if (correcte) setEncerts((n) => n + 1);
    actualitzar((e) => {
      const ara = new Date();
      const targetes = { ...e.targetes };
      const existent = targetes[item.id];
      if (existent) targetes[item.id] = revisar(existent, correcte, ara);
      else if (!correcte) targetes[item.id] = revisar(novaTargeta(item.id, item.punt, ara), false, ara);
      return { ...e, targetes, respostes: [...e.respostes.slice(-1500), { itemId: item.id, punt: item.punt, area: item.area, correcte, data: ara.toISOString(), dificultat: item.dificultat }], ratxa: registrarDia(e.ratxa) };
    });
  };

  const acabar = () => {
    actualitzar((e) => ({ ...e, sessions: [...e.sessions.slice(-400), { data: avuiISO(), tipus: mode, minuts: Math.max(1, Math.round((Date.now() - inici) / 60000)) }] }));
    setI((cua?.length ?? 0));
  };

  const resum = useMemo(() => cua && i >= cua.length, [cua, i]);

  if (!estat) return <p className="contenedor py-10 text-suave">{t(idioma).comu.carregant}</p>;
  if (!perfil) return <div className="contenedor py-10"><p>{t(idioma).avui.senseDiag}</p><Link className="boton mt-4" href={`/${idioma}/comencar`}>{t(idioma).nav.comencar}</Link></div>;
  if (!cua) return <p className="contenedor py-10 text-suave">{t(idioma).comu.carregant}</p>;
  if (!cua.length) return <div className="contenedor py-10"><p>{mode === 'repas' ? d.resAPendent : d.limit}</p><div className="mt-4 flex gap-2"><Link className="boton-sec" href={`/${idioma}/practica`}>{t(idioma).nav.practica}</Link>{!banc?.premium ? <Link className="boton" href={`/${idioma}/preus`}>{t(idioma).avui.veurePreus}</Link> : null}</div></div>;

  if (resum) return (
    <div className="contenedor py-8">
      <div className="tarjeta text-center">
        <p className="text-sm text-suave">{d.resultat}</p>
        <p className="titulos mt-1 text-4xl font-bold">{encerts} / {cua.length}</p>
        <p className="mt-1 text-sm text-suave">{d.encerts}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link className="boton" href={`/${idioma}/avui`}>{t(idioma).nav.avui}</Link>
          <Link className="boton-sec" href={`/${idioma}/practica`}>{t(idioma).nav.practica}</Link>
          <Link className="boton-sec" href={`/${idioma}/mapa`}>{t(idioma).nav.mapa}</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="contenedor py-6">
      <div className="mb-3 flex items-center justify-between text-sm text-suave">
        <span>{d.tipus[mode] ?? (mode === 'mini' ? t(idioma).avui.mini : t(idioma).avui.sessio(perfil.minuts))}</span>
        <span>{i + 1} / {cua.length}</span>
      </div>
      <div className="barra mb-4"><span style={{ width: `${(100 * i) / cua.length}%` }} /></div>
      {item && banc ? <ItemVista key={item.id} item={item} regles={banc.regles} idioma={idioma} idiomaExpl={idiomaExpl} onResultat={(a) => registrar(a.correcte)} onSeguent={() => (i + 1 < cua.length ? setI(i + 1) : acabar())} etiquetaSeguent={i + 1 < cua.length ? d.seguent : d.acabar} /> : null}
    </div>
  );
}
