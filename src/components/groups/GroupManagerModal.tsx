import React, { useState, useEffect, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { GroupNature } from '../../types';
import {
  FolderKanban,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
} from 'lucide-react';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NatureOption {
  value: GroupNature;
  label: string;
  hindiLabel: string;
  description: string;
  badgeClass: string;
}

const NATURE_OPTIONS: NatureOption[] = [
  {
    value: 'Assets',
    label: 'Assets',
    hindiLabel: 'संपत्ति',
    description: 'Bank, Cash, Debtors, Stock, Fixed Assets, Investments',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  },
  {
    value: 'Liabilities',
    label: 'Liabilities',
    hindiLabel: 'दायित्व',
    description: 'Creditors, Capital, Taxes, Loans, Duties & Taxes',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  },
  {
    value: 'Income',
    label: 'Income',
    hindiLabel: 'आय',
    description: 'Sales Accounts, Direct & Indirect Incomes, Commission',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  },
  {
    value: 'Expenses',
    label: 'Expenses',
    hindiLabel: 'खर्चे',
    description: 'Purchase Accounts, Direct & Indirect Expenses, Wages, Rent',
    badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
  },
];

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({ isOpen, onClose }) => {
  const { addGroup } = useAccounting();

  // Form State
  const [name, setName] = useState('');
  const [nature, setNature] = useState<GroupNature | ''>('');
  const [natureSearchText, setNatureSearchText] = useState('');
  const [isNatureDropdownOpen, setIsNatureDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setNature('');
      setNatureSearchText('');
      setIsNatureDropdownOpen(false);
      setDescription('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Click outside listener for nature dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNatureDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredNatures = NATURE_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(natureSearchText.toLowerCase()) ||
      opt.hindiLabel.toLowerCase().includes(natureSearchText.toLowerCase()) ||
      opt.description.toLowerCase().includes(natureSearchText.toLowerCase())
  );

  const handleSelectNature = (opt: NatureOption) => {
    setNature(opt.value);
    setNatureSearchText(`${opt.label} (${opt.hindiLabel})`);
    setIsNatureDropdownOpen(false);
    setError(null);
  };

  const handleClearNature = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNature('');
    setNatureSearchText('');
    setIsNatureDropdownOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required (समूह का नाम दर्ज करें)');
      return;
    }
    if (!nature) {
      setError('Please select Nature of Group (समूह की प्रकृति चुनें - Assets, Liabilities, Income, Expenses)');
      return;
    }

    addGroup({
      name: name.trim(),
      nature: nature as GroupNature,
      description: description.trim(),
      isDefault: false,
    });

    setSuccessMsg(`Group "${name.trim()}" successfully created!`);
    setError(null);

    setTimeout(() => {
      onClose();
    }, 800);
  };

  const selectedNatureOption = NATURE_OPTIONS.find((opt) => opt.value === nature);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-150">
      {/* Full-Screen Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gradient-to-tr from-amber-400 to-orange-400 text-slate-950 rounded-xl font-bold shadow-md shrink-0">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
              + Add New Account Group
            </h2>
            <p className="text-xs text-slate-300 hidden sm:block">
              Create a new accounting group under Assets, Liabilities, Income, or Expenses
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area - Direct Full Screen Form View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full max-w-4xl mx-auto flex flex-col justify-start">
        {/* Notifications */}
        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-sm font-bold text-emerald-800 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-sm font-semibold text-rose-800 animate-in fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* The Full View Create Group Form */}
        <form
          onSubmit={handleSave}
          className="bg-white p-6 sm:p-8 border border-slate-200/90 rounded-2xl shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Account Group Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the name and nature for the new accounting head
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Name */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Group Name * <span className="text-slate-400 font-normal">(समूह का नाम)</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Trade Debtors, Marketing Exp, Gold Loan, Bank Accounts"
                className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium shadow-2xs"
              />
            </div>

            {/* Nature of Group with Searchable Combobox */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Nature of Group * <span className="text-slate-400 font-normal">(प्रकृति - टाइप करके खोजें)</span>
              </label>

              <div
                onClick={() => setIsNatureDropdownOpen(true)}
                className="relative cursor-pointer"
              >
                <input
                  type="text"
                  value={natureSearchText}
                  onChange={(e) => {
                    setNatureSearchText(e.target.value);
                    setNature('');
                    setIsNatureDropdownOpen(true);
                  }}
                  onFocus={() => setIsNatureDropdownOpen(true)}
                  placeholder="Type to search: Assets, Liabilities, Income, Expenses..."
                  className="w-full text-sm pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium shadow-2xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                <div className="absolute right-3 top-3 flex items-center gap-1">
                  {natureSearchText && (
                    <button
                      type="button"
                      onClick={handleClearNature}
                      className="p-0.5 text-slate-400 hover:text-slate-700 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isNatureDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Selected Nature Badge Indicator */}
              {selectedNatureOption && !isNatureDropdownOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Selected:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${selectedNatureOption.badgeClass}`}>
                    <Check className="w-3.5 h-3.5" />
                    {selectedNatureOption.label} ({selectedNatureOption.hindiLabel})
                  </span>
                </div>
              )}

              {/* Search Dropdown Menu */}
              {isNatureDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    Select one of the 4 standard accounting natures:
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredNatures.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No nature matching &quot;{natureSearchText}&quot;. Please search Assets, Liabilities, Income, or Expenses.
                      </div>
                    ) : (
                      filteredNatures.map((opt) => {
                        const isSelected = nature === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => handleSelectNature(opt)}
                            className={`p-3 cursor-pointer transition flex items-center justify-between hover:bg-amber-50/70 ${
                              isSelected ? 'bg-amber-50 font-bold' : ''
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs border ${opt.badgeClass}`}>
                                  {opt.label}
                                </span>
                                <span className="text-xs font-semibold text-slate-700">
                                  ({opt.hindiLabel})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {opt.description}
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description / Note */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Description / Note <span className="text-slate-400 font-normal">(वैकल्पिक विवरण)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or classification details for this group"
              className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <FolderKanban className="w-4 h-4" />
              <span>+ Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
