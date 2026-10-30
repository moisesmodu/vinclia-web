// Páginas por combinación de NetoClaro: sueldo neto por bruto y comunidad, indemnización por años y tipo de
// despido, y paro según la base de cotización o los años cotizados. Cada página calcula su propia cifra, su
// comparación con las hermanas y sus preguntas frecuentes con respuesta numérica: nada de texto fijo con otra cifra.
import { tt, type Tabla } from '../lib/def';
import type { PaginaProg, Plantilla } from './index';
import { sueldoNeto, indemnizacion, paro, type TipoDespido } from '../lib/calc/laboral';
import { cotizacion } from '../lib/calc/ss';
import { baseTrabajo, escalaAutonomica } from '../lib/calc/irpf';
import { sumarEscalas } from '../lib/calc/base';
import { COM, nom, eur, num, pc, L, de, en, vecinos, r2, media, ord } from './util';

const BRUTOS_COMB = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000];

/** Primer bruto anual (en saltos de 100 €) con el que la base liquidable supera un importe. */
function brutoParaBase(base: number, desde: number, P: any): number | null {
  for (let x = desde; x <= desde + 80000; x += 100) {
    const ss = cotizacion({ brutoAnual: x }, P.laboral).trabajador.anual;
    if (baseTrabajo(x, ss, P.fiscal).base > base) return x;
  }
  return null;
}

