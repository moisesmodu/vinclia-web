const dev = process.env.NODE_ENV !== 'production';

/** Origen públic de LanguageTool (només si és https i no és local): el client no hi crida avui, però s'admet per si s'activa la correcció al navegador. */
function origenLT() {
  try { const u = new URL(process.env.LANGUAGETOOL_URL ?? ''); return u.protocol === 'https:' && !/localhost|127\.0\.0\.1/.test(u.hostname) ? u.origin : null; } catch { return null; }
}

/** Content-Security-Policy. Next 15 injecta scripts inline (hidratació, RSC) i no hi ha middleware a totes les rutes per repartir un nonce
 *  sense perdre les pàgines estàtiques, així que script-src porta 'unsafe-inline' (i 'unsafe-eval' només en desenvolupament, per a HMR).
 *  Stripe Checkout és una redirecció, no un iframe: frame-src només per si s'incrusta en el futur. */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `connect-src 'self' https://api.stripe.com https://*.vercel-insights.com${origenLT() ? ` ${origenLT()}` : ''}${dev ? ' ws: wss:' : ''}`,
  'frame-src https://js.stripe.com https://checkout.stripe.com',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};
export default nextConfig;
