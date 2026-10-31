import { def, tt, type T, type Tabla } from '../lib/def';
import { sumarDias } from '../lib/calc/base';
import { contarLaborables, sumarHabiles, lugares, nombreLugar, diaSemana, ANIOS_CAL, type Festivo } from '../lib/calc/calendario';

const DIAS: T[] = [tt('lunes', 'dilluns'), tt('martes', 'dimarts'), tt('miércoles', 'dimecres'), tt('jueves', 'dijous'), tt('viernes', 'divendres'), tt('sábado', 'dissabte'), tt('domingo', 'diumenge')];
const ORIGEN: Record<string, T> = { nacional: tt('Nacional', 'Nacional'), sustituible: tt('Nacional (sustituible)', 'Nacional (substituïble)'), autonomico: tt('Autonómico', 'Autonòmic'), local: tt('Local', 'Local') };
const { com, mun } = lugares(2027);
const opciones = [
  ...com.map((c) => ({ v: c.v, t: c.n })),
  ...mun.map((m) => ({ v: m.v, t: { es: `${m.n.es} (municipio)`, ca: `${m.n.ca} (municipi)` } })),
];
const filaFestivo = (f: Festivo) => [f.f, DIAS[diaSemana(f.f)], f.n, ORIGEN[f.o] ?? tt(f.o, f.o)];
const tablaFestivos = (titulo: T, fs: Festivo[]): Tabla => ({ titulo, cab: [tt('Fecha', 'Data'), tt('Día', 'Dia'), tt('Festivo', 'Festiu'), tt('Origen', 'Origen')], formatos: ['fecha', 'txt', 'txt', 'txt'], filas: fs.map(filaFestivo) });

function avisosDatos(r: { sinDatos: number[]; incompletos: number[]; sinLocales: boolean }, lugar: string): T[] {
  const a: T[] = [];
  if (r.sinDatos.length) a.push({ es: `No tenemos festivos de ${r.sinDatos.join(', ')}: en esos años solo se descuentan los fines de semana. Hay datos de ${ANIOS_CAL.join(' y ')}.`, ca: `No tenim festius del ${r.sinDatos.join(', ')}: en aquests anys només es descompten els caps de setmana. Hi ha dades del ${ANIOS_CAL.join(' i ')}.` });
  if (r.incompletos.length) a.push({ es: `La lista de festivos de ${r.incompletos.join(', ')} de este lugar está incompleta.`, ca: `La llista de festius del ${r.incompletos.join(', ')} d’aquest lloc és incompleta.` });
  if (r.sinLocales && lugar.startsWith('m-')) a.push(tt('Para 2026 solo se cuentan los festivos nacionales y autonómicos: los locales de ese año no están en nuestros datos.', 'Per al 2026 només es compten els festius nacionals i autonòmics: els locals d’aquell any no són a les nostres dades.'));
  return a;
}

