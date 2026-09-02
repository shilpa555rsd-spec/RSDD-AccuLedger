import React, { useState, useRef, useEffect } from 'react';
import { DoubleEntryLine, AccountLedger, AccountGroup, VoucherType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Trash2, Scale, Zap, Search, AlertCircle, CheckCircle2, ChevronDown, Check, X } from 'lucide-react';

interface DoubleEntryEditorProps {
  entries: DoubleEntryLine[];
  onChange: (entries: DoubleEntryLine[]) => void;
  ledgers: AccountLedger[];
  groups: AccountGroup[];
  narration: string;
  onNarrationChange: (val: string) => void;
  voucherType: VoucherType;
}

// Searchable Dropdown Combobox for Account Ledgers
export interface SearchableLedgerSelectProps {
  selectedLedgerId: string;
  onSelect: (ledger: AccountLedger) => void;
  ledgers: AccountLedger[];
  placeholder?: string;
  className?: string;
}

export const SearchableLedgerSelect: React.FC<SearchableLedgerSelectProps> = ({
  selectedLedgerId,
  onSelect,
  ledgers,
  placeholder = 'Search & select ledger...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLedger = ledgers.find((l) => l.id === selectedLedgerId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredLedgers = ledgers.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = l.name.toLowerCase().includes(q);
    const groupMatch = (l.groupName || '').toLowerCase().includes(q);
    const phoneMatch = (l.phone || '').toLowerCase().includes(q);
    const gstinMatch = (l.gstin || '').toLowerCase().includes(q);
    return nameMatch || groupMatch || phoneMatch || gstinMatch;
  });

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button / Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-2xs transition cursor-pointer ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedLedger ? (
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-slate-900 truncate font-black text-xs sm:text-sm">
              {selectedLedger.name}
            </span>
            <span className="text-[10px] text-slate-500 truncate font-semibold">
              {selectedLedger.groupName || 'Primary'} • {selectedLedger.currentBalanceType || 'Dr'}{' '}
              {formatCurrency(selectedLedger.currentBalance, false)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-medium text-xs sm:text-sm flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{placeholder}</span>
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Floating Search Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 min-w-[280px]">
          {/* Search Input Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search ledger name, group..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Ledger Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredLedgers.length > 0 ? (
              filteredLedgers.map((ledger) => {
                const isSelected = ledger.id === selectedLedgerId;
                return (
                  <button
                    key={ledger.id}
                    type="button"
                    onClick={() => {
                      onSelect(ledger);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 text-indigo-950 font-bold'
                        : 'hover:bg-slate-100/80 text-slate-800'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                          {ledger.name}
                        </span>
                        {ledger.groupName && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded border border-slate-300 shrink-0">
                            {ledger.groupName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        Balance: <strong className="text-slate-700">{ledger.currentBalanceType || 'Dr'} {formatCurrency(ledger.currentBalance)}</strong>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No ledgers found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const DoubleEntryEditor: React.FC<DoubleEntryEditorProps> = ({
  entries,
  onChange,
  ledgers,
  groups,
  narration,
  onNarrationChange,
  voucherType,
}) => {
  // Totals
  const totalDebit = entries
    .filter((e) => e.type === 'Dr')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalCredit = entries
    .filter((e) => e.type === 'Cr')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const diff = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
  const isBalanced = totalDebit > 0 && diff === 0;

  // Handle Type (Dr / Cr) Change with Intelligent Auto-Add Progression
  const handleTypeChange = (index: number, newType: 'Dr' | 'Cr') => {
    const updated = [...entries];
    const currentLine = updated[index];
    if (!currentLine) return;

    updated[index] = { ...currentLine, type: newType };

    // Rule: If user changes row to "Dr", and this is the last row (or there are no Cr rows following it),
    // automatically add the next row as "Cr" with the balancing difference!
    if (newType === 'Dr') {
      const isLastRow = index === updated.length - 1;
      const hasSubsequentCr = updated.slice(index + 1).some((r) => r.type === 'Cr');

      if (isLastRow || !hasSubsequentCr) {
        // Calculate missing amount
        const currentDrTotal = updated
          .filter((e) => e.type === 'Dr')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const currentCrTotal = updated
          .filter((e) => e.type === 'Cr')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const remainingDiff = Math.max(0, currentDrTotal - currentCrTotal);

        const newCrLine: DoubleEntryLine = {
          id: `de-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'Cr',
          ledgerId: '',
          ledgerName: '',
          amount: remainingDiff > 0 ? remainingDiff : 0,
          narration: '',
        };
        updated.push(newCrLine);
      }
    }

    onChange(updated);
  };

  const handleRemoveLine = (id: string) => {
    if (entries.length <= 2) {
      // Don't allow fewer than 2 lines, reset the row instead
      onChange(
        entries.map((e) => (e.id === id ? { ...e, ledgerId: '', ledgerName: '', amount: 0 } : e))
      );
      return;
    }
    onChange(entries.filter((e) => e.id !== id));
  };

  const handleLineFieldChange = (id: string, field: keyof DoubleEntryLine, value: any) => {
    const updated = entries.map((line) => {
      if (line.id === id) {
        return { ...line, [field]: value };
      }
      return line;
    });
    onChange(updated);
  };

  const handleSelectLedger = (id: string, ledger: AccountLedger) => {
    const updated = entries.map((line) => {
      if (line.id === id) {
        return {
          ...line,
          ledgerId: ledger.id,
          ledgerName: ledger.name,
        };
      }
      return line;
    });
    onChange(updated);
  };

  const handleAutoBalance = () => {
    if (diff === 0) return;
    const targetType = totalDebit > totalCredit ? 'Cr' : 'Dr';
    // Check if there's an empty or matching row on targetType
    const emptyRowIndex = entries.findIndex((e) => e.type === targetType && (!e.amount || e.amount === 0));
    if (emptyRowIndex !== -1) {
      const copy = [...entries];
      copy[emptyRowIndex] = { ...copy[emptyRowIndex], amount: diff };
      onChange(copy);
    } else {
      // Append a balancing row
      const newLine: DoubleEntryLine = {
        id: `de-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: targetType,
        ledgerId: '',
        ledgerName: '',
        amount: diff,
        narration: '',
      };
      onChange([...entries, newLine]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto Balance Action Bar (only if difference exists) */}
      {diff > 0 && totalDebit > 0 && (
        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Debit & Credit do not match. Difference: {formatCurrency(diff)}</span>
          </div>
          <button
            type="button"
            onClick={handleAutoBalance}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs shadow-xs transition transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Balance</span>
          </button>
        </div>
      )}

      {/* Ledger Lines Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-32 text-center">Dr / Cr</th>
                <th className="py-3 px-3">Account Ledger (खाता)</th>
                <th className="py-3 px-3 w-36 text-right">Debit (Dr ₹)</th>
                <th className="py-3 px-3 w-36 text-right">Credit (Cr ₹)</th>
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((line, index) => {
                const isDr = line.type === 'Dr';

                return (
                  <tr
                    key={line.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isDr ? 'bg-blue-50/20' : 'bg-purple-50/20'
                    }`}
                  >
                    {/* 1. Dr / Cr Dropdown Selector */}
                    <td className="py-3 px-3 align-middle text-center">
                      <div className="relative inline-block w-full max-w-[105px]">
                        <select
                          value={line.type}
                          onChange={(e) => handleTypeChange(index, e.target.value as 'Dr' | 'Cr')}
                          className={`w-full appearance-none font-black text-xs px-3 py-2 pr-7 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 transition text-center ${
                            isDr
                              ? 'bg-blue-600 text-white border-blue-700 focus:ring-blue-400'
                              : 'bg-purple-600 text-white border-purple-700 focus:ring-purple-400'
                          }`}
                        >
                          <option value="Dr" className="bg-white text-blue-900 font-bold">
                            By (Dr)
                          </option>
                          <option value="Cr" className="bg-white text-purple-900 font-bold">
                            To (Cr)
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* 2. Searchable Account Ledger Dropdown */}
                    <td className="py-3 px-3 align-middle">
                      <SearchableLedgerSelect
                        selectedLedgerId={line.ledgerId}
                        onSelect={(ledger) => handleSelectLedger(line.id, ledger)}
                        ledgers={ledgers}
                        placeholder="Search & select ledger..."
                      />
                    </td>

                    {/* 3. Debit Amount */}
                    <td className="py-3 px-3 align-middle">
                      {isDr ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={line.amount === 0 ? '' : line.amount}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleLineFieldChange(line.id, 'amount', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0.00"
                            className="w-full text-xs sm:text-sm font-black text-right pl-6 pr-2.5 py-2 border-2 border-blue-300 bg-blue-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="py-2 text-right text-slate-300 font-mono text-xs select-none">
                          -
                        </div>
                      )}
                    </td>

                    {/* 4. Credit Amount */}
                    <td className="py-3 px-3 align-middle">
                      {!isDr ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={line.amount === 0 ? '' : line.amount}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleLineFieldChange(line.id, 'amount', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0.00"
                            className="w-full text-xs sm:text-sm font-black text-right pl-6 pr-2.5 py-2 border-2 border-purple-300 bg-purple-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-900 shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="py-2 text-right text-slate-300 font-mono text-xs select-none">
                          -
                        </div>
                      )}
                    </td>

                    {/* 5. Delete Line */}
                    <td className="py-3 px-2 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        title="Remove Row"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900 text-xs sm:text-sm">
                <td colSpan={2} className="py-3 px-3 text-right uppercase tracking-wider">
                  Total (कुल योग) :
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-900 bg-blue-100/50">
                  {formatCurrency(totalDebit, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-purple-900 bg-purple-100/50">
                  {formatCurrency(totalCredit, false)}
                </td>
                <td className="py-3 px-2 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Status bar below table showing balance integrity */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] font-semibold text-slate-500">
            {entries.length} Ledger Line(s)
          </div>

          <div>
            {isBalanced ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Balanced (Total Dr = Total Cr)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-100 px-3 py-1 rounded-lg font-bold text-xs">
                <AlertCircle className="w-4 h-4" /> Difference: {formatCurrency(diff)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overall Narration Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Overall Narration / Explanation (विवरण){' '}
          <span className="text-slate-400 font-normal">(e.g. Being goods sold or salary paid)</span>
        </label>
        <textarea
          rows={2}
          value={narration}
          onChange={(e) => onNarrationChange(e.target.value)}
          placeholder="Being payment made towards invoice #... / adjustment entry..."
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none shadow-2xs"
        />
      </div>
    </div>
  );
};
