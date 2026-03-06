import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dump — collaborative context boards for teams and AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Dot grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.3,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://dump.magpai.app/dump.png"
              alt=""
              width={120}
              height={120}
            />
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              Dump
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Your team&apos;s context dump
            </span>
            <span
              style={{
                fontSize: 22,
                color: "#6b7280",
                maxWidth: 600,
                textAlign: "center",
              }}
            >
              Dump links, notes &amp; ideas — make them useful for humans and AI.
            </span>
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            {["Drop links & notes", "Share with your team", "AI-readable boards"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    background: "white",
                    border: "2px solid #d1d5db",
                    borderRadius: "9999px",
                    padding: "10px 24px",
                    fontSize: 18,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
