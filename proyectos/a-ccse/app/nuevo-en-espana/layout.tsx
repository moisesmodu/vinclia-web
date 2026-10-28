import '../globals.css';
export const metadata = { title: 'Nuevo en España · Próximamente', robots: { index: false } };
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="min-h-dvh">{children}</body></html>;
}
