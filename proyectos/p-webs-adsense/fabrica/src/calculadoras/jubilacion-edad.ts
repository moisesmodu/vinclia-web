import { def, tt } from '../lib/def';
import { jubilacion } from '../lib/calc/laboral';

export default def({
  id: 'jubilacion-edad',
  campos: [
    { id: 'nacimiento', tipo: 'fecha', def: '1964-05-10', etiqueta: tt('Fecha de nacimiento', 'Data de naixement') },
    { id: 'anios', tipo: 'numero', def: 36, min: 0, max: 50, paso: 1, etiqueta: tt('Años cotizados hasta hoy', 'Anys cotitzats fins avui') },
    { id: 'meses', tipo: 'numero', def: 0, min: 0, max: 11, paso: 1, etiqueta: tt('Meses adicionales', 'Mesos addicionals') },
    { id: 'fecha', tipo: 'fecha', def: '2026-10-28', etiqueta: tt('Fecha de esos datos (informe de vida laboral)', 'Data d’aquestes dades (informe de vida laboral)') },
    { id: 'sigue', tipo: 'casilla', def: true, etiqueta: tt('Seguiré cotizando hasta jubilarme', 'Continuaré cotitzant fins a jubilar-me') },
  ],
  calcular(v) {
    const r = jubilacion({ nacimiento: v.nacimiento, cotizadoMeses: v.anios * 12 + v.meses, fechaCotizado: v.fecha, sigueCotizando: v.sigue });
    const edad = { es: `${r.edadAnios} años${r.edadMeses ? ` y ${r.edadMeses} meses` : ''}`, ca: `${r.edadAnios} anys${r.edadMeses ? ` i ${r.edadMeses} mesos` : ''}` };
    return {
      destacado: { e: tt('Fecha de jubilación ordinaria', 'Data de jubilació ordinària'), v: r.fecha, f: 'fecha', nota: tt(`A los ${edad.es}`, `Als ${edad.ca}`) },
      secundarios: [{ e: tt('Cotizado al jubilarte', 'Cotitzat en jubilar-te'), v: `${Math.floor(r.cotizadoAlJubilarse / 12)} a ${r.cotizadoAlJubilarse % 12} m`, f: 'txt' }],
      filas: [
        { e: tt('Anticipada voluntaria (2 años antes, 35 cotizados)', 'Anticipada voluntària (2 anys abans, 35 cotitzats)'), v: r.voluntaria.cumple ? r.voluntaria.fecha : 'No', f: r.voluntaria.cumple ? 'fecha' : 'txt' },
        { e: tt('Anticipada involuntaria (4 años antes, 33 cotizados)', 'Anticipada involuntària (4 anys abans, 33 cotitzats)'), v: r.involuntaria.cumple ? r.involuntaria.fecha : 'No', f: r.involuntaria.cumple ? 'fecha' : 'txt' },
      ],
      avisos: [
        ...(!r.minimo ? [tt('No llegarías a los 15 años cotizados que exige la pensión contributiva.', 'No arribaries als 15 anys cotitzats que exigeix la pensió contributiva.')] : []),
        tt('Desde 2027 la edad ordinaria es de 67 años, o 65 si has cotizado 38 años y 6 meses. La jubilación anticipada aplica coeficientes reductores sobre la pensión.', 'Des del 2027 l’edat ordinària és de 67 anys, o 65 si has cotitzat 38 anys i 6 mesos. La jubilació anticipada aplica coeficients reductors sobre la pensió.'),
      ],
    };
  },
});
