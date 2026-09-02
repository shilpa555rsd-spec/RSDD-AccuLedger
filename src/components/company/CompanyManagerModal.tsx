import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { CompanyProfile } from '../../types';
import {
  Building2,
  Plus,
  Check,
  Edit2,
  Trash2,
  X,
  MapPin,
  ShieldCheck,
  Phone,
  ArrowRight,
  ExternalLink,
  Briefcase,
} from 'lucide-react';

interface CompanyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewCompany: () => void;
  onEditCompany: (company: CompanyProfile) => void;
  onDeleteCompany: (company: CompanyProfile) => void;
}

export const CompanyManagerModal: React.FC<CompanyManagerModalProps> = ({
  isOpen,
  onClose,
  onCreateNewCompany,
  onEditCompany,
  onDeleteCompany,
}) => {
  const { companies, activeCompanyId, switchCompany } = useAccounting();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap truncate">
                Manage Companies (कंपनियां प्रबंधित करें)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shrink-0">
                {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Switch between company accounts or add new businesses with separate books
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewCompany();
            }}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Company (नई कंपनी)</span>
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

      {/* Main Full-Screen List Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
              Registered Companies List (पंजीकृत कंपनियों की सूची)
            </h4>
            <span className="text-xs text-slate-500">
              Click <span className="font-bold text-slate-800">Switch</span> to open active books
            </span>
          </div>

          <div className="space-y-3">
            {companies.map((company) => {
              const isActive = company.id === activeCompanyId;
              return (
                <div
                  key={company.id}
                  className={`p-4 rounded-2xl border transition relative ${
                    isActive
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {company.companyName.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {company.companyName}
                          </h4>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              <Check className="w-3 h-3" /> Active (सक्रिय)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {company.gstin && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> GST: {company.gstin}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {company.state} ({company.stateCode})
                          </span>
                          {company.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {company.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            switchCompany(company.id);
                            onClose();
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Switch (स्विच करें)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditCompany(company);
                        }}
                        title="Edit Company Details"
                        className="p-2.5 text-slate-700 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition border border-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {companies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDeleteCompany(company);
                          }}
                          title="Delete Company"
                          className="p-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Switching company updates all Ledgers, Vouchers, and Inventory seamlessly.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
        >
          Done (पूर्ण)
        </button>
      </footer>
    </div>
  );
};
