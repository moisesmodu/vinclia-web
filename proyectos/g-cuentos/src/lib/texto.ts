import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { aficion, coleccion, companero, tema } from "./catalogo";
import { cuentoDePlantilla, type Cuento } from "./cuento";
import { quedanMarcadores, type DatosNino } from "./rellenar";

export const MODELO_TEXTO = "claude-sonnet-5-5";
const MAX_CHARS_PAGINA = 520; // lo que cabe en la página de texto con cuerpo 15 pt

const Salida = z.object({
  titulo: z.string(),
  paginas: z.array(z.string()).describe("Exactamente 12 páginas, en el mismo orden que la plantilla"),
});

const SISTEMA = `Eres el editor de una colección de cuentos infantiles ilustrados en castellano y catalán.
Recibes un cuento ya escrito a partir de una plantilla revisada y los datos de un niño o niña.
Tu trabajo es pulirlo y personalizarlo, no reescribirlo:
- Mantén la estructura de 12 páginas, el argumento y el mensaje final de cada página. Cada página va con una ilustración ya fijada: no cambies lo que ocurre en ella.
- Integra con naturalidad los detalles del niño (mascota, afición, ciudad, edad) donde encajen, sin forzarlos en todas las páginas.
- Adapta el vocabulario y la longitud a la edad: para 2-3 años, frases cortas y repetitivas; para 6-8, algo más de riqueza.
- Escribe en el idioma pedido con calidad literaria de álbum ilustrado: ritmo, sonoridad, nada de moralinas explícitas añadidas.
- En catalán, usa el article personal davant dels noms (en Pau, la Martina, l'Oriol) excepte en vocatius, i un català normatiu i natural.
- Nunca añadas datos que no te han dado (hermanos, nombres de padres, colegio). La familia, en neutro.
- Nada de marcas, personajes con derechos de autor ni contenido que asuste de verdad.
- Cada página: como máximo ${MAX_CHARS_PAGINA} caracteres.`;

function cliente(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ timeout: 90_000, maxRetries: 2 });
}

export function validarCuento(c: { titulo: string; paginas: string[] }, d: DatosNino): string | null {
  if (c.paginas.length !== 12) return `tiene ${c.paginas.length} páginas`;
  const nombre = d.nombre.trim().toLowerCase();
  if (!c.titulo.toLowerCase().includes(nombre)) return "el título no lleva el nombre";
  const conNombre = c.paginas.filter((p) => p.toLowerCase().includes(nombre)).length;
  if (conNombre < 7) return `el nombre solo aparece en ${conNombre} páginas`;
  for (const [i, p] of c.paginas.entries()) {
    if (quedanMarcadores(p)) return `marcadores en la página ${i + 1}`;
    if (p.length > MAX_CHARS_PAGINA) return `página ${i + 1} demasiado larga (${p.length})`;
    if (p.trim().length < 40) return `página ${i + 1} demasiado corta`;
  }
  return null;
}

/**
 * Genera el texto del cuento. Siempre devuelve un cuento válido: si no hay clave de API,
 * si el modelo se niega o si la salida no pasa la validación, se usa la plantilla rellenada.
 */
export async function generarTexto(d: DatosNino): Promise<{ cuento: Cuento; aviso?: string }> {
  const base = cuentoDePlantilla(d);
  const api = cliente();
  if (!api) return { cuento: base, aviso: "sin ANTHROPIC_API_KEY: texto de plantilla" };

  const col = coleccion(d.coleccion);
  const t = tema(d.coleccion, d.tema);
  const datos = {
    idioma: d.idioma === "ca" ? "catalán" : "castellano",
    nombre: d.nombre,
    edad: d.edad,
    protagonista: d.genero === "m" ? "niño" : "niña",
    ciudad: d.ciudad,
    companero: `${companero(d.companero).etiqueta.es} llamado ${d.mascota}${d.mascotaDescripcion ? ` (${d.mascotaDescripcion})` : ""}`,
    aficion: aficion(d.aficion).etiqueta.es,
    coleccion: col.nombre.es,
    tema: t.etiqueta.es,
    ...(d.bebe ? { hermanito: `${d.bebe} (${d.bebeGenero === "f" ? "niña" : "niño"})` } : {}),
  };

  try {
    const r = await api.messages.parse({
      model: MODELO_TEXTO,
      max_tokens: 8000,
      output_config: { effort: "medium", format: zodOutputFormat(Salida) },
      system: SISTEMA,
      messages: [
        {
          role: "user",
          content: `Datos:\n${JSON.stringify(datos, null, 2)}\n\nCuento de partida (título y 12 páginas):\n${JSON.stringify(
            { titulo: base.titulo, paginas: base.paginas },
            null,
            2,
          )}`,
        },
      ],
    });
    if (r.stop_reason === "refusal") return { cuento: base, aviso: "el modelo se negó: texto de plantilla" };
    const out = r.parsed_output;
    if (!out) return { cuento: base, aviso: "salida no interpretable: texto de plantilla" };
    const fallo = validarCuento(out, d);
    if (fallo) return { cuento: base, aviso: `validación: ${fallo}; texto de plantilla` };
    return { cuento: { ...base, titulo: out.titulo.trim(), paginas: out.paginas.map((p) => p.trim()), fuente: "ia" } };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { cuento: base, aviso: "límite de la API: texto de plantilla" };
    if (e instanceof Anthropic.APIError) return { cuento: base, aviso: `API ${e.status}: texto de plantilla` };
    return { cuento: base, aviso: `error: ${(e as Error).message}; texto de plantilla` };
  }
}
