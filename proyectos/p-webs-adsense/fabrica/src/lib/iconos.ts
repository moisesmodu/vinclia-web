// Iconos propios de la familia Claro: trazo de 1,8 sobre rejilla de 24, extremos redondeados.
// Cada calculadora tiene el suyo (ICONO_CALC); las que no aparecen usan «calculadora».
const P: Record<string, string> = {
  cartera: '<path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6.5A1.5 1.5 0 0 1 5.5 5H17"/><path d="M15.5 13.5h4.5"/><circle cx="16" cy="13.5" r=".6"/>',
  nomina: '<path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13.5h2M14 13.5h2M8 16.5h2"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  maletin: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 12.5h17"/>',
  paraguas: '<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0M12 3.5V2.5"/>',
  baja: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
  arena: '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 8 5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 5-8 8.5s8 4.5 8 8.5"/>',
  porcentaje: '<path d="M18 6 6 18"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  empresa: '<path d="M4 20.5V5.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14 9.5h5a1 1 0 0 1 1 1v10M2.5 20.5h19"/><path d="M7.5 8.5h3M7.5 12h3M7.5 15.5h3M16.5 13.5h1M16.5 16.5h1"/>',
  subida: '<path d="M3.5 17.5 9.5 11.5l4 4 7-7.5"/><path d="M15 8h5.5v5.5"/>',
  persona: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  casa: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5v10h13v-10M10 19.5v-5h4v5"/>',
  monedas: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.3c.9.1 1.8.2 2.7.2 3.2 0 5.8-1.1 5.8-2.5v-4M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5"/><path d="M14.5 10.6c2.2.3 3.5 1.2 3.5 2.4"/>',
  balanza: '<path d="M12 3.5v17M7 20.5h10M5 6.5h14M5 6.5l-2.5 6a2.5 2.5 0 0 0 5 0zM19 6.5l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  coche: '<path d="M4 16.5V12l2-5a1.5 1.5 0 0 1 1.4-1h9.2a1.5 1.5 0 0 1 1.4 1l2 5v4.5"/><path d="M3.5 12h17v4.5h-17zM6.5 16.5v2M17.5 16.5v2"/><circle cx="7.5" cy="14.2" r=".7"/><circle cx="16.5" cy="14.2" r=".7"/>',
  alerta: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.3v.2"/>',
  documento: '<path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M13.5 3.5v4.5h4.5M9.5 12.5h5M9.5 16h5"/>',
  factura: '<path d="M6.5 3.5h11v17h-11z"/><path d="M9.5 7.5h5M9.5 11h5M9.5 16.5h2M14 16.5h.5"/>',
  euro: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.6A4 4 0 0 0 9 12a4 4 0 0 0 6.5 3.4M7.5 10.8h5M7.5 13.2h5"/>',
  calculadora: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 11.5h.5M11.75 11.5h.5M15 11.5h.5M8.5 15h.5M11.75 15h.5M15 15h.5M8.5 18h.5M11.75 18h3.75"/>',
  tabla: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
  llave: '<circle cx="8" cy="15" r="4.5"/><path d="m11.3 11.7 8.2-8.2M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  bandera: '<path d="M5 21V4M5 4.5h11.5l-2 4 2 4H5"/>',
};

export const ICONO_CALC: Record<string, string> = {
  'sueldo-neto': 'cartera', 'sueldo-bruto': 'subida', nomina: 'nomina', 'coste-empresa': 'empresa', 'retencion-irpf': 'porcentaje',
  'paga-extra': 'monedas', 'subida-sueldo': 'subida', vacaciones: 'calendario', 'horas-extra': 'reloj', 'salario-hora': 'reloj',
  'reduccion-jornada': 'reloj', 'salario-minimo': 'euro', finiquito: 'maletin', 'indemnizacion-despido': 'maletin', paro: 'paraguas',
  'subsidio-desempleo': 'paraguas', 'baja-it': 'baja', 'jubilacion-edad': 'arena', 'pension-jubilacion': 'arena', 'cuota-autonomos': 'persona',
  'irpf-renta': 'documento', 'tipo-marginal-irpf': 'porcentaje', 'obligacion-declarar': 'alerta', iva: 'porcentaje', factura: 'factura',
  'recargo-equivalencia': 'porcentaje', 'modelo-303': 'documento', 'modelo-130': 'documento', 'retenciones-111-115': 'documento',
  verifactu: 'escudo', 'sueldo-neto-autonomo': 'cartera', 'precio-hora-autonomo': 'reloj', 'autonomo-o-asalariado': 'balanza',
  'tarifa-plana-autonomos': 'persona', 'ganancias-patrimoniales': 'subida', 'intereses-deposito': 'monedas', 'alquiler-irpf': 'casa',
  'recargo-fuera-plazo': 'alerta', 'intereses-demora': 'calendario', 'dietas-kilometraje': 'coche',
  'us-cheque-pago': 'cartera', 'us-salario-hora': 'reloj', 'us-impuesto-federal': 'documento', 'us-reembolso': 'monedas',
  'us-1099': 'persona', 'us-impuesto-estatal': 'bandera', 'us-fica': 'porcentaje', 'us-w4': 'nomina', 'us-overtime': 'reloj',
  'us-propinas-overtime': 'monedas', 'us-credito-hijos': 'escudo', 'us-salario-minimo': 'euro', 'us-401k': 'subida',
  'viv-simulador-hipoteca': 'casa', 'viv-revision-euribor': 'subida', 'viv-fija-o-variable': 'balanza', 'viv-cuanta-hipoteca': 'cartera',
  'viv-ahorro-entrada': 'monedas', 'viv-gastos-compraventa': 'factura', 'viv-itp': 'porcentaje', 'viv-iva-ajd': 'porcentaje', 'viv-notaria-registro': 'documento',
  'viv-tabla-amortizacion': 'tabla', 'viv-amortizacion-anticipada': 'reloj', 'viv-cambiar-banco': 'balanza', 'viv-tae': 'porcentaje', 'viv-plusvalia': 'empresa',
  'viv-ganancia-venta': 'subida', 'viv-deduccion-vivienda': 'escudo', 'viv-ibi': 'calendario', 'viv-subida-alquiler': 'llave', 'viv-rentabilidad-alquiler': 'euro',
  'viv-alquilar-o-comprar': 'balanza',
  'us-tarjeta': 'factura', 'us-prestamo-auto': 'coche', 'us-remesas': 'balanza', 'us-tipo-cambio': 'porcentaje',
};

export function icono(nombre: string, tam = 24, clase = 'ico'): string {
  const d = P[nombre] ?? P.calculadora;
  return `<svg class="${clase}" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}
export const iconoCalc = (id: string, tam?: number, clase?: string) => icono(ICONO_CALC[id] ?? 'calculadora', tam, clase);
