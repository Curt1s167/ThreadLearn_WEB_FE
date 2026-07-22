'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { parseLessonOutline, slugifyHeading } from './lessonContent';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

function makeHeading(Tag: HeadingTag, idMap: Map<string, string>) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const text = extractText(children).trim();
    const id = idMap.get(text) ?? slugifyHeading(text);
    return (
      <Tag id={id} className="scroll-mt-28 group">
        <a
          href={`#${id}`}
          className="no-underline text-inherit hover:underline decoration-black/20 underline-offset-4"
        >
          {children}
        </a>
      </Tag>
    );
  };
}

function hashContent(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function LessonMarkdown({
  content,
  checklistStorageKey,
}: {
  content: string;
  checklistStorageKey?: string;
}) {
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const contentKey = useMemo(() => hashContent(content), [content]);

  useEffect(() => {
    if (!checklistStorageKey) {
      setCheckedTasks({});
      return;
    }

    try {
      const saved = window.localStorage.getItem(`threadlearn:content-checklist:${checklistStorageKey}`);
      setCheckedTasks(saved ? JSON.parse(saved) as Record<string, boolean> : {});
    } catch {
      setCheckedTasks({});
    }
  }, [checklistStorageKey]);

  const toggleTask = useCallback((taskKey: string, defaultChecked: boolean) => {
    setCheckedTasks((current) => {
      const next = {
        ...current,
        [taskKey]: !(current[taskKey] ?? defaultChecked),
      };
      if (checklistStorageKey) {
        try {
          window.localStorage.setItem(
            `threadlearn:content-checklist:${checklistStorageKey}`,
            JSON.stringify(next),
          );
        } catch {
          // The control still works for this session when browser storage is unavailable.
        }
      }
      return next;
    });
  }, [checklistStorageKey]);

  const idMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of parseLessonOutline(content)) {
      if (!map.has(item.text)) map.set(item.text, item.id);
    }
    // Also map H1 if present (not in outline)
    const h1 = content.match(/^#\s+(.+?)\s*$/m);
    if (h1) {
      const text = h1[1].replace(/\s+#*\s*$/, '').trim();
      if (text && !map.has(text)) map.set(text, slugifyHeading(text));
    }
    return map;
  }, [content]);

  const components = useMemo<Components>(
    () => ({
      h1: makeHeading('h1', idMap),
      h2: makeHeading('h2', idMap),
      h3: makeHeading('h3', idMap),
      h4: makeHeading('h4', idMap),
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {children}
        </a>
      ),
      li: ({ node, className, children, ...props }) => {
        const isTaskItem = className?.split(' ').includes('task-list-item');
        if (!isTaskItem) return <li {...props} className={className}>{children}</li>;

        const childItems = React.Children.toArray(children);
        const sourceCheckbox = childItems.find(
          (child) => React.isValidElement<{ type?: string; checked?: boolean }>(child)
            && child.type === 'input'
            && child.props.type === 'checkbox',
        );
        const contentChildren = childItems.filter((child) => child !== sourceCheckbox);
        const labelText = extractText(contentChildren).trim();
        const sourceOffset = node?.position?.start.offset ?? node?.position?.start.line ?? 0;
        const taskKey = `${contentKey}:${sourceOffset}:${hashContent(labelText)}`;
        const defaultChecked = React.isValidElement<{ checked?: boolean }>(sourceCheckbox)
          ? Boolean(sourceCheckbox.props.checked)
          : false;
        const isChecked = checkedTasks[taskKey] ?? defaultChecked;

        return (
          <li {...props} className={className}>
            <label className="lesson-task-label">
              <input
                type="checkbox"
                checked={isChecked}
                aria-label={`${isChecked ? 'Bỏ đánh dấu' : 'Đánh dấu'}: ${labelText || 'mục checklist'}`}
                className="lesson-task-checkbox"
                onChange={() => toggleTask(taskKey, defaultChecked)}
              />
              <span className="min-w-0 flex-1">{contentChildren}</span>
            </label>
          </li>
        );
      },
    }),
    [checkedTasks, contentKey, idMap, toggleTask],
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
