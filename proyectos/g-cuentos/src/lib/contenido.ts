import { LEGAL_CA } from "../../content/ca-ES/legal";
import { SEO_CA } from "../../content/ca-ES/seo";
import { LEGAL_ES } from "../../content/es-ES/legal";
import { SEO_ES } from "../../content/es-ES/seo";
import type { Idioma } from "./catalogo";
import { configPais } from "./config";

export const seo = (i: Idioma) => (i === "ca" ? SEO_CA : SEO_ES);
export const rutaSeo = (i: Idioma) => (i === "ca" ? "/ca/contes" : "/cuentos");
export const legal = (i: Idioma) => (i === "ca" ? LEGAL_CA : LEGAL_ES);

export function sustituirLegal(s: string) {
  const l = configPais().legal;
  return s.replaceAll("{TITULAR}", l.titular).replaceAll("{NIF}", l.nif).replaceAll("{DOMICILIO}", l.domicilio).replaceAll("{EMAIL}", l.email);
}
