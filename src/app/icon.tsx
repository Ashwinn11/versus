import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * The favicon: the same rotated VS mark the header uses.
 *
 * Generated rather than a checked-in .ico so it can't drift from the brand,
 * and drawn with real geometry so it stays legible at 16px where a scaled-down
 * logo would turn to mush.
 */
export default function Icon() {
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
          fontSize: 15,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 7,
          letterSpacing: -0.5,
        }}
      >
        VS
      </div>
    ),
    size,
  );
}
