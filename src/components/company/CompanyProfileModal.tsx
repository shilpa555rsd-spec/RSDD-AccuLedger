import React, { useState, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { CompanyProfile } from '../../types';
import { INDIAN_STATES } from '../../utils/formatters';
import {
  Building2,
  X,
  Check,
  Save,
  Plus,
  Edit2,
  ChevronDown,
  Sparkles,
  Layers,
  Landmark,
  Database,
  Download,
  Upload,
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateCompany?: () => void;
  onOpenEditCompany?: (company: CompanyProfile) => void;
  onOpenCompanyManager?: () => void;
  onOpenDeleteCompany?: (company: CompanyProfile) => void;
  onOpenBackup?: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateCompany,
  onOpenEditCompany,
  onOpenCompanyManager,
  onOpenBackup,
}) => {
  const { companyProfile, updateCompany, updateCompanyProfile, companies, activeCompanyId, switchCompany } = useAccounting();
  
  // Track currently selected company in settings to view/alter
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(activeCompanyId);
  const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = companies.find((c) => c.id === activeCompanyId) || companyProfile;
      setSelectedCompanyId(current.id);
      setFormData(current);
    }
  }, [isOpen, activeCompanyId, companyProfile, companies]);

  // When dropdown selection changes, load that company's data into the form
  const handleSelectCompany = (compId: string) => {
    setSelectedCompanyId(compId);
    const targetComp = companies.find((c) => c.id === compId);
    if (targetComp) {
      setFormData(targetComp);
    }
  };

  if (!isOpen) return null;

  const currentSelectedCompany = companies.find((c) => c.id === selectedCompanyId) || formData;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'state') {
        const found = INDIAN_STATES.find((s) => s.name === value);
        if (found) updated.stateCode = found.code;
      }
      if (field === 'gstin') {
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        updated.gstin = cleaned;
        if (cleaned.length >= 12) {
          updated.pan = cleaned.substring(2, 12);
        }
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update company in multi-company registry
    if (selectedCompanyId) {
      updateCompany(selectedCompanyId, formData);
    }
    // If it is active company, also update company profile
    if (selectedCompanyId === activeCompanyId) {
      updateCompanyProfile(formData);
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate flex items-center gap-2">
              <span>Settings & Company Alteration</span>
              <span className="text-xs sm:text-sm font-normal text-amber-400 hidden md:inline">
                (सेटिंग्स एवं कंपनी परिवर्तन)
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Create new company, switch active account, or alter / modify registered companies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="submit"
            form="companySettingsForm"
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Alterations</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        {/* 1. SABSE PEHLE: Create Company Option */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-dashed border-amber-400 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Create New Company</h3>
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded-full">
                  NEW ACCOUNT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Start a new business / company account with GST and separate books</p>
            </div>
          </div>

          {onOpenCreateCompany && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateCompany();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-sm shadow-md transition active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Company (नई कंपनी बनाएं)</span>
            </button>
          )}
        </div>

        {/* 2. USKE NICHE: Dropdown List of Created Companies to Alter / Modify with Edit Mark */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>Select Company to Alter / Modify (कंपनी चुनें व बदलें)</span>
            </label>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {companies.length} Registered Companies
            </span>
          </div>

          {/* Drop Down List & Edit Mark Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <select
                value={selectedCompanyId}
                onChange={(e) => handleSelectCompany(e.target.value)}
                className="w-full text-sm font-bold pl-4 pr-10 py-3 bg-slate-50 hover:bg-white border-2 border-slate-300 hover:border-amber-400 focus:border-amber-500 rounded-xl shadow-xs transition appearance-none cursor-pointer text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id} className="font-semibold text-slate-900">
                    🏢 {comp.companyName} {comp.id === activeCompanyId ? ' (Active)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-600">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* Edit Mark Button next to Dropdown */}
            {onOpenEditCompany && (
              <button
                type="button"
                title="Alter / Modify this Company"
                onClick={() => {
                  const target = companies.find((c) => c.id === selectedCompanyId) || currentSelectedCompany;
                  onClose();
                  onOpenEditCompany(target);
                }}
                className="flex items-center gap-1.5 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Alter Full</span>
              </button>
            )}
          </div>

          {/* List of Companies with Edit Mark */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-600">All Registered Companies (Click ✏️ Edit to Alter / Switch):</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {companies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                const isActive = comp.id === activeCompanyId;
                return (
                  <div
                    key={comp.id}
                    onClick={() => handleSelectCompany(comp.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{comp.companyName}</span>
                        {isActive && (
                          <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {comp.state} {comp.gstin ? `• GST: ${comp.gstin}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Mark */}
                      <button
                        type="button"
                        title="Edit / Alter Company"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCompany(comp.id);
                          if (onOpenEditCompany) {
                            onClose();
                            onOpenEditCompany(comp);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-extrabold border border-amber-300 transition active:scale-95 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-800" />
                        <span>Edit</span>
                      </button>

                      {!isActive && (
                        <button
                          type="button"
                          title="Switch to this Company"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchCompany(comp.id);
                            handleSelectCompany(comp.id);
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Company Alter / Modification Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-500" />
              <span>
                Alter Company Details: <span className="text-amber-600 underline font-extrabold">{formData.companyName}</span>
              </span>
            </div>
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              Editing: {formData.id === activeCompanyId ? '(Active Account)' : '(Inactive)'}
            </span>
          </div>

          <form id="companySettingsForm" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company / Firm Name (कंपनी या फर्म का नाम) *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number (15 अक्षरों का GST नंबर)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number (10 अक्षरों का पैन नंबर)</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="e.g. AAAAA0000A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State (राज्य) *</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold cursor-pointer"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City (शहर)</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address (पूरा पता)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Mobile (फ़ोन नंबर)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (ईमेल आईडी)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <span>Bank Details for Invoices (बिल पर प्रिंट होने वाली बैंक जानकारी)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name (बैंक का नाम)</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Number (खाता संख्या)</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="e.g. 50200012345678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code (आईएफएससी कोड)</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">UPI ID / VPA (यूपीआई आईडी)</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => handleChange('upiId', e.target.value)}
                    placeholder="e.g. rsdd@okaxis"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Terms & Conditions on Invoice</label>
              <input
                type="text"
                value={formData.termsAndConditions}
                onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
              />
            </div>

            {/* Data Backup & Security Shortcut Card */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-2xs shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    Complete Data Backup & Restore (डेटा बैकअप)
                  </div>
                  <div className="text-xs text-slate-600">
                    Export all companies, ledgers, vouchers and items into a safe JSON file
                  </div>
                </div>
              </div>

              {onOpenBackup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBackup();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Backup Manager</span>
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {onOpenCompanyManager ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCompanyManager();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Manage All Companies</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {isSaved ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
                  <span>{isSaved ? 'Saved Alterations!' : 'Save / Alter Company'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
