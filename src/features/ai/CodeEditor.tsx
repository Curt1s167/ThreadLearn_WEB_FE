'use client';

import React, { useRef } from 'react';

export const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className = '', placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lineCount = value.split('\n').length;

  function syncScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  return (
    <div className={`flex w-full bg-[#111827] font-mono text-lg leading-6 ${className}`}>
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden border-r border-white/10 px-3 py-5 text-right text-[#d9f99d]/35"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        placeholder={placeholder}
        className="h-full w-full flex-1 resize-none overflow-auto bg-transparent p-5 text-[#d9f99d] outline-none placeholder:text-white/35"
      />
    </div>
  );
};
