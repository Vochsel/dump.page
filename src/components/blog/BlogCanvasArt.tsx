"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BlogPalette } from "@/lib/blog";

type BlogCanvasArtProps = {
  palette: BlogPalette;
  className?: string;
  seed?: number;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BlogCanvasArt({
  palette,
  className,
  seed = 0,
}: BlogCanvasArtProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let frameId = 0;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      const t = time * 0.00016 + seed * 0.13;

      context.clearRect(0, 0, width, height);

      const wash = context.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, palette.canvasBase);
      wash.addColorStop(0.5, hexToRgba(palette.page, 0.94));
      wash.addColorStop(1, "#ffffff");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "lighter";

      palette.colors.forEach((color, index) => {
        const radius = Math.max(width, height) * (0.22 + index * 0.035);
        const x =
          width * (0.14 + index * 0.21) +
          Math.sin(t * (1.1 + index * 0.17) + index) * width * 0.08;
        const y =
          height * (0.24 + (index % 2) * 0.3) +
          Math.cos(t * (0.85 + index * 0.19) + index * 1.7) * height * 0.1;
        const blob = context.createRadialGradient(x, y, 0, x, y, radius);
        blob.addColorStop(0, hexToRgba(color, 0.74));
        blob.addColorStop(0.45, hexToRgba(color, 0.24));
        blob.addColorStop(1, hexToRgba(color, 0));
        context.fillStyle = blob;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.restore();

      for (let index = 0; index < 3; index += 1) {
        context.beginPath();
        context.lineWidth = Math.max(1.5, width * 0.006);
        context.strokeStyle = hexToRgba(
          palette.colors[index],
          0.12 + index * 0.03
        );
        const startY = height * (0.18 + index * 0.24);
        context.moveTo(-width * 0.08, startY);
        context.bezierCurveTo(
          width * (0.28 + index * 0.08),
          startY + Math.sin(t + index) * height * 0.18,
          width * (0.58 + index * 0.03),
          startY - Math.cos(t * 1.1 + index) * height * 0.16,
          width * 1.06,
          startY + Math.sin(t * 1.4 + index) * height * 0.12
        );
        context.stroke();
      }

      context.strokeStyle = hexToRgba(palette.ink, 0.08);
      context.lineWidth = 1;
      for (let line = 1; line < 6; line += 1) {
        const x = (width / 6) * line;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let line = 1; line < 5; line += 1) {
        const y = (height / 5) * line;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.beginPath();
      context.strokeStyle = hexToRgba(palette.accent, 0.28);
      context.lineWidth = 1.5;
      context.ellipse(
        width * 0.68,
        height * 0.33,
        width * 0.22,
        height * 0.18,
        Math.sin(t) * 0.6,
        0,
        Math.PI * 2
      );
      context.stroke();

      context.beginPath();
      context.strokeStyle = hexToRgba("#ffffff", 0.4);
      context.lineWidth = 1;
      context.arc(
        width * 0.24,
        height * 0.7,
        Math.min(width, height) * 0.16,
        0.25,
        3.8
      );
      context.stroke();
    };

    const render = (time: number) => {
      draw(time);
      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    resize();
    draw(0);

    if (!prefersReducedMotion) {
      frameId = window.requestAnimationFrame(render);
    }

    const observer = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    observer.observe(frame);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [palette, seed]);

  return (
    <div
      ref={frameRef}
      className={cn("relative overflow-hidden rounded-[2rem]", className)}
      style={{
        backgroundColor: palette.panel,
        backgroundImage: [
          `radial-gradient(circle at 12% 18%, ${hexToRgba(
            palette.colors[0],
            0.12
          )}, transparent 32%)`,
          `radial-gradient(circle at 84% 14%, ${hexToRgba(
            palette.colors[1],
            0.14
          )}, transparent 28%)`,
          `linear-gradient(135deg, ${palette.canvasBase}, ${palette.panel})`,
        ].join(", "),
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(255,255,255,0.08), transparent 40%, rgba(255,255,255,0.16))",
        }}
      />
    </div>
  );
}
