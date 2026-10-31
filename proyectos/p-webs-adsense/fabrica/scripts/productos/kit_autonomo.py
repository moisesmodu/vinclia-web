"""Kit del autónomo 2027 (ImpuestoClaro): libro registro, 303 y 130 por trimestre, cuota por tramos, renta y calendario.

    python3 scripts/productos/kit_autonomo.py            → productos/kit-autonomo-2027/*.xlsx y guía HTML
    python3 scripts/productos/kit_autonomo.py --demo     → además, una copia con facturas de ejemplo (capturas)

Todas las cifras salen de params/es/2027/{fiscal,laboral}.json. Las fórmulas reproducen los motores de la web
(src/lib/calc/fiscal.ts: modelo303 y modelo130; laboral.ts: cuotaAutonomos y netoAutonomo; irpf.ts: cuotaAnual),
y tests/productos.test.ts lo comprueba recalculando el libro con LibreOffice.
"""
from __future__ import annotations

import sys
from datetime import date, timedelta

from comun import (poner, Estilo, Hoja, SALIDA, escribir, fecha_iso, fuente_de, guardar, hoja_parametros, html_pdf, instrucciones,
                   mezclar, nombre, nombre_rango, nuevo_libro, params, portada, portada_pdf, producto, url_publica, MESES_ES, DIAS_ES)

ID = 'kit-autonomo-2027'
ANIO = 2027
F = params('es', ANIO, 'fiscal')
L = params('es', ANIO, 'laboral')
FILAS = 400  # filas del libro registro
I0 = 8  # primera fila de datos de los libros
I1 = I0 + FILAS - 1

MESES_NUM = {m: k + 1 for k, m in enumerate(MESES_ES)}


def fecha_plazo(texto: str, trimestre: int) -> date:
    """«1-20 abril» → 20/04/2027; «1-30 enero» del 4T → 30/01/2028. Fin de semana → lunes siguiente (art. 30 LPAC)."""
    dia = int(texto.split()[0].split('-')[1])
    mes = MESES_NUM[texto.split()[1]]
    d = date(ANIO + (1 if trimestre == 4 else 0), mes, dia)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d


def ultimo_habil(anio: int, mes: int) -> date:
    d = date(anio + (mes == 12), mes % 12 + 1, 1) - timedelta(days=1)
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d


DESCRIPCION_MODELOS = {
    '100': 'Declaración de la renta (IRPF)', '714': 'Impuesto sobre el Patrimonio', '111': 'Retenciones de trabajadores y profesionales que pagas tú',
    '115': 'Retenciones del alquiler de tu local u oficina', '123': 'Retenciones de capital mobiliario', '216': 'Retenciones a no residentes',
    '130': 'Pago fraccionado del IRPF (estimación directa)', '131': 'Pago fraccionado del IRPF (módulos)', '303': 'Autoliquidación de IVA',
    '349': 'Operaciones intracomunitarias', '390': 'Resumen anual de IVA', '180': 'Resumen anual de retenciones de alquileres',
    '190': 'Resumen anual de retenciones de trabajo y profesionales', '193': 'Resumen anual de capital mobiliario', '347': 'Operaciones con terceros de más de 3.005,06 €',
    '200': 'Impuesto sobre Sociedades (solo sociedades)', '202': 'Pago fraccionado de Sociedades (solo sociedades)',
}
PARA_AUTONOMO = {'130', '303', '390', '100', '347', '111', '115', '349'}

CATEGORIAS = ['Suministros', 'Material', 'Software y suscripciones', 'Asesoría', 'Seguros', 'Formación', 'Viajes y dietas', 'Vehículo',
              'Alquiler de local', 'Publicidad', 'Comisiones bancarias', 'Telefonía e internet', 'Otros']


