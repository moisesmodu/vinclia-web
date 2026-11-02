import { ImageResponse } from "next/og";

// Imagen para compartir en WhatsApp, Telegram y redes (1200×630). Solo texto latino: la fuente por defecto de
// next/og no cubre árabe ni chino, así que los nombres de los trámites van como se dicen en España en todos los idiomas.
export const alt = "Tus Papeles · tuspapeles.app";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagen() {
  const tramites = ["Padrón", "NIE", "TIE", "Residencia", "Seguridad Social", "Nacionalidad"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FBF5EC", padding: 72, color: "#1F2A44" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="112" height="112" viewBox="0 0 56 56">
            <path d="M8 52V28a20 20 0 0 1 40 0v24h-10V28a10 10 0 0 0-20 0v24z" fill="#D9603B" />
            <rect x="24" y="36" width="8" height="16" rx="2" fill="#1F2A44" />
          </svg>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -3 }}>
            <span>Tus&nbsp;</span><span style={{ color: "#D9603B" }}>Papeles</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {tramites.map((t) => (
            <div key={t} style={{ display: "flex", fontSize: 34, padding: "10px 22px", borderRadius: 12, background: "#fff", border: "2px solid #eadfce" }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#5b6475" }}>
          <span>ES · AR · FR · EN · RO · ZH · UK</span>
          <span style={{ color: "#B9472A", fontWeight: 700 }}>tuspapeles.app</span>
        </div>
      </div>
    ),
    size
  );
}
