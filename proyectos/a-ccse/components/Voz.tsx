'use client';
const VOCES: Record<string, string> = { es: 'es-ES', ar: 'ar-SA', fr: 'fr-FR', en: 'en-GB', ro: 'ro-RO', zh: 'zh-CN', uk: 'uk-UA', ca: 'ca-ES' };

/** Lectura en voz alta con la voz del propio dispositivo (gratis, sin servidor). */
export function hablar(texto: string, lengua: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = VOCES[lengua] ?? lengua;
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

export function BotonVoz({ texto, lengua, etiqueta }: { texto: string; lengua: string; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={() => hablar(texto, lengua)}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-suave hover:bg-black/5"
      aria-label={etiqueta}
      title={etiqueta}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
      </svg>
      <span>{etiqueta}</span>
    </button>
  );
}
