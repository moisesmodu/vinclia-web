// Plantillas de las páginas programáticas de PisoClaro. Cada página trae su cifra principal, su tabla y su gráfico,
// calculados con el motor de vivienda para su fila (importe y plazo, o comunidad).
import { tt, type Lang } from '../lib/def';
import type { PaginaProg } from './index';
import type { Bloques } from '../lib/params';
import { r2 } from '../lib/calc/base';
import { hipotecaFija, cuota, gastosCompra, cuotaComunidad, datosITP, datosAJD, ultimo, nombreMes, ingresoNecesario } from '../lib/calc/vivienda';
import { COD_VIV, COMUNIDADES_VIV, nomViv } from '../lib/camposVivienda';

type Ctx = { P: Bloques; lang: Lang; anio: number; filas: Record<string, string>[] };
const eur = (n: number, l: Lang, dec = 0) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
const num = (n: number, l: Lang) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { useGrouping: true }).format(n);
const pc = (n: number, l: Lang) => `${new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { maximumFractionDigits: 3 }).format(n)} %`;
const L = (l: Lang, es: string, ca: string) => (l === 'es' ? es : ca);
const en = (c: string, l: Lang) => `${l === 'es' ? 'en' : 'a'} ${nomViv(c, l)}`;
const PRECIOS = [100000, 150000, 200000, 250000, 300000, 400000, 500000, 750000, 1000000];

