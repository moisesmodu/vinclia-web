import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'horas-extra',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 24000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual', 'Salari brut anual') },
    { id: 'horasAnuales', tipo: 'numero', def: 1792, min: 500, max: 2200, paso: 1, etiqueta: tt('Jornada anual de tu convenio (horas)', 'Jornada anual del teu conveni (hores)'), ayuda: tt('40 h semanales equivalen a unas 1.792 h al año descontando vacaciones y festivos.', '40 h setmanals equivalen a unes 1.792 h l’any descomptant vacances i festius.') },
    { id: 'horas', tipo: 'numero', def: 10, min: 0, max: 80, paso: 0.5, etiqueta: tt('Horas extra realizadas', 'Hores extra fetes') },
    { id: 'recargo', tipo: 'numero', def: 0, min: 0, max: 200, paso: 5, sufijo: '%', etiqueta: tt('Recargo de tu convenio sobre la hora ordinaria', 'Recàrrec del teu conveni sobre l’hora ordinària'), ayuda: tt('La ley exige como mínimo el valor de la hora ordinaria (art. 35 ET); muchos convenios pagan un 25–75 % más.', 'La llei exigeix com a mínim el valor de l’hora ordinària (art. 35 ET); molts convenis paguen un 25–75 % més.') },
    { id: 'fuerzaMayor', tipo: 'casilla', def: false, etiqueta: tt('Horas por fuerza mayor (siniestros, daños urgentes)', 'Hores per força major (sinistres, danys urgents)') },
    { id: 'irpf', tipo: 'numero', def: 14, min: 0, max: 47, paso: 0.01, sufijo: '%', etiqueta: tt('Tu retención de IRPF', 'La teva retenció d’IRPF') },
  ],
  calcular(v, { P }) {
    const he = P.laboral.cotizacion.horas_extra;
    const precioOrd = v.bruto / v.horasAnuales;
    const precio = precioOrd * (1 + v.recargo / 100);
    const bruto = precio * v.horas;
    // Cotización adicional por horas extra + desempleo y formación, que también se cotizan sobre ellas
    const t = P.laboral.cotizacion.trabajador;
    const tipoSS = Math.round(((v.fuerzaMayor ? he.fuerza_mayor.trabajador : he.resto.trabajador) + t.desempleo_indefinido + t.fp) * 100) / 100;
    const ss = bruto * tipoSS / 100;
    const irpf = bruto * v.irpf / 100;
    const avisos = [tt('El límite legal es de 80 horas extra al año, sin contar las compensadas con descanso en los 4 meses siguientes.', 'El límit legal és de 80 hores extra l’any, sense comptar les compensades amb descans en els 4 mesos següents.')];
    if (v.horas > 80) avisos.unshift(tt('Superas el máximo de 80 horas al año.', 'Superes el màxim de 80 hores l’any.'));
    return {
      destacado: { e: tt('Importe neto de las horas extra', 'Import net de les hores extra'), v: r2(bruto - ss - irpf) },
      secundarios: [{ e: tt('Precio de la hora extra', 'Preu de l’hora extra'), v: r2(precio) }, { e: tt('Hora ordinaria', 'Hora ordinària'), v: r2(precioOrd) }],
      filas: [
        { e: tt('Importe bruto', 'Import brut'), v: r2(bruto) },
        { e: tt(`Cotización del trabajador (${tipoSS} %)`, `Cotització del treballador (${tipoSS} %)`), v: r2(ss), signo: '-' },
        { e: tt(`IRPF (${v.irpf} %)`, `IRPF (${v.irpf} %)`), v: r2(irpf), signo: '-' },
        { e: tt('Neto', 'Net'), v: r2(bruto - ss - irpf), fuerte: true },
      ],
      avisos,
    };
  },
});
