import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { EmptyView } from './StateView';
import { Skeleton } from './index';

export interface Column<T> {
  key:     string;
  header:  string;
  /** Reads the cell value; defaults to row[key]. */
  accessor?: (row: T) => React.ReactNode;
  /** Allow sorting by the raw row value (only set this on sortable columns). */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  width?:   string;       // tailwind w-* class
  align?:   'left' | 'right' | 'center';
  className?: string;
}

interface FilterOption<T> {
  label: string;
  /** Returns true if row passes. */
  match: (row: T) => boolean;
}

interface DataTableProps<T> {
  data:      T[];
  columns:   Column<T>[];
  loading?:  boolean;

  /** Free-text search — caller provides match callback. */
  searchPlaceholder?: string;
  searchOn?: (row: T, q: string) => boolean;

  /** Optional named filters shown as chips. */
  filters?:  Record<string, FilterOption<T>[]>;
  pageSize?: number;

  rowKey:    (row: T) => string;
  onRowClick?: (row: T) => void;

  /** Slot rendered above the table for primary actions (e.g. "Create"). */
  toolbarRight?: React.ReactNode;
  emptyTitle?:       string;
  emptyDescription?: string;
}

export function DataTable<T>({
  data, columns, loading,
  searchPlaceholder = 'Tìm kiếm...',
  searchOn, filters, pageSize = 10,
  rowKey, onRowClick,
  toolbarRight, emptyTitle, emptyDescription,
}: DataTableProps<T>) {
  const [query,    setQuery]    = useState('');
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');
  const [page,     setPage]     = useState(1);
  const [chipFilters, setChipFilters] = useState<Record<string, number | null>>({});

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = data;
    if (query && searchOn) {
      const q = query.toLowerCase().trim();
      rows = rows.filter((r) => searchOn(r, q));
    }
    if (filters) {
      for (const [group, idx] of Object.entries(chipFilters)) {
        if (idx == null) continue;
        const opt = filters[group]?.[idx];
        if (opt) rows = rows.filter(opt.match);
      }
    }
    return rows;
  }, [data, query, searchOn, filters, chipFilters]);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = col.sortValue!(a) as any;
      const bv = col.sortValue!(b) as any;
      if (av == null && bv == null) return 0;
      if (av == null) return  1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {searchOn && (
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"/>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="input-field pl-9 w-full"
            />
          </div>
        )}
        {toolbarRight}
      </div>

      {/* Filter chips */}
      {filters && Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([group, opts]) => (
            <div key={group} className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-600">
                {group}:
              </span>
              <button
                onClick={() => setChipFilters((s) => ({ ...s, [group]: null }))}
                className={`px-2.5 py-0.5 text-[11px] font-mono rounded-full border transition-colors ${
                  chipFilters[group] == null
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                    : 'border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                All
              </button>
              {opts.map((o, i) => (
                <button
                  key={o.label}
                  onClick={() => setChipFilters((s) =>
                    ({ ...s, [group]: s[group] === i ? null : i }))}
                  className={`px-2.5 py-0.5 text-[11px] font-mono rounded-full border transition-colors ${
                    chipFilters[group] === i
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                      : 'border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0d0d12]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead className="bg-white/[0.02]">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`text-${c.align ?? 'left'} px-3 py-2.5 text-[11px] uppercase tracking-wider
                                text-gray-600 ${c.width ?? ''}`}
                  >
                    {c.sortValue ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-gray-300 transition-colors"
                      >
                        {c.header}
                        {sortKey !== c.key && <ChevronsUpDown size={11}/>}
                        {sortKey === c.key && sortDir === 'asc'  && <ChevronUp   size={11}/>}
                        {sortKey === c.key && sortDir === 'desc' && <ChevronDown size={11}/>}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={`s${i}`}>
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2.5">
                        <Skeleton className="h-3 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8">
                    <EmptyView
                      title={emptyTitle ?? 'Không có dữ liệu'}
                      description={emptyDescription ?? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác.'}
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {pageRows.map((row, i) => (
                    <motion.tr
                      key={rowKey(row)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{    opacity: 0 }}
                      transition={{ duration: 0.16, delay: i * 0.015 }}
                      onClick={() => onRowClick?.(row)}
                      className={`hover:bg-white/[0.025] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-3 py-2.5 text-${c.align ?? 'left'} ${c.className ?? ''}`}
                        >
                          {c.accessor ? c.accessor(row) : (row as any)[c.key]}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] text-[11px] font-mono text-gray-500">
            <span>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} trong {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Trang trước"
              >
                <ChevronLeft size={13}/>
              </button>
              <span className="px-2">trang {safePage} / {totalPages}</span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Trang sau"
              >
                <ChevronRight size={13}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
