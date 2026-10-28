'use client';
import type { Idioma, LecturaOral, So } from '@/lib/tipos';
import { useEstat } from '@/lib/estat';
import Oral from './Oral';
export default function OralPagina({ idioma, lectures, sons }: { idioma: Idioma; lectures: LecturaOral[]; sons: So[] }) {
  const [estat] = useEstat();
  if (!estat) return null;
  return <Oral idioma={idioma} lectures={lectures} sons={sons} nivell={estat.perfil?.nivell ?? 'C1'} />;
}
