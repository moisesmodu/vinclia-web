/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Los documentos del plan viven un nivel por encima de esta carpeta.
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
};
export default nextConfig;
