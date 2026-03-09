"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";

export function DraggableCard({
  children,
  className,
  style: externalStyle,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    started: boolean;
  } | null>(null);
  const wasDragRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      if ((e.target as HTMLElement).closest("button, input, textarea")) return;
      // Prevent browser native drag on links/images
      e.preventDefault();
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: offset.x,
        baseY: offset.y,
        started: false,
      };
    },
    [offset]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (!ds.started && Math.abs(dx) + Math.abs(dy) < 5) return;
      ds.started = true;
      setDragging(true);
      setOffset({ x: ds.baseX + dx, y: ds.baseY + dy });
    };
    const onMouseUp = () => {
      if (dragState.current?.started) {
        setDragging(false);
        wasDragRef.current = true;
      } else if (dragState.current && !dragState.current.started) {
        // Was a click, not a drag — trigger navigation for any link or onClick
        const el = ref.current;
        if (el) {
          const link = el.querySelector("a[href]") as HTMLAnchorElement | null;
          if (link) link.click();
          else if (onClickRef.current) onClickRef.current();
        }
      }
      dragState.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onDragStart={(e) => e.preventDefault()}
      className={className}
      style={{
        ...externalStyle,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 50 : externalStyle?.zIndex,
        userSelect: dragging ? "none" : undefined,
        transition: dragging ? "none" : "box-shadow 0.2s",
      }}
    >
      {children}
    </div>
  );
}
