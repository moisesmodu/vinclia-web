import { NextResponse } from 'next/server';
export const ok = (d: unknown, status = 200) => NextResponse.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
export const error = (codigo: string, status = 400) => ok({ error: codigo }, status);
export async function cuerpo<T = Record<string, unknown>>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
