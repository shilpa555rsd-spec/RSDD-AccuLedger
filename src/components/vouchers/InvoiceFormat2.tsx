import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShoppingBag } from 'lucide-react';
import { Voucher, CompanyProfile, AccountLedger } from '../../types';
import { formatCurrency, formatDate, numberToWordsIndian } from '../../utils/formatters';
import { getUpiQrString } from '../../utils/invoiceHelpers';

interface InvoiceFormat2Props {
  voucher: Voucher;
  company: CompanyProfile;
  party?: AccountLedger;
}

export const InvoiceFormat2: React.FC<InvoiceFormat2Props> = ({ voucher, company, party }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const qrText = getUpiQrString(company, voucher);
    QRCode.toDataURL(qrText, { width: 140, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [company, voucher]);

  const isInterstate = !!voucher.isInterState;
  const totalQty = (voucher.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalTaxable = voucher.taxableAmount || voucher.subtotal || 0;
  const totalGstAmt = voucher.totalGst || 0;

  return (
    <div id="invoice-format-2" className="bg-white text-slate-900 p-4 sm:p-6 text-[11px] font-sans border border-slate-400 shadow-sm max-w-4xl mx-auto rounded-none print:p-0 print:border-none print:shadow-none">
      
      {/* Top Header: Title & Original/Duplicate Bill */}
      <div className="flex justify-between items-center pb-2 text-slate-800">
        <div></div>
        <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-950">
          Tax Invoice
        </h1>
        <div className="text-[10px] font-semibold text-slate-600">
          Original / Duplicate Bill
        </div>
      </div>

      {/* Main Border Box Wrapper */}
      <div className="border border-slate-400">
        
        {/* Company Header Box */}
        <div className="p-3 border-b border-slate-400 bg-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            {/* Logo / Icon */}
            <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShoppingBag className="w-7 h-7" />
            </div>

            {/* Company Info */}
            <div className="text-center sm:text-left space-y-0.5 flex-1">
              <div className="text-[10px] font-mono font-bold text-slate-700">
                GSTIN : {company.gstin || '07BGUPD3647XXXX'}
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-tight">
                {company.companyName}
              </h2>
              {company.tagline && (
                <div className="text-[11px] font-semibold text-slate-600">
                  {company.tagline}
                </div>
              )}
              <div className="text-slate-700 text-[10px]">
                {company.address}{company.city ? `, ${company.city}` : ''}{company.state ? ` - ${company.state}` : ''}{company.pincode ? ` - ${company.pincode}` : ''}
              </div>
              <div className="text-slate-700 text-[10px]">
                Contact No. : {company.phone || '+91-985689XXX9'}{company.email ? `, ${company.email}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Meta Section: Bill To / Shipp To (Left) + Invoice Info Table (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400 text-[10px]">
          
          {/* Left Column: Bill To & Shipp To */}
          <div className="divide-y divide-slate-400">
            {/* Bill To */}
            <div className="p-2 space-y-1">
              <div className="font-bold text-[11px] text-slate-950">Bill To</div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">Name :</span>
                <span className="col-span-3 font-bold text-slate-900">{party ? party.name : voucher.partyName || 'Rajiv Gupta'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">Address :</span>
                <span className="col-span-3 text-slate-800">{party?.address || company.address || '# S-50, 3rd Cross PTC Building, I.T. Estate'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">State :</span>
                <span className="col-span-3 text-slate-800">{party?.state || company.state || 'Delhi - 07'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">GSTIN :</span>
                <span className="col-span-3 font-mono font-bold text-slate-900">{party?.gstin || 'HVBADAXX456'}</span>
              </div>
            </div>

            {/* Shipp To */}
            <div className="p-2 space-y-1">
              <div className="font-bold text-[11px] text-slate-950">Shipp To</div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">Name :</span>
                <span className="col-span-3 font-bold text-slate-900">{party ? party.name : voucher.partyName || 'Rajiv Gupta'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">Address :</span>
                <span className="col-span-3 text-slate-800">{party?.address || company.address || '# S-50, 3rd Cross PTC Building, I.T. Estate'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">State :</span>
                <span className="col-span-3 text-slate-800">{voucher.stateOfSupply || party?.state || company.state || 'Delhi - 07'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-semibold text-slate-600">GSTIN :</span>
                <span className="col-span-3 font-mono font-bold text-slate-900">{party?.gstin || 'HVBADAXX456'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key-Value Table */}
          <div className="divide-y divide-slate-400 text-[10px]">
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700"># Inv. No. :</div>
              <div className="p-1.5 font-mono font-bold text-slate-950">{voucher.voucherNumber}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Inv. Date :</div>
              <div className="p-1.5 font-bold text-slate-900">{formatDate(voucher.date)}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Payment Mode :</div>
              <div className="p-1.5 font-bold text-slate-900">{voucher.paymentMode}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Reverse Charge :</div>
              <div className="p-1.5 text-slate-800">NO</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Buyer&apos;s Order No :</div>
              <div className="p-1.5 text-slate-800">{voucher.referenceNo || 'B4589'}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Supplier&apos;s Ref. :</div>
              <div className="p-1.5 text-slate-800">{voucher.referenceNo ? `S-${voucher.referenceNo.slice(0, 4)}` : 'S145'}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Vehicle Number :</div>
              <div className="p-1.5 text-slate-800">DL-01-AB-1456</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Delivery Date :</div>
              <div className="p-1.5 text-slate-800">{voucher.dueDate ? formatDate(voucher.dueDate) : formatDate(voucher.date)}</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Transport Details :</div>
              <div className="p-1.5 text-slate-800">By Road Transport</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-1.5 font-semibold text-slate-700">Terms Of Delivery :</div>
              <div className="p-1.5 text-slate-800">{voucher.narration || 'Door Delivery'}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-t border-slate-400 overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-400 bg-sky-50 text-slate-800 font-bold text-center">
                <th className="py-2 px-1.5 border-r border-slate-400 w-8">Sr</th>
                <th className="py-2 px-2 border-r border-slate-400 text-left">Goods & Service Discription</th>
                <th className="py-2 px-2 border-r border-slate-400 w-16">HSN</th>
                <th className="py-2 px-2 border-r border-slate-400 w-16">Quantity</th>
                <th className="py-2 px-2 border-r border-slate-400 w-16 text-right">Rate</th>
                <th className="py-2 px-2 border-r border-slate-400 w-20 text-right">Taxable</th>
                <th colSpan={2} className="py-1 px-1 border-r border-slate-400 w-28">
                  <div>GST</div>
                  <div className="grid grid-cols-2 text-[9px] pt-0.5 border-t border-slate-300">
                    <span>%</span>
                    <span className="text-right pr-1">Amt.</span>
                  </div>
                </th>
                <th className="py-2 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[10px]">
              {(voucher.items || []).map((item, idx) => {
                const totalItemGst = item.cgstAmount + item.sgstAmount + item.igstAmount;
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-1.5 border-r border-slate-400 text-center font-medium text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 font-semibold text-slate-950">
                      {item.itemName}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono text-slate-700">
                      {item.hsnCode || '1495'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-medium">
                      {item.quantity} {item.unit || 'Nos'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-right font-mono">
                      {formatCurrency(item.rate, false)}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-right font-mono">
                      {formatCurrency(item.taxableAmount, false)}
                    </td>
                    <td className="py-1.5 px-1 border-r border-slate-300 text-center font-mono w-10">
                      {item.gstRate}%
                    </td>
                    <td className="py-1.5 px-1 border-r border-slate-400 text-right font-mono w-16">
                      {formatCurrency(totalItemGst, false)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(item.totalAmount, false)}
                    </td>
                  </tr>
                );
              })}

              {/* Sub-Total Row */}
              <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold text-slate-900">
                <td colSpan={3} className="py-1.5 px-2 border-r border-slate-400 text-right uppercase">
                  Sub-Total:
                </td>
                <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono">
                  {totalQty}
                </td>
                <td className="border-r border-slate-400"></td>
                <td className="py-1.5 px-2 border-r border-slate-400 text-right font-mono">
                  {formatCurrency(totalTaxable, false)}
                </td>
                <td colSpan={2} className="py-1.5 px-1 border-r border-slate-400 text-right font-mono">
                  {formatCurrency(totalGstAmt, false)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-bold">
                  {formatCurrency(voucher.grandTotal, false)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Split Section: Bank Details (Left) + SUMMERY / AMOUNT (Right) */}
        <div className="border-t border-slate-400 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400 text-[10px]">
          
          {/* Left Column: Our Bank Details & Invoice Total in Word */}
          <div className="p-2.5 space-y-3">
            <div>
              <div className="font-bold text-[11px] text-slate-950 mb-1 underline">Our Bank Details</div>
              <div className="space-y-0.5 text-slate-800">
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold text-slate-600">Bank Name :</span>
                  <span className="col-span-2 font-bold">{company.bankName || 'STATE BANK OF INDIA'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold text-slate-600">Branch :</span>
                  <span className="col-span-2">{company.branch || company.city || 'Delhi'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold text-slate-600">Account No :</span>
                  <span className="col-span-2 font-mono font-bold">{company.accountNumber || '20412XXXX05'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold text-slate-600">IFSC Code :</span>
                  <span className="col-span-2 font-mono font-bold">{company.ifscCode || 'SBIN003XXXX'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold text-slate-600">UPI ID :</span>
                  <span className="col-span-2 font-mono font-bold text-sky-700">{company.upiId || 'yourid@upi'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-300">
              <span className="font-bold text-slate-800 block">Invoice Total in Word</span>
              <p className="font-bold text-slate-950 italic mt-0.5">
                Rupees {numberToWordsIndian(voucher.grandTotal).replace('Rupees', '').replace('Only', '').trim()} Only
              </p>
            </div>
          </div>

          {/* Right Column: SUMMERY / AMOUNT Table */}
          <div className="divide-y divide-slate-300 text-[10.5px]">
            <div className="grid grid-cols-2 divide-x divide-slate-400 bg-sky-50 font-bold text-slate-900 border-b border-slate-400">
              <div className="p-1.5 text-center uppercase tracking-wider">SUMMERY</div>
              <div className="p-1.5 text-center uppercase tracking-wider">AMOUNT</div>
            </div>

            {!isInterstate ? (
              <>
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="p-1.5 font-semibold text-slate-700">CGST Amt :</div>
                  <div className="p-1.5 text-right font-mono">{formatCurrency(voucher.cgstTotal, false)}</div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="p-1.5 font-semibold text-slate-700">SGST Amt :</div>
                  <div className="p-1.5 text-right font-mono">{formatCurrency(voucher.sgstTotal, false)}</div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 divide-x divide-slate-300">
                <div className="p-1.5 font-semibold text-slate-700">IGST Amt :</div>
                <div className="p-1.5 text-right font-mono">{formatCurrency(voucher.igstTotal, false)}</div>
              </div>
            )}

            <div className="grid grid-cols-2 divide-x divide-slate-300">
              <div className="p-1.5 font-semibold text-slate-700">Freight Packing Charges :</div>
              <div className="p-1.5 text-right font-mono">0.00</div>
            </div>

            {voucher.roundOff !== 0 && (
              <div className="grid grid-cols-2 divide-x divide-slate-300">
                <div className="p-1.5 font-semibold text-slate-700">Round off :</div>
                <div className="p-1.5 text-right font-mono">{formatCurrency(voucher.roundOff, false)}</div>
              </div>
            )}

            <div className="grid grid-cols-2 divide-x divide-slate-400 bg-sky-100 font-black text-slate-950 text-xs">
              <div className="p-2 uppercase">Total Amount :</div>
              <div className="p-2 text-right font-mono font-black text-sm text-slate-950">
                {formatCurrency(voucher.grandTotal, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Declaration (Left), QR (Center), Authorised Signatory (Right) */}
        <div className="border-t border-slate-400 p-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-[9.5px]">
          {/* Declaration */}
          <div className="md:col-span-6 space-y-1">
            <div className="font-bold text-slate-950 underline">Declaration</div>
            <div className="text-slate-700 space-y-0.5 leading-tight">
              <div>1. Subject to {company.city || 'Delhi'} jurisdiction</div>
              <div>2. Terms & conditions are subject to our trade policy</div>
              <div>3. Our risk & responsibility ceases after the delivery of goods.</div>
              <div className="font-semibold pt-1">E. & O.E.</div>
            </div>
          </div>

          {/* QR Code */}
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="UPI QR" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 border border-slate-300 flex items-center justify-center text-[8px]">QR Code</div>
            )}
          </div>

          {/* Signatory */}
          <div className="md:col-span-4 text-right flex flex-col justify-between h-full min-h-[60px]">
            <div className="font-bold text-[10px] text-slate-950">
              For, <span className="uppercase">{company.companyName}</span>
            </div>
            <div className="font-semibold text-slate-800 pt-6 border-t border-slate-300 text-right">
              Authorised Signatory
            </div>
          </div>
        </div>

      </div>

      {/* Footer message */}
      <div className="text-center text-[10px] font-bold text-slate-700 mt-2">
        Thank You For Business With US!
      </div>
    </div>
  );
};
