import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { marca, oposiciones, totalPreguntas } from '@/lib/datos';

export const alt = 'Oposita · tests d\'oposicions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen para compartir (Open Graph y X): marca, promesa y los datos reales del banco. Se genera en el build. */
export default async function Imagen({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const ca = lang !== 'es';
  let fuente: Buffer | null = null;
  try {
    fuente = await readFile(path.join(process.cwd(), 'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff'));
  } catch {}
  const ops = oposiciones().map((o) => o.nombreCorto[ca ? 'ca' : 'es']);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F6F6FB', padding: 72, fontFamily: fuente ? 'Space Grotesk' : 'sans-serif', color: '#14142B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="84" height="84" viewBox="6 6 44 44">
            <rect x="6" y="6" width="44" height="44" rx="11" fill="#3B3FD8" />
            <circle cx="28" cy="28" r="12" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
            <circle cx="28" cy="28" r="5" fill="#3DDC97" />
          </svg>
          <div style={{ fontSize: 60, letterSpacing: -1.5 }}>oposita</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{marca.lema[ca ? 'ca' : 'es']}</div>
          <div style={{ marginTop: 28, fontSize: 30, color: '#4A4A66' }}>{ops.join(' · ')}</div>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 28 }}>
          <div style={{ display: 'flex', background: '#3B3FD8', color: '#fff', borderRadius: 14, padding: '12px 22px' }}>
            {totalPreguntas().toLocaleString(ca ? 'ca-ES' : 'es-ES')} {ca ? 'preguntes amb l\'article de la llei' : 'preguntas con el artículo de la ley'}
          </div>
          <div style={{ display: 'flex', border: '2px solid #D5D6F3', borderRadius: 14, padding: '12px 22px' }}>{marca.dominio}</div>
        </div>
      </div>
    ),
    { ...size, fonts: fuente ? [{ name: 'Space Grotesk', data: fuente, weight: 700, style: 'normal' }] : [] },
  );
}
