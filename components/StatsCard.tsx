'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
  subtitleClassName?: string;
  hoverBorderClassName?: string;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = 'bg-indigo-50 text-indigo-600',
  subtitleClassName = 'text-slate-500',
  hoverBorderClassName = 'hover:border-indigo-300',
  onClick,
}: StatCardProps) {
  const baseClass = `text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-200 ${
    onClick ? `${hoverBorderClassName} hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] cursor-pointer` : ''
  }`;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      <p className={`mt-1 text-xs ${subtitleClassName}`}>{subtitle}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}