export const PLANTILLAS_NOMINA: Record<string, Plantilla> = {
  'neto-bruto-comunidad'(fila, { P, lang, anio, filas }) {
    const b = Number(fila.bruto), c = fila.ccaa, n = nom(c, lang);
    const calc = (x: string, hijos = 0) => sueldoNeto({ brutoAnual: b, pagas: 14, ccaa: x, hijos }, P);
    const r = calc(c);
    const ss = r.ss.trabajador.anual;
    const cuota = r.renta!.cuota, dif = r.renta!.diferencia;
    const realAnual = r2(b - ss - cuota), realPaga = r2(realAnual / 14);
    const todas = COM.map((x) => ({ x, cuota: calc(x).renta!.cuota })).sort((a, z) => a.cuota - z.cuota);
    // Rango, media y extremos entre las 15 comunidades de régimen común; Ceuta y Melilla (deducción del 60 % de la
    // cuota) salen en el gráfico, pero compararlas con las demás falsearía la media y el puesto
    const ceuta = c === 'CE_ML';
    const comunes = todas.filter((y) => y.x !== 'CE_ML');
    const NC = comunes.length;
    const pos = comunes.findIndex((y) => y.x === c) + 1;
    const med = media(comunes.map((y) => y.cuota));
    const vsMedia = r2(cuota - med);
    const barata = comunes[0], cara = comunes[NC - 1];
    const cuotaCeuta = todas.find((y) => y.x === 'CE_ML')!.cuota;
    // Tramo marginal (estatal + autonómico) y bruto a partir del cual se entra en el siguiente
    const bt = baseTrabajo(b, ss, P.fiscal);
    const esc = escalaAutonomica(P.fiscal, c);
    const comb = sumarEscalas(P.fiscal.irpf.escala_estatal, esc.escala).map((t) => ({ ...t, tipo: esc.bonificacion ? r2(t.tipo * (1 - esc.bonificacion / 100)) : t.tipo }));
    const iAct = comb.findIndex((t) => t.hasta == null || t.hasta > bt.base);
    const sig = comb[iAct + 1];
    const bSig = sig ? brutoParaBase(comb[iAct].hasta!, b, P) : null;
    const hijos = [0, 1, 2, 3].map((h) => { const x = calc(c, h); return { h, ret: x.ret.tipo, nomina: x.netoOrdinaria, cuota: x.renta!.cuota, renta: x.renta!.diferencia, real: r2((b - ss - x.renta!.cuota) / 14) }; });
    const serie = BRUTOS_COMB.map((x) => { const y = sueldoNeto({ brutoAnual: x, pagas: 14, ccaa: c }, P); return [x, y.netoOrdinaria, y.renta!.cuota, y.renta!.diferencia, r2((x - y.ss.trabajador.anual - y.renta!.cuota) / 14)]; });
    const signoRenta = (d: number) => (d > 0.5 ? L(lang, `te sale a pagar ${eur(d, lang)}`, `et surt a pagar ${eur(d, lang)}`) : d < -0.5 ? L(lang, `te devuelven ${eur(-d, lang)}`, `et retornen ${eur(-d, lang)}`) : L(lang, 'te sale a cero', 'et surt a zero'));
    const fraseMedia = Math.abs(vsMedia) < 1
      ? L(lang, `pagas lo mismo que la media de las ${NC} comunidades de régimen común`, `pagues el mateix que la mitjana de les ${NC} comunitats de règim comú`)
      : L(lang, `pagas ${eur(Math.abs(vsMedia), lang)} ${vsMedia < 0 ? 'menos' : 'más'} de IRPF al año que la media de las ${NC} comunidades de régimen común (${eur(med, lang)})`, `pagues ${eur(Math.abs(vsMedia), lang)} ${vsMedia < 0 ? 'menys' : 'més'} d’IRPF l’any que la mitjana de les ${NC} comunitats de règim comú (${eur(med, lang)})`);
    const frasePuesto = ceuta
      ? L(lang, `La deducción del 60 % de la cuota para quien vive en Ceuta o Melilla la deja muy por debajo de todas: la comunidad más barata con este sueldo, ${nom(barata.x, lang)}, cobra ${eur(barata.cuota, lang)}, y la más cara, ${nom(cara.x, lang)}, ${eur(cara.cuota, lang)}.`, `La deducció del 60 % de la quota per a qui viu a Ceuta o Melilla la deixa molt per sota de totes: la comunitat més barata amb aquest sou, ${nom(barata.x, lang)}, cobra ${eur(barata.cuota, lang)}, i la més cara, ${nom(cara.x, lang)}, ${eur(cara.cuota, lang)}.`)
      : L(lang, `Es la ${ord(pos, lang)} comunidad más barata de ${NC} con este sueldo: la que menos cobra es ${nom(barata.x, lang)} (${eur(barata.cuota, lang)}) y la que más, ${nom(cara.x, lang)} (${eur(cara.cuota, lang)}).`, `És la ${ord(pos, lang)} comunitat més barata de ${NC} amb aquest sou: la que menys cobra és ${nom(barata.x, lang)} (${eur(barata.cuota, lang)}) i la que més, ${nom(cara.x, lang)} (${eur(cara.cuota, lang)}).`);
    const notaCeuta = ceuta ? L(lang, ' Aquí se usa la retención general; si tu empresa aplica la reducción por rentas obtenidas en Ceuta o Melilla, te retendrá menos y la devolución será menor.', ' Aquí es fa servir la retenció general; si la teva empresa aplica la reducció per rendes obtingudes a Ceuta o Melilla, et retindrà menys i la devolució serà menor.') : '';
    const fraseTramo = sig && bSig
      ? L(lang, `Tu último euro tributa al <strong>${pc(comb[iAct].tipo, lang)}</strong> (estatal más autonómico); a partir de unos ${eur(bSig, lang)} brutos entrarías en el tramo del ${pc(sig.tipo, lang)}.`, `El teu últim euro tributa al <strong>${pc(comb[iAct].tipo, lang)}</strong> (estatal més autonòmic); a partir d’uns ${eur(bSig, lang)} bruts entraries al tram del ${pc(sig.tipo, lang)}.`)
      : L(lang, `Tu último euro tributa al <strong>${pc(comb[iAct].tipo, lang)}</strong> (estatal más autonómico).`, `El teu últim euro tributa al <strong>${pc(comb[iAct].tipo, lang)}</strong> (estatal més autonòmic).`);
    const tablas: Tabla[] = [
      { titulo: tt(`Tu nómina y tu renta con ${num(b, 'es')} € en ${nom(c, 'es')}`, `La teva nòmina i la teva renda amb ${num(b, 'ca')} € a ${nom(c, 'ca')}`), cab: [tt('Concepto', 'Concepte'), tt('Al año', 'L’any'), tt('Por paga (14)', 'Per paga (14)')], formatos: ['txt', 'eur', 'eur'], filas: [
        [tt('Bruto', 'Brut'), b, r.brutoPaga],
        [tt('Seguridad Social', 'Seguretat Social'), ss, r.ss.trabajador.mensual],
        [tt(`Retención de IRPF (${String(r.ret.tipo).replace('.', ',')} %)`, `Retenció d’IRPF (${String(r.ret.tipo).replace('.', ',')} %)`), r.ret.importe, r.irpfPaga],
        [tt('Neto en nómina', 'Net en nòmina'), r.netoAnual, r.netoOrdinaria],
        [tt(`IRPF real en ${nom(c, 'es')}`, `IRPF real a ${nom(c, 'ca')}`), cuota, r2(cuota / 14)],
        [tt('Renta: pagar (+) o devolver (−)', 'Renda: pagar (+) o retornar (−)'), dif, r2(dif / 14)],
        [tt('Neto real después de la renta', 'Net real després de la renda'), realAnual, realPaga],
      ] },
      { titulo: tt(`Sueldo neto en ${nom(c, 'es')} según el bruto`, `Sou net a ${nom(c, 'ca')} segons el brut`), cab: [tt('Bruto anual', 'Brut anual'), tt('Neto en nómina (14 pagas)', 'Net en nòmina (14 pagues)'), tt('IRPF real anual', 'IRPF real anual'), tt('Renta: pagar (+) / devolver (−)', 'Renda: pagar (+) / retornar (−)'), tt('Neto real por paga', 'Net real per paga')], formatos: ['eur0', 'eur', 'eur', 'eur', 'eur'], filas: serie },
      { titulo: tt(`Con ${num(b, 'es')} € según los hijos (computados al 50 %)`, `Amb ${num(b, 'ca')} € segons els fills (computats al 50 %)`), cab: [tt('Hijos', 'Fills'), tt('Retención', 'Retenció'), tt('Neto en nómina', 'Net en nòmina'), tt('IRPF real anual', 'IRPF real anual'), tt('Neto real por paga', 'Net real per paga')], formatos: ['txt', 'pct', 'eur', 'eur', 'eur'], filas: hijos.map((x) => [String(x.h), x.ret, x.nomina, x.cuota, x.real]) },
    ];
    const comBr = filas.filter((f) => f.bruto === fila.bruto && f.ccaa !== c);
    return {
      titulo: L(lang, `${num(b, lang)} € brutos en ${n}: sueldo neto ${anio}`, `${num(b, lang)} € bruts a ${n}: sou net ${anio}`),
      h1: L(lang, `Sueldo neto de ${num(b, lang)} € brutos en ${n} (${anio})`, `Sou net de ${num(b, lang)} € bruts a ${n} (${anio})`),
      descripcion: L(lang, `Con ${num(b, lang)} € brutos en ${n} cobras ${eur(r.netoOrdinaria, lang, 2)} al mes en 14 pagas y pagas ${eur(cuota, lang)} de IRPF${ceuta ? `, ${eur(-vsMedia, lang)} menos que la media` : `: ${ord(pos, lang)} comunidad más barata de ${NC}`}.`, `Amb ${num(b, lang)} € bruts a ${n} cobres ${eur(r.netoOrdinaria, lang, 2)} al mes en 14 pagues i pagues ${eur(cuota, lang)} d’IRPF${ceuta ? `, ${eur(-vsMedia, lang)} menys que la mitjana` : `: ${ord(pos, lang)} comunitat més barata de ${NC}`}.`),
      intro: L(lang,
        `<p>Con un sueldo de <strong>${num(b, lang)} € brutos al año en ${n}</strong> cobras <strong>${eur(r.netoOrdinaria, lang, 2)} netos en cada una de las 14 pagas</strong>, porque la empresa te retiene un ${pc(r.ret.tipo, lang)} de IRPF, igual en toda España. Pero el IRPF que pagas de verdad en ${n} es de ${eur(cuota, lang)} al año: en la renta ${signoRenta(dif)}, así que tu neto real queda en ${eur(realPaga, lang, 2)} por paga.${notaCeuta}</p><p>En ${n} ${fraseMedia}. ${frasePuesto} ${fraseTramo}</p>`,
        `<p>Amb un sou de <strong>${num(b, lang)} € bruts l’any a ${n}</strong> cobres <strong>${eur(r.netoOrdinaria, lang, 2)} nets a cadascuna de les 14 pagues</strong>, perquè l’empresa et reté un ${pc(r.ret.tipo, lang)} d’IRPF, igual a tot Espanya. Però l’IRPF que pagues de debò a ${n} és de ${eur(cuota, lang)} l’any: a la renda ${signoRenta(dif)}, així que el teu net real queda en ${eur(realPaga, lang, 2)} per paga.${notaCeuta}</p><p>A ${n} ${fraseMedia}. ${frasePuesto} ${fraseTramo}</p>`),
      tablas,
      calc: 'sueldo-neto',
      query: { bruto: b, ccaa: c },
      cifra: { e: L(lang, 'Neto en cada paga (14 pagas)', 'Net a cada paga (14 pagues)'), v: r.netoOrdinaria, f: 'eur', nota: L(lang, `Después de la renta en ${n}: ${eur(realPaga, lang, 2)} por paga`, `Després de la renda a ${n}: ${eur(realPaga, lang, 2)} per paga`),
        extra: [{ e: L(lang, `IRPF real en ${n}`, `IRPF real a ${n}`), v: cuota, f: 'eur0' }, { e: L(lang, 'Frente a la media de comunidades', 'Respecte a la mitjana de comunitats'), v: vsMedia, f: 'eur0' }, { e: L(lang, 'Tipo marginal', 'Tipus marginal'), v: comb[iAct].tipo, f: 'pct' }] },
      grafico: { tipo: 'barras', titulo: L(lang, `IRPF anual con ${num(b, lang)} € brutos en cada comunidad`, `IRPF anual amb ${num(b, lang)} € bruts a cada comunitat`), formato: 'eur0',
        desc: L(lang, `De ${eur(todas[0].cuota, lang)} en ${nom(todas[0].x, lang)} a ${eur(cara.cuota, lang)} en ${nom(cara.x, lang)}. ${n}: ${eur(cuota, lang)}.`, `De ${eur(todas[0].cuota, lang)} a ${nom(todas[0].x, lang)} a ${eur(cara.cuota, lang)} a ${nom(cara.x, lang)}. ${n}: ${eur(cuota, lang)}.`),
        filas: todas.map((y) => ({ e: nom(y.x, lang), v: y.cuota, act: y.x === c })) },
      faq: [
        { p: L(lang, `¿Cuánto cobro al mes con ${num(b, lang)} € brutos en ${n}?`, `Quant cobro al mes amb ${num(b, lang)} € bruts a ${n}?`),
          r: L(lang, `${eur(r.netoOrdinaria, lang, 2)} netos en cada una de las 14 pagas (las dos extra, ${eur(r.netoExtra, lang, 2)}), o ${eur(sueldoNeto({ brutoAnual: b, pagas: 12, ccaa: c }, P).netoOrdinaria, lang, 2)} si cobras en 12 pagas. Son ${eur(r.netoAnual, lang)} netos al año antes de la renta.`, `${eur(r.netoOrdinaria, lang, 2)} nets a cadascuna de les 14 pagues (les dues extra, ${eur(r.netoExtra, lang, 2)}), o ${eur(sueldoNeto({ brutoAnual: b, pagas: 12, ccaa: c }, P).netoOrdinaria, lang, 2)} si cobres en 12 pagues. Són ${eur(r.netoAnual, lang)} nets l’any abans de la renda.`) },
        { p: L(lang, `¿Me sale a pagar o a devolver la renta con ${num(b, lang)} € en ${n}?`, `Em surt a pagar o a retornar la renda amb ${num(b, lang)} € a ${n}?`),
          r: L(lang, `Soltero y sin hijos, ${signoRenta(dif)}: te retienen ${eur(r.ret.importe, lang)} y el IRPF de ${n} es de ${eur(cuota, lang)}. Con dos hijos la retención baja al ${pc(hijos[2].ret, lang)} y en la renta ${signoRenta(hijos[2].renta)}.`, `Solter i sense fills, ${signoRenta(dif)}: et retenen ${eur(r.ret.importe, lang)} i l’IRPF de ${n} és de ${eur(cuota, lang)}. Amb dos fills la retenció baixa al ${pc(hijos[2].ret, lang)} i a la renda ${signoRenta(hijos[2].renta)}.`) },
        ceuta
          ? { p: L(lang, `¿Cuánto IRPF me ahorro con ${num(b, lang)} € en Ceuta o Melilla?`, `Quant IRPF m’estalvio amb ${num(b, lang)} € a Ceuta o Melilla?`),
              r: L(lang, `${eur(-vsMedia, lang)} al año frente a la media de las ${NC} comunidades de régimen común y ${eur(cara.cuota - cuota, lang)} frente a ${nom(cara.x, lang)}, la más cara con este sueldo. Si la nómina no aplica la reducción de Ceuta y Melilla, la diferencia te la devuelven en la renta.`, `${eur(-vsMedia, lang)} l’any respecte a la mitjana de les ${NC} comunitats de règim comú i ${eur(cara.cuota - cuota, lang)} respecte a ${nom(cara.x, lang)}, la més cara amb aquest sou. Si la nòmina no aplica la reducció de Ceuta i Melilla, la diferència te la retornen a la renda.`) }
          : barata.x === c
          ? { p: L(lang, `¿Hay alguna comunidad donde quede más neto que en ${n} con ${num(b, lang)} €?`, `Hi ha alguna comunitat on quedi més net que a ${n} amb ${num(b, lang)} €?`),
              r: L(lang, `No entre las ${NC} de régimen común: ${n} es la que menos IRPF cobra con ${num(b, lang)} €, ${eur(comunes[1].cuota - cuota, lang)} menos que ${nom(comunes[1].x, lang)} y ${eur(cara.cuota - cuota, lang)} menos que ${nom(cara.x, lang)}. Solo Ceuta y Melilla, con su deducción del 60 %, quedan por debajo (${eur(cuotaCeuta, lang)}).`, `No entre les ${NC} de règim comú: ${n} és la que menys IRPF cobra amb ${num(b, lang)} €, ${eur(comunes[1].cuota - cuota, lang)} menys que ${nom(comunes[1].x, lang)} i ${eur(cara.cuota - cuota, lang)} menys que ${nom(cara.x, lang)}. Només Ceuta i Melilla, amb la seva deducció del 60 %, queden per sota (${eur(cuotaCeuta, lang)}).`) }
          : { p: L(lang, `¿En qué comunidad queda más neto con ${num(b, lang)} € brutos?`, `A quina comunitat queda més net amb ${num(b, lang)} € bruts?`),
              r: L(lang, `En ${nom(barata.x, lang)}, donde el IRPF es de ${eur(barata.cuota, lang)}: ${eur(cuota - barata.cuota, lang)} al año menos que en ${n}.${cara.x === c ? ` ${n} es la más cara de las ${NC} con este sueldo.` : ` En ${nom(cara.x, lang)} pagarías ${eur(cara.cuota - cuota, lang)} más.`} En Ceuta y Melilla, con la deducción del 60 %, serían ${eur(cuotaCeuta, lang)}.`, `A ${nom(barata.x, lang)}, on l’IRPF és de ${eur(barata.cuota, lang)}: ${eur(cuota - barata.cuota, lang)} l’any menys que a ${n}.${cara.x === c ? ` ${n} és la més cara de les ${NC} amb aquest sou.` : ` A ${nom(cara.x, lang)} pagaries ${eur(cara.cuota - cuota, lang)} més.`} A Ceuta i Melilla, amb la deducció del 60 %, serien ${eur(cuotaCeuta, lang)}.`) },
      ],
      enlaces: [
        ...vecinos(filas.filter((f) => f.ccaa === c), fila).map((f) => ({ fila: f, texto: L(lang, `${num(+f.bruto, lang)} € en ${n}`, `${num(+f.bruto, lang)} € a ${n}`) })),
        ...comBr.map((f) => ({ fila: f, texto: L(lang, `${num(b, lang)} € en ${nom(f.ccaa, lang)}`, `${num(b, lang)} € a ${nom(f.ccaa, lang)}`) })),
        { col: 'neto-por-bruto', fila, texto: L(lang, `${num(b, lang)} € brutos en toda España`, `${num(b, lang)} € bruts a tot Espanya`) },
        { col: 'neto-por-comunidad', fila, texto: L(lang, `Tabla de sueldo neto en ${n}`, `Taula de sou net a ${n}`) },
      ],
    };
  },

  'indemnizacion-anos'(fila, { P, lang, anio, filas }) {
    const tipo = fila.tipo as TipoDespido, anos = Number(fila.anos);
    const fin = `${anio}-06-30`, inicio = `${anio - anos}-07-01`;
    const I = P.laboral.indemnizacion;
    const BR = 28000;
    const calc = (t: TipoDespido, br: number, a = anos) => indemnizacion({ inicio: `${anio - a}-07-01`, fin, brutoAnual: br, tipo: t }, P.laboral);
    const r = calc(tipo, BR);
    const otro: TipoDespido = tipo === 'improcedente' ? 'objetivo' : 'improcedente';
    const ro = calc(otro, BR);
    const sueldos = [15000, 18000, 21000, 24000, 28000, 32000, 36000, 42000, 50000, 60000];
    const nT = (t: TipoDespido) => (t === 'improcedente' ? L(lang, 'improcedente', 'improcedent') : t === 'objetivo' ? L(lang, 'objetivo', 'objectiu') : L(lang, 'fin de contrato temporal', 'fi de contracte temporal'));
    const dpa = tipo === 'improcedente' ? I.improcedente_dias_por_ano : I.objetivo_dias_por_ano;
    const topeM = tipo === 'improcedente' ? I.improcedente_tope_mensualidades : I.objetivo_tope_mensualidades;
    const anosTope = Math.round((topeM * 30 / dpa) * 10) / 10;
    const ud = (a: number) => (a === 1 ? L(lang, 'año', 'any') : L(lang, 'años', 'anys'));
    const mensual = BR / 14;
    const mesesSueldo = r2(r.importe / (BR / 12));
    const dosTramos = r.tramos.length > 1;
    const fraseTope = r.tope ? L(lang, `Con ${anos} ${ud(anos)} ya se alcanza el tope de ${topeM} mensualidades, así que trabajar más años no la aumenta.`, `Amb ${anos} ${ud(anos)} ja s’arriba al topall de ${topeM} mensualitats, així que treballar més anys no l’augmenta.`)
      : L(lang, `El tope de ${topeM} mensualidades se alcanza a los ${num(anosTope, lang, 1)} años; con ${anos} ${ud(anos)} estás en el ${num(r.dias / (topeM * 30) * 100, lang)} % de ese máximo.`, `El topall de ${topeM} mensualitats s’assoleix als ${num(anosTope, lang, 1)} anys; amb ${anos} ${ud(anos)} ets al ${num(r.dias / (topeM * 30) * 100, lang)} % d’aquest màxim.`);
    const fraseTramos = dosTramos ? L(lang, ` Como el contrato empezó antes del 12 de febrero de 2012, los ${num(r.tramos[0].meses, lang)} meses anteriores cuentan a 45 días por año (${num(r.tramos[0].dias, lang, 1)} días) y el resto a 33.`, ` Com que el contracte va començar abans del 12 de febrer de 2012, els ${num(r.tramos[0].meses, lang)} mesos anteriors compten a 45 dies per any (${num(r.tramos[0].dias, lang, 1)} dies) i la resta a 33.`) : '';
    const serieAnos = [1, 2, 3, 5, 8, 10, 15, 20, 25].map((a) => { const i = calc('improcedente', BR, a), o = calc('objetivo', BR, a); return [a, i.dias, i.importe, o.dias, o.importe]; });
    const tablas: Tabla[] = [
      { titulo: tt(`Despido ${tipo === 'improcedente' ? 'improcedente' : 'objetivo'} con ${anos} ${anos === 1 ? 'año' : 'años'} según el sueldo`, `Acomiadament ${tipo === 'improcedente' ? 'improcedent' : 'objectiu'} amb ${anos} ${anos === 1 ? 'any' : 'anys'} segons el sou`), cab: [tt('Bruto anual', 'Brut anual'), tt('Bruto al mes (14 pagas)', 'Brut al mes (14 pagues)'), tt('Salario diario', 'Salari diari'), tt('Días', 'Dies'), tt('Indemnización', 'Indemnització')], formatos: ['eur0', 'eur', 'eur', 'num', 'eur'],
        filas: sueldos.map((s) => { const x = calc(tipo, s); return [s, r2(s / 14), x.diario, x.dias, x.importe]; }) },
      { titulo: tt('Improcedente frente a objetivo según la antigüedad (28.000 € brutos)', 'Improcedent davant d’objectiu segons l’antiguitat (28.000 € bruts)'), cab: [tt('Años', 'Anys'), tt('Días improcedente', 'Dies improcedent'), tt('Improcedente', 'Improcedent'), tt('Días objetivo', 'Dies objectiu'), tt('Objetivo', 'Objectiu')], formatos: ['num0', 'num', 'eur', 'num', 'eur'], filas: serieAnos },
    ];
    const hermanas = filas.filter((f) => f.tipo === tipo);
    const otraFila = filas.find((f) => f.tipo === otro && f.anos === fila.anos);
    const t12 = calc('temporal', BR);
    return {
      titulo: L(lang, `Indemnización por despido ${nT(tipo)} con ${anos} ${ud(anos)} (${anio})`, `Indemnització per acomiadament ${nT(tipo)} amb ${anos} ${ud(anos)} (${anio})`),
      h1: L(lang, `Despido ${nT(tipo)} con ${anos} ${ud(anos)} trabajados: cuánto te corresponde`, `Acomiadament ${nT(tipo)} amb ${anos} ${ud(anos)} treballats: quant et correspon`),
      descripcion: L(lang, `Con ${anos} ${ud(anos)} y 2.000 € brutos al mes, el despido ${nT(tipo)} son ${num(r.dias, lang, 1)} días de salario: ${eur(r.importe, lang)}. Tabla por sueldo y comparación con el ${nT(otro)}.`, `Amb ${anos} ${ud(anos)} i 2.000 € bruts al mes, l’acomiadament ${nT(tipo)} són ${num(r.dias, lang, 1)} dies de salari: ${eur(r.importe, lang)}. Taula per sou i comparació amb l’${nT(otro)}.`),
      intro: L(lang,
        `<p>Un despido <strong>${nT(tipo)}</strong> se paga a <strong>${dpa} días de salario por año trabajado</strong>, prorrateando por meses. Con <strong>${anos} ${ud(anos)}</strong> de antigüedad (del ${inicio.split('-').reverse().join('/')} al ${fin.split('-').reverse().join('/')}) y un sueldo de 2.000 € brutos al mes en 14 pagas (28.000 € al año, ${eur(r.diario, lang, 2)} al día) te corresponden <strong>${num(r.dias, lang, 1)} días: ${eur(r.importe, lang)}</strong>, el equivalente a ${num(mesesSueldo, lang, 1)} meses de sueldo.${fraseTramos}</p><p>${fraseTope} Si el despido fuera ${nT(otro)} cobrarías ${eur(ro.importe, lang)} (${ro.importe > r.importe ? `${eur(ro.importe - r.importe, lang)} más` : `${eur(r.importe - ro.importe, lang)} menos`}); al terminar un contrato temporal de la misma duración serían ${eur(t12.importe, lang)}. Además de la indemnización, el finiquito te paga las vacaciones pendientes y la parte de las pagas extra.</p>`,
        `<p>Un acomiadament <strong>${nT(tipo)}</strong> es paga a <strong>${dpa} dies de salari per any treballat</strong>, prorratejant per mesos. Amb <strong>${anos} ${ud(anos)}</strong> d’antiguitat (del ${inicio.split('-').reverse().join('/')} al ${fin.split('-').reverse().join('/')}) i un sou de 2.000 € bruts al mes en 14 pagues (28.000 € l’any, ${eur(r.diario, lang, 2)} al dia) et corresponen <strong>${num(r.dias, lang, 1)} dies: ${eur(r.importe, lang)}</strong>, l’equivalent a ${num(mesesSueldo, lang, 1)} mesos de sou.${fraseTramos}</p><p>${fraseTope} Si l’acomiadament fos ${nT(otro)} cobraries ${eur(ro.importe, lang)} (${ro.importe > r.importe ? `${eur(ro.importe - r.importe, lang)} més` : `${eur(r.importe - ro.importe, lang)} menys`}); en acabar un contracte temporal de la mateixa durada serien ${eur(t12.importe, lang)}. A més de la indemnització, la quitança et paga les vacances pendents i la part de les pagues extra.</p>`),
      tablas,
      calc: 'indemnizacion-despido',
      query: { inicio, fin, bruto: BR, tipo },
      cifra: { e: L(lang, `Indemnización con ${anos} ${ud(anos)} y 2.000 € al mes`, `Indemnització amb ${anos} ${ud(anos)} i 2.000 € al mes`), v: r.importe, f: 'eur0', nota: L(lang, `${num(r.dias, lang, 1)} días de salario a ${eur(r.diario, lang, 2)}`, `${num(r.dias, lang, 1)} dies de salari a ${eur(r.diario, lang, 2)}`),
        extra: [{ e: L(lang, `Si fuera ${nT(otro)}`, `Si fos ${nT(otro)}`), v: ro.importe, f: 'eur0' }, { e: L(lang, 'Meses de sueldo', 'Mesos de sou'), v: mesesSueldo, f: 'num' }] },
      grafico: { tipo: 'barras', titulo: L(lang, `Con ${anos} ${ud(anos)} y 28.000 € brutos, según cómo acaba el contrato`, `Amb ${anos} ${ud(anos)} i 28.000 € bruts, segons com acaba el contracte`), formato: 'eur0',
        desc: L(lang, `Improcedente ${eur(calc('improcedente', BR).importe, lang)}, objetivo ${eur(calc('objetivo', BR).importe, lang)}, fin de contrato temporal ${eur(t12.importe, lang)}.`, `Improcedent ${eur(calc('improcedente', BR).importe, lang)}, objectiu ${eur(calc('objetivo', BR).importe, lang)}, fi de contracte temporal ${eur(t12.importe, lang)}.`),
        filas: (['improcedente', 'objetivo', 'temporal'] as TipoDespido[]).map((t) => ({ e: nT(t).replace(/^./, (x) => x.toUpperCase()), v: calc(t, BR).importe, act: t === tipo })) },
      faq: [
        { p: L(lang, `¿Cuánto me corresponde por un despido ${nT(tipo)} con ${anos} ${ud(anos)} y 1.500 € al mes?`, `Quant em correspon per un acomiadament ${nT(tipo)} amb ${anos} ${ud(anos)} i 1.500 € al mes?`),
          r: L(lang, `Con 1.500 € brutos en 14 pagas (21.000 € al año) son ${num(calc(tipo, 21000).dias, lang, 1)} días a ${eur(calc(tipo, 21000).diario, lang, 2)}: ${eur(calc(tipo, 21000).importe, lang)}. Con 2.500 € al mes (35.000 € al año), ${eur(calc(tipo, 35000).importe, lang)}.`, `Amb 1.500 € bruts en 14 pagues (21.000 € l’any) són ${num(calc(tipo, 21000).dias, lang, 1)} dies a ${eur(calc(tipo, 21000).diario, lang, 2)}: ${eur(calc(tipo, 21000).importe, lang)}. Amb 2.500 € al mes (35.000 € l’any), ${eur(calc(tipo, 35000).importe, lang)}.`) },
        { p: L(lang, `¿Paga IRPF la indemnización de ${anos} ${ud(anos)}?`, `Paga IRPF la indemnització de ${anos} ${ud(anos)}?`),
          r: L(lang, `No, mientras no pase de la cuantía obligatoria del Estatuto de los Trabajadores ni de 180.000 € (art. 7.e de la Ley del IRPF). Los ${eur(r.importe, lang)} de este ejemplo están exentos enteros; lo que la empresa pague por encima sí tributa.`, `No, mentre no passi de la quantia obligatòria de l’Estatut dels Treballadors ni de 180.000 € (art. 7.e de la Llei de l’IRPF). Els ${eur(r.importe, lang)} d’aquest exemple estan exempts del tot; el que l’empresa pagui per sobre sí que tributa.`) },
        { p: L(lang, `¿Cuántos días por año me dan con ${anos} ${ud(anos)}?`, `Quants dies per any em donen amb ${anos} ${ud(anos)}?`),
          r: L(lang, `${dpa} días por año en el despido ${nT(tipo)}${dosTramos ? ' (45 por el tiempo anterior a febrero de 2012)' : ''}, con un máximo de ${topeM} mensualidades: en total, ${num(r.dias, lang, 1)} días por ${anos} ${ud(anos)}.`, `${dpa} dies per any en l’acomiadament ${nT(tipo)}${dosTramos ? ' (45 pel temps anterior al febrer de 2012)' : ''}, amb un màxim de ${topeM} mensualitats: en total, ${num(r.dias, lang, 1)} dies per ${anos} ${ud(anos)}.`) },
      ],
      enlaces: [
        ...vecinos(hermanas, fila, 3).map((f) => ({ fila: f, texto: L(lang, `${f.anos} ${+f.anos === 1 ? 'año' : 'años'}`, `${f.anos} ${+f.anos === 1 ? 'any' : 'anys'}`) })),
        ...(otraFila ? [{ fila: otraFila, texto: L(lang, `Despido ${nT(otro)} con ${anos} ${ud(anos)}`, `Acomiadament ${nT(otro)} amb ${anos} ${ud(anos)}`) }] : []),
      ],
    };
  },

  'paro-base'(fila, { P, lang, anio, filas }) {
    const base = Number(fila.base);
    const D = P.laboral.desempleo;
    const calc = (h: number, dias = 720) => paro({ diasCotizados: dias, baseMensual: base, hijos: h }, P.laboral);
    const r0 = calc(0), r1 = calc(1), r2h = calc(2);
    const p1 = r0.periodos[0], p2 = r0.periodos[1];
    const bruto70 = r2(base * 0.7);
    const topado = bruto70 >= D.tope_max_sin_hijos;
    const baseTope0 = Math.ceil(D.tope_max_sin_hijos / 0.7), baseTope2 = Math.ceil(D.tope_max_2_o_mas / 0.7);
    const neto = (x: number) => r2(x - base * D.cotizacion_trabajador_descuento_pct / 100);
    const p14 = paro({ diasCotizados: 720, baseMensual: base * 14 / 12, hijos: 0 }, P.laboral).periodos[0].mensualBruto;
    const dur = [360, 720, 1080, 1440, 2160].map((d) => { const x = calc(0, d); return [x.duracion / 30, x.periodos[0]?.mensualBruto ?? 0, x.periodos[1]?.mensualBruto ?? '—', x.total]; });
    const frasesTope = topado
      ? L(lang, `Con esta base el 70 % (${eur(bruto70, lang, 2)}) supera el tope sin hijos, así que cobras el máximo de ${eur(D.tope_max_sin_hijos, lang)}: subir la base no aumenta el paro si no tienes hijos. Con un hijo el tope sube a ${eur(D.tope_max_1_hijo, lang)} y con dos, a ${eur(D.tope_max_2_o_mas, lang)}.`, `Amb aquesta base el 70 % (${eur(bruto70, lang, 2)}) supera el topall sense fills, així que cobres el màxim de ${eur(D.tope_max_sin_hijos, lang)}: pujar la base no augmenta l’atur si no tens fills. Amb un fill el topall puja a ${eur(D.tope_max_1_hijo, lang)} i amb dos, a ${eur(D.tope_max_2_o_mas, lang)}.`)
      : L(lang, `No llegas al tope sin hijos (${eur(D.tope_max_sin_hijos, lang)}), que se alcanza con una base de ${eur(baseTope0, lang)}: cada 100 € más de base son 70 € más de paro al mes durante el primer medio año.`, `No arribes al topall sense fills (${eur(D.tope_max_sin_hijos, lang)}), que s’assoleix amb una base de ${eur(baseTope0, lang)}: cada 100 € més de base són 70 € més d’atur al mes durant el primer mig any.`);
    return {
      titulo: L(lang, `Paro con una base de ${num(base, lang)} €: cuánto cobro (${anio})`, `Atur amb una base de ${num(base, lang)} €: quant cobro (${anio})`),
      h1: L(lang, `Cuánto paro cobras con una base de cotización de ${num(base, lang)} €`, `Quant atur cobres amb una base de cotització de ${num(base, lang)} €`),
      descripcion: L(lang, `Con ${num(base, lang)} € de base cobras ${eur(p1.mensualBruto, lang, 2)} al mes de paro los primeros 6 meses y ${eur(p2.mensualBruto, lang, 2)} después. Topes con hijos y duración.`, `Amb ${num(base, lang)} € de base cobres ${eur(p1.mensualBruto, lang, 2)} al mes d’atur els primers 6 mesos i ${eur(p2.mensualBruto, lang, 2)} després. Topalls amb fills i durada.`),
      intro: L(lang,
        `<p>La prestación por desempleo se calcula sobre la <strong>base de cotización media de los últimos 180 días</strong>, que en una nómina normal es el bruto mensual con la parte de las pagas extra (unos ${eur(base * 12, lang)} brutos al año). Con <strong>${num(base, lang)} € de base</strong> cobras <strong>${eur(p1.mensualBruto, lang, 2)} al mes los primeros 180 días</strong> (el 70 %) y ${eur(p2.mensualBruto, lang, 2)} a partir del día 181 (el 60 %). En tu cuenta entran unos ${eur(neto(p1.mensualBruto), lang, 2)} y ${eur(neto(p2.mensualBruto), lang, 2)}, después de descontar tu parte de la cotización.</p><p>${frasesTope} Con 2 años cotizados el paro dura 8 meses y suma ${eur(r0.total, lang)} brutos.</p>`,
        `<p>La prestació per desocupació es calcula sobre la <strong>base de cotització mitjana dels últims 180 dies</strong>, que en una nòmina normal és el brut mensual amb la part de les pagues extra (uns ${eur(base * 12, lang)} bruts l’any). Amb <strong>${num(base, lang)} € de base</strong> cobres <strong>${eur(p1.mensualBruto, lang, 2)} al mes els primers 180 dies</strong> (el 70 %) i ${eur(p2.mensualBruto, lang, 2)} a partir del dia 181 (el 60 %). Al compte t’entren uns ${eur(neto(p1.mensualBruto), lang, 2)} i ${eur(neto(p2.mensualBruto), lang, 2)}, després de descomptar la teva part de la cotització.</p><p>${frasesTope} Amb 2 anys cotitzats l’atur dura 8 mesos i suma ${eur(r0.total, lang)} bruts.</p>`),
      tablas: [
        { titulo: tt(`Paro al mes con ${num(base, 'es')} € de base según los hijos`, `Atur al mes amb ${num(base, 'ca')} € de base segons els fills`), cab: [tt('Hijos menores de 26', 'Fills menors de 26'), tt('Días 1-180 (70 %)', 'Dies 1-180 (70 %)'), tt('Desde el día 181 (60 %)', 'Des del dia 181 (60 %)'), tt('Tope máximo', 'Topall màxim')], formatos: ['txt', 'eur', 'eur', 'eur0'],
          filas: [['0', r0, D.tope_max_sin_hijos], ['1', r1, D.tope_max_1_hijo], [L(lang, '2 o más', '2 o més'), r2h, D.tope_max_2_o_mas]].map(([h, x, t]: any) => [h, x.periodos[0].mensualBruto, x.periodos[1].mensualBruto, t]) },
        { titulo: tt('Duración y total según lo cotizado (sin hijos)', 'Durada i total segons el que s’ha cotitzat (sense fills)'), cab: [tt('Meses de paro', 'Mesos d’atur'), tt('Al mes (70 %)', 'Al mes (70 %)'), tt('Al mes (60 %)', 'Al mes (60 %)'), tt('Total bruto', 'Total brut')], formatos: ['num0', 'eur', 'eur', 'eur0'], filas: dur },
      ],
      calc: 'paro',
      query: { base, dias: 720 },
      cifra: { e: L(lang, 'Paro al mes los primeros 6 meses', 'Atur al mes els primers 6 mesos'), v: p1.mensualBruto, f: 'eur', nota: L(lang, `${eur(p2.mensualBruto, lang, 2)} a partir del séptimo mes · sin hijos`, `${eur(p2.mensualBruto, lang, 2)} a partir del setè mes · sense fills`),
        extra: [{ e: L(lang, 'Con 2 hijos', 'Amb 2 fills'), v: r2h.periodos[0].mensualBruto, f: 'eur' }, { e: L(lang, 'Total con 2 años cotizados', 'Total amb 2 anys cotitzats'), v: r0.total, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, 'Paro al mes (primeros 6 meses) según la base', 'Atur al mes (primers 6 mesos) segons la base'), formato: 'eur0',
        desc: L(lang, `Del 70 % de cada base, con el tope de ${eur(D.tope_max_sin_hijos, lang)} sin hijos. ${num(base, lang)} €: ${eur(p1.mensualBruto, lang, 2)}.`, `Del 70 % de cada base, amb el topall de ${eur(D.tope_max_sin_hijos, lang)} sense fills. ${num(base, lang)} €: ${eur(p1.mensualBruto, lang, 2)}.`),
        filas: filas.map((f) => ({ e: eur(+f.base, lang), v: paro({ diasCotizados: 720, baseMensual: +f.base, hijos: 0 }, P.laboral).periodos[0].mensualBruto, act: f === fila })) },
      faq: [
        { p: L(lang, `¿Cuánto paro cobro si ganaba ${num(base, lang)} € brutos al mes?`, `Quant atur cobro si guanyava ${num(base, lang)} € bruts al mes?`),
          r: L(lang, `Si esos ${num(base, lang)} € incluyen la parte de las pagas extra, ${eur(p1.mensualBruto, lang, 2)} brutos al mes durante 6 meses y ${eur(p2.mensualBruto, lang, 2)} después. Si cobrabas 14 pagas de ${num(base, lang)} €, tu base real es de ${eur(base * 14 / 12, lang)} y el paro ${p14 > p1.mensualBruto ? `sube a ${eur(p14, lang, 2)}` : `se queda en el tope de ${eur(p14, lang, 2)}`}.`, `Si aquests ${num(base, lang)} € inclouen la part de les pagues extra, ${eur(p1.mensualBruto, lang, 2)} bruts al mes durant 6 mesos i ${eur(p2.mensualBruto, lang, 2)} després. Si cobraves 14 pagues de ${num(base, lang)} €, la teva base real és de ${eur(base * 14 / 12, lang)} i l’atur ${p14 > p1.mensualBruto ? `puja a ${eur(p14, lang, 2)}` : `es queda al topall de ${eur(p14, lang, 2)}`}.`) },
        { p: L(lang, `¿Cuánto cobro con ${num(base, lang)} € de base y dos hijos?`, `Quant cobro amb ${num(base, lang)} € de base i dos fills?`),
          r: L(lang, `${eur(r2h.periodos[0].mensualBruto, lang, 2)} al mes los primeros 180 días y ${eur(r2h.periodos[1].mensualBruto, lang, 2)} después. ${r2h.periodos[0].mensualBruto > p1.mensualBruto ? `Son ${eur(r2h.periodos[0].mensualBruto - p1.mensualBruto, lang, 2)} más que sin hijos porque el tope sube a ${eur(D.tope_max_2_o_mas, lang)}.` : `Lo mismo que sin hijos: con esta base no llegas a ningún tope.`}`, `${eur(r2h.periodos[0].mensualBruto, lang, 2)} al mes els primers 180 dies i ${eur(r2h.periodos[1].mensualBruto, lang, 2)} després. ${r2h.periodos[0].mensualBruto > p1.mensualBruto ? `Són ${eur(r2h.periodos[0].mensualBruto - p1.mensualBruto, lang, 2)} més que sense fills perquè el topall puja a ${eur(D.tope_max_2_o_mas, lang)}.` : `El mateix que sense fills: amb aquesta base no arribes a cap topall.`}`) },
        { p: L(lang, `¿Cuánto cobro en total con ${num(base, lang)} € de base y 6 años cotizados?`, `Quant cobro en total amb ${num(base, lang)} € de base i 6 anys cotitzats?`),
          r: L(lang, `${eur(calc(0, 2160).total, lang)} brutos en 24 meses, el máximo de duración. Con 1 año cotizado serían 4 meses y ${eur(calc(0, 360).total, lang)}. Con hijos, a partir de una base de ${eur(baseTope2, lang)} ya se cobra el tope más alto.`, `${eur(calc(0, 2160).total, lang)} bruts en 24 mesos, la durada màxima. Amb 1 any cotitzat serien 4 mesos i ${eur(calc(0, 360).total, lang)}. Amb fills, a partir d’una base de ${eur(baseTope2, lang)} ja es cobra el topall més alt.`) },
      ],
      enlaces: vecinos(filas, fila, 3).map((f) => ({ fila: f, texto: L(lang, `Base de ${num(+f.base, lang)} €`, `Base de ${num(+f.base, lang)} €`) })),
    };
  },

  'paro-anos'(fila, { P, lang, anio, filas }) {
    const anos = Number(fila.anos), dias = anos * 365;
    const BASE = 1900;
    const D = P.laboral.desempleo;
    const r = paro({ diasCotizados: dias, baseMensual: BASE, hijos: 0 }, P.laboral);
    const meses = r.duracion / 30;
    const tramo = D.duracion.find((f: any) => dias >= f.cotizados_desde_dias && (f.cotizados_hasta_dias == null || dias <= f.cotizados_hasta_dias));
    const sigT = D.duracion[D.duracion.indexOf(tramo) + 1];
    const ud = (a: number) => (a === 1 ? L(lang, 'año', 'any') : L(lang, 'años', 'anys'));
    const udC = anos === 1 ? 'año cotizado' : 'años cotizados', udCca = anos === 1 ? 'any cotitzat' : 'anys cotitzats';
    const bases = [1450, 1600, 1800, 2000, 2200, 2500];
    const p70 = r.periodos[0], p60 = r.periodos[1];
    const fraseSig = sigT ? L(lang, `Si llegas a ${num(sigT.cotizados_desde_dias, lang)} días cotizados (${num(sigT.cotizados_desde_dias - dias, lang)} más) el paro sube a ${num(sigT.prestacion_dias / 30, lang)} meses.`, `Si arribes a ${num(sigT.cotizados_desde_dias, lang)} dies cotitzats (${num(sigT.cotizados_desde_dias - dias, lang)} més) l’atur puja a ${num(sigT.prestacion_dias / 30, lang)} mesos.`)
      : L(lang, 'Es la duración máxima: cotizar más no alarga el paro.', 'És la durada màxima: cotitzar més no allarga l’atur.');
    return {
      titulo: L(lang, `Paro con ${anos} ${udC}: cuántos meses y cuánto (${anio})`, `Atur amb ${anos} ${udCca}: quants mesos i quant (${anio})`),
      h1: L(lang, `Cuánto paro te queda con ${anos} ${udC}`, `Quant atur et queda amb ${anos} ${udCca}`),
      descripcion: L(lang, `Con ${anos} ${udC} (${num(dias, lang)} días) tienes ${num(meses, lang)} meses de paro. Con 1.900 € de base suman ${eur(r.total, lang)} brutos. Tabla por base.`, `Amb ${anos} ${udCca} (${num(dias, lang)} dies) tens ${num(meses, lang)} mesos d’atur. Amb 1.900 € de base sumen ${eur(r.total, lang)} bruts. Taula per base.`),
      intro: L(lang,
        `<p>El paro dura según los días cotizados en los últimos 6 años sin haberlos usado para otra prestación. Con <strong>${anos} ${udC} (${num(dias, lang)} días)</strong> estás en el tramo de ${num(tramo.cotizados_desde_dias, lang)} a ${tramo.cotizados_hasta_dias == null ? L(lang, 'más', 'més') : num(tramo.cotizados_hasta_dias, lang)} días, que da <strong>${num(meses, lang)} meses de prestación</strong> (${num(r.duracion, lang)} días). ${fraseSig}</p><p>Con una base de 1.900 € cobrarías ${eur(p70.mensualBruto, lang, 2)} al mes ${p60 ? `durante ${num(p70.dias / 30, lang)} meses y ${eur(p60.mensualBruto, lang, 2)} los ${num(p60.dias / 30, lang)} restantes` : `todo el periodo`}: <strong>${eur(r.total, lang)} brutos en total</strong>.</p>`,
        `<p>L’atur dura segons els dies cotitzats en els últims 6 anys sense haver-los fet servir per a una altra prestació. Amb <strong>${anos} ${udCca} (${num(dias, lang)} dies)</strong> ets al tram de ${num(tramo.cotizados_desde_dias, lang)} a ${tramo.cotizados_hasta_dias == null ? L(lang, 'más', 'més') : num(tramo.cotizados_hasta_dias, lang)} dies, que dona <strong>${num(meses, lang)} mesos de prestació</strong> (${num(r.duracion, lang)} dies). ${fraseSig}</p><p>Amb una base de 1.900 € cobraries ${eur(p70.mensualBruto, lang, 2)} al mes ${p60 ? `durant ${num(p70.dias / 30, lang)} mesos i ${eur(p60.mensualBruto, lang, 2)} els ${num(p60.dias / 30, lang)} restants` : `tot el període`}: <strong>${eur(r.total, lang)} bruts en total</strong>.</p>`),
      tablas: [
        { titulo: tt(`Con ${anos} ${anos === 1 ? 'año cotizado' : 'años cotizados'}, según la base (sin hijos)`, `Amb ${anos} ${anos === 1 ? 'any cotitzat' : 'anys cotitzats'}, segons la base (sense fills)`), cab: [tt('Base mensual', 'Base mensual'), tt('Al mes (70 %)', 'Al mes (70 %)'), tt('Al mes (60 %)', 'Al mes (60 %)'), tt('Total bruto', 'Total brut')], formatos: ['eur0', 'eur', 'eur', 'eur0'],
          filas: bases.map((b) => { const x = paro({ diasCotizados: dias, baseMensual: b, hijos: 0 }, P.laboral); return [b, x.periodos[0].mensualBruto, x.periodos[1]?.mensualBruto ?? '—', x.total]; }) },
        { titulo: tt('Duración del paro según los días cotizados', 'Durada de l’atur segons els dies cotitzats'), cab: [tt('Días cotizados', 'Dies cotitzats'), tt('Meses de paro', 'Mesos d’atur')], formatos: ['txt', 'num0'],
          filas: D.duracion.map((f: any) => [`${num(f.cotizados_desde_dias, lang)} – ${f.cotizados_hasta_dias == null ? '…' : num(f.cotizados_hasta_dias, lang)}`, f.prestacion_dias / 30]) },
      ],
      calc: 'paro',
      query: { dias, base: BASE },
      cifra: { e: L(lang, 'Meses de paro', 'Mesos d’atur'), v: meses, f: 'num0', nota: L(lang, `${num(r.duracion, lang)} días de prestación con ${num(dias, lang)} días cotizados`, `${num(r.duracion, lang)} dies de prestació amb ${num(dias, lang)} dies cotitzats`),
        extra: [{ e: L(lang, 'Total con 1.900 € de base', 'Total amb 1.900 € de base'), v: r.total, f: 'eur0' }, { e: L(lang, 'Al mes los primeros 6 meses', 'Al mes els primers 6 mesos'), v: p70.mensualBruto, f: 'eur' }] },
      grafico: { tipo: 'barras', titulo: L(lang, 'Meses de paro según los años cotizados', 'Mesos d’atur segons els anys cotitzats'), formato: 'num0',
        desc: L(lang, `De 4 meses con 1 año a 24 con 6. ${anos} ${ud(anos)}: ${num(meses, lang)} meses.`, `De 4 mesos amb 1 any a 24 amb 6. ${anos} ${ud(anos)}: ${num(meses, lang)} mesos.`),
        filas: filas.map((f) => ({ e: `${f.anos} ${+f.anos === 1 ? L(lang, 'año', 'any') : L(lang, 'años', 'anys')}`, v: paro({ diasCotizados: +f.anos * 365, baseMensual: BASE, hijos: 0 }, P.laboral).duracion / 30, act: f === fila })) },
      faq: [
        { p: L(lang, `¿Cuántos meses de paro me quedan con ${anos} ${udC}?`, `Quants mesos d’atur em queden amb ${anos} ${udCca}?`),
          r: L(lang, `${num(meses, lang)} meses (${num(r.duracion, lang)} días), siempre que esos ${num(dias, lang)} días estén dentro de los últimos 6 años y no se hayan usado para otro paro. ${fraseSig}`, `${num(meses, lang)} mesos (${num(r.duracion, lang)} dies), sempre que aquests ${num(dias, lang)} dies siguin dins dels últims 6 anys i no s’hagin fet servir per a un altre atur. ${fraseSig}`) },
        ((x) => ({ p: L(lang, `¿Cuánto cobro en total con ${anos} ${udC} y 1.600 € de base?`, `Quant cobro en total amb ${anos} ${udCca} i 1.600 € de base?`),
          r: L(lang, `${eur(x.total, lang)} brutos sin hijos: ${eur(x.periodos[0].mensualBruto, lang)} al mes los primeros ${meses > 6 ? '6 meses' : `${num(meses, lang)} meses`}${x.periodos[1] ? ` y ${eur(x.periodos[1].mensualBruto, lang)} después` : ''}. Con 2.200 € de base serían ${eur(paro({ diasCotizados: dias, baseMensual: 2200, hijos: 0 }, P.laboral).total, lang)}.`, `${eur(x.total, lang)} bruts sense fills: ${eur(x.periodos[0].mensualBruto, lang)} al mes els primers ${meses > 6 ? '6 mesos' : `${num(meses, lang)} mesos`}${x.periodos[1] ? ` i ${eur(x.periodos[1].mensualBruto, lang)} després` : ''}. Amb 2.200 € de base serien ${eur(paro({ diasCotizados: dias, baseMensual: 2200, hijos: 0 }, P.laboral).total, lang)}.`) }))(paro({ diasCotizados: dias, baseMensual: 1600, hijos: 0 }, P.laboral)),
      ],
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: L(lang, `${f.anos} ${+f.anos === 1 ? 'año cotizado' : 'años cotizados'}`, `${f.anos} ${+f.anos === 1 ? 'any cotitzat' : 'anys cotitzats'}`) })),
    };
  },
};

export type { PaginaProg };
