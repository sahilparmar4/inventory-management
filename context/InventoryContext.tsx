'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  Godown,
  OrderLineItem,
  PurchaseOrder,
  PurchaseStatus,
  SaleStatus,
  SalesOrder,
  StockItem,
  StockMovement,
} from '@/types/inventory';
import {
  INITIAL_GODOWNS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES_ORDERS,
  INITIAL_STOCK_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
} from '@/data/sampleData';

interface CreateSaleInput {
  customerName: string;
  customerEmail: string;
  status: SaleStatus;
  items: { itemId: string; qty: number }[];
}

interface CreatePurchaseInput {
  supplierName: string;
  expectedDate: string;
  godownId: string;
  status: PurchaseStatus;
  items: { itemId: string; qty: number }[];
}

interface AddStockItemInput {
  sku: string;
  name: string;
  category: string;
  godownId: string;
  quantity: number;
  minLevel: number;
  unitCost: number;
  sellingPrice: number;
  unit: string;
}

interface InventoryContextValue {
  godowns: Godown[];
  stockItems: StockItem[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  createSaleOrder: (input: CreateSaleInput) => { ok: boolean; error?: string };
  updateSaleStatus: (saleId: string, nextStatus: SaleStatus) => void;
  createPurchaseOrder: (input: CreatePurchaseInput) => { ok: boolean; error?: string };
  receivePurchaseOrder: (poId: string) => void;
  cancelPurchaseOrder: (poId: string) => void;
  adjustStock: (itemId: string, delta: number, note: string) => void;
  transferStock: (itemId: string, targetGodownId: string, qty: number, note: string) => { ok: boolean; error?: string };
  addStockItem: (input: AddStockItemInput) => { ok: boolean; error?: string };
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function nowTimestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [godowns] = useState<Godown[]>(INITIAL_GODOWNS);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(INITIAL_SALES_ORDERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);

  const getGodownName = (godownId: string) =>
    godowns.find((g) => g.id === godownId)?.name ?? 'Main Hub';

  const createSaleOrder = (input: CreateSaleInput): { ok: boolean; error?: string } => {
    if (!input.customerName.trim() || input.items.length === 0) {
      return { ok: false, error: 'Customer name and at least one item are required.' };
    }

    if (input.status !== 'Cancelled') {
      for (const line of input.items) {
        const stock = stockItems.find((s) => s.id === line.itemId);
        if (!stock) return { ok: false, error: 'Selected item not found.' };
        if (line.qty <= 0) return { ok: false, error: 'Quantity must be greater than zero.' };
        if (stock.quantity < line.qty) {
          return {
            ok: false,
            error: `Insufficient stock for ${stock.name} (${stock.quantity} ${stock.unit} available).`,
          };
        }
      }
    }

    const orderNumber = `INV-2026-${1085 + salesOrders.length}`;
    const ts = nowTimestamp();
    const orderLines: OrderLineItem[] = [];
    const newMovements: StockMovement[] = [];

    const updatedStock = stockItems.map((item) => {
      const line = input.items.find((l) => l.itemId === item.id);
      if (!line) return item;
      orderLines.push({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        qty: line.qty,
        unitPrice: item.sellingPrice,
      });

      if (input.status === 'Cancelled') return item;

      const nextQty = item.quantity - line.qty;
      newMovements.push({
        id: `mov-${Date.now()}-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: 'OUT',
        qtyChange: -line.qty,
        balanceAfter: nextQty,
        reference: orderNumber,
        note: `Sale to ${input.customerName.trim()}`,
        godownName: getGodownName(item.godownId),
        timestamp: ts,
      });
      return { ...item, quantity: nextQty, updatedAt: ts };
    });

    const totalAmount = orderLines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim() || 'billing@customer.com',
      date: todayDate(),
      status: input.status,
      items: orderLines,
      totalAmount,
    };

    setStockItems(updatedStock);
    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }
    setSalesOrders((prev) => [newOrder, ...prev]);
    return { ok: true };
  };

  const updateSaleStatus = (saleId: string, nextStatus: SaleStatus) => {
    const target = salesOrders.find((o) => o.id === saleId);
    if (!target || target.status === nextStatus) return;

    const ts = nowTimestamp();
    const wasActive = target.status !== 'Cancelled';
    const willBeActive = nextStatus !== 'Cancelled';

    if (wasActive !== willBeActive) {
      const direction = willBeActive ? -1 : 1;
      const newMovements: StockMovement[] = [];

      const nextStock = stockItems.map((item) => {
        const line = target.items.find((l) => l.itemId === item.id);
        if (!line) return item;
        const delta = direction * line.qty;
        const nextQty = Math.max(0, item.quantity + delta);
        newMovements.push({
          id: makeId('mov'),
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          type: delta > 0 ? 'IN' : 'OUT',
          qtyChange: delta,
          balanceAfter: nextQty,
          reference: target.orderNumber,
          note: delta > 0 ? 'Order cancelled — stock restored' : 'Order reactivated',
          godownName: getGodownName(item.godownId),
          timestamp: ts,
        });
        return { ...item, quantity: nextQty, updatedAt: ts };
      });

      setStockItems(nextStock);
      if (newMovements.length > 0) {
        setStockMovements((prev) => [...newMovements, ...prev]);
      }
    }

    setSalesOrders((prev) =>
      prev.map((o) => (o.id === saleId ? { ...o, status: nextStatus } : o))
    );
  };

  const createPurchaseOrder = (input: CreatePurchaseInput): { ok: boolean; error?: string } => {
    if (!input.supplierName.trim() || input.items.length === 0) {
      return { ok: false, error: 'Supplier name and at least one item are required.' };
    }

    const poNumber = `PO-2026-${410 + purchaseOrders.length}`;
    const ts = nowTimestamp();
    const poLines: OrderLineItem[] = [];
    const newMovements: StockMovement[] = [];

    const updatedStock = stockItems.map((item) => {
      const line = input.items.find((l) => l.itemId === item.id);
      if (!line) return item;
      poLines.push({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        qty: line.qty,
        unitPrice: item.unitCost,
      });

      if (input.status !== 'Received') return item;

      const nextQty = item.quantity + line.qty;
      newMovements.push({
        id: `mov-${Date.now()}-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: 'IN',
        qtyChange: line.qty,
        balanceAfter: nextQty,
        reference: poNumber,
        note: `Received from ${input.supplierName.trim()}`,
        godownName: getGodownName(input.godownId),
        timestamp: ts,
      });
      return { ...item, quantity: nextQty, updatedAt: ts };
    });

    const totalAmount = poLines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierName: input.supplierName.trim(),
      date: todayDate(),
      expectedDate: input.expectedDate || todayDate(),
      status: input.status,
      godownId: input.godownId,
      items: poLines,
      totalAmount,
    };

    if (input.status === 'Received') {
      setStockItems(updatedStock);
      if (newMovements.length > 0) {
        setStockMovements((prev) => [...newMovements, ...prev]);
      }
    }
    setPurchaseOrders((prev) => [newPO, ...prev]);
    return { ok: true };
  };

  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status !== 'Pending') return;

    const ts = nowTimestamp();
    const newMovements: StockMovement[] = [];

    setStockItems((prev) =>
      prev.map((item) => {
        const line = po.items.find((l) => l.itemId === item.id);
        if (!line) return item;
        const nextQty = item.quantity + line.qty;
        newMovements.push({
          id: `mov-${Date.now()}-${item.id}`,
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          type: 'IN',
          qtyChange: line.qty,
          balanceAfter: nextQty,
          reference: po.poNumber,
          note: `PO received from ${po.supplierName}`,
          godownName: getGodownName(po.godownId),
          timestamp: ts,
        });
        return { ...item, quantity: nextQty, updatedAt: ts };
      })
    );

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'Received' } : p))
    );
  };

  const cancelPurchaseOrder = (poId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId && p.status === 'Pending' ? { ...p, status: 'Cancelled' } : p))
    );
  };

  const adjustStock = (itemId: string, delta: number, note: string) => {
    if (delta === 0) return;
    const ts = nowTimestamp();
    const target = stockItems.find((s) => s.id === itemId);
    if (!target) return;

    const nextQty = Math.max(0, target.quantity + delta);
    const actualDelta = nextQty - target.quantity;

    setStockItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: nextQty, updatedAt: ts } : item))
    );

    setStockMovements((prev) => [
      {
        id: `mov-${Date.now()}`,
        itemId: target.id,
        itemName: target.name,
        sku: target.sku,
        type: 'ADJUST',
        qtyChange: actualDelta,
        balanceAfter: nextQty,
        reference: `ADJ-${String(Date.now()).slice(-4)}`,
        note: note.trim() || 'Manual stock adjustment',
        godownName: getGodownName(target.godownId),
        timestamp: ts,
      },
      ...prev,
    ]);
  };

  const transferStock = (
    itemId: string,
    targetGodownId: string,
    qty: number,
    note: string
  ): { ok: boolean; error?: string } => {
    const source = stockItems.find((s) => s.id === itemId);
    if (!source) return { ok: false, error: 'Source item not found.' };
    if (source.godownId === targetGodownId) {
      return { ok: false, error: 'Destination godown must differ from current godown.' };
    }
    if (qty <= 0 || qty > source.quantity) {
      return { ok: false, error: `Transfer quantity must be between 1 and ${source.quantity}.` };
    }

    const ts = nowTimestamp();
    const trfRef = `TRF-${String(Date.now()).slice(-4)}`;
    const sourceGodown = getGodownName(source.godownId);
    const destGodown = getGodownName(targetGodownId);

    const existingDest = stockItems.find(
      (s) => s.sku === source.sku && s.godownId === targetGodownId
    );

    const nextSourceQty = source.quantity - qty;
    let nextDestQty = qty;

    if (existingDest) {
      nextDestQty = existingDest.quantity + qty;
      setStockItems((prev) =>
        prev.map((item) => {
          if (item.id === source.id) return { ...item, quantity: nextSourceQty, updatedAt: ts };
          if (item.id === existingDest.id) return { ...item, quantity: nextDestQty, updatedAt: ts };
          return item;
        })
      );
    } else {
      const clonedItem: StockItem = {
        ...source,
        id: `itm-${Date.now()}`,
        godownId: targetGodownId,
        quantity: qty,
        updatedAt: ts,
      };
      setStockItems((prev) => [
        ...prev.map((item) => (item.id === source.id ? { ...item, quantity: nextSourceQty, updatedAt: ts } : item)),
        clonedItem,
      ]);
    }

    setStockMovements((prev) => [
      {
        id: `mov-${Date.now()}-in`,
        itemId: existingDest?.id ?? source.id,
        itemName: source.name,
        sku: source.sku,
        type: 'TRANSFER',
        qtyChange: qty,
        balanceAfter: nextDestQty,
        reference: trfRef,
        note: note.trim() || `Transferred from ${sourceGodown}`,
        godownName: destGodown,
        timestamp: ts,
      },
      {
        id: `mov-${Date.now()}-out`,
        itemId: source.id,
        itemName: source.name,
        sku: source.sku,
        type: 'TRANSFER',
        qtyChange: -qty,
        balanceAfter: nextSourceQty,
        reference: trfRef,
        note: note.trim() || `Transferred to ${destGodown}`,
        godownName: sourceGodown,
        timestamp: ts,
      },
      ...prev,
    ]);

    return { ok: true };
  };

  const addStockItem = (input: AddStockItemInput): { ok: boolean; error?: string } => {
    if (!input.sku.trim() || !input.name.trim()) {
      return { ok: false, error: 'SKU and Item Name are required.' };
    }
    const ts = nowTimestamp();
    const newItem: StockItem = {
      id: `itm-${Date.now()}`,
      sku: input.sku.trim().toUpperCase(),
      name: input.name.trim(),
      category: input.category,
      godownId: input.godownId,
      quantity: Math.max(0, input.quantity),
      minLevel: Math.max(0, input.minLevel),
      unitCost: Math.max(0, input.unitCost),
      sellingPrice: Math.max(0, input.sellingPrice),
      unit: input.unit || 'pcs',
      updatedAt: ts,
    };

    setStockItems((prev) => [newItem, ...prev]);
    if (newItem.quantity > 0) {
      setStockMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          itemId: newItem.id,
          itemName: newItem.name,
          sku: newItem.sku,
          type: 'IN',
          qtyChange: newItem.quantity,
          balanceAfter: newItem.quantity,
          reference: 'OPENING',
          note: 'Initial opening stock',
          godownName: getGodownName(newItem.godownId),
          timestamp: ts,
        },
        ...prev,
      ]);
    }
    return { ok: true };
  };

  return (
    <InventoryContext.Provider
      value={{
        godowns,
        stockItems,
        salesOrders,
        purchaseOrders,
        stockMovements,
        createSaleOrder,
        updateSaleStatus,
        createPurchaseOrder,
        receivePurchaseOrder,
        cancelPurchaseOrder,
        adjustStock,
        transferStock,
        addStockItem,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}