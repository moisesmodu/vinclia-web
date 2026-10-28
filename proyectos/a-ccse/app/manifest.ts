import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CCSE en tu idioma · Test nacionalidad española',
    short_name: 'CCSE',
    description: 'Las 300 preguntas oficiales del examen CCSE explicadas en tu idioma. Test, simulacro y repaso.',
    start_url: '/?fuente=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8f5',
    theme_color: '#b4232a',
    lang: 'es',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Simulacro', url: '/es/simulacro', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Repaso', url: '/es/repaso', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
