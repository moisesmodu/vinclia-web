/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Los JSON de contenido se leen del disco en build y en las rutas de API.
  outputFileTracingIncludes: { "/api/**": ["./content/**", "./config/**"] },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};
export default nextConfig;
