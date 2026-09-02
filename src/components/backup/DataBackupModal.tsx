import React, { useState, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileJson,
  Building2,
  Receipt,
  BookOpen,
  Package,
  HardDrive,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { BackupImportResult } from '../../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const {
    companies,
    activeCompanyId,
    companyProfile,
    ledgers,
    vouchers,
    items,
    groups,
    productions,
    exportBackupJson,
    importBackupJson,
    resetToSampleData,
  } = useAccounting();

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BackupImportResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      exportBackupJson();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await importBackupJson(file);
      setImportResult(result);
    } catch (e: any) {
      setImportResult({
        success: false,
        message: e?.message || 'Failed to parse backup file.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    resetToSampleData();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-7 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Data Backup & Restore</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Secure
                </span>
              </div>
              <p className="text-xs text-slate-400">डेटा सुरक्षित बैकअप डाउनलोड करें या पिछला बैकअप रिस्टोर करें</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Current Company Data Overview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Current Active Database ({companyProfile.companyName})
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                100% Offline / Local Storage
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-500" /> Companies
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{companies.length}</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-500" /> Ledgers
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{ledgers.length}</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <Receipt className="w-3 h-3 text-emerald-500" /> Vouchers
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{vouchers.length}</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <Package className="w-3 h-3 text-blue-500" /> Items
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">{items.length}</div>
              </div>
            </div>
          </div>

          {/* 1. EXPORT / DOWNLOAD BACKUP */}
          <div className="p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/20 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Download / Export Data Backup (JSON)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Save a full backup of all companies, ledgers, vouchers, items, and settings to your device.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Export Backup Now'}</span>
              </button>
            </div>

            {exportSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Backup JSON downloaded successfully! Keep this file in a safe place.</span>
              </div>
            )}
          </div>

          {/* 2. IMPORT / RESTORE BACKUP */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Restore / Import Data Backup (JSON File)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload your previously saved AccuLedger JSON backup file to restore all your accounts and entries.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 shadow-2xs">
                <FileJson className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Click to browse or Drag & Drop Backup JSON file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports all RSDD AccuLedger Backup JSON formats</p>
            </div>

            {isImporting && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Restoring backup data into local database...</span>
              </div>
            )}

            {importResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                  importResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {importResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importResult.message}</span>
                </div>

                {importResult.success && importResult.details && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200">
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">Companies</span>
                      <span className="font-black text-xs text-slate-900">{importResult.details.companiesCount}</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">Ledgers</span>
                      <span className="font-black text-xs text-slate-900">{importResult.details.ledgersCount}</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">Vouchers</span>
                      <span className="font-black text-xs text-slate-900">{importResult.details.vouchersCount}</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">Items</span>
                      <span className="font-black text-xs text-slate-900">{importResult.details.itemsCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. RESET TO SAMPLE DATA */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset to Sample Data (नमूना डेटा रीसेट करें)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Loads initial demo entries. (Recommended to export backup first)
                </p>
              </div>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  Reset Sample Data
                </button>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {resetSuccess && (
              <div className="mt-2 p-2 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold">
                Sample data has been reloaded.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-7 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All your data is securely stored on your device.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            Done (पूर्ण)
          </button>
        </div>
      </div>
    </div>
  );
};
