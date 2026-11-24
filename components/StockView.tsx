'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, History, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { StockItem, StockMovement, StockStatus, getStockStatus } from '@/types/inventory';
import DataTable, { Column } from './DataTable';

export default function StockView() {
  const { stockItems, stockMovements, godowns, adjustStock, addStockItem } = useInventory();
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'history'>('items');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | StockStatus>('All');

  const [adjustTargetId, setAdjustTargetId] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(5);
  const [adjustNote, setAdjustNote] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newGodown, setNewGodown] = useState(godowns[0]?.id ?? 'gd-1');
  const [newQty, setNewQty] = useState(25);
  const [newMin, setNewMin] = useState(10);
  const [newCost, setNewCost] = useState(40);
  const [newPrice, setNewPrice] = useState(75);
  const [newUnit, setNewUnit] = useState('pcs');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(stockItems.map((i) => i.category)))],
    [stockItems]
  );

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const status = getStockStatus(item);
      const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesSt = statusFilter === 'All' || status === statusFilter;
      const q = search.toLowerCase();
      const matchesQ = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      return matchesCat && matchesSt && matchesQ;
    });
  }, [stockItems, categoryFilter, statusFilter, search]);

  const filteredMovements = useMemo(() => {
    const q = search.toLowerCase();
    return stockMovements.filter(
      (m) =>
        m.itemName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q)
    );
  }, [stockMovements, search]);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetId) return;
    adjustStock(adjustTargetId, adjustDelta, adjustNote);
    setAdjustTargetId(null);
    setAdjustNote('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addStockItem({
      sku: newSku,
      name: newName,
      category: newCategory,
      godownId: newGodown,
      quantity: newQty,
      minLevel: newMin,
      unitCost: newCost,
      sellingPrice: newPrice,
      unit: newUnit,
    });
    if (res.ok) {
      setShowAddModal(false);
      setNewSku('');
      setNewName('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  const itemColumns: Column<StockItem>[] = [
    { key: 'sku', header: 'SKU', cellClassName: 'font-mono text-xs text-slate-500', render: (i) => i.sku, sortValue: (i) => i.sku },
    { key: 'name', header: 'Item Name', cellClassName: 'font-medium text-slate-900', render: (i) => i.name, sortValue: (i) => i.name },
    { key: 'category', header: 'Category', cellClassName: 'text-slate-600 text-xs', render: (i) => i.category, sortValue: (i) => i.category },
    {
      key: 'godown',
      header: 'Godown',
      cellClassName: 'text-slate-500 text-xs',
      render: (i) => godowns.find((g) => g.id === i.godownId)?.code ?? 'AMD-01',
      sortValue: (i) => godowns.find((g) => g.id === i.godownId)?.code ?? ''
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      cellClassName: 'font-semibold text-slate-900 tabular-nums',
      render: (i) => (
        <>
          {i.quantity} <span className="text-xs font-normal text-slate-400">{i.unit}</span>
        </>
      ),
      sortValue: (i) => i.quantity
    },
    { key: 'min', header: 'Min Level', align: 'right', cellClassName: 'text-slate-500 tabular-nums', render: (i) => i.minLevel, sortValue: (i) => i.minLevel },
    {
      key: 'status',
      header: 'Status',
      render: (i) => {
        const status = getStockStatus(i);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'In Stock'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : status === 'Low Stock'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status}
          </span>
        );
      },
      sortValue: (i) => getStockStatus(i)
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (i) => (
        <button
          onClick={() => {
            setAdjustTargetId(i.id);
            setAdjustDelta(5);
          }}
          className="inline-flex cursor-pointer items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Adjust
        </button>
      ),
    },
  ];

  const historyColumns: Column<StockMovement>[] = [
    { key: 'time', header: 'Timestamp', cellClassName: 'text-xs text-slate-500 tabular-nums', render: (m) => m.timestamp, sortValue: (m) => m.timestamp },
    {
      key: 'type',
      header: 'Type',
      render: (m) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
            m.type === 'IN'
              ? 'bg-emerald-50 text-emerald-700'
              : m.type === 'OUT'
              ? 'bg-rose-50 text-rose-700'
              : m.type === 'TRANSFER'
              ? 'bg-sky-50 text-sky-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {m.type}
        </span>
      ),
      sortValue: (m) => m.type
    },
    {
      key: 'item',
      header: 'Item',
      render: (m) => (
        <>
          <div className="font-medium text-slate-900">{m.itemName}</div>
          <div className="text-xs text-slate-400">{m.note}</div>
        </>
      ),
      sortValue: (m) => m.itemName
    },
    { key: 'ref', header: 'Reference', cellClassName: 'font-mono text-xs text-slate-600', render: (m) => m.reference, sortValue: (m) => m.reference },
    { key: 'godown', header: 'Godown', cellClassName: 'text-xs text-slate-500', render: (m) => m.godownName, sortValue: (m) => m.godownName },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      cellClassName: 'font-semibold tabular-nums',
      render: (m) => (
        <span className={m.qtyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
          {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
        </span>
      ),
      sortValue: (m) => m.qtyChange
    },
    { key: 'balance', header: 'Balance', align: 'right', cellClassName: 'font-medium text-slate-800 tabular-nums', render: (m) => m.balanceAfter, sortValue: (m) => m.balanceAfter },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setActiveSubTab('items')}
              className={`px-3 cursor-pointer py-1.5 rounded-md text-xs font-medium transition ${
                activeSubTab === 'items' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stock Items ({stockItems.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeSubTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Stock History ({stockMovements.length})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeSubTab === 'items' ? 'Search SKU or item...' : 'Search ledger or ref...'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {activeSubTab === 'items' && (
            <>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'All' | StockStatus)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition self-start lg:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Stock Item
        </button>
      </div>

      {activeSubTab === 'items' ? (
        <DataTable
          data={filteredItems}
          columns={itemColumns}
          keyExtractor={(i) => i.id}
          emptyTitle="No stock items found"
          emptySubtitle="Try adjusting your search or filter criteria."
          emptyAction={
            search || categoryFilter !== 'All' || statusFilter !== 'All' ? (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
              >
                Reset filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          data={filteredMovements}
          columns={historyColumns}
          keyExtractor={(m) => m.id}
          emptyTitle="No stock history records found"
          emptySubtitle="Try clearing your search query."
        />
      )}

      {adjustTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Adjust Stock Level</h3>
              <button onClick={() => setAdjustTargetId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity Change (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Audit Note</label>
                <input
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Cycle count reconciliation"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustTargetId(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Add New SKU</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SKU</label>
                  <input
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="ELC-205"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      <option>Electronics</option>
                      <option>Packaging</option>
                      <option>Hardware</option>
                      <option>Safety</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Wireless Handheld Scanner"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Godown</label>
                  <div className="relative">
                    <select
                      value={newGodown}
                      onChange={(e) => setNewGodown(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Qty</label>
                  <input type="number" min={0} value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Min</label>
                  <input type="number" min={0} value={newMin} onChange={(e) => setNewMin(Number(e.target.value))} className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Cost ₹</label>
                  <input type="number" min={0} value={newCost} onChange={(e) => setNewCost(Number(e.target.value))} className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Price ₹</label>
                  <input type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}