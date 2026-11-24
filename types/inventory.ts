export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type SaleStatus = 'Paid' | 'Pending' | 'Cancelled';
export type PurchaseStatus = 'Pending' | 'Received' | 'Cancelled';
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

export interface Godown {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  capacityUnits: number;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  godownId: string;
  quantity: number;
  minLevel: number;
  unitCost: number;
  sellingPrice: number;
  unit: string;
  updatedAt: string;
}

export interface OrderLineItem {
  itemId: string;
  itemName: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: SaleStatus;
  items: OrderLineItem[];
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  expectedDate: string;
  status: PurchaseStatus;
  godownId: string;
  items: OrderLineItem[];
  totalAmount: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  qtyChange: number;
  balanceAfter: number;
  reference: string;
  note: string;
  godownName: string;
  timestamp: string;
}

export function getStockStatus(item: Pick<StockItem, 'quantity' | 'minLevel'>): StockStatus {
  if (item.quantity <= 0) return 'Out of Stock';
  if (item.quantity <= item.minLevel) return 'Low Stock';
  return 'In Stock';
}