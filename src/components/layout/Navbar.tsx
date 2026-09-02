import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import {
  Building2,
  Settings,
  Search,
  FolderKanban,
  Database,
} from 'lucide-react';
import { CompanyProfile, VoucherType } from '../../types';

interface NavbarProps {
  onOpenSettings?: () => void;
  onOpenBackup?: () => void;
  onOpenNewVoucher?: (type: VoucherType) => void;
  onOpenAddLedger?: () => void;
  onOpenAddGroup?: () => void;
  onOpenAddItem?: () => void;
  onOpenQuickSale?: () => void;
  onOpenGroupManager?: () => void;
  onOpenCreateCompany?: () => void;
  onOpenCompanyManager?: () => void;
  onOpenDeleteCompany?: (company: CompanyProfile) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenBackup,
  onOpenGroupManager,
  searchTerm = '',
  onSearchChange,
  setActiveTab,
  onSelectTab,
}) => {
  const { companyProfile, companies, activeCompanyId, switchCompany } = useAccounting();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  const handleTabChange = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Company Dropdown Selector */}
          <div className="relative flex items-center gap-3">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => handleTabChange('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-inner shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                    RSDD <span className="text-amber-400 font-semibold">AccuLedger</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                    GST & Mobile
                  </span>
                </div>
              </div>
            </div>

            {/* Active Company Badge / Dropdown Switcher Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-left rounded-xl transition text-xs max-w-[140px] sm:max-w-[200px] md:max-w-[260px]"
                title="Click to switch or create company"
              >
                <div className="truncate min-w-0">
                  <div className="font-bold text-amber-300 truncate text-[11px] sm:text-xs">
                    {companyProfile.companyName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate hidden xs:block">
                    {companyProfile.state} • {companyProfile.gstin ? 'GST' : 'Regular'}
                  </div>
                </div>
                <span className="text-[10px] bg-slate-700 px-1 py-0.5 rounded text-slate-300 font-semibold shrink-0">
                  ▼
                </span>
              </button>

              {/* Company Switcher Popover */}
              {showCompanyMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCompanyMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Switch Company ({companies.length})
                      </span>
                    </div>

                    {/* Companies List */}
                    <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-800/40">
                      {companies.map((comp) => {
                        const isCurrent = comp.id === activeCompanyId;
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => {
                              switchCompany(comp.id);
                              setShowCompanyMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                              isCurrent
                                ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="truncate min-w-0 pr-2">
                              <div className="truncate text-xs">{comp.companyName}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {comp.state} {comp.gstin ? `| GST: ${comp.gstin}` : ''}
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search bar on desktop/tablet */}
          {onSearchChange && (
            <div className="hidden md:flex flex-1 max-w-xs mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search ledger, invoice, items..."
                  className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400 transition"
                />
              </div>
            </div>
          )}

          {/* Actions: Groups, Backup, Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Manage Groups Shortcut */}
            {onOpenGroupManager && (
              <button
                type="button"
                onClick={onOpenGroupManager}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition cursor-pointer"
                title="Add & Modify Account Groups"
              >
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>Groups</span>
              </button>
            )}

            {/* Data Backup Shortcut */}
            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg transition cursor-pointer"
                title="Data Backup & Restore (डेटा बैकअप)"
              >
                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}

            {/* Settings */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
                title="Company Settings & Alteration"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
