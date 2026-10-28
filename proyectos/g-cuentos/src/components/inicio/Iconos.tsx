// Iconos de trazo para la portada (sin emojis). 24×24, currentColor.
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Icono = {
  ojo: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle {...P} cx="12" cy="12" r="3" /></svg>),
  sinFoto: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle {...P} cx="12" cy="13" r="3.5" /><path {...P} d="M3 3l18 18" /></svg>),
  idiomas: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 4-3 7-6 8" /><path {...P} d="M13 21l4-9 4 9M14.5 18h5" /></svg>),
  rayo: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>),
  camion: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M2 6h11v10H2zM13 10h4l3 3v3h-7" /><circle {...P} cx="6" cy="18" r="2" /><circle {...P} cx="17" cy="18" r="2" /></svg>),
  corazon: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>),
  nombre: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M4 20h4L19 9l-4-4L4 16z" /><path {...P} d="M13 7l4 4" /></svg>),
  casa: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M3 11 12 4l9 7M5 10v10h14V10" /><path {...P} d="M10 20v-5h4v5" /></svg>),
  pata: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><circle {...P} cx="7" cy="9" r="1.8" /><circle {...P} cx="11" cy="6" r="1.8" /><circle {...P} cx="15.5" cy="7" r="1.8" /><circle {...P} cx="18" cy="11" r="1.8" /><path {...P} d="M8 17c0-3 2-5 4.5-5S17 14 17 17c0 2-2 3-4.5 3S8 19 8 17Z" /></svg>),
  estrella: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>),
  luna: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>),
  pluma: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M20 4c-8 0-14 6-14 14l-2 2" /><path {...P} d="M20 4c0 7-5 12-12 12" /></svg>),
  escudo: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path {...P} d="m9 12 2 2 4-4" /></svg>),
  regalo: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden><path {...P} d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12" /><path {...P} d="M12 9S10 4 7.5 5 9 9 12 9Zm0 0s2-5 4.5-4S15 9 12 9Z" /></svg>),
};
