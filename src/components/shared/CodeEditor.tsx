'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic-import keeps Monaco out of the SSR bundle. It is a ~1MB browser
// payload; loading it client-side only avoids hydration mismatch and shrinks
// initial HTML.
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-white/[0.06] bg-black/40 text-xs font-mono text-gray-600 p-4">
      Loading editor…
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange?: (next: string) => void;
  language?: string;
  height?: number | string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** Optional onMount hook so callers can grab the editor instance for focus/format. */
  onMount?: (editor: any, monaco: any) => void;
}

const LANGUAGE_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  'c++': 'cpp',
  cs: 'csharp',
};

const normalizeLanguage = (raw?: string) => {
  if (!raw) return 'plaintext';
  const lower = raw.toLowerCase();
  return LANGUAGE_ALIAS[lower] ?? lower;
};

/**
 * Thin wrapper around Monaco with the dark palette used everywhere else
 * (vs-dark + extra contrast tweaks). Keeps the API focused on the props the
 * lesson IDE / Exercise panel actually need.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  height = 320,
  readOnly,
  className,
  onMount,
}) => {
  return (
    <div
      className={`rounded-lg overflow-hidden border border-white/[0.06] bg-black/40 ${className ?? ''}`}
    >
      <MonacoEditor
        height={height}
        language={normalizeLanguage(language)}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        theme="vs-dark"
        onMount={(editor, monaco) => {
          // Define a slightly darker theme so the editor blends with the page.
          monaco.editor.defineTheme('threadlearn-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
              'editor.background': '#0b0c10',
              'editor.lineHighlightBackground': '#15161a',
              'editorLineNumber.foreground': '#3f4147',
              'editorGutter.background': '#0b0c10',
            },
          });
          monaco.editor.setTheme('threadlearn-dark');
          onMount?.(editor, monaco);
        }}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'JetBrains Mono, Menlo, ui-monospace, monospace',
          lineHeight: 20,
          tabSize: 2,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 12, bottom: 12 },
          guides: { indentation: true, highlightActiveIndentation: true },
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
