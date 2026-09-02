import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { CompanyProfile } from '../../types';
import { INDIAN_STATES } from '../../utils/formatters';
import {
  Building2,
  X,
  Check,
  Save,
  Trash2,
  AlertTriangle,
  Search,
  ChevronDown,
  MapPin,
  FileText,
  Landmark,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCompany?: CompanyProfile | null;
  onCompanySaved?: (company: CompanyProfile) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  editCompany = null,
  onCompanySaved,
}) => {
  const { createCompany, updateCompany, deleteCompany, activeCompanyId } = useAccounting();

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Delhi');
  const [stateCode, setStateCode] = useState('07');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [tagline, setTagline] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [upiId, setUpiId] = useState('');

  // Invoice & Terms
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // State Search & Autocomplete
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  const [isPanAutoFilled, setIsPanAutoFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<'none' | 'confirm1'>('none');

  // Pre-fill on open or edit
  useEffect(() => {
    if (isOpen) {
      if (editCompany) {
        setCompanyName(editCompany.companyName || '');
        setAddress(editCompany.address || '');
        setCity(editCompany.city || '');
        setStateName(editCompany.state || 'Delhi');
        setStateCode(editCompany.stateCode || '07');
        setPincode(editCompany.pincode || '');
        setCountry(editCompany.country || 'India');
        setGstin(editCompany.gstin || '');
        setPan(editCompany.pan || '');
        setPhone(editCompany.phone || '');
        setEmail(editCompany.email || '');
        setOwnerName(editCompany.ownerName || '');
        setTagline(editCompany.tagline || '');
        setBankName(editCompany.bankName || '');
        setAccountNumber(editCompany.accountNumber || '');
        setIfscCode(editCompany.ifscCode || '');
        setBranch(editCompany.branch || '');
        setUpiId(editCompany.upiId || '');
        setInvoicePrefix(editCompany.invoicePrefix || '');
        setTermsAndConditions(editCompany.termsAndConditions || '');
        setStateSearchQuery(editCompany.state || 'Delhi');
      } else {
        // Fresh Form
        setCompanyName('');
        setAddress('');
        setCity('');
        setStateName('Delhi');
        setStateCode('07');
        setPincode('');
        setCountry('India');
        setGstin('');
        setPan('');
        setPhone('');
        setEmail('');
        setOwnerName('');
        setTagline('');
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setBranch('');
        setUpiId('');
        setInvoicePrefix('');
        setTermsAndConditions(
          '1. Goods once sold will not be taken back.\n2. Payment terms: Due within 15 days of invoice date.\n3. Subject to local Jurisdiction.'
        );
        setStateSearchQuery('Delhi');
      }
      setIsStateDropdownOpen(false);
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, editCompany]);

  // Click outside state dropdown to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Indian States based on user search typing
  const filteredStates = useMemo(() => {
    if (!stateSearchQuery.trim()) return INDIAN_STATES;
    const query = stateSearchQuery.toLowerCase().trim();
    return INDIAN_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.includes(query)
    );
  }, [stateSearchQuery]);

  // Auto-fill PAN when GST number is typed/pasted
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setGstin(val);

    // In India GSTIN is 15 alphanumeric characters:
    // Format: 2-digit State Code + 10-char PAN + 1 Entity Number + 'Z' + 1 Checksum
    // Index 2 to 12 (length 10) is the PAN
    if (val.length >= 12) {
      const extractedPan = val.substring(2, 12);
      setPan(extractedPan);
      setIsPanAutoFilled(true);
    }

    // Also auto-select state if state code matches first 2 digits
    if (val.length >= 2) {
      const gstinStateCode = val.substring(0, 2);
      const matchedState = INDIAN_STATES.find((s) => s.code === gstinStateCode);
      if (matchedState && matchedState.name !== stateName) {
        setStateName(matchedState.name);
        setStateCode(matchedState.code);
        setStateSearchQuery(matchedState.name);
      }
    }
  };

  const handleSelectState = (stateItem: { code: string; name: string }) => {
    setStateName(stateItem.name);
    setStateCode(stateItem.code);
    setStateSearchQuery(stateItem.name);
    setIsStateDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('कृपया कंपनी का नाम दर्ज करें (Company Name is required)');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const profileData: Omit<CompanyProfile, 'id' | 'createdAt'> = {
        companyName: companyName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName,
        stateCode: stateCode,
        pincode: pincode.trim(),
        country: country.trim() || 'India',
        gstin: gstin.trim(),
        pan: pan.trim(),
        phone: phone.trim(),
        email: email.trim(),
        ownerName: ownerName.trim(),
        tagline: tagline.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branch: branch.trim(),
        upiId: upiId.trim(),
        invoicePrefix: invoicePrefix.trim() || companyName.substring(0, 4).toUpperCase(),
        termsAndConditions: termsAndConditions.trim(),
      };

      let savedResult: CompanyProfile;
      if (editCompany) {
        updateCompany(editCompany.id, profileData);
        savedResult = { ...editCompany, ...profileData };
      } else {
        savedResult = createCompany(profileData);
      }

      setSaveSuccess(true);
      if (onCompanySaved) {
        onCompanySaved(savedResult);
      }

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || 'कंपनी सेव करने में समस्या आई। कृपया पुनः प्रयास करें।');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
              {editCompany ? 'Edit Company Profile' : 'Create New Company'}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Enter business details, GSTIN, state and bank details for automatic invoice billing
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

      {/* Main Full-Screen Form Content - Unified Continuous Form without gaps */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-6 lg:p-8">
        <form id="companyForm" onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>
                {editCompany
                  ? 'कंपनी विवरण सफलतापूर्वक अपडेट हो गया! (Company details updated successfully)'
                  : 'नई कंपनी सफलतापूर्वक बन गई और सक्रिय हो गई! (New company created successfully)'}
              </span>
            </div>
          )}

          {/* Unified Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200 overflow-hidden">
            {/* Section 1: Basic Company Information */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>1. Company / Business Information (कंपनी की बुनियादी जानकारी)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Company / Firm Name (कंपनी या फर्म का नाम) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhe Shyam Enterprises Pvt. Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base"
                  />
                </div>

                {/* Tagline / Business Nature */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Business Nature (टैगलाइन या व्यवसाय का प्रकार)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wholesaler & Electrical Goods Trader"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Owner / Authorized Signatory Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner / Signatory Name (प्रोपराइटर या अधिकृत हस्ताक्षरकर्ता)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. R. S. Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address, State Search & Location */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>2. Address & State Location (पता एवं राज्य चयन)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Address */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Full Address (कार्यालय / दुकान का पूरा पता) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Plot No. 42, G.I.D.C. Industrial Estate, Phase-2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* State Search & Select (Interactive live filter requested by user) */}
                <div className="relative" ref={stateDropdownRef}>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    State (राज्य - नाम लिखते ही सर्च करें) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Type state name (e.g. Delhi, Maharashtra)..."
                      value={stateSearchQuery}
                      onFocus={() => setIsStateDropdownOpen(true)}
                      onChange={(e) => {
                        setStateSearchQuery(e.target.value);
                        setIsStateDropdownOpen(true);
                      }}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* State Code Badge */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Selected: <strong className="text-slate-800">{stateName}</strong></span>
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      Code: {stateCode}
                    </span>
                  </div>

                  {/* Searchable Dropdown List */}
                  {isStateDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">
                      {filteredStates.length > 0 ? (
                        filteredStates.map((item) => (
                          <div
                            key={item.code}
                            onClick={() => handleSelectState(item)}
                            className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition ${
                              stateCode === item.code
                                ? 'bg-amber-50 text-amber-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {item.name}
                            </span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 font-bold">
                              Code: {item.code}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">
                          कोई राज्य नहीं मिला (No matching state found)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    City / Town (शहर)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Pin code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    PIN Code (पिन कोड) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 110020"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Country (देश)
                  </label>
                  <input
                    type="text"
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Contact Number (फोन / मोबाइल नंबर) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Email Address (ईमेल पता)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. accounts@mycompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: GSTIN & PAN (with Auto-fill from GSTIN) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>3. GST & Tax Registration (जीएसटी एवं पैन नंबर)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GSTIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    GST Number (GSTIN - 15 Letters/Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={gstin}
                    onChange={handleGstinChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold tracking-wider text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    GSTIN डालते ही PAN नंबर अपने आप भर जाएगा (Auto-fills PAN automatically)
                  </p>
                </div>

                {/* PAN Number (Auto-filled) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      PAN Number (पैन नंबर)
                    </label>
                    {isPanAutoFilled && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-filled from GSTIN
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAAAA0000A"
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      setIsPanAutoFilled(false);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold tracking-wider text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    10-character Permanent Account Number
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Bank Account Details */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100">
                <Landmark className="w-5 h-5 text-amber-500" />
                <span>4. Bank Account Details (बैंक खाता विवरण - बिल पर प्रिंट होने हेतु)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Bank Name (बैंक का नाम)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India / HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Bank Account Number (खाता संख्या)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50200012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    IFSC Code (IFSC कोड)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Branch Name (शाखा का नाम)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Market Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* UPI ID */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    UPI ID (भुगतान हेतु UPI ID / VPA)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. companyname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Invoice Settings & Terms */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>5. Invoice Prefix & Terms (बिल प्रीफिक्स एवं नियम)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Invoice Number Prefix (बिल प्रीफिक्स)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. RSDD, INV"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Default Terms & Conditions (बिल के नियम व शर्तें)
                  </label>
                  <textarea
                    rows={2}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {/* Actions directly inside Section 5 */}
              <div className="pt-4 border-t border-slate-200 flex flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 hidden sm:block">
                  * Marked fields are mandatory for compliant GST invoicing
                </div>

                <div className="flex flex-row items-center gap-2 sm:gap-3 ml-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (editCompany) {
                        setDeleteConfirmationStep('confirm1');
                      } else {
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-sm hover:shadow transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
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
          </div>
        </form>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmationStep === 'confirm1' && editCompany && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Company? (कंपनी हटाएं?)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">"{editCompany.companyName}"</strong>? This will remove the company profile.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('none')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteCompany(editCompany.id);
                  if (res.success) {
                    setDeleteConfirmationStep('none');
                    onClose();
                  } else {
                    setErrorMessage(res.message || 'Cannot delete company');
                    setDeleteConfirmationStep('none');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
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
