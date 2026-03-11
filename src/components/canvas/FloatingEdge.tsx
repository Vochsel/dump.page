"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BaseEdge, EdgeProps, getBezierPath, useInternalNode, Position } from "@xyflow/react";

function getNodeIntersection(
  intersectionNode: { measured?: { width?: number; height?: number }; internals: { positionAbsolute: { x: number; y: number } } },
  targetNode: { measured?: { width?: number; height?: number }; internals: { positionAbsolute: { x: number; y: number } } }
) {
  const intersectionNodeWidth = intersectionNode.measured?.width ?? 200;
  const intersectionNodeHeight = intersectionNode.measured?.height ?? 100;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.measured?.width ?? 200) / 2;
  const y1 = targetPosition.y + (targetNode.measured?.height ?? 100) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgePosition(
  node: { measured?: { width?: number; height?: number }; internals: { positionAbsolute: { x: number; y: number } } },
  intersectionPoint: { x: number; y: number }
): Position {
  const nx = Math.round(node.internals.positionAbsolute.x);
  const ny = Math.round(node.internals.positionAbsolute.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + (node.measured?.width ?? 200) - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + (node.measured?.height ?? 100) - 1) return Position.Bottom;

  return Position.Top;
}

export function getEdgeParams(
  source: { measured?: { width?: number; height?: number }; internals: { positionAbsolute: { x: number; y: number } } },
  target: { measured?: { width?: number; height?: number }; internals: { positionAbsolute: { x: number; y: number } } }
) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

export type FloatingEdgeData = {
  label?: string;
  optimistic?: boolean;
  isConnectMode?: boolean;
  onLabelChange?: (edgeId: string, label: string | undefined) => void;
  focusLabel?: boolean;
};

function EdgeLabelInput({
  edgeId,
  label,
  onLabelChange,
  autoFocus,
}: {
  edgeId: string;
  label: string;
  onLabelChange: (edgeId: string, label: string | undefined) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const committedRef = useRef(false);
  const onLabelChangeRef = useRef(onLabelChange);
  onLabelChangeRef.current = onLabelChange;
  const edgeIdRef = useRef(edgeId);
  edgeIdRef.current = edgeId;

  useEffect(() => {
    setValue(label);
  }, [label]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [autoFocus]);

  // Commit on unmount (e.g. when connect mode toggles off)
  useEffect(() => {
    return () => {
      if (!committedRef.current) {
        const trimmed = valueRef.current.trim();
        onLabelChangeRef.current(edgeIdRef.current, trimmed || undefined);
      }
    };
  }, []);

  const commit = useCallback(() => {
    committedRef.current = true;
    const trimmed = value.trim();
    onLabelChange(edgeId, trimmed || undefined);
  }, [edgeId, value, onLabelChange]);

  return (
    <input
      ref={inputRef}
      className="nodrag nowheel w-full bg-white dark:bg-gray-900 text-[11px] font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-center outline-none focus:ring-1 focus:ring-blue-400 shadow-sm"
      value={value}
      placeholder="label"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          commit();
          inputRef.current?.blur();
        }
        if (e.key === "Escape") {
          setValue(label);
          inputRef.current?.blur();
        }
      }}
    />
  );
}

export function FloatingEdge({ id, source, target, style, data, ...rest }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const [hovered, setHovered] = useState(false);

  const edgeData = data as FloatingEdgeData | undefined;
  const label = edgeData?.label;
  const isConnectMode = edgeData?.isConnectMode ?? false;
  const onLabelChange = edgeData?.onLabelChange;
  const focusLabel = edgeData?.focusLabel ?? false;

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  // Midpoint for label placement
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const showInput = isConnectMode || focusLabel;

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        id={id}
        path={path}
        style={style}
        {...rest}
      />
      {showInput && onLabelChange ? (
        <foreignObject
          x={midX - 50}
          y={midY - 10}
          width={100}
          height={20}
          className="overflow-visible"
        >
          <EdgeLabelInput
            edgeId={id}
            label={label || ""}
            onLabelChange={onLabelChange}
            autoFocus={focusLabel}
          />
        </foreignObject>
      ) : label ? (
        <foreignObject
          x={midX - 60}
          y={midY - 12}
          width={120}
          height={24}
          className="pointer-events-none overflow-visible"
          style={{ opacity: hovered ? 1 : 0.85 }}
        >
          <div className="flex items-center justify-center h-full">
            <span
              className="inline-block max-w-[116px] truncate px-2 py-0.5 text-[11px] font-medium leading-tight rounded-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm"
            >
              {label}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </>
  );
}
