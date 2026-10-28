import type { MetadataRoute } from 'next';
import marca from '@/config/marca.json';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${marca.nombre} · Oposicions de Catalunya`,
    short_name: marca.nombre,
    description: marca.lema.ca,
    start_url: '/ca',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F6FB',
    theme_color: marca.color,
    lang: 'ca',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
