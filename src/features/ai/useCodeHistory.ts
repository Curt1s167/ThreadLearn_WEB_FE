'use client';

import { useCallback, useState } from 'react';

/**
 * Undo/redo stack for the code editor. Tracks every code change (typing,
 * sample switch, AI Resolve) as a history entry so a Resolve that turns out
 * wrong can be undone without losing the code the user had before it.
 */
export function useCodeHistory(initial: string) {
  const [past, setPast] = useState<string[]>([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState<string[]>([]);

  const set = useCallback((value: string) => {
    setPresent((prev) => {
      if (prev === value) return prev;
      setPast((p) => [...p, prev]);
      setFuture([]);
      return value;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(previous);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  const reset = useCallback((value: string) => {
    setPast([]);
    setPresent(value);
    setFuture([]);
  }, []);

  return {
    code: present,
    setCode: set,
    undo,
    redo,
    resetCode: reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
