"use client";

import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toPng } from "html-to-image";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function getCooldownKey(boardId: string) {
  return `dump-screenshot-${boardId}`;
}

function isOnCooldown(boardId: string): boolean {
  try {
    const last = localStorage.getItem(getCooldownKey(boardId));
    if (!last) return false;
    return Date.now() - parseInt(last, 10) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function setCooldown(boardId: string) {
  try {
    localStorage.setItem(getCooldownKey(boardId), String(Date.now()));
  } catch {
    // ignore
  }
}

export function useBoardScreenshot(boardId: Id<"boards"> | undefined) {
  const { getNodes } = useReactFlow();
  const generateUploadUrl = useMutation(api.screenshots.generateUploadUrl);
  const storeThumbnail = useMutation(api.screenshots.storeThumbnail);
  const inFlightRef = useRef(false);

  const captureAndUpload = useCallback(async () => {
    if (!boardId || inFlightRef.current) return;
    if (isOnCooldown(boardId)) return;

    const nodes = getNodes();
    if (nodes.length === 0) return;

    const rfElement = document.querySelector(".react-flow") as HTMLElement;
    if (!rfElement) return;

    inFlightRef.current = true;
    setCooldown(boardId);

    try {
      // Calculate bounding box of all nodes
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (const node of nodes) {
        const x = node.position.x;
        const y = node.position.y;
        const w = (node.measured?.width ?? node.width ?? 280) as number;
        const h = (node.measured?.height ?? node.height ?? 120) as number;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }

      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const padding = 40;
      const targetW = 1200;
      const targetH = 630;

      const scale = Math.min(
        (targetW - padding * 2) / contentW,
        (targetH - padding * 2) / contentH,
        1.5
      );

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const tx = targetW / 2 - centerX * scale;
      const ty = targetH / 2 - centerY * scale;

      // Clone the entire react-flow element into an offscreen container
      const offscreen = document.createElement("div");
      offscreen.style.cssText = `
        position: fixed;
        left: -9999px;
        top: -9999px;
        width: ${targetW}px;
        height: ${targetH}px;
        overflow: hidden;
        pointer-events: none;
        z-index: -1;
      `;
      document.body.appendChild(offscreen);

      const clone = rfElement.cloneNode(true) as HTMLElement;
      clone.style.width = `${targetW}px`;
      clone.style.height = `${targetH}px`;

      // Remove UI overlays from clone
      clone
        .querySelectorAll(
          ".react-flow__panel, .react-flow__minimap, .react-flow__controls, .react-flow__attribution, .react-flow__background"
        )
        .forEach((el) => el.remove());

      // Override the viewport transform on the clone to fit all nodes
      const viewportEl = clone.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (viewportEl) {
        viewportEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }

      // Copy the background style from the original
      const bgColor =
        rfElement.querySelector(".react-flow__renderer")?.parentElement?.style
          ?.backgroundColor ||
        rfElement.style.backgroundColor ||
        "#f9fafb";
      clone.style.backgroundColor = bgColor;

      // Re-add background pattern from the original
      const origBg = rfElement.querySelector(
        ".react-flow__background"
      ) as HTMLElement;
      if (origBg) {
        const bgClone = origBg.cloneNode(true) as HTMLElement;
        clone.appendChild(bgClone);
      }

      // Replace external images with placeholders to avoid CORS issues
      clone.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("http") || src.startsWith("//")) {
          // Replace with a colored placeholder
          const placeholder = document.createElement("div");
          placeholder.style.cssText = `
            width: ${img.width || 16}px;
            height: ${img.height || 16}px;
            background: #e5e7eb;
            border-radius: 3px;
            flex-shrink: 0;
          `;
          img.replaceWith(placeholder);
        }
      });

      offscreen.appendChild(clone);

      // Wait for the clone to render
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const dataUrl = await toPng(offscreen, {
        width: targetW,
        height: targetH,
        canvasWidth: targetW,
        canvasHeight: targetH,
        pixelRatio: 1,
      });

      // Clean up
      document.body.removeChild(offscreen);

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Upload to Convex
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { storageId } = (await uploadRes.json()) as {
        storageId: Id<"_storage">;
      };

      await storeThumbnail({ boardId, storageId });
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      try {
        localStorage.removeItem(getCooldownKey(boardId));
      } catch {
        // ignore
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [boardId, getNodes, generateUploadUrl, storeThumbnail]);

  return { captureAndUpload };
}
