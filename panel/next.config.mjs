/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin exportación estática: el panel de mando se renderiza en el servidor (runtime Node). La cartera y los
  // documentos siguen prerenderizados.
  trailingSlash: true,
  // Los documentos del plan viven un nivel por encima de esta carpeta.
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
  poweredByHeader: false,
  async redirects() {
    // El antiguo centro de control vive ahora en las secciones del panel de mando.
    return [
      { source: '/control', destination: '/', permanent: false },
      { source: '/control/usuarios/csv', destination: '/usuarios/csv/', permanent: false },
      { source: '/control/usuarios', destination: '/usuarios/', permanent: false },
      { source: '/control/pagos', destination: '/ventas/', permanent: false },
      { source: '/control/suscripciones', destination: '/suscripciones/', permanent: false },
      { source: '/control/visitas', destination: '/proyectos/', permanent: false },
    ];
  },
  async headers() {
    return [{ source: '/:ruta*', headers: [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
export default nextConfig;
