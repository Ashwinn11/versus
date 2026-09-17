import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon. iOS applies its own mask, so this stays a full bleed. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#2b2118",
          color: "#fdf8ef",
          fontSize: 84,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: -3,
        }}
      >
        VS
      </div>
    ),
    size,
  );
}
