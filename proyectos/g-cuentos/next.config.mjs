/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "@prisma/client", "embedded-postgres"],
  images: { formats: ["image/avif", "image/webp"] },
};
export default nextConfig;
