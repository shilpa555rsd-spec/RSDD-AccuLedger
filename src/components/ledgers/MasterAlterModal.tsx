import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountGroup, AccountLedger, GroupNature } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Search,
  Edit2,
  Trash2,
  Users,
  FolderKanban,
  Tag,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Check,
  Building,
  AlertTriangle,
  Save,
} from 'lucide-react';

interface MasterAlterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditLedger: (ledger: AccountLedger) => void;
  onOpenGroupManager?: () => void;
}

type AlterTabType = 'all' | 'ledgers' | 'groups';

export const MasterAlterModal: React.FC<MasterAlterModalProps> = ({
  isOpen,
  onClose,
  onEditLedger,
}) => {
  const { ledgers, groups, deleteLedger, updateGroup, deleteGroup, vouchers } = useAccounting();

  const [activeTab, setActiveTab] = useState<AlterTabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Group Editing inline modal state
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupNature, setGroupNature] = useState<GroupNature>('Assets');
  const [groupNatureSearchText, setGroupNatureSearchText] = useState('');
  const [isGroupNatureDropdownOpen, setIsGroupNatureDropdownOpen] = useState(false);
  const [groupDescription, setGroupDescription] = useState('');

  // Delete Confirm Dialog state
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'ledger' | 'group';
    id: string;
    name: string;
    details?: string;
  } | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Filtered Ledgers
  const filteredLedgers = ledgers.filter((l) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const group = groups.find((g) => g.id === l.groupId);
    return (
      l.name.toLowerCase().includes(term) ||
      (l.phone && l.phone.includes(term)) ||
      (l.gstin && l.gstin.toLowerCase().includes(term)) ||
      (l.city && l.city.toLowerCase().includes(term)) ||
      (group && group.name.toLowerCase().includes(term))
    );
  });

  // Filtered Groups
  const filteredGroups = groups.filter((g) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      g.name.toLowerCase().includes(term) ||
      g.nature.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term))
    );
  });

  // Handle Edit Group
  const handleStartEditGroup = (grp: AccountGroup) => {
    setEditingGroup(grp);
    setGroupName(grp.name);
    setGroupNature(grp.nature);
    setGroupNatureSearchText(grp.nature);
    setIsGroupNatureDropdownOpen(false);
    setGroupDescription(grp.description || '');
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    if (!groupName.trim()) {
      showNotification('Group name cannot be empty', true);
      return;
    }

    updateGroup(editingGroup.id, {
      name: groupName.trim(),
      nature: groupNature,
      description: groupDescription.trim(),
    });

    showNotification(`Group "${groupName.trim()}" successfully updated!`);
    setEditingGroup(null);
  };

  // Delete Prompt
  const handlePromptDeleteLedger = (ledger: AccountLedger) => {
    const hasVouchers = vouchers.some(
      (v) => v.partyLedgerId === ledger.id || v.paymentLedgerId === ledger.id
    );
    if (hasVouchers) {
      showNotification(
        `Cannot delete "${ledger.name}" because it contains transaction vouchers. Please delete those vouchers first.`,
        true
      );
      return;
    }

    setItemToDelete({
      type: 'ledger',
      id: ledger.id,
      name: ledger.name,
      details: `Balance: ${formatCurrency(ledger.currentBalance)} (${ledger.currentBalanceType || 'Dr'})`,
    });
  };

  const handlePromptDeleteGroup = (grp: AccountGroup) => {
    if (grp.isDefault) {
      showNotification(`Default system group "${grp.name}" cannot be deleted.`, true);
      return;
    }

    const linkedLedgers = ledgers.filter((l) => l.groupId === grp.id);
    if (linkedLedgers.length > 0) {
      showNotification(
        `Cannot delete group "${grp.name}" because ${linkedLedgers.length} account(s) are assigned to it. Please reassign them first.`,
        true
      );
      return;
    }

    setItemToDelete({
      type: 'group',
      id: grp.id,
      name: grp.name,
      details: `Nature: ${grp.nature}`,
    });
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'ledger') {
      const res = deleteLedger(itemToDelete.id);
      if (!res.success) {
        showNotification(res.message || 'Failed to delete ledger', true);
      } else {
        showNotification(`Account "${itemToDelete.name}" deleted successfully.`);
      }
    } else {
      const res = deleteGroup(itemToDelete.id);
      if (!res.success) {
        showNotification(res.message || 'Failed to delete group', true);
      } else {
        showNotification(`Group "${itemToDelete.name}" deleted successfully.`);
      }
    }

    setItemToDelete(null);
  };

  const getNatureBadgeColor = (nat: GroupNature) => {
    switch (nat) {
      case 'Assets':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Liabilities':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Income':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Expenses':
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Full Screen Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
            <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight">
              Alter Masters
            </h2>
            <p className="text-xs text-slate-300 hidden sm:block">
              Search and select any Account or Group to Edit, Modify, or Delete
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

      {/* Notifications */}
      {errorMsg && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800 animate-in fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Main Full View Container */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-3">
        {/* Search & Tabs Controls Card */}
        <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Account name, phone, GSTIN, city, or Group name..."
              className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>All Masters ({filteredLedgers.length + filteredGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledgers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ledgers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>Accounts / Parties ({filteredLedgers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-sky-500" />
              <span>Groups ({filteredGroups.length})</span>
            </button>
          </div>
        </div>

        {/* List Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {/* 1. Ledgers Section */}
          {(activeTab === 'all' || activeTab === 'ledgers') && filteredLedgers.length > 0 && (
            <div className="space-y-1.5">
              {activeTab === 'all' && (
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 pt-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Accounts / Ledgers ({filteredLedgers.length})</span>
                </div>
              )}
              {filteredLedgers.map((ledger) => {
                const grp = groups.find((g) => g.id === ledger.groupId);
                return (
                  <div
                    key={ledger.id}
                    className="bg-white border border-slate-200/90 hover:border-amber-400 p-2.5 sm:p-3 rounded-xl shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-2.5 group"
                  >
                    {/* Left Details */}
                    <div
                      onClick={() => {
                        onClose();
                        onEditLedger(ledger);
                      }}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 bg-amber-50 text-amber-700 rounded-md shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-600 transition truncate">
                          {ledger.name}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          {grp?.name || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 pl-6 flex-wrap">
                        {ledger.phone && <span>📞 {ledger.phone}</span>}
                        {ledger.city && <span>📍 {ledger.city}</span>}
                        {ledger.gstin && <span className="font-mono text-[10px]">GST: {ledger.gstin}</span>}
                        <span className="font-bold text-slate-700">
                          Bal: {formatCurrency(ledger.currentBalance)} ({ledger.currentBalanceType || 'Dr'})
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditLedger(ledger);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Edit / Modify Account"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Modify</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePromptDeleteLedger(ledger)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Groups Section */}
          {(activeTab === 'all' || activeTab === 'groups') && filteredGroups.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {activeTab === 'all' && (
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 pt-1 flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-sky-500" />
                  <span>Account Groups ({filteredGroups.length})</span>
                </div>
              )}
              {filteredGroups.map((grp) => {
                const count = ledgers.filter((l) => l.groupId === grp.id).length;
                return (
                  <div
                    key={grp.id}
                    className="bg-white border border-slate-200/90 hover:border-sky-400 p-2.5 sm:p-3 rounded-xl shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-2.5 group"
                  >
                    {/* Left Details */}
                    <div
                      onClick={() => handleStartEditGroup(grp)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 bg-sky-50 text-sky-700 rounded-md shrink-0">
                          <FolderKanban className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-sky-600 transition truncate">
                          {grp.name}
                        </h4>
                        {grp.isDefault && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold uppercase shrink-0">
                            Default
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded font-bold border ${getNatureBadgeColor(
                            grp.nature
                          )} shrink-0`}
                        >
                          {grp.nature}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 pl-6">
                        <span>{count} {count === 1 ? 'account assigned' : 'accounts assigned'}</span>
                        {grp.description && <span className="truncate italic">"{grp.description}"</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditGroup(grp)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Edit / Modify Group"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Modify</span>
                      </button>

                      {!grp.isDefault && (
                        <button
                          type="button"
                          onClick={() => handlePromptDeleteGroup(grp)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition active:scale-95 cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredLedgers.length === 0 && filteredGroups.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No matching Accounts or Groups found</p>
              <p className="text-xs text-slate-400">Try checking your spelling or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* Group Edit Sub-Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Modify Account Group</h3>
                  <p className="text-xs text-slate-500">Edit group name, nature, and description</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nature of Group * <span className="text-slate-400 font-normal">(टाइप करके खोजें)</span>
                </label>
                <div
                  onClick={() => setIsGroupNatureDropdownOpen(true)}
                  className="relative cursor-pointer"
                >
                  <input
                    type="text"
                    value={groupNatureSearchText}
                    onChange={(e) => {
                      setGroupNatureSearchText(e.target.value);
                      setIsGroupNatureDropdownOpen(true);
                    }}
                    onFocus={() => setIsGroupNatureDropdownOpen(true)}
                    placeholder="Search: Assets, Liabilities, Income, Expenses..."
                    className="w-full text-xs sm:text-sm pl-8 pr-8 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                {isGroupNatureDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in">
                    {(
                      [
                        { val: 'Assets' as GroupNature, label: 'Assets', hindi: 'संपत्ति', desc: 'Bank, Cash, Debtors, Stock, Fixed Assets' },
                        { val: 'Liabilities' as GroupNature, label: 'Liabilities', hindi: 'दायित्व', desc: 'Creditors, Capital, Taxes, Loans' },
                        { val: 'Income' as GroupNature, label: 'Income', hindi: 'आय', desc: 'Sales, Direct & Indirect Incomes' },
                        { val: 'Expenses' as GroupNature, label: 'Expenses', hindi: 'खर्चे', desc: 'Purchases, Direct & Indirect Expenses' },
                      ] as const
                    )
                      .filter(
                        (n) =>
                          n.label.toLowerCase().includes(groupNatureSearchText.toLowerCase()) ||
                          n.hindi.toLowerCase().includes(groupNatureSearchText.toLowerCase()) ||
                          n.desc.toLowerCase().includes(groupNatureSearchText.toLowerCase())
                      )
                      .map((n) => (
                        <div
                          key={n.val}
                          onClick={() => {
                            setGroupNature(n.val);
                            setGroupNatureSearchText(n.val);
                            setIsGroupNatureDropdownOpen(false);
                          }}
                          className="p-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{n.label}</span>{' '}
                            <span className="text-slate-500">({n.hindi})</span>
                            <p className="text-[10px] text-slate-400">{n.desc}</p>
                          </div>
                          {groupNature === n.val && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional note"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Master Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete {itemToDelete.type === 'ledger' ? 'Account / Party' : 'Account Group'}?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{itemToDelete.name}"</strong>?
              </p>
              {itemToDelete.details && (
                <div className="mt-2 p-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  {itemToDelete.details}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
