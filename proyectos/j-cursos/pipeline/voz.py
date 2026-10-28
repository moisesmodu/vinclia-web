#!/usr/bin/env python3
"""Narración de cada clase con Kokoro (Apache-2.0, local, 0 €) y subtítulos exactos (cada frase se sintetiza aparte, así
que sabemos cuándo empieza y acaba). Salida por clase en out/<curso>/<id>/: eNN.wav por escena y voz.json con tiempos.
Uso: python3 voz.py <curso> [id …]     Variables: KOKORO_DIR (modelo), VOZ (por defecto según curso), WORK."""
import json, os, re, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
WORK = os.environ.get('WORK', '/home/user/jwork'); OUT = os.environ.get('OUT', os.path.join(WORK, 'out'))
KD = os.environ.get('KOKORO_DIR', '/home/user/tts')
VOCES = {'c1': 'ef_dora', 'c2': 'em_alex', 'c3': 'em_alex', 'c4': 'ef_dora'}
SPEED = float(os.environ.get('SPEED', '0.92'))
SR = 24000
PAUSA_FRASE, PAUSA_ESCENA = 0.28, 0.7

# pronunciación: lo que la voz lee mal escrito tal cual
PRON = [
    (r'\bIA\b', 'i a'), (r'\bIAs\b', 'i as'), (r'\bRGPD\b', 'erre ge pe de'), (r'\bIVA\b', 'iva'), (r'\bIRPF\b', 'i erre pe efe'),
    (r'\bAEAT\b', 'a e a te'), (r'\bLOPDGDD\b', 'ley de protección de datos'), (r'\bLED\b', 'led'), (r'\bLEDs\b', 'leds'),
    (r'\bUSB\b', 'u ese be'), (r'micro:bit', 'micro bit'), (r'\bMakeCode\b', 'meik cod'), (r'\bMaqueen\b', 'maquín'),
    (r'\bScratchJr\b', 'scratch junior'), (r'\bScratch\b', 'scratch'), (r'\bVerifactu\b', 'veri factu'), (r'VERI\*FACTU', 'veri factu'),
    (r'\bChatGPT\b', 'chat ge pe te'), (r'\bGPT\b', 'ge pe te'), (r'\bGPTs\b', 'ge pe tes'), (r'\bPDF\b', 'pe de efe'), (r'\bQR\b', 'cu erre'),
    (r'\bWhatsApp\b', 'guasap'), (r'\bGoogle\b', 'gúgel'), (r'\bGemini\b', 'yémini'), (r'\bCopilot\b', 'copáilot'), (r'\bClaude\b', 'clod'),
    (r'\bZapier\b', 'zápier'), (r'\bn8n\b', 'ene ocho ene'), (r'\bCanva\b', 'canva'), (r'\bBizum\b', 'bísum'), (r'\bINCIBE\b', 'incibe'),
    (r'\bSEO\b', 'seo'), (r'\bpymes\b', 'pimes'), (r'\bPyme\b', 'pime'), (r'\bonline\b', 'online'), (r'\bemail\b', 'imeil'),
    (r'\bNumi Tech\b', 'numi tec'), (r'\bTech\b', 'tec'), (r'\bBit\b', 'bit'), (r'\bDFRobot\b', 'de efe robot'), (r'\bV2\b', 've dos'), (r'\bV5\b', 've cinco'),
    (r'\bPRIMM\b', 'primm'), (r'\bAMPA\b', 'ampa'), (r'\bTikTok\b', 'tiktok'), (r'\bYouTube\b', 'yutub'), (r'\bInstagram\b', 'instagram'),
    (r'\bWi-?Fi\b', 'uifi'), (r'\bwifi\b', 'uifi'), (r'\bapps?\b', lambda m: 'aps' if m.group(0).endswith('s') else 'ap'),
    (r'\b116 111\b', 'uno uno seis, uno uno uno'), (r'\b017\b', 'cero uno siete'), (r'\b112\b', 'uno uno dos'),
    (r'(\d+),(\d+) ?euros', r'\1 coma \2 euros'), (r'(\d+) ?€', r'\1 euros'), (r'(\d+) ?%', r'\1 por ciento'), (r'(\d+) ?cm\b', r'\1 centímetros'),
    (r'«|»|“|”|"', ''), (r'…', '.'), (r' — | – ', ', '), (r'\s+', ' '),
]
def pron(t):
    for a, b in PRON: t = re.sub(a, b, t)
    return t.strip()

def frases(t):
    t = re.sub(r'\s+', ' ', t.strip())
    parts = re.split(r'(?<=[.!?…])\s+(?=[¿¡A-ZÁÉÍÓÚÑ0-9«"])', t)
    out = []
    for p in parts:   # las frases muy largas, por comas (Kokoro pierde entonación pasadas ~40 palabras)
        if len(p.split()) > 38:
            cs = re.split(r'(?<=[,;:])\s+', p); cur = ''
            for c in cs:
                if cur and len((cur + ' ' + c).split()) > 30: out.append(cur); cur = c
                else: cur = (cur + ' ' + c).strip()
            if cur: out.append(cur)
        elif p: out.append(p)
    return out

def main():
    curso, only = sys.argv[1], set(sys.argv[2:])
    import onnxruntime as ort
    so = ort.SessionOptions(); so.intra_op_num_threads = int(os.environ.get('HILOS', '2')); so.inter_op_num_threads = 1
    k = Kokoro.from_session(ort.InferenceSession(os.path.join(KD, 'kokoro-v1.0.onnx'), so, providers=['CPUExecutionProvider']), os.path.join(KD, 'voices-v1.0.bin'))
    voz = os.environ.get('VOZ', VOCES[curso])
    gdir = os.environ.get('GUIONES', os.path.join(ROOT, 'guiones', curso))
    for f in sorted(os.listdir(gdir)):
        if not re.match(rf'{curso}-(\d+|promo)\.json$', f): continue
        G = json.load(open(os.path.join(gdir, f)))
        if only and G['id'] not in only: continue
        d = os.path.join(OUT, curso, G['id']); os.makedirs(d, exist_ok=True)
        meta = os.path.join(d, 'voz.json')
        if os.path.exists(meta) and json.load(open(meta)).get('voz') == voz and os.environ.get('FORCE') != '1': continue
        esc = []
        for i, e in enumerate(G['escenas']):
            chunks, subs, t = [], [], 0.0
            for fr in frases(e.get('narracion', '')):
                a, sr = k.create(pron(fr), voice=voz, speed=SPEED, lang='es')
                a = np.asarray(a, dtype=np.float32)
                subs.append({'ini': round(t, 3), 'fin': round(t + len(a) / SR, 3), 'texto': fr})
                chunks += [a, np.zeros(int(PAUSA_FRASE * SR), np.float32)]; t += len(a) / SR + PAUSA_FRASE
            chunks.append(np.zeros(int(PAUSA_ESCENA * SR), np.float32))
            audio = np.concatenate(chunks) if chunks else np.zeros(SR, np.float32)
            wav = os.path.join(d, f'e{i + 1:02d}.wav'); sf.write(wav, audio, SR)
            esc.append({'wav': wav, 'dur': round(len(audio) / SR, 3), 'subs': subs})
        json.dump({'voz': voz, 'motor': 'kokoro-v1.0', 'speed': SPEED, 'escenas': esc, 'dur': round(sum(x['dur'] for x in esc), 2)}, open(meta, 'w'), ensure_ascii=False, indent=1)
        print(G['id'], round(sum(x['dur'] for x in esc) / 60, 2), 'min', flush=True)

if __name__ == '__main__': main()
