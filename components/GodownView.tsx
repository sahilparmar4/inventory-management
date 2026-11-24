'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, ChevronDown, MapPin, Warehouse, X } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { StockItem } from '@/types/inventory';
import DataTable, { Column } from './DataTable';

export default function GodownView() {
  const { godowns, stockItems, transferStock } = useInventory();
  const [selectedGodownId, setSelectedGodownId] = useState<string>('All');
  const [showTransfer, setShowTransfer] = useState(false);

  const [itemId, setItemId] = useState(stockItems[0]?.id ?? '');
  const [targetGodownId, setTargetGodownId] = useState(godowns[1]?.id ?? 'gd-2');
  const [qty, setQty] = useState(5);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const res = transferStock(itemId, targetGodownId, qty, note);
    if (!res.ok) {
      setError(res.error ?? 'Transfer failed');
      return;
    }
    setError('');
    setNote('');
    setShowTransfer(false);
  };

  const visibleItems =
    selectedGodownId === 'All'
      ? stockItems
      : stockItems.filter((i) => i.godownId === selectedGodownId);

  const columns: Column<StockItem>[] = [
    { key: 'sku', header: 'SKU', cellClassName: 'font-mono text-xs text-slate-500', render: (i) => i.sku, sortValue: (i) => i.sku },
    { key: 'name', header: 'Item', cellClassName: 'font-medium text-slate-900', render: (i) => i.name, sortValue: (i) => i.name },
    {
      key: 'location',
      header: 'Location',
      cellClassName: 'text-xs text-slate-600',
      render: (i) => godowns.find((g) => g.id === i.godownId)?.name,
      sortValue: (i) => godowns.find((g) => g.id === i.godownId)?.name ?? ''
    },
    { key: 'qty', header: 'Quantity', align: 'right', cellClassName: 'font-semibold tabular-nums', render: (i) => `${i.quantity} ${i.unit}`, sortValue: (i) => i.quantity },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      cellClassName: 'text-slate-700 tabular-nums',
      render: (i) => `₹${(i.quantity * i.unitCost).toLocaleString('en-IN')}`,
      sortValue: (i) => i.quantity * i.unitCost
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Warehouse &amp; Godown Distribution</h2>
          <p className="text-xs text-slate-500">Monitor capacity across locations and transfer stock</p>
        </div>
        <button
          onClick={() => {
            setError('');
            setShowTransfer(true);
          }}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Transfer Stock
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {godowns.map((gd) => {
          const itemsHere = stockItems.filter((i) => i.godownId === gd.id);
          const unitsHere = itemsHere.reduce((s, i) => s + i.quantity, 0);
          const valueHere = itemsHere.reduce((s, i) => s + i.quantity * i.unitCost, 0);
          const utilPct = Math.min(100, Math.round((unitsHere / gd.capacityUnits) * 100));
          const isSelected = selectedGodownId === gd.id;

          return (
            <button
              key={gd.id}
              onClick={() => setSelectedGodownId(isSelected ? 'All' : gd.id)}
              className={`text-left cursor-pointer bg-white rounded-xl p-5 border transition shadow-sm ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/15' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{gd.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" /> {gd.city} · {gd.code}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Units</span>
                  <div className="font-semibold text-slate-900 text-base tabular-nums">{unitsHere}</div>
                </div>
                <div>
                  <span className="text-slate-400">Stock Value</span>
                  <div className="font-semibold text-slate-900 text-base tabular-nums">
                    ₹{valueHere.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Utilization</span>
                  <span>{utilPct}% of {gd.capacityUnits}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${utilPct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <DataTable
        data={visibleItems}
        columns={columns}
        keyExtractor={(i) => i.id}
        emptyTitle="No stock items in this godown"
        headerSlot={
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {selectedGodownId === 'All'
                ? 'All Godown Inventory'
                : godowns.find((g) => g.id === selectedGodownId)?.name}
            </span>
            {selectedGodownId !== 'All' && (
              <button
                onClick={() => setSelectedGodownId('All')}
                className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                Show all locations
              </button>
            )}
          </div>
        }
      />

      {showTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Inter-Godown Transfer</h3>
              <button onClick={() => setShowTransfer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Item</label>
                <div className="relative">
                  <select
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {stockItems.map((i) => {
                      const gd = godowns.find((g) => g.id === i.godownId);
                      return (
                        <option key={i.id} value={i.id}>
                          {i.name} — {gd?.code} ({i.quantity} {i.unit})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination Godown</label>
                  <div className="relative">
                    <select
                      value={targetGodownId}
                      onChange={(e) => setTargetGodownId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      {godowns.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Note</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Regional stock rebalance"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransfer(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}