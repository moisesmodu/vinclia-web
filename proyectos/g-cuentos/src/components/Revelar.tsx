"use client";

import { useEffect } from "react";

/** Revela con suavidad los elementos marcados con data-revelar al entrar en pantalla (una sola vez). */
export function Revelar() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-revelar]:not(.visible)"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("visible")); return; }
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
