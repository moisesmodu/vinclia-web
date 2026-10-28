import FormValidesa from '@/components/FormValidesa';
import { esIdioma } from '@/lib/i18n';
import { BANC } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const ca = idioma === 'ca';
  return <div className="contenedor max-w-2xl py-8"><h1>{ca ? 'Prova de validesa de la correcció' : 'Prueba de validez de la corrección'}</h1><p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-secundari">{ca ? '20 candidats reals al C1 escriuen la mateixa redacció; l\'app i un professor la corregeixen per separat amb la rúbrica oficial. Aprova no es llança si la nota de l\'app no coincideix amb la del professor en el 80 % dels casos dins d\'un criteri. Protocol complet a VALIDESA.md del projecte. No es guarda cap nom: només el codi.' : '20 candidatos reales al C1 escriben la misma redacción; la app y un profesor la corrigen por separado con la rúbrica oficial. Aprova no se lanza si la nota de la app no coincide con la del profesor en el 80 % de los casos dentro de un criterio. Protocolo completo en VALIDESA.md del proyecto. No se guarda ningún nombre: solo el código.'}</p><div className="mt-4"><FormValidesa idioma={idioma} tasques={Object.values(BANC.tasques).filter((x) => x.nivell === 'C1')} /></div></div>;
}
