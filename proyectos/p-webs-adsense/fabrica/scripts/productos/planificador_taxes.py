"""Planificador de taxes 2026 en español (ChequeClaro): impuesto federal y estatal, pagos estimados del 1099 con sus
fechas de 2026 y 2027, checklist de documentos y glosario.

    python3 scripts/productos/planificador_taxes.py [--demo]

Cifras de params/us/2026/{fiscal,laboral}.json y nombres de estados de params/us/pais.json. Las fórmulas reproducen
impuestoFederal() e impuestoEstatal() de src/lib/calc/us.ts (tests/productos.test.ts).
"""
from __future__ import annotations

import sys
from datetime import date, timedelta

from comun import (Estilo, Hoja, SALIDA, escribir, fuente_de, guardar, hoja_parametros, html_pdf, instrucciones, mezclar, nombre,
                   nombre_rango, nuevo_libro, params, portada, portada_pdf, producto, url_publica, poner, leer_json)

ID = 'planificador-taxes-2026'
ANIO = 2026
F = params('us', ANIO, 'fiscal')
L = params('us', ANIO, 'laboral')
PAIS = leer_json('params/us/pais.json')
EC = ['single', 'mfj', 'hoh', 'mfs']
EC_ES = ['Soltero (single)', 'Casado, declaración conjunta (married filing jointly)', 'Cabeza de familia (head of household)', 'Casado, declaración separada (married filing separately)']
DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def n_esimo_lunes(anio, mes, n):
    d = date(anio, mes, 1)
    while d.weekday() != 0:
        d += timedelta(days=1)
    return d + timedelta(weeks=n - 1)


def festivos_federales(anio):
    """Festivos que pueden mover un vencimiento del día 15 (Pub. 509 del IRS): MLK, Emancipation Day observado, Labor Day."""
    em = date(anio, 4, 16)
    if em.weekday() == 5:
        em -= timedelta(days=1)
    elif em.weekday() == 6:
        em += timedelta(days=1)
    return {n_esimo_lunes(anio, 1, 3), em, n_esimo_lunes(anio, 9, 1), date(anio, 1, 1), date(anio, 6, 19), date(anio, 7, 4)}


def vencimiento(anio_fiscal: int, k: int) -> date:
    mm, dd = map(int, F['pagos_estimados']['vencimientos'][k].split('-'))
    y = anio_fiscal + (1 if mm == 1 else 0)
    d = date(y, mm, dd)
    while d.weekday() >= 5 or d in festivos_federales(d.year):
        d += timedelta(days=1)
    return d


def por_estado(o, ec, alias=None):
    if not o:
        return None
    if ec in o:
        return o[ec]
    if alias and ec in alias and alias[ec] in o:
        return o[alias[ec]]
    return o.get('single')


