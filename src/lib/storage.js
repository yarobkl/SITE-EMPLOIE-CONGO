import { useState } from 'react';

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback));
  const setStoredValue = (nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage may be full or unavailable; keep the value in memory.
      }
      return resolved;
    });
  };
  return [value, setStoredValue];
}

export function getVisitorKey() {
  const storageKey = 'congoemploi.v2.visitorKey';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const next = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, next);
  return next;
}
