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
  const { getNodes, getViewport } = useReactFlow();
  const generateUploadUrl = useMutation(api.screenshots.generateUploadUrl);
  const storeThumbnail = useMutation(api.screenshots.storeThumbnail);
  const inFlightRef = useRef(false);

  const captureAndUpload = useCallback(async () => {
    if (!boardId || inFlightRef.current) return;
    if (isOnCooldown(boardId)) return;

    const nodes = getNodes();
    if (nodes.length === 0) return;

    // Find the .react-flow viewport element
    const el = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!el) return;

    inFlightRef.current = true;
    setCooldown(boardId);

    try {
      // Save current viewport, then fit to show all nodes
      const viewport = getViewport();

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

      // Target dimensions for the screenshot
      const targetW = 1200;
      const targetH = 630;

      const scale = Math.min(
        (targetW - padding * 2) / contentW,
        (targetH - padding * 2) / contentH,
        1.5
      );

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // The viewport transform: translate then scale
      // To center content in the target: offsetX = targetW/2 - centerX*scale
      const captureViewport = {
        x: targetW / 2 - centerX * scale,
        y: targetH / 2 - centerY * scale,
        zoom: scale,
      };

      // Apply the capture viewport
      const rfInstance = document.querySelector(".react-flow") as HTMLElement;
      if (!rfInstance) return;

      // Temporarily hide UI overlays
      const overlays = rfInstance.querySelectorAll(
        ".react-flow__panel, .react-flow__minimap, .react-flow__controls, .react-flow__attribution"
      );
      const origDisplay: string[] = [];
      overlays.forEach((el, i) => {
        origDisplay[i] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = "none";
      });

      // Set transform on viewport element for capture
      const origTransform = el.style.transform;
      el.style.transform = `translate(${captureViewport.x}px, ${captureViewport.y}px) scale(${captureViewport.zoom})`;

      // Wait a frame for the transform to apply
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const dataUrl = await toPng(rfInstance, {
        width: targetW,
        height: targetH,
        canvasWidth: targetW,
        canvasHeight: targetH,
        pixelRatio: 1,
        filter: (node) => {
          // Filter out panels, minimap, controls etc
          if (node instanceof HTMLElement) {
            const cl = node.classList;
            if (
              cl?.contains("react-flow__panel") ||
              cl?.contains("react-flow__minimap") ||
              cl?.contains("react-flow__controls") ||
              cl?.contains("react-flow__attribution")
            ) {
              return false;
            }
          }
          return true;
        },
      });

      // Restore original viewport and overlays
      el.style.transform = origTransform;
      overlays.forEach((el, i) => {
        (el as HTMLElement).style.display = origDisplay[i];
      });

      // Restore viewport with a microtask to avoid visual flash
      // The ReactFlow component will reconcile on next render

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
      // Clear cooldown on failure so it can retry
      try {
        localStorage.removeItem(getCooldownKey(boardId));
      } catch {
        // ignore
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [boardId, getNodes, getViewport, generateUploadUrl, storeThumbnail]);

  return { captureAndUpload };
}
