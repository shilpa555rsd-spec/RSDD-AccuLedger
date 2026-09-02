import React, { useState, useRef, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountLedger, VoucherType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  Search,
  ChevronDown,
  Edit2,
  X,
  Building,
  UserCheck,
  UserPlus,
  FolderPlus,
  SlidersHorizontal,
} from 'lucide-react';
import { MasterAlterModal } from './MasterAlterModal';

interface LedgerListViewProps {
  onOpenStatement: (ledger: AccountLedger) => void;
  onOpenNewVoucher: (type: VoucherType, partyId?: string) => void;
  onAddLedger: () => void;
  onEditLedger: (ledger: AccountLedger) => void;
  onOpenGroupManager: () => void;
}

export const LedgerListView: React.FC<LedgerListViewProps> = ({
  onOpenStatement,
  onAddLedger,
  onEditLedger,
  onOpenGroupManager,
}) => {
  const { ledgers, groups } = useAccounting();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlterModalOpen, setIsAlterModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLedgers = ledgers
    .filter((l) => {
      const matchesGroup = selectedGroupId === 'all' || l.groupId === selectedGroupId;
      const matchesSearch =
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone && l.phone.includes(searchTerm)) ||
        (l.gstin && l.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.city && l.city.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesGroup && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return (
    <div className="space-y-2 sm:space-y-3 pb-20 max-w-7xl mx-auto">
      {/* Header with Title "Account" and adjacent Create/Modify Action Menu */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg shadow-xs shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
            Account
          </h1>
        </div>

        {/* Dropdown Menu with Create Account, Create Group, and Alter */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-1.5 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-sm transition cursor-pointer active:scale-95"
          >
            <span>+ Create / Modify</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 sm:w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left">
              {/* Option 1: Create Account */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onAddLedger();
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition text-left cursor-pointer"
              >
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight">Create Account</div>
                  <div className="text-[10px] text-slate-400 font-medium">Add Customer, Vendor, Bank...</div>
                </div>
              </button>

              {/* Option 2: Create Group */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onOpenGroupManager();
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition text-left cursor-pointer"
              >
                <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg shrink-0">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight">Create Group</div>
                  <div className="text-[10px] text-slate-400 font-medium">Add new accounting group</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Option 3: Alter */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAlterModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 hover:bg-amber-100 hover:text-slate-950 transition text-left cursor-pointer bg-slate-50/70"
              >
                <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg shrink-0 shadow-2xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>Alter</span>
                    <span className="text-[9px] bg-amber-200 text-slate-950 px-1 rounded font-black uppercase">Edit / Delete</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Modify or Delete Account / Group</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by party name, phone, city, GSTIN..."
              className="w-full text-xs sm:text-sm pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Group Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs whitespace-nowrap transition cursor-pointer ${
              selectedGroupId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts ({ledgers.length})
          </button>
          {groups.map((grp) => {
            const count = ledgers.filter((l) => l.groupId === grp.id).length;
            if (count === 0 && selectedGroupId !== grp.id) return null;
            return (
              <button
                key={grp.id}
                onClick={() => setSelectedGroupId(grp.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs whitespace-nowrap transition cursor-pointer ${
                  selectedGroupId === grp.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grp.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Ledgers Grid / Compact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
        {filteredLedgers.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-xl">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-sm font-semibold text-slate-600">No parties or ledgers found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try changing filters or add a new party</p>
          </div>
        ) : (
          filteredLedgers.map((ledger) => {
            const group = groups.find((g) => g.id === ledger.groupId);
            const isDebit = ledger.currentBalanceType === 'Dr';
            const isZero = !ledger.currentBalance || ledger.currentBalance === 0;

            return (
              <div
                key={ledger.id}
                onClick={() => onOpenStatement(ledger)}
                className="bg-white border border-slate-200 hover:border-amber-400/90 rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99] select-none relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight group-hover:text-amber-600 transition-colors truncate">
                        {ledger.name}
                      </h3>
                      {/* Direct Edit Button on card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLedger(ledger);
                        }}
                        title="Modify / Edit Account (खाता संशोधित करें)"
                        className="p-0.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold rounded">
                        {group?.name || 'General Ledger'}
                      </span>
                      {ledger.phone && (
                        <span className="text-[10px] text-slate-500 font-medium truncate">
                          📞 {ledger.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance & Dr/Cr Badge */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-black tracking-tight ${
                        isZero
                          ? 'text-slate-500'
                          : isDebit
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(ledger.currentBalance)}
                    </div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isZero
                            ? 'bg-slate-100 text-slate-600'
                            : isDebit
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isZero ? 'Settled (NIL)' : isDebit ? 'Dr (To Receive)' : 'Cr (To Pay)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MASTER ALTER MODAL (Alter Account or Group: Search, Edit, Modify, Delete) */}
      <MasterAlterModal
        isOpen={isAlterModalOpen}
        onClose={() => setIsAlterModalOpen(false)}
        onEditLedger={onEditLedger}
        onOpenGroupManager={onOpenGroupManager}
      />
    </div>
  );
};
