import React from 'react';
import { Voucher, CompanyProfile, AccountLedger } from '../../types';
import { formatCurrency, formatDate, numberToWordsIndian } from '../../utils/formatters';

interface InvoiceFormat1Props {
  voucher: Voucher;
  company: CompanyProfile;
  party?: AccountLedger;
}

export const InvoiceFormat1: React.FC<InvoiceFormat1Props> = ({ voucher, company, party }) => {
  // Aggregate items by HSN for the bottom HSN/SAC table
  const hsnMap: Record<
    string,
    { taxable: number; cgstRate: number; cgstAmt: number; sgstRate: number; sgstAmt: number; igstRate: number; igstAmt: number; totalTax: number }
  > = {};

  (voucher.items || []).forEach((item) => {
    const hsn = item.hsnCode || 'N/A';
    if (!hsnMap[hsn]) {
      const halfRate = item.gstRate / 2;
      hsnMap[hsn] = {
        taxable: 0,
        cgstRate: voucher.isInterState ? 0 : halfRate,
        cgstAmt: 0,
        sgstRate: voucher.isInterState ? 0 : halfRate,
        sgstAmt: 0,
        igstRate: voucher.isInterState ? item.gstRate : 0,
        igstAmt: 0,
        totalTax: 0,
      };
    }
    hsnMap[hsn].taxable += item.taxableAmount;
    hsnMap[hsn].cgstAmt += item.cgstAmount;
    hsnMap[hsn].sgstAmt += item.sgstAmount;
    hsnMap[hsn].igstAmt += item.igstAmount;
    hsnMap[hsn].totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
  });

  const hsnEntries = Object.entries(hsnMap);
  const totalTaxAmount = voucher.totalGst;
  const isInterstate = !!voucher.isInterState;
  const title = voucher.type === 'PURCHASE' ? 'Purchase Bill' : 'Tax Invoice';

  // Words format with INR
  const totalInWords = `INR ${numberToWordsIndian(voucher.grandTotal).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;
  const taxInWords = `INR ${numberToWordsIndian(totalTaxAmount).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;

  const totalQty = (voucher.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  const primaryUnit = voucher.items?.[0]?.unit || 'mtr';

  return (
    <div id="invoice-format-1" className="bg-white text-black p-4 sm:p-6 text-[11px] font-sans max-w-4xl mx-auto shadow-sm print:p-0 print:border-none print:shadow-none">
      
      {/* Centered Document Title */}
      <div className="text-center pb-2">
        <h1 className="text-base sm:text-lg font-bold tracking-normal text-black font-serif">
          {title}
        </h1>
      </div>

      {/* Main Outer Box */}
      <div className="border border-black">
        
        {/* Top Split: Left Column (Seller, Consignee, Buyer) vs Right Column (Invoice Metadata) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black text-[10px]">
          
          {/* LEFT COLUMN */}
          <div className="divide-y divide-black">
            {/* Seller Box */}
            <div className="p-2 space-y-0.5 min-h-[75px]">
              <div className="font-bold text-[11px] text-black">{company.companyName}</div>
              <div className="text-slate-800">{company.address || 'Address'}</div>
              <div>
                State Name : <span className="font-semibold">{company.state || 'Delhi'}</span>, Code : <span className="font-semibold">{company.stateCode || '07'}</span>
              </div>
              {company.email && <div>E-Mail : <span className="font-normal">{company.email}</span></div>}
              {company.gstin && (
                <div>
                  GSTIN/UIN : <span className="font-mono font-semibold">{company.gstin}</span>
                </div>
              )}
            </div>

            {/* Consignee (Ship to) */}
            <div className="p-2 space-y-0.5 min-h-[70px]">
              <div className="text-[9.5px] text-slate-600 font-normal">Consignee (Ship to)</div>
              <div className="font-bold text-black">{party ? party.name : voucher.partyName || 'Cash Customer'}</div>
              <div className="text-slate-800">{party?.address || 'Local Delivery'}</div>
              <div>
                GSTIN/UIN &nbsp;&nbsp;&nbsp;: <span className="font-mono font-semibold">{party?.gstin || company.gstin || '07XXXXXXXXXXXXX'}</span>
              </div>
              <div>
                State Name : <span className="font-semibold">{voucher.stateOfSupply || party?.state || company.state || 'Delhi'}</span>, Code : <span className="font-semibold">{party?.stateCode || company.stateCode || '07'}</span>
              </div>
            </div>

            {/* Buyer (Bill to) */}
            <div className="p-2 space-y-0.5 min-h-[70px]">
              <div className="text-[9.5px] text-slate-600 font-normal">Buyer (Bill to)</div>
              <div className="font-bold text-black">{party ? party.name : voucher.partyName || 'Cash Customer'}</div>
              <div className="text-slate-800">{party?.address || 'Local Address'}</div>
              <div>
                GSTIN/UIN &nbsp;&nbsp;&nbsp;: <span className="font-mono font-semibold">{party?.gstin || company.gstin || '07XXXXXXXXXXXXX'}</span>
              </div>
              <div>
                State Name : <span className="font-semibold">{voucher.stateOfSupply || party?.state || company.state || 'Delhi'}</span>, Code : <span className="font-semibold">{party?.stateCode || company.stateCode || '07'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Invoice Metadata Grid */}
          <div className="divide-y divide-black text-[10px]">
            {/* Row 1: Invoice No. | Dated */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[30px]">
                <span className="text-[9px] text-slate-600 block">Invoice No.</span>
                <span className="font-bold text-black">{voucher.voucherNumber}</span>
              </div>
              <div className="p-1.5 min-h-[30px]">
                <span className="text-[9px] text-slate-600 block">Dated</span>
                <span className="font-bold text-black">{formatDate(voucher.date)}</span>
              </div>
            </div>

            {/* Row 2: Delivery Note | Mode/Terms of Payment */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Delivery Note</span>
                <span className="text-slate-800">{voucher.referenceNo || 'xx'}</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Mode/Terms of Payment</span>
                <span className="font-medium text-slate-800">{voucher.paymentMode}</span>
              </div>
            </div>

            {/* Row 3: Reference No. & Date. | Other References */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Reference No. & Date.</span>
                <span className="text-slate-800">{voucher.referenceNo ? `${voucher.referenceNo} dt. ${formatDate(voucher.date)}` : ''}</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Other References</span>
                <span className="text-slate-800">-</span>
              </div>
            </div>

            {/* Row 4: Buyer's Order No. | Dated */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Buyer&apos;s Order No.</span>
                <span className="text-slate-800">{voucher.referenceNo || ''}</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Dated</span>
                <span className="text-slate-800">{formatDate(voucher.date)}</span>
              </div>
            </div>

            {/* Row 5: Dispatch Doc No. | Delivery Note Date */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Dispatch Doc No.</span>
                <span className="text-slate-800">Xxx</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Delivery Note Date</span>
                <span className="text-slate-800">{formatDate(voucher.date)}</span>
              </div>
            </div>

            {/* Row 6: Dispatched through | Destination */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Dispatched through</span>
                <span className="text-slate-800">Xxx</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Destination</span>
                <span className="text-slate-800">{voucher.stateOfSupply || party?.city || company.city || 'Xxx'}</span>
              </div>
            </div>

            {/* Row 7: Bill of Lading/LR-RR No. | Motor Vehicle No. */}
            <div className="grid grid-cols-2 divide-x divide-black">
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Bill of Lading/LR-RR No.</span>
                <span className="text-slate-800">13xx dt. {formatDate(voucher.date)}</span>
              </div>
              <div className="p-1.5 min-h-[28px]">
                <span className="text-[9px] text-slate-600 block">Motor Vehicle No.</span>
                <span className="text-slate-800">23xxxx</span>
              </div>
            </div>

            {/* Row 8: Terms of Delivery */}
            <div className="p-1.5 min-h-[35px]">
              <span className="text-[9px] text-slate-600 block">Terms of Delivery</span>
              <span className="text-slate-800">{voucher.narration || ''}</span>
            </div>
          </div>
        </div>

        {/* Main Items Table */}
        <div className="border-t border-black overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-black font-normal text-black text-center">
                <th className="py-1 px-1 border-r border-black w-8">Sl<br />No.</th>
                <th className="py-1 px-2 border-r border-black text-left">Description of Goods</th>
                <th className="py-1 px-2 border-r border-black w-16">HSN/SAC</th>
                <th className="py-1 px-2 border-r border-black w-20">Quantity</th>
                <th className="py-1 px-2 border-r border-black w-16 text-right">Rate</th>
                <th className="py-1 px-1 border-r border-black w-12 text-center">per</th>
                <th className="py-1 px-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-[10px]">
              {(voucher.items || []).map((item, idx) => (
                <tr key={item.id || idx} className="align-top">
                  <td className="py-1.5 px-1 border-r border-black text-center">{idx + 1}</td>
                  <td className="py-1.5 px-2 border-r border-black font-bold text-black">
                    <div>{item.itemName}</div>
                  </td>
                  <td className="py-1.5 px-2 border-r border-black text-center font-mono">{item.hsnCode || ''}</td>
                  <td className="py-1.5 px-2 border-r border-black text-right font-bold">
                    {item.quantity.toLocaleString('en-IN', { minimumFractionDigits: 0 })} {item.unit || 'mtr'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                    {formatCurrency(item.rate, false)}
                  </td>
                  <td className="py-1.5 px-1 border-r border-black text-center">{item.unit || 'mtr'}</td>
                  <td className="py-1.5 px-2 text-right font-bold font-mono">
                    {formatCurrency(item.taxableAmount, false)}
                  </td>
                </tr>
              ))}

              {/* In-table Tax Lines (as shown in Tally image: Cgst@12% / SGST @ 12%) */}
              {voucher.totalGst > 0 && (
                <>
                  {!isInterstate ? (
                    <>
                      <tr className="align-top text-[10px]">
                        <td className="border-r border-black"></td>
                        <td className="py-1 px-2 border-r border-black text-right font-bold italic text-black pr-6">
                          Cgst@{voucher.items?.[0]?.gstRate ? (voucher.items[0].gstRate / 2) : 6}%
                        </td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="py-1 px-2 text-right font-bold font-mono">
                          {formatCurrency(voucher.cgstTotal, false)}
                        </td>
                      </tr>
                      <tr className="align-top text-[10px]">
                        <td className="border-r border-black"></td>
                        <td className="py-1 px-2 border-r border-black text-right font-bold italic text-black pr-6">
                          SGST @ {voucher.items?.[0]?.gstRate ? (voucher.items[0].gstRate / 2) : 6} %
                        </td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="py-1 px-2 text-right font-bold font-mono">
                          {formatCurrency(voucher.sgstTotal, false)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="align-top text-[10px]">
                      <td className="border-r border-black"></td>
                      <td className="py-1 px-2 border-r border-black text-right font-bold italic text-black pr-6">
                        IGST @ {voucher.items?.[0]?.gstRate || 12} %
                      </td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="py-1 px-2 text-right font-bold font-mono">
                        {formatCurrency(voucher.igstTotal, false)}
                      </td>
                    </tr>
                  )}
                </>
              )}

              {voucher.roundOff !== 0 && (
                <tr className="align-top text-[10px]">
                  <td className="border-r border-black"></td>
                  <td className="py-0.5 px-2 border-r border-black text-right font-medium italic text-slate-700 pr-6">
                    Round Off
                  </td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="py-0.5 px-2 text-right font-mono">
                    {formatCurrency(voucher.roundOff, false)}
                  </td>
                </tr>
              )}

              {/* Extra spacing row if items are few to give Tally table height */}
              <tr className="h-10">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>

              {/* Total Row */}
              <tr className="border-t border-black font-bold text-black">
                <td className="py-1 px-1 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black text-right">Total</td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black text-right font-bold font-mono">
                  {totalQty.toLocaleString('en-IN', { minimumFractionDigits: 0 })} {primaryUnit}
                </td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-1 border-r border-black"></td>
                <td className="py-1 px-2 text-right font-bold font-mono">
                  ₹ {formatCurrency(voucher.grandTotal, false)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount Chargeable (in words) & E. & O.E */}
        <div className="border-t border-black p-1.5 text-[10px]">
          <div className="flex justify-between items-start">
            <span className="text-[9.5px] text-slate-700">Amount Chargeable (in words)</span>
            <span className="font-semibold text-slate-800 text-[9.5px] italic">E. & O.E</span>
          </div>
          <div className="font-bold text-black mt-0.5">
            {totalInWords}
          </div>
        </div>

        {/* HSN/SAC Tax Breakdown Table */}
        <div className="border-t border-black overflow-x-auto">
          <table className="w-full text-center text-[9px] border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-black font-normal">
                <th rowSpan={2} className="py-1 px-2 border-r border-black text-center font-normal w-32">HSN/SAC</th>
                <th rowSpan={2} className="py-1 px-2 border-r border-black text-right font-normal">Taxable<br />Value</th>
                {!isInterstate ? (
                  <>
                    <th colSpan={2} className="py-0.5 px-1 border-r border-black font-normal">Central Tax</th>
                    <th colSpan={2} className="py-0.5 px-1 border-r border-black font-normal">State Tax</th>
                  </>
                ) : (
                  <th colSpan={2} className="py-0.5 px-1 border-r border-black font-normal">Integrated Tax</th>
                )}
                <th rowSpan={2} className="py-1 px-2 text-right font-normal">Total<br />Tax Amount</th>
              </tr>
              <tr className="border-b border-black font-normal text-[8.5px]">
                {!isInterstate ? (
                  <>
                    <th className="py-0.5 px-1 border-r border-black w-14 font-normal">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right w-20 font-normal">Amount</th>
                    <th className="py-0.5 px-1 border-r border-black w-14 font-normal">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right w-20 font-normal">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="py-0.5 px-1 border-r border-black w-14 font-normal">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right w-24 font-normal">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {hsnEntries.map(([hsn, val]) => (
                <tr key={hsn}>
                  <td className="py-0.5 px-2 border-r border-black text-center font-mono">{hsn}</td>
                  <td className="py-0.5 px-2 border-r border-black text-right font-mono">{formatCurrency(val.taxable, false)}</td>
                  {!isInterstate ? (
                    <>
                      <td className="py-0.5 px-1 border-r border-black font-mono">{val.cgstRate}%</td>
                      <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(val.cgstAmt, false)}</td>
                      <td className="py-0.5 px-1 border-r border-black font-mono">{val.sgstRate}%</td>
                      <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(val.sgstAmt, false)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-0.5 px-1 border-r border-black font-mono">{val.igstRate}%</td>
                      <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(val.igstAmt, false)}</td>
                    </>
                  )}
                  <td className="py-0.5 px-2 text-right font-mono">{formatCurrency(val.totalTax, false)}</td>
                </tr>
              ))}
              
              {/* Total HSN Row */}
              <tr className="border-t border-black font-bold">
                <td className="py-0.5 px-2 border-r border-black text-right">Total</td>
                <td className="py-0.5 px-2 border-r border-black text-right font-mono">
                  {formatCurrency(voucher.taxableAmount || voucher.subtotal, false)}
                </td>
                {!isInterstate ? (
                  <>
                    <td className="py-0.5 px-1 border-r border-black"></td>
                    <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(voucher.cgstTotal, false)}</td>
                    <td className="py-0.5 px-1 border-r border-black"></td>
                    <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(voucher.sgstTotal, false)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-0.5 px-1 border-r border-black"></td>
                    <td className="py-0.5 px-1 border-r border-black text-right font-mono">{formatCurrency(voucher.igstTotal, false)}</td>
                  </>
                )}
                <td className="py-0.5 px-2 text-right font-mono">{formatCurrency(totalTaxAmount, false)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax Amount in words */}
        <div className="border-t border-black p-1.5 text-[10px]">
          <span className="text-slate-800">Tax Amount (in words) : </span>
          <span className="font-bold text-black">{taxInWords}</span>
        </div>

        {/* Declaration & Signatory Box */}
        <div className="border-t border-black grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black text-[10px]">
          <div className="p-2 space-y-1">
            <div className="font-normal text-slate-800 underline">Declaration</div>
            <p className="text-slate-900 text-[9px] leading-relaxed">
              {company.termsAndConditions ||
                'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
            </p>
          </div>

          <div className="p-2 flex flex-col justify-between items-end min-h-[80px]">
            <div className="text-[10px] font-bold text-black text-right">
              for <span className="font-bold">{company.companyName}</span>
            </div>
            <div className="text-[10px] font-normal text-slate-900 text-right pt-6">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="text-center text-[9.5px] text-slate-700 mt-2 font-normal">
        This is a Computer Generated Invoice
      </div>
    </div>
  );
};
