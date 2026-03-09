"use client";

import { ConnectionLineComponentProps } from "@xyflow/react";
import { getEdgeParams } from "./FloatingEdge";

export function FloatingConnectionLine({
  fromNode,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  if (!fromNode) return null;

  const targetNode = {
    id: "connection-target",
    measured: { width: 1, height: 1 },
    internals: { positionAbsolute: { x: toX, y: toY } },
  };

  const { sx, sy } = getEdgeParams(fromNode, targetNode);

  return (
    <g>
      <path
        fill="none"
        stroke="oklch(0.65 0.15 250)"
        strokeWidth={3}
        d={`M ${sx} ${sy} L ${toX} ${toY}`}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="white"
        r={3}
        stroke="oklch(0.65 0.15 250)"
        strokeWidth={2}
      />
    </g>
  );
}
