import pais from '@/config/paises/es.json';

/**
 * Correo de contacto, aviso legal y respuesta (SESIONES.md «Correo de contacto», DESPLIEGUES.md §6): hola@numimates.com hasta
 * tener dominio propio. LEGAL_EMAIL solo se usa si no es un buzón personal ni de Algorithmics: nunca se publica el correo
 * personal de Moisés aunque el secreto del entorno lo contenga.
 */
export function correoContacto(): string {
  const e = (process.env.LEGAL_EMAIL || '').trim();
  const personal = /@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|protonmail)\./i.test(e) || /algorithmics/i.test(e);
  return e && !personal && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : pais.correo;
}
