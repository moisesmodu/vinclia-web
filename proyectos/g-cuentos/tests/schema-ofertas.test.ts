import assert from "node:assert/strict";
import { test } from "node:test";
import { ofertasLd } from "../src/lib/schema-ofertas";

// Fichas de comerciante de Google: cada Offer lleva envío (con plazo) y política de devolución; sin reseñas inventadas.
for (const idioma of ["es", "ca"] as const)
  test(`ofertas schema.org (${idioma})`, () => {
    const ofertas = ofertasLd(idioma, { pdf: "PDF", tapaDura: "Tapa dura" }, "https://lunilla.cat/");
    assert.equal(ofertas.length, 2);
    for (const o of ofertas) {
      assert.equal(o["@type"], "Offer");
      assert.match(o.price, /^\d+\.\d{2}$/);
      const r = o.hasMerchantReturnPolicy;
      assert.equal(r["@type"], "MerchantReturnPolicy");
      assert.equal(r.applicableCountry, "ES");
      assert.equal(r.returnPolicyCategory, "https://schema.org/MerchantReturnNotPermitted");
      assert.ok(r.merchantReturnLink.endsWith("/legal/condiciones"));
      const envios = [o.shippingDetails].flat();
      const principal = envios[0] as { shippingRate: { value: number }; deliveryTime: { handlingTime: { minValue: number; maxValue: number; unitCode: string }; transitTime: { minValue: number; maxValue: number; unitCode: string } } };
      assert.equal(principal.shippingRate.value, 0);
      for (const t of [principal.deliveryTime.handlingTime, principal.deliveryTime.transitTime]) {
        assert.equal(t.unitCode, "DAY");
        assert.ok(t.minValue <= t.maxValue);
      }
      assert.ok(!("review" in o) && !("aggregateRating" in o));
    }
    const [pdf, tapa] = ofertas;
    assert.equal((pdf.shippingDetails as { deliveryTime: { transitTime: { maxValue: number } } }).deliveryTime.transitTime.maxValue, 0);
    const [envio, sinEnvio] = tapa.shippingDetails as unknown as [{ deliveryTime: { handlingTime: { minValue: number; maxValue: number }; transitTime: { minValue: number; maxValue: number } } }, { doesNotShip: boolean; shippingDestination: { postalCodePrefix: string[] } }];
    // Total publicado en condiciones de venta: 5 a 7 días laborables.
    assert.equal(envio.deliveryTime.handlingTime.minValue + envio.deliveryTime.transitTime.minValue, 5);
    assert.equal(envio.deliveryTime.handlingTime.maxValue + envio.deliveryTime.transitTime.maxValue, 7);
    assert.equal(sinEnvio.doesNotShip, true);
    assert.deepEqual(sinEnvio.shippingDestination.postalCodePrefix, ["35", "38", "51", "52"]);
  });
