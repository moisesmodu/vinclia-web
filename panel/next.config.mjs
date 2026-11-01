/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin exportación estática: /control se renderiza en el servidor (runtime Node). El resto sigue prerenderizado.
  trailingSlash: true,
  // Los documentos del plan viven un nivel por encima de esta carpeta.
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
};
export default nextConfig;
