// Traducciones al catalán de textos que vienen en castellano dentro de los parámetros (datos, no código).
export const CA: Record<string, string> = {
  'Electricidad': 'Electricitat', 'Gas natural': 'Gas natural', 'Ropa y calzado': 'Roba i calçat', 'Electrónica y electrodomésticos': 'Electrònica i electrodomèstics',
  'Servicios profesionales (asesoría, abogacía, consultoría)': 'Serveis professionals (assessoria, advocacia, consultoria)', 'Telecomunicaciones': 'Telecomunicacions', 'Peluquería': 'Perruqueria', 'Vehículos': 'Vehicles',
  'Hostelería y restauración': 'Hostaleria i restauració', 'Transporte de viajeros': 'Transport de viatgers', 'Vivienda nueva (no VPO)': 'Habitatge nou (no HPO)', 'Agua': 'Aigua', 'Gafas y lentillas': 'Ulleres i lents de contacte',
  'Alimentos no básicos (carne, pescado, pasta)': 'Aliments no bàsics (carn, peix, pasta)', 'Espectáculos culturales en vivo y cine': 'Espectacles culturals en directe i cinema', 'Ejecuciones de obra de renovación de vivienda': 'Obres de renovació d’habitatge',
  'Pan, harinas, leche, quesos, huevos, frutas, verduras, hortalizas, legumbres, tubérculos y cereales': 'Pa, farines, llet, formatges, ous, fruites, verdures, hortalisses, llegums, tubercles i cereals',
  'Aceite de oliva': 'Oli d’oliva', 'Libros, periódicos y revistas': 'Llibres, diaris i revistes', 'Medicamentos de uso humano': 'Medicaments d’ús humà',
  'Productos de higiene femenina y anticonceptivos no medicamentos': 'Productes d’higiene femenina i anticonceptius no medicaments', 'Vivienda de protección oficial de régimen especial': 'Habitatge de protecció oficial de règim especial',
  'Prótesis y vehículos para personas con discapacidad': 'Pròtesis i vehicles per a persones amb discapacitat',
  'Servicios sanitarios (exento)': 'Serveis sanitaris (exempt)', 'Enseñanza reglada (exento)': 'Ensenyament reglat (exempt)', 'Seguros y servicios financieros (exento)': 'Assegurances i serveis financers (exempt)',
  'Alquiler de vivienda (exento)': 'Lloguer d’habitatge (exempt)', 'Segundas y ulteriores entregas de vivienda (exento de IVA, sujeto a ITP)': 'Segones i ulteriors transmissions d’habitatge (exempt d’IVA, subjecte a ITP)',
  'Exportaciones y entregas intracomunitarias (exentas plenas)': 'Exportacions i lliuraments intracomunitaris (exempcions plenes)',
};
export const tr = (s: string, lang: 'es' | 'ca') => (lang === 'ca' ? CA[s] ?? s : s);

export const MODELOS: Record<string, { es: string; ca: string }> = {
  '100': { es: 'Renta', ca: 'Renda' }, '111': { es: 'retenciones de trabajo y profesionales', ca: 'retencions de treball i professionals' },
  '115': { es: 'retenciones de alquileres', ca: 'retencions de lloguers' }, '123': { es: 'retenciones del capital', ca: 'retencions del capital' },
  '130': { es: 'pago fraccionado del IRPF', ca: 'pagament fraccionat de l’IRPF' }, '131': { es: 'pago fraccionado en módulos', ca: 'pagament fraccionat en mòduls' },
  '180': { es: 'resumen anual de alquileres', ca: 'resum anual de lloguers' }, '190': { es: 'resumen anual de retenciones', ca: 'resum anual de retencions' },
  '193': { es: 'resumen anual del capital', ca: 'resum anual del capital' }, '200': { es: 'Impuesto sobre Sociedades', ca: 'Impost sobre societats' },
  '202': { es: 'pago fraccionado de Sociedades', ca: 'pagament fraccionat de societats' }, '216': { es: 'retenciones de no residentes', ca: 'retencions de no residents' },
  '303': { es: 'IVA trimestral', ca: 'IVA trimestral' }, '347': { es: 'operaciones con terceros', ca: 'operacions amb tercers' },
  '349': { es: 'operaciones intracomunitarias', ca: 'operacions intracomunitàries' }, '390': { es: 'resumen anual del IVA', ca: 'resum anual de l’IVA' },
  '714': { es: 'Patrimonio', ca: 'Patrimoni' },
};
