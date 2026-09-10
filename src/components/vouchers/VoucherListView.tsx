import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Voucher, VoucherType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import {
  ReceiptText,
  Search,
  Plus,
  FileText,
  FileDown,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  BookOpen,
  Eye,
  Filter,
  ChevronDown,
  X,
  PlusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface VoucherListViewProps {
  onOpenNewVoucher: (type: VoucherType) => void;
  onViewInvoice: (voucher: Voucher) => void;
  onEditVoucher: (voucher: Voucher) => void;
}

export const VoucherListView: React.FC<VoucherListViewProps> = ({
  onOpenNewVoucher,
  onViewInvoice,
  onEditVoucher,
}) => {
  const { vouchers, deleteVoucher, companyProfile, ledgers } = useAccounting();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  // Default sort: 'asc' (01/04/26 on top, earlier dates first)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const voucherTypeList: Array<{
    type: VoucherType;
    title: string;
    sub: string;
    shortcut: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgHover: string;
    borderHover: string;
  }> = [
    {
      type: 'SALE',
      title: 'Sale (बिक्री)',
      sub: 'GST Invoice / Bill to Customer',
      shortcut: 'F8',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      bgHover: 'hover:bg-emerald-950/40 hover:border-emerald-500/50',
      borderHover: 'hover:border-emerald-500',
    },
    {
      type: 'PURCHASE',
      title: 'Purchase (खरीद)',
      sub: 'Vendor Bill & Stock Entry',
      shortcut: 'F9',
      icon: TrendingDown,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      bgHover: 'hover:bg-rose-950/40 hover:border-rose-500/50',
      borderHover: 'hover:border-rose-500',
    },
    {
      type: 'PAYMENT',
      title: 'Payment (भुगतान)',
      sub: 'Paid to Supplier / Cash / Bank Out',
      shortcut: 'F5',
      icon: ArrowUpRight,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      bgHover: 'hover:bg-amber-950/40 hover:border-amber-500/50',
      borderHover: 'hover:border-amber-500',
    },
    {
      type: 'RECEIPT',
      title: 'Receipt (प्राप्ति)',
      sub: 'Money Received from Customer / In',
      shortcut: 'F6',
      icon: ArrowDownLeft,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      bgHover: 'hover:bg-cyan-950/40 hover:border-cyan-500/50',
      borderHover: 'hover:border-cyan-500',
    },
    {
      type: 'JOURNAL',
      title: 'Journal (जर्नल)',
      sub: 'JV / Adjustment & Year-end Entry',
      shortcut: 'F7',
      icon: BookOpen,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      bgHover: 'hover:bg-blue-950/40 hover:border-blue-500/50',
      borderHover: 'hover:border-blue-500',
    },
    {
      type: 'CONTRA',
      title: 'Contra (कॉन्ट्रा)',
      sub: 'Bank ⇄ Cash / Internal Transfer',
      shortcut: 'F4',
      icon: ArrowLeftRight,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      bgHover: 'hover:bg-purple-950/40 hover:border-purple-500/50',
      borderHover: 'hover:border-purple-500',
    },
  ];

  const handleSelectVoucher = (type: VoucherType) => {
    setIsAddMenuOpen(false);
    onOpenNewVoucher(type);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesType = selectedType === 'all' || v.type === selectedType;
    const matchesSearch =
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.partyName && v.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.referenceNo && v.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStart = !startDate || v.date >= startDate;
    const matchesEnd = !endDate || v.date <= endDate;

    return matchesType && matchesSearch && matchesStart && matchesEnd;
  });

  // Arrange vouchers strictly by Voucher Date: 01/04/2026 upar, uske bad niche (ascending)
  const sortedVouchers = useMemo(() => {
    return [...filteredVouchers].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateComp = dateA.localeCompare(dateB);
      if (dateComp !== 0) {
        return sortOrder === 'asc' ? dateComp : -dateComp;
      }
      // If dates match, sort by voucher number
      return sortOrder === 'asc'
        ? (a.voucherNumber || '').localeCompare(b.voucherNumber || '', undefined, { numeric: true })
        : (b.voucherNumber || '').localeCompare(a.voucherNumber || '', undefined, { numeric: true });
    });
  }, [filteredVouchers, sortOrder]);

  const handleDelete = (vch: Voucher) => {
    if (confirm(`Are you sure you want to delete ${vch.type} voucher "${vch.voucherNumber}"?`)) {
      deleteVoucher(vch.id);
    }
  };

  const handleDownloadPdfQuick = async (vch: Voucher) => {
    const party = ledgers.find((l) => l.id === vch.partyLedgerId);
    await generateInvoicePdf(vch, party, companyProfile, false);
  };

  const getTypeBadge = (type: VoucherType) => {
    switch (type) {
      case 'SALE':
        return {
          label: 'SALE',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: TrendingUp,
        };
      case 'PURCHASE':
        return {
          label: 'PURCHASE',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: TrendingDown,
        };
      case 'RECEIPT':
        return {
          label: 'RECEIPT',
          color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
          icon: ArrowDownLeft,
        };
      case 'PAYMENT':
        return {
          label: 'PAYMENT',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: ArrowUpRight,
        };
      case 'JOURNAL':
        return {
          label: 'JOURNAL',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: BookOpen,
        };
      case 'CONTRA':
        return {
          label: 'CONTRA',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: ArrowLeftRight,
        };
      default:
        return {
          label: type,
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: ReceiptText,
        };
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 pb-20 max-w-7xl mx-auto relative">
      {/* Header with Title "Vouchers" and Compact Button */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs shrink-0">
            <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate">
            Vouchers
          </h1>
        </div>

        {/* Top Header + Voucher Button with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
            title="Create New Voucher Entry"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span>Voucher</span>
          </button>

          {/* New Voucher Dropdown from Header */}
          {isAddMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAddMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                    + New Voucher (नई प्रविष्टि)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {voucherTypeList.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleSelectVoucher(item.type)}
                        className={`w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-800/50 text-left transition flex items-center justify-between cursor-pointer ${item.bgHover} group`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg border ${item.color} group-hover:scale-110 transition-transform shrink-0`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-extrabold text-slate-200 text-xs group-hover:text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {item.sub}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md shrink-0 border border-slate-700">
                          {item.shortcut}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Invoice No, Party Name, PO Reference..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              placeholder="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              placeholder="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-rose-600 font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Voucher Type Pills & Date Order Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: `All Vouchers (${vouchers.length})` },
              { id: 'SALE', label: 'Sale Invoices' },
              { id: 'PURCHASE', label: 'Purchase Bills' },
              { id: 'RECEIPT', label: 'Receipts' },
              { id: 'PAYMENT', label: 'Payments' },
              { id: 'JOURNAL', label: 'Journal (Dr/Cr)' },
              { id: 'CONTRA', label: 'Contra' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  selectedType === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort order toggle button */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50 hover:bg-amber-100 text-slate-900 font-extrabold text-xs shrink-0 transition cursor-pointer shadow-2xs"
            title="Click to toggle Date Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-700" />
            <span>
              Date Order: {sortOrder === 'asc' ? '01/04/... Upar (Ascending)' : 'Newest First (Descending)'}
            </span>
          </button>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-200 transition select-none group"
                  title="Click to change date sort order"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortOrder === 'asc' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-950 border border-amber-300">
                        <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                        01/04/... First
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                        <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                        Latest First
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-3">Vch No.</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Party Name</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-3 text-right">Grand Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {sortedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ReceiptText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No vouchers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create a new Sale, Purchase, Receipt, or Payment voucher above
                    </p>
                  </td>
                </tr>
              ) : (
                sortedVouchers.map((vch) => {
                  const badge = getTypeBadge(vch.type);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={vch.id}
                      onClick={() => onViewInvoice(vch)}
                      className="hover:bg-amber-50/50 active:bg-amber-100/60 transition cursor-pointer group"
                      title="Click to view full screen Invoice / Voucher"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600">
                        {formatDate(vch.date)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap group-hover:text-amber-700">
                        {vch.voucherNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${badge.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          {vch.entryMode === 'DOUBLE' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                              Dr/Cr
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                        {vch.partyName || 'Party'}
                        {vch.referenceNo && (
                          <div className="text-[10px] font-normal text-slate-400 font-mono">
                            Ref: {vch.referenceNo}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {vch.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {formatCurrency(vch.taxableAmount || vch.subtotal, false)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        {vch.totalGst > 0 ? formatCurrency(vch.totalGst, false) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                        {formatCurrency(vch.grandTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
