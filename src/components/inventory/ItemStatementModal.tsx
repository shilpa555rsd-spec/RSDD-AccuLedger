import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem, Voucher, VoucherType, ProductionEntry } from '../../types';
import {
  formatCurrency,
  formatDate,
  openWhatsAppShare,
  getFinancialYearDates,
  getTodayDateString,
} from '../../utils/formatters';
import { generateItemStatementPdf } from '../../utils/pdfGenerator';
import {
  ArrowLeft,
  FileDown,
  Share2,
  Filter,
  Edit2,
  Calendar,
  Search,
  Package,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  Factory,
  Layers,
} from 'lucide-react';

interface ItemStatementModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice?: (voucher: Voucher) => void;
  onEditVoucher?: (voucher: Voucher) => void;
  onEditItem?: (item: InventoryItem) => void;
  onViewProduction?: (production: ProductionEntry) => void;
}

export const ItemStatementModal: React.FC<ItemStatementModalProps> = ({
  item,
  isOpen,
  onClose,
  onViewInvoice,
  onEditVoucher,
  onEditItem,
  onViewProduction,
}) => {
  const { getItemStatement, companyProfile, vouchers, productions } = useAccounting();

  // Date Filter Presets
  const today = getTodayDateString();
  const { start: fyStart, end: fyEnd } = getFinancialYearDates();

  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'thisFY' | 'all' | 'custom'>('thisFY');
  const [startDate, setStartDate] = useState<string>(fyStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [searchTx, setSearchTx] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);

  // Apply preset filter
  const handlePresetChange = (preset: 'thisMonth' | 'lastMonth' | 'thisFY' | 'all' | 'custom') => {
    setDateRange(preset);
    const d = new Date();
    const currYear = d.getFullYear();
    const currMonth = d.getMonth();

    if (preset === 'thisMonth') {
      const firstDay = `${currYear}-${String(currMonth + 1).padStart(2, '0')}-01`;
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === 'lastMonth') {
      const prevMonthDate = new Date(currYear, currMonth - 1, 1);
      const lastDayPrevMonth = new Date(currYear, currMonth, 0);
      const s = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
      const e = `${lastDayPrevMonth.getFullYear()}-${String(lastDayPrevMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrevMonth.getDate()).padStart(2, '0')}`;
      setStartDate(s);
      setEndDate(e);
    } else if (preset === 'thisFY') {
      setStartDate(fyStart);
      setEndDate(today > fyEnd ? fyEnd : today);
    } else if (preset === 'all') {
      setStartDate('2020-04-01');
      setEndDate(today > fyEnd ? fyEnd : today);
    }
  };

  const statementData = useMemo(() => {
    if (!item) return null;
    return getItemStatement(item.id, startDate, endDate);
  }, [item, startDate, endDate, getItemStatement]);

  const filteredTransactions = useMemo(() => {
    if (!statementData) return [];
    if (!searchTx.trim()) return statementData.transactions;
    const q = searchTx.toLowerCase();
    return statementData.transactions.filter(
      (tx) =>
        tx.particulars.toLowerCase().includes(q) ||
        tx.sourceNumber.toLowerCase().includes(q) ||
        tx.typeBadge.toLowerCase().includes(q) ||
        (tx.narration && tx.narration.toLowerCase().includes(q))
    );
  }, [statementData, searchTx]);

  if (!isOpen || !item || !statementData) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await generateItemStatementPdf(statementData, companyProfile, false);
    } catch (err) {
      console.error('Error generating Item PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsExporting(true);
      await generateItemStatementPdf(statementData, companyProfile, true);
    } catch (err) {
      console.error('Error sharing Item PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShareText = () => {
    const summaryText = `*STOCK ITEM STATEMENT: ${item.name}*
Period: ${formatDate(startDate)} to ${formatDate(endDate)}
From: *${companyProfile.companyName}*
--------------------------------
Opening Stock: ${statementData.openingStock} ${item.unit} (${formatCurrency(statementData.openingStockValue)})
Total Inward (+): ${statementData.totalInwardQty} ${item.unit}
Total Outward (-): ${statementData.totalOutwardQty} ${item.unit}
*Closing Stock: ${statementData.closingStock} ${item.unit} (${formatCurrency(statementData.closingStockValue)})*
--------------------------------
Generated via ${companyProfile.companyName}`;

    openWhatsAppShare(summaryText, '');
  };

  const handleEntryClick = (sourceId: string, sourceNumber: string, sourceType: string) => {
    if (sourceType === 'SALE' || sourceType === 'PURCHASE') {
      const targetVoucher = vouchers.find(
        (v) => v.id === sourceId || v.voucherNumber === sourceNumber
      );
      if (targetVoucher) {
        if (onViewInvoice) {
          onViewInvoice(targetVoucher);
        } else if (onEditVoucher) {
          onEditVoucher(targetVoucher);
        }
      } else {
        alert(`Voucher #${sourceNumber} not found.`);
      }
    } else if (sourceType === 'MANUFACTURING_IN' || sourceType === 'MANUFACTURING_OUT') {
      const targetProd = productions.find(
        (p) => p.id === sourceId || p.entryNumber === sourceNumber
      );
      if (targetProd && onViewProduction) {
        onViewProduction(targetProd);
      } else {
        alert(`Manufacturing Batch #${sourceNumber}`);
      }
    }
  };

  const isRaw = item.name.toLowerCase().includes('fabric') || 
                item.name.toLowerCase().includes('aster') || 
                item.name.toLowerCase().includes('zip') || 
                item.name.toLowerCase().includes('thread') ||
                item.name.toLowerCase().includes('raw');

  const isFinished = item.name.toLowerCase().includes('jeans') || 
                     item.name.toLowerCase().includes('shirt') ||
                     item.name.toLowerCase().includes('finished');

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-y-auto animate-in fade-in">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Back button and Item Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title="Back to Inventory"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                  {item.name}
                </h1>
                {isRaw && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    Raw Material
                  </span>
                )}
                {isFinished && (
                  <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    Finished Good
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
                UNIT: {item.unit} • GST: {item.gstRate || 0}% {item.hsnCode ? `• HSN: ${item.hsnCode}` : ''} {item.sku ? `• SKU: ${item.sku}` : ''}
              </p>
            </div>
          </div>

          {/* Actions: Edit, WhatsApp, Report */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onEditItem && (
              <button
                onClick={() => onEditItem(item)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="Edit Item Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppShareText}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="Share Summary via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Report Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                disabled={isExporting}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-700" />
                <span>{isExporting ? 'Exporting...' : 'Report'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isReportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isReportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsReportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsReportMenuOpen(false);
                        handleSharePdf();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Share PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsReportMenuOpen(false);
                        handleDownloadPdf();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-2.5 sm:p-4 space-y-2 sm:space-y-2.5 pb-20">
        {/* 1. FILTER DATE RANGE CARD */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-black text-[11px] sm:text-xs uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>FILTER DATE RANGE</span>
            </div>

            {/* Quick Period Selection Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
              <button
                onClick={() => handlePresetChange('thisMonth')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition cursor-pointer ${
                  dateRange === 'thisMonth'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handlePresetChange('lastMonth')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition cursor-pointer ${
                  dateRange === 'lastMonth'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => handlePresetChange('thisFY')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition cursor-pointer ${
                  dateRange === 'thisFY'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Full FY
              </button>
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition cursor-pointer ${
                  dateRange === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Date Pickers - side by side */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 mb-0.5 tracking-wider">
                FROM DATE
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 mb-0.5 tracking-wider">
                TO DATE
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. OPENING STOCK & RATE INFO CARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-2 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                Opening Stock (शुरुआती स्टॉक)
              </span>
              <div className="text-[11px] text-slate-400">As of {formatDate(startDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-black text-slate-950">
                {statementData.openingStock} {item.unit}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                Val: {formatCurrency(statementData.openingStockValue)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-2 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                Price Valuation
              </span>
              <div className="text-[11px] text-slate-400">Min Alert: {item.minStockAlert || 5} {item.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-700">
                Pur: <span className="font-black text-slate-900">{formatCurrency(item.purchasePrice || 0)}</span>
              </div>
              <div className="text-xs font-bold text-emerald-700">
                Sale: <span className="font-black">{formatCurrency(item.salePrice || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar for transactions */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock movement by party, voucher #, batch #, note..."
            value={searchTx}
            onChange={(e) => setSearchTx(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>

        {/* 3. STOCK TRANSACTIONS / MOVEMENT ENTRIES */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-xs">
            <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">No Stock Transactions Found</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              There are no sales, purchases, or production entries for {item.name} between {formatDate(startDate)} and {formatDate(endDate)}.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {filteredTransactions.map((tx) => {
              const isInward = tx.inwardQty > 0;
              const isOutward = tx.outwardQty > 0;

              return (
                <div
                  key={tx.id}
                  onClick={() => handleEntryClick(tx.sourceId, tx.sourceNumber, tx.sourceType)}
                  className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs space-y-1 hover:border-amber-400 hover:shadow-xs active:scale-[0.99] transition cursor-pointer group"
                  title="Click to view voucher / entry details"
                >
                  {/* Top Row: Date | Type Badge | Ref # | Movement Quantity */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                        {formatDate(tx.date)}
                      </span>
                      <span
                        className={`font-extrabold text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded uppercase tracking-wide transition ${
                          tx.sourceType === 'PURCHASE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.sourceType === 'SALE'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : tx.sourceType === 'MANUFACTURING_IN'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {tx.typeBadge}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 font-mono truncate group-hover:text-amber-700">
                        #{tx.sourceNumber}
                      </span>
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-black tracking-tight shrink-0 flex items-center gap-1 ${
                        isInward ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInward && <ArrowDownLeft className="w-3.5 h-3.5" />}
                      {isOutward && <ArrowUpRight className="w-3.5 h-3.5" />}
                      <span>
                        {isInward ? `+ ${tx.inwardQty} ${item.unit}` : `- ${tx.outwardQty} ${item.unit}`}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Particulars & Running Stock Balance */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-amber-800">
                      {tx.particulars}
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap shrink-0">
                      Bal Stock: <span className="font-black text-slate-900">{tx.runningStock} {item.unit}</span>
                    </div>
                  </div>

                  {/* Rate & Amount Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <div>
                      Rate: <span className="font-semibold text-slate-700">{formatCurrency(tx.rate)}</span> / {item.unit}
                    </div>
                    <div>
                      Total Amount: <span className="font-bold text-slate-800">{formatCurrency(tx.amount)}</span>
                    </div>
                  </div>

                  {/* Narration Row (if exists) */}
                  {tx.narration && (
                    <p className="text-[11px] text-slate-500 italic font-normal truncate">
                      "{tx.narration}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 4. SUMMARY / CLOSING STOCK CARD */}
        <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-md space-y-2.5">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>PERIOD SUMMARY ({formatDate(startDate)} - {formatDate(endDate)})</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono">
              Unit: {item.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800 py-2">
            <div>
              <span className="text-slate-400 block text-[10px]">TOTAL INWARD (आवक)</span>
              <span className="font-black text-emerald-400 text-sm sm:text-base">
                + {statementData.totalInwardQty} {item.unit}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Val: {formatCurrency(statementData.totalInwardValue)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">TOTAL OUTWARD (जावक)</span>
              <span className="font-black text-rose-400 text-sm sm:text-base">
                - {statementData.totalOutwardQty} {item.unit}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Val: {formatCurrency(statementData.totalOutwardValue)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-xs text-slate-300 font-bold block">
                Net Closing Stock (अंतिम स्टॉक)
              </span>
              <span className="text-[11px] text-amber-300/80">
                Valuation: {formatCurrency(statementData.closingStockValue)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-black text-amber-400">
                {statementData.closingStock} {item.unit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
