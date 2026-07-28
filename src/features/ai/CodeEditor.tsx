'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`relative w-full min-h-0 bg-[#1e1e1e] ${className}`}>
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language="javascript"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        options={{ minimap: { enabled: false }, fontSize: 15, automaticLayout: true }}
      />
    </div>
  );
};
