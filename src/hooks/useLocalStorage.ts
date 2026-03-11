"use client";

import { useState, useCallback, useEffect } from "react";

// Custom event for same-tab localStorage sync between components
const LS_CHANGE_EVENT = "dump-localstorage-change";

function dispatchLsChange(key: string) {
  window.dispatchEvent(new CustomEvent(LS_CHANGE_EVENT, { detail: { key } }));
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync when another component using the same key updates localStorage
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key !== key) return;
      try {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch {
        // ignore
      }
    };
    window.addEventListener(LS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LS_CHANGE_EVENT, handler);
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
          dispatchLsChange(key);
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
