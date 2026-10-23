import Link from 'next/link';
import { notFound } from 'next/navigation';
import { documentoHtml, documentos } from '@/lib/data';

export function generateStaticParams() {
  return Object.keys(documentos).map((slug) => ({ slug }));
}

export default async function Documento({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = documentoHtml(slug);
  if (!doc) notFound();
  return (
    <article className="doc">
      <p className="volver"><Link href="/">Panel</Link></p>
      <div className="md" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
