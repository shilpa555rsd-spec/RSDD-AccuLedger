import React, { useState, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { CompanyProfile } from '../../types';
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle2,
  Building2,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile | null;
  onDeleted?: () => void;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onDeleted,
}) => {
  const { deleteCompany, companies } = useAccounting();
  const [step, setStep] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !company) return null;

  const handleStep1Yes = () => {
    if (companies.length <= 1) {
      setErrorMsg('कम से कम एक कंपनी का होना अनिवार्य है। आप एकमात्र कंपनी को डिलीट नहीं कर सकते। (Cannot delete the only company)');
      return;
    }
    setStep(2);
  };

  const handleFinalDelete = () => {
    setIsDeleting(true);
    setErrorMsg('');

    const res = deleteCompany(company.id);
    if (!res.success) {
      setIsDeleting(false);
      setErrorMsg(res.message || 'कंपनी डिलीट करने में विफल (Failed to delete company)');
      return;
    }

    if (onDeleted) {
      onDeleted();
    }

    setTimeout(() => {
      setIsDeleting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Step 1: Initial Confirmation */}
        {step === 1 && (
          <div>
            {/* Header */}
            <div className="px-6 py-4 bg-amber-500 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-950 text-amber-400 rounded-xl shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Delete Company? (कंपनी हटाएं?)</h3>
                  <p className="text-[11px] text-slate-900 font-medium">Step 1 of 2: Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-800 hover:text-slate-950 hover:bg-amber-600/30 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{company.companyName}</h4>
                  <p className="text-xs text-slate-500">
                    GSTIN: {company.gstin || 'Unregistered'} | {company.state}
                  </p>
                </div>
              </div>

              <div className="text-slate-700 text-sm space-y-1">
                <p className="font-semibold text-slate-900">
                  Delete Company? (क्या आप इस कंपनी को हटाना चाहते हैं?)
                </p>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-800">{company.companyName}</strong>?
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                >
                  No (नहीं)
                </button>
                <button
                  type="button"
                  onClick={handleStep1Yes}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Yes (हाँ)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Final Critical Confirmation */}
        {step === 2 && (
          <div>
            {/* Header */}
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white text-rose-600 rounded-xl shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Are you sure delete Company?</h3>
                  <p className="text-[11px] text-rose-100 font-medium">अंतिम पुष्टि - क्या आप वाकई सुनिश्चित हैं?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-rose-100 hover:text-white hover:bg-rose-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-950 text-sm">
                    Are you sure delete Company? (क्या आप वाकई डिलीट करना चाहते हैं?)
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    यह क्रिया पूर्ववत नहीं की जा सकती (Irreversible)। <strong>{company.companyName}</strong> का सारा डेटा, वाउचर, इन्वेंटरी और बिल हमेशा के लिए इस डिवाइस से हटा दिए जाएंगे।
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                >
                  No (नहीं, वापस जाएं)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleFinalDelete}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes (हाँ, डिलीट करें)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
