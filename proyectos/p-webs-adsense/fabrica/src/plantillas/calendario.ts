// Páginas «Calendario laboral 2027» de NetoClaro: una por comunidad autónoma y una por municipio con sus dos
// festivos locales publicados. Cada página calcula sus días laborables, sus puentes y la comparación con 2026,
// y pinta un calendario de 12 meses en HTML (sin JavaScript) con los festivos marcados.
import { tt, type Lang, type T, type Tabla } from '../lib/def';
import type { Plantilla } from './index';
import { festivosLugar, resumenAnio, descansos, diaSemana, esFinde, lugarComunidad, lugarMunicipio, CALENDARIOS, type Festivo, type Lugar } from '../lib/calc/calendario';
import { sumarDias } from '../lib/calc/base';
import { num, L, de as deBase } from './util';
// Texto íntegro de los datos, con las fuentes, notas y «verificado» (el empaquetado quita esos campos del JSON)
import raw2027 from '../../params/es/2027/calendario.json?raw';
import raw2026 from '../../params/es/2026/calendario.json?raw';

const META: Record<number, any> = { 2027: JSON.parse(raw2027), 2026: JSON.parse(raw2026) };
const ANIO = 2027;

const MESES: T[] = ['enero|gener', 'febrero|febrer', 'marzo|març', 'abril|abril', 'mayo|maig', 'junio|juny', 'julio|juliol', 'agosto|agost', 'septiembre|setembre', 'octubre|octubre', 'noviembre|novembre', 'diciembre|desembre'].map((x) => { const [es, ca] = x.split('|'); return { es, ca }; });
const DIAS: T[] = ['lunes|dilluns', 'martes|dimarts', 'miércoles|dimecres', 'jueves|dijous', 'viernes|divendres', 'sábado|dissabte', 'domingo|diumenge'].map((x) => { const [es, ca] = x.split('|'); return { es, ca }; });
const INI: T[] = ['L|Dl', 'M|Dt', 'X|Dc', 'J|Dj', 'V|Dv', 'S|Ds', 'D|Dg'].map((x) => { const [es, ca] = x.split('|'); return { es, ca }; });
const ORIGEN: Record<string, T> = { nacional: tt('Nacional', 'Nacional'), sustituible: tt('Nacional sustituible', 'Nacional substituïble'), autonomico: tt('Autonómico', 'Autonòmic'), local: tt('Local', 'Local') };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «viernes 1 de enero» / «divendres 1 de gener». */
export function fechaLarga(iso: string, lang: Lang, conDia = true) {
  const d = +iso.slice(8, 10), m = MESES[+iso.slice(5, 7) - 1][lang];
  const mes = lang === 'ca' && /^[aeiou]/.test(m) ? `d’${m}` : `de ${m}`;
  return `${conDia ? DIAS[diaSemana(iso)][lang] + ' ' : ''}${d} ${mes}`;
}

