"use client";

import { useCallback, useRef, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toJpeg } from "html-to-image";

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

function inlineImages(container: HTMLElement) {
  container.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) return;

    try {
      const canvas = document.createElement("canvas");
      const w = img.naturalWidth || img.offsetWidth || 16;
      const h = img.naturalHeight || img.offsetHeight || 16;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      img.setAttribute("src", canvas.toDataURL("image/png"));
    } catch {
      // CORS blocked — soft gradient from URL hash
      const w = img.offsetWidth || 16;
      const h = img.offsetHeight || 16;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      let hash = 0;
      for (let i = 0; i < src.length; i++) hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `hsl(${hue}, 60%, 88%)`);
      grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 50%, 78%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      img.setAttribute("src", canvas.toDataURL("image/png"));
    }
  });
}

function replaceIframes(container: HTMLElement) {
  container.querySelectorAll("iframe").forEach((iframe) => {
    const src = iframe.getAttribute("src") || "";
    const w = iframe.offsetWidth || 280;
    const h = iframe.offsetHeight || 160;

    const placeholder = document.createElement("div");
    let hash = 0;
    for (let i = 0; i < src.length; i++) hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    placeholder.style.cssText = `
      width: ${w}px; height: ${h}px;
      background: linear-gradient(135deg, hsl(${hue}, 55%, 85%), hsl(${(hue + 40) % 360}, 45%, 75%));
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
    `;

    if (/youtube|vimeo|youtu\.be/i.test(src)) {
      const icon = document.createElement("div");
      icon.style.cssText = `width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;`;
      icon.innerHTML = `<div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 18px;border-color:transparent transparent transparent white;margin-left:3px;"></div>`;
      placeholder.appendChild(icon);
    }

    iframe.replaceWith(placeholder);
  });
}

export function useBoardScreenshot(boardId: Id<"boards"> | undefined) {
  const { getNodes } = useReactFlow();
  const generateUploadUrl = useMutation(api.screenshots.generateUploadUrl);
  const storeThumbnail = useMutation(api.screenshots.storeThumbnail);
  const inFlightRef = useRef(false);

  const captureAndUpload = useCallback(async (force = false) => {
    if (!boardId || inFlightRef.current) return;
    if (!force && isOnCooldown(boardId)) return;

    const nodes = getNodes();
    if (nodes.length === 0) return;

    const rfElement = document.querySelector(".react-flow") as HTMLElement;
    if (!rfElement) return;

    inFlightRef.current = true;
    setCooldown(boardId);

    try {
      // Calculate bounding box to determine fit-all viewport
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of nodes) {
        const w = (node.measured?.width ?? node.width ?? 280) as number;
        const h = (node.measured?.height ?? node.height ?? 120) as number;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + w);
        maxY = Math.max(maxY, node.position.y + h);
      }

      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const targetW = rfElement.offsetWidth;
      const targetH = rfElement.offsetHeight;
      const padding = 40;
      const scale = Math.min(
        (targetW - padding * 2) / contentW,
        (targetH - padding * 2) / contentH,
        1.5
      );
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const tx = targetW / 2 - centerX * scale;
      const ty = targetH / 2 - centerY * scale;

      // Clone into a hidden-but-rendered container (in viewport, behind everything)
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: fixed; left: 0; top: 0;
        width: ${targetW}px; height: ${targetH}px;
        z-index: -9999; opacity: 0;
        pointer-events: none; overflow: hidden;
      `;

      const clone = rfElement.cloneNode(true) as HTMLElement;
      clone.style.width = `${targetW}px`;
      clone.style.height = `${targetH}px`;

      // Remove UI overlays and toolbar
      clone.querySelectorAll(
        ".react-flow__panel, .react-flow__minimap, .react-flow__controls, .react-flow__attribution, [class*='absolute'][class*='bottom'], [class*='absolute'][class*='z-10']"
      ).forEach((el) => el.remove());

      // Set fit-all viewport on clone
      const viewportEl = clone.querySelector(".react-flow__viewport") as HTMLElement;
      if (viewportEl) {
        viewportEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Inline images and replace iframes on the clone (not live DOM)
      inlineImages(clone);
      replaceIframes(clone);

      // Wait for styles to compute
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // Make visible for capture (opacity 0 can cause blank renders)
      wrapper.style.opacity = "1";
      await new Promise((r) => requestAnimationFrame(r));

      const dataUrl = await toJpeg(wrapper, {
        quality: 0.85,
        pixelRatio: 1,
        width: targetW,
        height: targetH,
        skipFonts: true,
      });

      document.body.removeChild(wrapper);

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };
      await storeThumbnail({ boardId, storageId });
      console.log("Screenshot uploaded, storageId:", storageId);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      try { localStorage.removeItem(getCooldownKey(boardId)); } catch { /* */ }
      // Clean up wrapper if still in DOM
      document.querySelector("[style*='z-index: -9999']")?.remove();
    } finally {
      inFlightRef.current = false;
    }
  }, [boardId, getNodes, generateUploadUrl, storeThumbnail]);

  useEffect(() => {
    (window as any).captureScreenshot = (force?: boolean) => {
      console.log("Capturing board screenshot...");
      captureAndUpload(force ?? true);
    };
    return () => { delete (window as any).captureScreenshot; };
  }, [captureAndUpload]);

  return { captureAndUpload };
}
