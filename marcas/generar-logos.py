#!/usr/bin/env python3
"""Genera marcas/logos/<clave>.svg (horizontal) y <clave>-icono.svg (cuadrado) a partir de marcas/tokens.json.
Uso: python3 marcas/generar-logos.py   (desde la raíz del repositorio)."""
import json, html, os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = json.load(open(os.path.join(raiz, 'marcas', 'tokens.json')))
F, P = t['familias'], t['proyectos']

def marca(fam, c, acento):
    p, o = c['primario'], c['oscuro']
    if fam == 'nuevo-en-espana':
        return f'<path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="{acento}"/><rect x="24" y="36" width="8" height="16" rx="2" fill="{o}"/>'
    if fam == 'examenes':
        punto = acento if acento != p else '#FFFFFF'
        return f'<rect x="6" y="6" width="44" height="44" rx="10" fill="{p}"/><circle cx="28" cy="28" r="8" fill="{punto}"/>'
    if fam == 'lunilla':  # Lunilla: luna creciente amarilla, mejilla rosa, bufanda del color del producto
        luna = c['acento']
        return (f'<path d="M34.2 5.9A23 23 0 1 0 41 47A21 21 0 0 1 34.2 5.9Z" fill="{luna}"/>'
                f'<circle cx="13.5" cy="24" r="2.4" fill="{o}"/><circle cx="10.5" cy="31" r="2.6" fill="#F7D6E0"/>'
                f'<path d="M13 35q4 3 8 0" stroke="{o}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
                f'<path d="M9 40q8 6 17 3" stroke="{acento}" stroke-width="5.5" fill="none" stroke-linecap="round"/>')
    if fam == 'claro':
        return f'<path d="M44 16a20 20 0 1 0 0 24" stroke="{acento}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="{o}"/>'
    if fam == 'nuvolet':
        return (f'<path d="M16 46a10 10 0 0 1-2-19.8A14 14 0 0 1 41 22a9 9 0 0 1 2 24z" fill="{acento}"/>'
                f'<circle cx="24" cy="33" r="2" fill="{o}"/><circle cx="36" cy="33" r="2" fill="{o}"/><path d="M25 39q5 4 10 0" stroke="{o}" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    if fam == 'numi-tech':
        return f'<rect x="6" y="6" width="44" height="44" rx="12" fill="{p}"/><path d="M18 38V18l20 20V18" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    raise SystemExit(f'familia sin marca: {fam}')

X = '<?xml version="1.0" encoding="UTF-8"?>\n'
os.makedirs(os.path.join(raiz, 'marcas', 'logos'), exist_ok=True)
for clave, pr in P.items():
    fam = F[pr['familia']]; c = fam['colores']; ac = pr.get('acento', c['primario'])
    nombre = html.escape(pr['marca']); sub = html.escape(pr.get('subtitulo') or '')
    fuente = fam['tipografia']['titulos']; ancho = max(260, 76 + len(pr['marca']) * 17)
    txt = f'<text x="68" y="{"30" if sub else "37"}" font-family="{fuente}, Avenir Next, Segoe UI, sans-serif" font-weight="700" font-size="28" fill="{c["texto"]}">{nombre}</text>'
    if sub:
        txt += f'<text x="68" y="48" font-family="{fam["tipografia"]["texto"]}, Segoe UI, sans-serif" font-size="12" fill="{c["texto"]}" opacity="0.7">{sub}</text>'
    m = marca(pr['familia'], c, ac)
    with open(os.path.join(raiz, 'marcas', 'logos', f'{clave}.svg'), 'w') as f:
        f.write(X + f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho} 56" width="{ancho}" height="56" role="img" aria-label="{nombre}">{m}{txt}</svg>\n')
    with open(os.path.join(raiz, 'marcas', 'logos', f'{clave}-icono.svg'), 'w') as f:
        f.write(X + f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="512" height="512"><rect width="56" height="56" rx="12" fill="{c["fondo"]}"/>{m}</svg>\n')
print(f'{len(P)} marcas generadas en marcas/logos/')
