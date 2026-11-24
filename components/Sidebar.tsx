'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Menu,
  PackagePlus,
  ShoppingCart,
  Warehouse,
  X,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/purchase', label: 'Purchase', icon: PackagePlus },
  { href: '/stock', label: 'Stock', icon: Boxes },
  { href: '/godowns', label: 'Godowns', icon: Warehouse },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { stockItems, purchaseOrders } = useInventory();

  const lowStockCount = stockItems.filter((i) => getStockStatus(i) !== 'In Stock').length;
  const pendingPoCount = purchaseOrders.filter((p) => p.status === 'Pending').length;
  const currentTitle = NAV_ITEMS.find((n) => n.href === pathname)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="hidden md:flex md:w-60 md:flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            SF
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">StockFlow</div>
            <div className="text-[11px] text-slate-400">Inventory OS</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </span>
                {item.href === '/stock' && lowStockCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700">
                    {lowStockCount}
                  </span>
                )}
                {item.href === '/purchase' && pendingPoCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-700">
                    {pendingPoCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
          StockFlow &copy; 2026. All rights reserved.
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-slate-900">StockFlow</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live Sync Enabled
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}