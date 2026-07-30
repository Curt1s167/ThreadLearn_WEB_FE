'use client';

import React, { useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';

interface TranscriptPanelProps {
  transcript?: string;
  language?: string;
}

interface TranscriptEntry {
  timestamp?: string;
  text: string;
}

const timestampPattern = /(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)(?=\s)/g;

const parseTranscript = (transcript?: string): TranscriptEntry[] => {
  if (!transcript?.trim()) return [];

  const matches = Array.from(transcript.matchAll(timestampPattern));
  if (matches.length === 0) {
    return transcript
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }

  return matches
    .map((match, index) => {
      const nextMatch = matches[index + 1];
      const textStart = (match.index ?? 0) + match[0].length;
      const textEnd = nextMatch?.index ?? transcript.length;
      return { timestamp: match[1], text: transcript.slice(textStart, textEnd).trim() };
    })
    .filter((entry) => entry.text.length > 0);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  return text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi')).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="rounded bg-[#d9f99d] px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export function TranscriptPanel({ transcript, language }: TranscriptPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const entries = useMemo(() => parseTranscript(transcript), [transcript]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingEntries = normalizedQuery
    ? entries.filter((entry) => entry.text.toLocaleLowerCase().includes(normalizedQuery))
    : entries;

  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-black/10 bg-white"
      aria-label="Lesson transcript"
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText size={17} />
          <div>
            <h2 className="text-sm font-semibold text-ink">Transcript</h2>
            <p className="text-xs text-black/50">
              {language ? language.toUpperCase() : 'Original language'} · searchable text
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-black/[0.04]"
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide transcript' : 'View transcript'}
        </button>
      </div>
      {isOpen ? (
        <div className="border-t border-black/10 p-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/45"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in transcript"
              className="min-h-10 w-full rounded-lg border border-black/15 py-2 pl-9 pr-9 text-sm outline-none focus:border-black/35"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 rounded p-1 -translate-y-1/2 text-black/45 hover:bg-black/[0.05]"
                aria-label="Clear transcript search"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-black/50">
            {matchingEntries.length} of {entries.length} passages
          </p>
          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2 text-sm leading-6 text-black/70">
            {matchingEntries.map((entry, index) => (
              <div key={`${entry.timestamp ?? 'text'}-${index}`} className="flex gap-2">
                {entry.timestamp ? (
                  <span className="shrink-0 rounded bg-black/[0.05] px-1.5 py-0.5 text-xs font-medium tabular-nums text-black/60">
                    {entry.timestamp}
                  </span>
                ) : null}
                <p>{highlightMatch(entry.text, query.trim())}</p>
              </div>
            ))}
            {matchingEntries.length === 0 ? (
              <p className="rounded-lg bg-black/[0.03] p-3 text-black/55">
                No matching transcript text.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
