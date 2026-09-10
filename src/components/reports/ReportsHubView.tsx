import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountLedger } from '../../types';
import {
  formatCurrency,
  formatDate,
  getFinancialYearDates,
  getTodayDateString,
  openWhatsAppShare,
} from '../../utils/formatters';
import {
  generateLedgerStatementPdf,
  generateGSTReportPdf,
  generateStockSummaryPdf,
} from '../../utils/pdfGenerator';
import {
  FileSpreadsheet,
  FileText,
  Percent,
  Calendar,
  FileDown,
  Share2,
  Layers,
  CheckCircle2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Receipt,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export const ReportsHubView: React.FC = () => {
  const {
    ledgers,
    groups,
    items,
    getLedgerStatement,
    getGSTR1Summary,
    getGSTR3BSummary,
    getProfitAndLoss,
    getBalanceSheet,
    getDayBook,
    companyProfile,
  } = useAccounting();

  // Active Report Tab (Default to Balance Sheet)
  const [activeReport, setActiveReport] = useState<
    'ledger' | 'gst' | 'pnl' | 'balancesheet' | 'daybook' | 'stock'
  >('balancesheet');

  // Date filters
  const today = getTodayDateString();
  const { start: fyStart, end: fyEnd } = getFinancialYearDates();
  const [startDate, setStartDate] = useState(fyStart);
  const [endDate, setEndDate] = useState(today);
  const [periodType, setPeriodType] = useState<
    'monthly' | 'quarterly' | 'halfyearly' | 'yearly' | 'custom'
  >('yearly');

  const handlePeriodTypeChange = (
    type: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly' | 'custom'
  ) => {
    setPeriodType(type);
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (type === 'monthly') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      setStartDate(toDateString(start));
      setEndDate(toDateString(end));
    } else if (type === 'quarterly') {
      // Q1: Apr-Jun (3-5), Q2: Jul-Sep (6-8), Q3: Oct-Dec (9-11), Q4: Jan-Mar (0-2)
      let qStartMonth = 3;
      let qYear = currentYear;
      if (currentMonth >= 3 && currentMonth <= 5) {
        qStartMonth = 3;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        qStartMonth = 6;
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        qStartMonth = 9;
      } else {
        qStartMonth = 0;
      }
      const start = new Date(qYear, qStartMonth, 1);
      const end = new Date(qYear, qStartMonth + 3, 0);
      setStartDate(toDateString(start));
      setEndDate(toDateString(end));
    } else if (type === 'halfyearly') {
      // H1 (Apr-Sep) or H2 (Oct-Mar) in Indian FY
      let hStartMonth = 3;
      let hYear = currentYear;
      if (currentMonth >= 3 && currentMonth <= 8) {
        hStartMonth = 3; // Apr 1 - Sep 30
      } else {
        if (currentMonth < 3) {
          hYear = currentYear - 1;
        }
        hStartMonth = 9; // Oct 1 - Mar 31
      }
      const start = new Date(hYear, hStartMonth, 1);
      const end = new Date(hYear + (hStartMonth === 9 ? 1 : 0), (hStartMonth + 6) % 12, 0);
      setStartDate(toDateString(start));
      setEndDate(toDateString(end));
    } else if (type === 'yearly') {
      setStartDate(fyStart);
      setEndDate(fyEnd);
    }
  };

  // Dynamic Period Display Labels
  const currentFyLabel = useMemo(() => {
    const { start, end } = getFinancialYearDates();
    const sYear = start.slice(0, 4);
    const eYear = end.slice(2, 4);
    return `FY ${sYear}-${eYear}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, []);

  const currentQuarterLabel = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    if (m >= 3 && m <= 5) return `Q1 (Apr - Jun ${y})`;
    if (m >= 6 && m <= 8) return `Q2 (Jul - Sep ${y})`;
    if (m >= 9 && m <= 11) return `Q3 (Oct - Dec ${y})`;
    return `Q4 (Jan - Mar ${y})`;
  }, []);

  const currentHalfYearLabel = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    if (m >= 3 && m <= 8) return `H1 (Apr - Sep ${y})`;
    return `H2 (Oct - Mar ${m < 3 ? y : y + 1})`;
  }, []);

  // Dynamic Period Display Label
  const getPeriodLabel = () => {
    try {
      if (!startDate) return '';
      if (periodType === 'yearly') {
        const sYear = startDate.slice(0, 4);
        const eYear = endDate ? endDate.slice(2, 4) : '';
        return eYear ? `FY ${sYear}-${eYear}` : `FY ${sYear}`;
      }
      if (periodType === 'monthly') {
        const parts = startDate.split('-');
        if (parts.length >= 2) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
          return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        }
      }
      if (periodType === 'quarterly') {
        const parts = startDate.split('-');
        if (parts.length >= 2) {
          const m = Number(parts[1]) - 1;
          const y = Number(parts[0]);
          if (m >= 3 && m <= 5) return `Q1 (Apr - Jun ${y})`;
          if (m >= 6 && m <= 8) return `Q2 (Jul - Sep ${y})`;
          if (m >= 9 && m <= 11) return `Q3 (Oct - Dec ${y})`;
          return `Q4 (Jan - Mar ${y})`;
        }
      }
      if (periodType === 'halfyearly') {
        const parts = startDate.split('-');
        if (parts.length >= 2) {
          const m = Number(parts[1]) - 1;
          const y = Number(parts[0]);
          if (m >= 3 && m <= 8) return `H1 (Apr - Sep ${y})`;
          return `H2 (Oct - Mar ${y + 1})`;
        }
      }
    } catch {
      return '';
    }
    return '';
  };

  // Selected Ledger for Statement
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>(ledgers[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [isGstMenuOpen, setIsGstMenuOpen] = useState(false);
  const [isStockMenuOpen, setIsStockMenuOpen] = useState(false);

  // Day book date
  const [dayBookDate, setDayBookDate] = useState(today);

  // Computed data
  const selectedLedger = useMemo(() => {
    return ledgers.find((l) => l.id === selectedLedgerId) || ledgers[0];
  }, [ledgers, selectedLedgerId]);

  const statementData = useMemo(() => {
    if (!selectedLedger) return null;
    return getLedgerStatement(selectedLedger.id, startDate, endDate);
  }, [selectedLedger, startDate, endDate, getLedgerStatement]);

  const gstr1Data = useMemo(() => {
    return getGSTR1Summary(startDate, endDate);
  }, [startDate, endDate, getGSTR1Summary]);

  const gstr3bData = useMemo(() => {
    return getGSTR3BSummary(startDate, endDate);
  }, [startDate, endDate, getGSTR3BSummary]);

  const pnlData = useMemo(() => {
    return getProfitAndLoss(startDate, endDate);
  }, [startDate, endDate, getProfitAndLoss]);

  const balanceSheetData = useMemo(() => {
    return getBalanceSheet();
  }, [getBalanceSheet]);

  const dayBookVouchers = useMemo(() => {
    return getDayBook(dayBookDate);
  }, [dayBookDate, getDayBook]);

  // Handlers
  const handleDownloadLedgerPdf = async () => {
    if (!statementData) return;
    try {
      setIsExporting(true);
      await generateLedgerStatementPdf(statementData, companyProfile, false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareLedgerPdf = async () => {
    if (!statementData) return;
    try {
      setIsExporting(true);
      await generateLedgerStatementPdf(statementData, companyProfile, true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGstPdf = async () => {
    try {
      setIsExporting(true);
      const periodText = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      await generateGSTReportPdf(gstr1Data, gstr3bData, companyProfile, periodText, false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareGstPdf = async () => {
    try {
      setIsExporting(true);
      const periodText = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      await generateGSTReportPdf(gstr1Data, gstr3bData, companyProfile, periodText, true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadStockPdf = async () => {
    try {
      setIsExporting(true);
      await generateStockSummaryPdf(items, companyProfile, false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareStockPdf = async () => {
    try {
      setIsExporting(true);
      await generateStockSummaryPdf(items, companyProfile, true);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Header: Reports & Statements and Dropdown in a single straight line side-by-side */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
        <h1 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2 whitespace-nowrap shrink-0">
          <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
          <span>Reports & Statements</span>
        </h1>

        {/* Report Dropdown Selector */}
        <div className="relative inline-flex items-center shrink-0">
          <select
            id="report-select-dropdown"
            value={activeReport}
            onChange={(e) =>
              setActiveReport(
                e.target.value as
                  | 'ledger'
                  | 'gst'
                  | 'pnl'
                  | 'balancesheet'
                  | 'daybook'
                  | 'stock'
              )
            }
            className="appearance-none bg-white hover:bg-amber-50/50 text-slate-900 border-2 border-amber-400 font-extrabold text-xs sm:text-sm rounded-xl pl-3 pr-8 sm:pr-9 py-1.5 sm:py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition whitespace-nowrap"
          >
            <option value="balancesheet">Balance Sheet</option>
            <option value="ledger">Ledger Statement</option>
            <option value="gst">GST Reports (GSTR-1 / 3B)</option>
            <option value="pnl">Profit & Loss (P&L)</option>
            <option value="daybook">Day Book</option>
            <option value="stock">Stock Summary</option>
          </select>
          <ChevronDown className="w-4 h-4 text-amber-600 pointer-events-none absolute right-2 sm:right-2.5 shrink-0" />
        </div>
      </div>

      {/* Global Date Filter Bar (Single Straight Horizontal Line) */}
      {activeReport !== 'daybook' && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs text-xs">
          {/* Straight horizontal line for Period label, Dropdown, and From/To Dates */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-extrabold text-slate-700 flex items-center gap-1 shrink-0">
              <Calendar className="w-4 h-4 text-sky-600" /> Period:
            </span>

            {/* Side-by-side Period Dropdown Selector */}
            <div className="relative inline-flex items-center shrink-0">
              <select
                id="period-select-dropdown"
                value={periodType}
                onChange={(e) =>
                  handlePeriodTypeChange(
                    e.target.value as
                      | 'monthly'
                      | 'quarterly'
                      | 'halfyearly'
                      | 'yearly'
                      | 'custom'
                  )
                }
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 font-extrabold text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition shadow-2xs"
              >
                <option value="yearly">Yearly ({currentFyLabel})</option>
                <option value="monthly">Monthly ({currentMonthLabel})</option>
                <option value="quarterly">Quarterly ({currentQuarterLabel})</option>
                <option value="halfyearly">Half Yearly ({currentHalfYearLabel})</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 shrink-0" />
            </div>

            {/* Dynamic Period Label Badge */}
            {periodType !== 'custom' && (
              <span className="text-xs font-black text-amber-950 bg-amber-100/90 border border-amber-300/80 px-2.5 py-1 rounded-xl shrink-0 shadow-2xs tracking-wide">
                {getPeriodLabel()}
              </span>
            )}

            {/* Month Picker: allows picking any specific month when Monthly is selected */}
            {periodType === 'monthly' && (
              <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-300 rounded-xl px-2.5 py-1 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Select Month:</span>
                <input
                  type="month"
                  id="report-month-picker"
                  value={startDate.slice(0, 7)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [yStr, mStr] = e.target.value.split('-');
                    const y = parseInt(yStr, 10);
                    const m = parseInt(mStr, 10);
                    const start = new Date(y, m - 1, 1);
                    const end = new Date(y, m, 0);
                    const toStr = (d: Date) => {
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      return `${yyyy}-${mm}-${dd}`;
                    };
                    setStartDate(toStr(start));
                    setEndDate(toStr(end));
                  }}
                  className="border-none bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            )}
            
            {/* Date to Date Picker: Opens ONLY when Custom is selected */}
            {periodType === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">From:</span>
                  <input
                    type="date"
                    id="custom-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-none bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">to</span>

                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">To:</span>
                  <input
                    type="date"
                    id="custom-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-none bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. LEDGER STATEMENT REPORT */}
      {activeReport === 'ledger' && (
        <div className="space-y-4">
          {/* Party Selector Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Account / Party Ledger:
              </label>
              <select
                value={selectedLedgerId}
                onChange={(e) => setSelectedLedgerId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold bg-white"
              >
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.currentBalanceType || 'Dr'} {formatCurrency(l.currentBalance, false)})
                  </option>
                ))}
              </select>
            </div>

            {/* Export & Share Actions with "Report" Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  if (!statementData || !selectedLedger) return;
                  const text = `*STATEMENT OF ACCOUNT*\nParty: ${selectedLedger.name}\nPeriod: ${formatDate(startDate)} to ${formatDate(endDate)}\nOpening Bal: ${formatCurrency(statementData.openingBalance)} ${statementData.openingBalanceType}\nDebit: ${formatCurrency(statementData.totalDebit)}\nCredit: ${formatCurrency(statementData.totalCredit)}\n*Closing Bal: ${formatCurrency(statementData.closingBalance)} ${statementData.closingBalanceType}*\n- ${companyProfile.companyName}`;
                  openWhatsAppShare(text, selectedLedger.phone);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Report Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExporting ? 'Generating...' : 'Report'}</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {isReportMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsReportMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          setIsReportMenuOpen(false);
                          handleShareLedgerPdf();
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-sky-600" />
                        <span>Share PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsReportMenuOpen(false);
                          handleDownloadLedgerPdf();
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition cursor-pointer"
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

          {/* Statement Render */}
          {statementData && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-400">
                    {statementData.ledger.name}
                  </h3>
                  <p className="text-slate-400">
                    Period: {formatDate(startDate)} to {formatDate(endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Closing Balance</span>
                  <span className="font-black text-sm sm:text-base text-white">
                    {formatCurrency(statementData.closingBalance)} {statementData.closingBalanceType}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vch No.</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr className="bg-slate-50 font-semibold text-slate-600">
                      <td className="py-2 px-3">{formatDate(startDate)}</td>
                      <td className="py-2 px-3">-</td>
                      <td className="py-2 px-3"><span className="text-[10px] bg-slate-200 px-1 py-0.5 rounded">OPENING</span></td>
                      <td className="py-2 px-3 italic">Opening Balance</td>
                      <td className="py-2 px-3 text-right">
                        {statementData.openingBalanceType === 'Dr' ? formatCurrency(statementData.openingBalance, false) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {statementData.openingBalanceType === 'Cr' ? formatCurrency(statementData.openingBalance, false) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(statementData.openingBalance, false)} {statementData.openingBalanceType}
                      </td>
                    </tr>

                    {statementData.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-600">{formatDate(tx.date)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tx.voucherNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {tx.voucherType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold">{tx.particulars}</div>
                          {tx.narration && <div className="text-[10px] text-slate-400">{tx.narration}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                          {tx.debit > 0 ? formatCurrency(tx.debit, false) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-rose-700">
                          {tx.credit > 0 ? formatCurrency(tx.credit, false) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(tx.runningBalance, false)} {tx.balanceType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GST REPORT (GSTR-1 & GSTR-3B) */}
      {activeReport === 'gst' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="relative">
              <button
                disabled={isExporting}
                onClick={() => setIsGstMenuOpen(!isGstMenuOpen)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'Report'}</span>
                <span className="text-[10px]">▼</span>
              </button>

              {isGstMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsGstMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsGstMenuOpen(false);
                        handleShareGstPdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-sky-600" />
                      <span>Share PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsGstMenuOpen(false);
                        handleDownloadGstPdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* GSTR-3B Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <span>GSTR-3B Tax Liability, ITC & Payment Settlement</span>
              </h2>
              <div>
                {gstr3bData.paymentStatus === 'PAID' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    GST FULLY SETTLED (शून्य शेष)
                  </span>
                )}
                {gstr3bData.paymentStatus === 'NIL_LIABILITY' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    NIL TAX LIABILITY
                  </span>
                )}
                {gstr3bData.paymentStatus === 'PARTIAL' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    PARTIALLY PAID ({formatCurrency(gstr3bData.paidTotalTax)} Paid)
                  </span>
                )}
                {gstr3bData.paymentStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    TAX PAYMENT PENDING
                  </span>
                )}
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="font-semibold text-rose-800 block text-[11px]">
                  1. Outward Supplies (Sales Tax)
                </span>
                <div className="text-base sm:text-lg font-black text-rose-950 mt-1">
                  {formatCurrency(gstr3bData.outwardTotalTax)}
                </div>
                <div className="text-[10px] text-rose-700 mt-1">
                  CGST: {formatCurrency(gstr3bData.outwardCgst)} | SGST: {formatCurrency(gstr3bData.outwardSgst)} | IGST: {formatCurrency(gstr3bData.outwardIgst)}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-semibold text-emerald-800 block text-[11px]">
                  2. Eligible ITC (Purchase Credit)
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                  {formatCurrency(gstr3bData.itcTotalTax)}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1">
                  CGST: {formatCurrency(gstr3bData.itcCgst)} | SGST: {formatCurrency(gstr3bData.itcSgst)} | IGST: {formatCurrency(gstr3bData.itcIgst)}
                </div>
              </div>

              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="font-semibold text-sky-800 block text-[11px]">
                  3. Tax Paid in Cash / Bank (Challans)
                </span>
                <div className="text-base sm:text-lg font-black text-sky-950 mt-1">
                  {formatCurrency(gstr3bData.paidTotalTax)}
                </div>
                <div className="text-[10px] text-sky-700 mt-1">
                  CGST: {formatCurrency(gstr3bData.paidCgst)} | SGST: {formatCurrency(gstr3bData.paidSgst)} | IGST: {formatCurrency(gstr3bData.paidIgst)}
                </div>
              </div>

              <div className={`p-3.5 rounded-xl text-white ${gstr3bData.balanceTotalPayable === 0 ? 'bg-emerald-900 border border-emerald-700' : 'bg-slate-900 border border-slate-800'}`}>
                <span className={`block text-[11px] font-semibold ${gstr3bData.balanceTotalPayable === 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                  4. Remaining Balance GST Payable
                </span>
                <div className={`text-base sm:text-lg font-black mt-1 ${gstr3bData.balanceTotalPayable === 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                  {formatCurrency(gstr3bData.balanceTotalPayable)}
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  CGST: {formatCurrency(gstr3bData.balanceCgstPayable)} | SGST: {formatCurrency(gstr3bData.balanceSgstPayable)} | IGST: {formatCurrency(gstr3bData.balanceIgstPayable)}
                </div>
              </div>
            </div>

            {/* Table 6.1: Detailed Payment of Tax Statement */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold">
                    <th className="p-2.5">Tax Head / विवरण</th>
                    <th className="p-2.5 text-right">Tax on Outward (₹)</th>
                    <th className="p-2.5 text-right">ITC Adjusted (₹)</th>
                    <th className="p-2.5 text-right">Net Liability (₹)</th>
                    <th className="p-2.5 text-right text-sky-300">Paid in Cash/Challan (₹)</th>
                    <th className="p-2.5 text-right text-amber-300">Remaining Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800">Central Tax (CGST)</td>
                    <td className="p-2.5 text-right text-rose-700 font-semibold">{formatCurrency(gstr3bData.outwardCgst)}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-semibold">{formatCurrency(gstr3bData.itcCgst)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">{formatCurrency(gstr3bData.netCgstLiability)}</td>
                    <td className="p-2.5 text-right text-sky-700 font-bold">{formatCurrency(gstr3bData.paidCgst)}</td>
                    <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(gstr3bData.balanceCgstPayable)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800">State / UT Tax (SGST)</td>
                    <td className="p-2.5 text-right text-rose-700 font-semibold">{formatCurrency(gstr3bData.outwardSgst)}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-semibold">{formatCurrency(gstr3bData.itcSgst)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">{formatCurrency(gstr3bData.netSgstLiability)}</td>
                    <td className="p-2.5 text-right text-sky-700 font-bold">{formatCurrency(gstr3bData.paidSgst)}</td>
                    <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(gstr3bData.balanceSgstPayable)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800">Integrated Tax (IGST)</td>
                    <td className="p-2.5 text-right text-rose-700 font-semibold">{formatCurrency(gstr3bData.outwardIgst)}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-semibold">{formatCurrency(gstr3bData.itcIgst)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">{formatCurrency(gstr3bData.netIgstLiability)}</td>
                    <td className="p-2.5 text-right text-sky-700 font-bold">{formatCurrency(gstr3bData.paidIgst)}</td>
                    <td className="p-2.5 text-right font-black text-slate-900">{formatCurrency(gstr3bData.balanceIgstPayable)}</td>
                  </tr>
                  {gstr3bData.paidOtherGst > 0 && (
                    <tr className="hover:bg-slate-50/70 bg-sky-50/40">
                      <td className="p-2.5 font-bold text-slate-800">Duties & Taxes / General GST</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                      <td className="p-2.5 text-right text-sky-700 font-bold">{formatCurrency(gstr3bData.paidOtherGst)}</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5">Total Tax (कुल टैक्स)</td>
                    <td className="p-2.5 text-right text-rose-800">{formatCurrency(gstr3bData.outwardTotalTax)}</td>
                    <td className="p-2.5 text-right text-emerald-800">{formatCurrency(gstr3bData.itcTotalTax)}</td>
                    <td className="p-2.5 text-right">{formatCurrency(gstr3bData.netTotalLiability)}</td>
                    <td className="p-2.5 text-right text-sky-800">{formatCurrency(gstr3bData.paidTotalTax)}</td>
                    <td className="p-2.5 text-right text-amber-700">{formatCurrency(gstr3bData.balanceTotalPayable)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GST Challans / Payment Records Table */}
            {gstr3bData.gstPayments.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span>GST Challan Payment Vouchers Recorded ({gstr3bData.gstPayments.length})</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total Paid: <strong className="text-sky-800">{formatCurrency(gstr3bData.paidTotalTax)}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Voucher #</th>
                        <th className="p-2.5">Paid To (Account)</th>
                        <th className="p-2.5">Paid From (Bank/Cash)</th>
                        <th className="p-2.5 text-right">CGST (₹)</th>
                        <th className="p-2.5 text-right">SGST (₹)</th>
                        <th className="p-2.5 text-right">IGST (₹)</th>
                        <th className="p-2.5 text-right">Total Paid (₹)</th>
                        <th className="p-2.5">Challan Ref / Narration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {gstr3bData.gstPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap">{formatDate(pay.date)}</td>
                          <td className="p-2.5 font-bold text-sky-700 whitespace-nowrap">{pay.voucherNumber}</td>
                          <td className="p-2.5 font-medium text-slate-800">{pay.partyName}</td>
                          <td className="p-2.5 text-slate-600">{pay.paymentLedgerName}</td>
                          <td className="p-2.5 text-right font-semibold">{pay.cgstPaid > 0 ? formatCurrency(pay.cgstPaid) : '-'}</td>
                          <td className="p-2.5 text-right font-semibold">{pay.sgstPaid > 0 ? formatCurrency(pay.sgstPaid) : '-'}</td>
                          <td className="p-2.5 text-right font-semibold">{pay.igstPaid > 0 ? formatCurrency(pay.igstPaid) : '-'}</td>
                          <td className="p-2.5 text-right font-black text-sky-800">{formatCurrency(pay.totalPaid)}</td>
                          <td className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate">{pay.referenceNo || pay.narration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Receipt className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">GST Payment Guide (जीएसटी चालान भुगतान कैसे दर्ज करें):</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    When you pay GST to the government via Challan (PMT-06), create a <strong>Payment Voucher</strong> (F5) selecting <strong>CGST / SGST / IGST</strong> (or Duties & Taxes) as the account being paid, and your Bank / Cash account as Paid From. The payment will automatically update here and settle your liability.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* GSTR-1 Invoices Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>GSTR-1 Outward Supplies Breakdown (B2B vs B2C)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">B2B Invoices (Registered)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                    {gstr1Data.b2bInvoices.count} Invoices
                  </span>
                </div>
                <div className="text-slate-600">Taxable Value: <strong>{formatCurrency(gstr1Data.b2bInvoices.taxableValue)}</strong></div>
                <div className="text-slate-600">Total Tax: <strong>{formatCurrency(gstr1Data.b2bInvoices.totalTax)}</strong></div>
                <div className="text-slate-900 font-extrabold">Invoice Total: {formatCurrency(gstr1Data.b2bInvoices.invoiceValue)}</div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">B2C Invoices (Unregistered / Retail)</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                    {gstr1Data.b2cInvoices.count} Invoices
                  </span>
                </div>
                <div className="text-slate-600">Taxable Value: <strong>{formatCurrency(gstr1Data.b2cInvoices.taxableValue)}</strong></div>
                <div className="text-slate-600">Total Tax: <strong>{formatCurrency(gstr1Data.b2cInvoices.totalTax)}</strong></div>
                <div className="text-slate-900 font-extrabold">Invoice Total: {formatCurrency(gstr1Data.b2cInvoices.invoiceValue)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROFIT & LOSS STATEMENT */}
      {activeReport === 'pnl' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h2 className="font-bold text-base text-amber-400">Profit & Loss Statement (Trading & P&L A/c)</h2>
              <p className="text-xs text-slate-400">For Period {formatDate(startDate)} to {formatDate(endDate)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Net Profit / Loss</span>
              <span className={`font-black text-base ${pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(pnlData.netProfit)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            {/* Debit Side (Expenses) */}
            <div className="p-4 space-y-3">
              <div className="font-bold text-slate-800 uppercase pb-2 border-b border-slate-100">
                Expenses & Cost of Goods Sold
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">To Opening Stock Value</span>
                <span className="font-semibold text-slate-900">{formatCurrency(pnlData.openingStockValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">To Total Purchases</span>
                <span className="font-semibold text-slate-900">{formatCurrency(pnlData.purchasesTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">To Direct Expenses (Freight, Wages)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(pnlData.directExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 font-bold bg-slate-50 px-2 rounded-lg">
                <span>Gross Profit C/F</span>
                <span className="text-emerald-700">{formatCurrency(pnlData.grossProfit)}</span>
              </div>

              <div className="pt-3">
                <div className="font-bold text-slate-800 uppercase pb-1">Indirect Expenses</div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">To Indirect Expenses (Rent, Salary, Bills)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(pnlData.indirectExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Credit Side (Incomes) */}
            <div className="p-4 space-y-3">
              <div className="font-bold text-slate-800 uppercase pb-2 border-b border-slate-100">
                Revenues & Incomes
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">By Total Sales Revenue</span>
                <span className="font-semibold text-slate-900">{formatCurrency(pnlData.salesTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">By Closing Stock Value</span>
                <span className="font-semibold text-slate-900">{formatCurrency(pnlData.closingStockValue)}</span>
              </div>

              <div className="pt-12">
                <div className="font-bold text-slate-800 uppercase pb-1">Indirect Incomes</div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">By Gross Profit B/F</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(pnlData.grossProfit)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">By Other Incomes (Discounts, Interest)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(pnlData.indirectIncomes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BALANCE SHEET */}
      {activeReport === 'balancesheet' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h2 className="font-bold text-base text-amber-400">Balance Sheet (आर्थिक स्थिति विवरण)</h2>
              <p className="text-xs text-slate-400">As on {formatDate(endDate)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Assets & Liabilities</span>
              <span className="font-black text-base text-white">
                {formatCurrency(balanceSheetData.totalAssets)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            {/* Liabilities */}
            <div className="p-4 space-y-2">
              <div className="font-extrabold text-slate-800 uppercase pb-2 border-b border-slate-200 flex justify-between">
                <span>Liabilities & Capital</span>
                <span>Amount (₹)</span>
              </div>
              {balanceSheetData.liabilities.map((l, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-semibold text-slate-900">{l.name}</span>
                    <span className="text-[10px] text-slate-400 block">{l.group}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(l.amount, false)}</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between font-black text-sm text-slate-900 border-t border-slate-300">
                <span>Total Liabilities:</span>
                <span>{formatCurrency(balanceSheetData.totalLiabilities)}</span>
              </div>
            </div>

            {/* Assets */}
            <div className="p-4 space-y-2">
              <div className="font-extrabold text-slate-800 uppercase pb-2 border-b border-slate-200 flex justify-between">
                <span>Assets & Investments</span>
                <span>Amount (₹)</span>
              </div>
              {balanceSheetData.assets.map((a, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-semibold text-slate-900">{a.name}</span>
                    <span className="text-[10px] text-slate-400 block">{a.group}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(a.amount, false)}</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between font-black text-sm text-slate-900 border-t border-slate-300">
                <span>Total Assets:</span>
                <span>{formatCurrency(balanceSheetData.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DAY BOOK */}
      {activeReport === 'daybook' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Date for Day Book:</span>
              <input
                type="date"
                value={dayBookDate}
                onChange={(e) => setDayBookDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
            </div>
            <span className="text-slate-500 font-semibold">
              {dayBookVouchers.length} vouchers recorded on {formatDate(dayBookDate)}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Vch No.</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayBookVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No vouchers recorded on this date.
                    </td>
                  </tr>
                ) : (
                  dayBookVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold">{v.voucherNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {v.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{v.partyName}</td>
                      <td className="py-2.5 px-3">{v.paymentMode}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(v.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. STOCK SUMMARY */}
      {activeReport === 'stock' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="relative">
              <button
                disabled={isExporting}
                onClick={() => setIsStockMenuOpen(!isStockMenuOpen)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'Report'}</span>
                <span className="text-[10px]">▼</span>
              </button>

              {isStockMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsStockMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsStockMenuOpen(false);
                        handleShareStockPdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-sky-600" />
                      <span>Share PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsStockMenuOpen(false);
                        handleDownloadStockPdf();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">HSN</th>
                  <th className="py-2.5 px-3">GST</th>
                  <th className="py-2.5 px-3">Available Stock</th>
                  <th className="py-2.5 px-3">Purchase Cost</th>
                  <th className="py-2.5 px-3 text-right">Valuation (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{it.name}</td>
                    <td className="py-2.5 px-3 font-mono">{it.hsnCode || '-'}</td>
                    <td className="py-2.5 px-3">{it.gstRate}%</td>
                    <td className="py-2.5 px-3 font-bold">{it.currentStock} {it.unit}</td>
                    <td className="py-2.5 px-3">{formatCurrency(it.purchasePrice)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {formatCurrency(it.currentStock * it.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
