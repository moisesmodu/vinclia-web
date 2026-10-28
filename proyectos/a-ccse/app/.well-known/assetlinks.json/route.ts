/** Digital Asset Links para la TWA de Android: sin esto, la app muestra la barra de direcciones. */
export const dynamic = 'force-dynamic';
export function GET() {
  const huellas = (process.env.TWA_SHA256 || '').split(',').map((s) => s.trim()).filter(Boolean);
  const cuerpo = huellas.length
    ? [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: process.env.TWA_PACKAGE || 'es.nuevoenespana.ccse', sha256_cert_fingerprints: huellas } }]
    : [];
  return Response.json(cuerpo, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
