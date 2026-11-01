'use client';
import { useEffect } from 'react';
import { guardarAtribucionDesdeUrl } from '@/lib/atribucion';

/** Al cargar cualquier página, guarda gclid y utm_* de la URL (30 días, almacenamiento local). No pinta nada. */
export default function Atribucion() {
  useEffect(() => { guardarAtribucionDesdeUrl(window.location.search); }, []);
  return null;
}