def construir(demo=False):
    E = Estilo('eeuu', moneda='usd')
    P = producto(ID)
    wb = nuevo_libro()
    url = url_publica('eeuu')
    fed = F['federal']
    A = L['autonomos']
    FI = L['fica']
    CH = F['credito_hijos']
    Q = F['qbi']
    PE = F['pagos_estimados']
    ff, fa, fch, fq, fpe = fuente_de(fed), fuente_de(A), fuente_de(CH), fuente_de(Q), fuente_de(PE)
    ffi = fuente_de(FI)

    portada(wb, E, titulo=P['nombre']['es'], subtitulo='Calcula tu impuesto federal y estatal de 2026, el self-employment tax del 1099 y tus cuatro pagos estimados, con las fechas, la lista de papeles y un glosario en español.',
            edicion=f'Año fiscal {ANIO} (se declara en {ANIO + 1}) · cifras del IRS a {F["actualizado"]}',
            pasos=['Rellena «Tus datos»: estado civil, estado, salario W-2, ingresos y gastos del 1099 y dependientes.',
                   'Mira «Resumen»: cuánto deberás o te devolverán, y cuánto apartar cada mes.',
                   'Apunta tus pagos en «Pagos estimados» y junta los papeles de «Documentos» antes de declarar.'],
            contenido=[('Resumen', 'Lo importante en una pantalla'), ('Tus datos', 'Estado civil, estado, ingresos, gastos y dependientes'),
                       ('Federal', 'Form 1040 paso a paso: AGI, deducción, QBI, tramos, crédito por hijos y Schedule SE'),
                       ('Estatal', 'Impuesto de tu estado (20 estados)'), ('Pagos estimados', 'Form 1040-ES: cuánto y cuándo, con fechas de 2026 y 2027'),
                       ('Documentos', 'Checklist de W-2, 1099, créditos y deducciones'), ('Glosario', 'Los términos del IRS explicados en español'),
                       ('Parámetros', 'Cifras oficiales con su fuente'), ('Tablas', 'Tramos federales y datos de cada estado')],
            avisos=['Herramienta orientativa: no es asesoría fiscal ni sustituye a un preparador de impuestos (tax preparer) ni al software del IRS. No somos el IRS ni ninguna agencia del gobierno.',
                    'No incluye ganancias de capital, deducciones por propinas u horas extra (ley OBBBA), créditos por ingreso del trabajo (EITC), educación ni impuestos locales.',
                    'Contenido preparado con ayuda de inteligencia artificial y revisado con las fuentes oficiales citadas (IRS, SSA y departamentos de impuestos estatales).',
                    'Funciona en Excel, LibreOffice y Google Sheets. Las hojas de cálculo están protegidas sin contraseña: Review → Unprotect Sheet (Revisar → Desproteger hoja).'],
            url=url + '/' + P['ruta']['es'] + '/')
    instrucciones(wb, E, 'Cómo se usa el planificador', [
        ('1. Tus datos', ['Estado civil: el que pondrás en el Form 1040. Si estás casado, la declaración conjunta casi siempre paga menos.',
                          'Salarios W-2: la casilla 1 de tu W-2 (ya sin el 401(k) antes de impuestos). Retención: la casilla 2 (federal) y la 17 (estatal). Si aún no tienes el W-2, suma lo de tus talones de pago (paystubs) y multiplica hasta fin de año.',
                          'Ingresos 1099: todo lo que te pagaron como contratista (1099-NEC, 1099-K de apps y plataformas, efectivo). Gastos: millas, teléfono, herramientas, comisiones de la app… los del Schedule C.',
                          'Hijos: menores de 17 a 31 de diciembre, con número de Seguro Social (SSN). Otros dependientes: hijos de 17 o más, padres a tu cargo o hijos con ITIN.']),
        ('2. Pagos estimados', ['Como contratista nadie te retiene: el IRS espera que pagues durante el año (Form 1040-ES) si vas a deber 1,000 $ o más.',
                                'La hoja te da el importe mínimo para no tener multa (puerto seguro) si pones el impuesto del año pasado, y el importe para no deber nada en abril.',
                                'Paga en IRS Direct Pay o EFTPS y apunta la fecha y el importe en la tabla.']),
        ('3. Antes de declarar', ['Marca los documentos de la hoja «Documentos» a medida que los recibes (llegan entre enero y mediados de febrero).',
                                  'Compara el resultado con el de tu preparador o software: si hay mucha diferencia, revisa los datos.']),
        ('Qué no hace', ['No calcula ganancias de capital, dividendos calificados, deducciones por propinas u horas extra, EITC, créditos de educación, impuestos locales (NYC, condados), ni la multa exacta por pagar tarde (Form 2210).']),
        ('Ayuda', ['¿Algo no cuadra? Escríbenos a hola@numimates.com.']),
    ])

    # ------------------------------------------------------------ Parámetros
    filas = [{'seccion': 'Federal: deducción estándar'}]
    for k, ec in enumerate(EC):
        filas.append({'clave': f'STD_{k + 1}', 'concepto': f'Deducción estándar · {EC_ES[k]}', 'valor': fed['deduccion_estandar'][ec], 'fmt': E.fmt_dinero0, 'fuente': ff[0], 'url': ff[1]})
    filas += [{'seccion': 'Seguro Social y Medicare (FICA y Schedule SE)'},
              {'clave': 'SE_BASE', 'concepto': 'Base del self-employment tax (% de la ganancia)', 'valor': A['base_pct'], 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'SE_SS', 'concepto': 'Seguro Social del autónomo (%)', 'valor': A['seguro_social_pct'], 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'SE_MED', 'concepto': 'Medicare del autónomo (%)', 'valor': A['medicare_pct'], 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'SE_MIN', 'concepto': 'Ganancia mínima para pagar self-employment tax ($)', 'valor': A['minimo_ganancia'], 'fmt': E.fmt_dinero0, 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'SE_DED', 'concepto': 'Parte deducible del self-employment tax (%)', 'valor': A['deducible_pct'], 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'SS_TOPE', 'concepto': 'Tope de salario del Seguro Social ($)', 'valor': FI['tope_salarial'], 'fmt': E.fmt_dinero0, 'fuente': ffi[0], 'url': ffi[1]},
              {'clave': 'MED_ADIC', 'concepto': 'Medicare adicional (%)', 'valor': FI['medicare_adicional_pct'], 'fuente': ffi[0], 'url': ffi[1]},
              {'clave': 'MED_RET', 'concepto': 'El empleador retiene el adicional por encima de ($)', 'valor': FI['umbral_retencion_adicional'], 'fmt': E.fmt_dinero0, 'fuente': ffi[0], 'url': ffi[1]}]
    for k, ec in enumerate(EC):
        filas.append({'clave': f'MED_UMB_{k + 1}', 'concepto': f'Umbral del Medicare adicional · {EC_ES[k]}', 'valor': FI['umbrales_adicional'][ec], 'fmt': E.fmt_dinero0, 'fuente': ffi[0], 'url': ffi[1]})
    filas += [{'seccion': 'Deducción QBI (sección 199A)'}, {'clave': 'QBI_PCT', 'concepto': 'Deducción por ingreso de negocio (%)', 'valor': Q['pct'], 'fuente': fq[0], 'url': fq[1]}]
    for k, ec in enumerate(EC):
        filas.append({'clave': f'QBI_UMB_{k + 1}', 'concepto': f'Umbral (sin límites por debajo) · {EC_ES[k]}', 'valor': Q['umbral'][ec], 'fmt': E.fmt_dinero0, 'fuente': fq[0], 'url': fq[1]})
    filas += [{'seccion': 'Crédito tributario por hijos (CTC)'},
              {'clave': 'CTC_HIJO', 'concepto': 'Por hijo menor de 17 ($)', 'valor': CH['por_hijo'], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]},
              {'clave': 'CTC_OTRO', 'concepto': 'Por otro dependiente ($)', 'valor': CH['otros_dependientes'], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]},
              {'clave': 'CTC_REEMB', 'concepto': 'Parte reembolsable máxima por hijo (ACTC) ($)', 'valor': CH['reembolsable_max'], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]},
              {'clave': 'CTC_UMB_GAN', 'concepto': 'ACTC: ingreso ganado a partir de ($)', 'valor': CH['umbral_ingreso_ganado'], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]},
              {'clave': 'CTC_PCT', 'concepto': 'ACTC: % del ingreso ganado por encima', 'valor': CH['pct_reembolsable'], 'fuente': fch[0], 'url': fch[1]},
              {'clave': 'CTC_RED', 'concepto': 'Reducción por cada 1.000 $ por encima del umbral ($)', 'valor': CH['reduccion_por_1000'], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]}]
    for k, ec in enumerate(EC):
        filas.append({'clave': f'CTC_UMB_{k + 1}', 'concepto': f'Umbral de reducción · {EC_ES[k]}', 'valor': CH['umbral_reduccion'][ec], 'fmt': E.fmt_dinero0, 'fuente': fch[0], 'url': fch[1]})
    ps = PE['puerto_seguro']
    filas += [{'seccion': 'Pagos estimados (Form 1040-ES)'},
              {'clave': 'PE_UMBRAL', 'concepto': 'Hay que hacer pagos si vas a deber al menos ($)', 'valor': PE['umbral_deber'], 'fmt': E.fmt_dinero0, 'fuente': fpe[0], 'url': fpe[1]},
              {'clave': 'PE_ACTUAL', 'concepto': 'Puerto seguro: % del impuesto de este año', 'valor': ps['pct_anio_actual'], 'fuente': fpe[0], 'url': fpe[1]},
              {'clave': 'PE_ANTERIOR', 'concepto': 'Puerto seguro: % del impuesto del año pasado', 'valor': ps['pct_anio_anterior'], 'fuente': fpe[0], 'url': fpe[1]},
              {'clave': 'PE_ANTERIOR_ALTO', 'concepto': 'Puerto seguro con AGI alto: % del año pasado', 'valor': ps['pct_anio_anterior_agi_alto'], 'fuente': fpe[0], 'url': fpe[1]},
              {'clave': 'PE_AGI_ALTO', 'concepto': 'AGI alto a partir de ($)', 'valor': ps['agi_alto'], 'fmt': E.fmt_dinero0, 'fuente': fpe[0], 'url': fpe[1]},
              {'clave': 'PE_AGI_ALTO_MFS', 'concepto': 'AGI alto, casado por separado ($)', 'valor': ps['agi_alto_mfs'], 'fmt': E.fmt_dinero0, 'fuente': fpe[0], 'url': fpe[1]}]
    hoja_parametros(wb, E, filas, sub=f'Cifras de params/us/{ANIO} a {F["actualizado"]}: IRS (Rev. Proc. 2025-32), SSA y estados.')

    # ------------------------------------------------------------ Tablas (tramos federales y estados)
    ht = Hoja(wb, 'Tablas', E, E.suave, {'A': 3, 'B': 14, 'C': 14, 'D': 10, 'E': 12, 'F': 3, 'G': 8, 'H': 22, 'I': 12, 'J': 16, 'K': 9, 'L': 11, 'M': 11, 'N': 11, 'O': 11, 'P': 11, 'Q': 11, 'R': 11, 'S': 11, 'T': 11, 'U': 11, 'V': 12, 'W': 11, 'X': 11, 'Y': 11, 'Z': 11, 'AA': 11, 'AB': 12})
    fila = ht.cabecera('Tablas', 'Tramos federales y estatales en formato de lista: cuota = Σ (base − desde) × diferencia de tipo', 'AB')
    ht.tabla_cab(fila, 2, ['Escala', 'Desde ($)', 'Tipo %', 'Diferencia'])
    r = fila + 1
    t0 = r
    def escala(clave, tramos):
        nonlocal r
        desde = 0
        for k, t in enumerate(tramos):
            ht.formula(f'B{r}', clave, h='left')
            ht.formula(f'C{r}', desde, fmt='#,##0')
            ht.formula(f'D{r}', t['tipo'], fmt='0.000')
            ht.formula(f'E{r}', f'=D{r}' if k == 0 else f'=D{r}-D{r - 1}', fmt='0.000')
            desde = t['hasta']
            r += 1
    for k, ec in enumerate(EC):
        escala(f'FED|{k + 1}', fed['tramos'][ec])
    estados = sorted(F['estados'].items(), key=lambda kv: PAIS['estados'].get(kv[0], {}).get('nombre', kv[0]))
    for cod, d in estados:
        if d['tipo'] == 'progresivo':
            for k, ec in enumerate(EC):
                escala(f'{cod}|{k + 1}', por_estado(d['tramos'], ec, d.get('tramos_alias')))
    t1 = r - 1
    nombre_rango(wb, 'ESC_K', 'Tablas', f'B{t0}:B{t1}')
    nombre_rango(wb, 'ESC_DESDE', 'Tablas', f'C{t0}:C{t1}')
    nombre_rango(wb, 'ESC_DELTA', 'Tablas', f'E{t0}:E{t1}')
    # Estados: una fila cada uno
    cab = ['Código', 'Estado', 'Tipo', 'Base', '% único', 'Ded. single', 'Ded. mfj', 'Ded. hoh', 'Ded. mfs', 'Exención por persona', 'Exención personal single', 'mfj', 'hoh', 'mfs',
           'Exención por dependiente', 'Sobretasa desde', 'Sobretasa %', 'Crédito personal single', 'mfj', 'hoh', 'mfs', 'Crédito por dependiente']
    ht.tabla_cab(fila, 7, cab, alto=42)
    s0 = fila + 1
    for k, (cod, d) in enumerate(estados):
        rr = s0 + k
        vals = [cod, PAIS['estados'].get(cod, {}).get('nombre', cod), d['tipo'], d.get('base', 'agi'), d.get('pct', 0)]
        de = d.get('deduccion_estandar')
        vals += ['federal'] * 4 if de == 'federal' else [(por_estado(de, ec) or 0) for ec in EC]
        vals += [d.get('exencion_persona') or 0] + [(por_estado(d.get('exencion_personal'), ec) or 0) for ec in EC]
        vals += [d.get('exencion_dependiente') or 0, (d.get('sobretasa') or {}).get('umbral', 0), (d.get('sobretasa') or {}).get('pct', 0)]
        vals += [(por_estado(d.get('credito_personal'), ec) or 0) for ec in EC] + [d.get('credito_dependiente') or 0]
        for j, v in enumerate(vals):
            c = ht.ws.cell(rr, 7 + j).coordinate
            ht.formula(c, v, fmt='#,##0.##' if isinstance(v, (int, float)) and j >= 4 else None, h='left' if j < 4 else 'right')
    s1 = s0 + len(estados) - 1
    from openpyxl.utils import get_column_letter as gl
    for j, nom in enumerate(['EST_COD', 'EST_NOM', 'EST_TIPO', 'EST_BASE', 'EST_PCT', 'EST_DED1', 'EST_DED2', 'EST_DED3', 'EST_DED4', 'EST_EXPERS', 'EST_EXP1', 'EST_EXP2', 'EST_EXP3', 'EST_EXP4',
                             'EST_EXDEP', 'EST_SOB_UMB', 'EST_SOB_PCT', 'EST_CP1', 'EST_CP2', 'EST_CP3', 'EST_CP4', 'EST_CDEP']):
        nombre_rango(wb, nom, 'Tablas', f'{gl(7 + j)}{s0}:{gl(7 + j)}{s1}')
    ht.nota(f'G{s1 + 2}', 'Fuentes: IRS Rev. Proc. 2025-32 y los departamentos de impuestos de cada estado (detalle y notas en params/us/2026/fiscal.json). Los estados con «verificado: false» en esos archivos se marcan en la hoja «Estatal».')
    ht.proteger()

    # ------------------------------------------------------------ Tus datos
    hd = Hoja(wb, 'Tus datos', E, E.acento, {'A': 3, 'B': 54, 'C': 30, 'D': 62})
    fila = hd.cabecera('Tus datos', f'Año fiscal {ANIO}: lo que ganaste del 1 de enero al 31 de diciembre', 'D')
    hd.leyenda(fila); fila += 2
    nombres_estados = [PAIS['estados'].get(c, {}).get('nombre', c) for c, _ in estados]
    datos = [
        ('seccion', 'Tú y tu familia'),
        ('Estado civil para declarar (filing status)', EC_ES[0], EC_ES, 'El de tu Form 1040.', 'EC_TXT'),
        ('Estado donde vives', 'Texas', 'estados', 'Si te mudaste durante el año, elige donde viviste más tiempo (aproximación).', 'ESTADO_NOM'),
        ('Hijos menores de 17 con SSN', 0, 'entero', 'Para el crédito por hijos (Child Tax Credit).', 'HIJOS'),
        ('Otros dependientes', 0, 'entero', 'Hijos de 17 o más, padres a tu cargo, hijos con ITIN.', 'OTROSDEP'),
        ('seccion', 'Trabajo con W-2 (empleado)'),
        ('Salarios W-2 (casilla 1)', 0, 'dinero', 'Si tienes varios W-2, súmalos. Sin el 401(k) antes de impuestos.', 'SAL'),
        ('Impuesto federal retenido (casilla 2)', 0, 'dinero', '', 'RET_FED'),
        ('Impuesto estatal retenido (casilla 17)', 0, 'dinero', '', 'RET_EST'),
        ('seccion', 'Trabajo por tu cuenta (1099)'),
        ('Ingresos 1099 del año', 0, 'dinero', '1099-NEC, 1099-K de apps (Uber, DoorDash, Etsy…) y pagos en efectivo.', 'ING1099'),
        ('Gastos del negocio (Schedule C)', 0, 'dinero', 'Millas × tarifa del IRS, teléfono, herramientas, seguro, comisiones…', 'GAS1099'),
        ('seccion', 'Otros'),
        ('Otros ingresos (intereses, desempleo…)', 0, 'dinero', 'Tributan como el salario.', 'OTROS'),
        ('Deducciones detalladas (si vas a detallar)', 0, 'dinero', 'Déjalo en 0 para usar la deducción estándar.', 'DETALLADA'),
        ('Impuesto total del año pasado (Form 1040, línea 24)', 0, 'dinero', 'Para el puerto seguro de los pagos estimados. 0 si no lo sabes.', 'PREV_TAX'),
        ('AGI del año pasado (Form 1040, línea 11)', 0, 'dinero', '', 'PREV_AGI'),
    ]
    for d in datos:
        if d[0] == 'seccion':
            hd.seccion(fila, d[1], 'B', 'D'); fila += 1
            continue
        texto, defecto, tipo, ayuda, nom = d
        hd.etiqueta(f'B{fila}', texto, bold=True)
        hd.entrada(f'C{fila}', defecto, fmt=E.fmt_dinero if tipo == 'dinero' else None, h='left' if tipo in ('estados',) or isinstance(tipo, list) else 'right')
        if isinstance(tipo, list):
            hd.lista(f'C{fila}', tipo)
        elif tipo == 'estados':
            hd.lista(f'C{fila}', 'EST_NOM')
        elif tipo == 'entero':
            hd.numero(f'C{fila}', 0, 20, decimal=False)
        elif tipo == 'dinero':
            hd.numero(f'C{fila}', 0)
        hd.nota(f'D{fila}', ayuda)
        nombre(wb, nom, 'Tus datos', f'C{fila}')
        hd.ws.row_dimensions[fila].height = 22
        fila += 1
    fila += 1
    hd.c(f'B{fila}', 'Estado civil (número, lo usan las fórmulas)', font=E.f(9, False, E.suave))
    hd.formula(f'C{fila}', '=MATCH(EC_TXT,{' + ','.join(f'"{x}"' for x in EC_ES) + '},0)', h='center')
    nombre(wb, 'EC', 'Tus datos', f'C{fila}')
    fila += 1
    hd.c(f'B{fila}', 'Fila del estado en «Tablas»', font=E.f(9, False, E.suave))
    hd.formula(f'C{fila}', '=MATCH(ESTADO_NOM,EST_NOM,0)', h='center')
    nombre(wb, 'EST_I', 'Tus datos', f'C{fila}')
    hd.proteger()

    def cuota(base, clave):
        return f'SUMPRODUCT((ESC_K={clave})*({base}>ESC_DESDE)*({base}-ESC_DESDE)*ESC_DELTA)/100'
    choose4 = lambda pre: f'CHOOSE(EC,{pre}_1,{pre}_2,{pre}_3,{pre}_4)'

    # ------------------------------------------------------------ Federal
    hf = Hoja(wb, 'Federal', E, E.pri, {'A': 3, 'B': 60, 'C': 18, 'D': 60})
    fila = hf.cabecera(f'Impuesto federal {ANIO}', 'Form 1040 y Schedule SE, paso a paso', 'D')
    fila += 1
    R = {}
    def lf(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hf.etiqueta(f'B{fila}', texto, bold=bold)
        (hf.resultado if res else hf.formula)(f'C{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hf.nota(f'D{fila}', nota_)
        R[clave] = f'C{fila}'
        nombre(wb, 'FED_' + clave.upper(), 'Federal', f'C{fila}')
        fila += 1
    hf.seccion(fila, 'Self-employment tax (Schedule SE)', 'B', 'D'); fila += 1
    lf('gan', 'Ganancia neta del negocio (Schedule C)', '=MAX(0,ING1099-GAS1099)')
    lf('sebase', 'Base: 92.35% de la ganancia', f'=ROUND({R["gan"]}*SE_BASE/100,2)')
    no_se = f'OR({R["sebase"]}<SE_MIN,{R["gan"]}<SE_MIN)'
    lf('sess', 'Seguro Social (12.4% hasta el tope, menos tu salario W-2)', f'=IF({no_se},0,ROUND(MIN({R["sebase"]},MAX(0,SS_TOPE-SAL))*SE_SS/100,2))')
    lf('semed', 'Medicare (2.9%)', f'=IF({no_se},0,ROUND({R["sebase"]}*SE_MED/100,2))')
    lf('se', 'Self-employment tax', f'={R["sess"]}+{R["semed"]}', bold=True)
    lf('sededuc', 'Mitad deducible', f'=ROUND({R["se"]}*SE_DED/100,2)')
    fila += 1
    hf.seccion(fila, 'Renta imponible (Form 1040)', 'B', 'D'); fila += 1
    lf('total_ing', 'Ingresos totales', f'=SAL+{R["gan"]}+OTROS')
    lf('agi', 'Ingreso bruto ajustado (AGI)', f'=MAX(0,{R["total_ing"]}-{R["sededuc"]})', bold=True)
    lf('std', 'Deducción estándar', '=' + choose4('STD'))
    lf('ded', 'Deducción que se aplica (la mayor)', f'=MAX({R["std"]},DETALLADA)')
    lf('antesqbi', 'Renta antes de la deducción QBI', f'=MAX(0,{R["agi"]}-{R["ded"]})')
    lf('qbi', 'Deducción por ingreso de negocio (QBI, 20%)', f'=IF(AND(MAX(0,{R["gan"]}-{R["sededuc"]})>0,{R["antesqbi"]}<={choose4("QBI_UMB")}),ROUND(MIN(MAX(0,{R["gan"]}-{R["sededuc"]}),{R["antesqbi"]})*QBI_PCT/100,2),0)', nota_='Solo por debajo del umbral, donde no hay límites por tipo de negocio')
    lf('imponible', 'Renta imponible (taxable income)', f'=MAX(0,{R["antesqbi"]}-{R["qbi"]})', bold=True)
    clave_fed = '"FED|"&EC'
    lf('escala', 'Impuesto según los tramos', f'=ROUND({cuota(R["imponible"], clave_fed)},2)')
    fila += 1
    hf.seccion(fila, 'Créditos por hijos (Schedule 8812)', 'B', 'D'); fila += 1
    lf('ctcbruto', 'Crédito bruto', '=HIJOS*CTC_HIJO+OTROSDEP*CTC_OTRO')
    lf('ctcred', 'Reducción por ingresos', f'=ROUNDUP(MAX(0,{R["agi"]}-{choose4("CTC_UMB")})/1000,0)*CTC_RED')
    lf('ctcpot', 'Crédito posible', f'=MAX(0,{R["ctcbruto"]}-{R["ctcred"]})')
    lf('ctcno', 'Parte no reembolsable (resta del impuesto)', f'=MIN({R["ctcpot"]},MAX(0,{R["escala"]}))')
    lf('ctcre', 'Parte reembolsable (ACTC)', f'=ROUND(MIN(MAX(0,MIN({R["ctcpot"]},HIJOS*CTC_HIJO)-{R["ctcno"]}),HIJOS*CTC_REEMB,MAX(0,SAL+MAX(0,{R["gan"]}-{R["sededuc"]})-CTC_UMB_GAN)*CTC_PCT/100),2)', nota_='Te la pagan aunque no debas impuesto')
    fila += 1
    hf.seccion(fila, 'Total', 'B', 'D'); fila += 1
    lf('renta', 'Impuesto sobre la renta', f'=MAX(0,{R["escala"]}-{R["ctcno"]})')
    lf('medadic', 'Medicare adicional (Form 8959)', f'=ROUND(MAX(0,SAL+{R["sebase"]}-{choose4("MED_UMB")})*MED_ADIC/100,2)')
    lf('total', 'IMPUESTO FEDERAL TOTAL', f'={R["renta"]}+{R["se"]}+{R["medadic"]}', res=True)
    lf('pagos', 'Retención W-2 + ACTC + Medicare adicional retenido', f'=RET_FED+{R["ctcre"]}+ROUND(MAX(0,SAL-MED_RET)*MED_ADIC/100,2)')
    lf('resultado', 'Antes de pagos estimados: reembolso (+) o a pagar (−)', f'={R["pagos"]}-{R["total"]}', res=True)
    lf('efectivo', 'Tipo efectivo', f'=IF({R["total_ing"]}>0,{R["total"]}/{R["total_ing"]},0)', fmt='0.0%')
    lf('marginal', 'Tipo marginal federal', f'=IF({R["imponible"]}<=0,0,SUMPRODUCT((ESC_K="FED|"&EC)*({R["imponible"]}>ESC_DESDE)*ESC_DELTA))/100', fmt='0%')
    fila += 1
    hf.nota(f'B{fila}', 'Simplificado: sin ganancias de capital, deducciones por propinas u horas extra, EITC ni otros créditos. Es el mismo cálculo que la calculadora de reembolso de ChequeClaro.')
    hf.ws.merge_cells(f'B{fila}:D{fila}')
    hf.proteger()

    # ------------------------------------------------------------ Estatal
    hs = Hoja(wb, 'Estatal', E, E.pri, {'A': 3, 'B': 60, 'C': 18, 'D': 60})
    fila = hs.cabecera(f'Impuesto estatal {ANIO}', '="Estado: "&ESTADO_NOM', 'D')
    fila += 1
    S = {}
    def ls(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hs.etiqueta(f'B{fila}', texto, bold=bold)
        (hs.resultado if res else hs.formula)(f'C{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hs.nota(f'D{fila}', nota_)
        S[clave] = f'C{fila}'
        nombre(wb, 'EST_' + clave.upper() + '_R', 'Estatal', f'C{fila}')
        fila += 1
    ix = lambda n: f'INDEX({n},EST_I)'
    ls('tipo', 'Tipo de impuesto', f'=IF({ix("EST_TIPO")}="ninguno","Sin impuesto sobre la renta",IF({ix("EST_TIPO")}="plano","Tipo único","Progresivo"))', fmt=None)
    ls('base', 'Ingreso de partida', f'=CHOOSE(MATCH({ix("EST_BASE")},{{"agi","federal_imponible","salario_bruto"}},0),FED_AGI,FED_IMPONIBLE,SAL+FED_GAN)', nota_='AGI federal, renta imponible federal o salario, según el estado')
    dep = '(HIJOS+OTROSDEP)'
    ded_fija = f'IF({ix("EST_DED1")}="federal",FED_STD,CHOOSE(EC,{ix("EST_DED1")},{ix("EST_DED2")},{ix("EST_DED3")},{ix("EST_DED4")}))'
    ls('deducciones', 'Deducciones y exenciones del estado', f'={ded_fija}+{ix("EST_EXPERS")}*(IF(EC=2,2,1)+{dep})+CHOOSE(EC,{ix("EST_EXP1")},{ix("EST_EXP2")},{ix("EST_EXP3")},{ix("EST_EXP4")})+{ix("EST_EXDEP")}*{dep}')
    ls('imponible', 'Renta imponible estatal', f'=ROUND(MAX(0,{S["base"]}-{S["deducciones"]}),2)', bold=True)
    ls('bruto', 'Impuesto antes de créditos', f'=IF({ix("EST_TIPO")}="plano",{S["imponible"]}*{ix("EST_PCT")}/100,IF({ix("EST_TIPO")}="progresivo",{cuota(S["imponible"], ix("EST_COD") + "&\"|\"&EC")},0))+IF(AND({ix("EST_SOB_UMB")}>0,{S["imponible"]}>{ix("EST_SOB_UMB")}),({S["imponible"]}-{ix("EST_SOB_UMB")})*{ix("EST_SOB_PCT")}/100,0)')
    ls('creditos', 'Créditos personales y por dependientes', f'=CHOOSE(EC,{ix("EST_CP1")},{ix("EST_CP2")},{ix("EST_CP3")},{ix("EST_CP4")})+{ix("EST_CDEP")}*{dep}')
    ls('impuesto', 'IMPUESTO ESTATAL', f'=IF({ix("EST_TIPO")}="ninguno",0,ROUND(MAX(0,{S["bruto"]}-{S["creditos"]}),2))', res=True)
    ls('resultado', 'Retención estatal − impuesto: reembolso (+) o a pagar (−)', f'=RET_EST-{S["impuesto"]}', res=True)
    fila += 1
    hs.nota(f'B{fila}', 'Simplificado: aplica la deducción estándar o las exenciones, los tramos y los créditos personales del estado. No incluye impuestos locales (NYC, Yonkers, condados de Maryland, EIT de Pensilvania), créditos especiales ni el pago estimado estatal: cada estado tiene su formulario y sus fechas.')
    hs.ws.merge_cells(f'B{fila}:D{fila + 1}')
    hs.ws.row_dimensions[fila].height = 30
    hs.proteger()

    # ------------------------------------------------------------ Pagos estimados
    hp = Hoja(wb, 'Pagos estimados', E, E.marca, {'A': 3, 'B': 30, 'C': 22, 'D': 18, 'E': 18, 'F': 16, 'G': 16, 'H': 16})
    fila = hp.cabecera('Pagos estimados (Form 1040-ES)', 'Cuánto pagar cada trimestre para no tener multa ni sustos en abril', 'H')
    hp.leyenda(fila); fila += 2
    PG = {}
    def lp(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hp.etiqueta(f'B{fila}', texto, bold=bold)
        hp.ws.merge_cells(f'B{fila}:C{fila}')
        (hp.resultado if res else hp.formula)(f'D{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hp.nota(f'E{fila}', nota_)
            hp.ws.merge_cells(f'E{fila}:H{fila}')
        PG[clave] = f'D{fila}'
        nombre(wb, 'PE_' + clave.upper() + '_R', 'Pagos estimados', f'D{fila}')
        fila += 1
    lp('total', 'Impuesto federal total del año', '=FED_TOTAL')
    lp('pagos', 'Ya cubierto por retenciones y créditos reembolsables', '=FED_PAGOS')
    lp('falta', 'Lo que faltaría pagar', f'=MAX(0,{PG["total"]}-{PG["pagos"]})', bold=True)
    lp('obligado', '¿Tienes que hacer pagos estimados?', f'=IF({PG["falta"]}>=PE_UMBRAL,"Sí","No: debes menos de "&PE_UMBRAL&" $")', fmt=None, bold=True)
    lp('minimo', 'Mínimo del año para no tener multa (puerto seguro)', f'=MAX(0,IF(PREV_TAX>0,MIN({PG["total"]}*PE_ACTUAL/100,PREV_TAX*IF(PREV_AGI>IF(EC=4,PE_AGI_ALTO_MFS,PE_AGI_ALTO),PE_ANTERIOR_ALTO,PE_ANTERIOR)/100),{PG["total"]}*PE_ACTUAL/100)-{PG["pagos"]})',
       nota_='El menor entre el 90% de este año y el 100% del año pasado (110% con AGI alto), menos lo retenido')
    lp('trim_min', 'Pago trimestral mínimo (puerto seguro)', f'=ROUND({PG["minimo"]}/4,2)', res=True)
    lp('trim_todo', 'Pago trimestral para no deber nada en abril', f'=ROUND({PG["falta"]}/4,2)', res=True)
    lp('mes', 'Aparta cada mes (federal + estatal)', f'=ROUND(({PG["falta"]}+MAX(0,-EST_RESULTADO_R))/12,2)', bold=True)
    lp('pct', 'Porcentaje de tu ganancia 1099 que conviene apartar', f'=IF(FED_GAN>0,({PG["falta"]}+MAX(0,-EST_RESULTADO_R))/FED_GAN,0)', fmt='0.0%')
    fila += 1
    hp.tabla_cab(fila, 2, ['Pago', 'Ingresos del periodo', 'Vence', 'Importe sugerido', 'Pagado ($)', 'Fecha de pago', 'Pendiente'])
    fila += 1
    periodos = ['1 ene – 31 mar', '1 abr – 31 may', '1 jun – 31 ago', '1 sep – 31 dic']
    q0 = fila
    for af in (ANIO, ANIO + 1):
        hp.c(f'B{fila}', f'Año fiscal {af}' + ('' if af == ANIO else ' (para planificar)'), font=E.f(10, True, E.pri), fill=E.tenue)
        for col in 'CDEFGH':
            hp.ws[f'{col}{fila}'].fill = E.relleno(E.tenue)
        fila += 1
        for k in range(4):
            d = vencimiento(af, k)
            hp.formula(f'B{fila}', f'{k + 1}.º pago {af}', h='left')
            hp.formula(f'C{fila}', periodos[k], h='left')
            hp.formula(f'D{fila}', d, fmt=E.fmt_fecha, h='center', bold=True)
            if af == ANIO:
                hp.formula(f'E{fila}', f'=MAX({PG["trim_min"]},{PG["trim_todo"]})', fmt=E.fmt_dinero)
                nombre(wb, f'VENCE_{af}_{k + 1}', 'Pagos estimados', f'D{fila}')
            else:
                hp.formula(f'E{fila}', 'Con tus cifras de ' + str(af), h='center', color=E.suave)
                nombre(wb, f'VENCE_{af}_{k + 1}', 'Pagos estimados', f'D{fila}')
            hp.entrada(f'F{fila}', None, fmt=E.fmt_dinero)
            hp.entrada(f'G{fila}', None, fmt=E.fmt_fecha, h='center')
            hp.formula(f'H{fila}', f'=IF(ISNUMBER(E{fila}),MAX(0,E{fila}-N(F{fila})),"")', fmt=E.fmt_dinero)
            fila += 1
    hp.resaltar_si(f'B{q0}:H{fila - 1}', f'AND(ISNUMBER($D{q0}),$D{q0}>=TODAY(),$D{q0}-TODAY()<=21,N($F{q0})=0)', mezclar(E.acento, 0.5), bold=True)
    fila += 1
    hp.nota(f'B{fila}', PE['regla_dia'] + ' Fechas calculadas con esa regla y los festivos federales. Paga en IRS Direct Pay (irs.gov/payments) o EFTPS y guarda el justificante. ' + 'Fuente: ' + fpe[0])
    hp.ws.merge_cells(f'B{fila}:H{fila + 1}')
    hp.ws.row_dimensions[fila].height = 30
    hp.proteger()

    # ------------------------------------------------------------ Documentos
    hk = Hoja(wb, 'Documentos', E, E.acento, {'A': 3, 'B': 22, 'C': 70, 'D': 18, 'E': 10})
    fila = hk.cabecera('Documentos para declarar', 'Llegan entre enero y mediados de febrero. Marca «Sí» cuando lo tengas.', 'E')
    hk.tabla_cab(fila, 2, ['Documento', 'Qué es y para qué sirve', 'Quién te lo manda', '¿Lo tengo?'])
    fila += 1
    docs = [
        ('Identidad', [('SSN o ITIN', 'Número de Seguro Social o ITIN tuyo, de tu cónyuge y de cada dependiente. Para el crédito por hijos, el hijo necesita SSN.', 'SSA / IRS'),
                       ('Declaración del año pasado', 'Tu Form 1040 anterior: el AGI y el impuesto total sirven para firmar electrónicamente y para el puerto seguro.', 'Tú'),
                       ('Cuenta bancaria', 'Número de ruta (routing) y de cuenta para recibir el reembolso por depósito directo.', 'Tu banco')]),
        ('Ingresos', [('W-2', 'Salarios y retenciones de cada empleador. Casilla 1: salario; casilla 2: federal retenido; casilla 17: estatal.', 'Cada empleador'),
                      ('1099-NEC', 'Pagos de 600 $ o más como contratista independiente.', 'Cada cliente'),
                      ('1099-K', 'Pagos por apps y plataformas (Uber, DoorDash, PayPal, Etsy…).', 'La plataforma'),
                      ('1099-INT / 1099-DIV', 'Intereses y dividendos de bancos y brókeres.', 'Banco o bróker'),
                      ('1099-G', 'Desempleo cobrado y reembolsos estatales.', 'Tu estado'),
                      ('Registro de ingresos en efectivo', 'Todo lo cobrado sin 1099 también se declara.', 'Tú')]),
        ('Gastos del negocio', [('Registro de millas', 'Fecha, destino, motivo y millas de cada viaje de trabajo. Sin registro, el IRS puede rechazar la deducción.', 'Tú'),
                                ('Recibos y facturas', 'Teléfono, herramientas, material, seguros, comisiones de la app, oficina en casa.', 'Tú'),
                                ('Pagos estimados hechos', 'Fechas e importes de los pagos del Form 1040-ES (hoja «Pagos estimados»).', 'Tú / IRS')]),
        ('Créditos y deducciones', [('Form 1098', 'Intereses de la hipoteca (si vas a detallar).', 'Tu banco'),
                                    ('Form 1098-E', 'Intereses del préstamo estudiantil.', 'Quien te prestó'),
                                    ('Form 1098-T', 'Matrícula universitaria (créditos de educación).', 'La universidad'),
                                    ('Form 1095-A', 'Seguro médico del Marketplace (crédito de prima).', 'HealthCare.gov'),
                                    ('Gastos de cuidado de niños', 'Nombre, dirección y EIN o SSN de la guardería o cuidador.', 'La guardería'),
                                    ('Aportes a IRA o HSA', 'Formularios 5498 y 5498-SA.', 'Tu bróker o banco')]),
    ]
    d0 = fila
    for grupo, items in docs:
        hk.seccion(fila, grupo, 'B', 'E'); fila += 1
        for doc, que, quien in items:
            hk.formula(f'B{fila}', doc, bold=True, h='left')
            hk.c(f'C{fila}', que, font=E.f(9), wrap=True, border=E.b_fino)
            hk.formula(f'D{fila}', quien, h='left', color=E.suave)
            hk.entrada(f'E{fila}', None, h='center')
            hk.lista(f'E{fila}', ['Sí', 'No', 'No aplica'])
            hk.ws.row_dimensions[fila].height = 30
            fila += 1
    hk.resaltar_si(f'B{d0}:E{fila - 1}', f'OR($E{d0}="Sí",$E{d0}="No aplica")', 'E6F4F1', font_color='6B7B80')
    hk.proteger()

    # ------------------------------------------------------------ Glosario
    hg = Hoja(wb, 'Glosario', E, E.marca, {'A': 3, 'B': 30, 'C': 100})
    fila = hg.cabecera('Glosario de taxes en español', 'Las palabras del IRS que vas a ver en los formularios', 'C')
    hg.tabla_cab(fila, 2, ['Término', 'Qué significa'])
    fila += 1
    glos = [('AGI (Adjusted Gross Income)', 'Ingreso bruto ajustado: tus ingresos totales menos algunos ajustes (la mitad del self-employment tax, aportes a IRA…). Decide muchos créditos y límites.'),
            ('Taxable income', 'Renta imponible: el AGI menos la deducción estándar o detallada y la QBI. Sobre ella se aplican los tramos.'),
            ('Standard deduction', 'Deducción estándar: una cantidad fija que restas sin justificar gastos. Casi todo el mundo la usa.'),
            ('Itemized deductions', 'Deducciones detalladas (Schedule A): hipoteca, impuestos estatales y locales, donativos… Solo conviene si suman más que la estándar.'),
            ('Filing status', 'Estado civil para declarar: single, married filing jointly, married filing separately, head of household.'),
            ('Head of household', 'Cabeza de familia: soltero que paga más de la mitad de los gastos de la casa de un dependiente. Tiene tramos y deducción mejores que single.'),
            ('Tax bracket', 'Tramo: cada parte de tu renta paga su tipo. Subir de tramo solo afecta a lo que pasa del límite.'),
            ('Marginal rate', 'Tipo marginal: el del último dólar que ganas.'), ('Effective rate', 'Tipo efectivo: impuesto total entre ingresos totales.'),
            ('Withholding', 'Retención: lo que tu empleador descuenta de cada cheque y manda al IRS por ti.'),
            ('W-4', 'Formulario que das a tu empleador para decidir cuánto te retiene.'), ('W-2', 'Resumen anual de salario y retenciones que te da cada empleador.'),
            ('1099-NEC', 'Formulario de pagos a contratistas independientes (non-employee compensation).'), ('1099-K', 'Pagos recibidos por apps y plataformas de pago.'),
            ('Independent contractor', 'Contratista independiente: trabajas por tu cuenta; nadie te retiene y pagas el self-employment tax.'),
            ('Schedule C', 'Anexo del 1040 donde declaras ingresos y gastos de tu negocio. Resultado: la ganancia neta.'),
            ('Schedule SE', 'Anexo donde calculas el self-employment tax.'),
            ('Self-employment tax', 'Seguro Social (12.4%) y Medicare (2.9%) del trabajador por cuenta propia: pagas la parte del empleado y la del empleador. La mitad se resta del AGI.'),
            ('FICA', 'Seguro Social (6.2%) y Medicare (1.45%) que se descuentan del cheque del empleado.'),
            ('QBI deduction', 'Deducción del 20% del ingreso calificado de negocio (sección 199A) para autónomos y pequeños negocios.'),
            ('Estimated tax (1040-ES)', 'Pagos estimados: lo que pagas al IRS durante el año cuando no te retienen lo suficiente. Cuatro plazos al año.'),
            ('Safe harbor', 'Puerto seguro: si pagas a tiempo cierto mínimo (90% de este año o 100%/110% del año pasado), no hay multa aunque debas en abril.'),
            ('Underpayment penalty', 'Multa por pagar poco o tarde durante el año (Form 2210).'),
            ('Child Tax Credit (CTC)', 'Crédito por hijos menores de 17 con SSN. Resta directamente del impuesto.'),
            ('ACTC (Additional Child Tax Credit)', 'Parte reembolsable del crédito por hijos: te la pagan aunque no debas impuesto.'),
            ('Credit for Other Dependents', 'Crédito de 500 $ por dependientes que no cumplen el CTC.'),
            ('Refund', 'Reembolso: lo que te devuelve el IRS si pagaste de más.'), ('Balance due', 'Lo que te toca pagar al declarar.'),
            ('EIN', 'Número de identificación de empleador; también lo usan algunos negocios propios.'), ('ITIN', 'Número de identificación del contribuyente para quien no puede tener SSN.'),
            ('Direct Pay / EFTPS', 'Formas oficiales de pagar al IRS por internet desde tu cuenta bancaria.'), ('Tax preparer', 'Preparador de impuestos. Exige que firme con su PTIN.')]
    for t, s in glos:
        hg.formula(f'B{fila}', t, bold=True, h='left', color=E.pri)
        hg.c(f'C{fila}', s, font=E.f(10), wrap=True, border=E.b_fino)
        hg.ws.row_dimensions[fila].height = 30 if len(s) > 95 else 18
        fila += 1
    hg.proteger()

    # ------------------------------------------------------------ Resumen
    hr = Hoja(wb, 'Resumen', E, E.acento, {'A': 3, 'B': 50, 'C': 20, 'D': 20, 'E': 3})
    fila = hr.cabecera(f'Tus taxes de {ANIO}', '=EC_TXT&" · "&ESTADO_NOM', 'D')
    fila += 1
    hr.tabla_cab(fila, 2, ['', 'Federal', 'Estatal'])
    fila += 1
    for txt, ff_, fe_, fmt, fuerte in [('Impuesto del año', '=FED_TOTAL', '=EST_IMPUESTO_R', E.fmt_dinero, True), ('   de él, self-employment tax', '=FED_SE', '', E.fmt_dinero, False),
                                       ('Ya retenido o cubierto por créditos', '=FED_PAGOS', '=RET_EST', E.fmt_dinero, False),
                                       ('Reembolso (+) o a pagar (−), sin pagos estimados', '=FED_RESULTADO', '=EST_RESULTADO_R', E.fmt_dinero, True),
                                       ('Tipo efectivo', '=FED_EFECTIVO', '=IF(FED_AGI>0,EST_IMPUESTO_R/FED_AGI,0)', '0.0%', False)]:
        hr.etiqueta(f'B{fila}', txt, bold=fuerte)
        (hr.resultado if fuerte else hr.formula)(f'C{fila}', ff_, fmt=fmt)
        if fe_:
            (hr.resultado if fuerte else hr.formula)(f'D{fila}', fe_, fmt=fmt)
        fila += 1
    fila += 1
    hr.tabla_cab(fila, 2, ['Pagos estimados', 'Importe', 'Próximo vencimiento'])
    fila += 1
    hr.etiqueta(f'B{fila}', '¿Tienes que hacerlos?', bold=True)
    hr.formula(f'C{fila}', '=PE_OBLIGADO_R', h='center', bold=True)
    venc = ','.join(f'VENCE_{af}_{k}' for af in (ANIO, ANIO + 1) for k in range(1, 5))
    hr.formula(f'D{fila}', '=MIN(' + ','.join(f'IF(VENCE_{af}_{k}>=TODAY(),VENCE_{af}_{k},99999)' for af in (ANIO, ANIO + 1) for k in range(1, 5)) + ')', fmt=E.fmt_fecha, h='center', bold=True)
    fila += 1
    hr.etiqueta(f'B{fila}', 'Pago trimestral para no deber nada en abril', bold=True)
    hr.resultado(f'C{fila}', '=PE_TRIM_TODO_R', fmt=E.fmt_dinero)
    fila += 1
    hr.etiqueta(f'B{fila}', 'Mínimo trimestral para no tener multa')
    hr.formula(f'C{fila}', '=PE_TRIM_MIN_R', fmt=E.fmt_dinero)
    fila += 1
    hr.etiqueta(f'B{fila}', 'Aparta cada mes', bold=True)
    hr.resultado(f'C{fila}', '=PE_MES_R', fmt=E.fmt_dinero)
    hr.formula(f'D{fila}', '=PE_PCT_R', fmt='0.0" % de tu ganancia"')
    fila += 2
    hr.nota(f'B{fila}', 'Estimación orientativa con las cifras oficiales de 2026. No es asesoría fiscal: compara con tu preparador o con el software del IRS antes de declarar.', italic=True)
    hr.ws.merge_cells(f'B{fila}:D{fila}')
    hr.proteger()

    orden = ['Portada', 'Instrucciones', 'Resumen', 'Tus datos', 'Federal', 'Estatal', 'Pagos estimados', 'Documentos', 'Glosario', 'Parámetros', 'Tablas']
    wb._sheets = [wb[n] for n in orden]
    if demo:
        for k, v in [('EC_TXT', EC_ES[2]), ('ESTADO_NOM', 'California'), ('HIJOS', 2), ('SAL', 28000), ('RET_FED', 900), ('RET_EST', 250), ('ING1099', 41000), ('GAS1099', 7600), ('PREV_TAX', 5200), ('PREV_AGI', 52000)]:
            poner(wb, k, v)
    return wb


def guia_html() -> str:
    E = Estilo('eeuu', moneda='usd')
    url = url_publica('eeuu')
    fechas = ''.join(f'<tr><td>{k + 1}.º pago</td><td>{vencimiento(ANIO, k).strftime("%m/%d/%Y")}</td><td>{vencimiento(ANIO + 1, k).strftime("%m/%d/%Y")}</td></tr>' for k in range(4))
    cuerpo = portada_pdf(E, 'Guía rápida del Planificador de taxes 2026', 'Cómo calcular lo que deberás, cuánto apartar del 1099 y cuándo pagar al IRS, sin sorpresas en abril.',
                         ['Federal y estatal', 'Self-employment tax', 'Pagos estimados', 'Checklist', 'Glosario'],
                         f'{E.nombre} · {url.replace("https://", "")} · hola@numimates.com<br>No somos el IRS. Herramienta orientativa: no es asesoría fiscal. Contenido preparado con ayuda de IA y revisado con fuentes oficiales (IRS, SSA).')
    cuerpo += f"""
<h2>1. En diez minutos</h2>
<ol class="pasos"><li><strong>Tus datos.</strong> Estado civil, estado donde vives, salario y retenciones del W-2, ingresos y gastos del 1099, hijos y dependientes.</li>
<li><strong>Resumen.</strong> Verás el impuesto federal (con el self-employment tax) y el estatal, lo que ya tienes cubierto y si te tocará pagar o te devolverán.</li>
<li><strong>Pagos estimados.</strong> Si vas a deber {F['pagos_estimados']['umbral_deber']:,} $ o más, el IRS espera pagos trimestrales. La hoja te da el mínimo sin multa y el importe para no deber nada.</li>
<li><strong>Documentos.</strong> Marca lo que vas recibiendo entre enero y febrero.</li></ol>

<h2>2. Fechas de los pagos estimados</h2>
<table><tr><th>Pago</th><th>Año fiscal {ANIO}</th><th>Año fiscal {ANIO + 1}</th></tr>{fechas}</table>
<p class="fuentes">{F['pagos_estimados']['regla_dia']} Fuente: {fuente_de(F['pagos_estimados'])[0]}.</p>

<h2>3. Lo que conviene saber del 1099</h2>
<ul><li>Nadie te retiene: pagas impuesto sobre la renta y además el <strong>self-employment tax</strong> (Seguro Social y Medicare de las dos partes) sobre el 92.35% de tu ganancia.</li>
<li>Resta tus <strong>gastos del negocio</strong> en el Schedule C: millas (con registro), teléfono, herramientas, comisiones de la app. Guarda los recibos tres años como mínimo.</li>
<li>La mitad del self-employment tax se resta del AGI y, por debajo del umbral, tienes la deducción <strong>QBI</strong> del 20%.</li>
<li><strong>Puerto seguro:</strong> si pagas a tiempo al menos el 90% del impuesto de este año o el 100% del año pasado (110% si tu AGI pasó de 150,000 $), no hay multa aunque debas algo en abril.</li></ul>
<div class="caja">Paga solo en <strong>irs.gov/payments</strong> (Direct Pay) o en EFTPS. El IRS no llama ni pide pagos con tarjetas de regalo.</div>

<h2>4. Lo que no incluye</h2>
<p>Ganancias de capital, deducciones por propinas u horas extra de la ley OBBBA, EITC, créditos de educación, impuestos locales (NYC, condados) ni la multa exacta del Form 2210. Para eso, usa un preparador o el software del IRS.</p>
<p class="legal">Año fiscal {ANIO}, cifras de params/us/{ANIO} a {F['actualizado']} (IRS Rev. Proc. 2025-32, SSA y estados). No somos el IRS ni ninguna agencia del gobierno. Herramienta orientativa, no es asesoría fiscal. Contenido preparado con ayuda de inteligencia artificial y revisado con las fuentes oficiales citadas. Dudas: hola@numimates.com.</p>"""
    return html_pdf(E, 'Guía rápida del Planificador de taxes 2026', cuerpo)


def main():
    out = SALIDA / ID
    guardar(construir(), out / 'planificador-taxes-2026.xlsx')
    escribir(out / 'fuente' / 'guia-planificador-taxes-2026.html', guia_html())
    if '--demo' in sys.argv:
        guardar(construir(demo=True), out / 'demo' / 'planificador-taxes-2026-demo.xlsx')
    print('Planificador de taxes: listo en', out)


if __name__ == '__main__':
    main()
