import React, { useRef, useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { ProductionEntry } from '../../types';
import { formatCurrency, formatDateIndian } from '../../utils/formatters';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Factory, 
  CheckCircle, 
  Layers, 
  Scissors, 
  Calendar, 
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ProductionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  production: ProductionEntry | null;
}

export const ProductionSlipModal: React.FC<ProductionSlipModalProps> = ({
  isOpen,
  onClose,
  production,
}) => {
  const { companyProfile } = useAccounting();
  const printRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !production) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const summaryText = `*PRODUCTION & MANUFACTURING SLIP*\n` +
      `*Company:* ${companyProfile.companyName}\n` +
      `*Batch No:* ${production.entryNumber}\n` +
      `*Date:* ${formatDateIndian(production.date)}\n` +
      `*Produced Item:* ${production.finishedItemName}\n` +
      `*Output Qty:* ${production.outputQuantity} ${production.unit}\n` +
      `*Raw Material Cost:* ${formatCurrency(production.totalRawMaterialCost)}\n` +
      `*Labour & Other Cost:* ${formatCurrency(production.totalAdditionalCost)}\n` +
      `*Total Cost:* ${formatCurrency(production.totalProductionCost)}\n` +
      `*Unit Cost:* ${formatCurrency(production.costPerUnit)} / ${production.unit}\n\n` +
      `_Generated via RSDD AccuLedger_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex flex-col justify-center items-center sm:p-3">
      <div 
        className={`bg-white w-full h-full flex flex-col transition-all duration-200 overflow-hidden ${
          isFullScreen 
            ? 'fixed inset-0 z-50 rounded-none' 
            : 'max-w-4xl max-h-[96vh] rounded-2xl border border-slate-200 shadow-2xl'
        }`}
      >
        {/* MODAL ACTION BAR */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Factory className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
              Production Slip (निर्माण पर्ची / जॉब कार्ड)
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={isFullScreen ? "Window View" : "Full Screen"}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTENT */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight">
                {companyProfile.companyName}
              </h1>
              <p className="text-xs text-slate-600 max-w-sm mt-0.5">
                {companyProfile.address}, {companyProfile.city}, {companyProfile.state} - {companyProfile.pincode}
              </p>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4">
                <span>Phone: <strong>{companyProfile.phone}</strong></span>
                {companyProfile.gstin && <span>GSTIN: <strong>{companyProfile.gstin}</strong></span>}
              </div>
            </div>
            <div className="sm:text-right bg-slate-50 border border-slate-200 rounded-xl p-3 sm:min-w-[200px]">
              <span className="inline-block bg-slate-900 text-amber-400 font-mono text-xs uppercase px-2.5 py-0.5 rounded font-bold">
                BATCH SLIP
              </span>
              <div className="text-base font-bold text-slate-950 font-mono mt-1">
                {production.entryNumber}
              </div>
              <div className="text-xs text-slate-600 mt-0.5 flex items-center sm:justify-end space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Date: {formatDateIndian(production.date)}</span>
              </div>
            </div>
          </div>

          {/* Finished Item Highlight Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Finished Goods Produced (तैयार माल):
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                {production.finishedItemName}
              </h2>
            </div>
            <div className="bg-white border border-amber-300 rounded-xl px-4 py-2 text-center shadow-xs">
              <span className="text-xs text-slate-500 block">Total Quantity</span>
              <span className="text-lg font-black text-indigo-900 font-mono">
                {production.outputQuantity} <span className="text-xs font-semibold">{production.unit}</span>
              </span>
            </div>
          </div>

          {/* Raw Materials Consumed Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>1. Raw Materials Consumed (कच्चा माल खपत विवरण)</span>
              </h4>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="p-2.5 w-8">#</th>
                    <th className="p-2.5">Raw Material Description</th>
                    <th className="p-2.5 text-right w-24">Quantity</th>
                    <th className="p-2.5 text-center w-16">Unit</th>
                    <th className="p-2.5 text-right w-24">Rate (₹)</th>
                    <th className="p-2.5 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {production.rawMaterials.map((rm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-slate-900">{rm.itemName}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{rm.quantity}</td>
                      <td className="p-2.5 text-center text-slate-600">{rm.unit}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(rm.rate)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(rm.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <td colSpan={5} className="p-2.5 text-right">
                      Subtotal Raw Materials (कुल कच्चा माल):
                    </td>
                    <td className="p-2.5 text-right font-mono text-indigo-700">
                      {formatCurrency(production.totalRawMaterialCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Direct Costs Table */}
          {production.additionalCosts && production.additionalCosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>2. Labour, Stitching &amp; Finishing Charges (मजदूरी व अन्य खर्चे)</span>
                </h4>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-xs min-w-[380px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">Expense Description</th>
                      <th className="p-2.5 text-right w-28">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {production.additionalCosts.map((cost, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-900">{cost.name}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(cost.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                      <td colSpan={2} className="p-2.5 text-right">
                        Subtotal Wages &amp; Charges (कुल मजदूरी व अन्य):
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">
                        {formatCurrency(production.totalAdditionalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Grand Cost Summary Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Production Cost Breakdown</span>
              <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                <div>Raw Materials: <strong>{formatCurrency(production.totalRawMaterialCost)}</strong></div>
                <div>Labour &amp; Expenses: <strong>{formatCurrency(production.totalAdditionalCost)}</strong></div>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-xs text-slate-400 block">Total Batch Cost</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {formatCurrency(production.totalProductionCost)}
                </span>
              </div>
              <div className="pl-6 border-l border-slate-700">
                <span className="text-xs text-emerald-400 block font-semibold">Net Cost Per Unit</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(production.costPerUnit)}
                  <span className="text-xs text-slate-300 font-normal"> /{production.unit}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {production.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Remarks / Batch Notes:</span>
              <p>{production.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-600">
            <div>
              <p className="border-t border-slate-400 pt-1 w-36 text-center font-medium">Prepared By (Store)</p>
            </div>
            <div>
              <p className="border-t border-slate-400 pt-1 w-36 text-center font-medium">Supervisor / Manager</p>
            </div>
            <div>
              <p className="border-t border-slate-400 pt-1 w-36 text-center font-medium">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
