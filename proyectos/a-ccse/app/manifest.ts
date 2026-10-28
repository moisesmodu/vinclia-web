import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CCSE en tu idioma · por Nuevo en España',
    short_name: 'CCSE',
    description: 'Aprueba el examen de nacionalidad en tu idioma: las 300 preguntas oficiales del CCSE explicadas, simulacro y repaso.',
    start_url: '/?fuente=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBF5EC',
    theme_color: '#D9603B',
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
