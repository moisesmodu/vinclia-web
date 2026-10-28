// Textos de interfaz comunes a todos los sitios. Un sitio puede sustituir cualquier texto con «ui» en su sitio.json
// (por ejemplo, el sitio de EE. UU. no cita el BOE). En avisoProvisional, {anio} se cambia por el año.
import { sitio } from './sitio';

const BASE = {
  es: {
    calculadora: 'Calculadora',
    calculadoras: 'Calculadoras',
    datos: 'Datos oficiales',
    anio: 'Año',
    provisional: 'provisional',
    sinJs: 'Activa JavaScript para recalcular. Debajo tienes un ejemplo con los valores por defecto.',
    compartir: 'Copiar enlace con estos datos',
    copiado: 'Enlace copiado',
    imprimir: 'Imprimir o guardar en PDF',
    actualizado: 'Actualizado el',
    por: 'Por',
    revisado: 'Parámetros revisados con el BOE y fuentes oficiales',
    fuentes: 'Fuentes oficiales',
    metodo: 'Método de cálculo',
    faq: 'Preguntas frecuentes',
    relacionadas: 'Otras calculadoras',
    inicio: 'Inicio',
    avisoProvisional: (a: number) => `Los parámetros de ${a} son provisionales: el SMI, las bases de cotización y algunas escalas aún no se han publicado en el BOE y se usan los vigentes, con los cambios ya aprobados para ${a}. Se actualizan en cuanto salgan.`,
    descargo: 'Resultado orientativo calculado con la normativa publicada. No sustituye el asesoramiento de un profesional ni la nómina o liquidación oficial.',
    idioma: 'Català',
    cambiarIdioma: 'Llegeix aquesta pàgina en català',
    legal: { aviso: 'Aviso legal', privacidad: 'Privacidad', cookies: 'Cookies', sobre: 'Quiénes somos y método', gestionar: 'Gestionar cookies' },
    verTabla: 'Ver la tabla completa',
    descargarCsv: 'Descargar CSV',
    citar: 'Cómo citar estos datos',
    usarCalc: 'Calcula tu caso',
    todas: 'Ver todas',
    menu: 'Menú',
    saltar: 'Saltar al contenido',
    anuncio: 'Publicidad',
  },
  ca: {
    calculadora: 'Calculadora',
    calculadoras: 'Calculadores',
    datos: 'Dades oficials',
    anio: 'Any',
    provisional: 'provisional',
    sinJs: 'Activa JavaScript per recalcular. A sota tens un exemple amb els valors per defecte.',
    compartir: 'Copia l’enllaç amb aquestes dades',
    copiado: 'Enllaç copiat',
    imprimir: 'Imprimeix o desa en PDF',
    actualizado: 'Actualitzat el',
    por: 'Per',
    revisado: 'Paràmetres revisats amb el BOE i fonts oficials',
    fuentes: 'Fonts oficials',
    metodo: 'Mètode de càlcul',
    faq: 'Preguntes freqüents',
    relacionadas: 'Altres calculadores',
    inicio: 'Inici',
    avisoProvisional: (a: number) => `Els paràmetres de ${a} són provisionals: el SMI, les bases de cotització i algunes escales encara no s’han publicat al BOE i s’utilitzen els vigents, amb els canvis ja aprovats per a ${a}. S’actualitzen tan bon punt surtin.`,
    descargo: 'Resultat orientatiu calculat amb la normativa publicada. No substitueix l’assessorament d’un professional ni la nòmina o liquidació oficial.',
    idioma: 'Castellano',
    cambiarIdioma: 'Lee esta página en castellano',
    legal: { aviso: 'Avís legal', privacidad: 'Privacitat', cookies: 'Galetes', sobre: 'Qui som i mètode', gestionar: 'Gestiona les galetes' },
    verTabla: 'Mostra la taula completa',
    descargarCsv: 'Descarrega el CSV',
    citar: 'Com citar aquestes dades',
    usarCalc: 'Calcula el teu cas',
    todas: 'Mostra-les totes',
    menu: 'Menú',
    saltar: 'Vés al contingut',
    anuncio: 'Publicitat',
  },
};

type Textos = typeof BASE.es;
function mezclar(lang: 'es' | 'ca'): Textos {
  const o = (sitio.ui?.[lang] ?? {}) as Record<string, any>;
  const r: any = { ...BASE[lang], ...o, legal: { ...BASE[lang].legal, ...(o.legal ?? {}) } };
  if (typeof o.avisoProvisional === 'string') r.avisoProvisional = (a: number) => o.avisoProvisional.replaceAll('{anio}', String(a));
  return r;
}
export const UI: Record<'es' | 'ca', Textos> = { es: mezclar('es'), ca: mezclar('ca') };
