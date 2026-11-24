'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { PurchaseOrder, SalesOrder, StockItem, getStockStatus } from '@/types/inventory';
import SearchFilterBar from './SearchBarFilter';
import DataTable, { Column } from './DataTable';

type ReportTab = 'stock' | 'sales' | 'purchase';

const REPORT_LABELS: Record<ReportTab, string> = {
  stock: 'Stock Report',
  sales: 'Sales Report',
  purchase: 'Purchase Report',
};

export default function ReportsView() {
  const { stockItems, salesOrders, purchaseOrders } = useInventory();
  const [reportTab, setReportTab] = useState<ReportTab>('stock');

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (reportTab === 'stock') {
      downloadCsv('stock-report.csv', [
        ['SKU', 'Item', 'Category', 'Quantity', 'Min Level', 'Unit Cost', 'Valuation', 'Status'],
        ...stockItems.map((i) => [
          i.sku,
          i.name,
          i.category,
          String(i.quantity),
          String(i.minLevel),
          String(i.unitCost),
          String(i.quantity * i.unitCost),
          getStockStatus(i),
        ]),
      ]);
    } else if (reportTab === 'sales') {
      downloadCsv('sales-report.csv', [
        ['Invoice', 'Customer', 'Date', 'Status', 'Total Amount'],
        ...salesOrders.map((s) => [s.orderNumber, s.customerName, s.date, s.status, String(s.totalAmount)]),
      ]);
    } else {
      downloadCsv('purchase-report.csv', [
        ['PO Number', 'Supplier', 'Date', 'Expected Date', 'Status', 'Total Amount'],
        ...purchaseOrders.map((p) => [
          p.poNumber,
          p.supplierName,
          p.date,
          p.expectedDate,
          p.status,
          String(p.totalAmount),
        ]),
      ]);
    }
  };

  const totalValuation = stockItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const totalRetail = stockItems.reduce((s, i) => s + i.quantity * i.sellingPrice, 0);
  const totalSales = salesOrders
    .filter((s) => s.status !== 'Cancelled')
    .reduce((a, b) => a + b.totalAmount, 0);
  const totalPurchaseSpend = purchaseOrders
    .filter((p) => p.status !== 'Cancelled')
    .reduce((a, b) => a + b.totalAmount, 0);

  const stockColumns: Column<StockItem>[] = [
    { key: 'sku', header: 'SKU', cellClassName: 'font-mono text-xs text-slate-500', render: (i) => i.sku, sortValue: (i) => i.sku },
    { key: 'name', header: 'Item', cellClassName: 'font-medium text-slate-900', render: (i) => i.name, sortValue: (i) => i.name },
    { key: 'qty', header: 'Qty', align: 'right', cellClassName: 'tabular-nums', render: (i) => i.quantity, sortValue: (i) => i.quantity },
    { key: 'cost', header: 'Unit Cost', align: 'right', cellClassName: 'tabular-nums', render: (i) => `₹${i.unitCost}`, sortValue: (i) => i.unitCost },
    {
      key: 'val',
      header: 'Total Value',
      align: 'right',
      cellClassName: 'font-semibold tabular-nums',
      render: (i) => `₹${(i.quantity * i.unitCost).toLocaleString('en-IN')}`,
      sortValue: (i) => i.quantity * i.unitCost
    },
    { key: 'status', header: 'Status', cellClassName: 'text-xs', render: (i) => getStockStatus(i), sortValue: (i) => getStockStatus(i) },
  ];

  const salesColumns: Column<SalesOrder>[] = [
    { key: 'inv', header: 'Invoice', cellClassName: 'font-medium', render: (s) => s.orderNumber, sortValue: (s) => s.orderNumber },
    { key: 'customer', header: 'Customer', render: (s) => s.customerName, sortValue: (s) => s.customerName },
    { key: 'date', header: 'Date', cellClassName: 'text-slate-500 tabular-nums', render: (s) => s.date, sortValue: (s) => s.date },
    { key: 'status', header: 'Status', cellClassName: 'text-xs', render: (s) => s.status, sortValue: (s) => s.status },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cellClassName: 'font-semibold tabular-nums',
      render: (s) => `₹${s.totalAmount.toLocaleString('en-IN')}`,
      sortValue: (s) => s.totalAmount
    },
  ];

  const purchaseColumns: Column<PurchaseOrder>[] = [
    { key: 'po', header: 'PO #', cellClassName: 'font-medium', render: (p) => p.poNumber, sortValue: (p) => p.poNumber },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplierName, sortValue: (p) => p.supplierName },
    { key: 'expected', header: 'Expected', cellClassName: 'text-slate-500 tabular-nums', render: (p) => p.expectedDate, sortValue: (p) => p.expectedDate },
    { key: 'status', header: 'Status', cellClassName: 'text-xs', render: (p) => p.status, sortValue: (p) => p.status },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cellClassName: 'font-semibold tabular-nums',
      render: (p) => `₹${p.totalAmount.toLocaleString('en-IN')}`,
      sortValue: (p) => p.totalAmount
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchFilterBar
          showSearch={false}
          statuses={['stock', 'sales', 'purchase'] as const}
          activeStatus={reportTab}
          onStatusChange={setReportTab}
          formatStatus={(t) => REPORT_LABELS[t]}
        />
        <button
          onClick={handleExport}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-xs transition self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {reportTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Cost Valuation</span>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                ₹{totalValuation.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Potential Retail Value</span>
              <div className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                ₹{totalRetail.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">SKUs Below Min Level</span>
              <div className="mt-1 text-xl font-bold text-amber-600 tabular-nums">
                {stockItems.filter((i) => getStockStatus(i) !== 'In Stock').length}
              </div>
            </div>
          </div>
          <DataTable data={stockItems} columns={stockColumns} keyExtractor={(i) => i.id} />
        </div>
      )}

      {reportTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Total Active Sales</span>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                ₹{totalSales.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Paid Invoices</span>
              <div className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {salesOrders.filter((s) => s.status === 'Paid').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Pending Payment</span>
              <div className="mt-1 text-xl font-bold text-amber-600 tabular-nums">
                ₹
                {salesOrders
                  .filter((s) => s.status === 'Pending')
                  .reduce((a, b) => a + b.totalAmount, 0)
                  .toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <DataTable data={salesOrders} columns={salesColumns} keyExtractor={(s) => s.id} />
        </div>
      )}

      {reportTab === 'purchase' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Total Procurement Spend</span>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                ₹{totalPurchaseSpend.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Received POs</span>
              <div className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {purchaseOrders.filter((p) => p.status === 'Received').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500">Pending Delivery</span>
              <div className="mt-1 text-xl font-bold text-amber-600 tabular-nums">
                {purchaseOrders.filter((p) => p.status === 'Pending').length}
              </div>
            </div>
          </div>
          <DataTable data={purchaseOrders} columns={purchaseColumns} keyExtractor={(p) => p.id} />
        </div>
      )}
    </div>
  );
}