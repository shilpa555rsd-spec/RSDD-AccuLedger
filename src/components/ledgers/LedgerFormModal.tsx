import React, { useState, useEffect, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountLedger, BalanceType } from '../../types';
import { INDIAN_STATES } from '../../utils/formatters';
import {
  X,
  UserCheck,
  Building,
  MapPin,
  Phone,
  Mail,
  Landmark,
  Save,
  AlertCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Coins,
  ChevronDown,
  Check,
} from 'lucide-react';

interface LedgerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerToEdit?: AccountLedger | null;
  onOpenGroupManager?: () => void;
}

export const LedgerFormModal: React.FC<LedgerFormModalProps> = ({
  isOpen,
  onClose,
  ledgerToEdit,
  onOpenGroupManager,
}) => {
  const { groups, addLedger, updateLedger, deleteLedger } = useAccounting();

  // Basic Information
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupSearchText, setGroupSearchText] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  // Address & Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');

  // Contact Information
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Tax & Registration
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  // Bank Account Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [upiId, setUpiId] = useState('');

  // Opening Balance & Credit Limit (at the end)
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<BalanceType>('Dr');
  const [creditLimit, setCreditLimit] = useState<number | undefined>(undefined);

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State Search & Autocomplete
  const [stateSearchText, setStateSearchText] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation Multi-step State ('confirm1' | 'confirm2' | null)
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<'confirm1' | 'confirm2' | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target as Node)) {
        setIsStateDropdownOpen(false);
      }
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (ledgerToEdit) {
        setName(ledgerToEdit.name || '');
        setGroupId(ledgerToEdit.groupId || '');
        const matchedGrp = groups.find((g) => g.id === ledgerToEdit.groupId);
        setGroupSearchText(matchedGrp ? matchedGrp.name : '');
        setOpeningBalance(ledgerToEdit.openingBalance || 0);
        setOpeningBalanceType(ledgerToEdit.openingBalanceType || 'Dr');
        setGstin(ledgerToEdit.gstin || '');
        setPan(ledgerToEdit.pan || '');
        setPhone(ledgerToEdit.phone || '');
        setEmail(ledgerToEdit.email || '');
        setAddress(ledgerToEdit.address || '');
        setCity(ledgerToEdit.city || '');
        const st = ledgerToEdit.state || '';
        setState(st);
        setStateSearchText(st);
        setStateCode(ledgerToEdit.stateCode || '');
        setPincode(ledgerToEdit.pincode || '');
        setCountry(ledgerToEdit.country || 'India');
        setBankName(ledgerToEdit.bankName || '');
        setAccountNumber(ledgerToEdit.accountNumber || '');
        setIfscCode(ledgerToEdit.ifscCode || '');
        setBranch(ledgerToEdit.branch || '');
        setUpiId(ledgerToEdit.upiId || '');
        setCreditLimit(ledgerToEdit.creditLimit);
      } else {
        setName('');
        setGroupId('');
        setGroupSearchText('');
        setOpeningBalance(0);
        setOpeningBalanceType('Dr');
        setGstin('');
        setPan('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCity('');
        setState('');
        setStateSearchText('');
        setStateCode('');
        setPincode('');
        setCountry('India');
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setBranch('');
        setUpiId('');
        setCreditLimit(undefined);
      }
      setError(null);
      setIsSaving(false);
      setSaveSuccess(false);
      setIsStateDropdownOpen(false);
      setIsGroupDropdownOpen(false);
      setDeleteConfirmationStep(null);
    }
  }, [ledgerToEdit, groups, isOpen]);

  if (!isOpen) return null;

  // Filter Indian States for Search
  const filteredStates = INDIAN_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(stateSearchText.toLowerCase()) ||
      s.code.includes(stateSearchText)
  );

  const handleSelectState = (selectedState: { name: string; code: string }) => {
    setState(selectedState.name);
    setStateCode(selectedState.code);
    setStateSearchText(selectedState.name);
    setIsStateDropdownOpen(false);
    if (error) setError(null);
  };

  const handleClearState = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('');
    setStateCode('');
    setStateSearchText('');
    setIsStateDropdownOpen(true);
  };

  // Filter Account Groups for Search while typing
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(groupSearchText.toLowerCase()) ||
      g.nature.toLowerCase().includes(groupSearchText.toLowerCase())
  );

  const handleSelectGroup = (group: { id: string; name: string; nature: string }) => {
    setGroupId(group.id);
    setGroupSearchText(group.name);
    setIsGroupDropdownOpen(false);
    if (error) setError(null);
  };

  const handleClearGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupId('');
    setGroupSearchText('');
    setIsGroupDropdownOpen(true);
  };

  // Handle GSTIN input & Auto-populate PAN and State
  const handleGstinChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(cleaned);

    // Auto-extract PAN from 3rd to 12th char (10 characters)
    if (cleaned.length >= 12) {
      const extractedPan = cleaned.substring(2, 12);
      setPan(extractedPan);
    }

    // Auto-detect State if first 2 digits match a state code
    if (cleaned.length >= 2) {
      const code = cleaned.substring(0, 2);
      const matchedState = INDIAN_STATES.find((s) => s.code === code);
      if (matchedState) {
        setState(matchedState.name);
        setStateCode(matchedState.code);
        setStateSearchText(matchedState.name);
      }
    }
  };

  const handlePanChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(cleaned);
  };

  const handleIfscChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfscCode(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter Party / Account name (खाते का नाम दर्ज करें)');
      return;
    }
    if (!groupId) {
      setError('Please select an Account Group (खाता समूह चुनें)');
      return;
    }
    if (!state.trim()) {
      setError('Please select State (सर्च करके राज्य चुनें)');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      groupId,
      openingBalance: Number(openingBalance) || 0,
      openingBalanceType,
      gstin: gstin.trim() || undefined,
      pan: pan.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim(),
      stateCode: stateCode.trim() || '00',
      pincode: pincode.trim() || undefined,
      country: country.trim() || 'India',
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      ifscCode: ifscCode.trim() || undefined,
      branch: branch.trim() || undefined,
      upiId: upiId.trim() || undefined,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
    };

    if (ledgerToEdit) {
      updateLedger(ledgerToEdit.id, payload);
    } else {
      addLedger(payload);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 350);
  };

  // Handle Delete Ledger Final Confirmation (Step 2 Yes)
  const handleExecuteDeleteLedger = () => {
    if (ledgerToEdit) {
      const res = deleteLedger(ledgerToEdit.id);
      if (res && !res.success) {
        setError(res.message || 'Cannot delete ledger as it has existing transactions.');
        setDeleteConfirmationStep(null);
        return;
      }
    }
    setDeleteConfirmationStep(null);
    onClose();
  };

  const selectedGroupObj = groups.find((g) => g.id === groupId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
              {ledgerToEdit ? 'Edit Ledger / Party' : 'Add New Ledger / Party'}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Customer, Vendor, Bank, Cash, or Expense Account Setup
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-1 text-xs font-semibold shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      {/* Main Full-Screen Form Container - Unified Continuous Form without gaps */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form id="ledgerForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Unified Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200 overflow-hidden">
            {/* Section 1: Basic Account & Group Details (Group Name with typing search) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-500" />
                  <span>1. Basic Account & Group Details (खाता एवं समूह विवरण)</span>
                </div>
                {onOpenGroupManager && (
                  <button
                    type="button"
                    onClick={onOpenGroupManager}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Manage Groups</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Ledger Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ledger / Party Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Trading Co., HDFC Bank, Office Rent"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-semibold text-slate-900"
                  />
                </div>

                {/* Group Name with Search / Typing Select */}
                <div className="relative" ref={groupDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Group Name (खाता समूह सर्च करें) <span className="text-rose-500">*</span>
                    </label>
                    {selectedGroupObj && (
                      <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {selectedGroupObj.nature}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={groupSearchText}
                      onChange={(e) => {
                        setGroupSearchText(e.target.value);
                        setGroupId('');
                        setIsGroupDropdownOpen(true);
                      }}
                      onFocus={() => setIsGroupDropdownOpen(true)}
                      placeholder="Type to search group e.g. Debtors, Creditors, Bank, Cash..."
                      className="w-full text-sm pl-9 pr-14 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium text-slate-900 shadow-2xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                      {groupSearchText && (
                        <button
                          type="button"
                          onClick={handleClearGroup}
                          className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                          title="Clear group"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isGroupDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Group Search Autocomplete Dropdown */}
                  {isGroupDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-56 overflow-y-auto z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      {filteredGroups.length > 0 ? (
                        filteredGroups.map((g) => {
                          const isCurrent = g.id === groupId;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleSelectGroup(g)}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="font-semibold">{g.name}</span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {g.nature}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">
                          No matching group found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Address & State Location (Address & Contact Info) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>2. Address & State Location (पता एवं राज्य विवरण)</span>
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address (पूरा पता)
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building Name, Shop No, Street, Area, Landmark"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* State Search Autocomplete Component */}
                <div className="sm:col-span-2 relative" ref={stateDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      State (सर्च करके चुनें) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                      Code: {stateCode || '--'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={stateSearchText}
                      onChange={(e) => {
                        setStateSearchText(e.target.value);
                        setState('');
                        setStateCode('');
                        setIsStateDropdownOpen(true);
                      }}
                      onFocus={() => setIsStateDropdownOpen(true)}
                      placeholder="Type state name or code to search..."
                      className="w-full text-sm pl-9 pr-14 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium shadow-2xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                      {stateSearchText && (
                        <button
                          type="button"
                          onClick={handleClearState}
                          className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                          title="Clear state"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsStateDropdownOpen((prev) => !prev)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* State Autocomplete Dropdown */}
                  {isStateDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-52 overflow-y-auto z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      {filteredStates.length > 0 ? (
                        filteredStates.map((s) => {
                          const isCurrent = s.name.toLowerCase() === state.toLowerCase();
                          return (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => handleSelectState(s)}
                              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{s.name}</span>
                              <span className="font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">
                                {s.code}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">
                          No matching state found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City (शहर / जिला)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Delhi, Jaipur"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>

                {/* Pin Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pin code (पिन कोड)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="6-digit PIN"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-mono font-medium"
                  />
                </div>
              </div>

              {/* Country, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country (देश)
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Number (मोबाइल / फोन)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (ईमेल)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="party@example.com"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: GST & PAN Registration (After Address) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>3. GST & PAN Registration (कर एवं पंजीकरण)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GST Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GST Number (GSTIN)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition uppercase font-mono tracking-wider font-semibold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    15-digit GSTIN (PAN & State will auto-fill automatically)
                  </p>
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAN Number (स्थायी खाता संख्या)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => handlePanChange(e.target.value)}
                    placeholder="e.g. AAAAA0000A"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition uppercase font-mono tracking-wider font-semibold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {gstin.length >= 12 ? '✓ Auto-extracted from GST number' : '10-character PAN number'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Bank Account Details */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <Landmark className="w-5 h-5 text-amber-500" />
                <span>4. Bank Account Details (बैंक खाता विवरण - RTGS / NEFT / UPI)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name (बैंक का नाम)
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number (खाता संख्या)
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    placeholder="e.g. 50100234567890"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-mono font-medium"
                  />
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code (आईएफएससी कोड)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => handleIfscChange(e.target.value)}
                    placeholder="e.g. HDFC0000123"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-mono uppercase font-semibold"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch (शाखा)
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Connaught Place, Main Branch"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>

                {/* UPI ID */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI ID / VPA (यूपीआई आईडी)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim())}
                    placeholder="e.g. partyname@upi, 9876543210@paytm"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Opening Balance & Credit Limit (Placed at the end) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>5. Opening Balance & Credit Limit (प्रारंभिक शेष एवं उधार सीमा)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opening Balance (प्रारंभिक शेष)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={openingBalance || ''}
                        onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                      />
                    </div>
                    <div>
                      <select
                        value={openingBalanceType}
                        onChange={(e) => setOpeningBalanceType(e.target.value as BalanceType)}
                        className="w-full text-sm px-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      >
                        <option value="Dr">Dr (Debit / लेना है)</option>
                        <option value="Cr">Cr (Credit / देना है)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dr = लेना है (Receivable/Asset) | Cr = देना है (Payable/Liability)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credit Limit (उधार सीमा - Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={creditLimit || ''}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || undefined)}
                    placeholder="e.g. 50000"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              {/* Bottom Actions Area with Delete, Cancel & Save directly in one line */}
              <div className="pt-5 border-t border-slate-200 flex flex-row items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (ledgerToEdit) {
                      setDeleteConfirmationStep('confirm1');
                    } else {
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* STEP 1 Confirmation Modal: Delete Ledger? (Yes / No) */}
      {deleteConfirmationStep === 'confirm1' && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Ledger? (खाता हटाएं?)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Do you want to delete this ledger account{name ? ` "${name}"` : ''}?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition"
              >
                No (नहीं)
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('confirm2')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow transition"
              >
                Yes (हाँ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 Confirmation Modal: Are you sure delete Ledger? (Yes / No) */}
      {deleteConfirmationStep === 'confirm2' && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-rose-600">
                Are you sure delete Ledger?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                क्या आप वाकई इस लेज़र खाते को हटाना चाहते हैं? This action is permanent.
              </p>
              {ledgerToEdit && (
                <div className="mt-2 p-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800">
                  {name || ledgerToEdit.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition"
              >
                No (नहीं)
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteLedger}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-black shadow-lg transition"
              >
                Yes (हाँ, हटाएं)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
