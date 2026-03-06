"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState, useRef } from "react";

function useCountUp(target: number, durationMs = 1500): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (target <= 0) {
      setCurrent(0);
      return;
    }
    startTime.current = null;

    const tick = (now: number) => {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        id = requestAnimationFrame(tick);
      }
    };
    let id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, durationMs]);

  return current;
}

export function BoardCounter() {
  const count = useQuery(api.boards.getBoardCount);
  const animatedCount = useCountUp(count ?? 0);

  if (count === undefined || count === 0) return null;

  return (
    <p className="text-sm text-gray-400 font-[family-name:var(--font-poppins)] mt-3">
      <span className="text-gray-600 font-semibold tabular-nums">
        {animatedCount.toLocaleString()}
      </span>{" "}
      dumps created
    </p>
  );
}
