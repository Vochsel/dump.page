"use client";

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

export function FloatingEdge({ id, source, target, style, ...rest }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

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

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <BaseEdge
        id={id}
        path={path}
        style={style}
        {...rest}
      />
    </>
  );
}
