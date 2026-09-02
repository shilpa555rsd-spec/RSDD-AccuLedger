import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountLedger, Voucher, VoucherType } from '../../types';
import {
  formatCurrency,
  formatDate,
  openWhatsAppShare,
  getFinancialYearDates,
  getTodayDateString,
} from '../../utils/formatters';
import { generateLedgerStatementPdf } from '../../utils/pdfGenerator';
import {
  ArrowLeft,
  FileDown,
  Share2,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

interface LedgerStatementModalProps {
  ledger: AccountLedger | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNewVoucher?: (type: VoucherType, partyId?: string) => void;
  onViewInvoice?: (voucher: Voucher) => void;
  onEditVoucher?: (voucher: Voucher) => void;
  onEditLedger?: (ledger: AccountLedger) => void;
}

export const LedgerStatementModal: React.FC<LedgerStatementModalProps> = ({
  ledger,
  isOpen,
  onClose,
  onOpenNewVoucher,
  onViewInvoice,
  onEditVoucher,
  onEditLedger,
}) => {
  const { getLedgerStatement, companyProfile, groups, vouchers, deleteVoucher } = useAccounting();

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
    if (!ledger) return null;
    return getLedgerStatement(ledger.id, startDate, endDate);
  }, [ledger, startDate, endDate, getLedgerStatement]);

  const filteredTransactions = useMemo(() => {
    if (!statementData) return [];
    if (!searchTx.trim()) return statementData.transactions;
    const q = searchTx.toLowerCase();
    return statementData.transactions.filter(
      (tx) =>
        tx.particulars.toLowerCase().includes(q) ||
        tx.voucherNumber.toLowerCase().includes(q) ||
        tx.voucherType.toLowerCase().includes(q) ||
        (tx.narration && tx.narration.toLowerCase().includes(q))
    );
  }, [statementData, searchTx]);

  if (!isOpen || !ledger || !statementData) return null;

  const group = groups.find((g) => g.id === ledger.groupId);

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await generateLedgerStatementPdf(statementData, companyProfile, false);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsExporting(true);
      await generateLedgerStatementPdf(statementData, companyProfile, true);
    } catch (err) {
      console.error('Error sharing PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShareText = () => {
    const summaryText = `*LEDGER STATEMENT: ${ledger.name}*
Period: ${formatDate(startDate)} to ${formatDate(endDate)}
From: *${companyProfile.companyName}*
--------------------------------
Opening Balance: ${formatCurrency(statementData.openingBalance)} ${statementData.openingBalanceType}
Total Debit (+): ${formatCurrency(statementData.totalDebit)}
Total Credit (-): ${formatCurrency(statementData.totalCredit)}
*Closing Balance: ${formatCurrency(statementData.closingBalance)} ${statementData.closingBalanceType}*
--------------------------------
Generated via ${companyProfile.companyName}`;

    openWhatsAppShare(summaryText, ledger.phone);
  };

  const handleEntryClick = (voucherId: string, voucherNumber: string) => {
    const targetVoucher = vouchers.find(
      (v) => v.id === voucherId || v.voucherNumber === voucherNumber
    );
    if (targetVoucher) {
      if (onViewInvoice) {
        onViewInvoice(targetVoucher);
      } else if (onEditVoucher) {
        onEditVoucher(targetVoucher);
      }
    } else {
      alert(`Voucher ${voucherNumber} is an opening balance or automated record.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-y-auto animate-in fade-in">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Back button and Ledger Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                {ledger.name}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
                {group?.name?.toUpperCase() || 'GENERAL LEDGER'}
                {ledger.gstin ? ` • GSTIN: ${ledger.gstin}` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Party, Report Dropdown & Quick Share */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onEditLedger && (
              <button
                type="button"
                onClick={() => onEditLedger(ledger)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-full shadow-xs transition active:scale-95 cursor-pointer"
                title="Modify / Edit Account Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modify</span>
              </button>
            )}

            {/* Report Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                disabled={isExporting}
                className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs rounded-full shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer"
                title="Report Options"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generating...' : 'Report'}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isReportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isReportMenuOpen && (
                <>
                  {/* Backdrop to dismiss dropdown */}
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsReportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsReportMenuOpen(false);
                        handleSharePdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-sky-600" />
                      <span>Share PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsReportMenuOpen(false);
                        handleDownloadPdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600" />
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
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              <span>FILTER DATE RANGE</span>
            </div>

            {/* Quick Period Selection Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
              <button
                onClick={() => handlePresetChange('thisMonth')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition ${
                  dateRange === 'thisMonth'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handlePresetChange('lastMonth')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition ${
                  dateRange === 'lastMonth'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => handlePresetChange('thisFY')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition ${
                  dateRange === 'thisFY'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Full FY
              </button>
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] transition ${
                  dateRange === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Date Pickers - Adjusted side-by-side in one single straight line */}
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
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition cursor-pointer"
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
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. OPENING BALANCE CARD */}
        <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-2 shadow-xs flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            Opening Balance
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-950">
            ₹ {formatCurrency(statementData.openingBalance, false)}{' '}
            <span className="text-slate-600 font-bold text-[10px] sm:text-xs">{statementData.openingBalanceType}</span>
          </span>
        </div>

        {/* Search Bar for transactions */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions, note, voucher #..."
            value={searchTx}
            onChange={(e) => setSearchTx(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* 3. TRANSACTION CARDS LIST */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 text-center shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">No Transactions Found</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              There are no voucher records for {ledger.name} between {formatDate(startDate)} and {formatDate(endDate)}.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.credit > 0;
              const formattedAmt = isCredit
                ? `- ₹ ${formatCurrency(tx.credit, false)} CR`
                : `+ ₹ ${formatCurrency(tx.debit, false)} DR`;

              return (
                <div
                  key={tx.id}
                  onClick={() => handleEntryClick(tx.voucherId, tx.voucherNumber)}
                  className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs space-y-1 hover:border-amber-400 hover:shadow-xs active:scale-[0.99] transition cursor-pointer group"
                  title="Click to view / manage voucher entry"
                >
                  {/* Top Row: Date | Type Badge | Voucher # | Amount */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                        {formatDate(tx.date)}
                      </span>
                      <span className="bg-sky-50 text-sky-700 font-extrabold text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded uppercase tracking-wide group-hover:bg-amber-100 group-hover:text-amber-900 transition">
                        {tx.voucherType}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 font-mono truncate group-hover:text-amber-700">
                        #{tx.voucherNumber}
                      </span>
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-black tracking-tight shrink-0 ${
                        isCredit ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formattedAmt}
                    </div>
                  </div>

                  {/* Middle Row: Particulars & Running Balance */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-amber-800">
                      {tx.particulars}
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0">
                      Bal: ₹ {formatCurrency(tx.runningBalance, false)}{' '}
                      <span className="text-[10px]">{tx.balanceType}</span>
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

        {/* 4. CLOSING BALANCE / TOTALS SUMMARY CARD */}
        <div className="bg-slate-900 text-white rounded-xl p-2.5 sm:p-3 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>PERIOD SUMMARY</span>
            <span>{formatDate(startDate)} to {formatDate(endDate)}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-800">
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400">Total Debit (+)</div>
              <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">
                ₹ {formatCurrency(statementData.totalDebit, false)}
              </div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400">Total Credit (-)</div>
              <div className="text-xs sm:text-sm font-black text-rose-400 mt-0.5">
                ₹ {formatCurrency(statementData.totalCredit, false)}
              </div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-amber-400">Closing Balance</div>
              <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
                ₹ {formatCurrency(statementData.closingBalance, false)} {statementData.closingBalanceType}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
