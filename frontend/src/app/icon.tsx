import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#1d47f5,#0c184a)",
          borderRadius: 14,
          color: "white",
          fontSize: 36,
          fontWeight: 800,
          fontFamily: "Inter, system-ui",
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}