'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Plus, X } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { PurchaseOrder, PurchaseStatus } from '@/types/inventory';
import SearchFilterBar from './SearchBarFilter';
import ConfirmModal from './ConfirmModal';
import DataTable, { Column } from './DataTable';

interface PurchaseViewProps {
  preselectedItemId?: string | null;
  onClearPreselect?: () => void;
}

export default function PurchaseView({ preselectedItemId, onClearPreselect }: PurchaseViewProps) {
  const {
    purchaseOrders,
    stockItems,
    godowns,
    createPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseStatus>('All');
  const [showModal, setShowModal] = useState(false);
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);

  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('2026-11-28');
  const [godownId, setGodownId] = useState(godowns[0]?.id ?? 'gd-1');
  const [selectedItemId, setSelectedItemId] = useState(stockItems[0]?.id ?? '');
  const [qty, setQty] = useState(20);
  const [poStatus, setPoStatus] = useState<PurchaseStatus>('Pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedItemId) {
      const target = stockItems.find((s) => s.id === preselectedItemId);
      if (target) {
        setSelectedItemId(target.id);
        setGodownId(target.godownId);
        setQty(Math.max(10, target.minLevel * 2 - target.quantity));
        setShowModal(true);
      }
      onClearPreselect?.();
    }
  }, [preselectedItemId, stockItems, onClearPreselect]);

  const filtered = useMemo(() => {
    return purchaseOrders.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const q = search.toLowerCase();
      const matchesQuery =
        p.poNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [purchaseOrders, search, statusFilter]);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createPurchaseOrder({
      supplierName,
      expectedDate,
      godownId,
      status: poStatus,
      items: [{ itemId: selectedItemId, qty }],
    });
    if (!res.ok) {
      setError(res.error ?? 'Failed to create purchase order');
      return;
    }
    setSupplierName('');
    setError('');
    setShowModal(false);
  };

  const handleConfirmCancel = () => {
    if (!poToCancel) return;
    cancelPurchaseOrder(poToCancel.id);
    setPoToCancel(null);
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: 'po', header: 'PO Number', cellClassName: 'font-medium text-slate-900', render: (po) => po.poNumber, sortValue: (po) => po.poNumber },
    { key: 'supplier', header: 'Supplier', cellClassName: 'font-medium text-slate-800', render: (po) => po.supplierName, sortValue: (po) => po.supplierName },
    {
      key: 'godown',
      header: 'Destination',
      cellClassName: 'text-slate-500 text-xs',
      render: (po) => godowns.find((g) => g.id === po.godownId)?.name ?? 'Main Hub',
      sortValue: (po) => godowns.find((g) => g.id === po.godownId)?.name ?? ''
    },
    {
      key: 'items',
      header: 'Items',
      cellClassName: 'text-slate-600 text-xs',
      render: (po) => po.items.map((i) => `${i.itemName} (×${i.qty})`).join(', '),
      sortValue: (po) => po.items.reduce((s, i) => s + i.qty, 0)
    },
    { key: 'expected', header: 'Expected', cellClassName: 'text-slate-500 tabular-nums text-xs', render: (po) => po.expectedDate, sortValue: (po) => po.expectedDate },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cellClassName: 'font-semibold text-slate-900 tabular-nums',
      render: (po) => `₹${po.totalAmount.toLocaleString('en-IN')}`,
      sortValue: (po) => po.totalAmount
    },
    {
      key: 'status',
      header: 'Status',
      render: (po) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            po.status === 'Received'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : po.status === 'Pending'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {po.status}
        </span>
      ),
      sortValue: (po) => po.status
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cellClassName: 'space-x-2',
      render: (po) =>
        po.status === 'Pending' ? (
          <>
            <button
              onClick={() => receivePurchaseOrder(po.id)}
              className="inline-flex cursor-pointer items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Received
            </button>
            <button
              onClick={() => setPoToCancel(po)}
              className="px-2.5 cursor-pointer py-1 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search PO # or supplier..."
          statuses={['All', 'Pending', 'Received', 'Cancelled'] as const}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(po) => po.id}
        emptyTitle="No purchase orders match your filter."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Create Purchase Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Supplier Name</label>
                <input
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. ZebraTech Systems Ltd."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination Godown</label>
                  <div className="relative">
                    <select
                      value={godownId}
                      onChange={(e) => setGodownId(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Item</label>
                  <div className="relative">
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white truncate"
                    >
                      {stockItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (Cost ₹{i.unitCost})
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                <div className="relative">
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value as PurchaseStatus)}
                    className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Pending">Pending (receive later)</option>
                    <option value="Received">Received (adds stock immediately)</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(poToCancel)}
        title="Cancel Purchase Order"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onClose={() => setPoToCancel(null)}
        onConfirm={handleConfirmCancel}
        description={
          poToCancel && (
            <>
              Are you sure you want to mark purchase order{' '}
              <strong className="text-slate-900">{poToCancel.poNumber}</strong> for{' '}
              <strong className="text-slate-900">{poToCancel.supplierName}</strong> as{' '}
              <span className="font-semibold text-rose-600">Cancelled</span>?
            </>
          )
        }
      />
    </div>
  );
}