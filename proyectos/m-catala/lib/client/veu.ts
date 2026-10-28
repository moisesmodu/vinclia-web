'use client';
/** Reproducció d'àudio en català: primer /api/tts (Google, Azure o Matxa si estan configurats; 204 si no); si no, la veu del navegador
 *  (SpeechSynthesis amb ca-ES), que és gratis i funciona sense connexió al mòbil. */
let actual: HTMLAudioElement | null = null;

export function hiHaVeuNavegador(): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  return speechSynthesis.getVoices().some((v) => /^ca/i.test(v.lang));
}

export async function parlar(text: string, veu: 'central' | 'nord-occidental' | 'home' | 'dona' = 'central', velocitat = 0.92): Promise<'servidor' | 'navegador' | 'cap'> {
  aturar();
  try {
    const r = await fetch(`/api/tts?text=${encodeURIComponent(text)}&veu=${veu}`);
    if (r.status === 200) {
      const blob = await r.blob();
      const a = new Audio(URL.createObjectURL(blob));
      actual = a;
      await a.play();
      return 'servidor';
    }
  } catch {}
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
