/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El contenido de pago se lee del disco en el servidor: hay que incluirlo en la función de Vercel
  outputFileTracingIncludes: { '/api/banco': ['./content/i18n/**'], '/[locale]/preguntas/[id]': ['./content/i18n/es.json'] },
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/.well-known/assetlinks.json', headers: [{ key: 'Content-Type', value: 'application/json' }] },
    ];
  },
};
export default nextConfig;
