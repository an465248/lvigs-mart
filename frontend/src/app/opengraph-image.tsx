import { ImageResponse } from "next/og";

export const alt = "LVIGS Mart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraph() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#1d47f5 0%, #0c184a 70%, #f76300 130%)",
          color: "white",
          padding: 80,
          fontFamily: "Inter, system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "rgba(255,255,255,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-1px" }}>LVIGS Mart</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>India's trusted marketplace</div>
          <div style={{ fontSize: 28, opacity: 0.85 }}>Mobiles · Electronics · Fashion · Grocery · More</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ padding: "10px 18px", borderRadius: 999, background: "#f76300", fontWeight: 700 }}>Free delivery</div>
          <div style={{ padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,.18)", fontWeight: 700 }}>Easy returns</div>
          <div style={{ padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,.18)", fontWeight: 700 }}>Secure payments</div>
        </div>
      </div>
    ),
    { ...size }
  );
}