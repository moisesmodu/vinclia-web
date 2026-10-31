import { def, tt } from '../lib/def';
import { verifactu } from '../lib/calc/fiscal';

export default def({
  id: 'verifactu',
  anual: true,
  campos: [
    { id: 'tipo', tipo: 'select', def: 'autonomo', etiqueta: tt('¿Qué eres?', 'Què ets?'), opciones: [{ v: 'autonomo', t: tt('Autónomo (persona física)', 'Autònom (persona física)') }, { v: 'sociedad', t: tt('Sociedad, asociación o fundación (paga Impuesto sobre Sociedades)', 'Societat, associació o fundació (paga Impost sobre societats)') }, { v: 'otros', t: tt('Comunidad de bienes o sociedad civil sin personalidad jurídica', 'Comunitat de béns o societat civil sense personalitat jurídica') }] },
    { id: 'sii', tipo: 'casilla', def: false, etiqueta: tt('Llevo los libros de IVA por el SII', 'Porto els llibres d’IVA pel SII') },
    { id: 'foral', tipo: 'casilla', def: false, etiqueta: tt('Tributo en el País Vasco o Navarra (TicketBAI)', 'Tributo al País Basc o Navarra (TicketBAI)') },
    { id: 'sinFacturas', tipo: 'casilla', def: false, etiqueta: tt('No emito facturas (módulos sin facturar, solo exentas sin obligación)', 'No emeto factures (mòduls sense facturar, només exemptes sense obligació)') },
  ],
  calcular(v, { P }) {
    const r = verifactu({ tipo: v.tipo, sii: v.sii, foral: v.foral, sinFacturas: v.sinFacturas }, P.fiscal);
    const M: Record<string, any> = {
      foral: tt('No te aplica Verifactu: tu territorio tiene TicketBAI o su propio sistema.', 'No t’aplica Verifactu: el teu territori té TicketBAI o el seu propi sistema.'),
      sii: tt('No te aplica: quien ya está en el SII queda fuera de Verifactu.', 'No t’aplica: qui ja és al SII queda fora de Verifactu.'),
      sinFacturas: tt('Si no emites facturas no tienes que adaptar ningún programa.', 'Si no emets factures no has d’adaptar cap programa.'),
    };
    return {
      destacado: { e: tt('Fecha legal de obligación', 'Data legal d’obligació'), v: r.fecha ?? '—', f: r.fecha ? 'fecha' : 'txt', nota: r.obligado ? tt('Tu programa de facturación debe ser «sistema informático de facturación» adaptado.', 'El teu programa de facturació ha de ser «sistema informàtic de facturació» adaptat.') : undefined },
      filas: [
        { e: tt('Sociedades', 'Societats'), v: P.fiscal.verifactu.sociedades_desde, f: 'fecha' },
        { e: tt('Resto (autónomos y demás)', 'Resta (autònoms i altres)'), v: P.fiscal.verifactu.resto_desde, f: 'fecha' },
      ],
      avisos: [
        ...(r.obligado ? [] : [M[r.motivo]]),
        tt('Estado a octubre de 2026: Hacienda ha anunciado otro aplazamiento a 2028, pero todavía no está publicado en el BOE. Mientras no salga, las fechas legales son las de arriba. Esta página se actualiza el mismo día que se publique.', 'Estat a l’octubre del 2026: Hisenda ha anunciat un altre ajornament al 2028, però encara no s’ha publicat al BOE. Mentre no surti, les dates legals són les de dalt. Aquesta pàgina s’actualitza el mateix dia que es publiqui.'),
        tt('La Agencia Tributaria ofrece una aplicación gratuita de facturación que cumple el reglamento.', 'L’Agència Tributària ofereix una aplicació gratuïta de facturació que compleix el reglament.'),
      ],
    };
  },
});