def construir(demo: bool = False):
    E = Estilo('impuestos')
    P = producto(ID)
    wb = nuevo_libro()
    A = L['autonomos']
    I = F['irpf']
    tramos = A['tramos']
    escalas = I['escalas_autonomicas']
    ccaa_nombres = [(k, v['nombre']) for k, v in escalas.items()]
    url = url_publica('impuestos')
    provisional = F.get('estado') == 'provisional' or L.get('estado') == 'provisional'

    # ------------------------------------------------------------ Portada e instrucciones
    portada(wb, E, titulo=P['nombre']['es'], subtitulo='Tu libro de ingresos y gastos, los modelos 303 y 130 de cada trimestre, la cuota de autónomos por tramos y la estimación de la renta: todo se calcula solo a partir de tus facturas.',
            edicion=f'Edición {ANIO} · parámetros a {F["actualizado"]}' + (' (provisionales)' if provisional else ''),
            pasos=['Rellena «Mis datos» (comunidad, tarifa plana, rendimiento de 2026).',
                   'Apunta cada factura que emitas en «Ingresos» y cada gasto en «Gastos». Una fila por factura.',
                   'Mira el «Panel»: cuánto pagar en cada trimestre, cuándo y cuánto apartar. Copia las cifras en los modelos de la AEAT.'],
            contenido=[('Panel', 'Resumen: a pagar en cada trimestre, renta estimada y cuánto apartar de cada factura'),
                       ('Mis datos', 'Comunidad, familia, tarifa plana y datos de 2026'),
                       ('Ingresos', 'Libro registro de facturas emitidas (400 filas)'),
                       ('Gastos', 'Libro registro de facturas recibidas, con IVA deducible y % de afectación'),
                       ('Modelo 303', 'IVA de cada trimestre, con compensación automática y devolución en el 4T'),
                       ('Modelo 130', 'Pago fraccionado del IRPF acumulado, con retenciones y minoración'),
                       ('Cuota autónomos', 'Tramo según rendimientos, cuota mes a mes y regularización estimada'),
                       ('Renta 2027', 'Estimación de la declaración: cuota estatal y autonómica, mínimos y resultado'),
                       ('Calendario 2027', 'Todas las fechas fiscales del año, con casilla de hecho'),
                       ('Parámetros', 'Cifras oficiales que usan las fórmulas, con su fuente'),
                       ('Escalas IRPF', 'Escala estatal y de cada comunidad')],
            avisos=['Herramienta de cálculo orientativa para autónomos persona física en estimación directa simplificada. No es asesoramiento fiscal ni sustituye a los programas de la AEAT: revisa siempre el borrador oficial antes de presentar.',
                    ('Los parámetros de 2027 son provisionales: lo que aún no se ha publicado (tramos de cotización, escalas) se copia de 2026 y se indica en «Parámetros». Cuando cambien, descarga de nuevo el kit desde el mismo enlace de tu compra.' if provisional else 'Parámetros oficiales de 2027.'),
                    'Contenido preparado con ayuda de inteligencia artificial y revisado con las fuentes oficiales citadas (BOE, AEAT, Seguridad Social).',
                    'Funciona en Excel, LibreOffice y Google Sheets (Archivo → Importar). Las hojas de cálculo están protegidas sin contraseña para que no borres una fórmula sin querer: Revisar → Desproteger hoja.'],
            url=url + '/' + P['ruta']['es'] + '/')
    instrucciones(wb, E, 'Cómo se usa el kit', [
        ('1. Antes de empezar', ['Guarda una copia con tu nombre y el año (por ejemplo, «kit-2027-ana.xlsx»). Trabaja siempre sobre tu copia.',
                                  'En «Mis datos» elige tu comunidad autónoma: decide la escala autonómica de la renta. Si tienes tarifa plana, márcala.',
                                  'Si ya llevabas facturas este año en otro sitio, cópialas en «Ingresos» y «Gastos»: una fila por factura, con su fecha.']),
        ('2. Cada vez que facturas o pagas un gasto', ['Ingresos: fecha, número, cliente, base imponible (sin IVA), tipo de IVA y retención de IRPF que pones en la factura. El total y el trimestre salen solos.',
                                                        'Gastos: fecha, proveedor, base, tipo de IVA y categoría. Si el gasto solo es en parte de la actividad (móvil, coche), pon el % de afectación. Si la factura no te deja deducir el IVA (un ticket, por ejemplo), marca «No» en IVA deducible: entonces el IVA cuenta como gasto en el IRPF.',
                                                        'La cuota de autónomos no se apunta como gasto: el kit la suma sola desde la hoja «Cuota autónomos».']),
        ('3. Cada trimestre', ['Abre «Modelo 303» y «Modelo 130»: las cifras de la columna del trimestre son las que copias en el formulario de la AEAT. El IVA negativo se compensa solo en el trimestre siguiente; en el 4T puedes pedir la devolución.',
                               'El 130 es acumulado desde enero: el kit ya resta lo que pagaste en los trimestres anteriores y las retenciones de tus facturas.',
                               'Las fechas límite están en cada modelo y en «Calendario 2027». Si domicilias el pago, el plazo acaba antes (día 15; 25 de enero en el 4T).']),
        ('4. La cuota de autónomos', ['Pon en «Cuota autónomos» tu previsión de rendimiento neto del año (ingresos menos gastos). El kit busca tu tramo y la cuota mínima. Si cotizas por una base más alta, cámbiala mes a mes.',
                                      'Al final, la hoja compara lo que has pagado con lo que corresponde a tus rendimientos reales: es la regularización que hará la Seguridad Social al año siguiente.']),
        ('5. La renta', ['«Renta 2027» estima tu declaración con la escala estatal y la de tu comunidad, el mínimo personal y familiar y el 5 % de gastos de difícil justificación (máximo 2.000 €). Resta las retenciones y los pagos del 130.',
                         'Es una estimación: no incluye deducciones autonómicas, planes de pensiones, alquileres ni otras rentas. Te sirve para saber cuánto apartar.']),
        ('6. En Google Sheets o LibreOffice', ['Google Sheets: Archivo → Importar → Subir, y elige «Reemplazar hoja de cálculo». Todo funciona igual, también las listas desplegables.',
                                              'LibreOffice: ábrelo directamente. Si alguna cifra sale vacía, pulsa Ctrl+Mayús+F9 para recalcular.']),
        ('Ayuda', ['¿Algo no cuadra? Escribe a hola@numimates.com con la hoja y la celda. Respondemos en días laborables.']),
    ])

    # ------------------------------------------------------------ Parámetros
    fiva = fuente_de(F['iva']) if F['iva'].get('fuente') else ('Ley 37/1992 del IVA, arts. 90 y 91', 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740')
    m130 = F['modelos']['130']
    mino = m130['minoracion']
    fa = fuente_de(A)
    fe = fuente_de(F['estimacion_directa_simplificada'])
    fm = fuente_de(I['minimos'])
    filas = [{'seccion': 'Ejercicio'}, {'clave': 'ANIO', 'concepto': 'Año del kit', 'valor': ANIO, 'fuente': 'Ejercicio fiscal de los libros'},
             {'seccion': 'IVA'},
             {'clave': 'IVA_GENERAL', 'concepto': 'Tipo general de IVA (%)', 'valor': F['iva']['general'], 'fuente': fiva[0], 'url': fiva[1]},
             {'clave': 'IVA_REDUCIDO', 'concepto': 'Tipo reducido de IVA (%)', 'valor': F['iva']['reducido'], 'fuente': fiva[0], 'url': fiva[1]},
             {'clave': 'IVA_SUPERREDUCIDO', 'concepto': 'Tipo superreducido de IVA (%)', 'valor': F['iva']['superreducido'], 'fuente': fiva[0], 'url': fiva[1]},
             {'seccion': 'Modelo 130'},
             {'clave': 'PCT_130', 'concepto': 'Pago fraccionado sobre el rendimiento neto acumulado (%)', 'valor': m130['pct'], 'fuente': 'Ley 35/2006 del IRPF, art. 99; RIRPF art. 110', 'url': 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820'}]
    for k, t in enumerate(mino['tramos'], 1):
        filas.append({'clave': f'MINOR_H{k}', 'concepto': f'Minoración: rendimiento del año anterior hasta (€), tramo {k}', 'valor': t['hasta'], 'fmt': E.fmt_dinero0, 'fuente': fuente_de(mino)[0], 'url': fuente_de(mino)[1]})
        filas.append({'clave': f'MINOR_E{k}', 'concepto': f'Minoración por trimestre (€), tramo {k}', 'valor': t['euros'], 'fmt': E.fmt_dinero0, 'fuente': fuente_de(mino)[0], 'url': fuente_de(mino)[1]})
    filas += [{'seccion': 'Cuota de autónomos (RETA)'},
              {'clave': 'TIPO_RETA', 'concepto': 'Tipo de cotización total (%)', 'valor': A['tipo_total_pct'], 'fuente': fa[0] + (' · provisional: tabla de 2026' if A.get('provisional') else ''), 'url': fa[1]},
              {'clave': 'TARIFA_PLANA_EUR', 'concepto': 'Tarifa plana (€ al mes)', 'valor': A['tarifa_plana_euros'], 'fmt': E.fmt_dinero, 'fuente': fa[0], 'url': fa[1]},
              {'clave': 'GASTOS_GENERICOS', 'concepto': 'Deducción por gastos genéricos para el tramo (%)', 'valor': A['deduccion_gastos_genericos_pct'], 'fuente': fa[0], 'url': fa[1]},
              {'seccion': 'IRPF: estimación directa simplificada'},
              {'clave': 'DJ_PCT', 'concepto': 'Gastos de difícil justificación (%)', 'valor': F['estimacion_directa_simplificada']['gastos_dificil_justificacion_pct'], 'fuente': fe[0], 'url': fe[1]},
              {'clave': 'DJ_MAX', 'concepto': 'Gastos de difícil justificación, máximo (€)', 'valor': F['estimacion_directa_simplificada']['limite_euros'], 'fmt': E.fmt_dinero0, 'fuente': fe[0], 'url': fe[1]},
              {'seccion': 'IRPF: mínimo personal y familiar (estatal)'},
              {'clave': 'MIN_PERSONAL', 'concepto': 'Mínimo del contribuyente (€)', 'valor': I['minimos']['personal'], 'fmt': E.fmt_dinero0, 'fuente': fm[0], 'url': fm[1]},
              {'clave': 'MIN_65', 'concepto': 'Incremento por edad: 65 años o más (€)', 'valor': I['minimos']['mayor_65'], 'fmt': E.fmt_dinero0, 'fuente': fm[0], 'url': fm[1]},
              {'clave': 'MIN_75', 'concepto': 'Incremento adicional: 75 años o más (€)', 'valor': I['minimos']['mayor_75'], 'fmt': E.fmt_dinero0, 'fuente': fm[0], 'url': fm[1]}]
    for k, d in enumerate(I['minimos']['descendientes'], 1):
        filas.append({'clave': f'MIN_DESC{k}', 'concepto': f'Mínimo por descendiente: {k}.º' + (' y siguientes' if k == len(I['minimos']['descendientes']) else '') + ' (€)', 'valor': d, 'fmt': E.fmt_dinero0, 'fuente': fm[0], 'url': fm[1]})
    filas.append({'clave': 'MIN_MENOR3', 'concepto': 'Incremento por descendiente menor de 3 años (€)', 'valor': I['minimos']['descendiente_menor_3'], 'fmt': E.fmt_dinero0, 'fuente': fm[0], 'url': fm[1]})
    hoja_parametros(wb, E, filas, sub=f'Cifras de params/es/{ANIO} a {F["actualizado"]}. Si cambian, se publica una versión nueva del kit.')
    ndesc = len(I['minimos']['descendientes'])

    # ------------------------------------------------------------ Escalas IRPF (formato largo para SUMPRODUCT)
    he = Hoja(wb, 'Escalas IRPF', E, E.suave, {'A': 3, 'B': 12, 'C': 30, 'D': 16, 'E': 12, 'F': 14, 'G': 3, 'H': 10, 'I': 34, 'J': 16, 'K': 14})
    fila = he.cabecera('Escalas del IRPF', 'Escala estatal y autonómicas de la base general. Las fórmulas usan la columna «Diferencia de tipo»: cuota = Σ (base − desde) × diferencia.', 'K')
    he.tabla_cab(fila, 2, ['Código', 'Escala', 'Desde (€)', 'Tipo (%)', 'Diferencia de tipo'])
    he.tabla_cab(fila, 8, ['Código', 'Comunidad', 'Mínimo personal autonómico (€)', 'Bonificación de la cuota (%)'])
    e0 = fila + 1
    r = e0

    def escribir_escala(codigo, nombre_, escala):
        nonlocal r
        desde = 0
        for k, t in enumerate(escala):
            he.formula(f'B{r}', codigo, h='center')
            he.formula(f'C{r}', nombre_, h='left')
            he.formula(f'D{r}', desde, fmt='#,##0.00')
            he.formula(f'E{r}', t['tipo'], fmt='0.00')
            he.formula(f'F{r}', f'=E{r}' if k == 0 else f'=E{r}-E{r - 1}', fmt='0.00')
            desde = t['hasta']
            r += 1
    escribir_escala('ESTATAL', 'Estatal', I['escala_estatal'])
    for k, v in escalas.items():
        escribir_escala(k, v['nombre'], v['escala'])
    e1 = r - 1
    nombre_rango(wb, 'ESC_COD', 'Escalas IRPF', f'B{e0}:B{e1}')
    nombre_rango(wb, 'ESC_DESDE', 'Escalas IRPF', f'D{e0}:D{e1}')
    nombre_rango(wb, 'ESC_DELTA', 'Escalas IRPF', f'F{e0}:F{e1}')
    c0 = fila + 1
    for k, (cod, nom) in enumerate(ccaa_nombres):
        rr = c0 + k
        v = escalas[cod]
        he.formula(f'H{rr}', cod, h='center')
        he.formula(f'I{rr}', nom, h='left')
        he.formula(f'J{rr}', v.get('minimo_personal') if v.get('minimo_personal') is not None else '=MIN_PERSONAL', fmt='#,##0.00')
        he.formula(f'K{rr}', v.get('bonificacion_cuota_pct') or 0, fmt='0.00')
    c1 = c0 + len(ccaa_nombres) - 1
    nombre_rango(wb, 'CCAA_COD', 'Escalas IRPF', f'H{c0}:H{c1}')
    nombre_rango(wb, 'CCAA_NOM', 'Escalas IRPF', f'I{c0}:I{c1}')
    nombre_rango(wb, 'CCAA_MINP', 'Escalas IRPF', f'J{c0}:J{c1}')
    nombre_rango(wb, 'CCAA_BONIF', 'Escalas IRPF', f'K{c0}:K{c1}')
    fe_, fu_ = fuente_de(I.get('escalas_autonomicas', {}).get('CT', {}))
    he.nota(f'I{c1 + 2}', f'Fuentes: escala estatal, art. 63 LIRPF; autonómicas, Manual práctico de Renta de la AEAT y leyes de cada comunidad. Detalle y notas en params/es/{ANIO}/fiscal.json.')
    he.proteger()

    def cuota_escala(base, codigo):
        return f'SUMPRODUCT((ESC_COD={codigo})*({base}>ESC_DESDE)*({base}-ESC_DESDE)*ESC_DELTA)/100'

    # ------------------------------------------------------------ Mis datos
    hd = Hoja(wb, 'Mis datos', E, E.acento, {'A': 3, 'B': 52, 'C': 26, 'D': 70})
    fila = hd.cabecera('Mis datos', 'Se rellenan una vez al año', 'D')
    hd.leyenda(fila)
    fila += 2
    hd.seccion(fila, 'Quién eres', 'B', 'D'); fila += 1
    datos = [
        ('Nombre y apellidos', None, None, 'Aparece en la cabecera de los libros.', 'TITULAR'),
        ('NIF', None, None, '', 'NIF_TITULAR'),
        ('Actividad (epígrafe IAE o descripción)', None, None, '', None),
        ('Comunidad autónoma de residencia', 'Cataluña', 'lista_ccaa', 'Decide la escala autonómica de la renta.', 'CCAA_NOMBRE'),
        ('Edad a 31 de diciembre', 40, 'entero', 'A partir de 65 años sube el mínimo personal.', 'EDAD'),
        ('Hijos menores de 25 que conviven contigo', 0, 'entero', 'Para el mínimo por descendientes.', 'HIJOS'),
        ('De ellos, menores de 3 años', 0, 'entero', '', 'HIJOS3'),
        ('¿Te aplicas el mínimo por hijos entero?', 'No', ['Sí', 'No'], '«No» si lo repartís a medias con el otro progenitor (lo habitual).', 'HIJOS100'),
    ]
    fila = _bloque_datos(hd, fila, datos, E)
    fila += 1
    hd.seccion(fila, 'Seguridad Social y modelos', 'B', 'D'); fila += 1
    datos2 = [
        ('¿Tienes tarifa plana todo 2027?', 'No', ['Sí', 'No'], 'Si solo es una parte del año, cámbialo mes a mes en «Cuota autónomos».', 'TARIFA_PLANA'),
        ('¿Presentas el modelo 130?', 'Sí', ['Sí', 'No'], 'No estás obligado si en 2026 al menos el 70 % de tus ingresos llevaron retención.', 'PRESENTA_130'),
        ('Rendimiento neto de 2026 (€)', 20000, 'dinero', 'Casilla de rendimiento neto de la actividad de tu renta 2026: decide la minoración del 130.', 'REND_ANTERIOR'),
        ('IVA a compensar que te quedó de 2026 (€)', 0, 'dinero', 'Si el 4T de 2026 salió negativo y no pediste la devolución.', 'COMPENSAR_INICIAL'),
    ]
    fila = _bloque_datos(hd, fila, datos2, E)
    hd.formula('C' + str(fila + 1), '=INDEX(CCAA_COD,MATCH(CCAA_NOMBRE,CCAA_NOM,0))', h='center')
    hd.c(f'B{fila + 1}', 'Código de la comunidad (lo usan las fórmulas)', font=E.f(9, False, E.suave))
    nombre(wb, 'CCAA', 'Mis datos', f'C{fila + 1}')
    hd.proteger()

    # ------------------------------------------------------------ Ingresos
    hi = Hoja(wb, 'Ingresos', E, E.pri, {'A': 3, 'B': 12, 'C': 11, 'D': 26, 'E': 13, 'F': 26, 'G': 13, 'H': 8, 'I': 12, 'J': 8, 'K': 12, 'L': 13, 'M': 6, 'N': 7})
    hi.cabecera(f'Libro registro de facturas emitidas {ANIO}', 'Una fila por factura. Base sin IVA; el tipo de IVA y la retención, como en la factura.', 'N')
    hi.leyenda(5)
    hi.formula('F5', '="Titular: "&IF(TITULAR="","—",TITULAR)&"   ·   NIF: "&IF(NIF_TITULAR="","—",NIF_TITULAR)', h='left')
    hi.tabla_cab(I0 - 1, 2, ['Fecha', 'Nº factura', 'Cliente', 'NIF cliente', 'Concepto', 'Base imponible', 'IVA %', 'Cuota IVA', 'Ret. %', 'Retención', 'Total factura', 'Trim.', 'Año'])
    for rr in range(I0, I1 + 1):
        for col in 'BCDEFGHJ':
            hi.entrada(f'{col}{rr}', fmt=E.fmt_fecha if col == 'B' else (E.fmt_dinero if col == 'G' else None), h='left' if col in 'CDEF' else 'right')
        hi.formula(f'I{rr}', f'=IF(G{rr}="","",ROUND(G{rr}*N(H{rr})/100,2))', fmt=E.fmt_dinero)
        hi.formula(f'K{rr}', f'=IF(G{rr}="","",ROUND(G{rr}*N(J{rr})/100,2))', fmt=E.fmt_dinero)
        hi.formula(f'L{rr}', f'=IF(G{rr}="","",G{rr}+I{rr}-K{rr})', fmt=E.fmt_dinero)
        hi.formula(f'M{rr}', f'=IF(B{rr}="","",ROUNDUP(MONTH(B{rr})/3,0))', h='center')
        hi.formula(f'N{rr}', f'=IF(B{rr}="","",YEAR(B{rr}))', h='center')
    hi.lista(f'H{I0}:H{I1}', [str(F['iva']['general']), str(F['iva']['reducido']), str(F['iva']['superreducido']), '0'], 'Elige 21, 10, 4 o 0 (exenta o inversión del sujeto pasivo).')
    hi.lista(f'J{I0}:J{I1}', ['0', '1', '2', '7', '15', '19'], 'Elige la retención que pone tu factura: 15 % general, 7 % los tres primeros años.')
    hi.fecha(f'B{I0}:B{I1}')
    hi.numero(f'G{I0}:G{I1}', -10**9)
    hi.resaltar_si(f'H{I0}:H{I1}', f'AND($G{I0}<>"",$H{I0}="")', mezclar('#E5484D', 0.75))
    hi.resaltar_si(f'B{I0}:N{I1}', f'AND($N{I0}<>"",$N{I0}<>ANIO)', 'EEEEEE')
    hi.ws.freeze_panes = f'C{I0}'
    hi.ws.auto_filter.ref = f'B{I0 - 1}:N{I1}'
    hi.nota('B6', f'Las facturas de otro año (en gris) no cuentan. Totales del año: base', 9)
    hi.formula('G6', f'=SUMIFS(G{I0}:G{I1},N{I0}:N{I1},ANIO)', fmt=E.fmt_dinero, bold=True)
    hi.formula('I6', f'=SUMIFS(I{I0}:I{I1},N{I0}:N{I1},ANIO)', fmt=E.fmt_dinero, bold=True)
    hi.formula('K6', f'=SUMIFS(K{I0}:K{I1},N{I0}:N{I1},ANIO)', fmt=E.fmt_dinero, bold=True)
    hi.formula('L6', f'=SUMIFS(L{I0}:L{I1},N{I0}:N{I1},ANIO)', fmt=E.fmt_dinero, bold=True)

    # ------------------------------------------------------------ Gastos
    hg = Hoja(wb, 'Gastos', E, E.marca, {'A': 3, 'B': 12, 'C': 11, 'D': 24, 'E': 13, 'F': 22, 'G': 18, 'H': 13, 'I': 7, 'J': 11, 'K': 9, 'L': 9, 'M': 12, 'N': 13, 'O': 6, 'P': 7})
    hg.cabecera(f'Libro registro de facturas recibidas {ANIO}', 'Gastos de la actividad. La cuota de autónomos no se apunta aquí: se suma sola.', 'P')
    hg.leyenda(5)
    hg.tabla_cab(I0 - 1, 2, ['Fecha', 'Nº factura', 'Proveedor', 'NIF proveedor', 'Concepto', 'Categoría', 'Base imponible', 'IVA %', 'Cuota IVA', '¿IVA deducible?', '% afectación', 'IVA deducible', 'Gasto deducible IRPF', 'Trim.', 'Año'])
    for rr in range(I0, I1 + 1):
        for col in 'BCDEFGHIKL':
            hg.entrada(f'{col}{rr}', fmt=E.fmt_fecha if col == 'B' else (E.fmt_dinero if col == 'H' else None), h='left' if col in 'CDEFG' else ('center' if col == 'K' else 'right'))
        hg.formula(f'J{rr}', f'=IF(H{rr}="","",ROUND(H{rr}*N(I{rr})/100,2))', fmt=E.fmt_dinero)
        af = f'IF(L{rr}="",100,L{rr})'
        hg.formula(f'M{rr}', f'=IF(H{rr}="","",IF(K{rr}="No",0,H{rr}*N(I{rr})/100*{af}/100))', fmt=E.fmt_dinero)
        hg.formula(f'N{rr}', f'=IF(H{rr}="","",H{rr}*{af}/100+IF(K{rr}="No",H{rr}*N(I{rr})/100*{af}/100,0))', fmt=E.fmt_dinero)
        hg.formula(f'O{rr}', f'=IF(B{rr}="","",ROUNDUP(MONTH(B{rr})/3,0))', h='center')
        hg.formula(f'P{rr}', f'=IF(B{rr}="","",YEAR(B{rr}))', h='center')
    hg.lista(f'G{I0}:G{I1}', CATEGORIAS)
    hg.lista(f'I{I0}:I{I1}', [str(F['iva']['general']), str(F['iva']['reducido']), str(F['iva']['superreducido']), '0'])
    hg.lista(f'K{I0}:K{I1}', ['Sí', 'No'])
    hg.numero(f'L{I0}:L{I1}', 0, 100)
    hg.fecha(f'B{I0}:B{I1}')
    hg.resaltar_si(f'B{I0}:P{I1}', f'AND($P{I0}<>"",$P{I0}<>ANIO)', 'EEEEEE')
    hg.ws.freeze_panes = f'C{I0}'
    hg.ws.auto_filter.ref = f'B{I0 - 1}:P{I1}'
    hg.nota('B6', 'Vacío en «¿IVA deducible?» = Sí; vacío en «% afectación» = 100 %. Totales del año:', 9)
    hg.formula('H6', f'=SUMIFS(H{I0}:H{I1},P{I0}:P{I1},ANIO)', fmt=E.fmt_dinero, bold=True)
    hg.formula('M6', f'=SUMIFS(M{I0}:M{I1},P{I0}:P{I1},ANIO)', fmt=E.fmt_dinero, bold=True)
    hg.formula('N6', f'=SUMIFS(N{I0}:N{I1},P{I0}:P{I1},ANIO)', fmt=E.fmt_dinero, bold=True)

    ING = lambda col: f"Ingresos!${col}${I0}:${col}${I1}"
    GAS = lambda col: f"Gastos!${col}${I0}:${col}${I1}"
    COLS = 'DEFG'  # 1T..4T

    # ------------------------------------------------------------ Cuota autónomos (antes que 130 y renta, que la usan)
    hc = Hoja(wb, 'Cuota autónomos', E, E.marca, {'A': 3, 'B': 44, 'C': 16, 'D': 16, 'E': 16, 'F': 16, 'G': 16, 'H': 16, 'I': 3})
    fila = hc.cabecera(f'Cuota de autónomos {ANIO}', 'Sistema de cotización por ingresos reales: tramo según el rendimiento neto previsto', 'H')
    hc.leyenda(fila); fila += 2
    hc.seccion(fila, '1. Tu tramo con la previsión de rendimientos', 'B', 'H'); fila += 1
    hc.etiqueta(f'B{fila}', 'Rendimiento neto previsto del año (€)', bold=True)
    hc.entrada(f'C{fila}', "=MAX(0,'Renta 2027'!C8-'Renta 2027'!C9)", fmt=E.fmt_dinero)
    hc.nota(f'D{fila}', 'Ingresos menos gastos, sin la cuota. Por defecto, los de tus libros; cámbialo por tu previsión al principio del año.')
    hc.ws.merge_cells(f'D{fila}:H{fila}')
    nombre(wb, 'REND_PREVISTO', 'Cuota autónomos', f'C{fila}'); fila += 1
    hc.etiqueta(f'B{fila}', 'Rendimiento computable mensual (con la deducción por gastos genéricos)')
    hc.formula(f'C{fila}', f'=REND_PREVISTO*(1-GASTOS_GENERICOS/100)/12', fmt=E.fmt_dinero)
    nombre(wb, 'COMPUTABLE_MES', 'Cuota autónomos', f'C{fila}'); fila += 1
    t0 = None  # se rellena abajo
    hc.etiqueta(f'B{fila}', 'Tramo')
    tramo_ref = f'C{fila}'
    nombre(wb, 'TRAMO', 'Cuota autónomos', tramo_ref); fila += 1
    hc.etiqueta(f'B{fila}', 'Base mínima de tu tramo (€/mes)')
    hc.formula(f'C{fila}', '=INDEX(T_BMIN,TRAMO)', fmt=E.fmt_dinero)
    nombre(wb, 'BASE_MIN', 'Cuota autónomos', f'C{fila}'); fila += 1
    hc.etiqueta(f'B{fila}', 'Base máxima de tu tramo (€/mes)')
    hc.formula(f'C{fila}', '=INDEX(T_BMAX,TRAMO)', fmt=E.fmt_dinero); fila += 1
    hc.etiqueta(f'B{fila}', 'Cuota mensual con la base mínima', bold=True)
    hc.resultado(f'C{fila}', '=IF(TARIFA_PLANA="Sí",TARIFA_PLANA_EUR,BASE_MIN*TIPO_RETA/100)', fmt=E.fmt_dinero)
    nombre(wb, 'CUOTA_PREVISTA', 'Cuota autónomos', f'C{fila}')
    hc.nota(f'D{fila}', '="Tipo de cotización: "&TIPO_RETA&" %"&IF(TARIFA_PLANA="Sí"," · tarifa plana","")')
    fila += 2

    hc.seccion(fila, '2. Mes a mes (cambia la base si cotizas por más)', 'B', 'H'); fila += 1
    hc.tabla_cab(fila, 2, ['Mes', 'Tarifa plana', 'Base de cotización', 'Cuota del mes', 'Trimestre', 'Rendimiento real del mes', 'Cargo previsto'])
    fila += 1
    m0 = fila
    for k in range(12):
        rr = m0 + k
        hc.formula(f'B{rr}', MESES_ES[k].capitalize(), h='left')
        hc.entrada(f'C{rr}', '=TARIFA_PLANA', h='center')
        hc.entrada(f'D{rr}', '=BASE_MIN', fmt=E.fmt_dinero)
        hc.formula(f'E{rr}', f'=IF(C{rr}="Sí",TARIFA_PLANA_EUR,D{rr}*TIPO_RETA/100)', fmt=E.fmt_dinero, bold=True)
        hc.formula(f'F{rr}', (k // 3) + 1, h='center')
        ini, fin = date(ANIO, k + 1, 1), date(ANIO + (k == 11), (k + 1) % 12 + 1, 1) - timedelta(days=1)
        hc.formula(f'G{rr}', f'=SUMIFS({ING("G")},{ING("B")},">="&DATE({ANIO},{k + 1},1),{ING("B")},"<="&DATE({fin.year},{fin.month},{fin.day}))-SUMIFS({GAS("N")},{GAS("B")},">="&DATE({ANIO},{k + 1},1),{GAS("B")},"<="&DATE({fin.year},{fin.month},{fin.day}))', fmt=E.fmt_dinero)
        hc.formula(f'H{rr}', ultimo_habil(ANIO, k + 1), fmt=E.fmt_fecha, h='center')
    m1 = m0 + 11
    hc.lista(f'C{m0}:C{m1}', ['Sí', 'No'])
    nombre_rango(wb, 'CUOTA_MES', 'Cuota autónomos', f'E{m0}:E{m1}')
    nombre_rango(wb, 'CUOTA_TRIM', 'Cuota autónomos', f'F{m0}:F{m1}')
    fila = m1 + 1
    hc.formula(f'B{fila}', 'Total del año', bold=True, h='left')
    hc.resultado(f'E{fila}', '=SUM(CUOTA_MES)', fmt=E.fmt_dinero)
    nombre(wb, 'CUOTA_ANUAL', 'Cuota autónomos', f'E{fila}')
    hc.formula(f'G{fila}', f'=SUM(G{m0}:G{m1})', fmt=E.fmt_dinero, bold=True)
    fila += 1
    hc.nota(f'B{fila}', 'El cargo se hace el último día hábil de cada mes (aquí, sin contar festivos). Puedes cambiar de base hasta seis veces al año.')
    hc.ws.merge_cells(f'B{fila}:H{fila}')
    fila += 2

    hc.seccion(fila, '3. Regularización estimada con tus rendimientos reales', 'B', 'H'); fila += 1
    hc.etiqueta(f'B{fila}', 'Rendimiento neto real del año, según tus libros (€)')
    hc.formula(f'C{fila}', "=MAX(0,'Renta 2027'!C8-'Renta 2027'!C9)", fmt=E.fmt_dinero); rreal = fila; fila += 1
    hc.etiqueta(f'B{fila}', 'Tramo que te corresponde de verdad')
    hc.formula(f'C{fila}', f'=MIN(COUNT(T_RMIN),COUNTIF(T_RMAX,"<"&(C{rreal}*(1-GASTOS_GENERICOS/100)/12))+1)', h='center'); rtr = fila; fila += 1
    hc.etiqueta(f'B{fila}', 'Cuota mínima de ese tramo × 12 (€)')
    hc.formula(f'C{fila}', f'=INDEX(T_BMIN,C{rtr})*TIPO_RETA/100*12', fmt=E.fmt_dinero); rmin = fila; fila += 1
    hc.etiqueta(f'B{fila}', 'Lo que has pagado (sin los meses de tarifa plana) (€)')
    hc.formula(f'C{fila}', f'=SUMIFS(E{m0}:E{m1},C{m0}:C{m1},"<>Sí")', fmt=E.fmt_dinero); rpag = fila; fila += 1
    hc.etiqueta(f'B{fila}', 'Meses sin tarifa plana')
    hc.formula(f'C{fila}', f'=COUNTIF(C{m0}:C{m1},"<>Sí")', h='center'); rmes = fila; fila += 1
    hc.etiqueta(f'B{fila}', 'Diferencia estimada: + te reclamarán / − te devolverán', bold=True)
    hc.resultado(f'C{fila}', f'=C{rmin}/12*C{rmes}-C{rpag}', fmt=E.fmt_dinero)
    hc.nota(f'D{fila}', 'Orientativo. La Seguridad Social regulariza al año siguiente con los datos de Hacienda: solo devuelve si cotizaste por encima de la base máxima de tu tramo real; si cotizaste por una base mayor por elección, la diferencia no se devuelve.')
    hc.ws.merge_cells(f'D{fila}:H{fila + 1}')
    hc.ws.row_dimensions[fila].height = 30
    fila += 3

    hc.seccion(fila, f'4. Tabla de tramos {ANIO}' + (' (provisional: tabla de 2026)' if A.get('provisional') else ''), 'B', 'H'); fila += 1
    hc.tabla_cab(fila, 2, ['Tramo', 'Rendimiento mensual desde', 'Rendimiento mensual hasta', 'Base mínima', 'Base máxima', 'Cuota mínima', 'Cuota máxima'])
    fila += 1
    t0 = fila
    for k, t in enumerate(tramos):
        rr = t0 + k
        hc.formula(f'B{rr}', f'Tramo {k + 1} · ' + ('reducida' if t.get('tabla') == 'reducida' else 'general'), h='left')
        hc.formula(f'C{rr}', t['rend_min'], fmt=E.fmt_dinero)
        hc.formula(f'D{rr}', t['rend_max'] if t['rend_max'] is not None else 'en adelante', fmt=E.fmt_dinero)
        hc.formula(f'E{rr}', t['base_min'], fmt=E.fmt_dinero)
        hc.formula(f'F{rr}', t['base_max'], fmt=E.fmt_dinero)
        hc.formula(f'G{rr}', f'=E{rr}*TIPO_RETA/100', fmt=E.fmt_dinero)
        hc.formula(f'H{rr}', f'=F{rr}*TIPO_RETA/100', fmt=E.fmt_dinero)
    t1 = t0 + len(tramos) - 1
    nombre_rango(wb, 'T_RMIN', 'Cuota autónomos', f'C{t0}:C{t1}')
    nombre_rango(wb, 'T_RMAX', 'Cuota autónomos', f'D{t0}:D{t1}')
    nombre_rango(wb, 'T_BMIN', 'Cuota autónomos', f'E{t0}:E{t1}')
    nombre_rango(wb, 'T_BMAX', 'Cuota autónomos', f'F{t0}:F{t1}')
    hc.resaltar_si(f'B{t0}:H{t1}', f'ROW()-{t0 - 1}=TRAMO', mezclar(E.acento, 0.6), bold=True)
    # El tramo: cuántos tramos tienen el máximo por debajo del rendimiento (el último no tiene máximo)
    hc.resultado(tramo_ref, '=MIN(COUNT(T_RMIN),COUNTIF(T_RMAX,"<"&COMPUTABLE_MES)+1)', fmt='0')
    hc.nota(f'B{t1 + 1}', f'Fuente: {fa[0]}. Tipo total {A["tipo_total_pct"]} %: contingencias comunes, profesionales, cese de actividad, formación y MEI.')
    hc.ws.merge_cells(f'B{t1 + 1}:H{t1 + 1}')
    hc.proteger()

    # ------------------------------------------------------------ Modelo 303
    h3 = Hoja(wb, 'Modelo 303', E, E.pri, {'A': 3, 'B': 50, 'C': 3, 'D': 16, 'E': 16, 'F': 16, 'G': 16, 'H': 16})
    fila = h3.cabecera(f'Modelo 303 · IVA {ANIO}', 'Se calcula solo con tus libros. Copia la columna del trimestre en el formulario de la AEAT.', 'H')
    fila += 1
    h3.tabla_cab(fila, 2, ['Concepto', '', '1T (ene-mar)', '2T (abr-jun)', '3T (jul-sep)', '4T (oct-dic)', 'Año'])
    fila += 1
    filas303 = {}
    def linea(clave, texto, fs, fmt=E.fmt_dinero, total=True, bold=False, res=False):
        nonlocal fila
        h3.etiqueta(f'B{fila}', texto, bold=bold)
        for q, col in enumerate(COLS, 1):
            f_ = fs(q, col)
            (h3.resultado if res else h3.formula)(f'{col}{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if total:
            (h3.resultado if res else h3.formula)(f'H{fila}', f'=SUM(D{fila}:G{fila})', fmt=fmt, **({} if res else {'bold': bold}))
        filas303[clave] = fila
        fila += 1
    for tipo, nom in [('IVA_GENERAL', 'general'), ('IVA_REDUCIDO', 'reducido'), ('IVA_SUPERREDUCIDO', 'superreducido')]:
        linea(f'b_{tipo}', f'Base imponible al tipo {nom}', lambda q, c, tipo=tipo: f'=SUMIFS({ING("G")},{ING("H")},{tipo},{ING("M")},{q},{ING("N")},ANIO)')
        linea(f'c_{tipo}', f'   Cuota devengada al tipo {nom}', lambda q, c, tipo=tipo: f'={c}{filas303["b_" + tipo]}*{tipo}/100')
    linea('b0', 'Operaciones exentas o sin IVA (informativo)', lambda q, c: f'=SUMIFS({ING("G")},{ING("H")},0,{ING("M")},{q},{ING("N")},ANIO)')
    linea('dev', 'Total cuota devengada', lambda q, c: f'={c}{filas303["c_IVA_GENERAL"]}+{c}{filas303["c_IVA_REDUCIDO"]}+{c}{filas303["c_IVA_SUPERREDUCIDO"]}', bold=True)
    linea('sop', 'IVA soportado deducible (gastos)', lambda q, c: f'=SUMIFS({GAS("M")},{GAS("O")},{q},{GAS("P")},ANIO)')
    linea('dif', 'Diferencia (devengado − soportado)', lambda q, c: f'={c}{filas303["dev"]}-{c}{filas303["sop"]}', bold=True)
    prev = {'E': 'D', 'F': 'E', 'G': 'F'}
    # La fila de resultado se escribe después: aquí se reserva la de compensación
    fcomp = fila
    filas303['comp'] = fcomp
    fila += 1
    linea('res', 'Resultado de la liquidación', lambda q, c: f'={c}{filas303["dif"]}-{c}{fcomp}', bold=True)
    h3.etiqueta(f'B{fcomp}', 'Cuotas a compensar de periodos anteriores')
    for q, col in enumerate(COLS, 1):
        h3.formula(f'{col}{fcomp}', '=COMPENSAR_INICIAL' if q == 1 else f'=MAX(0,-{prev[col]}{filas303["res"]})', fmt=E.fmt_dinero)
    h3.formula(f'H{fcomp}', '', fmt=E.fmt_dinero)
    fila += 1
    linea('ing', 'A INGRESAR', lambda q, c: f'=MAX(0,{c}{filas303["res"]})', res=True)
    linea('acomp', 'A compensar en el trimestre siguiente', lambda q, c: (f'=IF({c}{filas303["res"]}<0,-{c}{filas303["res"]},0)' if q < 4 else '=0'), total=False)
    linea('dev4', 'A devolver (solo en el 4T, si lo pides)', lambda q, c: ('=0' if q < 4 else f'=IF({c}{filas303["res"]}<0,-{c}{filas303["res"]},0)'), total=False)
    fila += 1
    plz = F['modelos']['303']['plazos']
    h3.etiqueta(f'B{fila}', 'Plazo de presentación')
    for q, col in enumerate(COLS, 1):
        h3.formula(f'{col}{fila}', plz[q - 1] + (f' {ANIO + 1}' if q == 4 else ''), h='center')
    fila += 1
    h3.etiqueta(f'B{fila}', 'Último día (si cae en fin de semana, el lunes)', bold=True)
    for q, col in enumerate(COLS, 1):
        h3.formula(f'{col}{fila}', fecha_plazo(plz[q - 1], q), fmt=E.fmt_fecha, h='center', bold=True)
    fila += 2
    h3.nota(f'B{fila}', F['modelos']['303']['nota'] + ' En enero también se presenta el resumen anual (modelo 390) con los totales de la columna «Año».')
    h3.ws.merge_cells(f'B{fila}:H{fila + 1}')
    h3.ws.row_dimensions[fila].height = 30
    for q, col in enumerate(COLS, 1):
        nombre(wb, f'RES_303_{q}', 'Modelo 303', f'{col}{filas303["res"]}')
        nombre(wb, f'PAGO_303_{q}', 'Modelo 303', f'{col}{filas303["ing"]}')
    h3.resaltar_si(f'D{filas303["res"]}:G{filas303["res"]}', f'D{filas303["res"]}<0', mezclar(E.marca, 0.8))
    h3.ws.freeze_panes = 'C8'
    h3.proteger()

    # ------------------------------------------------------------ Modelo 130
    h1 = Hoja(wb, 'Modelo 130', E, E.pri, {'A': 3, 'B': 54, 'C': 3, 'D': 16, 'E': 16, 'F': 16, 'G': 16, 'H': 3})
    fila = h1.cabecera(f'Modelo 130 · pago fraccionado del IRPF {ANIO}', 'Acumulado desde el 1 de enero hasta el final de cada trimestre', 'G')
    fila += 1
    h1.tabla_cab(fila, 2, ['Concepto', '', '1T', '2T', '3T', '4T'])
    fila += 1
    f130 = {}
    def l1(clave, texto, fs, fmt=E.fmt_dinero, bold=False, res=False):
        nonlocal fila
        h1.etiqueta(f'B{fila}', texto, bold=bold)
        for q, col in enumerate(COLS, 1):
            (h1.resultado if res else h1.formula)(f'{col}{fila}', fs(q, col), fmt=fmt, **({} if res else {'bold': bold}))
        f130[clave] = fila
        fila += 1
    l1('ing', 'Ingresos computables acumulados', lambda q, c: f'=SUMIFS({ING("G")},{ING("M")},"<="&{q},{ING("N")},ANIO)')
    l1('gas', 'Gastos deducibles acumulados (libro de gastos)', lambda q, c: f'=SUMIFS({GAS("N")},{GAS("O")},"<="&{q},{GAS("P")},ANIO)')
    l1('cuota', 'Cuota de autónomos acumulada', lambda q, c: f'=SUMIFS(CUOTA_MES,CUOTA_TRIM,"<="&{q})')
    l1('rend', 'Rendimiento neto acumulado', lambda q, c: f'={c}{f130["ing"]}-{c}{f130["gas"]}-{c}{f130["cuota"]}', bold=True)
    l1('pago', 'Pago fraccionado (20 % del rendimiento positivo)', lambda q, c: f'=MAX(0,{c}{f130["rend"]})*PCT_130/100')
    l1('ret', 'Retenciones de tus facturas, acumuladas', lambda q, c: f'=SUMIFS({ING("K")},{ING("M")},"<="&{q},{ING("N")},ANIO)')
    fant = fila; f130['ant'] = fant; fila += 1
    l1('min', 'Minoración por rendimientos bajos en 2026', lambda q, c: f'=IF(REND_ANTERIOR<=MINOR_H1,MINOR_E1,IF(REND_ANTERIOR<=MINOR_H2,MINOR_E2,IF(REND_ANTERIOR<=MINOR_H3,MINOR_E3,IF(REND_ANTERIOR<=MINOR_H4,MINOR_E4,0))))*{q}')
    l1('res', 'Resultado', lambda q, c: f'={c}{f130["pago"]}-{c}{f130["ret"]}-{c}{fant}-{c}{f130["min"]}', bold=True)
    l1('ing130', 'A INGRESAR', lambda q, c: f'=IF(PRESENTA_130="No",0,MAX(0,{c}{f130["res"]}))', res=True)
    h1.etiqueta(f'B{fant}', 'Pagos de los 130 anteriores del año')
    for q, col in enumerate(COLS, 1):
        h1.formula(f'{col}{fant}', '=0' if q == 1 else f'=SUM($D{f130["ing130"]}:{prev[col]}{f130["ing130"]})', fmt=E.fmt_dinero)
    fila += 1
    plz = F['modelos']['130']['plazos']
    h1.etiqueta(f'B{fila}', 'Último día de presentación', bold=True)
    for q, col in enumerate(COLS, 1):
        h1.formula(f'{col}{fila}', fecha_plazo(plz[q - 1], q), fmt=E.fmt_fecha, h='center', bold=True)
    fila += 2
    h1.formula(f'B{fila}', '=IF(PRESENTA_130="No","Has indicado que no presentas el 130 (más del 70 % de tus ingresos de 2026 llevaron retención): los importes son solo informativos.","Un resultado negativo no se devuelve: se resta solo en los trimestres siguientes, porque el cálculo es acumulado.")', h='left')
    h1.ws.merge_cells(f'B{fila}:G{fila}')
    fila += 1
    h1.nota(f'B{fila}', m130['nota'] + ' Minoración: ' + mino['nota'])
    h1.ws.merge_cells(f'B{fila}:G{fila + 1}')
    h1.ws.row_dimensions[fila].height = 30
    for q, col in enumerate(COLS, 1):
        nombre(wb, f'RES_130_{q}', 'Modelo 130', f'{col}{f130["res"]}')
        nombre(wb, f'PAGO_130_{q}', 'Modelo 130', f'{col}{f130["ing130"]}')
    h1.ws.freeze_panes = 'C8'
    h1.proteger()

    # ------------------------------------------------------------ Renta 2027
    hr = Hoja(wb, 'Renta 2027', E, E.pri, {'A': 3, 'B': 60, 'C': 18, 'D': 62})
    fila = hr.cabecera(f'Estimación de la renta {ANIO}', f'Se declara entre abril y junio de {ANIO + 1}. Estimación directa simplificada, sin deducciones.', 'D')
    fila += 1
    assert fila == 7
    R = {}
    def lr(clave, texto, f_, fmt=E.fmt_dinero, bold=False, res=False, nota_=''):
        nonlocal fila
        hr.etiqueta(f'B{fila}', texto, bold=bold)
        (hr.resultado if res else hr.formula)(f'C{fila}', f_, fmt=fmt, **({} if res else {'bold': bold}))
        if nota_:
            hr.nota(f'D{fila}', nota_)
        R[clave] = f'C{fila}'
        fila += 1
    hr.seccion(fila, 'Rendimiento de la actividad', 'B', 'D'); fila += 1
    lr('ing', 'Ingresos del año', f'=SUMIFS({ING("G")},{ING("N")},ANIO)')
    lr('gas', 'Gastos deducibles del libro', f'=SUMIFS({GAS("N")},{GAS("P")},ANIO)')
    lr('previo', 'Rendimiento antes de la cuota', f'=MAX(0,{R["ing"]}-{R["gas"]})')
    lr('cuota', 'Cuota de autónomos del año', '=ROUND(CUOTA_ANUAL,2)', nota_='Desde «Cuota autónomos»')
    lr('neto', 'Rendimiento neto', f'=MAX(0,{R["previo"]}-{R["cuota"]})', bold=True)
    lr('dj', 'Gastos de difícil justificación', f'=MIN({R["neto"]}*DJ_PCT/100,DJ_MAX)', nota_='5 % del rendimiento neto, máximo 2.000 € (art. 30 RIRPF)')
    lr('base', 'Base liquidable general', f'=MAX(0,{R["neto"]}-{R["dj"]})', bold=True)
    fila += 1
    hr.seccion(fila, 'Mínimo personal y familiar', 'B', 'D'); fila += 1
    desc = '+'.join(f'IF(HIJOS>={k},MIN_DESC{k},0)' for k in range(1, ndesc + 1)) + f'+MAX(0,HIJOS-{ndesc})*MIN_DESC{ndesc}+MIN(HIJOS,HIJOS3)*MIN_MENOR3'
    lr('desc', 'Mínimo por descendientes', f'=({desc})*IF(HIJOS100="Sí",1,0.5)')
    edad = 'IF(EDAD>=65,MIN_65,0)+IF(EDAD>=75,MIN_75,0)'
    lr('mE', 'Mínimo personal y familiar estatal', f'=MIN_PERSONAL+{edad}+{R["desc"]}')
    lr('mA', 'Mínimo personal y familiar autonómico', f'=INDEX(CCAA_MINP,MATCH(CCAA,CCAA_COD,0))+{edad}+{R["desc"]}', nota_='Algunas comunidades tienen un mínimo personal propio')
    fila += 1
    hr.seccion(fila, 'Cuota', 'B', 'D'); fila += 1
    b = R['base']
    mEg, mAg = f'MIN({R["mE"]},{b})', f'MIN({R["mA"]},{b})'
    lr('est', 'Cuota estatal', f'=MAX(0,{cuota_escala(b, chr(34) + "ESTATAL" + chr(34))}-{cuota_escala(mEg, chr(34) + "ESTATAL" + chr(34))})')
    lr('aut', 'Cuota autonómica', f'=MAX(0,{cuota_escala(b, "CCAA")}-{cuota_escala(mAg, "CCAA")})', nota_='="Escala de "&CCAA_NOMBRE')
    lr('bonif', 'Bonificación (Ceuta y Melilla)', f'=INDEX(CCAA_BONIF,MATCH(CCAA,CCAA_COD,0))', fmt='0" %"')
    lr('total', 'Cuota íntegra total', f'=({R["est"]}+{R["aut"]})*(1-{R["bonif"]}/100)', res=True)
    lr('medio', 'Tipo medio sobre la base', f'=IF({b}>0,{R["total"]}/{b}*100,0)', fmt=E.fmt_pct)
    fila += 1
    hr.seccion(fila, 'Resultado de la declaración', 'B', 'D'); fila += 1
    lr('ret', 'Retenciones de tus facturas', f'=SUMIFS({ING("K")},{ING("N")},ANIO)', nota_='')
    lr('p130', 'Pagos fraccionados (modelo 130)', '=PAGO_130_1+PAGO_130_2+PAGO_130_3+PAGO_130_4')
    lr('resultado', 'A PAGAR (+) o A DEVOLVER (−)', f'={R["total"]}-{R["ret"]}-{R["p130"]}', res=True)
    lr('netoanual', 'Lo que te queda en el año (tras cuota e IRPF)', f'={R["previo"]}-{R["cuota"]}-{R["total"]}', bold=True)
    lr('netomes', 'Al mes', f'={R["netoanual"]}/12')
    fila += 1
    hr.nota(f'B{fila}', 'Estimación para un contribuyente que declara solo. No incluye otras rentas (nómina, alquileres, ahorro), deducciones estatales o autonómicas, planes de pensiones ni la tributación conjunta. Compárala siempre con el borrador de Renta WEB.')
    hr.ws.merge_cells(f'B{fila}:D{fila + 1}')
    hr.ws.row_dimensions[fila].height = 30
    for k in ('total', 'resultado', 'base', 'neto'):
        nombre(wb, f'RENTA_{k.upper()}', 'Renta 2027', R[k])
    hr.proteger()
    assert R['ing'] == 'C8' and R['gas'] == 'C9'

    # ------------------------------------------------------------ Calendario
    hk = Hoja(wb, 'Calendario 2027', E, E.acento, {'A': 3, 'B': 13, 'C': 12, 'D': 22, 'E': 64, 'F': 10, 'G': 3})
    fila = hk.cabecera(f'Calendario fiscal {ANIO}', 'Fechas límite de presentación (con domiciliación, unos días antes). Marca «Sí» cuando lo hayas hecho.', 'F')
    hk.tabla_cab(fila, 2, ['Fecha', 'Día', 'Modelos', 'Qué es', '¿Hecho?'])
    fila += 1
    eventos = []
    for ev in F['modelos'][f'calendario_{ANIO}']:
        d = fecha_iso(ev['fecha'])
        mods = ev['modelos']
        txt = '; '.join(f'{m}: {DESCRIPCION_MODELOS.get(m, "")}' for m in mods if m in PARA_AUTONOMO) or '; '.join(f'{m}: {DESCRIPCION_MODELOS.get(m, "")}' for m in mods)
        eventos.append((d, ', '.join(mods), txt + (f' · {ev["nota"]}' if ev.get('nota') else '')))
    # 4T del año (enero del año siguiente), calculado con la misma regla
    d4 = fecha_plazo(F['modelos']['303']['plazos'][3], 4)
    eventos.append((d4, '303, 130, 390', f'4T de {ANIO}: IVA, pago fraccionado y resumen anual de IVA'))
    for k in range(12):
        eventos.append((ultimo_habil(ANIO, k + 1), 'RETA', f'Cargo de la cuota de autónomos de {MESES_ES[k]}'))
    eventos.sort()
    k0 = fila
    for d, mods, txt in eventos:
        hk.formula(f'B{fila}', d, fmt=E.fmt_fecha, h='center', bold=mods != 'RETA')
        hk.formula(f'C{fila}', DIAS_ES[d.weekday()], h='center')
        hk.formula(f'D{fila}', mods, h='left', bold=mods != 'RETA', color=E.pri if mods != 'RETA' else E.suave)
        hk.c(f'E{fila}', txt, font=E.f(9, False, E.tinta if mods != 'RETA' else E.suave), wrap=True, border=E.b_fino)
        hk.entrada(f'F{fila}', h='center')
        hk.ws.row_dimensions[fila].height = 15 * max(1, len(txt) // 85 + 1)
        fila += 1
    k1 = fila - 1
    hk.lista(f'F{k0}:F{k1}', ['Sí', 'No'])
    hk.resaltar_si(f'B{k0}:F{k1}', f'$F{k0}="Sí"', 'E9F5EE', font_color='6B7B74')
    hk.resaltar_si(f'B{k0}:F{k1}', f'AND($F{k0}<>"Sí",$B{k0}<TODAY())', mezclar('#E5484D', 0.82))
    hk.resaltar_si(f'B{k0}:F{k1}', f'AND($F{k0}<>"Sí",$B{k0}>=TODAY(),$B{k0}-TODAY()<=15)', mezclar(E.acento, 0.5), bold=True)
    hk.nota(f'B{fila + 1}', f'En amarillo, lo que vence en los próximos 15 días; en rojo, lo vencido sin marcar. Fuente: calendario del contribuyente de la AEAT ({fuente_de(F["modelos"])[0] or "Agencia Tributaria"}). {F["modelos"].get("100", "")}')
    hk.ws.merge_cells(f'B{fila + 1}:F{fila + 2}')
    hk.ws.row_dimensions[fila + 1].height = 30
    hk.ws.freeze_panes = f'B{k0}'
    hk.proteger()

    # ------------------------------------------------------------ Panel (va tercero)
    hp = Hoja(wb, 'Panel', E, E.acento, {'A': 3, 'B': 40, 'C': 16, 'D': 16, 'E': 16, 'F': 16, 'G': 16, 'H': 3})
    fila = hp.cabecera(f'Panel {ANIO}', '="Titular: "&IF(TITULAR="","(escribe tu nombre en Mis datos)",TITULAR)', 'G')
    fila += 1
    hp.tabla_cab(fila, 2, ['A pagar a Hacienda y la Seguridad Social', '1T', '2T', '3T', '4T', 'Año'])
    fila += 1
    p0 = fila
    filas_panel = [('IVA (modelo 303)', lambda q: f'=PAGO_303_{q}'), ('IRPF (modelo 130)', lambda q: f'=PAGO_130_{q}'),
                   ('Cuota de autónomos del trimestre', lambda q: f'=SUMIFS(CUOTA_MES,CUOTA_TRIM,{q})')]
    for txt, fq in filas_panel:
        hp.etiqueta(f'B{fila}', txt)
        for q, col in enumerate('CDEF', 1):
            hp.formula(f'{col}{fila}', fq(q), fmt=E.fmt_dinero)
        hp.formula(f'G{fila}', f'=SUM(C{fila}:F{fila})', fmt=E.fmt_dinero, bold=True)
        fila += 1
    hp.etiqueta(f'B{fila}', 'Total del trimestre', bold=True)
    for col in 'CDEFG':
        hp.resultado(f'{col}{fila}', f'=SUM({col}{p0}:{col}{fila - 1})', fmt=E.fmt_dinero)
    fila += 1
    hp.etiqueta(f'B{fila}', 'Último día para el 303 y el 130')
    for q, col in enumerate('CDEF', 1):
        hp.formula(f'{col}{fila}', fecha_plazo(F['modelos']['303']['plazos'][q - 1], q), fmt=E.fmt_fecha, h='center')
    fila += 2
    hp.tabla_cab(fila, 2, ['Tu año', 'Importe', '', '', '', ''])
    fila += 1
    for txt, f_, fmt in [('Facturado (base sin IVA)', "='Renta 2027'!C8", E.fmt_dinero), ('Gastos deducibles', "='Renta 2027'!C9", E.fmt_dinero),
                         ('Cuota de autónomos', "='Renta 2027'!C11", E.fmt_dinero), ('IRPF estimado del año', '=RENTA_TOTAL', E.fmt_dinero),
                         ('Renta: a pagar (+) o a devolver (−) en ' + str(ANIO + 1), '=RENTA_RESULTADO', E.fmt_dinero),
                         ('Te queda al mes', "='Renta 2027'!C" + R['netomes'][1:], E.fmt_dinero)]:
        hp.etiqueta(f'B{fila}', txt, bold=txt.startswith('Renta') or txt.startswith('Te queda'))
        (hp.resultado if txt.startswith('Renta') or txt.startswith('Te queda') else hp.formula)(f'C{fila}', f_, fmt=fmt)
        fila += 1
    fila += 1
    hp.seccion(fila, 'Cuánto apartar de cada factura', 'B', 'G'); fila += 1
    hp.etiqueta(f'B{fila}', 'Del IVA que cobras: apártalo entero')
    hp.formula(f'C{fila}', '=1', fmt='0%'); fila += 1
    hp.etiqueta(f'B{fila}', 'De la base, para IRPF y cuota (con tus cifras)', bold=True)
    hp.resultado(f'C{fila}', "=IF('Renta 2027'!C8>0,(RENTA_TOTAL-'Renta 2027'!C" + R['ret'][1:] + "+'Renta 2027'!C11)/'Renta 2027'!C8,0)", fmt='0.0%')
    hp.nota(f'D{fila}', 'IRPF del año (menos lo que ya te retienen) más la cuota, sobre lo facturado.')
    hp.ws.merge_cells(f'D{fila}:G{fila}')
    fila += 2
    hp.nota(f'B{fila}', 'Las cifras se actualizan solas al apuntar facturas. Estimación orientativa: no es asesoramiento fiscal.', italic=True)
    hp.ws.merge_cells(f'B{fila}:G{fila}')
    hp.proteger()

    # Orden de las hojas
    orden = ['Portada', 'Instrucciones', 'Panel', 'Mis datos', 'Ingresos', 'Gastos', 'Modelo 303', 'Modelo 130', 'Cuota autónomos', 'Renta 2027', 'Calendario 2027', 'Parámetros', 'Escalas IRPF']
    wb._sheets = [wb[n] for n in orden]

    if demo:
        rellenar_demo(wb)
    return wb


def _bloque_datos(h: Hoja, fila: int, datos, E: Estilo) -> int:
    for texto, defecto, tipo, ayuda, nom in datos:
        h.etiqueta(f'B{fila}', texto, bold=True)
        fmt = E.fmt_dinero if tipo == 'dinero' else None
        h.entrada(f'C{fila}', defecto, fmt=fmt, h='left' if tipo in (None, 'lista_ccaa') or isinstance(tipo, list) else 'right')
        if isinstance(tipo, list):
            h.lista(f'C{fila}', tipo)
        elif tipo == 'lista_ccaa':
            h.lista(f'C{fila}', 'CCAA_NOM')
        elif tipo == 'entero':
            h.numero(f'C{fila}', 0, 120, decimal=False)
        elif tipo == 'dinero':
            h.numero(f'C{fila}', 0)
        if ayuda:
            h.nota(f'D{fila}', ayuda)
        if nom:
            nombre(h.wb, nom, h.titulo, f'C{fila}')
        h.ws.row_dimensions[fila].height = 22
        fila += 1
    return fila


# Facturas de ejemplo (solo para las capturas de la página de producto y las pruebas)
DEMO_INGRESOS = [
    ('2027-01-15', 'F-001', 'Estudio Pla SL', 'B25123456', 'Diseño web', 1800, 21, 15), ('2027-02-10', 'F-002', 'Café Noguera', 'B25987654', 'Identidad de marca', 950, 21, 15),
    ('2027-03-28', 'F-003', 'Marta Ribes', '', 'Fotografía de producto', 420, 21, 0), ('2027-04-22', 'F-004', 'Estudio Pla SL', 'B25123456', 'Mantenimiento web', 600, 21, 15),
    ('2027-05-30', 'F-005', 'Agro Segrià SCCL', 'F25111222', 'Campaña de redes', 2400, 21, 15), ('2027-06-18', 'F-006', 'Llibreria Fènix', 'B25333444', 'Catálogo', 780, 21, 15),
    ('2027-07-09', 'F-007', 'Estudio Pla SL', 'B25123456', 'Mantenimiento web', 600, 21, 15), ('2027-09-25', 'F-008', 'Ajuntament (contrato menor)', 'P2500000A', 'Cartelería fiestas', 1500, 21, 15),
    ('2027-10-14', 'F-009', 'Café Noguera', 'B25987654', 'Menús y señalética', 650, 21, 15), ('2027-11-20', 'F-010', 'Agro Segrià SCCL', 'F25111222', 'Campaña de Navidad', 2100, 21, 15),
    ('2027-12-12', 'F-011', 'Formació Lleida', 'B25555666', 'Curso de diseño (exento)', 900, 0, 15),
]
DEMO_GASTOS = [
    ('2027-01-03', 'A-221', 'Adobe Systems', '', 'Suscripción Creative Cloud', 'Software y suscripciones', 72.6, 21, '', 100), ('2027-01-31', '7781', 'Movistar', 'A82018474', 'Fibra y móvil', 'Telefonía e internet', 49.5, 21, '', 50),
    ('2027-02-14', 'T-87', 'Papelería Centro', '', 'Material', 'Material', 35, 21, 'No', 100), ('2027-04-05', '2027/112', 'Gestoria Segrià', 'B25444555', 'Asesoría trimestral', 'Asesoría', 120, 21, '', 100),
    ('2027-05-12', 'PC-55', 'PcComponentes', 'B73347494', 'Monitor', 'Material', 289, 21, '', 100), ('2027-07-04', '2027/240', 'Gestoria Segrià', 'B25444555', 'Asesoría trimestral', 'Asesoría', 120, 21, '', 100),
    ('2027-09-01', 'C-9', 'Coworking La Seu', 'B25777888', 'Puesto fijo septiembre', 'Alquiler de local', 150, 21, '', 100), ('2027-10-06', '2027/351', 'Gestoria Segrià', 'B25444555', 'Asesoría trimestral', 'Asesoría', 120, 21, '', 100),
    ('2027-11-15', 'F-77', 'Escola d’Art', '', 'Curso tipografía', 'Formación', 180, 0, '', 100),
]


def rellenar_demo(wb, ingresos=DEMO_INGRESOS, gastos=DEMO_GASTOS, datos=None):
    hi, hg = wb['Ingresos'], wb['Gastos']
    if datos is None:
        datos = {'TITULAR': 'Ana Serra Puig', 'NIF_TITULAR': '12345678Z'}
    for k, v in datos.items():
        poner(wb, k, v)
    for k, (f, n, cli, nif, con, base, iva, ret) in enumerate(ingresos):
        rr = I0 + k
        hi[f'B{rr}'] = fecha_iso(f)
        hi[f'C{rr}'], hi[f'D{rr}'], hi[f'E{rr}'], hi[f'F{rr}'], hi[f'G{rr}'], hi[f'H{rr}'], hi[f'J{rr}'] = n, cli, nif, con, base, iva, ret
    for k, (f, n, pro, nif, con, cat, base, iva, ded, af) in enumerate(gastos):
        rr = I0 + k
        hg[f'B{rr}'] = fecha_iso(f)
        hg[f'C{rr}'], hg[f'D{rr}'], hg[f'E{rr}'], hg[f'F{rr}'], hg[f'G{rr}'], hg[f'H{rr}'], hg[f'I{rr}'] = n, pro, nif, con, cat, base, iva
        hg[f'K{rr}'] = ded or None
        hg[f'L{rr}'] = af


# ---------------------------------------------------------------- Guía de uso (PDF)

def guia_html() -> str:
    E = Estilo('impuestos')
    P = producto(ID)
    url = url_publica('impuestos')
    m = F['modelos']
    plz = m['303']['plazos']
    fechas = ''.join(f'<tr><td>{q}T</td><td>{plz[q - 1]}{" " + str(ANIO + 1) if q == 4 else ""}</td><td>{fecha_plazo(plz[q - 1], q).strftime("%d/%m/%Y")}</td></tr>' for q in range(1, 5))
    A = L['autonomos']
    prov = ' Los parámetros de 2027 son provisionales: los tramos de cotización y algunas escalas se copian de 2026 hasta que se publiquen.' if F.get('estado') == 'provisional' else ''
    cuerpo = portada_pdf(E, 'Guía del Kit del autónomo 2027', 'Cómo llevar tus libros, preparar el 303 y el 130 de cada trimestre y saber cuánto apartar, en una tarde al trimestre.',
                         ['Libro de ingresos y gastos', 'Modelo 303', 'Modelo 130', 'Cuota por tramos', 'Renta estimada', 'Calendario 2027'],
                         f'{E.nombre} · {url.replace("https://", "")} · hola@numimates.com<br>Herramienta orientativa: no es asesoramiento fiscal. Contenido preparado con ayuda de IA y revisado con fuentes oficiales.')
    cuerpo += f"""
<h2>1. Lo primero: tu copia y tus datos</h2>
<ol class="pasos"><li><strong>Guarda una copia</strong> del Excel con tu nombre y el año. Trabaja siempre en tu copia; el original te sirve para empezar de cero.</li>
<li><strong>Mis datos.</strong> Elige tu comunidad autónoma (cambia la escala de la renta), si tienes tarifa plana todo el año, si presentas el 130 y tu rendimiento neto de 2026 (lo usa la minoración del 130).</li>
<li><strong>Si ya tenías facturas de este año</strong>, cópialas en «Ingresos» y «Gastos»: una fila por factura, con su fecha. Las de otro año se ven en gris y no cuentan.</li></ol>
<div class="caja"><strong>Las celdas amarillas son tuyas.</strong> Todo lo demás se calcula solo. Las hojas de cálculo están protegidas sin contraseña para que no borres una fórmula sin querer (Revisar → Desproteger hoja).</div>

<h2>2. Cada factura, una fila</h2>
<h3>Ingresos (facturas emitidas)</h3>
<p>Fecha, número, cliente, NIF, concepto, <strong>base imponible sin IVA</strong>, tipo de IVA (21, 10, 4 o 0) y retención de IRPF que pones en la factura (15 % general, 7 % los tres primeros años). La cuota de IVA, la retención en euros, el total y el trimestre salen solos.</p>
<h3>Gastos (facturas recibidas)</h3>
<p>Fecha, proveedor, base, tipo de IVA y categoría. Dos columnas importan:</p>
<ul><li><strong>¿IVA deducible?</strong> Déjalo vacío (= Sí) si tienes factura completa a tu nombre. Marca «No» en tickets o facturas que no permiten deducir el IVA: entonces ese IVA cuenta como gasto en el IRPF.</li>
<li><strong>% afectación.</strong> Si el gasto es en parte personal (móvil, fibra), pon el porcentaje que usas para el trabajo. Vacío = 100 %.</li></ul>
<p>La cuota de autónomos <strong>no</strong> se apunta como gasto: el kit la suma sola desde su hoja.</p>

<h2>3. Cada trimestre: 303 y 130</h2>
<p>Abre «Modelo 303» y «Modelo 130». La columna del trimestre tiene las cifras que copias en el formulario de la Sede electrónica de la AEAT.</p>
<ul><li><strong>303 (IVA):</strong> IVA que has cobrado menos el IVA deducible de tus gastos. Si sale negativo en el 1T, 2T o 3T, se compensa solo en el siguiente; en el 4T puedes pedir la devolución.</li>
<li><strong>130 (IRPF):</strong> el {m['130']['pct']} % del rendimiento neto acumulado desde enero (ingresos − gastos − cuota de autónomos), menos las retenciones de tus facturas y lo que ya pagaste en los trimestres anteriores. Si tu rendimiento de 2026 fue bajo, se aplica la minoración.</li></ul>
<table><tr><th>Trimestre</th><th>Plazo</th><th>Último día {ANIO}</th></tr>{fechas}</table>
<p class="fuentes">Si el último día cae en fin de semana, pasa al lunes. Si domicilias el pago, el plazo acaba antes: el día 15 (el 25 de enero en el 4T).</p>

<h2>4. Cuota de autónomos por tramos</h2>
<p>Desde 2023 la cuota depende del rendimiento neto. Escribe tu previsión del año en «Cuota autónomos»: el kit aplica la deducción del {A['deduccion_gastos_genericos_pct']} % por gastos genéricos, busca tu tramo y te da la cuota mínima (tipo {A['tipo_total_pct']} %). Si cotizas por una base más alta, cámbiala en la tabla mes a mes.</p>
<p>Al final del año, la hoja compara lo pagado con lo que corresponde a tus rendimientos reales: es la regularización que hará la Seguridad Social cuando reciba los datos de Hacienda.</p>

<h2>5. La renta y cuánto apartar</h2>
<p>«Renta {ANIO}» estima tu declaración con la escala estatal y la de tu comunidad, el mínimo personal y familiar y el 5 % de gastos de difícil justificación (máximo 2.000 €), y le resta las retenciones y los pagos del 130. El «Panel» te dice qué porcentaje de cada factura apartar para no llevarte sustos.</p>
<div class="caja aviso"><strong>Lo que no hace:</strong> no incluye otras rentas (una nómina, alquileres), deducciones autonómicas, planes de pensiones ni la declaración conjunta. Compara siempre con el borrador de Renta WEB.</div>

<h2>6. En Google Sheets o LibreOffice</h2>
<ul><li><strong>Google Sheets:</strong> Archivo → Importar → Subir → «Reemplazar hoja de cálculo». Las fórmulas y las listas desplegables funcionan igual.</li>
<li><strong>LibreOffice:</strong> ábrelo directamente. Si alguna cifra sale vacía, recalcula con Ctrl+Mayús+F9.</li></ul>

<h2>Fuentes</h2>
<ul class="fuentes"><li>Ley 37/1992 del IVA y modelo 303 (AEAT).</li><li>Ley 35/2006 del IRPF y Reglamento (RD 439/2007), arts. 30 y 110.</li>
<li>Real Decreto-ley 13/2022 (cotización por ingresos reales) y orden de cotización vigente.</li><li>Calendario del contribuyente {ANIO} (AEAT).</li></ul>
<p class="legal">Edición {ANIO} con parámetros a {F['actualizado']}.{prov} Si cambian, descarga la versión nueva desde el mismo enlace de tu compra. Herramienta de cálculo orientativa: no es asesoramiento fiscal ni sustituye a los programas de la AEAT. Contenido preparado con ayuda de inteligencia artificial y revisado con las fuentes oficiales citadas. Dudas: hola@numimates.com.</p>"""
    return html_pdf(E, 'Guía del Kit del autónomo 2027', cuerpo)


def main():
    demo = '--demo' in sys.argv
    out = SALIDA / ID
    guardar(construir(), out / 'kit-autonomo-2027.xlsx')
    escribir(out / 'fuente' / 'guia-kit-autonomo-2027.html', guia_html())
    if demo:
        guardar(construir(demo=True), out / 'demo' / 'kit-autonomo-2027-demo.xlsx')
    print('Kit del autónomo: listo en', out)


if __name__ == '__main__':
    main()
