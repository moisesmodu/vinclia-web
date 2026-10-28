import { def, tt } from '../lib/def';
import { r2 } from '../lib/calc/base';

export default def({
  id: 'salario-minimo',
  anual: true,
  campos: [
    { id: 'horas', tipo: 'numero', def: 40, min: 1, max: 40, paso: 0.5, etiqueta: tt('Horas semanales de tu contrato', 'Hores setmanals del teu contracte') },
    { id: 'mio', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Tu salario bruto anual (opcional, para comprobarlo)', 'El teu salari brut anual (opcional, per comprovar-ho)') },
  ],
  calcular(v, { P }) {
    const S = P.laboral.smi;
    const k = v.horas / 40;
    const anual = S.anual * k;
    const avisos = [tt(`El SMI es de ${S.mensual14} € al mes en 14 pagas a jornada completa. Las empleadas de hogar por horas cobran como mínimo ${S.hora_empleo_hogar} € por hora trabajada.`, `El SMI és de ${S.mensual14} € al mes en 14 pagues a jornada completa. Les treballadores de la llar per hores cobren com a mínim ${S.hora_empleo_hogar} € per hora treballada.`)];
    if (v.mio > 0) avisos.unshift(v.mio + 0.005 >= anual ? tt('Tu salario cumple el salario mínimo para tu jornada.', 'El teu salari compleix el salari mínim per a la teva jornada.') : tt(`Cobras ${r2(anual - v.mio)} € al año menos del mínimo legal para tu jornada: reclama la diferencia.`, `Cobres ${r2(anual - v.mio)} € l’any menys del mínim legal per a la teva jornada: reclama la diferència.`));
    return {
      destacado: { e: tt('Salario mínimo anual para tu jornada', 'Salari mínim anual per a la teva jornada'), v: r2(anual) },
      secundarios: [{ e: tt('Al mes (14 pagas)', 'Al mes (14 pagues)'), v: r2(S.mensual14 * k) }, { e: tt('Al mes (12 pagas)', 'Al mes (12 pagues)'), v: r2(anual / 12) }],
      filas: [
        { e: tt('Por día', 'Per dia'), v: r2(S.diario * k) },
        { e: tt('Por hora (jornada de 1.792 h)', 'Per hora (jornada de 1.792 h)'), v: r2(S.anual / 1792) },
        { e: tt('Empleo de hogar, por hora', 'Treball de la llar, per hora'), v: S.hora_empleo_hogar },
      ],
      avisos,
    };
  },
});
