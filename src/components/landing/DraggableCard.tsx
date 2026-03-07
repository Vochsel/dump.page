"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";

export function DraggableCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
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

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
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
      className={className}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 50 : undefined,
        userSelect: dragging ? "none" : undefined,
        transition: dragging ? "none" : "box-shadow 0.2s",
      }}
    >
      {children}
    </div>
  );
}
