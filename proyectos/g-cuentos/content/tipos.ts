export interface PaginaSeo {
  slug: string;
  titulo: string; // <title>
  descripcion: string; // meta description
  h1: string;
  intro: string;
  secciones: { h2: string; parrafos: string[]; lista?: string[] }[];
  faq: [string, string][];
  coleccion?: "dormir" | "valores" | "hermanito" | "ciudad";
  alternativa?: string; // slug equivalente en el otro idioma
}

export interface DocumentoLegal {
  slug: "aviso-legal" | "privacidad" | "cookies" | "condiciones";
  titulo: string;
  secciones: { h2: string; parrafos: string[] }[];
}
