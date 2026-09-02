import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  Package,
  AlertTriangle,
  Receipt,
  Users,
  Plus,
  ArrowRight,
  Eye,
  FileText,
  Trash2,
} from 'lucide-react';
import { AccountLedger, CompanyProfile, Voucher, VoucherType } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: 'dashboard' | 'vouchers' | 'ledgers' | 'inventory' | 'reports') => void;
  onOpenNewVoucher: (type: VoucherType, partyId?: string) => void;
  onOpenAddParty: () => void;
  onOpenAddItem: () => void;
  onViewInvoice: (voucher: Voucher) => void;
  onOpenStatement: (ledger: AccountLedger) => void;
  onOpenCreateCompany?: () => void;
  onOpenCompanyManager?: () => void;
  onOpenDeleteCompany?: (company: CompanyProfile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewVoucher,
  onOpenAddParty,
  onOpenAddItem,
  onViewInvoice,
  onOpenStatement,
  onOpenCreateCompany,
  onOpenCompanyManager,
  onOpenDeleteCompany,
}) => {
  const {
    vouchers,
    ledgers,
    items,
    totalSales,
    totalPurchases,
    totalReceivables,
    totalPayables,
    totalCashBank,
    cashBalance,
    bankBalance,
    lowStockItems,
    companyProfile,
    companies,
  } = useAccounting();

  // Recent 6 transactions
  const recentVouchers = [...vouchers].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  // Top 4 Debtors (Customers to collect money from)
  const topDebtors = ledgers
    .filter((l) => l.groupId.includes('debtor') && l.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <div
          onClick={() => onNavigateTab('vouchers')}
          className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Sales (बिक्री)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>View sales register</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div
          onClick={() => onNavigateTab('vouchers')}
          className="p-4 bg-white border border-slate-200 hover:border-rose-300 rounded-2xl shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Purchases (खरीद)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatCurrency(totalPurchases)}
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>View purchase bills</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Receivables (To Collect) */}
        <div
          onClick={() => onNavigateTab('ledgers')}
          className="p-4 bg-emerald-50/60 border border-emerald-200 hover:border-emerald-300 rounded-2xl shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">To Receive (लेने हैं)</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-emerald-950">
              {formatCurrency(totalReceivables)}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>Sundry Debtors • Khata</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Payables (To Pay) */}
        <div
          onClick={() => onNavigateTab('ledgers')}
          className="p-4 bg-rose-50/60 border border-rose-200 hover:border-rose-300 rounded-2xl shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">To Pay (देने हैं)</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-rose-950">
              {formatCurrency(totalPayables)}
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>Sundry Creditors</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Cash & Bank + Low Stock Alert Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Bank & Cash Balances Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span>Cash & Bank Balances (रोकड़/बैंक)</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">Cash in Hand</div>
                  <div className="text-[10px] text-slate-400">Cash Register</div>
                </div>
              </div>
              <span className="font-black text-slate-900">{formatCurrency(cashBalance)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">Bank Accounts</div>
                  <div className="text-[10px] text-slate-400">HDFC, SBI, etc.</div>
                </div>
              </div>
              <span className="font-black text-slate-900">{formatCurrency(bankBalance)}</span>
            </div>
          </div>

          <div className="pt-1 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Total Liquid Funds:</span>
            <span className="text-sm font-black text-emerald-700">
              {formatCurrency(cashBalance + bankBalance)}
            </span>
          </div>
        </div>

        {/* Low Stock Watch */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Inventory & Stock Alert</span>
            </span>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              View all ({items.length})
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              All inventory items are in healthy stock.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-rose-50/70 border border-rose-100 rounded-xl text-xs"
                >
                  <div className="truncate max-w-[150px]">
                    <div className="font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-rose-700">Min limit: {item.minStockAlert || 5} {item.unit}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-700">{item.currentStock} {item.unit}</span>
                    <span className="block text-[9px] font-bold text-rose-600 uppercase">Reorder</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onOpenAddItem}
            className="w-full py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            + Add New Product / Stock
          </button>
        </div>

        {/* Top Debtors / Quick Statement */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Top Customers (Pending Balances)</span>
            </span>
            <button
              onClick={() => onNavigateTab('ledgers')}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              View all ({ledgers.length})
            </button>
          </div>

          <div className="space-y-2">
            {topDebtors.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No outstanding customer dues!
              </div>
            ) : (
              topDebtors.map((deb) => (
                <div
                  key={deb.id}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                >
                  <div className="truncate max-w-[140px]">
                    <div className="font-bold text-slate-900 truncate">{deb.name}</div>
                    <div className="text-[10px] text-slate-400">{deb.city || 'Customer'}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700">{formatCurrency(deb.currentBalance)}</span>
                    <button
                      onClick={() => onOpenStatement(deb)}
                      className="p-1 text-slate-500 hover:text-slate-900 bg-white rounded border border-slate-200 shadow-2xs"
                      title="Ledger Statement PDF"
                    >
                      <FileText className="w-3 h-3 text-amber-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onOpenAddParty}
            className="w-full py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            + Add New Party / Customer
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions (हाल के वाउचर)</h2>
          </div>
          <button
            onClick={() => onNavigateTab('vouchers')}
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            <span>View All Vouchers</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3">Vch No.</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">Invoice / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recentVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions yet. Create your first Sale or Purchase above!
                  </td>
                </tr>
              ) : (
                recentVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">{formatDate(v.date)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.voucherNumber}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.type === 'SALE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.type === 'PURCHASE'
                            ? 'bg-rose-100 text-rose-800'
                            : v.type === 'RECEIPT'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                      {v.partyName || 'Party'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.paymentMode}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {formatCurrency(v.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onViewInvoice(v)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] transition"
                      >
                        <Eye className="w-3 h-3 text-amber-600" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