export const PLANTILLAS_VIV: Record<string, (fila: Record<string, string>, ctx: Ctx) => PaginaProg> = {
  'viv-cuota-importe'(fila, { P, lang, filas }) {
    const V = P.vivienda;
    const imp = Number(fila.importe), anios = Number(fila.anios);
    const H = V.hipotecas_ine;
    const fija = hipotecaFija(imp, H.tipo_inicial_medio_fijo_pct, anios);
    const media = hipotecaFija(imp, H.tipo_interes_medio_pct, anios);
    const varIni = cuota(imp, H.tipo_inicial_medio_variable_pct, anios * 12);
    const eu = ultimo(V.euribor_12m.serie);
    const otro = anios === 25 ? 30 : 25;
    const otroH = hipotecaFija(imp, H.tipo_interes_medio_pct, otro);
    const ingreso = ingresoNecesario(media.cuota, V.criterios_editoriales_no_normativos.esfuerzo_maximo_cuota_sobre_ingresos_netos_pct);
    const tipos = [2, 2.5, 3, H.tipo_interes_medio_pct, 3.5, 4, 4.5, 5].filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b);
    const mismos = filas.filter((f) => f.anios === fila.anios);
    const i = mismos.indexOf(fila);
    const vecinos = [...mismos.slice(Math.max(0, i - 2), i), ...mismos.slice(i + 1, i + 3), filas.find((f) => f.importe === fila.importe && f.anios !== fila.anios)!].filter(Boolean);
    return {
      titulo: L(lang, `Hipoteca de ${num(imp, lang)} € a ${anios} años: cuota e intereses`, `Hipoteca de ${num(imp, lang)} € a ${anios} anys: quota i interessos`),
      h1: L(lang, `Cuota de una hipoteca de ${num(imp, lang)} € a ${anios} años`, `Quota d’una hipoteca de ${num(imp, lang)} € a ${anios} anys`),
      descripcion: L(lang, `Con el interés medio del INE (${pc(H.tipo_interes_medio_pct, lang)}), ${num(imp, lang)} € a ${anios} años son ${eur(media.cuota, lang, 2)} al mes y ${eur(media.intereses, lang)} de intereses. Cuota fija, variable y tabla por años.`, `Amb l’interès mitjà de l’INE (${pc(H.tipo_interes_medio_pct, lang)}), ${num(imp, lang)} € a ${anios} anys són ${eur(media.cuota, lang, 2)} al mes i ${eur(media.intereses, lang)} d’interessos. Quota fixa, variable i taula per anys.`),
      intro: L(lang,
        `<p>Una hipoteca de <strong>${num(imp, lang)} €</strong> a <strong>${anios} años</strong> con el tipo medio de las hipotecas sobre vivienda que publica el INE (${pc(H.tipo_interes_medio_pct, lang)}, ${nombreMes(H.periodo, 'es')}) sale a <strong>${eur(media.cuota, lang, 2)} al mes</strong>. En total devuelves ${eur(media.total, lang)}: ${eur(media.intereses, lang)} son intereses, un ${pc(r2((media.intereses / imp) * 100), lang)} de lo que pides.</p><p>A ${otro} años la cuota sería de ${eur(otroH.cuota, lang, 2)} y los intereses, ${eur(otroH.intereses, lang)}. Con el criterio habitual de los bancos (cuota de hasta el ${V.criterios_editoriales_no_normativos.esfuerzo_maximo_cuota_sobre_ingresos_netos_pct} % de los ingresos), necesitarías unos ${eur(ingreso, lang)} netos al mes.</p>`,
        `<p>Una hipoteca de <strong>${num(imp, lang)} €</strong> a <strong>${anios} anys</strong> amb el tipus mitjà de les hipoteques sobre habitatge que publica l’INE (${pc(H.tipo_interes_medio_pct, lang)}, ${nombreMes(H.periodo, 'ca')}) surt a <strong>${eur(media.cuota, lang, 2)} al mes</strong>. En total retornes ${eur(media.total, lang)}: ${eur(media.intereses, lang)} són interessos, un ${pc(r2((media.intereses / imp) * 100), lang)} del que demanes.</p><p>A ${otro} anys la quota seria de ${eur(otroH.cuota, lang, 2)} i els interessos, ${eur(otroH.intereses, lang)}. Amb el criteri habitual dels bancs (quota de fins al ${V.criterios_editoriales_no_normativos.esfuerzo_maximo_cuota_sobre_ingresos_netos_pct} % dels ingressos), necessitaries uns ${eur(ingreso, lang)} nets al mes.</p>`),
      tablas: [
        { titulo: tt('Fija, media y variable (tipos medios del INE)', 'Fixa, mitjana i variable (tipus mitjans de l’INE)'), cab: [tt('Tipo', 'Tipus'), tt('Interés', 'Interès'), tt('Cuota', 'Quota'), tt('Intereses totales', 'Interessos totals')], formatos: ['txt', 'pct', 'eur', 'eur0'], filas: [
          [tt('Fija', 'Fixa'), H.tipo_inicial_medio_fijo_pct, fija.cuota, fija.intereses],
          [tt('Media de todas', 'Mitjana de totes'), H.tipo_interes_medio_pct, media.cuota, media.intereses],
          [tt('Variable, primer año', 'Variable, primer any'), H.tipo_inicial_medio_variable_pct, r2(varIni), '—'],
        ] },
        { titulo: tt('Cuota según el interés', 'Quota segons l’interès'), cab: [tt('Interés', 'Interès'), tt('Cuota', 'Quota'), tt('Intereses totales', 'Interessos totals')], formatos: ['pct', 'eur', 'eur0'], filas: tipos.map((t) => { const h = hipotecaFija(imp, t, anios); return [t, h.cuota, h.intereses]; }) },
        { titulo: tt('Cuadro de amortización por años (interés medio)', 'Quadre d’amortització per anys (interès mitjà)'), cab: [tt('Año', 'Any'), tt('Intereses', 'Interessos'), tt('Capital', 'Capital'), tt('Pendiente', 'Pendent')], formatos: ['num0', 'eur', 'eur', 'eur0'], filas: media.cuadro.anios.map((a) => [a.anio, a.interes, a.capital, a.pendiente]) },
      ],
      calc: 'viv-simulador-hipoteca',
      query: { importe: imp, anios },
      cifra: { e: L(lang, 'Cuota mensual', 'Quota mensual'), v: media.cuota, f: 'eur', nota: L(lang, `Al ${pc(H.tipo_interes_medio_pct, lang)}, tipo medio del INE. Euríbor de ${nombreMes(eu.mes, 'es')}: ${pc(eu.valor, lang)}${eu.pendiente_cotejo ? ' (sin cotejar)' : ''}.`, `Al ${pc(H.tipo_interes_medio_pct, lang)}, tipus mitjà de l’INE. Euríbor de ${nombreMes(eu.mes, 'ca')}: ${pc(eu.valor, lang)}${eu.pendiente_cotejo ? ' (sense confrontar)' : ''}.`),
        extra: [{ e: L(lang, 'Intereses totales', 'Interessos totals'), v: media.intereses, f: 'eur0' }, { e: L(lang, 'Total a devolver', 'Total a retornar'), v: media.total, f: 'eur0' }, { e: L(lang, 'Sueldo neto orientativo', 'Sou net orientatiu'), v: ingreso, f: 'eur0' }] },
      grafico: { tipo: 'reparto', titulo: L(lang, `Lo que devuelves por ${num(imp, lang)} € a ${anios} años`, `El que retornes per ${num(imp, lang)} € a ${anios} anys`), formato: 'eur0', partes: [{ e: L(lang, 'Capital', 'Capital'), v: imp }, { e: L(lang, 'Intereses', 'Interessos'), v: media.intereses }] },
      enlaces: vecinos.map((f) => ({ fila: f, texto: L(lang, `${num(+f.importe, lang)} € a ${f.anios} años`, `${num(+f.importe, lang)} € a ${f.anios} anys`) })),
    };
  },

  'viv-gastos-comunidad'(fila, { P, lang, anio, filas }) {
    const V = P.vivienda;
    const c = fila.ccaa;
    const d = datosITP(V, c), a = datosAJD(V, c);
    const g = (p: number, nueva: boolean) => gastosCompra({ precio: p, ccaa: c, nueva, gestoria: 300, tasacion: 350, tipoIndirecto: null }, V);
    const g200 = g(200000, false);
    const especial = c === 'CN' || c === 'CE' || c === 'ML';
    const rank = COD_VIV.map((k) => ({ k, t: gastosCompra({ precio: 200000, ccaa: k, nueva: false, gestoria: 300, tasacion: 350 }, V).total })).sort((x, y) => x.t - y.t);
    const pos = rank.findIndex((x) => x.k === c) + 1;
    const pend = d.pendiente;
    const nuevaOk = !especial && a.tipo != null;
    const n200 = nuevaOk ? g(200000, true) : null;
    return {
      titulo: L(lang, `Gastos de compra de vivienda ${en(c, 'es')} ${anio}: ITP y notaría`, `Despeses de compra d’habitatge ${en(c, 'ca')} ${anio}: ITP i notaria`),
      h1: L(lang, `Gastos de comprar una vivienda ${en(c, 'es')}`, `Despeses de comprar un habitatge ${en(c, 'ca')}`),
      descripcion: L(lang, `Comprar una vivienda usada de 200.000 € ${en(c, 'es')} cuesta ${eur(g200.total, lang)} en impuestos y gastos (${pc(g200.pctSobrePrecio, lang)}): ITP del ${pc(d.tipo!, lang)}, notaría y registro. Tabla de 100.000 a 1 M€.`, `Comprar un habitatge usat de 200.000 € ${en(c, 'ca')} costa ${eur(g200.total, lang)} en impostos i despeses (${pc(g200.pctSobrePrecio, lang)}): ITP del ${pc(d.tipo!, lang)}, notaria i registre. Taula de 100.000 a 1 M€.`),
      intro: L(lang,
        `<p>Además del precio, comprar una vivienda de segunda mano de <strong>200.000 €</strong> ${en(c, 'es')} cuesta <strong>${eur(g200.total, lang)}</strong>: ${eur(g200.itp, lang)} de ITP, ${eur(g200.notaria, lang, 2)} de notaría y ${eur(g200.registro, lang, 2)} de registro, más gestoría, tasación y el IVA de esos honorarios. Es la ${pos}.ª comunidad más barata de ${COD_VIV.length} para ese precio.</p>${nuevaOk ? `<p>Si la vivienda es nueva, en lugar del ITP pagas IVA y un AJD del ${pc(a.tipo!, lang)}: ${eur(n200!.impuestos, lang)} de impuestos por 200.000 €.</p>` : especial ? `<p>En obra nueva ${c === 'CN' ? 'se paga IGIC' : 'se paga IPSI'} en lugar del IVA; su tipo está pendiente de cotejo y no se incluye en las tablas.</p>` : `<p>El AJD de la obra nueva ${en(c, 'es')} está pendiente de cotejar con su boletín: en la calculadora puedes escribir el tipo.</p>`}${pend ? '<p><strong>Dato sin cotejar:</strong> el tipo de ITP sale de comparativas y aún no se ha contrastado con el boletín oficial de la comunidad.</p>' : ''}${COMUNIDADES_VIV[c].foral ? '<p>Régimen foral: consulta la hacienda foral para confirmar el tipo y las reducciones.</p>' : ''}`,
        `<p>A més del preu, comprar un habitatge de segona mà de <strong>200.000 €</strong> ${en(c, 'ca')} costa <strong>${eur(g200.total, lang)}</strong>: ${eur(g200.itp, lang)} d’ITP, ${eur(g200.notaria, lang, 2)} de notaria i ${eur(g200.registro, lang, 2)} de registre, més gestoria, taxació i l’IVA d’aquests honoraris. És la ${pos}a comunitat més barata de ${COD_VIV.length} per a aquest preu.</p>${nuevaOk ? `<p>Si l’habitatge és nou, en lloc de l’ITP pagues IVA i un AJD del ${pc(a.tipo!, lang)}: ${eur(n200!.impuestos, lang)} d’impostos per 200.000 €.</p>` : especial ? `<p>En obra nova ${c === 'CN' ? 'es paga IGIC' : 'es paga IPSI'} en lloc de l’IVA; el seu tipus està pendent de confrontació i no s’inclou a les taules.</p>` : `<p>L’AJD de l’obra nova ${en(c, 'ca')} està pendent de confrontar amb el seu butlletí: a la calculadora pots escriure el tipus.</p>`}${pend ? '<p><strong>Dada sense confrontar:</strong> el tipus d’ITP surt de comparatives i encara no s’ha contrastat amb el butlletí oficial de la comunitat.</p>' : ''}${COMUNIDADES_VIV[c].foral ? '<p>Règim foral: consulta la hisenda foral per confirmar el tipus i les reduccions.</p>' : ''}`),
      tablas: [
        { titulo: tt('Vivienda de segunda mano: gastos según el precio', 'Habitatge de segona mà: despeses segons el preu'), cab: [tt('Precio', 'Preu'), tt('ITP', 'ITP'), tt('Notaría', 'Notaria'), tt('Registro', 'Registre'), tt('Total gastos', 'Total despeses'), tt('Sobre el precio', 'Sobre el preu')], formatos: ['eur0', 'eur0', 'eur', 'eur', 'eur0', 'pct'],
          filas: PRECIOS.map((p) => { const x = g(p, false); return [p, x.itp, x.notaria, x.registro, x.total, x.pctSobrePrecio]; }) },
        ...(nuevaOk ? [{ titulo: tt('Vivienda nueva: IVA, AJD y gastos', 'Habitatge nou: IVA, AJD i despeses'), cab: [tt('Precio', 'Preu'), tt('IVA', 'IVA'), tt('AJD', 'AJD'), tt('Total gastos', 'Total despeses')], formatos: ['eur0', 'eur0', 'eur0', 'eur0'] as any,
          filas: PRECIOS.slice(0, 7).map((p) => { const x = g(p, true); return [p, x.iva, x.ajd, x.total]; }) }] : []),
      ],
      calc: 'viv-gastos-compraventa',
      query: { ccaa: c },
      cifra: { e: L(lang, 'Impuestos y gastos de una vivienda usada de 200.000 €', 'Impostos i despeses d’un habitatge usat de 200.000 €'), v: g200.total, f: 'eur0', nota: L(lang, `${pc(g200.pctSobrePrecio, lang)} sobre el precio · puesto ${pos} de ${COD_VIV.length}${pend ? ' · tipo sin cotejar' : ''}`, `${pc(g200.pctSobrePrecio, lang)} sobre el preu · posició ${pos} de ${COD_VIV.length}${pend ? ' · tipus sense confrontar' : ''}`),
        extra: [{ e: L(lang, 'Tipo de ITP', 'Tipus d’ITP'), v: d.tipo!, f: 'pct' }, ...(nuevaOk ? [{ e: L(lang, 'AJD (obra nueva)', 'AJD (obra nova)'), v: a.tipo!, f: 'pct' as const }] : []), { e: L(lang, 'Notaría y registro', 'Notaria i registre'), v: r2(g200.notaria + g200.registro), f: 'eur' }] },
      grafico: { tipo: 'reparto', titulo: L(lang, `A dónde van los ${eur(g200.total, lang)} de gastos`, `On van els ${eur(g200.total, lang)} de despeses`), formato: 'eur0', partes: [{ e: 'ITP', v: g200.itp }, { e: L(lang, 'Notaría y registro', 'Notaria i registre'), v: r2(g200.notaria + g200.registro) }, { e: L(lang, 'Gestoría y tasación (ejemplo)', 'Gestoria i taxació (exemple)'), v: g200.gestoria + g200.tasacion }, { e: L(lang, 'IVA de los honorarios', 'IVA dels honoraris'), v: g200.ivaHonorarios }] },
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: nomViv(f.ccaa, lang) })),
    };
  },

  'viv-itp-comunidad'(fila, { P, lang, anio, filas }) {
    const V = P.vivienda;
    const c = fila.ccaa;
    const d = datosITP(V, c);
    const C = V.itp_vivienda_usada.comunidades[c];
    const r200 = cuotaComunidad(200000, d);
    const rank = COD_VIV.map((k) => ({ k, v: cuotaComunidad(200000, datosITP(V, k)).cuota })).sort((x, y) => x.v - y.v);
    const pos = rank.findIndex((x) => x.k === c) + 1;
    const escalaTxt = (l: Lang) => d.escala ? d.escala.map((t, i) => `${pc(t.tipo, l)} ${i === 0 ? (l === 'es' ? 'hasta' : 'fins a') : (l === 'es' ? 'hasta' : 'fins a')} ${t.hasta == null ? '∞' : eur(t.hasta, l)}`).join(', ').replace(/hasta ∞|fins a ∞/, l === 'es' ? 'en adelante' : 'en endavant') : d.tramoAlto ? `${pc(d.tipo!, l)}; ${pc(d.tramoAlto.tipo, l)} ${l === 'es' ? 'desde' : 'des de'} ${eur(d.tramoAlto.desde, l)}` : pc(d.tipo!, l);
    const red = (C.reducidos ?? []) as { tipo: number; requisito: string }[];
    let desde = 0;
    return {
      titulo: L(lang, `ITP de vivienda ${en(c, 'es')} ${anio}: tipo y ejemplos`, `ITP d’habitatge ${en(c, 'ca')} ${anio}: tipus i exemples`),
      h1: L(lang, `ITP de la vivienda de segunda mano ${en(c, 'es')}`, `ITP de l’habitatge de segona mà ${en(c, 'ca')}`),
      descripcion: L(lang, `${nomViv(c, 'es')} aplica un ITP de ${escalaTxt('es')} a la vivienda usada: ${eur(r200.cuota, lang)} por 200.000 €. Tipos reducidos y comparativa.`, `${nomViv(c, 'ca')} aplica un ITP de ${escalaTxt('ca')} a l’habitatge usat: ${eur(r200.cuota, lang)} per 200.000 €. Tipus reduïts i comparativa.`),
      intro: L(lang,
        `<p>El ITP de la vivienda de segunda mano ${en(c, 'es')} es de <strong>${escalaTxt('es')}</strong>${d.progresiva ? ', por tramos: cada tipo se aplica solo a la parte del valor que cae en su tramo' : ''}. Por una vivienda de 200.000 € se pagan <strong>${eur(r200.cuota, lang)}</strong>: es la ${pos}.ª más barata de ${COD_VIV.length}.</p>${red.length ? `<p>Tipos reducidos citados: ${red.map((x) => `${pc(x.tipo, 'es')} (${x.requisito})`).join('; ')}. Sus requisitos cambian a menudo y no están cotejados.</p>` : ''}<p>La base es el precio o el valor de referencia de Catastro, el mayor.${d.pendiente ? ' <strong>Dato sin cotejar</strong> con el boletín oficial: compruébalo antes de firmar.' : ''}</p>`,
        `<p>L’ITP de l’habitatge de segona mà ${en(c, 'ca')} és de <strong>${escalaTxt('ca')}</strong>${d.progresiva ? ', per trams: cada tipus s’aplica només a la part del valor que cau en el seu tram' : ''}. Per un habitatge de 200.000 € es paguen <strong>${eur(r200.cuota, lang)}</strong>: és la ${pos}a més barata de ${COD_VIV.length}.</p>${red.length ? `<p>Tipus reduïts citats: ${red.map((x) => `${pc(x.tipo, 'ca')} (${x.requisito})`).join('; ')}. Els requisits canvien sovint i no estan confrontats.</p>` : ''}<p>La base és el preu o el valor de referència del Cadastre, el més alt.${d.pendiente ? ' <strong>Dada sense confrontar</strong> amb el butlletí oficial: comprova-la abans de signar.' : ''}</p>`),
      tablas: [
        { titulo: tt('ITP según el valor de la vivienda', 'ITP segons el valor de l’habitatge'), cab: [tt('Valor', 'Valor'), tt('ITP', 'ITP'), tt('Tipo medio', 'Tipus mitjà'), ...(red.length ? [tt('Con el primer tipo reducido', 'Amb el primer tipus reduït')] : [])], formatos: ['eur0', 'eur0', 'pct', 'eur0'],
          filas: PRECIOS.map((p) => { const x = cuotaComunidad(p, d); return [p, x.cuota, x.tipoEfectivo, ...(red.length ? [r2(p * red[0].tipo / 100)] : [])]; }) },
        ...(d.escala ? [{ titulo: tt('Escala por tramos', 'Escala per trams'), cab: [tt('Tramo', 'Tram'), tt('Tipo', 'Tipus')], formatos: ['txt', 'pct'] as any, filas: d.escala.map((t) => { const f = [{ es: `${eur(desde, 'es')} – ${t.hasta == null ? '∞' : eur(t.hasta, 'es')}`, ca: `${eur(desde, 'ca')} – ${t.hasta == null ? '∞' : eur(t.hasta, 'ca')}` }, t.tipo]; desde = t.hasta ?? desde; return f; }) }] : []),
      ],
      calc: 'viv-itp',
      query: { ccaa: c },
      cifra: { e: L(lang, 'ITP de una vivienda de 200.000 €', 'ITP d’un habitatge de 200.000 €'), v: r200.cuota, f: 'eur0', nota: L(lang, `Tipo ${d.escala ? 'del primer tramo' : 'general'}: ${pc(d.tipo!, lang)}${d.pendiente ? ' · sin cotejar' : ''}`, `Tipus ${d.escala ? 'del primer tram' : 'general'}: ${pc(d.tipo!, lang)}${d.pendiente ? ' · sense confrontar' : ''}`),
        extra: [{ e: L(lang, 'Con 300.000 €', 'Amb 300.000 €'), v: cuotaComunidad(300000, d).cuota, f: 'eur0' }, { e: L(lang, 'Con 500.000 €', 'Amb 500.000 €'), v: cuotaComunidad(500000, d).cuota, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, 'ITP de una vivienda de 200.000 € en cada comunidad', 'ITP d’un habitatge de 200.000 € a cada comunitat'), formato: 'eur0',
        desc: L(lang, `De ${eur(rank[0].v, lang)} ${en(rank[0].k, 'es')} a ${eur(rank[rank.length - 1].v, lang)} ${en(rank[rank.length - 1].k, 'es')}. ${nomViv(c, 'es')}: ${eur(r200.cuota, lang)}.`, `De ${eur(rank[0].v, lang)} ${en(rank[0].k, 'ca')} a ${eur(rank[rank.length - 1].v, lang)} ${en(rank[rank.length - 1].k, 'ca')}. ${nomViv(c, 'ca')}: ${eur(r200.cuota, lang)}.`),
        filas: rank.map((x) => ({ e: nomViv(x.k, lang), v: x.v, act: x.k === c })) },
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: nomViv(f.ccaa, lang) })),
    };
  },
};
