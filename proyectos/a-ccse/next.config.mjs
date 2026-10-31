/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El contenido de pago se lee del disco en el servidor: hay que incluirlo en la función de Vercel
  outputFileTracingIncludes: { '/api/banco': ['./content/i18n/**'], '/[locale]/preguntas/[id]': ['./content/i18n/es.json'] },
  // El gancho /nuevo-en-espana apunta a la web real de N (tuspapeles.app) con utm para medir la venta cruzada.
  async redirects() {
    return [{ source: '/nuevo-en-espana', destination: 'https://tuspapeles.app/es/guias/nacionalidad?utm_source=a-ccse&utm_medium=cruzada&utm_campaign=enlace', permanent: true }];
  },
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/.well-known/assetlinks.json', headers: [{ key: 'Content-Type', value: 'application/json' }] },
    ];
  },
};
export default nextConfig;
