/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "@prisma/client", "embedded-postgres"],
  images: { formats: ["image/avif", "image/webp"] },
  // Las fuentes se leen con fs al maquetar el PDF en las funciones de servidor.
  outputFileTracingIncludes: { "/api/**": ["./assets/fuentes/**"] },
};
export default nextConfig;
