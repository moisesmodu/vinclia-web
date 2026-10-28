#!/usr/bin/env python3
"""Vídeos cortos verticales (1080×1920) a partir de las clases ya montadas: gancho arriba, la clase en el centro,
subtítulos grandes debajo y tarjeta final con el curso y el cupón. Elige solo el fragmento (1-3 escenas seguidas,
35-65 s) prefiriendo los tipos de escena de marketing/cortos.json.
Uso: python3 cortos.py [n …]   Salida: entrega/cortos/NN-<clase>.mp4 y marketing/cortos-elegidos.json"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
WORK = os.environ.get('WORK', '/home/user/jwork'); OUT = os.path.join(WORK, 'out'); ENT = os.environ.get('ENTREGA', os.path.join(WORK, 'entrega'))
FONTS = os.path.join(HERE, 'assets', 'fonts')
COLOR = {'c1': '#2F6BFF', 'c2': '#E2574C', 'c3': '#7C4DFF', 'c4': '#3CC47C'}
FF = ['ffmpeg', '-v', 'error', '-y']

def marco(curso, gancho, pie, png, final=False):
    """Fondo vertical con el gancho (o la tarjeta final) dibujado con la misma plantilla HTML que las diapositivas."""
    titulo = json.load(open(os.path.join(ROOT, 'udemy', 'fichas.json')))[curso]['titulo']
    html = f"""<html><head><meta charset=utf-8><style>@font-face{{font-family:L;src:url(file://{FONTS}/Lexend.ttf)}}
    body{{margin:0;width:1080px;height:1920px;font-family:L,sans-serif;background:linear-gradient(160deg,{COLOR[curso]},#121C48);color:#fff;position:relative;overflow:hidden}}
    body::before{{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.1) 3px,transparent 3.2px);background-size:44px 44px}}
    .g{{position:absolute;left:70px;right:70px;top:170px;font-size:{'84' if not final else '78'}px;line-height:1.08;font-weight:900;text-wrap:balance}}
    .p{{position:absolute;left:70px;right:70px;bottom:120px;font-size:40px;line-height:1.3;font-weight:600;color:#E4EAFF}}
    .p b{{display:inline-block;margin-top:18px;background:#FFC531;color:#3A2600;border-radius:18px;padding:12px 26px;font-weight:900}}</style></head>
    <body><div class=g>{gancho if not final else 'Curso completo en vídeo:<br>' + titulo}</div><div class=p>{pie}</div></body></html>"""
    f = png + '.html'; open(f, 'w').write(html)
    subprocess.run(['node', '-e', f"const{{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});await p.goto('file://{f}');await p.waitForTimeout(300);await p.screenshot({{path:'{png}'}});await b.close()}})()"], check=True)
    os.remove(f)

def elegir(G, T, prefiere):
    esc = G['escenas']; best = None
    for i in range(1, len(esc) - 1):
        for j in range(i, min(i + 3, len(esc) - 1)):
            d = T['escenas'][j]['fin'] - T['escenas'][i]['ini']
            if not 30 <= d <= 68: continue
            score = sum(3 for k in range(i, j + 1) if esc[k]['tipo'] in prefiere) - abs(d - 48) / 20
            if not best or score > best[0]: best = (score, i, j)
    if not best: best = (0, 1, 1)
    return best[1], best[2]

def ass(subs, t0, t1, f):
    def ts(t): h, r = divmod(max(0, t), 3600); m, s = divmod(r, 60); return f'{int(h)}:{int(m):02d}:{s:05.2f}'
    hdr = ('[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
           'Style: S,Lexend,64,&H00FFFFFF,&H00FFFFFF,&H00121C48,&H80000000,1,0,0,0,100,100,0,0,1,5,0,8,70,70,1260,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n')
    rows = []
    for s in subs:
        if s['fin'] <= t0 or s['ini'] >= t1: continue
        rows.append(f"Dialogue: 0,{ts(s['ini'] - t0)},{ts(min(s['fin'], t1) - t0)},S,,0,0,0,,{s['texto'].replace(chr(10), ' ')}")
    open(f, 'w').write(hdr + '\n'.join(rows) + '\n')

def srt(path):
    out = []
    for b in open(path).read().strip().split('\n\n'):
        l = b.split('\n'); a, z = l[1].split(' --> ')
        tt = lambda x: int(x[:2]) * 3600 + int(x[3:5]) * 60 + float(x[6:].replace(',', '.'))
        out.append({'ini': tt(a), 'fin': tt(z), 'texto': ' '.join(l[2:])})
    return out

def main():
    only = set(map(int, sys.argv[1:])); L = json.load(open(os.path.join(ROOT, 'marketing', 'cortos.json')))
    od = os.path.join(ENT, 'cortos'); os.makedirs(od, exist_ok=True); elegidos = []
    elf = os.path.join(ROOT, 'marketing', 'cortos-elegidos.json')
    if os.path.exists(elf): elegidos = [e for e in json.load(open(elf)) if e['n'] not in only]
    for c in L:
        if only and c['n'] not in only: continue
        cur = c['curso']; d = os.path.join(OUT, cur, c['clase']); tf = os.path.join(d, 'tiempos.json')
        G = json.load(open(os.path.join(ROOT, 'guiones', cur, c['clase'] + '.json')))
        C = json.load(open(os.path.join(ROOT, 'cursos', cur + '.json'))); ids = [l['id'] for s in C['secciones'] for l in s['l']]
        num = ids.index(c['clase']) + 1
        base = os.path.join(ENT, cur, f"{num:02d} - {re.sub(r'[\\/:*?\"<>|]', '', G['titulo']).strip()}")
        if not (os.path.exists(tf) and os.path.exists(base + '.mp4')): print('falta la clase montada', c['clase']); continue
        T = json.load(open(tf)); i, j = elegir(G, T, c['prefiere']); t0, t1 = T['escenas'][i]['ini'], T['escenas'][j]['fin']
        tmp = os.path.join(WORK, f"corto{c['n']}"); os.makedirs(tmp, exist_ok=True)
        pie = 'Busca el curso en Udemy' + (f"<br><b>Cupón {c['cupon']}</b>" if c['cupon'] != 'gratis' else '<br><b>Gratis</b>')
        marco(cur, c['gancho'], 'Numi · cursos para familias, profes y autónomos', os.path.join(tmp, 'm.png'))
        marco(cur, '', pie, os.path.join(tmp, 'fin.png'), final=True)
        ass(srt(base + '.srt'), t0, t1, os.path.join(tmp, 's.ass'))
        out = os.path.join(od, f"{c['n']:02d}-{c['clase']}.mp4"); D = t1 - t0
        subprocess.run(FF + ['-ss', f'{t0:.3f}', '-t', f'{D:.3f}', '-i', base + '.mp4', '-loop', '1', '-i', os.path.join(tmp, 'm.png'), '-loop', '1', '-t', '2.5', '-i', os.path.join(tmp, 'fin.png'),
                             '-filter_complex', f"[1:v]trim=duration={D:.3f},setpts=PTS-STARTPTS[bg];[0:v]scale=1080:608,setpts=PTS-STARTPTS[v];[bg][v]overlay=0:560,ass={tmp}/s.ass:fontsdir={FONTS},fps=30,format=yuv420p[a1];[2:v]fps=30,format=yuv420p[a2];[a1][a2]concat=n=2:v=1:a=0[vo];[0:a]asetpts=PTS-STARTPTS,apad=pad_dur=2.5,afade=t=out:st={D:.2f}:d=0.6[ao]",
                             '-map', '[vo]', '-map', '[ao]', '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-t', f'{D + 2.5:.3f}', '-movflags', '+faststart', out], check=True)
        elegidos.append({**c, 'escenas': [i + 1, j + 1], 'ini': round(t0, 2), 'fin': round(t1, 2), 'archivo': os.path.basename(out)})
        print(c['n'], c['clase'], f'escenas {i + 1}-{j + 1}', f'{D:.1f} s', out, flush=True)
    json.dump(sorted(elegidos, key=lambda e: e['n']), open(elf, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__': main()
