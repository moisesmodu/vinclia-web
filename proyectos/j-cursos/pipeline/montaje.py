#!/usr/bin/env python3
"""Monta el vídeo de cada clase con ffmpeg a partir de visual.json (render.mjs) y voz.json (voz.py).
Escena con imágenes: cada imagen aparece en su momento (los puntos se van descubriendo mientras se explican).
Escena con demo: el vídeo del simulador; si la voz dura más, se congela el último fotograma; si dura menos, silencio.
Salida: entrega/<curso>/<NN> - <título>.mp4 (1080p, H.264, AAC estéreo 48 kHz, −16 LUFS) y .srt/.vtt al lado.
Uso: python3 montaje.py <curso> [id …]"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
WORK = os.environ.get('WORK', '/home/user/jwork'); OUT = os.environ.get('OUT', os.path.join(WORK, 'out'))
ENT = os.environ.get('ENTREGA', os.path.join(WORK, 'entrega'))
FF = ['ffmpeg', '-v', 'error', '-y']
VENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', '30']
AENC = ['-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2']

def run(a): subprocess.run(a, check=True)
def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).strip())

def segmento(v, a, adur, out):
    if v['k'] == 'img':
        fr = v['frames']; tmp = out + '.txt'; lines = []
        for i, f in enumerate(fr):
            ini = f['at'] * adur; fin = fr[i + 1]['at'] * adur if i + 1 < len(fr) else adur
            lines += [f"file '{f['png']}'", f'duration {max(0.04, fin - ini):.3f}']
        lines.append(f"file '{fr[-1]['png']}'"); open(tmp, 'w').write('\n'.join(lines) + '\n')
        run(FF + ['-f', 'concat', '-safe', '0', '-i', tmp, '-i', a, '-vf', 'scale=1920:1080,fps=30,format=yuv420p', '-tune', 'stillimage'] + VENC + AENC + ['-t', f'{adur:.3f}', out])
        os.remove(tmp); return adur
    vd = dur(v['file']); D = max(vd, adur)
    run(FF + ['-i', v['file'], '-i', a, '-filter_complex', f'[0:v]scale=1920:1080,fps=30,tpad=stop_mode=clone:stop_duration={max(0, D - vd) + 0.1:.3f}[v];[1:a]apad[a]',
              '-map', '[v]', '-map', '[a]'] + VENC + AENC + ['-t', f'{D:.3f}', out])
    return D

def ts(t, sep=','):
    h, r = divmod(t, 3600); m, s = divmod(r, 60); return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s % 1) * 1000)) % 1000:03d}'

def trocear(sub, maxc=84):
    """Subtítulos de 2 líneas como máximo (42 caracteres por línea): las frases largas se parten en trozos con su tiempo."""
    t = sub['texto'];
    if len(t) <= maxc: return [sub]
    ws = t.split(); parts, cur = [], ''
    for w in ws:
        if cur and len(cur) + 1 + len(w) > maxc: parts.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    parts.append(cur); tot = sum(len(p) for p in parts); out, t0 = [], sub['ini']
    for p in parts:
        d = (sub['fin'] - sub['ini']) * len(p) / tot; out.append({'ini': t0, 'fin': t0 + d, 'texto': p}); t0 += d
    return out

def lineas(t, n=42):
    if len(t) <= n: return t
    ws = t.split(); best = min(range(1, len(ws)), key=lambda i: abs(len(' '.join(ws[:i])) - len(' '.join(ws[i:]))))
    return ' '.join(ws[:best]) + '\n' + ' '.join(ws[best:])

def main():
    curso, only = sys.argv[1], set(sys.argv[2:])
    C = json.load(open(os.path.join(ROOT, 'cursos', curso + '.json')))
    todas = [(0, {'id': curso + '-promo'})] + [(None, l) for s in C['secciones'] for l in s['l']]
    n = -1
    for _, l in todas:
            n += 1; lid = l['id']
            if only and lid not in only: continue
            d = os.path.join(OUT, curso, lid)
            if not (os.path.exists(os.path.join(d, 'visual.json')) and os.path.exists(os.path.join(d, 'voz.json'))): print('falta', lid); continue
            G = json.load(open(os.path.join(os.environ.get('GUIONES', os.path.join(ROOT, 'guiones', curso)), lid + '.json')))
            vis = json.load(open(os.path.join(d, 'visual.json'))); voz = json.load(open(os.path.join(d, 'voz.json')))
            assert len(vis) == len(voz['escenas']) == len(G['escenas']), lid
            os.makedirs(os.path.join(ENT, curso), exist_ok=True)
            titulo = re.sub(r'[\\/:*?"<>|]', '', G['titulo']).strip()
            base = os.path.join(ENT, curso, f'{n:02d} - {titulo}' if n else '00 - Video promocional')
            segs, subs, t, tiempos = [], [], 0.0, []
            for i, (v, a) in enumerate(zip(vis, voz['escenas'])):
                seg = os.path.join(d, f'seg{i + 1:02d}.mp4'); D = segmento(v, a['wav'], a['dur'], seg); segs.append(seg)
                tiempos.append({'escena': i + 1, 'tipo': G['escenas'][i]['tipo'], 'ini': round(t, 3), 'fin': round(t + D, 3)})
                for sb in a['subs']:
                    for x in trocear(sb): subs.append({'ini': t + x['ini'], 'fin': t + x['fin'], 'texto': x['texto']})
                t += D
            lst = os.path.join(d, 'segs.txt'); open(lst, 'w').write(''.join(f"file '{x}'\n" for x in segs))
            raw = os.path.join(d, 'raw.mp4'); run(FF + ['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', raw])
            run(FF + ['-i', raw, '-c:v', 'copy', '-af', f'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.3,afade=t=out:st={max(0, t - 0.6):.2f}:d=0.6'] + AENC + ['-movflags', '+faststart', base + '.mp4'])
            with open(base + '.srt', 'w') as f:
                for k, x in enumerate(subs, 1): f.write(f"{k}\n{ts(x['ini'])} --> {ts(x['fin'])}\n{lineas(x['texto'])}\n\n")
            with open(base + '.vtt', 'w') as f:
                f.write('WEBVTT\n\n')
                for x in subs: f.write(f"{ts(x['ini'], '.')} --> {ts(x['fin'], '.')}\n{lineas(x['texto'])}\n\n")
            json.dump({'id': lid, 'escenas': tiempos}, open(os.path.join(d, 'tiempos.json'), 'w'), indent=1)
            for x in segs + [raw]: os.remove(x)
            print(lid, f'{t / 60:.2f} min', base + '.mp4', flush=True)

if __name__ == '__main__': main()
