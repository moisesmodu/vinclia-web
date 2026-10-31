// Adaptadors de model de llenguatge per al motor de contingut. Ordre: BSC (Salamandra / ALIA, endpoint compatible amb OpenAI:
// BSC_API_URL, p. ex. un vLLM propi o la inferència de Hugging Face) → Anthropic (claude-haiku-5-5 per volum). Sense cap clau, "modo sesión":
// la sessió de Claude Code escriu els ítems seguint motor/INSTRUCCIONS-GENERACIO.md i els valida amb comprobar.mjs i validar-lt.mjs.
export const proveidor = () => (process.env.BSC_API_URL ? 'bsc' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'sessio');

export async function completar(prompt, { maxTokens = 4000, json = true } = {}) {
  if (process.env.BSC_API_URL) {
    const r = await fetch(`${process.env.BSC_API_URL.replace(/\/$/, '')}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.BSC_API_KEY ? { Authorization: `Bearer ${process.env.BSC_API_KEY}` } : {}) }, body: JSON.stringify({ model: process.env.BSC_MODEL ?? 'BSC-LT/salamandra-7b-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: maxTokens, ...(json ? { response_format: { type: 'json_object' } } : {}) }) });
    if (!r.ok) throw new Error(`BSC ${r.status}`);
    const j = await r.json();
    return { text: j.choices[0].message.content, model: j.model ?? process.env.BSC_MODEL, tokensIn: j.usage?.prompt_tokens ?? 0, tokensOut: j.usage?.completion_tokens ?? 0 };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_MODEL_MOTOR ?? 'claude-haiku-5-5';
    const r = await c.messages.create({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] });
    return { text: r.content.filter((x) => x.type === 'text').map((x) => x.text).join(''), model, tokensIn: r.usage.input_tokens, tokensOut: r.usage.output_tokens };
  }
  throw new Error('Sense proveïdor: defineix BSC_API_URL o ANTHROPIC_API_KEY, o treballa en modo sesión (motor/INSTRUCCIONS-GENERACIO.md).');
}

export const extreureJson = (s) => JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
