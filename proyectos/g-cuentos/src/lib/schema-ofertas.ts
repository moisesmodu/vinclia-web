// Ofertas schema.org (Product.offers) para las fichas de comerciante de Google.
// Todo sale de la configuración del país y de las condiciones de venta publicadas (content/*/legal.ts):
// - Tapa dura: envío incluido a España peninsular y Baleares (no a Canarias, Ceuta ni Melilla),
//   5 a 7 días laborables en total.
// - PDF: entrega digital por correo en menos de 2 horas → envío 0 € y 0 días.
// - Devoluciones: producto personalizado, sin derecho de desistimiento (art. 103.c y 103.m TRLGDCU).
//   La garantía (rehacer el cuento una vez, reimprimir si llega dañado) no es una devolución.
// No se añaden review ni aggregateRating hasta tener opiniones reales (AUDITORIA.md).
import type { Idioma } from "./catalogo";
import { configPais, URL_BASE } from "./config";

const DIAS_LABORABLES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => `https://schema.org/${d}`);
const dias = (min: number, max: number) => ({ "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" });

export function politicaDevolucion(idioma: Idioma) {
  const pais = configPais().pais;
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: pais,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${URL_BASE()}${idioma === "ca" ? "/ca" : ""}/legal/condiciones`,
  };
}

function envioTapaDura() {
  const c = configPais();
  const e = c.entregaTapaDura;
  const destino = { "@type": "DefinedRegion", addressCountry: c.pais };
  return [
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: c.moneda },
      shippingDestination: destino,
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        businessDays: { "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_LABORABLES },
        handlingTime: dias(e.fabricacionDias[0], e.fabricacionDias[1]),
        transitTime: dias(e.transitoDias[0], e.transitoDias[1]),
      },
    },
    {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: c.pais, postalCodePrefix: e.cpSinEnvio },
      doesNotShip: true,
    },
  ];
}

function envioDigital() {
  const c = configPais();
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: c.moneda },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: c.pais },
    deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: dias(0, 0), transitTime: dias(0, 0) },
  };
}

/** Ofertas del cuento (PDF y tapa dura) con envío y política de devolución. */
export function ofertasLd(idioma: Idioma, nombres: { pdf: string; tapaDura: string }, url?: string) {
  const c = configPais();
  const base = {
    "@type": "Offer",
    priceCurrency: c.moneda,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    ...(url ? { url } : {}),
    hasMerchantReturnPolicy: politicaDevolucion(idioma),
  };
  return [
    { ...base, name: nombres.pdf, price: (c.precios.pdf / 100).toFixed(2), shippingDetails: envioDigital() },
    { ...base, name: nombres.tapaDura, price: (c.precios.tapaDura / 100).toFixed(2), shippingDetails: envioTapaDura() },
  ];
}
