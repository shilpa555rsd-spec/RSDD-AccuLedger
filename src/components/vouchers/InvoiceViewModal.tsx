import React, { useState, useRef, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Voucher } from '../../types';
import { formatCurrency, formatDate, openWhatsAppShare } from '../../utils/formatters';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { getPreferredInvoiceFormat, InvoiceFormatType, setPreferredInvoiceFormat } from '../../utils/invoiceHelpers';
import { InvoiceFormat1 } from './InvoiceFormat1';
import { InvoiceFormat2 } from './InvoiceFormat2';
import { DoubleEntryVoucherFormat } from './DoubleEntryVoucherFormat';
import {
  X,
  FileDown,
  Share2,
  Printer,
  Edit2,
  Check,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical,
  MessageCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface InvoiceViewModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
  onEditVoucher?: (voucher: Voucher) => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onEditVoucher,
}) => {
  const { companyProfile, ledgers, deleteVoucher } = useAccounting();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<InvoiceFormatType>(() => {
    const pref = getPreferredInvoiceFormat();
    return pref || 'FORMAT_1';
  });

  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);

  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        formatDropdownRef.current &&
        !formatDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFormatDropdownOpen(false);
      }
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsActionsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen || !voucher) return null;

  const party = ledgers.find((l) => l.id === voucher.partyLedgerId);
  const isPurchase = voucher.type === 'PURCHASE';

  let title = 'TAX INVOICE';
  if (isPurchase) title = 'PURCHASE BILL';
  if (voucher.type === 'RECEIPT') title = 'RECEIPT VOUCHER';
  if (voucher.type === 'PAYMENT') title = 'PAYMENT VOUCHER';
  if (voucher.type === 'JOURNAL') title = 'JOURNAL VOUCHER';
  if (voucher.type === 'CONTRA') title = 'CONTRA VOUCHER';

  const handleFormatChange = (format: InvoiceFormatType) => {
    setSelectedFormat(format);
    setPreferredInvoiceFormat(format);
    setIsFormatDropdownOpen(false);
  };

  const handleDownloadPdf = async () => {
    setIsActionsDropdownOpen(false);
    try {
      setIsExporting(true);
      await generateInvoicePdf(voucher, party, companyProfile, false, selectedFormat);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    setIsActionsDropdownOpen(false);
    try {
      setIsExporting(true);
      await generateInvoicePdf(voucher, party, companyProfile, true, selectedFormat);
    } catch (err) {
      console.error('Failed to share invoice PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShare = () => {
    setIsActionsDropdownOpen(false);
    const text = `*${title}: ${voucher.voucherNumber}*
From: *${companyProfile.companyName}*
To: *${party?.name || voucher.partyName}*
Date: ${formatDate(voucher.date)}
Amount: *${formatCurrency(voucher.grandTotal)}*
Payment Mode: ${voucher.paymentMode}
${voucher.referenceNo ? `Ref No: ${voucher.referenceNo}` : ''}
${voucher.narration ? `Note: ${voucher.narration}` : ''}
--------------------------------
Thank you for your business!
_Generated via RSDD AccuLedger_`;

    openWhatsAppShare(text, party?.phone);
  };

  const handlePrint = () => {
    setIsActionsDropdownOpen(false);
    window.print();
  };

  const handleEdit = () => {
    setIsActionsDropdownOpen(false);
    onClose();
    if (onEditVoucher) {
      onEditVoucher(voucher);
    }
  };

  const handleDelete = () => {
    setIsActionsDropdownOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteVoucher(voucher.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 overflow-hidden animate-in fade-in">
      {/* Full-Screen Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between gap-3 shrink-0">
        {/* Left: Format Dropdown */}
        <div className="relative" ref={formatDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsFormatDropdownOpen(!isFormatDropdownOpen);
              setIsActionsDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            title="Choose Invoice Print & Preview Format"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Format: <strong className="text-white">{selectedFormat === 'FORMAT_1' ? 'Format 1' : 'Format 2'}</strong></span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Format Dropdown Menu */}
          {isFormatDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Select Invoice Format
              </div>

              {/* Format 1 */}
              <button
                type="button"
                onClick={() => handleFormatChange('FORMAT_1')}
                className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                  selectedFormat === 'FORMAT_1'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-slate-200 hover:bg-slate-800 font-bold'
                }`}
              >
                <div>
                  <div className="text-xs">Format 1 (Default)</div>
                  <div className={`text-[10px] ${selectedFormat === 'FORMAT_1' ? 'text-slate-900/80' : 'text-slate-400'}`}>
                    Tally Style Classic Tax Invoice
                  </div>
                </div>
                {selectedFormat === 'FORMAT_1' && <Check className="w-4 h-4 stroke-[3]" />}
              </button>

              {/* Format 2 */}
              <button
                type="button"
                onClick={() => handleFormatChange('FORMAT_2')}
                className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                  selectedFormat === 'FORMAT_2'
                    ? 'bg-sky-400 text-slate-950 font-black'
                    : 'text-slate-200 hover:bg-slate-800 font-bold'
                }`}
              >
                <div>
                  <div className="text-xs">Format 2</div>
                  <div className={`text-[10px] ${selectedFormat === 'FORMAT_2' ? 'text-slate-900/80' : 'text-slate-400'}`}>
                    Modern GST Bill Format
                  </div>
                </div>
                {selectedFormat === 'FORMAT_2' && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions Dropdown & Close (X) */}
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative" ref={actionsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsActionsDropdownOpen(!isActionsDropdownOpen);
                setIsFormatDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
              title="Voucher Actions & Export Options"
            >
              <span>Actions</span>
              <ChevronDown className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Actions Dropdown Menu */}
            {isActionsDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 sm:w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Options
                </div>

                {/* 1. Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Print</span>
                </button>

                {/* 2. Edit Voucher */}
                {onEditVoucher && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full px-3 py-2 text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    <span>Edit Voucher</span>
                  </button>
                )}

                {/* 3. WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* 4. Share PDF */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleSharePdf}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share PDF ({selectedFormat === 'FORMAT_1' ? 'F1' : 'F2'})</span>
                </button>

                {/* 5. Download PDF */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPdf}
                  className="w-full px-3 py-2 text-xs font-black text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>Download PDF ({selectedFormat === 'FORMAT_1' ? 'Format 1' : 'Format 2'})</span>
                </button>

                {/* 6. Delete Voucher */}
                <div className="border-t border-slate-800 my-1"></div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Delete Voucher</span>
                </button>
              </div>
            )}
          </div>

          {/* Close (X) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-900/40 rounded-xl transition cursor-pointer"
            title="Close Full Screen"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Full-Screen Invoice Preview Viewport */}
      <div className="p-2 sm:p-6 overflow-y-auto flex-1 bg-slate-200/90 flex flex-col items-center">
        <div className="w-full max-w-4xl pb-6">
          <div className="shadow-2xl rounded-xl bg-white overflow-hidden border border-slate-300">
            {voucher.entryMode === 'DOUBLE' || (voucher.type === 'JOURNAL' && voucher.doubleEntries && voucher.doubleEntries.length > 0) ? (
              <DoubleEntryVoucherFormat voucher={voucher} company={companyProfile} party={party} />
            ) : selectedFormat === 'FORMAT_1' ? (
              <InvoiceFormat1 voucher={voucher} company={companyProfile} party={party} />
            ) : (
              <InvoiceFormat2 voucher={voucher} company={companyProfile} party={party} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Voucher? (वाउचर हटाएं?)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">{voucher.type} #{voucher.voucherNumber}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <p className="font-semibold">⚠️ Safety Notice:</p>
              <p>This action will reverse all ledger balances and inventory stock movements associated with this voucher.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Yes, Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


