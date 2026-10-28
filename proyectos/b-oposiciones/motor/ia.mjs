// Cliente de IA del motor (modo API). Modelos según SESIONES.md: Haiku 5.5 para volumen (generar, traducir),
// Sonnet 5.5 cuando la calidad manda (temario desde el PDF y segunda pasada de verificación).
import Anthropic from '@anthropic-ai/sdk';

export const MODELO_VOLUMEN = process.env.MODELO_VOLUMEN || 'claude-haiku-5-5';
export const MODELO_CALIDAD = process.env.MODELO_CALIDAD || 'claude-sonnet-5-5';

let _c;
export const cliente = () => (_c ??= new Anthropic());

/** Llamada con salida JSON validada por esquema (structured outputs). Devuelve el objeto parseado. */
export async function json({ modelo, sistema, contenido, esquema, maxTokens = 16000, esfuerzo }) {
  const calidad = modelo.startsWith('claude-sonnet-5-5') || modelo.startsWith('claude-opus-5');
  const params = {
    model: modelo,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: contenido }],
    output_config: { format: { type: 'json_schema', schema: esquema }, ...(esfuerzo && { effort: esfuerzo }) },
  };
  // En los modelos con clasificadores de seguridad, si rechazan, el servidor reintenta con el modelo recomendado.
  const r = calidad
    ? await cliente().beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }).finalMessage()
    : await cliente().messages.stream(params).finalMessage();
  if (r.stop_reason === 'refusal') throw new Error(`Rechazo del modelo (${r.stop_details?.category ?? 'sin categoría'})`);
  if (r.stop_reason === 'max_tokens') throw new Error('Respuesta cortada por max_tokens');
  const texto = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { datos: JSON.parse(texto), uso: r.usage };
}

const TEXTO = { type: 'object', additionalProperties: false, required: ['enunciado', 'opciones', 'explicacion'],
  properties: { enunciado: { type: 'string' }, opciones: { type: 'array', items: { type: 'string' } }, explicacion: { type: 'string' } } };

export const ESQUEMA_PREGUNTAS = {
  type: 'object', additionalProperties: false, required: ['preguntas'],
  properties: {
    preguntas: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['dificultad', 'correcta', 'es', 'ca', 'articulo', 'cita'],
        properties: { dificultad: { type: 'integer', enum: [1, 2, 3] }, correcta: { type: 'integer', enum: [0, 1, 2, 3] }, es: TEXTO, ca: TEXTO, articulo: { type: 'string' }, cita: { type: 'string' } },
      },
    },
  },
};

export const ESQUEMA_REVISION = {
  type: 'object', additionalProperties: false, required: ['veredicto', 'correctaSegunFuente', 'nota'],
  properties: {
    veredicto: { type: 'string', enum: ['ok', 'rechazada'] },
    correctaSegunFuente: { type: 'integer', enum: [-1, 0, 1, 2, 3] },
    nota: { type: 'string' },
  },
};

export const ESQUEMA_TEMARIO = {
  type: 'object', additionalProperties: false, required: ['referencia', 'diario', 'fecha', 'plazas', 'examen', 'temas'],
  properties: {
    referencia: { type: 'string' }, diario: { type: 'string' }, fecha: { type: 'string' }, plazas: { type: 'integer' },
    examen: { type: 'object', additionalProperties: false, required: ['preguntas', 'reserva', 'opciones', 'minutos', 'penalizacion'],
      properties: { preguntas: { type: 'integer' }, reserva: { type: 'integer' }, opciones: { type: 'integer' }, minutos: { type: 'integer' }, penalizacion: { type: 'number' } } },
    temas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['n', 'titulo_ca', 'titulo_es', 'slug', 'normas'],
      properties: { n: { type: 'integer' }, titulo_ca: { type: 'string' }, titulo_es: { type: 'string' }, slug: { type: 'string' },
        normas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['norma', 'boeId', 'articulos'],
          properties: { norma: { type: 'string' }, boeId: { type: 'string' }, articulos: { type: 'string' } } } } } } },
  },
};
