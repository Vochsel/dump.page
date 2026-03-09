"use client";

import { useRef, useCallback, useEffect } from "react";
import { useStore, useReactFlow, Edge } from "@xyflow/react";
import { getEdgeParams } from "./FloatingEdge";
import { getBezierPath } from "@xyflow/react";

type Point = { x: number; y: number };

/** Sample points along a cubic bezier curve */
function sampleBezierPoints(path: string, numSamples = 30): Point[] {
  const match = path.match(
    /M\s*([-\d.]+)[,\s]+([-\d.]+)\s*C\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)/
  );
  if (!match) return [];

  const [, x0s, y0s, cx1s, cy1s, cx2s, cy2s, x1s, y1s] = match;
  const x0 = parseFloat(x0s);
  const y0 = parseFloat(y0s);
  const cx1 = parseFloat(cx1s);
  const cy1 = parseFloat(cy1s);
  const cx2 = parseFloat(cx2s);
  const cy2 = parseFloat(cy2s);
  const x1 = parseFloat(x1s);
  const y1 = parseFloat(y1s);

  const points: Point[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const mt = 1 - t;
    points.push({
      x: mt * mt * mt * x0 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x1,
      y: mt * mt * mt * y0 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y1,
    });
  }
  return points;
}

/** Check if two line segments intersect */
function segmentsIntersect(
  a1: Point, a2: Point,
  b1: Point, b2: Point
): boolean {
  const d1x = a2.x - a1.x;
  const d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x;
  const d2y = b2.y - b1.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Check if a polyline (knife path) intersects a bezier edge path */
function knifeIntersectsEdge(knifePoints: Point[], edgePath: string): boolean {
  const edgeSamples = sampleBezierPoints(edgePath);
  if (edgeSamples.length < 2 || knifePoints.length < 2) return false;

  for (let i = 0; i < knifePoints.length - 1; i++) {
    for (let j = 0; j < edgeSamples.length - 1; j++) {
      if (segmentsIntersect(knifePoints[i], knifePoints[i + 1], edgeSamples[j], edgeSamples[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

interface KnifeToolProps {
  active: boolean;
  edges: Edge[];
  onCutEdges: (edgeIds: string[]) => void;
}

export function KnifeTool({ active, edges, onCutEdges }: KnifeToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);

  // Keep refs to avoid stale closures in the deactivation effect
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const onCutEdgesRef = useRef(onCutEdges);
  onCutEdgesRef.current = onCutEdges;

  const { width, height } = useStore((s) => ({
    width: s.width,
    height: s.height,
  }));

  const { screenToFlowPosition, getNodes } = useReactFlow();
  const screenToFlowRef = useRef(screenToFlowPosition);
  screenToFlowRef.current = screenToFlowPosition;
  const getNodesRef = useRef(getNodes);
  getNodesRef.current = getNodes;
  // Store the canvas bounding rect while we still have it
  const rectRef = useRef<DOMRect | null>(null);

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  // When K is released, check for cuts before the canvas unmounts
  const prevActiveRef = useRef(active);
  useEffect(() => {
    if (prevActiveRef.current && !active) {
      // K was just released — run cut logic using refs (canvas is still mounted this render)
      const points = pointsRef.current;
      const rect = rectRef.current;
      pointsRef.current = [];
      rectRef.current = null;

      if (points.length >= 2 && rect) {
        const flowPoints = points.map((p) =>
          screenToFlowRef.current({ x: p.x + rect.left, y: p.y + rect.top })
        );

        const nodes = getNodesRef.current();
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const cutEdgeIds: string[] = [];

        for (const edge of edgesRef.current) {
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          if (!sourceNode || !targetNode) continue;

          const source = {
            measured: { width: sourceNode.measured?.width ?? 200, height: sourceNode.measured?.height ?? 100 },
            internals: { positionAbsolute: { x: sourceNode.position.x, y: sourceNode.position.y } },
          };
          const target = {
            measured: { width: targetNode.measured?.width ?? 200, height: targetNode.measured?.height ?? 100 },
            internals: { positionAbsolute: { x: targetNode.position.x, y: targetNode.position.y } },
          };

          const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(source, target);
          const [path] = getBezierPath({
            sourceX: sx,
            sourceY: sy,
            sourcePosition: sourcePos,
            targetPosition: targetPos,
            targetX: tx,
            targetY: ty,
          });

          if (knifeIntersectsEdge(flowPoints, path)) {
            cutEdgeIds.push(edge.id);
          }
        }

        if (cutEdgeIds.length > 0) {
          onCutEdgesRef.current(cutEdgeIds);
        }
      }
    }
    prevActiveRef.current = active;
  }, [active]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!active || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      rectRef.current = rect;
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      pointsRef.current.push(point);
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) drawLine(ctx, pointsRef.current);
    },
    [active, drawLine]
  );

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 z-20 cursor-crosshair"
      style={{ pointerEvents: "all" }}
      onPointerMove={onPointerMove}
    />
  );
}
