#!/usr/bin/env python3
"""Comprueba los guiones: JSON válido, tipos de escena, longitudes y palabras por clase.
Uso: python3 check_guiones.py guiones/c1 [c1-01 c1-02 …]"""
import json, sys, os, re
TIPOS = {'portada', 'puntos', 'pasos', 'frase', 'comparar', 'tabla', 'chat', 'captura', 'demo', 'resumen'}
d = sys.argv[1]; only = set(sys.argv[2:])
bad = 0
for f in sorted(os.listdir(d)):
    if not f.endswith('.json'): continue
    p = os.path.join(d, f)
    try: g = json.load(open(p))
    except Exception as e: print('ERROR JSON', f, e); bad += 1; continue
    if f.startswith('quiz-'):
        for q in g.get('preguntas', []):
            if not (0 <= q['correcta'] < len(q['respuestas'])) or len(q['pregunta']) > 250: print('AVISO quiz', f, q['pregunta'][:50]); bad += 1
        continue
    if only and g.get('id') not in only: continue
    esc = g.get('escenas', []); w = sum(len(re.findall(r'\w+', e.get('narracion', ''))) for e in esc)
    probs = []
    if esc and esc[0].get('tipo') != 'portada': probs.append('no empieza por portada')
    if esc and esc[-1].get('tipo') != 'resumen': probs.append('no acaba en resumen')
    for i, e in enumerate(esc):
        if e.get('tipo') not in TIPOS: probs.append(f'tipo {e.get("tipo")}')
        if len(e.get('titulo', '')) > 60: probs.append(f'titulo largo esc {i+1}')
        for k in ('puntos', 'pasos'):
            for x in e.get(k, []):
                if len(x) > 80: probs.append(f'{k} largo esc {i+1}')
        if e.get('tipo') in ('captura', 'demo') and not re.match(r'^presenta:[a-z]\d-\d:\d+$', e.get('fuente', '')): probs.append(f'fuente {e.get("fuente")}')
        if re.search(r'[<>%×*#_]|https?://', e.get('narracion', '')): probs.append(f'símbolo en narración esc {i+1}')
    if not ((80 if g.get('id', '').endswith('promo') else 450) <= w <= 1250): probs.append(f'{w} palabras')
    print(f'{g.get("id")}: {w} palabras, {len(esc)} escenas' + (' · ' + '; '.join(probs) if probs else ''))
    bad += bool(probs)
sys.exit(1 if bad else 0)
