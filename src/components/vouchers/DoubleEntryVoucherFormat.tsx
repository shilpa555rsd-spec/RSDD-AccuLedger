import React from 'react';
import { Voucher, CompanyProfile, AccountLedger } from '../../types';
import { formatCurrency, formatDate, numberToWordsIndian } from '../../utils/formatters';

interface DoubleEntryVoucherFormatProps {
  voucher: Voucher;
  company: CompanyProfile;
  party?: AccountLedger;
}

export const DoubleEntryVoucherFormat: React.FC<DoubleEntryVoucherFormatProps> = ({
  voucher,
  company,
}) => {
  const entries = voucher.doubleEntries || [];
  const totalDr = entries
    .filter((e) => e.type === 'Dr')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCr = entries
    .filter((e) => e.type === 'Cr')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAmount = totalDr || voucher.grandTotal;

  const totalInWords = `INR ${numberToWordsIndian(totalAmount).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;

  let voucherTitle = 'JOURNAL VOUCHER';
  if (voucher.type === 'PAYMENT') voucherTitle = 'PAYMENT VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'RECEIPT') voucherTitle = 'RECEIPT VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'CONTRA') voucherTitle = 'CONTRA VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'SALE') voucherTitle = 'SALES VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'PURCHASE') voucherTitle = 'PURCHASE VOUCHER (DOUBLE ENTRY)';

  return (
    <div
      id="double-entry-voucher"
      className="bg-white text-black p-4 sm:p-8 text-[11px] font-sans max-w-4xl mx-auto shadow-sm print:p-0 print:border-none print:shadow-none space-y-4"
    >
      {/* Top Company Header */}
      <div className="border border-black p-4 text-center space-y-1">
        <h1 className="text-base sm:text-xl font-black tracking-wide text-black uppercase">
          {company.companyName}
        </h1>
        <div className="text-slate-700 text-[11px]">
          {[company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
        </div>
        <div className="text-slate-700 text-[10.5px]">
          {company.phone && <span>Phone: {company.phone} | </span>}
          {company.email && <span>Email: {company.email} | </span>}
          {company.gstin && <span>GSTIN: <strong>{company.gstin}</strong></span>}
        </div>
        <div className="pt-2">
          <span className="inline-block bg-slate-900 text-white font-bold text-xs px-4 py-1 rounded-sm uppercase tracking-wider">
            {voucherTitle}
          </span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="border border-black grid grid-cols-2 sm:grid-cols-4 divide-x divide-black text-[10.5px]">
        <div className="p-2.5">
          <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Voucher No.</span>
          <span className="font-mono font-bold text-black text-xs">{voucher.voucherNumber}</span>
        </div>
        <div className="p-2.5">
          <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Date</span>
          <span className="font-bold text-black">{formatDate(voucher.date)}</span>
        </div>
        <div className="p-2.5">
          <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Reference / PO No.</span>
          <span className="font-medium text-slate-800">{voucher.referenceNo || 'N/A'}</span>
        </div>
        <div className="p-2.5">
          <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Entry Mode</span>
          <span className="font-bold text-indigo-700 uppercase">Double Entry (Dr/Cr)</span>
        </div>
      </div>

      {/* Dr / Cr Accounting Table */}
      <div className="border border-black overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-black">
              <th className="py-2 px-2 border-r border-black w-14 text-center">Type</th>
              <th className="py-2 px-3 border-r border-black">Particulars / Account Ledger</th>
              <th className="py-2 px-3 border-r border-black w-32 text-right">Debit (Dr ₹)</th>
              <th className="py-2 px-3 text-right w-32">Credit (Cr ₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/40">
            {entries.length > 0 ? (
              entries.map((entry, index) => {
                const isDr = entry.type === 'Dr';
                return (
                  <tr key={entry.id || index} className="align-top">
                    <td className="py-2 px-2 border-r border-black text-center font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                          isDr ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {isDr ? 'By (Dr)' : 'To (Cr)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-black">
                      <div className="font-bold text-black text-xs">
                        {isDr ? '' : '   '} {entry.ledgerName || 'Account Ledger'}
                      </div>
                      {entry.narration && (
                        <div className="text-[10px] text-slate-600 italic mt-0.5">
                          Note: {entry.narration}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-black text-right font-mono font-bold">
                      {isDr ? formatCurrency(entry.amount, false) : ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {!isDr ? formatCurrency(entry.amount, false) : ''}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500 italic">
                  No line entries available for this voucher.
                </td>
              </tr>
            )}

            {/* Total Footer Row */}
            <tr className="border-t-2 border-black bg-slate-50 font-black">
              <td colSpan={2} className="py-2 px-3 border-r border-black text-right uppercase">
                Total (कुल योग) :
              </td>
              <td className="py-2 px-3 border-r border-black text-right font-mono text-xs">
                {formatCurrency(totalDr, false)}
              </td>
              <td className="py-2 px-3 text-right font-mono text-xs">
                {formatCurrency(totalCr, false)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="border border-black p-2.5 text-[10.5px]">
        <span className="text-slate-600">Amount in Words : </span>
        <span className="font-bold text-black">{totalInWords}</span>
      </div>

      {/* Narration Block */}
      {voucher.narration && (
        <div className="border border-black p-2.5 text-[10.5px] bg-slate-50">
          <span className="font-bold text-slate-700 uppercase text-[9.5px] block mb-0.5">
            Narration / Explanation :
          </span>
          <div className="italic text-slate-900 font-medium">
            Being {voucher.narration.replace(/^being\s+/i, '')}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="border border-black grid grid-cols-3 divide-x divide-black text-[10.5px] min-h-[70px] pt-8">
        <div className="p-2 text-center flex flex-col justify-end">
          <div className="border-t border-dotted border-black pt-1 font-semibold text-slate-700">
            Prepared By
          </div>
        </div>
        <div className="p-2 text-center flex flex-col justify-end">
          <div className="border-t border-dotted border-black pt-1 font-semibold text-slate-700">
            Checked By / Accountant
          </div>
        </div>
        <div className="p-2 text-center flex flex-col justify-end">
          <div className="border-t border-dotted border-black pt-1 font-bold text-black">
            Authorised Signatory
          </div>
        </div>
      </div>

      <div className="text-center text-[9.5px] text-slate-500 font-normal">
        Computer Generated Double Entry Voucher • RSDD AccuLedger
      </div>
    </div>
  );
};
