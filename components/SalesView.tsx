'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, FileText, Plus, X } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { SaleStatus, SalesOrder } from '@/types/inventory';
import SearchFilterBar from './SearchBarFilter';
import ConfirmModal from './ConfirmModal';
import DataTable, { Column } from './DataTable';

export default function SalesView() {
  const { salesOrders, stockItems, createSaleOrder, updateSaleStatus } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SaleStatus>('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<SalesOrder | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderStatus, setOrderStatus] = useState<SaleStatus>('Paid');
  const [selectedItemId, setSelectedItemId] = useState(stockItems[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    return salesOrders.filter((o) => {
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchesQuery =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [salesOrders, search, statusFilter]);

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createSaleOrder({
      customerName,
      customerEmail,
      status: orderStatus,
      items: [{ itemId: selectedItemId, qty }],
    });
    if (!res.ok) {
      setError(res.error ?? 'Could not create order');
      return;
    }
    setCustomerName('');
    setCustomerEmail('');
    setQty(1);
    setError('');
    setShowModal(false);
  };

  const handleConfirmCancel = () => {
    if (!orderToCancel) return;
    updateSaleStatus(orderToCancel.id, 'Cancelled');
    setOrderToCancel(null);
  };

  const columns: Column<SalesOrder>[] = [
    { key: 'invoice', header: 'Invoice', cellClassName: 'font-medium text-slate-900', render: (o) => o.orderNumber, sortValue: (o) => o.orderNumber },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <>
          <div className="font-medium text-slate-800">{o.customerName}</div>
          <div className="text-xs text-slate-400">{o.customerEmail}</div>
        </>
      ),
      sortValue: (o) => o.customerName
    },
    { key: 'date', header: 'Date', cellClassName: 'text-slate-500 tabular-nums', render: (o) => o.date, sortValue: (o) => o.date },
    {
      key: 'items',
      header: 'Items',
      cellClassName: 'text-slate-600',
      render: (o) => `${o.items.reduce((s, i) => s + i.qty, 0)} units (${o.items.length} SKU)`,
      sortValue: (o) => o.items.reduce((s, i) => s + i.qty, 0)
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cellClassName: 'font-semibold text-slate-900 tabular-nums',
      render: (o) => `₹${o.totalAmount.toLocaleString('en-IN')}`,
      sortValue: (o) => o.totalAmount
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            o.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : o.status === 'Pending'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {o.status}
        </span>
      ),
      sortValue: (o) => o.status
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cellClassName: 'space-x-2',
      render: (order) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedOrder(order)}
            className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
          >
            <FileText className="h-4 w-4 shrink-0" />
            Invoice
          </button>
          {order.status === 'Pending' && (
            <button
              onClick={() => updateSaleStatus(order.id, 'Paid')}
              className="px-3 py-1.5 cursor-pointer rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
            >
              Mark Paid
            </button>
          )}
          {order.status !== 'Cancelled' && (
            <button
              onClick={() => setOrderToCancel(order)}
              className="px-3 py-1.5 cursor-pointer rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 whitespace-nowrap"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search invoice # or customer..."
          statuses={['All', 'Paid', 'Pending', 'Cancelled'] as const}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition active:scale-[0.98] self-center lg:self-auto"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New Sale Order
        </button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(o) => o.id}
        emptyTitle="No sales orders match your filter."
      />

      <ConfirmModal
        open={Boolean(orderToCancel)}
        title="Cancel Sales Order"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancel}
        description={
          orderToCancel && (
            <>
              Are you sure you want to mark invoice{' '}
              <span className="font-semibold text-slate-900">{orderToCancel.orderNumber}</span> for{' '}
              <span className="font-semibold text-slate-900">{orderToCancel.customerName}</span> as{' '}
              <span className="font-semibold text-rose-600">Cancelled</span>?
            </>
          )
        }
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Create Sales Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 cursor-pointer hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSale} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Horizon Distributors"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="orders@horizon.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Item</label>
                  <div className="relative">
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {stockItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.quantity} {i.unit} avail · ₹{i.sellingPrice})
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Status</label>
                <div className="relative">
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as SaleStatus)}
                    className="w-full appearance-none pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Paid">Paid (deducts stock)</option>
                    <option value="Pending">Pending (allocates stock)</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Create &amp; Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">Issued {selectedOrder.date}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase">Billed To</span>
                  <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                  <a href={`mailto:${selectedOrder.customerEmail}`} className="text-xs text-slate-500 hover:text-slate-600 cursor-pointer">
                    {selectedOrder.customerEmail}
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase">Status</span>
                  <p className="font-semibold text-slate-900">{selectedOrder.status}</p>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="py-2 px-3 text-left">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((l, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{l.itemName}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{l.qty}</td>
                        <td className="py-2 px-3 text-right tabular-nums">₹{l.unitPrice}</td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums">
                          ₹{(l.qty * l.unitPrice).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-600">Grand Total</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}