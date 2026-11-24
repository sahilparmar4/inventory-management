'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  cellClassName?: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  headerSlot?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  headerSlot,
  emptyTitle = 'No records found',
  emptySubtitle,
  emptyAction,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;

    const getVal = col.sortValue;
    return [...data].sort((a, b) => {
      const valA = getVal(a);
      const valB = getVal(b);
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sortKey, sortDir]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {headerSlot}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col) => {
                const isSortable = Boolean(col.sortValue);
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer ${
                          isActive ? 'text-slate-900' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {isActive ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sortedData.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-50/70">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : ''} ${
                      col.cellClassName ?? ''
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
                  {emptySubtitle && (
                    <p className="text-xs text-slate-500 mt-1">{emptySubtitle}</p>
                  )}
                  {emptyAction && <div className="mt-3">{emptyAction}</div>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}