/** Calendario de 12 meses: una tabla por mes con los festivos marcados por su origen y una leyenda. */
export function calendarioHTML(anio: number, festivos: Festivo[], lang: Lang, titulo: string): string {
  const mapa = new Map(festivos.map((f) => [f.f, f]));
  const usados = new Set(festivos.map((f) => f.o));
  let h = `<section class="cal" aria-labelledby="cal-t"><h2 id="cal-t">${esc(titulo)}</h2>`;
  h += `<ul class="cal-ley">${['nacional', 'sustituible', 'autonomico', 'local'].filter((o) => usados.has(o)).map((o) => `<li><i class="cal-m cal-${o}" aria-hidden="true"></i>${esc(L(lang, 'Festivo', 'Festiu'))} ${esc(ORIGEN[o][lang].toLowerCase())}</li>`).join('')}<li><i class="cal-m cal-fin" aria-hidden="true"></i>${esc(L(lang, 'Sábado o domingo', 'Dissabte o diumenge'))}</li></ul>`;
  h += '<div class="cal-meses">';
  for (let m = 0; m < 12; m++) {
    const primero = `${anio}-${String(m + 1).padStart(2, '0')}-01`;
    const dias = new Date(Date.UTC(anio, m + 1, 0)).getUTCDate();
    const nf = festivos.filter((f) => f.f.startsWith(primero.slice(0, 8))).length;
    h += `<table class="cal-mes"><caption>${mayus(MESES[m][lang])}${nf ? ` <span class="cal-n">· ${nf} ${lang === 'es' ? (nf === 1 ? 'festivo' : 'festivos') : (nf === 1 ? 'festiu' : 'festius')}</span>` : ''}</caption>`;
    h += `<thead><tr>${INI.map((x, i) => `<th scope="col"><abbr title="${DIAS[i][lang]}">${x[lang]}</abbr></th>`).join('')}</tr></thead><tbody><tr>`;
    const hueco = diaSemana(primero);
    for (let i = 0; i < hueco; i++) h += '<td></td>';
    for (let d = 1; d <= dias; d++) {
      const iso = `${primero.slice(0, 8)}${String(d).padStart(2, '0')}`;
      const col = (hueco + d - 1) % 7;
      if (col === 0 && d > 1) h += '</tr><tr>';
      const f = mapa.get(iso);
      if (f) h += `<td class="cal-f cal-${f.o}" title="${esc(f.n[lang])}">${d}<span class="vh">: ${esc(f.n[lang])} (${esc(ORIGEN[f.o]?.[lang].toLowerCase() ?? f.o)})</span></td>`;
      else h += `<td${col >= 5 ? ' class="cal-fin"' : ''}>${d}</td>`;
    }
    const resto = (7 - ((hueco + dias) % 7)) % 7;
    for (let i = 0; i < resto; i++) h += '<td></td>';
    h += '</tr></tbody></table>';
  }
  return h + '</div></section>';
}

// Nombres que llevan artículo: «en la Comunidad de Madrid», «al País Basc», «de les Illes Balears»
const ART: Record<string, string> = { 'Comunidad de Madrid': 'la', 'Región de Murcia': 'la', 'País Vasco': 'el', 'Comunitat Valenciana': 'la', 'Illes Balears': 'las', 'Comunitat de Madrid': 'la', 'Regió de Múrcia': 'la', 'País Basc': 'el' };
const ART_CA: Record<string, string> = { 'Illes Balears': 'les', 'Comunitat Valenciana': 'la' };
const art = (x: string, lang: Lang) => (lang === 'ca' ? ART_CA[x] ?? ART[x] : ART[x]);
export const en = (x: string, lang: Lang) => { const a = art(x, lang); return lang === 'es' ? `en ${a ? a + ' ' : ''}${x}` : a === 'el' ? `al ${x}` : `a ${a ? a + ' ' : ''}${x}`; };
export const de = (x: string, lang: Lang) => { const a = art(x, lang); return !a ? deBase(x, lang) : a === 'el' ? `del ${x}` : `de ${a} ${x}`; };

const fuenteHTML = (f: { nombre: string; url: string }) => `<a href="${esc(f.url)}" rel="noopener">${esc(f.nombre)}</a>`;

