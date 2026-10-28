#!/usr/bin/env python3
"""20 artículos SEO para la web de Numimates, uno por clase elegida: el guion de la clase pasa a artículo (subtítulos =
escenas, listas = puntos en pantalla) con título de búsqueda, descripción meta y llamada al curso con el cupón propio.
Uso: python3 seo.py   Salida: marketing/seo/<slug>.md"""
import json, os, re, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
ART = [  # (clase, título de búsqueda, consulta objetivo)
 ('c1-02', 'Por qué enseñar programación a niños de 6 a 11 años', 'programación para niños'),
 ('c1-04', 'Cómo ayudar a tu hijo a programar si tú no sabes programar', 'enseñar a programar a niños sin saber'),
 ('c1-06', 'Programación para niños por edades: por dónde empezar', 'programación niños por edades'),
 ('c1-07', 'Qué es un algoritmo explicado a niños, con juegos en casa', 'qué es un algoritmo para niños'),
 ('c1-09', 'Cómo enseñar a un niño a encontrar errores en su programa', 'depurar programas niños'),
 ('c1-11', 'Bucles para niños: cómo explicarlos sin pantalla', 'bucles para niños'),
 ('c1-19', 'Primeros pasos en Scratch con tu hijo: guía para padres', 'Scratch para padres'),
 ('c1-23', 'Cómo hacer un videojuego en Scratch con tu hijo', 'videojuego Scratch niños'),
 ('c1-25', 'Mi hijo se frustra al programar: qué hacer', 'niño se frustra programando'),
 ('c1-28', 'Edad mínima para cuentas y redes en España: guía para padres', 'edad mínima redes sociales España'),
 ('c2-03', 'Qué kit de robótica comprar para niños de 10 a 12 años', 'kit robótica niños micro:bit'),
 ('c2-04', 'Cómo pasar un programa de MakeCode al robot Maqueen', 'MakeCode Maqueen'),
 ('c2-14', 'Cómo hacer que un robot se pare antes de un obstáculo', 'sensor ultrasonidos micro:bit'),
 ('c2-17', 'Robot seguidor de línea con micro:bit: cómo funciona', 'seguidor de línea micro:bit'),
 ('c2-37', 'Cómo organizar una extraescolar de robótica', 'extraescolar de robótica'),
 ('c3-01', 'Cómo responder a una reseña negativa de Google con IA', 'responder reseña negativa Google'),
 ('c3-04', 'Cómo escribir instrucciones para ChatGPT en tu negocio', 'prompts ChatGPT negocio'),
 ('c3-20', 'Verifactu 2027 para autónomos: fechas y qué hacer', 'Verifactu autónomos 2027'),
 ('c3-23', 'Qué datos no meter en ChatGPT: guía RGPD para autónomos', 'ChatGPT RGPD autónomos'),
 ('c4-02', 'Contraseñas seguras para toda la familia: guía práctica', 'contraseñas seguras niños'),
]
CUPON = {'c1': 'NUMI-C1', 'c2': 'NUMI-C2', 'c3': 'NUMI-C3', 'c4': None}
def slug(t): t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower(); return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:70]
F = json.load(open(os.path.join(ROOT, 'udemy', 'fichas.json')))
od = os.path.join(ROOT, 'marketing', 'seo'); os.makedirs(od, exist_ok=True)
for cid, tit, q in ART:
    c = cid.split('-')[0]; G = json.load(open(os.path.join(ROOT, 'guiones', c, cid + '.json')))
    esc = G['escenas']; intro = esc[0]['narracion']
    meta = re.sub(r'\s+', ' ', (G.get('descripcion') or intro))[:155].rsplit(' ', 1)[0]
    body = [f'---\ntitle: "{tit}"\ndescription: "{meta}"\nslug: {slug(tit)}\nconsulta: "{q}"\ncurso: {c}\nclase: {cid}\n---', '', f'# {tit}', '', intro, '']
    for e in esc[1:-1]:
        if e['tipo'] in ('captura', 'demo'): body += [e['narracion'], '']; continue
        h = e.get('titulo') or ''
        if h: body += [f'## {h}', '']
        for k in ('puntos', 'pasos'):
            if e.get(k): body += [(f'{n + 1}. ' if k == 'pasos' else '- ') + x for n, x in enumerate(e[k])] + ['']
        if e['tipo'] == 'frase': body += [f"> {e.get('texto', '')}", '']
        if e['tipo'] == 'comparar': body += [f"- **Así no:** {e['mal']}", f"- **Mejor así:** {e['bien']}", '']
        if e['tipo'] == 'tabla': body += ['| ' + ' | '.join(e['columnas']) + ' |', '|' + '---|' * len(e['columnas'])] + ['| ' + ' | '.join(f) + ' |' for f in e['filas']] + ['']
        if e['tipo'] == 'chat': body += ['**Instrucción de ejemplo:**', '', f"> {e['usuario']}", '', '**Respuesta de ejemplo:**', '', f"> {e['ia']}", '']
        body += [e['narracion'], '']
    r = esc[-1]; body += ['## En resumen', ''] + [f'- {x}' for x in r.get('puntos', [])] + ['']
    cup = CUPON[c]
    body += ['---', '', f"Este artículo es una clase del curso en vídeo **{F[c]['titulo']}**." +
             (f" Con el cupón `{cup}` tienes el mejor precio: `https://www.udemy.com/course/[slug]/?couponCode={cup}`." if cup else ' Es gratuito en Udemy.'), '']
    open(os.path.join(od, slug(tit) + '.md'), 'w').write('\n'.join(body))
print(len(os.listdir(od)), 'artículos')
