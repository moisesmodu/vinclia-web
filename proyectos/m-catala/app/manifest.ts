import type { MetadataRoute } from 'next';
import marca from '@/config/marca.json';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${marca.nombre} · Certificats de català B1 a C2`,
    short_name: marca.nombre,
    description: marca.lema.ca,
    start_url: '/ca/avui',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: marca.colores.fondo,
    theme_color: marca.colores.fondo,
    lang: 'ca',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