export const PLANTILLAS_CALENDARIO: Record<string, Plantilla> = {
  'calendario-laboral'(fila, { lang, filas }) {
    const esMun = fila.tipo === 'municipio';
    const meta = META[ANIO];
    const mun = esMun ? meta.municipios.find((m: any) => m.id === fila.id) : null;
    const cc: string = esMun ? mun.ccaa : fila.id;
    const com = meta.comunidades[cc];
    const lugar: Lugar = esMun ? lugarMunicipio(fila.id) : lugarComunidad(cc);
    const n: string = (esMun ? mun.n : com.n)[lang];
    const nCom: string = com.n[lang];
    const { festivos } = festivosLugar(lugar, ANIO);
    const r = resumenAnio(lugar, ANIO);
    const { puentes, largos } = descansos(lugar, ANIO);
    const locales = festivos.filter((f) => f.o === 'local');
    const propios = festivos.filter((f) => f.o === 'autonomico');
    const finde = festivos.filter((f) => esFinde(f.f));
    // Comparación con 2026: festivos de la comunidad (los locales de 2026 no están en los datos)
    const lugarCom = lugarComunidad(cc);
    const c27 = resumenAnio(lugarCom, ANIO);
    const tiene26 = !!CALENDARIOS[2026].comunidades[cc] && CALENDARIOS[2026].comunidades[cc].completo !== false;
    const c26 = tiene26 ? resumenAnio(lugarCom, 2026) : null;
    const meta26 = META[2026].comunidades[cc];
    const dif = c26 ? c27.laborables - c26.laborables : 0;
    const p26 = tiene26 ? descansos(lugarCom, 2026).puentes.length : 0;
    const pCom27 = descansos(lugarCom, ANIO).puentes.length;
    // Laborables por mes (gráfico)
    const porMes = MESES.map((_, m) => {
      const ini = `${ANIO}-${String(m + 1).padStart(2, '0')}-01`;
      let lab = 0;
      for (let d = ini; d.slice(5, 7) === ini.slice(5, 7); d = sumarDias(d, 1)) if (!esFinde(d) && !festivos.some((f) => f.f === d)) lab++;
      return lab;
    });
    const minMes = porMes.indexOf(Math.min(...porMes)), maxMes = porMes.indexOf(Math.max(...porMes));
    const deN = de(n, lang), enN = en(n, lang);
    const lista = (fs: Festivo[]) => fs.map((f) => `${f.n[lang]} (${fechaLarga(f.f, lang)})`).join(lang === 'es' ? '; ' : '; ');
    const pTxt = puentes.length ? puentes.map((p) => fechaLarga(p.dia, lang)).join(lang === 'es' ? ' y ' : ' i ') : '';
    const signo = (x: number) => (x > 0 ? `+${x}` : String(x));
    const frase26 = !c26 ? '' : dif === 0
      ? L(lang, `Son los mismos días laborables de comunidad que en 2026 (${c26.laborables}).`, `Són els mateixos dies laborables de comunitat que el 2026 (${c26.laborables}).`)
      : L(lang, `Frente a 2026 hay ${Math.abs(dif)} ${Math.abs(dif) === 1 ? 'día laborable' : 'días laborables'} ${dif > 0 ? 'más' : 'menos'} con los festivos de la comunidad (${c26.laborables} en 2026 y ${c27.laborables} en 2027).`, `Respecte al 2026 hi ha ${Math.abs(dif)} ${Math.abs(dif) === 1 ? 'dia laborable' : 'dies laborables'} ${dif > 0 ? 'més' : 'menys'} amb els festius de la comunitat (${c26.laborables} el 2026 i ${c27.laborables} el 2027).`);

    const intro = esMun
      ? L(lang,
        `<p>En ${n} hay <strong>${r.laborables} días laborables en 2027</strong> de lunes a viernes. Se restan ${r.festivosSemana} festivos entre semana de los ${r.total} del año: los ${festivos.length - locales.length} de ${nCom} y las dos fiestas locales, ${lista(locales)}.${finde.length ? ` ${finde.length === 1 ? 'Uno cae' : `${finde.length} caen`} en fin de semana y no ${finde.length === 1 ? 'resta' : 'restan'}.` : ''}</p><p>${puentes.length ? `El calendario deja ${puentes.length} ${puentes.length === 1 ? 'puente' : 'puentes'} (${pTxt})` : 'El calendario no deja ningún puente de un solo día'} y ${largos.length} fines de semana largos. ${frase26}</p>`,
        `<p>A ${n} hi ha <strong>${r.laborables} dies laborables el 2027</strong> de dilluns a divendres. Es resten ${r.festivosSemana} festius entre setmana dels ${r.total} de l’any: els ${festivos.length - locales.length} ${de(nCom, lang)} i les dues festes locals, ${lista(locales)}.${finde.length ? ` ${finde.length === 1 ? 'Un cau' : `${finde.length} cauen`} en cap de setmana i no ${finde.length === 1 ? 'resta' : 'resten'}.` : ''}</p><p>${puentes.length ? `El calendari deixa ${puentes.length} ${puentes.length === 1 ? 'pont' : 'ponts'} (${pTxt})` : 'El calendari no deixa cap pont d’un sol dia'} i ${largos.length} caps de setmana llargs. ${frase26}</p>`)
      : L(lang,
        `<p>${mayus(enN)} hay <strong>${r.laborables} días laborables en 2027</strong> de lunes a viernes, sin contar las dos fiestas locales de cada municipio. De sus ${r.total} festivos, ${r.festivosSemana} caen entre semana y ${r.festivosFinde} en sábado o domingo. Los propios de la comunidad son ${lista(propios) || 'ninguno'}.</p><p>${puentes.length ? `Hay ${puentes.length} ${puentes.length === 1 ? 'puente' : 'puentes'} (${pTxt})` : 'No hay ningún puente de un solo día'} y ${largos.length} fines de semana largos. ${frase26}</p>`,
        `<p>${mayus(enN)} hi ha <strong>${r.laborables} dies laborables el 2027</strong> de dilluns a divendres, sense comptar les dues festes locals de cada municipi. Dels seus ${r.total} festius, ${r.festivosSemana} cauen entre setmana i ${r.festivosFinde} en dissabte o diumenge. Els propis de la comunitat són ${lista(propios) || 'cap'}.</p><p>${puentes.length ? `Hi ha ${puentes.length} ${puentes.length === 1 ? 'pont' : 'ponts'} (${pTxt})` : 'No hi ha cap pont d’un sol dia'} i ${largos.length} caps de setmana llargs. ${frase26}</p>`);

    // Fuentes y estado de verificación, visibles en la página
    const fuentes: string[] = [`<li>${fuenteHTML(meta.fuente)}</li>`, `<li>${fuenteHTML(com.fuente)}${com.verificado ? '' : ` <em>(${L(lang, 'contrastado en fuentes secundarias', 'contrastat en fonts secundàries')})</em>`}</li>`];
    if (esMun) fuentes.push(`<li>${fuenteHTML(mun.fuente)}${mun.verificado ? '' : ` <em>(${L(lang, 'pendiente de contrastar con el boletín', 'pendent de contrastar amb el butlletí')})</em>`}</li>`);
    if (meta26) fuentes.push(`<li>${L(lang, 'Comparación con 2026', 'Comparació amb el 2026')}: ${fuenteHTML(meta26.fuente)}</li>`);
    const notas = [com.nota, esMun ? mun.nota : ''].filter(Boolean);
    const sinVerificar = !com.verificado || (esMun && !mun.verificado);
    const bloque = calendarioHTML(ANIO, festivos, lang, L(lang, `Calendario laboral 2027 ${deN}, mes a mes`, `Calendari laboral 2027 ${deN}, mes a mes`))
      + `<section class="cal-fuentes" aria-labelledby="cal-fu"><h2 id="cal-fu">${L(lang, 'Fuentes oficiales y estado de los datos', 'Fonts oficials i estat de les dades')}</h2>`
      + (sinVerificar ? `<p class="aviso-prov">${L(lang, 'Parte de estos festivos solo los hemos podido contrastar en fuentes secundarias que citan el boletín oficial. Compruébalos en el boletín antes de planificar algo importante.', 'Part d’aquests festius només els hem pogut contrastar en fonts secundàries que citen el butlletí oficial. Comprova’ls al butlletí abans de planificar res important.')}</p>` : '')
      + (notas.length ? `<p>${notas.map((x) => esc(x)).join(' ')}</p>` : '')
      + `<ul class="fuentes">${fuentes.join('')}</ul></section>`;

    const filaF = (f: Festivo) => [f.f, DIAS[diaSemana(f.f)], f.n, ORIGEN[f.o] ?? tt(f.o, f.o)];
    const tablas: Tabla[] = [
      { titulo: { es: `Festivos de 2027 ${de(n, 'es')}`, ca: `Festius del 2027 ${de(n, 'ca')}` }, cab: [tt('Fecha', 'Data'), tt('Día', 'Dia'), tt('Festivo', 'Festiu'), tt('Origen', 'Origen')], formatos: ['fecha', 'txt', 'txt', 'txt'], filas: festivos.map(filaF) },
    ];
    if (puentes.length) tablas.push({ titulo: tt('Puentes de 2027: el día que hay que pedir', 'Ponts del 2027: el dia que cal demanar'), cab: [tt('Día puente', 'Dia pont'), tt('Desde', 'Des de'), tt('Hasta', 'Fins a'), tt('Días seguidos', 'Dies seguits'), tt('Festivo', 'Festiu')], formatos: ['fecha', 'fecha', 'fecha', 'num0', 'txt'], filas: puentes.map((p) => [p.dia, p.desde, p.hasta, p.dias, { es: p.festivos.map((f) => f.n.es).join(', '), ca: p.festivos.map((f) => f.n.ca).join(', ') }]) });
    if (largos.length) tablas.push({ titulo: tt('Fines de semana largos sin pedir días', 'Caps de setmana llargs sense demanar dies'), cab: [tt('Desde', 'Des de'), tt('Hasta', 'Fins a'), tt('Días seguidos', 'Dies seguits'), tt('Festivo', 'Festiu')], formatos: ['fecha', 'fecha', 'num0', 'txt'], filas: largos.map((b) => [b.desde, b.hasta, b.dias, { es: b.festivos.map((f) => f.n.es).join(', '), ca: b.festivos.map((f) => f.n.ca).join(', ') }]) });
    if (c26) tablas.push({ titulo: { es: `${com.n.es}: 2027 frente a 2026 (festivos de la comunidad)`, ca: `${com.n.ca}: 2027 respecte al 2026 (festius de la comunitat)` }, cab: [tt('Concepto', 'Concepte'), '2026', '2027', tt('Diferencia', 'Diferència')], formatos: ['txt', 'num0', 'num0', 'txt'], filas: [
      [tt('Días laborables (lunes a viernes)', 'Dies laborables (dilluns a divendres)'), c26.laborables, c27.laborables, signo(dif)],
      [tt('Festivos entre semana', 'Festius entre setmana'), c26.festivosSemana, c27.festivosSemana, signo(c27.festivosSemana - c26.festivosSemana)],
      [tt('Festivos en sábado o domingo', 'Festius en dissabte o diumenge'), c26.festivosFinde, c27.festivosFinde, signo(c27.festivosFinde - c26.festivosFinde)],
      [tt('Puentes', 'Ponts'), p26, pCom27, signo(pCom27 - p26)],
    ] });

    // Preguntas frecuentes con la respuesta calculada para este lugar
    const ultimo = [...festivos].reverse().find((f) => !esFinde(f.f))!;
    const faq = [
      { p: L(lang, `¿Cuántos días laborables hay en 2027 ${enN}?`, `Quants dies laborables hi ha el 2027 ${enN}?`),
        r: L(lang, `${r.laborables} de lunes a viernes: 2027 tiene 261 días entre semana y ${enN} ${r.festivosSemana === 1 ? 'cae 1 festivo' : `caen ${r.festivosSemana} festivos`} en esos días.${esMun ? '' : ' Cada municipio resta además sus festivos locales que no caigan en fin de semana.'} El mes con menos es ${MESES[minMes].es} (${porMes[minMes]}) y el que más, ${MESES[maxMes].es} (${porMes[maxMes]}).`,
          `${r.laborables} de dilluns a divendres: el 2027 té 261 dies entre setmana i ${enN} ${r.festivosSemana === 1 ? 'hi cau 1 festiu' : `hi cauen ${r.festivosSemana} festius`}.${esMun ? '' : ' Cada municipi en resta, a més, els festius locals que no caiguin en cap de setmana.'} El mes amb menys és ${MESES[minMes].ca} (${porMes[minMes]}) i el que en té més, ${MESES[maxMes].ca} (${porMes[maxMes]}).`) },
      esMun
        ? { p: L(lang, `¿Cuáles son los festivos locales de ${n} en 2027?`, `Quins són els festius locals ${deN} el 2027?`),
            r: L(lang, `${locales.map((f) => `El ${fechaLarga(f.f, lang)} (${f.n.es})`).join(' y ')}. Con ellos, ${n} suma ${r.total} festivos en 2027, ${r.festivosSemana} de ellos entre semana.`, `${locales.map((f) => `El ${fechaLarga(f.f, lang)} (${f.n.ca})`).join(' i ')}. Amb aquests, ${n} suma ${r.total} festius el 2027, ${r.festivosSemana} dels quals entre setmana.`) }
        : { p: L(lang, `¿Qué festivos tiene ${nCom} que no son comunes en toda España?`, `Quins festius té ${nCom} que no són comuns a tot Espanya?`),
            r: L(lang, `${festivos.filter((f) => f.o !== 'nacional').length} de sus 12: ${festivos.filter((f) => f.o !== 'nacional').map((f) => `${f.n.es} (${fechaLarga(f.f, 'es', false)})`).join(', ')}. Las otras ${festivos.filter((f) => f.o === 'nacional').length} son fiestas nacionales no sustituibles, ${finde.filter((f) => f.o === 'nacional').length} de ellas en sábado.`,
              `${festivos.filter((f) => f.o !== 'nacional').length} dels 12: ${festivos.filter((f) => f.o !== 'nacional').map((f) => `${f.n.ca} (${fechaLarga(f.f, 'ca', false)})`).join(', ')}. Les altres ${festivos.filter((f) => f.o === 'nacional').length} són festes nacionals no substituïbles, ${finde.filter((f) => f.o === 'nacional').length} de les quals en dissabte.`) },
      { p: L(lang, `¿Cuál es el último festivo entre semana de 2027 ${enN}?`, `Quin és l’últim festiu entre setmana del 2027 ${enN}?`),
        r: L(lang, `El ${fechaLarga(ultimo.f, lang)}, ${ultimo.n.es}. ${puentes.length ? `El último puente del año es el ${fechaLarga(puentes[puentes.length - 1].dia, lang)}, que deja ${puentes[puentes.length - 1].dias} días seguidos de descanso.` : 'En diciembre no hay puente de un solo día.'}`,
          `El ${fechaLarga(ultimo.f, lang)}, ${ultimo.n.ca}. ${puentes.length ? `L’últim pont de l’any és el ${fechaLarga(puentes[puentes.length - 1].dia, lang)}, que deixa ${puentes[puentes.length - 1].dias} dies seguits de descans.` : 'Al desembre no hi ha pont d’un sol dia.'}`) },
    ];

    // Enlaces: la comunidad y sus municipios, o los municipios vecinos de la misma comunidad
    const deCom = filas.filter((f) => f.tipo === 'municipio' && meta.municipios.find((m: any) => m.id === f.id)?.ccaa === cc && f.id !== fila.id);
    const filaCom = filas.find((f) => f.tipo === 'comunidad' && f.id === cc);
    const etq = (f: Record<string, string>) => f[`etiqueta_${lang}`];
    const enlaces = esMun
      ? [...(filaCom ? [{ fila: filaCom, texto: L(lang, `Calendario ${de(etq(filaCom), lang)}`, `Calendari ${de(etq(filaCom), lang)}`) }] : []), ...deCom.slice(0, 6).map((f) => ({ fila: f, texto: etq(f) }))]
      : [...deCom.map((f) => ({ fila: f, texto: etq(f) })), ...filas.filter((f) => f.tipo === 'comunidad' && f.id !== cc).slice(0, 8).map((f) => ({ fila: f, texto: etq(f) }))];

    let titulo = L(lang, `Calendario laboral 2027 ${enN}: festivos y puentes`, `Calendari laboral 2027 ${enN}: festius i ponts`);
    if (titulo.length > 70) titulo = L(lang, `Calendario laboral 2027 ${enN}`, `Calendari laboral 2027 ${enN}`);
    let descripcion = esMun
      ? L(lang, `${r.laborables} días laborables en 2027 ${enN}. Festivos locales: ${locales.map((f) => fechaLarga(f.f, lang, false)).join(' y ')}. ${puentes.length} puentes y comparación con 2026.`, `${r.laborables} dies laborables el 2027 ${enN}. Festius locals: ${locales.map((f) => fechaLarga(f.f, lang, false)).join(' i ')}. ${puentes.length} ponts i comparació amb el 2026.`)
      : L(lang, `${r.laborables} días laborables y ${r.total} festivos en 2027 ${enN}, ${r.festivosSemana} entre semana. Calendario mes a mes, ${puentes.length} puentes y comparación con 2026.`, `${r.laborables} dies laborables i ${r.total} festius el 2027 ${enN}, ${r.festivosSemana} entre setmana. Calendari mes a mes, ${puentes.length} ponts i comparació amb el 2026.`);
    if (descripcion.length > 175) descripcion = descripcion.replace(/ y comparación con 2026\.| i comparació amb el 2026\./, '.');

    return {
      titulo,
      h1: L(lang, `Calendario laboral 2027 ${deN}`, `Calendari laboral 2027 ${deN}`),
      descripcion,
      intro,
      tablas,
      calc: 'dias-laborables',
      query: { lugar },
      cifra: { e: L(lang, 'Días laborables en 2027', 'Dies laborables el 2027'), v: r.laborables, f: 'num0', nota: L(lang, 'de lunes a viernes, sin festivos', 'de dilluns a divendres, sense festius'),
        extra: [{ e: L(lang, 'Festivos en total', 'Festius en total'), v: r.total, f: 'num0' }, { e: L(lang, 'Festivos entre semana', 'Festius entre setmana'), v: r.festivosSemana, f: 'num0' }, { e: L(lang, 'Puentes', 'Ponts'), v: puentes.length, f: 'num0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, `Días laborables por mes en 2027 ${enN}`, `Dies laborables per mes el 2027 ${enN}`), formato: 'num0',
        desc: L(lang, `Días laborables de cada mes de 2027 ${enN}: de ${porMes[minMes]} en ${MESES[minMes].es} a ${porMes[maxMes]} en ${MESES[maxMes].es}. Total: ${r.laborables}.`, `Dies laborables de cada mes del 2027 ${enN}: de ${porMes[minMes]} al ${MESES[minMes].ca} a ${porMes[maxMes]} al ${MESES[maxMes].ca}. Total: ${r.laborables}.`),
        filas: porMes.map((v, m) => ({ e: mayus(MESES[m][lang]), v, act: m === minMes })) },
      bloque,
      faq,
      enlaces,
    };
  },
};

/** Festivos por comunidad en 2027 (y laborables de 2026), para la ficha de datos y su gráfico. */
export function tablaComunidades(lang: Lang): Tabla {
  const meta = META[ANIO];
  const filas = Object.entries(meta.comunidades).filter(([, c]: any) => c.paginas !== false).map(([cc, c]: any) => {
    const r = resumenAnio(lugarComunidad(cc), ANIO);
    const r6 = CALENDARIOS[2026].comunidades[cc] ? resumenAnio(lugarComunidad(cc), 2026) : null;
    const propios = c.festivos.filter((f: Festivo) => f.o !== 'nacional').map((f: Festivo) => `${f.n[lang]} (${num(+f.f.slice(8, 10), lang)}/${f.f.slice(5, 7)})`).join(', ');
    return [c.n[lang], r.total, r.festivosSemana, r.festivosFinde, r.laborables, r6 && r6.completo ? r6.laborables : '—', propios, c.verificado ? L(lang, 'Sí', 'Sí') : L(lang, 'Fuente secundaria', 'Font secundària')];
  });
  return { titulo: tt('Festivos de comunidad en 2027 (sin los dos locales)', 'Festius de comunitat el 2027 (sense els dos locals)'), cab: [tt('Comunidad', 'Comunitat'), tt('Festivos', 'Festius'), tt('Entre semana', 'Entre setmana'), tt('En fin de semana', 'En cap de setmana'), tt('Laborables 2027', 'Laborables 2027'), tt('Laborables 2026', 'Laborables 2026'), tt('Festivos no comunes', 'Festius no comuns'), tt('Boletín verificado', 'Butlletí verificat')], formatos: ['txt', 'num0', 'num0', 'num0', 'num0', 'num0', 'txt', 'txt'], filas };
}
