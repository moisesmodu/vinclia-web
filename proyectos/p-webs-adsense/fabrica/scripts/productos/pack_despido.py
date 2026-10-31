"""Pack despido y finiquito (NetoClaro): comprobador de finiquito e indemnización, plazos y guía en PDF.

    python3 scripts/productos/pack_despido.py [--demo]

Cifras de params/es/<año>/laboral.json (indemnización, vacaciones, plazos) y festivos de calendario.json.
Las fórmulas reproducen finiquito() e indemnizacion() de src/lib/calc/laboral.ts y sumarHabiles() de calendario.ts
(tests/productos.test.ts). No es asesoramiento jurídico: lo dice la portada, cada hoja de cálculo y el PDF.
"""
from __future__ import annotations

import sys
from datetime import date

from comun import (Estilo, Hoja, SALIDA, escribir, fecha_iso, fuente_de, guardar, hoja_parametros, html_pdf, instrucciones, mezclar,
                   nombre, nombre_rango, nuevo_libro, params, portada, portada_pdf, producto, url_publica, poner, leer_json)

ID = 'pack-despido'
# Se vende a finales de 2026 para despidos de 2026 y 2027: parámetros vigentes de 2026 (los de 2027 son iguales en
# indemnizaciones y plazos) y festivos de los dos años
CAL = {y: params('es', y, 'calendario') for y in (2026, 2027)}
ANIO = min(CAL)
L = params('es', ANIO, 'laboral')
AVISO = 'No es asesoramiento jurídico: es una herramienta para comprobar cifras con la ley y el convenio. Si hay mucho en juego, consulta con un abogado laboralista o con tu sindicato.'

MOTIVOS = ['Baja voluntaria (sin indemnización)', 'Fin de contrato temporal (12 días por año)', 'Despido objetivo o ERE (20 días por año)',
           'Despido improcedente (33 días; 45 antes de 2012)', 'Despido disciplinario declarado procedente (sin indemnización)']


