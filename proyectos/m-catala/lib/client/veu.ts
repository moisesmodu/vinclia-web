'use client';
/** Reproducció d'àudio en català: primer /api/tts (Google, Azure o Matxa si estan configurats; 204 si no); si no, la veu del navegador
 *  (SpeechSynthesis amb ca-ES), que és gratis i funciona sense connexió al mòbil.
 *  El servidor només sintetitza textos del banc: s'hi envia l'id del text o el sha256 del text exacte, mai el text. */
let actual: HTMLAudioElement | null = null;

export function hiHaVeuNavegador(): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  return speechSynthesis.getVoices().some((v) => /^ca/i.test(v.lang));
}

async function sha256(text: string): Promise<string | null> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

/** Reprodueix un àudio del servidor donada la URL de /api/tts; false si no n'hi ha (204/404/429). */
export async function reproduirServidor(url: string): Promise<boolean> {
  try {
    const r = await fetch(url);
    if (r.status !== 200) return false;
    const blob = await r.blob();
    const a = new Audio(URL.createObjectURL(blob));
    actual = a;
    await a.play();
    return true;
  } catch { return false; }
}

export async function parlar(text: string, veu: 'central' | 'nord-occidental' | 'home' | 'dona' = 'central', velocitat = 0.92, id?: string): Promise<'servidor' | 'navegador' | 'cap'> {
  aturar();
  const clau = id ? `id=${encodeURIComponent(id)}` : await sha256(text).then((h) => (h ? `h=${h}` : null));
  if (clau && (await reproduirServidor(`/api/tts?${clau}&veu=${veu}`))) return 'servidor';
  if (typeof speechSynthesis !== 'undefined') {
    const u = new SpeechSynthesisUtterance(text);
    const veus = speechSynthesis.getVoices();
    const cat = veus.find((v) => /^ca[-_]ES/i.test(v.lang) && /Montserrat|Jordi|Herena|Google/i.test(v.name)) ?? veus.find((v) => /^ca/i.test(v.lang));
    if (cat) u.voice = cat;
    u.lang = 'ca-ES'; u.rate = velocitat;
    speechSynthesis.speak(u);
    return cat ? 'navegador' : 'cap';
  }
  return 'cap';
}

export function aturar() {
  if (actual) { actual.pause(); actual = null; }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
