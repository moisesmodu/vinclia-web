#!/usr/bin/env python3
"""Página privada de entrega (Artifact): por curso, la ficha para pegar en Udemy y, por sección, cada clase con su vídeo,
subtítulos, recursos y cuestionario. Los archivos pesados se suben al almacén de la página (assets); la página los casa
por su tamaño exacto en bytes (assets.list() no da nombres) y descarga una sección entera en un zip con JSZip.
Uso: python3 entrega.py [nombre] [curso …]   Salida: $WORK/entrega/<nombre>.html y <nombre>-subir.txt (archivos a subir, por lotes de 25)
(sin argumentos: entrega.html con todos los cursos; p. ej. «entrega-c2 c2» para la página aparte del curso 2)"""
import json, os, re, sys, glob, html as H

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
WORK = os.environ.get('WORK', '/home/user/jwork'); ENT = os.path.join(WORK, 'entrega')
CURSOS = ['c1', 'c2', 'c4', 'c3']
COLOR = {'c1': '#2F6BFF', 'c2': '#E2574C', 'c3': '#5B5BD6', 'c4': '#2E9E62'}

def size(p): return os.path.getsize(p) if os.path.exists(p) else None

def main():
    nombre = sys.argv[1] if len(sys.argv) > 1 else 'entrega'; cursos = sys.argv[2:] or CURSOS
    F = json.load(open(os.path.join(ROOT, 'udemy', 'fichas.json')))
    desc = open(os.path.join(ROOT, 'udemy', 'descripciones.md')).read().split('\n---\n')
    D = {c: re.sub(r'^\s*## .*\n', '', d.strip(), count=1).strip() for c, d in zip(['c1', 'c2', 'c3', 'c4'], desc[1:])}
    data, subir, sizes = [], [], {}
    def reg(path):
        s = size(path)
        if s is None: return None
        if s in sizes:   # mismo tamaño: el mismo PDF en dos cursos (si no lo es, avisa)
            if sizes[s] != path and open(sizes[s], 'rb').read() != open(path, 'rb').read(): print('AVISO: mismo tamaño y distinto contenido', path, sizes[s])
            return s
        sizes[s] = path; subir.append(path); return s
    for c in cursos:
        est = os.path.join(ROOT, 'udemy', f'{c}-estructura.json')
        if not os.path.exists(est): continue
        E = json.load(open(est)); cd = os.path.join(ENT, c)
        img = os.path.join(ENT, 'imagenes', f'{c}-curso.png'); promo = os.path.join(cd, '00 - Video promocional.mp4')
        rec = {}
        rj = os.path.join(cd, 'recursos', 'recursos.json')
        if os.path.exists(rj): rec = json.load(open(rj))
        cur = {'id': c, 'color': COLOR[c], 'ficha': F[c], 'descripcion': D[c], 'imagen': {'n': f'{c}-curso.png', 's': reg(img)},
               'promo': {'n': '00 - Video promocional.mp4', 's': reg(promo)}, 'secciones': [], 'minutos': 0}
        for S in E['secciones']:
            sec = {'n': S['n'], 't': S['titulo'], 'clases': [], 'quiz': S.get('cuestionario')}
            for L in S['clases']:
                mp4 = os.path.join(cd, L['video']); vtt = os.path.join(cd, L['subtitulos'])
                rs = [{'n': r, 's': reg(os.path.join(cd, 'recursos', r))} for r in rec.get(L['id'], L.get('recursos', []))]
                d = L.get('duracion') or 0; cur['minutos'] += d / 60
                sec['clases'].append({'n': L['n'], 't': L['titulo'], 'd': L['descripcion'], 'p': L['vistaPrevia'], 'v': L['video'], 's': reg(mp4),
                                      'dur': round(d), 'vtt': open(vtt).read() if os.path.exists(vtt) else None, 'vn': L['subtitulos'], 'r': rs})
            cur['secciones'].append(sec)
        cur['minutos'] = round(cur['minutos'])
        data.append(cur)
    tpl = open(os.path.join(HERE, 'entrega.tpl.html')).read()
    out = tpl.replace('/*DATA*/null', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
    open(os.path.join(ENT, nombre + '.html'), 'w').write(out)
    open(os.path.join(ENT, ('' if nombre == 'entrega' else nombre + '-') + 'subir.txt'), 'w').write('\n'.join(subir) + '\n')
    print(nombre + '.html', round(len(out) / 1024), 'KB ·', len(subir), 'archivos para el almacén ·', round(sum(size(p) for p in subir) / 2**20), 'MB')

if __name__ == '__main__': main()
