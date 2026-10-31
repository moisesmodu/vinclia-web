import { def, tt } from '../lib/def';
import { subsidio } from '../lib/calc/laboral';

export default def({
  id: 'subsidio-desempleo',
  anual: true,
  campos: [
    { id: 'meses', tipo: 'numero', def: 18, min: 1, max: 30, paso: 1, etiqueta: tt('Meses de subsidio reconocidos', 'Mesos de subsidi reconeguts') },
    { id: 'mayor52', tipo: 'casilla', def: false, etiqueta: tt('Subsidio para mayores de 52 años', 'Subsidi per a majors de 52 anys') },
    { id: 'parcial', tipo: 'numero', def: 100, min: 10, max: 100, paso: 1, sufijo: '%', etiqueta: tt('Porcentaje de jornada (si venías de tiempo parcial)', 'Percentatge de jornada (si venies de temps parcial)') },
  ],
  calcular(v, { P }) {
    const r = subsidio({ meses: v.meses, mayor52: v.mayor52, parcialPct: v.parcial }, P.laboral);
    const grupos: [string, number, number][] = [];
    for (const f of r.filas) { const g = grupos[grupos.length - 1]; if (g && g[2] === f.importe) g[1] = f.mes; else grupos.push([String(f.mes), f.mes, f.importe]); }
    return {
      destacado: { e: tt('Subsidio el primer mes', 'Subsidi el primer mes'), v: r.filas[0]?.importe ?? 0 },
      secundarios: [{ e: tt('Total del periodo', 'Total del període'), v: r.total }, { e: tt('IPREM mensual', 'IPREM mensual'), v: r.iprem }],
      tablas: [{ cab: [tt('Meses', 'Mesos'), tt('Importe mensual', 'Import mensual')], formatos: ['txt', 'eur'], filas: grupos.map((g) => [g[0] === String(g[1]) ? g[0] : `${g[0]}–${g[1]}`, g[2]]) }],
      avisos: [tt('Desde la reforma de 2024 el subsidio baja por tramos: 95 % del IPREM los 6 primeros meses, 90 % hasta el mes 12 y 80 % después. Se puede compatibilizar con un empleo mediante el complemento de apoyo al empleo.', 'Des de la reforma del 2024 el subsidi baixa per trams: 95 % de l’IPREM els 6 primers mesos, 90 % fins al mes 12 i 80 % després. Es pot compatibilitzar amb una feina mitjançant el complement de suport a l’ocupació.')],
    };
  },
});
