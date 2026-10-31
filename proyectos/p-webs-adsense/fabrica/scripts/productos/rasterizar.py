"""Imágenes de un producto para su página de venta: hojas del Excel de demostración y páginas del PDF.

    python3 scripts/productos/rasterizar.py <id>

Abre productos/<id>/demo/*.xlsx con LibreOffice (con el idioma del sitio, para que las cifras salgan con su formato),
lo exporta a PDF y rasteriza la primera página de cada hoja pedida en productos.json → «capturas». Hace lo mismo con
las páginas pedidas del PDF del producto. Deja PNG recortados en productos/<id>/capturas/ y un indice.json con su orden.
scripts/productos/generar.mjs los enmarca con Playwright y los convierte a WebP.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageChops

FABRICA = Path(__file__).resolve().parents[2]


def recortar(img: Image.Image, proporcion_max=0.68, margen=24) -> Image.Image:
    """Quita el blanco de alrededor y limita la altura (las hojas largas se cortan por abajo)."""
    fondo = Image.new(img.mode, img.size, (255, 255, 255))
    caja = ImageChops.difference(img, fondo).getbbox()
    if caja:
        x0, y0, x1, y1 = caja
        img = img.crop((max(0, x0 - margen), max(0, y0 - margen), min(img.width, x1 + margen), min(img.height, y1 + margen)))
    alto = int(img.width * proporcion_max)
    if img.height > alto:
        img = img.crop((0, 0, img.width, alto))
    return img


def main():
    pid = sys.argv[1]
    prod = next(p for p in json.loads((FABRICA / 'productos.json').read_text(encoding='utf-8'))['productos'] if p['id'] == pid)
    carpeta = FABRICA / 'productos' / pid
    demo = next((carpeta / 'demo').glob('*.xlsx'))
    pdf_prod = carpeta / next(a['archivo'] for a in prod['archivos'] if a['tipo'] == 'pdf')
    out = carpeta / 'capturas'
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    idioma = 'es_ES.UTF-8' if prod['moneda'] == 'eur' else 'en_US.UTF-8'
    tmp = Path(tempfile.mkdtemp(prefix='raster-'))
    try:
        env = {'LANG': idioma, 'LC_ALL': idioma, 'PATH': '/usr/bin:/bin:/usr/local/bin', 'HOME': str(tmp)}
        subprocess.run(['soffice', f'-env:UserInstallation=file://{tmp}/perfil', '--headless', '--convert-to', 'pdf', '--outdir', str(tmp), str(demo)],
                       check=True, capture_output=True, env=env, timeout=300)
        libro = pdfium.PdfDocument(str(tmp / (demo.stem + '.pdf')))
        paginas = [libro[i].get_textpage().get_text_range() for i in range(len(libro))]
        guia = pdfium.PdfDocument(str(pdf_prod))
        indice = []
        for k, c in enumerate(prod['capturas'], 1):
            if 'hoja' in c:
                i = next(i for i, t in enumerate(paginas) if f' · {c["hoja"]} · ' in t)
                img = libro[i].render(scale=2.2).to_pil().convert('RGB')
                img = recortar(img)
                nombre = f'{k}-hoja.png'
                tipo, archivo = 'hoja', demo.name.replace('-demo', '')
            else:
                img = guia[c['pdf'] - 1].render(scale=2).to_pil().convert('RGB')
                img = img.crop((0, 0, img.width, int(img.height * 0.62)))
                nombre = f'{k}-pdf.png'
                tipo, archivo = 'pdf', pdf_prod.name
            img.save(out / nombre)
            indice.append({'png': nombre, 'tipo': tipo, 'archivo': archivo, 'hoja': c.get('hoja'), 'pagina': c.get('pdf'), 'alt': c['alt'], 'ancho': img.width, 'alto': img.height})
        (out / 'indice.json').write_text(json.dumps(indice, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'{pid}: {len(indice)} imágenes en {out}')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
