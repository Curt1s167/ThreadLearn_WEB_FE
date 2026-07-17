'use client';

import { useCallback, useRef, useState } from 'react';

export interface RunLogEntry {
  level: 'log' | 'warn' | 'error' | 'result';
  text: string;
}

const RUN_TIMEOUT_MS = 5000;

const SANDBOX_HTML = `
<!doctype html>
<html><head><meta charset="utf-8"></head><body><script>
  const send = (level, args) => {
    let text;
    try {
      text = args.map((a) => {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') return JSON.stringify(a, null, 2);
        return String(a);
      }).join(' ');
    } catch {
      text = '[unserializable]';
    }
    parent.postMessage({ __sandbox: true, level, text }, '*');
  };

  console.log = (...a) => send('log', a);
  console.warn = (...a) => send('warn', a);
  console.error = (...a) => send('error', a);

  window.addEventListener('message', async (e) => {
    if (!e.data || e.data.__run !== true) return;
    try {
      const asyncWrapped = new Function(
        'return (async () => {\\n' + e.data.code + '\\n})()'
      );
      const result = await asyncWrapped();
      if (result !== undefined) send('result', [result]);
    } catch (err) {
      send('error', [err]);
    }
    // Code often fires promises without awaiting them (e.g. .then(console.log)
    // with no return/await) — give pending microtasks/macrotasks a chance to
    // flush their console output before signalling done, otherwise those logs
    // never reach the parent.
    setTimeout(() => {
      parent.postMessage({ __sandbox: true, done: true }, '*');
    }, 300);
  });

  parent.postMessage({ __sandbox: true, ready: true }, '*');
<\/script></body></html>
`;

export function useRunCode() {
  const [logs, setLogs] = useState<RunLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
      listenerRef.current = null;
    }
    if (iframeRef.current) {
      iframeRef.current.remove();
      iframeRef.current = null;
    }
  }, []);

  const run = useCallback((code: string) => {
    cleanup();
    setLogs([]);
    setRunError(null);
    setIsRunning(true);
    setHasRun(true);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px';
    iframeRef.current = iframe;

    const collected: RunLogEntry[] = [];

    function onMessage(e: MessageEvent) {
      if (!e.data || !e.data.__sandbox) return;

      if (e.data.ready) {
        iframe.contentWindow?.postMessage({ __run: true, code }, '*');
        return;
      }

      if (e.data.level) {
        collected.push({ level: e.data.level, text: e.data.text });
        setLogs([...collected]);
      }

      if (e.data.done) {
        finish();
      }
    }

    function finish() {
      setIsRunning(false);
      cleanup();
    }

    listenerRef.current = onMessage;
    window.addEventListener('message', onMessage);

    timeoutRef.current = setTimeout(() => {
      setRunError(`Execution timed out after ${RUN_TIMEOUT_MS / 1000}s (infinite loop?)`);
      finish();
    }, RUN_TIMEOUT_MS);

    document.body.appendChild(iframe);
    iframe.srcdoc = SANDBOX_HTML;
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setLogs([]);
    setRunError(null);
    setIsRunning(false);
    setHasRun(false);
  }, [cleanup]);

  return { logs, isRunning, runError, hasRun, run, reset };
}