def construir(demo=False):
    E = Estilo('nomina')
    P = producto(ID)
    wb = nuevo_libro()
    I = L['indemnizacion']
    DP = L['despido_plazos']
    url = url_publica('nomina')
    fi = fuente_de(I)
    fdp = fuente_de(DP)

    portada(wb, E, titulo=P['nombre']['es'], subtitulo='Comprueba concepto por concepto lo que te ofrece la empresa: salario de los últimos días, vacaciones, pagas extra e indemnización, con los plazos para reclamar.',
            edicion=f'Edición {ANIO}-{ANIO + 1} · parámetros a {L["actualizado"]}',
            pasos=['Rellena «Tus datos»: salario, fechas, vacaciones y motivo de la salida.',
                   'Copia en «Comprobación» lo que pone el finiquito de la empresa. Verás la diferencia en cada concepto.',
                   'Mira «Plazos»: el último día para presentar la papeleta de conciliación (20 días hábiles en el despido).'],
            contenido=[('Tus datos', 'Salario, fechas, vacaciones, pagas, motivo y comunidad'), ('Comprobación', 'Lo que te corresponde frente a lo que ofrece la empresa, con la diferencia'),
                       ('Finiquito', 'Detalle del cálculo: días del mes, vacaciones y pagas extra'), ('Indemnización', 'Meses de antigüedad, tramos antes y después de 2012 y topes'),
                       ('Plazos', 'Último día para la papeleta, para reclamar cantidades y para pedir el paro'), ('Festivos', f'Festivos de cada comunidad en {min(CAL)} y {max(CAL)}'),
                       ('Parámetros', 'Cifras legales con su fuente')],
            avisos=[AVISO, 'El convenio colectivo puede mejorar la ley (más días de vacaciones, pagas distintas, complementos): pon tus cifras del convenio en «Tus datos».',
                    'Contenido preparado con ayuda de inteligencia artificial y revisado con las fuentes oficiales citadas (Estatuto de los Trabajadores, LRJS, BOE).',
                    'Funciona en Excel, LibreOffice y Google Sheets. Las hojas de cálculo están protegidas sin contraseña: Revisar → Desproteger hoja.'],
            url=url + '/' + P['ruta']['es'] + '/')
    instrucciones(wb, E, 'Cómo se usa el pack', [
        ('1. Tus datos', ['Salario bruto mensual: el de una paga, sin prorrata, tal como aparece en la nómina (salario base más complementos fijos).',
                          'Pagas: 14 si cobras las extras aparte; 12 si las tienes prorrateadas en cada nómina (entonces no se te deben pagas extra en el finiquito).',
                          'Último día trabajado: el día en que acaba el contrato o el que pone la carta de despido como fecha de efectos.',
                          'Días de vacaciones al año: 30 naturales como mínimo (art. 38 ET); muchos convenios dan más. Pon los que ya has disfrutado este año.',
                          'Salario anual para la indemnización: por defecto, el mensual por las pagas. Si cobras variables, horas extra habituales o complementos, súmalos: la indemnización se calcula con el salario real.']),
        ('2. Comprobación', ['En la columna amarilla copia lo que pone el documento de finiquito de la empresa en cada concepto. La columna «Diferencia» dice si te falta dinero.',
                             'Si te falta, no firmes «conforme»: firma escribiendo «Recibí, no conforme» y la fecha. Así cobras lo que te dan y puedes reclamar el resto (guía en PDF).']),
        ('3. Plazos', ['El plazo del despido es de caducidad: si pasa, se pierde el derecho a impugnarlo. Son 20 días hábiles desde el día siguiente al despido; no cuentan sábados, domingos ni festivos.',
                       'Elige tu comunidad y, si los conoces, añade los festivos locales de tu municipio. El último día sale solo.',
                       'La papeleta de conciliación suspende el plazo. No lo apures: preséntala cuanto antes.']),
        ('Qué no hace', ['No calcula el IRPF ni la Seguridad Social del finiquito, los salarios de tramitación, el despido nulo ni las mejoras de tu convenio que no hayas puesto. ' + AVISO]),
        ('Ayuda', ['¿Algo no cuadra? Escribe a hola@numimates.com.']),
    ])

    vac = L['vacaciones']['dias_naturales_minimos']
    corte = fecha_iso(I['fecha_corte_reforma'])
    filas = [{'seccion': 'Indemnización por despido (Estatuto de los Trabajadores)'},
             {'clave': 'D_IMPROC', 'concepto': 'Despido improcedente: días por año', 'valor': I['improcedente_dias_por_ano'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'T_IMPROC', 'concepto': 'Despido improcedente: tope en mensualidades', 'valor': I['improcedente_tope_mensualidades'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'D_ANT', 'concepto': 'Tiempo anterior a la reforma de 2012: días por año', 'valor': I['anterior_12_02_2012_dias_por_ano'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'T_ANT', 'concepto': 'Tope máximo con tiempo anterior a 2012 (mensualidades)', 'valor': I['anterior_tope_mensualidades'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'CORTE', 'concepto': 'Fecha de la reforma (RDL 3/2012)', 'valor': corte, 'fmt': E.fmt_fecha, 'fuente': fi[0] + ', DT 11.ª', 'url': fi[1]},
             {'clave': 'D_OBJ', 'concepto': 'Despido objetivo o ERE: días por año', 'valor': I['objetivo_dias_por_ano'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'T_OBJ', 'concepto': 'Despido objetivo: tope en mensualidades', 'valor': I['objetivo_tope_mensualidades'], 'fuente': fi[0], 'url': fi[1]},
             {'clave': 'D_TEMP', 'concepto': 'Fin de contrato temporal: días por año', 'valor': I['fin_contrato_temporal_dias_por_ano'], 'fuente': fi[0], 'url': fi[1]},
             {'seccion': 'Vacaciones'},
             {'clave': 'VAC_MIN', 'concepto': 'Vacaciones mínimas al año (días naturales)', 'valor': vac, 'fuente': 'Estatuto de los Trabajadores, art. 38', 'url': 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430'},
             {'seccion': 'Plazos'},
             {'clave': 'P_DESPIDO', 'concepto': 'Caducidad de la acción de despido (días hábiles)', 'valor': DP['caducidad_dias_habiles'], 'fuente': fdp[0], 'url': fdp[1]},
             {'clave': 'P_CANTIDAD', 'concepto': 'Reclamación de cantidades (años)', 'valor': DP['reclamacion_cantidades_anios'], 'fuente': fdp[0], 'url': fdp[1]},
             {'clave': 'P_CONCILIA', 'concepto': 'Si no hay conciliación en estos días, se puede seguir con la demanda', 'valor': DP['conciliacion_max_dias'], 'fuente': fdp[0], 'url': fdp[1]},
             {'clave': 'P_PARO', 'concepto': 'Pedir el paro sin perder días (días hábiles)', 'valor': DP['paro_solicitud_dias_habiles'], 'fuente': 'Ley General de la Seguridad Social, art. 276', 'url': 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724'}]
    hoja_parametros(wb, E, filas, sub=f'Cifras de params/es/{ANIO}/laboral.json a {L["actualizado"]}.')

    # ------------------------------------------------------------ Festivos por comunidad (columnas)
    hf = Hoja(wb, 'Festivos', E, E.suave)
    fila = hf.cabecera('Festivos de comunidad', f'Nacionales y autonómicos de {min(CAL)} y {max(CAL)} (BOE y boletines). Los locales se añaden en «Plazos».', 'T')
    coms = list(CAL[max(CAL)]['comunidades'].items())
    hf.ws.column_dimensions['A'].width = 3
    for k, (cc, v) in enumerate(coms):
        col = 2 + k
        hf.tabla_cab(fila, col, [cc], alto=18)
        hf.c(hf.ws.cell(fila + 1, col).coordinate, v['n']['es'], font=E.f(8, True, E.pri), wrap=True, h='center')
        fechas = sorted({f['f'] for y in CAL for f in CAL[y]['comunidades'].get(cc, {}).get('festivos', [])})
        for j, f in enumerate(fechas):
            hf.formula(hf.ws.cell(fila + 2 + j, col).coordinate, fecha_iso(f), fmt=E.fmt_fecha, h='center')
        hf.ws.column_dimensions[hf.ws.cell(1, col).column_letter].width = 12
    hf.ws.row_dimensions[fila + 1].height = 30
    nf = 30
    c0, c1 = hf.ws.cell(1, 2).column_letter, hf.ws.cell(1, 1 + len(coms)).column_letter
    nombre_rango(wb, 'FEST_COD', 'Festivos', f'{c0}{fila}:{c1}{fila}')
    nombre_rango(wb, 'FEST_NOM', 'Festivos', f'{c0}{fila + 1}:{c1}{fila + 1}')
    nombre_rango(wb, 'FEST_TABLA', 'Festivos', f'{c0}{fila + 2}:{c1}{fila + 1 + nf}')
    hf.nota(f'B{fila + 3 + nf}', 'Fuentes: ' + '; '.join(CAL[y]['fuente']['nombre'] for y in sorted(CAL)))
    hf.ws.freeze_panes = f'B{fila + 2}'
    hf.proteger()

    # ------------------------------------------------------------ Tus datos
    hd = Hoja(wb, 'Tus datos', E, E.acento, {'A': 3, 'B': 52, 'C': 30, 'D': 66})
    fila = hd.cabecera('Tus datos', 'Los de tu última nómina y tu contrato', 'D')
    hd.leyenda(fila); fila += 2
    datos = [
        ('Salario bruto mensual (una paga, sin prorrata) (€)', 1600, 'dinero', 'Salario base más complementos fijos de la nómina.', 'SAL'),
        ('Número de pagas', 14, [14, 12], '14 si cobras las extras aparte; 12 si van prorrateadas.', 'PAGAS'),
        ('Fecha de inicio del contrato', fecha_iso('2022-03-01'), 'fecha', 'La antigüedad: si encadenaste contratos sin cortes, la del primero.', 'INICIO'),
        ('Último día trabajado (fecha de efectos)', fecha_iso(f'{ANIO}-11-15'), 'fecha', 'El que pone la carta de despido o el fin del contrato.', 'FIN'),
        ('Días de vacaciones al año (convenio)', '=VAC_MIN', 'entero', 'Días naturales: 30 como mínimo por ley.', 'VAC'),
        ('Días de vacaciones ya disfrutados este año', 15, 'entero', 'Días naturales que ya has cogido desde el 1 de enero.', 'DISFRUTADAS'),
        ('Devengo de las pagas extra', 'Semestral', ['Semestral', 'Anual'], 'Semestral: la de verano se genera de enero a junio y la de Navidad de julio a diciembre (lo más habitual).', 'DEVENGO'),
        ('¿El finiquito incluye el salario de los días de este mes?', 'Sí', ['Sí', 'No'], '«No» si la empresa ya te ha pagado la nómina del último mes completa.', 'INCLUIR_MES'),
        ('Motivo de la salida', MOTIVOS[3], MOTIVOS, 'Lo que dice la carta. Si crees que el despido es improcedente, compruébalo con esa opción.', 'MOTIVO'),
        ('Salario bruto anual para la indemnización (€)', '=SAL*PAGAS', 'dinero', 'Por defecto, salario × pagas. Suma variables, pluses y horas extra habituales del último año.', 'BRUTO_INDEM'),
        ('Comunidad autónoma de tu centro de trabajo', 'Cataluña', 'lista_fest', 'Para los festivos del plazo.', 'CCAA_NOMBRE'),
        ('Fecha en que te comunicaron el despido', '=FIN', 'fecha', 'Desde el día siguiente cuentan los 20 días hábiles. Por defecto, la fecha de efectos.', 'NOTIFICACION'),
    ]
    for texto, defecto, tipo, ayuda, nom in datos:
        hd.etiqueta(f'B{fila}', texto, bold=True)
        fmt = E.fmt_dinero if tipo == 'dinero' else (E.fmt_fecha if tipo == 'fecha' else None)
        hd.entrada(f'C{fila}', defecto, fmt=fmt, h='left' if isinstance(tipo, list) or tipo == 'lista_fest' else 'right')
        if isinstance(tipo, list):
            hd.lista(f'C{fila}', [str(x) for x in tipo])
        elif tipo == 'lista_fest':
            hd.lista(f'C{fila}', 'FEST_NOM')
        elif tipo == 'fecha':
            hd.fecha(f'C{fila}')
        elif tipo == 'entero':
            hd.numero(f'C{fila}', 0, 400, decimal=True)
        elif tipo == 'dinero':
            hd.numero(f'C{fila}', 0)
        hd.nota(f'D{fila}', ayuda)
        nombre(wb, nom, 'Tus datos', f'C{fila}')
        hd.ws.row_dimensions[fila].height = 26
        fila += 1
    hd.ws.column_dimensions['C'].width = 34
    fila += 1
    hd.c(f'B{fila}', 'Código de comunidad', font=E.f(9, False, E.suave))
    hd.formula(f'C{fila}', '=INDEX(FEST_COD,MATCH(CCAA_NOMBRE,FEST_NOM,0))', h='center')
    nombre(wb, 'CCAA', 'Tus datos', f'C{fila}')
    fila += 1
    hd.c(f'B{fila}', 'Tipo de salida (código)', font=E.f(9, False, E.suave))
    hd.formula(f'C{fila}', '=MATCH(MOTIVO,{' + ','.join(f'"{m}"' for m in MOTIVOS) + '},0)', h='center')
    nombre(wb, 'TIPO', 'Tus datos', f'C{fila}')
    fila += 2
    hd.nota(f'B{fila}', AVISO, italic=True)
    hd.ws.merge_cells(f'B{fila}:D{fila}')
    hd.proteger()

    # ------------------------------------------------------------ Finiquito (detalle)
    hq = Hoja(wb, 'Finiquito', E, E.pri, {'A': 3, 'B': 56, 'C': 18, 'D': 64})
    fila = hq.cabecera('Finiquito: el detalle', 'Liquidación de lo que se te debe al acabar el contrato', 'D')
    fila += 1
    Q = {}
    def lq(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hq.etiqueta(f'B{fila}', texto, bold=bold)
        (hq.resultado if res else hq.formula)(f'C{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hq.nota(f'D{fila}', nota_)
        Q[clave] = f'C{fila}'
        nombre(wb, 'F_' + clave.upper(), 'Finiquito', f'C{fila}')
        fila += 1
    hq.seccion(fila, 'Salario', 'B', 'D'); fila += 1
    lq('anual', 'Salario bruto anual (mensual × pagas)', '=SAL*PAGAS')
    lq('diario', 'Salario diario (anual / 365)', f'={Q["anual"]}/365', nota_='Se usa para las vacaciones')
    lq('y', 'Año del último día', '=YEAR(FIN)', fmt='0')
    lq('desdemes', 'Desde el día', '=MAX(INICIO,DATE(YEAR(FIN),MONTH(FIN),1))', fmt=E.fmt_fecha)
    lq('diasmes', 'Días trabajados del último mes', f'=FIN-{Q["desdemes"]}+1', fmt='0')
    lq('diasdelmes', 'Días que tiene ese mes', '=DAY(EOMONTH(FIN,0))', fmt='0')
    lq('salmes', 'Salario de los días del último mes', f'=IF(INCLUIR_MES="No",0,IF({Q["diasmes"]}>={Q["diasdelmes"]},SAL,SAL/30*MIN(30,{Q["diasmes"]})))', bold=True, nota_='Mes completo: el salario entero; si no, salario / 30 × días')
    fila += 1
    hq.seccion(fila, 'Vacaciones no disfrutadas', 'B', 'D'); fila += 1
    lq('desdevac', 'Se generan desde', '=MAX(INICIO,DATE(YEAR(FIN),1,1))', fmt=E.fmt_fecha)
    lq('diasanio', 'Días trabajados este año', f'=FIN-{Q["desdevac"]}+1', fmt='0')
    lq('generadas', 'Días de vacaciones generados', f'=VAC*{Q["diasanio"]}/IF(MOD({Q["y"]},4)=0,366,365)', fmt='0.00', nota_='Vacaciones del año × días trabajados / días del año')
    lq('pendientes', 'Días pendientes (generados − disfrutados)', f'=MAX(0,{Q["generadas"]}-DISFRUTADAS)', fmt='0.00')
    lq('vac', 'Importe de las vacaciones', f'={Q["pendientes"]}*{Q["diario"]}', bold=True)
    fila += 1
    hq.seccion(fila, 'Pagas extra devengadas y no cobradas', 'B', 'D'); fila += 1
    mes = 'MONTH(FIN)'
    y = Q['y']
    # Paga de verano
    lq('v_aplica', 'Paga de verano: ¿se debe parte?', f'=IF(AND(PAGAS=14,OR(DEVENGO="Anual",{mes}<=6)),"Sí","No")', fmt='@')
    lq('v_desde', '   Se genera desde', f'=MAX(INICIO,IF(DEVENGO="Anual",IF({mes}>=7,DATE({y},7,1),DATE({y}-1,7,1)),DATE({y},1,1)))', fmt=E.fmt_fecha)
    lq('v_span', '   Días del periodo de devengo', f'=IF(DEVENGO="Anual",365,DATE({y},6,30)-DATE({y},1,1)+1)', fmt='0')
    lq('v_dias', '   Días generados', f'=MIN(MAX(FIN-{Q["v_desde"]}+1,0),{Q["v_span"]})', fmt='0')
    lq('verano', 'Parte proporcional de la paga de verano', f'=IF({Q["v_aplica"]}="Sí",ROUND(SAL*{Q["v_dias"]}/{Q["v_span"]},2),0)', bold=True)
    lq('n_aplica', 'Paga de Navidad: ¿se debe parte?', f'=IF(AND(PAGAS=14,OR(DEVENGO="Anual",{mes}>=7)),"Sí","No")', fmt='@')
    lq('n_desde', '   Se genera desde', f'=MAX(INICIO,IF(DEVENGO="Anual",DATE({y},1,1),DATE({y},7,1)))', fmt=E.fmt_fecha)
    lq('n_span', '   Días del periodo de devengo', f'=IF(DEVENGO="Anual",365,DATE({y},12,31)-DATE({y},7,1)+1)', fmt='0')
    lq('n_dias', '   Días generados', f'=MIN(MAX(FIN-{Q["n_desde"]}+1,0),{Q["n_span"]})', fmt='0')
    lq('navidad', 'Parte proporcional de la paga de Navidad', f'=IF({Q["n_aplica"]}="Sí",ROUND(SAL*{Q["n_dias"]}/{Q["n_span"]},2),0)', bold=True)
    fila += 1
    lq('total', 'FINIQUITO (bruto)', f'=ROUND({Q["salmes"]}+{Q["vac"]}+{Q["verano"]}+{Q["navidad"]},2)', res=True, nota_='Cotiza y lleva IRPF: el neto será menor')
    fila += 1
    hq.nota(f'B{fila}', 'Método: el de la calculadora de finiquito de NetoClaro. Si tu convenio fija otra forma de calcular las vacaciones o las pagas, manda el convenio. ' + AVISO)
    hq.ws.merge_cells(f'B{fila}:D{fila + 1}')
    hq.ws.row_dimensions[fila].height = 30
    hq.proteger()

    # ------------------------------------------------------------ Indemnización (detalle)
    hn = Hoja(wb, 'Indemnización', E, E.pri, {'A': 3, 'B': 56, 'C': 18, 'D': 64})
    fila = hn.cabecera('Indemnización: el detalle', 'Días de salario por año trabajado, con prorrata por meses y topes legales', 'D')
    fila += 1
    N = {}
    def ln(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hn.etiqueta(f'B{fila}', texto, bold=bold)
        (hn.resultado if res else hn.formula)(f'C{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hn.nota(f'D{fila}', nota_)
        N[clave] = f'C{fila}'
        nombre(wb, 'I_' + clave.upper(), 'Indemnización', f'C{fila}')
        fila += 1

    def meses_iniciados(a, b, pre):
        """Meses completos e iniciados entre a y b (los dos incluidos), como mesesIniciados() de la web: dos celdas auxiliares."""
        f1 = f'({b}+1)'
        ln(pre + 'k', '   (auxiliar) diferencia de meses', f'=(YEAR({f1})-YEAR({a}))*12+MONTH({f1})-MONTH({a})', fmt='0')
        k = N[pre + 'k']
        ln(pre + 'm', '   (auxiliar) meses completos', f'=IF(EDATE({a},{k})<={f1},{k},{k}-1)', fmt='0')
        m = N[pre + 'm']
        return f'IF({b}<{a},0,{m}+IF(EDATE({a},{m})-1<{b},1,0))'

    hn.seccion(fila, 'Antigüedad', 'B', 'D'); fila += 1
    ln('diario', 'Salario diario para la indemnización (anual / 365)', '=BRUTO_INDEM/365')
    ln('t', 'Meses de antigüedad (las fracciones cuentan como mes entero)', '=' + meses_iniciados('INICIO', 'FIN', 't_'), fmt='0', bold=True)
    ln('anios', 'Equivale a años', f'={N["t"]}/12', fmt='0.00')
    fila += 1
    hn.seccion(fila, 'Despido improcedente con tiempo anterior a la reforma de 2012', 'B', 'D'); fila += 1
    ln('antes', '¿Empezaste antes de la reforma?', '=IF(INICIO<CORTE,"Sí","No")', fmt='@')
    ln('finant', '   Último día del primer tramo', '=IF(FIN<CORTE,FIN,CORTE-1)', fmt=E.fmt_fecha)
    mi = meses_iniciados('INICIO', N['finant'], 'm1_')
    ln('m1', '   Meses del primer tramo (45 días por año)', f'=IF(INICIO>=CORTE,0,IF(FIN<CORTE,{N["t"]},MIN({N["t"]},{mi})))', fmt='0')
    ln('d1', '   Días del primer tramo', f'=D_ANT*{N["m1"]}/12', fmt='0.00')
    ln('m2', '   Meses del segundo tramo (33 días por año)', f'=IF(INICIO>=CORTE,0,IF(FIN>=CORTE,MAX(0,{N["t"]}-{N["m1"]}),0))', fmt='0')
    ln('d2', '   Días del segundo tramo', f'=D_IMPROC*{N["m2"]}/12', fmt='0.00')
    fila += 1
    hn.seccion(fila, 'Resultado', 'B', 'D'); fila += 1
    tope720, tope1260 = 'T_IMPROC*30', 'T_ANT*30'
    impro = f'IF(INICIO<CORTE,IF({N["d1"]}>{tope720},MIN({N["d1"]},{tope1260}),MIN({N["d1"]}+{N["d2"]},{tope720})),MIN(D_IMPROC*{N["t"]}/12,{tope720}))'
    ln('dias', 'Días de salario de indemnización', f'=CHOOSE(TIPO,0,D_TEMP*{N["t"]}/12,MIN(D_OBJ*{N["t"]}/12,T_OBJ*30),{impro},0)', fmt='0.00', bold=True)
    ln('tope', 'Tope aplicado', f'=CHOOSE(TIPO,"—","Sin tope",IF(D_OBJ*{N["t"]}/12>T_OBJ*30,"12 mensualidades","No"),IF(INICIO<CORTE,IF({N["d1"]}>{tope720},IF({N["d1"]}>{tope1260},"42 mensualidades","Lo generado antes de 2012"),IF({N["d1"]}+{N["d2"]}>{tope720},"24 mensualidades","No")),IF(D_IMPROC*{N["t"]}/12>{tope720},"24 mensualidades","No")),"—")', fmt='@')
    ln('importe', 'INDEMNIZACIÓN (bruta)', f'=ROUND({N["dias"]}*{N["diario"]},2)', res=True, nota_='La indemnización legal por despido está exenta de IRPF dentro de los límites del art. 7.e de la Ley del IRPF')
    fila += 1
    hn.nota(f'B{fila}', 'Improcedente: 33 días por año con tope de 24 mensualidades; si empezaste antes del 12/02/2012, 45 días por año hasta esa fecha y 33 después, con tope de 720 días salvo que el primer tramo ya lo supere (máximo 42 mensualidades). Objetivo: 20 días por año, tope 12 mensualidades. Fin de contrato temporal: 12 días por año. ' + AVISO)
    hn.ws.merge_cells(f'B{fila}:D{fila + 2}')
    hn.ws.row_dimensions[fila].height = 40
    hn.proteger()

    # ------------------------------------------------------------ Comprobación (resumen frente a la empresa)
    hc = Hoja(wb, 'Comprobación', E, E.acento, {'A': 3, 'B': 40, 'C': 17, 'D': 19, 'E': 17, 'F': 34})
    fila = hc.cabecera('Comprobación', '="Motivo: "&MOTIVO', 'F')
    hc.leyenda(fila); fila += 2
    hc.tabla_cab(fila, 2, ['Concepto', 'Te corresponde', 'Te ofrece la empresa', 'Diferencia', 'Qué significa'])
    fila += 1
    c0 = fila
    conceptos = [('Salario de los días del último mes', '=F_SALMES'), ('Vacaciones no disfrutadas', '=F_VAC'), ('Parte de la paga de verano', '=F_VERANO'),
                 ('Parte de la paga de Navidad', '=F_NAVIDAD'), ('Indemnización', '=I_IMPORTE')]
    for txt, f_ in conceptos:
        hc.etiqueta(f'B{fila}', txt)
        hc.formula(f'C{fila}', f_, fmt=E.fmt_dinero, bold=True)
        hc.entrada(f'D{fila}', None, fmt=E.fmt_dinero)
        hc.formula(f'E{fila}', f'=IF(D{fila}="","",D{fila}-C{fila})', fmt=E.fmt_dinero)
        hc.formula(f'F{fila}', f'=IF(D{fila}="","Copia la cifra del finiquito",IF(E{fila}<-1,"Te falta dinero: reclámalo",IF(E{fila}>1,"Te dan más de lo mínimo","Cuadra")))', h='left')
        hc.ws.row_dimensions[fila].height = 20
        fila += 1
    hc.etiqueta(f'B{fila}', 'TOTAL', bold=True)
    hc.resultado(f'C{fila}', f'=SUM(C{c0}:C{fila - 1})', fmt=E.fmt_dinero)
    nombre(wb, 'TOTAL_CORRESPONDE', 'Comprobación', f'C{fila}')
    hc.formula(f'D{fila}', f'=IF(COUNT(D{c0}:D{fila - 1})=0,"",SUM(D{c0}:D{fila - 1}))', fmt=E.fmt_dinero, bold=True)
    hc.resultado(f'E{fila}', f'=IF(D{fila}="","",D{fila}-C{fila})', fmt=E.fmt_dinero)
    hc.formula(f'F{fila}', f'=IF(D{fila}="","",IF(E{fila}<-1,"Firma «Recibí, no conforme»","Cuadra o te dan más"))', h='left', bold=True)
    hc.resaltar_si(f'E{c0}:F{fila}', f'AND(ISNUMBER($E{c0}),$E{c0}<-1)', mezclar('#E5484D', 0.78), bold=True)
    hc.resaltar_si(f'E{c0}:F{fila}', f'AND(ISNUMBER($E{c0}),$E{c0}>=-1)', 'E3F4EA')
    fila += 2
    hc.c(f'B{fila}', 'Último día para la papeleta', font=E.f(11, True, E.pri))
    hc.resultado(f'C{fila}', '=IF(OR(TIPO=1,TIPO=2),"No aplica",PLAZO_DESPIDO)', fmt=E.fmt_fecha)
    hc.formula(f'D{fila}', '=IF(OR(TIPO=1,TIPO=2),"",IF(PLAZO_DESPIDO-TODAY()>=0,"Quedan "&(PLAZO_DESPIDO-TODAY())&" días naturales","Plazo vencido"))', h='left')
    hc.ws.merge_cells(f'D{fila}:F{fila}')
    fila += 2
    for t in ['El finiquito y la indemnización son brutos: el salario, las vacaciones y las pagas llevan IRPF y cotización; la indemnización legal, no.',
              'Si te falta dinero, firma escribiendo «Recibí, no conforme» y la fecha antes de tu firma: cobras lo que te dan y conservas el derecho a reclamar (guía en el PDF).',
              AVISO]:
        hc.nota(f'B{fila}', t)
        hc.ws.merge_cells(f'B{fila}:F{fila}')
        hc.ws.row_dimensions[fila].height = 26
        fila += 1
    hc.proteger()

    # ------------------------------------------------------------ Plazos
    hp = Hoja(wb, 'Plazos', E, E.pri, {'A': 3, 'B': 56, 'C': 18, 'D': 54, 'E': 3, 'F': 14})
    fila = hp.cabecera('Plazos para reclamar', 'Calculados con los festivos de tu comunidad y los locales que añadas', 'D')
    fila += 1
    hp.etiqueta(f'B{fila}', 'Te comunicaron el despido el', bold=True)
    hp.formula(f'C{fila}', '=NOTIFICACION', fmt=E.fmt_fecha, h='center'); fila += 1
    hp.etiqueta(f'B{fila}', 'Comunidad')
    hp.formula(f'C{fila}', '=CCAA_NOMBRE', h='center'); fila += 2
    # Lista de festivos aplicables (comunidad + locales), en la columna F
    fh0 = 8
    hp.c(f'F{fh0 - 1}', 'Festivos que se saltan', font=E.f(8, True, E.suave), wrap=True)
    for j in range(nf):
        hp.formula(f'F{fh0 + j}', f'=INDEX(FEST_TABLA,{j + 1},MATCH(CCAA,FEST_COD,0))', fmt=E.fmt_fecha + ';;', h='center')
    loc0 = fh0 + nf
    for j in range(6):
        hp.entrada(f'F{loc0 + j}', None, fmt=E.fmt_fecha, h='center')
    hp.fecha(f'F{loc0}:F{loc0 + 5}')
    nombre_rango(wb, 'FEST_APLICA', 'Plazos', f'F{fh0}:F{loc0 + 5}')
    hp.tabla_cab(fila, 2, ['Plazo', 'Último día', 'Qué hacer'])
    fila += 1
    plazos = [
        ('Papeleta de conciliación por despido (20 días hábiles)', '=WORKDAY(NOTIFICACION,P_DESPIDO,FEST_APLICA)', 'PLAZO_DESPIDO',
         'Presentarla en el servicio de mediación, arbitraje y conciliación de tu comunidad. Suspende el plazo. Agosto cuenta.'),
        ('Pedir el paro sin perder días (15 días hábiles)', '=WORKDAY(FIN,P_PARO,FEST_APLICA)', 'PLAZO_PARO',
         'Solicitud en el SEPE (sede electrónica o cita previa). Fuera de plazo se cobra igual, pero pierdes los días de retraso.'),
        ('Reclamar cantidades del finiquito (1 año)', '=EDATE(FIN,12*P_CANTIDAD)', 'PLAZO_CANTIDAD',
         'Salarios, vacaciones o pagas que no te hayan pagado bien. Se interrumpe con una reclamación por escrito o con la papeleta.'),
    ]
    for txt, f_, nom, que in plazos:
        hp.etiqueta(f'B{fila}', txt, bold=True)
        hp.resultado(f'C{fila}', f_, fmt=E.fmt_fecha)
        nombre(wb, nom, 'Plazos', f'C{fila}')
        hp.nota(f'D{fila}', que)
        hp.ws.row_dimensions[fila].height = 40
        fila += 1
    fila += 1
    hp.etiqueta(f'B{fila}', 'Días naturales que quedan para la papeleta')
    hp.formula(f'C{fila}', '=PLAZO_DESPIDO-TODAY()', fmt='0', bold=True, h='center')
    hp.resaltar_si(f'C{fila}', f'C{fila}<=5', mezclar('#E5484D', 0.75), bold=True)
    fila += 2
    hp.etiqueta(f'B{fila}', 'Festivos locales de tu municipio', bold=True)
    hp.nota(f'C{fila}', f'Escríbelos en la columna F, filas {loc0} a {loc0 + 5} (en amarillo). Los de tu comunidad ya están puestos.')
    hp.ws.merge_cells(f'C{fila}:D{fila}')
    fila += 2
    for t in [DP['nota'], 'Si un día del plazo es inhábil por otro motivo (por ejemplo, del 24 al 31 de diciembre en algunos juzgados), no te arriesgues: presenta la papeleta antes.', AVISO]:
        hp.nota(f'B{fila}', t)
        hp.ws.merge_cells(f'B{fila}:D{fila}')
        hp.ws.row_dimensions[fila].height = 15 * (len(t) // 110 + 1)
        fila += 1
    hp.nota(f'B{fila}', 'Fuente: ' + fdp[0])
    hp.proteger()

    orden = ['Portada', 'Instrucciones', 'Tus datos', 'Comprobación', 'Finiquito', 'Indemnización', 'Plazos', 'Festivos', 'Parámetros']
    wb._sheets = [wb[n] for n in orden]
    if demo:
        for k, v in [('SAL', 1850), ('INICIO', fecha_iso('2016-04-04')), ('FIN', fecha_iso(f'{ANIO}-11-13')), ('NOTIFICACION', fecha_iso(f'{ANIO}-11-12')), ('DISFRUTADAS', 18), ('CCAA_NOMBRE', 'Cataluña')]:
            poner(wb, k, v)
        hcmp = wb['Comprobación']
        for k, v in enumerate([797.18, 230.0, 0, 1310.0, 22000.0]):
            hcmp[f'D{9 + k}'] = v
    return wb


# ---------------------------------------------------------------- Guía en PDF

def guia_html() -> str:
    E = Estilo('nomina')
    url = url_publica('nomina')
    I = L['indemnizacion']
    DP = L['despido_plazos']
    h = '<span class="hueco">'
    e = '</span>'
    cuerpo = portada_pdf(E, 'Despido y finiquito: cartas, papeleta y plazos', 'Qué firmar, cómo reclamar lo que falta y cómo presentar la papeleta de conciliación sin perder el plazo de 20 días hábiles.',
                         ['Carta «no conforme»', 'Reclamación de cantidad', 'Papeleta de conciliación', 'Plazos legales', 'Checklist'],
                         f'{E.nombre} · {url.replace("https://", "")} · hola@numimates.com<br><strong>No es asesoramiento jurídico.</strong> Contenido preparado con ayuda de IA y revisado con fuentes oficiales (Estatuto de los Trabajadores y Ley reguladora de la jurisdicción social).')
    cuerpo += f"""
<div class="caja aviso"><strong>Antes de nada.</strong> Esta guía explica los pasos que da la ley y te deja modelos para rellenar. No es asesoramiento jurídico ni sustituye a un abogado laboralista, a un graduado social o a tu sindicato. Si el despido puede ser nulo (embarazo, baja médica, represalia, discriminación) o hay mucho dinero en juego, consulta con un profesional cuanto antes: en la jurisdicción social los trabajadores tienen derecho a la asistencia jurídica gratuita sin tener que acreditar ingresos (Ley 1/1996, art. 2.d).</div>

<h2>1. Los plazos que no puedes dejar pasar</h2>
<table><tr><th>Qué</th><th>Plazo</th><th>Desde cuándo</th><th>Norma</th></tr>
<tr><td><strong>Impugnar el despido</strong> (papeleta de conciliación y demanda)</td><td><strong>{DP['caducidad_dias_habiles']} días hábiles</strong></td><td>El día siguiente al despido</td><td>Art. 59.3 ET y art. 103 LRJS</td></tr>
<tr><td>Reclamar cantidades (finiquito mal calculado, salarios, vacaciones)</td><td>{DP['reclamacion_cantidades_anios']} año</td><td>Desde que pudiste reclamarlas</td><td>Art. 59.1 y 59.2 ET</td></tr>
<tr><td>Pedir el paro sin perder días</td><td>{DP['paro_solicitud_dias_habiles']} días hábiles</td><td>Desde el día siguiente a la situación legal de desempleo</td><td>Art. 276 LGSS</td></tr></table>
<ul><li><strong>Días hábiles:</strong> no cuentan sábados, domingos ni festivos (art. 182 LOPJ). <strong>Agosto sí cuenta</strong> en el despido (art. 43.4 LRJS).</li>
<li>El plazo del despido es de <strong>caducidad</strong>: no se interrumpe, solo se suspende al presentar la papeleta y vuelve a correr al día siguiente del acto de conciliación, o a los 15 días hábiles si no se ha celebrado (art. 65 LRJS).</li>
<li>Si la conciliación no se celebra en {DP['conciliacion_max_dias']} días, puedes seguir con la demanda.</li>
<li>El Excel calcula el último día con los festivos de tu comunidad. Aun así, <strong>no apures</strong>: preséntala en la primera semana.</li></ul>

<h2>2. El día que te dan el finiquito</h2>
<p>El finiquito es el documento con la liquidación de lo que se te debe: salario de los días trabajados del mes, vacaciones no disfrutadas y la parte de las pagas extra. La indemnización, si la hay, va aparte o en el mismo documento. Tienes derecho a que un representante de los trabajadores esté presente cuando lo firmes (art. 49.2 ET) y a llevártelo para revisarlo.</p>
<ol class="pasos"><li><strong>Comprueba cada concepto</strong> con la hoja «Comprobación» del Excel.</li>
<li><strong>Si falta dinero o no estás de acuerdo con el despido</strong>, no firmes «conforme». Firma escribiendo antes de tu firma: <em>«Recibí, no conforme»</em> y la fecha. Así cobras lo que te dan y conservas el derecho a reclamar el resto y a impugnar el despido.</li>
<li><strong>Pide copia</strong> de todo lo que firmes: carta de despido, finiquito y certificado de empresa (lo necesitas para el paro; la empresa lo envía al SEPE).</li></ol>
<div class="carta"><p><strong>Texto para escribir a mano junto a tu firma</strong></p><p>Recibí, no conforme con la liquidación ni con la extinción del contrato. En {h}[ciudad]{e}, a {h}[fecha]{e}.</p></div>

<h2>3. Modelo: carta de disconformidad con el finiquito</h2>
<p>Envíala por burofax con certificación de contenido o entrégala en mano con copia sellada. Sirve para dejar constancia y para interrumpir el plazo de un año de las cantidades.</p>
<div class="carta">
<p>{h}[Nombre y apellidos]{e}<br>DNI/NIE: {h}[número]{e}<br>Domicilio: {h}[dirección]{e}</p>
<p>A la atención de la dirección de {h}[nombre de la empresa]{e}, CIF {h}[CIF]{e}<br>{h}[domicilio de la empresa]{e}</p>
<p>En {h}[ciudad]{e}, a {h}[fecha]{e}</p>
<p><strong>Asunto: disconformidad con la liquidación de mi relación laboral y reclamación de cantidad</strong></p>
<p>He prestado servicios para esta empresa desde el {h}[fecha de inicio]{e} con la categoría de {h}[categoría]{e} y un salario bruto de {h}[importe]{e} euros mensuales con {h}[12/14]{e} pagas. El {h}[fecha]{e} se extinguió mi contrato por {h}[despido / fin de contrato / baja voluntaria]{e}.</p>
<p>He recibido la liquidación (finiquito), que firmé como «no conforme», por un total de {h}[importe]{e} euros. No estoy de acuerdo con las siguientes cantidades:</p>
<ul><li>Vacaciones no disfrutadas: {h}[días]{e} días, {h}[importe que corresponde]{e} € (se me abonan {h}[importe]{e} €).</li>
<li>Parte proporcional de las pagas extraordinarias: {h}[importe que corresponde]{e} € (se me abonan {h}[importe]{e} €).</li>
<li>{h}[Otros conceptos: salario del mes, horas extra, complementos del convenio]{e}.</li></ul>
<p>Por ello, les requiero para que en el plazo de diez días me abonen la diferencia de {h}[importe total]{e} euros mediante transferencia a la cuenta {h}[IBAN]{e}. En caso contrario, ejercitaré las acciones legales que me correspondan, empezando por la papeleta de conciliación ante el servicio de mediación de mi comunidad.</p>
<p>Atentamente,</p><p>{h}[Firma]{e}</p></div>

<h2>4. Modelo: reclamación previa y contenido de la papeleta por despido</h2>
<p>La papeleta se presenta en el servicio de mediación, arbitraje y conciliación de tu comunidad. Casi todas tienen un formulario propio (en papel y en la sede electrónica, con certificado digital o Cl@ve): úsalo y copia en él este contenido.</p>
<div class="carta">
<p><strong>Papeleta de conciliación por despido</strong></p>
<p><strong>Solicitante:</strong> {h}[nombre, DNI/NIE, domicilio, teléfono y correo]{e}.</p>
<p><strong>Empresa:</strong> {h}[razón social, CIF y domicilio; si es un grupo o una contrata, todas las empresas]{e}.</p>
<p><strong>Hechos:</strong></p>
<ol><li>Presto servicios para la empresa desde el {h}[fecha]{e}, con la categoría de {h}[categoría]{e}, en el centro de trabajo de {h}[dirección]{e}, con un salario bruto de {h}[importe]{e} € al mes con prorrata de pagas extra ({h}[importe anual]{e} € al año). Convenio aplicable: {h}[convenio]{e}.</li>
<li>El {h}[fecha]{e} la empresa me comunicó el despido con efectos del {h}[fecha]{e}, alegando {h}[motivo de la carta]{e}. Adjunto la carta.</li>
<li>No soy ni he sido en el último año representante legal ni sindical de los trabajadores.</li>
<li>Considero que el despido es improcedente porque {h}[los hechos de la carta no son ciertos / no se ha seguido el procedimiento / la causa no justifica el despido]{e}.</li></ol>
<p><strong>Pretensión:</strong> que se reconozca la improcedencia del despido y se me readmita con abono de los salarios de tramitación o, a elección de la empresa, se me indemnice con {h}[importe del Excel]{e} €. Reclamo también {h}[importe]{e} € de diferencias del finiquito.</p>
<p>Solicito que se cite a las partes al acto de conciliación.</p><p>En {h}[ciudad]{e}, a {h}[fecha]{e}. Firma: {h}[firma]{e}</p></div>
<p class="fuentes">Si el despido puede ser nulo (vulneración de derechos fundamentales, embarazo, permisos por cuidado, baja médica), la pretensión es la nulidad con readmisión: pide asesoramiento antes de presentarla.</p>

<h2>5. Paso a paso de la conciliación</h2>
<ol class="pasos">
<li><strong>Presenta la papeleta</strong> en el registro del servicio de mediación de tu comunidad o en su sede electrónica. Lleva copia para ti y una por cada empresa. Guarda el justificante con la fecha: desde ahí el plazo queda suspendido.</li>
<li><strong>Recibes la citación</strong> con día y hora. La empresa también.</li>
<li><strong>Acto de conciliación.</strong> Puedes ir solo o acompañado de abogado, graduado social o sindicato. Hay tres resultados: <em>con avenencia</em> (acuerdo, que se puede ejecutar como una sentencia), <em>sin avenencia</em> (no hay acuerdo) o <em>intentado sin efecto</em> (la empresa no acude).</li>
<li><strong>Si no hay acuerdo, demanda</strong> ante el Juzgado de lo Social con el certificado del acto. Te quedan los días hábiles que no habías gastado antes de presentar la papeleta: cuéntalos bien.</li>
<li><strong>Juicio.</strong> En primera instancia no es obligatorio ir con abogado (art. 18 LRJS), pero si vas a ir con uno, dilo en la demanda.</li></ol>
<div class="caja">Mientras reclamas, <strong>pide el paro</strong>: reclamar el despido no impide cobrarlo. Si luego te readmiten o cambia la indemnización, el SEPE lo regulariza.</div>

<h2>6. Checklist</h2>
<div class="dos"><ul class="check"><li>Carta de despido (con la fecha en que te la dieron)</li><li>Contrato y prórrogas</li><li>Nóminas de los últimos 12 meses</li><li>Documento de finiquito propuesto</li><li>Informe de vida laboral (Seguridad Social)</li><li>Convenio colectivo aplicable (BOE o boletín de tu provincia)</li></ul>
<ul class="check"><li>Comprobación del Excel impresa</li><li>Firma «Recibí, no conforme» si falta dinero</li><li>Papeleta presentada antes del último día del Excel</li><li>Justificante de la papeleta guardado</li><li>Paro pedido en 15 días hábiles</li><li>Certificado de empresa enviado al SEPE</li></ul></div>

<h2>Fuentes</h2>
<ul class="fuentes"><li>Real Decreto Legislativo 2/2015, Estatuto de los Trabajadores: arts. 38, 49, 53, 55, 56, 59 y DT 11.ª. {I.get('fuente', {}).get('url', '')}</li>
<li>Ley 36/2011, reguladora de la jurisdicción social: arts. 18, 43, 63 a 68 y 103 a 113. https://www.boe.es/buscar/act.php?id=BOE-A-2011-15936</li>
<li>Ley Orgánica 6/1985 del Poder Judicial, art. 182. Ley 1/1996 de asistencia jurídica gratuita, art. 2.d.</li>
<li>Real Decreto Legislativo 8/2015, Ley General de la Seguridad Social, art. 276.</li></ul>
<p class="legal">Edición {ANIO}-{ANIO + 1}. No es asesoramiento jurídico. El contenido se ha preparado con ayuda de inteligencia artificial y se ha revisado con las fuentes oficiales citadas; las normas pueden cambiar y tu convenio puede mejorar estos mínimos. Dudas sobre el producto: hola@numimates.com.</p>"""
    return html_pdf(E, 'Despido y finiquito: cartas, papeleta y plazos', cuerpo)


def main():
    out = SALIDA / ID
    guardar(construir(), out / 'pack-despido-finiquito.xlsx')
    escribir(out / 'fuente' / 'guia-despido-conciliacion.html', guia_html())
    if '--demo' in sys.argv:
        guardar(construir(demo=True), out / 'demo' / 'pack-despido-finiquito-demo.xlsx')
    print('Pack despido: listo en', out)


if __name__ == '__main__':
    main()
