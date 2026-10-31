// Campos reutilizables entre calculadoras.
import { tt, type Campo, type Txt } from './def';
import type { Familia } from './calc/irpf';
import paisES from '../../params/es/pais.json';

export const comunidades = (incluirForal = false): { v: string; t: Txt }[] => {
  const o = Object.entries(paisES.comunidades).map(([v, n]: [string, any]) => ({ v, t: tt(n.es, n.ca) }));
  return incluirForal ? o : o;
};

export const campoComunidad = (def = 'CT'): Campo => ({
  id: 'ccaa', tipo: 'select', def, etiqueta: tt('Comunidad autónoma de residencia', 'Comunitat autònoma de residència'), opciones: comunidades(),
  ayuda: tt('País Vasco y Navarra tienen IRPF foral propio y no están incluidos.', 'El País Basc i Navarra tenen IRPF foral propi i no hi són inclosos.'),
});

export const campoPagas: Campo = { id: 'pagas', tipo: 'select', def: '14', etiqueta: tt('Número de pagas', 'Nombre de pagues'), opciones: [{ v: '14', t: tt('14 pagas (12 + 2 extra)', '14 pagues (12 + 2 extra)') }, { v: '12', t: tt('12 pagas (extras prorrateadas)', '12 pagues (extres prorratejades)') }] };

export const campoContrato: Campo = { id: 'contrato', tipo: 'select', def: 'indefinido', etiqueta: tt('Tipo de contrato', 'Tipus de contracte'), opciones: [{ v: 'indefinido', t: tt('Indefinido', 'Indefinit') }, { v: 'temporal', t: tt('Temporal', 'Temporal') }] };

export const camposFamilia: Campo[] = [
  { id: 'situacion', tipo: 'select', def: '3', etiqueta: tt('Situación familiar', 'Situació familiar'), opciones: [
    { v: '3', t: tt('Soltero, casado con cónyuge con rentas u otras', 'Solter, casat amb cònjuge amb rendes o altres') },
    { v: '2', t: tt('Casado, cónyuge sin rentas de más de 1.500 €', 'Casat, cònjuge sense rendes de més de 1.500 €') },
    { v: '1', t: tt('Soltero, viudo o separado con hijos a cargo exclusivo', 'Solter, vidu o separat amb fills a càrrec exclusiu') },
  ] },
  { id: 'edad', tipo: 'numero', def: 35, min: 16, max: 100, paso: 1, etiqueta: tt('Edad', 'Edat'), sufijo: '' },
  { id: 'hijos', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: tt('Hijos menores de 25 años que conviven', 'Fills menors de 25 anys que hi conviuen') },
  { id: 'menores3', tipo: 'numero', def: 0, min: 0, max: 10, paso: 1, etiqueta: tt('De ellos, menores de 3 años', 'D’aquests, menors de 3 anys'), si: (v) => v.hijos > 0 },
  { id: 'enteros', tipo: 'casilla', def: false, etiqueta: tt('Los hijos solo me computan a mí (100 %)', 'Els fills només em computen a mi (100 %)'), si: (v) => v.hijos > 0 },
  { id: 'discapacidad', tipo: 'select', def: '0', etiqueta: tt('Discapacidad', 'Discapacitat'), opciones: [{ v: '0', t: tt('No', 'No') }, { v: '33', t: tt('Del 33 % al 64 %', 'Del 33 % al 64 %') }, { v: '65', t: tt('65 % o más', '65 % o més') }] },
];

export function familia(v: Record<string, any>): Familia {
  return {
    situacion: Number(v.situacion ?? 3) as 1 | 2 | 3,
    edad: Number(v.edad ?? 35),
    hijos: Number(v.hijos ?? 0),
    hijosMenores3: Number(v.menores3 ?? 0),
    hijosEnteros: !!v.enteros || Number(v.situacion) === 1,
    discapacidad: Number(v.discapacidad ?? 0) as 0 | 33 | 65,
  };
}

export const nombreComunidad = (cod: string, lang: 'es' | 'ca') => (paisES.comunidades as any)[cod]?.[lang] ?? cod;

export const CONCEPTOS_SS: Record<string, Txt> = {
  cc: tt('Contingencias comunes', 'Contingències comunes'),
  desempleo: tt('Desempleo', 'Atur'),
  fp: tt('Formación profesional', 'Formació professional'),
  mei: tt('Mecanismo de Equidad Intergeneracional (MEI)', 'Mecanisme d’Equitat Intergeneracional (MEI)'),
  solidaridad: tt('Cotización de solidaridad', 'Cotització de solidaritat'),
  atep: tt('Accidentes de trabajo y enfermedad profesional (referencia)', 'Accidents de treball i malaltia professional (referència)'),
  fogasa: tt('FOGASA', 'FOGASA'),
};
