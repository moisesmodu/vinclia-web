#!/usr/bin/env python3
"""Estructura de subida a Udemy de un curso: udemy/<curso>-CURRICULO.md (lo que se pega o se sube, en orden) y
udemy/<curso>-estructura.json. Lee el temario, los guiones, los cuestionarios, la ficha y la lista de recursos.
Uso: python3 udemy.py <curso>"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
ENT = os.environ.get('ENTREGA', '/home/user/jwork/entrega')

def dur(f):
    try: return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).strip())
    except Exception: return None

def main():
    c = sys.argv[1]
    C = json.load(open(os.path.join(ROOT, 'cursos', c + '.json')))
    F = json.load(open(os.path.join(ROOT, 'udemy', 'fichas.json')))[c]
    gdir = os.path.join(ROOT, 'guiones', c)
    rec = {}
    rf = os.path.join(ENT, c, 'recursos', 'recursos.json')
    if os.path.exists(rf): rec = json.load(open(rf))
    est = {'curso': c, 'ficha': F, 'secciones': []}; n = 0; total = 0.0
    md = [f"# {F['titulo']} · estructura para Udemy", '',
          f"> Generado por `pipeline/udemy.py`. Archivos de vídeo, subtítulos y recursos: carpeta `{c}/` de la entrega (enlace en PARA-MOISES.md).",
          '> Orden de subida: crea las secciones con estos títulos, sube los vídeos con el **cargador masivo** (cada archivo se',
          '> convierte en una clase con el nombre del archivo; renómbrala con el título de abajo si Udemy recorta), marca las',
          '> vistas previas, adjunta recursos y subtítulos, y crea los cuestionarios al final de cada sección.', '']
    for si, s in enumerate(C['secciones'], 1):
        S = {'n': si, 'titulo': s['t'], 'clases': [], 'cuestionario': None}
        md += [f"## Sección {si}: {s['t']}", '']
        for l in s['l']:
            n += 1
            G = json.load(open(os.path.join(gdir, l['id'] + '.json')))
            titulo = G['titulo']; base = f"{n:02d} - {re.sub(r'[\\/:*?\"<>|]', '', titulo).strip()}"
            mp4 = os.path.join(ENT, c, base + '.mp4'); d = dur(mp4) if os.path.exists(mp4) else None
            if d: total += d
            R = rec.get(l['id'], [])
            S['clases'].append({'n': n, 'id': l['id'], 'titulo': titulo, 'descripcion': G.get('descripcion', ''), 'video': base + '.mp4',
                                'subtitulos': base + '.vtt', 'vistaPrevia': bool(G.get('vistaPrevia')), 'recursos': R, 'duracion': d})
            md += [f"### Clase {n}: {titulo}" + (' · **vista previa gratuita**' if G.get('vistaPrevia') else ''),
                   f"- Vídeo: `{base}.mp4`" + (f" ({int(d // 60)}:{int(d % 60):02d})" if d else ' (pendiente de montar)'),
                   f"- Subtítulos: `{base}.vtt` (idioma: español)",
                   f"- Descripción: {G.get('descripcion', '')}"]
            if R: md.append('- Recursos descargables: ' + ', '.join(f'`recursos/{x}`' for x in R))
            md.append('')
        qf = os.path.join(gdir, f'quiz-{si}.json')
        if os.path.exists(qf):
            Q = json.load(open(qf)); S['cuestionario'] = Q
            md += [f"### Cuestionario: {Q.get('titulo', 'Repaso de la sección')}", '']
            for qi, q in enumerate(Q['preguntas'], 1):
                md.append(f"{qi}. **{q['pregunta']}**")
                for ri, r in enumerate(q['respuestas']):
                    md.append(f"   - {'✅' if ri == q['correcta'] else '◻️'} {r}")
                md.append(f"   - Explicación (para la respuesta correcta): {q['explicacion']}")
            md.append('')
        est['secciones'].append(S)
    est['clases'] = n; est['duracionMin'] = round(total / 60, 1)
    head = ['', '## Ficha del curso (página de aterrizaje)', '', f"- **Título** ({len(F['titulo'])}/60): {F['titulo']}",
            f"- **Subtítulo** ({len(F['subtitulo'])}/120): {F['subtitulo']}", f"- **Idioma:** {F['idioma']} · **Nivel:** {F['nivel']} · **Categoría:** {F['categoria']}",
            f"- **Tema principal:** {F['temaPrincipal']} · **Precio:** {F['precioLista']}", f"- **Imagen del curso:** `imagenes/{c}-curso.png` (1500×844, sin texto)",
            f"- **Vídeo promocional:** `{c}/00 - Video promocional.mp4`", '- **Descripción:** la de `udemy/descripciones.md`', '',
            '**Qué aprenderán los estudiantes:**', *[f'- {o}' for o in F['objetivos']], '', '**Requisitos:**', *[f'- {o}' for o in F['requisitos']], '',
            '**A quién va dirigido:**', *[f'- {o}' for o in F['publico']], '', f"**Palabras clave (para el título, la descripción y los vídeos cortos):** {', '.join(F['palabrasClave'])}", '',
            f"**Total:** {n} clases" + (f", {est['duracionMin']} minutos de vídeo montado" if total else ''), '']
    md[6:6] = head
    open(os.path.join(ROOT, 'udemy', f'{c}-CURRICULO.md'), 'w').write('\n'.join(md) + '\n')
    json.dump(est, open(os.path.join(ROOT, 'udemy', f'{c}-estructura.json'), 'w'), ensure_ascii=False, indent=1)
    print(c, n, 'clases', est['duracionMin'], 'min')

if __name__ == '__main__': main()
