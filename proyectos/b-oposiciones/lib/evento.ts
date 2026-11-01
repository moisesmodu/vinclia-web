import { track } from '@vercel/analytics';

/**
 * Eventos del embudo para Vercel Web Analytics (test gratis → oferta → registro → Checkout).
 * Nombres fijos para comparar semanas: test_inicio, test_fin, oferta_clic, plan_clic, registro_ok, checkout_ir.
 * Los eventos personalizados solo se guardan en planes de Vercel que los incluyen; si no, la llamada no hace nada.
 */
export function evento(nombre: string, datos?: Record<string, string | number | boolean | null>) {
  try { track(nombre, datos); } catch {}
}
