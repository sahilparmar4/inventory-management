'use client';

import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    Clock,
    DollarSign,
    IndianRupee,
    PackageCheck,
    TrendingUp,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';
import StatsCard from './StatsCard';
import { useRouter } from 'next/navigation';

interface DashboardViewProps {
    onNavigate: (tab: 'dashboard' | 'sales' | 'purchase' | 'stock' | 'godowns' | 'reports') => void;
    onQuickReorder: (itemId: string) => void;
}

export default function DashboardView({ onNavigate, onQuickReorder }: DashboardViewProps) {
    const router = useRouter();
    
    const { stockItems, salesOrders, purchaseOrders, stockMovements, godowns } = useInventory();

    const totalStockValue = stockItems.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const totalUnits = stockItems.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockItems = stockItems.filter((i) => getStockStatus(i) !== 'In Stock');
    const pendingPOs = purchaseOrders.filter((p) => p.status === 'Pending');
    const paidSalesRevenue = salesOrders
        .filter((s) => s.status !== 'Cancelled')
        .reduce((sum, s) => sum + s.totalAmount, 0);

    const categoryTotals = stockItems.reduce<Record<string, { value: number; units: number }>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = { value: 0, units: 0 };
        acc[item.category].value += item.quantity * item.unitCost;
        acc[item.category].units += item.quantity;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                    title="Inventory Value"
                    value={`₹${totalStockValue.toLocaleString('en-IN')}`}
                    subtitle={`${totalUnits.toLocaleString('en-IN')} units across ${stockItems.length} SKUs`}
                    icon={IndianRupee}
                    iconClassName="bg-indigo-50 text-indigo-600"
                />
                <StatsCard
                    title="Sales Revenue"
                    value={`₹${paidSalesRevenue.toLocaleString('en-IN')}`}
                    subtitle={`${salesOrders.filter((s) => s.status !== 'Cancelled').length} active orders`}
                    icon={TrendingUp}
                    iconClassName="bg-emerald-50 text-emerald-600"
                    onClick={() => router.push('/sales')}
                />
                <StatsCard
                    title="Low / Out of Stock"
                    value={lowStockItems.length}
                    subtitle={`${lowStockItems.filter((i) => i.quantity === 0).length} out of stock — Needs attention`}
                    subtitleClassName="text-amber-700 font-medium"
                    icon={AlertTriangle}
                    iconClassName="bg-amber-50 text-amber-600"
                    hoverBorderClassName="hover:border-amber-300"
                    onClick={() => router.push('/stock')}
                />
                <StatsCard
                    title="Pending Purchases"
                    value={pendingPOs.length}
                    subtitle={`₹${pendingPOs.reduce((s, p) => s + p.totalAmount, 0).toLocaleString('en-IN')} incoming value`}
                    icon={PackageCheck}
                    iconClassName="bg-sky-50 text-sky-600"
                    hoverBorderClassName="hover:border-indigo-300"
                    onClick={() => router.push('/purchase')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h2>
                            <p className="text-xs text-slate-500">Items at or below minimum threshold</p>
                        </div>
                        <button onClick={() => router.push('/stock')} className="text-xs font-medium cursor-pointer text-indigo-600 hover:text-indigo-700">
                            View all stock →
                        </button>
                    </div>
                    {lowStockItems.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                            All SKUs are healthy and above minimum stock levels.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {lowStockItems.map((item) => {
                                const status = getStockStatus(item);
                                const godown = godowns.find((g) => g.id === item.godownId);
                                return (
                                    <div
                                        key={item.id}
                                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">{item.name}</span>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${status === 'Out of Stock'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {item.sku} · {godown?.name ?? 'Warehouse'} · Min {item.minLevel} {item.unit}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-slate-900 tabular-nums">
                                                    {item.quantity} {item.unit}
                                                </div>
                                                <div className="text-[11px] text-slate-400">on hand</div>
                                            </div>
                                            <button
                                                onClick={() => onQuickReorder(item.id)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-900 cursor-pointer hover:bg-slate-800 text-white text-xs font-medium transition"
                                            >
                                                Reorder
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
                            <p className="text-xs text-slate-500">Live ledger across sales &amp; purchases</p>
                        </div>
                        <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                        {stockMovements.slice(0, 8).map((mov) => {
                            const isIn = mov.qtyChange > 0;
                            return (
                                <div key={mov.id} className="px-5 py-3 flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}
                                    >
                                        {isIn ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-medium text-slate-900 truncate">{mov.itemName}</p>
                                            <span className={`text-xs font-semibold tabular-nums ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isIn ? `+${mov.qtyChange}` : mov.qtyChange} </span> </div> <p className="text-[11px] text-slate-500 truncate">{mov.reference} · {mov.note}</p> <p className="text-[10px] text-slate-400 mt-0.5">{mov.timestamp}</p> </div> </div>);
                        })} </div> </div> </div>  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"> <div className="flex items-center justify-between mb-4"> <div className="flex items-center gap-2"> <Boxes className="h-4 w-4 text-indigo-600" /> <h2 className="text-sm font-semibold text-slate-900">Stock Valuation by Category</h2> </div> <button onClick={() => onNavigate('reports')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"> Open Reports → </button> </div> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {Object.entries(categoryTotals).map(([category, data]) => {
                            const pct = totalStockValue > 0 ? Math.round((data.value / totalStockValue) * 100) : 0; return (<div key={category} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100"> <div className="flex items-center justify-between text-xs"> <span className="font-medium text-slate-700">{category}</span> <span className="text-slate-500 tabular-nums">{pct}\%</span> </div> <div className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums"> ${data.value.toLocaleString()} </div> <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"> <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                                <p className="mt-1.5 text-[11px] text-slate-500">{data.units} units in stock</p>
                            </div>
                            );
                        })}
                        </div>
            </div>
        </div>
    );
}