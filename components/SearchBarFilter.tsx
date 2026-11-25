'use client';

import { Search } from 'lucide-react';

interface SearchFilterBarProps<T extends string> {
  showSearch?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  statuses: readonly T[];
  activeStatus: T;
  onStatusChange: (status: T) => void;
  formatStatus?: (status: T) => string;
}

export default function SearchFilterBar<T extends string>({
  showSearch = true,
  search = '',
  onSearchChange,
  placeholder = 'Search...',
  statuses,
  activeStatus,
  onStatusChange,
  formatStatus,
}: SearchFilterBarProps<T>) {
  return (
    <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
      {showSearch && onSearchChange && (
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-1 bg-white border border-slate-200 rounded-lg p-1 self-center sm:self-auto">
        {statuses.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatusChange(st)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              activeStatus === st
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            {formatStatus ? formatStatus(st) : st}
          </button>
        ))}
      </div>
    </div>
  );
}