export default def({
  id: 'dias-laborables',
  campos: [
    { id: 'modo', tipo: 'select', def: 'laborables', etiqueta: tt('Qué quieres calcular', 'Què vols calcular'), opciones: [{ v: 'laborables', t: tt('Días laborables entre dos fechas', 'Dies laborables entre dues dates') }, { v: 'habiles', t: tt('Fin de un plazo en días hábiles', 'Final d’un termini en dies hàbils') }] },
    { id: 'lugar', tipo: 'select', def: 'c-MD', etiqueta: tt('Comunidad o municipio', 'Comunitat o municipi'), ayuda: tt('Con un municipio se suman sus dos festivos locales de 2027.', 'Amb un municipi se sumen els seus dos festius locals del 2027.'), opciones },
    { id: 'desde', tipo: 'fecha', def: '2027-01-01', etiqueta: tt('Desde (o fecha de notificación)', 'Des de (o data de notificació)') },
    { id: 'hasta', tipo: 'fecha', def: '2027-12-31', etiqueta: tt('Hasta (incluido)', 'Fins a (inclòs)'), si: (v) => v.modo !== 'habiles' },
    { id: 'dias', tipo: 'numero', def: 10, min: 1, max: 365, paso: 1, etiqueta: tt('Días hábiles del plazo', 'Dies hàbils del termini'), si: (v) => v.modo === 'habiles' },
  ],
  calcular(v, { lang }) {
    const lugar = String(v.lugar);
    const nombre = nombreLugar(lugar, lang);
    if (v.modo === 'habiles') {
      const p = sumarHabiles(lugar, v.desde, v.dias);
      const fest = p.saltados.filter((s) => s.motivo !== 'finde').map((s) => s.motivo as Festivo);
      const findes = p.saltados.length - fest.length;
      return {
        destacado: { e: tt('Último día del plazo', 'Últim dia del termini'), v: p.fin, f: 'fecha', nota: { es: `${DIAS[diaSemana(p.fin)].es}, en ${nombre}`, ca: `${DIAS[diaSemana(p.fin)].ca}, a ${nombre}` } },
        secundarios: [{ e: tt('Días naturales desde la notificación', 'Dies naturals des de la notificació'), v: p.naturales, f: 'dias' }, { e: tt('Festivos que se saltan', 'Festius que se salten'), v: fest.length, f: 'num0' }],
        filas: [
          { e: tt('Notificación o publicación', 'Notificació o publicació'), v: v.desde, f: 'fecha' },
          { e: tt('Primer día del plazo (el siguiente)', 'Primer dia del termini (el següent)'), v: sumarDias(v.desde, 1), f: 'fecha' },
          { e: tt('Días hábiles contados', 'Dies hàbils comptats'), v: Math.max(1, Math.floor(v.dias)), f: 'num0' },
          { e: tt('Sábados y domingos excluidos', 'Dissabtes i diumenges exclosos'), v: findes, f: 'num0' },
          { e: tt('Festivos excluidos', 'Festius exclosos'), v: fest.length, f: 'num0' },
          { e: tt('Último día del plazo', 'Últim dia del termini'), v: p.fin, f: 'fecha', fuerte: true },
        ],
        tablas: fest.length ? [tablaFestivos(tt('Festivos dentro del plazo', 'Festius dins del termini'), fest)] : [],
        avisos: [
          tt('Ley 39/2015, art. 30.2: los plazos en días se cuentan en días hábiles, excluidos los sábados, los domingos y los festivos, desde el día siguiente a la notificación. Agosto es hábil en vía administrativa (no en la judicial).', 'Llei 39/2015, art. 30.2: els terminis en dies es compten en dies hàbils, exclosos els dissabtes, els diumenges i els festius, des de l’endemà de la notificació. L’agost és hàbil en via administrativa (no en la judicial).'),
          tt('Si tú y el órgano estáis en municipios distintos, un día inhábil en cualquiera de los dos es inhábil para el plazo (art. 30.6).', 'Si tu i l’òrgan sou en municipis diferents, un dia inhàbil en qualsevol dels dos és inhàbil per al termini (art. 30.6).'),
          ...avisosDatos(p, lugar),
        ],
      };
    }
    const desde = v.desde <= v.hasta ? v.desde : v.hasta, hasta = v.desde <= v.hasta ? v.hasta : v.desde;
    const c = contarLaborables(lugar, desde, hasta);
    return {
      destacado: { e: { es: `Días laborables en ${nombre}`, ca: `Dies laborables a ${nombre}` }, v: c.laborables, f: 'num0', nota: tt('de lunes a viernes, sin festivos', 'de dilluns a divendres, sense festius') },
      secundarios: [{ e: tt('Festivos entre semana', 'Festius entre setmana'), v: c.festivos.length, f: 'num0' }, { e: tt('Días naturales', 'Dies naturals'), v: c.naturales, f: 'num0' }],
      filas: [
        { e: tt('Días naturales del periodo', 'Dies naturals del període'), v: c.naturales, f: 'num0' },
        { e: tt('Sábados y domingos', 'Dissabtes i diumenges'), v: c.findes, f: 'num0', signo: '-' },
        { e: tt('Festivos de lunes a viernes', 'Festius de dilluns a divendres'), v: c.festivos.length, f: 'num0', signo: '-' },
        { e: tt('Días laborables', 'Dies laborables'), v: c.laborables, f: 'num0', fuerte: true },
        ...(c.festivosFinde.length ? [{ e: tt('Festivos en sábado o domingo (no restan)', 'Festius en dissabte o diumenge (no resten)'), v: c.festivosFinde.length, f: 'num0' as const, sub: true }] : []),
      ],
      tablas: c.festivos.length || c.festivosFinde.length ? [tablaFestivos(tt('Festivos del periodo', 'Festius del període'), [...c.festivos, ...c.festivosFinde].sort((a, b) => a.f.localeCompare(b.f)))] : [],
      avisos: [
        tt('Se cuentan como laborables los días de lunes a viernes que no son festivos. Si trabajas los sábados, súmalos aparte: el Estatuto de los Trabajadores no los excluye.', 'Es compten com a laborables els dies de dilluns a divendres que no són festius. Si treballes els dissabtes, suma’ls a part: l’Estatut dels Treballadors no els exclou.'),
        ...avisosDatos(c, lugar),
      ],
    };
  },
});

