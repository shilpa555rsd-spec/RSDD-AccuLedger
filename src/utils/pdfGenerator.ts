import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanyProfile, LedgerStatementData, ItemStatementData, Voucher, AccountLedger, InventoryItem, GSTR1Summary, GSTR3BSummary } from '../types';
import { formatCurrency, formatDate, numberToWordsIndian } from './formatters';
import { generateAckNumber, generatePseudoIrn, getPreferredInvoiceFormat, getUpiQrString, InvoiceFormatType } from './invoiceHelpers';

// Helper to trigger download or Web Share
async function handlePdfOutput(doc: jsPDF, filename: string, title: string, shouldShare: boolean = false) {
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (shouldShare && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: title,
        text: `${title} generated from RSDD AccuLedger`,
        files: [pdfFile],
      });
      return;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share failed, fallback to download:', err);
        doc.save(filename);
      }
      return;
    }
  }

  // Direct download
  doc.save(filename);
}

export async function generateLedgerStatementPdf(
  data: LedgerStatementData,
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Details
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const addressLine = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  doc.text(addressLine, 14, 17);
  doc.text(`Phone: ${company.phone || 'N/A'} | Email: ${company.email || 'N/A'}${company.gstin ? ' | GSTIN: ' + company.gstin : ''}`, 14, 23);

  // Document Title Banner
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(0, 28, pageWidth, 10, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STATEMENT OF ACCOUNT / LEDGER', pageWidth / 2, 34.5, { align: 'center' });

  // Party Info & Period Grid
  let startY = 44;
  doc.setTextColor(30, 41, 59);
  
  // Left Box: Party Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.ledger.name, 14, startY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.group) doc.text(`Group: ${data.group.name}`, 14, startY + 5);
  if (data.ledger.phone) doc.text(`Phone: ${data.ledger.phone}`, 14, startY + 10);
  if (data.ledger.address) doc.text(`Address: ${data.ledger.address}`, 14, startY + 15);
  if (data.ledger.gstin) doc.text(`GSTIN: ${data.ledger.gstin}`, 14, startY + 20);

  // Right Box: Statement Info
  const rightX = pageWidth - 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Statement Period:', rightX, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(data.startDate)} to ${formatDate(data.endDate)}`, rightX, startY + 5, { align: 'right' });
  doc.text(`Generated On: ${formatDate(new Date().toISOString().split('T')[0])}`, rightX, startY + 10, { align: 'right' });
  doc.text(`Opening Balance: ${formatCurrency(data.openingBalance)} ${data.openingBalanceType}`, rightX, startY + 15, { align: 'right' });

  const tableStartY = startY + 27;

  // Prepare table rows
  const tableRows = data.transactions.map((tx) => [
    formatDate(tx.date),
    tx.voucherNumber,
    tx.voucherType,
    tx.particulars + (tx.narration ? `\n(${tx.narration})` : ''),
    tx.debit > 0 ? formatCurrency(tx.debit, false) : '-',
    tx.credit > 0 ? formatCurrency(tx.credit, false) : '-',
    `${formatCurrency(tx.runningBalance, false)} ${tx.balanceType}`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Vch No.', 'Type', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Totals & Closing Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, finalY + 4, pageWidth - 28, 18, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, finalY + 4, pageWidth - 28, 18, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Total Debit: ${formatCurrency(data.totalDebit)}`, 20, finalY + 11);
  doc.text(`Total Credit: ${formatCurrency(data.totalCredit)}`, 75, finalY + 11);
  
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Closing Balance: ${formatCurrency(data.closingBalance)} ${data.closingBalanceType}`,
    pageWidth - 20,
    finalY + 11,
    { align: 'right' }
  );

  // Signatory
  const footerY = Math.min(finalY + 38, 275);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer generated ledger statement.', 14, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${company.companyName}`, pageWidth - 14, footerY - 8, { align: 'right' });
  doc.text('Authorized Signatory', pageWidth - 14, footerY, { align: 'right' });

  const safePartyName = data.ledger.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Ledger_${safePartyName}_${data.startDate}_to_${data.endDate}.pdf`;

  await handlePdfOutput(doc, filename, `Ledger Statement - ${data.ledger.name}`, shouldShare);
}

export async function generateItemStatementPdf(
  data: ItemStatementData,
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Details
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const addressLine = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  doc.text(addressLine, 14, 17);
  doc.text(`Phone: ${company.phone || 'N/A'} | Email: ${company.email || 'N/A'}${company.gstin ? ' | GSTIN: ' + company.gstin : ''}`, 14, 23);

  // Document Title Banner
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(0, 28, pageWidth, 10, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STOCK ITEM REGISTER & MOVEMENT STATEMENT', pageWidth / 2, 34.5, { align: 'center' });

  // Item Info & Period Grid
  const startY = 44;
  doc.setTextColor(30, 41, 59);

  // Left Box: Item Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.item.name, 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.item.sku) doc.text(`SKU: ${data.item.sku}`, 14, startY + 5);
  if (data.item.hsnCode) doc.text(`HSN / SAC: ${data.item.hsnCode}`, 14, startY + 10);
  doc.text(`Unit: ${data.item.unit} | GST Rate: ${data.item.gstRate || 0}%`, 14, startY + 15);
  doc.text(`Purchase Rate: ${formatCurrency(data.item.purchasePrice || 0)} | Sale Rate: ${formatCurrency(data.item.salePrice || 0)}`, 14, startY + 20);

  // Right Box: Statement Summary Info
  const rightX = pageWidth - 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Statement Period:', rightX, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(data.startDate)} to ${formatDate(data.endDate)}`, rightX, startY + 5, { align: 'right' });
  doc.text(`Generated On: ${formatDate(new Date().toISOString().split('T')[0])}`, rightX, startY + 10, { align: 'right' });
  doc.text(`Opening Stock: ${data.openingStock} ${data.item.unit} (${formatCurrency(data.openingStockValue)})`, rightX, startY + 15, { align: 'right' });
  doc.text(`Closing Stock: ${data.closingStock} ${data.item.unit} (${formatCurrency(data.closingStockValue)})`, rightX, startY + 20, { align: 'right' });

  const tableStartY = startY + 27;

  // Prepare table rows
  const tableRows = data.transactions.map((tx) => [
    formatDate(tx.date),
    tx.sourceNumber,
    tx.typeBadge,
    tx.particulars + (tx.narration ? `\n(${tx.narration})` : ''),
    tx.inwardQty > 0 ? `${tx.inwardQty} ${data.item.unit}` : '-',
    tx.outwardQty > 0 ? `${tx.outwardQty} ${data.item.unit}` : '-',
    formatCurrency(tx.rate, false),
    formatCurrency(tx.amount, false),
    `${tx.runningStock} ${data.item.unit}`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Ref / Vch #', 'Type', 'Particulars (Party / Batch)', 'Inward (+)', 'Outward (-)', 'Rate (₹)', 'Amount (₹)', 'Balance Stock']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 18 },
      2: { cellWidth: 20 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Totals & Closing Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, finalY + 4, pageWidth - 28, 18, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, finalY + 4, pageWidth - 28, 18, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Total Inward: ${data.totalInwardQty} ${data.item.unit}`, 20, finalY + 11);
  doc.text(`Total Outward: ${data.totalOutwardQty} ${data.item.unit}`, 75, finalY + 11);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Closing Stock: ${data.closingStock} ${data.item.unit} (${formatCurrency(data.closingStockValue)})`,
    pageWidth - 20,
    finalY + 11,
    { align: 'right' }
  );

  // Signatory
  const footerY = Math.min(finalY + 38, 275);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer generated stock statement.', 14, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${company.companyName}`, pageWidth - 14, footerY - 8, { align: 'right' });
  doc.text('Authorized Signatory', pageWidth - 14, footerY, { align: 'right' });

  const safeItemName = data.item.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Stock_${safeItemName}_${data.startDate}_to_${data.endDate}.pdf`;

  await handlePdfOutput(doc, filename, `Stock Statement - ${data.item.name}`, shouldShare);
}

export async function generateInvoicePdfFormat1(
  voucher: Voucher,
  party: AccountLedger | undefined,
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isInterstate = !!voucher.isInterState;
  const isPurchase = voucher.type === 'PURCHASE';
  const title = isPurchase ? 'Purchase Bill' : 'Tax Invoice';

  // Centered Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 11, { align: 'center' });

  const startGridY = 15;
  const leftX = 14;
  const rightX = pageWidth - 14;
  const midX = pageWidth / 2;
  const boxHeight = 72;

  // Outer Border Box for Seller, Consignee, Buyer & Meta Grid
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Outer box
  doc.rect(leftX, startGridY, rightX - leftX, boxHeight);
  // Vertical divider
  doc.line(midX, startGridY, midX, startGridY + boxHeight);

  // LEFT COLUMN: Seller, Consignee, Buyer
  let curLeftY = startGridY + 4;
  // Seller
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(company.companyName, leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(company.address || 'Address', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.text(`State Name : ${company.state || 'Delhi'}, Code : ${company.stateCode || '07'}`, leftX + 2, curLeftY);
  curLeftY += 3.5;
  if (company.email) {
    doc.text(`E-Mail : ${company.email}`, leftX + 2, curLeftY);
    curLeftY += 3.5;
  }
  if (company.gstin) {
    doc.text(`GSTIN/UIN: ${company.gstin}`, leftX + 2, curLeftY);
    curLeftY += 3.5;
  }

  // Divider between Seller & Consignee
  const consigneeDividerY = startGridY + 24;
  doc.line(leftX, consigneeDividerY, midX, consigneeDividerY);
  curLeftY = consigneeDividerY + 3;

  // Consignee (Ship to)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Consignee (Ship to)', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(party ? party.name : voucher.partyName || 'Cash Customer', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(party?.address || 'Local Delivery', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.text(`GSTIN/UIN   : ${party?.gstin || company.gstin || '07XXXXXXXXXXXXX'}`, leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.text(`State Name  : ${voucher.stateOfSupply || party?.state || company.state || 'Delhi'}, Code : ${party?.stateCode || company.stateCode || '07'}`, leftX + 2, curLeftY);

  // Divider between Consignee & Buyer
  const buyerDividerY = startGridY + 48;
  doc.line(leftX, buyerDividerY, midX, buyerDividerY);
  curLeftY = buyerDividerY + 3;

  // Buyer (Bill to)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Buyer (Bill to)', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(party ? party.name : voucher.partyName || 'Cash Customer', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(party?.address || 'Local Address', leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.text(`GSTIN/UIN   : ${party?.gstin || company.gstin || '07XXXXXXXXXXXXX'}`, leftX + 2, curLeftY);
  curLeftY += 3.5;
  doc.text(`State Name  : ${voucher.stateOfSupply || party?.state || company.state || 'Delhi'}, Code : ${party?.stateCode || company.stateCode || '07'}`, leftX + 2, curLeftY);

  // RIGHT COLUMN: Meta rows
  const rightQuarterX = midX + (rightX - midX) / 2;
  const rightRowHeight = 9;

  for (let i = 1; i < 8; i++) {
    doc.line(midX, startGridY + i * rightRowHeight, rightX, startGridY + i * rightRowHeight);
  }
  for (let i = 0; i < 7; i++) {
    doc.line(rightQuarterX, startGridY + i * rightRowHeight, rightQuarterX, startGridY + (i + 1) * rightRowHeight);
  }

  // Row 1: Invoice No. | Dated
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Invoice No.', midX + 2, startGridY + 3);
  doc.text('Dated', rightQuarterX + 2, startGridY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(voucher.voucherNumber, midX + 2, startGridY + 7);
  doc.text(formatDate(voucher.date), rightQuarterX + 2, startGridY + 7);

  // Row 2: Delivery Note | Mode/Terms of Payment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Delivery Note', midX + 2, startGridY + rightRowHeight + 3);
  doc.text('Mode/Terms of Payment', rightQuarterX + 2, startGridY + rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(voucher.referenceNo || 'xx', midX + 2, startGridY + rightRowHeight + 7);
  doc.text(voucher.paymentMode, rightQuarterX + 2, startGridY + rightRowHeight + 7);

  // Row 3: Reference No. & Date. | Other References
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Reference No. & Date.', midX + 2, startGridY + 2 * rightRowHeight + 3);
  doc.text('Other References', rightQuarterX + 2, startGridY + 2 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(voucher.referenceNo ? `${voucher.referenceNo} dt. ${formatDate(voucher.date)}` : '', midX + 2, startGridY + 2 * rightRowHeight + 7);
  doc.text('', rightQuarterX + 2, startGridY + 2 * rightRowHeight + 7);

  // Row 4: Buyer's Order No. | Dated
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Buyer's Order No.", midX + 2, startGridY + 3 * rightRowHeight + 3);
  doc.text('Dated', rightQuarterX + 2, startGridY + 3 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(voucher.referenceNo || '', midX + 2, startGridY + 3 * rightRowHeight + 7);
  doc.text(formatDate(voucher.date), rightQuarterX + 2, startGridY + 3 * rightRowHeight + 7);

  // Row 5: Dispatch Doc No. | Delivery Note Date
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Dispatch Doc No.', midX + 2, startGridY + 4 * rightRowHeight + 3);
  doc.text('Delivery Note Date', rightQuarterX + 2, startGridY + 4 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text('Xxx', midX + 2, startGridY + 4 * rightRowHeight + 7);
  doc.text(formatDate(voucher.date), rightQuarterX + 2, startGridY + 4 * rightRowHeight + 7);

  // Row 6: Dispatched through | Destination
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Dispatched through', midX + 2, startGridY + 5 * rightRowHeight + 3);
  doc.text('Destination', rightQuarterX + 2, startGridY + 5 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text('Xxx', midX + 2, startGridY + 5 * rightRowHeight + 7);
  doc.text(voucher.stateOfSupply || party?.city || company.city || 'Xxx', rightQuarterX + 2, startGridY + 5 * rightRowHeight + 7);

  // Row 7: Bill of Lading/LR-RR No. | Motor Vehicle No.
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Bill of Lading/LR-RR No.', midX + 2, startGridY + 6 * rightRowHeight + 3);
  doc.text('Motor Vehicle No.', rightQuarterX + 2, startGridY + 6 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(`13xx dt. ${formatDate(voucher.date)}`, midX + 2, startGridY + 6 * rightRowHeight + 7);
  doc.text('23xxxx', rightQuarterX + 2, startGridY + 6 * rightRowHeight + 7);

  // Row 8: Terms of Delivery
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Terms of Delivery', midX + 2, startGridY + 7 * rightRowHeight + 3);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(voucher.narration || '', midX + 2, startGridY + 7 * rightRowHeight + 7);

  const tableStartY = startGridY + boxHeight;

  // Main Items Table matching image: Sl No. | Description of Goods | HSN/SAC | Quantity | Rate | per | Amount
  const tableRows: string[][] = [];
  const primaryUnit = voucher.items?.[0]?.unit || 'mtr';

  (voucher.items || []).forEach((item, idx) => {
    tableRows.push([
      String(idx + 1),
      item.itemName,
      item.hsnCode || '',
      `${item.quantity.toLocaleString('en-IN', { minimumFractionDigits: 0 })} ${item.unit || 'mtr'}`,
      formatCurrency(item.rate, false),
      item.unit || 'mtr',
      formatCurrency(item.taxableAmount, false),
    ]);
  });

  if (voucher.totalGst > 0) {
    if (!isInterstate) {
      const halfRate = voucher.items?.[0]?.gstRate ? voucher.items[0].gstRate / 2 : 6;
      tableRows.push(['', `Cgst@${halfRate}%`, '', '', '', '', formatCurrency(voucher.cgstTotal, false)]);
      tableRows.push(['', `SGST @ ${halfRate} %`, '', '', '', '', formatCurrency(voucher.sgstTotal, false)]);
    } else {
      const rate = voucher.items?.[0]?.gstRate || 12;
      tableRows.push(['', `IGST @ ${rate} %`, '', '', '', '', formatCurrency(voucher.igstTotal, false)]);
    }
  }

  if (voucher.roundOff !== 0) {
    tableRows.push(['', 'Round Off', '', '', '', '', formatCurrency(voucher.roundOff, false)]);
  }

  const totalQty = (voucher.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  tableRows.push([
    '',
    'Total',
    '',
    `${totalQty.toLocaleString('en-IN', { minimumFractionDigits: 0 })} ${primaryUnit}`,
    '',
    '',
    `₹ ${formatCurrency(voucher.grandTotal, false)}`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Sl\nNo.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate', 'per', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 7,
      fontStyle: 'normal',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' },
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 40;

  // Amount Chargeable in words Box
  doc.rect(leftX, afterTableY, rightX - leftX, 10);
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Amount Chargeable (in words)', leftX + 2, afterTableY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  const totalInWords = `INR ${numberToWordsIndian(voucher.grandTotal).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;
  doc.text(totalInWords, leftX + 2, afterTableY + 7.5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('E. & O.E', rightX - 2, afterTableY + 7.5, { align: 'right' });

  afterTableY += 10;

  // HSN/SAC Summary Table
  const hsnMap: Record<string, { taxable: number; cgstRate: number; cgstAmt: number; sgstRate: number; sgstAmt: number; igstRate: number; igstAmt: number; totalTax: number }> = {};
  (voucher.items || []).forEach((item) => {
    const hsn = item.hsnCode || 'N/A';
    if (!hsnMap[hsn]) {
      const halfRate = item.gstRate / 2;
      hsnMap[hsn] = {
        taxable: 0,
        cgstRate: isInterstate ? 0 : halfRate,
        cgstAmt: 0,
        sgstRate: isInterstate ? 0 : halfRate,
        sgstAmt: 0,
        igstRate: isInterstate ? item.gstRate : 0,
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

  const hsnRows: string[][] = Object.entries(hsnMap).map(([hsn, val]) => {
    if (!isInterstate) {
      return [
        hsn,
        formatCurrency(val.taxable, false),
        `${val.cgstRate}%`,
        formatCurrency(val.cgstAmt, false),
        `${val.sgstRate}%`,
        formatCurrency(val.sgstAmt, false),
        formatCurrency(val.totalTax, false),
      ];
    }
    return [
      hsn,
      formatCurrency(val.taxable, false),
      `${val.igstRate}%`,
      formatCurrency(val.igstAmt, false),
      formatCurrency(val.totalTax, false),
    ];
  });

  // Total HSN Row
  if (!isInterstate) {
    hsnRows.push([
      'Total',
      formatCurrency(voucher.taxableAmount || voucher.subtotal, false),
      '',
      formatCurrency(voucher.cgstTotal, false),
      '',
      formatCurrency(voucher.sgstTotal, false),
      formatCurrency(voucher.totalGst, false),
    ]);
  } else {
    hsnRows.push([
      'Total',
      formatCurrency(voucher.taxableAmount || voucher.subtotal, false),
      '',
      formatCurrency(voucher.igstTotal, false),
      formatCurrency(voucher.totalGst, false),
    ]);
  }

  const hsnHead = !isInterstate
    ? [
        [
          { content: 'HSN/SAC', rowSpan: 2 },
          { content: 'Taxable Value', rowSpan: 2 },
          { content: 'Central Tax', colSpan: 2 },
          { content: 'State Tax', colSpan: 2 },
          { content: 'Total Tax Amount', rowSpan: 2 },
        ],
        ['Rate', 'Amount', 'Rate', 'Amount'],
      ]
    : [
        [
          { content: 'HSN/SAC', rowSpan: 2 },
          { content: 'Taxable Value', rowSpan: 2 },
          { content: 'Integrated Tax', colSpan: 2 },
          { content: 'Total Tax Amount', rowSpan: 2 },
        ],
        ['Rate', 'Amount'],
      ];

  autoTable(doc, {
    startY: afterTableY,
    head: hsnHead,
    body: hsnRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6.5,
      fontStyle: 'normal',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'left' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterHsnY = (doc as any).lastAutoTable?.finalY || afterTableY + 25;

  // Tax Amount in words
  doc.rect(leftX, afterHsnY, rightX - leftX, 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const taxInWords = `INR ${numberToWordsIndian(voucher.totalGst).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;
  doc.text(`Tax Amount (in words) : ${taxInWords}`, leftX + 2, afterHsnY + 4.5);
  afterHsnY += 7;

  // Declaration & Signatory Box
  const declBoxHeight = 25;
  doc.rect(leftX, afterHsnY, rightX - leftX, declBoxHeight);
  doc.line(midX, afterHsnY, midX, afterHsnY + declBoxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Declaration', leftX + 2, afterHsnY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    doc.splitTextToSize(
      company.termsAndConditions || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      midX - leftX - 4
    ),
    leftX + 2,
    afterHsnY + 8
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`for ${company.companyName}`, rightX - 2, afterHsnY + 4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signatory', rightX - 2, afterHsnY + declBoxHeight - 3, { align: 'right' });

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('This is a Computer Generated Invoice', pageWidth / 2, afterHsnY + declBoxHeight + 5, { align: 'center' });

  const filename = `Invoice_${voucher.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Format1.pdf`;
  await handlePdfOutput(doc, filename, `Tax Invoice - ${voucher.voucherNumber}`, shouldShare);
}

export async function generateInvoicePdfFormat2(
  voucher: Voucher,
  party: AccountLedger | undefined,
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isInterstate = !!voucher.isInterState;
  const leftX = 14;
  const rightX = pageWidth - 14;
  const fullWidth = rightX - leftX;

  // Generate QR Code data URL for bottom center
  const qrText = getUpiQrString(company, voucher);
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrText, { width: 120, margin: 1 });
  } catch (err) {
    console.warn('QR Code generation error:', err);
  }

  // Top header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Tax Invoice', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Original /Duplicate Bill', rightX, 10, { align: 'right' });

  let curY = 14;

  // Outer Border around entire document content
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);

  // 1. Company Header Box
  const headerHeight = 24;
  doc.rect(leftX, curY, fullWidth, headerHeight);

  // Blue Accent Bag/Square for Logo
  doc.setFillColor(2, 132, 199); // sky-600
  doc.roundedRect(leftX + 4, curY + 3.5, 15, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('R', leftX + 11.5, curY + 14, { align: 'center' });

  // Company Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.text(`GSTIN : ${company.gstin || '07BGUPD3647XXXX'}`, leftX + 23, curY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), leftX + 23, curY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  if (company.tagline) {
    doc.text(company.tagline, leftX + 23, curY + 14.5);
  }
  doc.text(`${company.address || ''}, ${company.city || ''} ${company.pincode || ''}`, leftX + 23, curY + 18);
  doc.text(`Contact No. : ${company.phone || ''} ${company.email ? '| ' + company.email : ''}`, leftX + 23, curY + 21.5);

  curY += headerHeight;

  // 2. Middle 2-Column Meta Section (Bill To / Shipp To on Left, Info Grid on Right)
  const metaHeight = 44;
  const midX = leftX + (fullWidth * 0.52);

  doc.rect(leftX, curY, fullWidth, metaHeight);
  doc.line(midX, curY, midX, curY + metaHeight);

  // Left: Bill To & Shipp To
  const halfMetaHeight = metaHeight / 2;
  doc.line(leftX, curY + halfMetaHeight, midX, curY + halfMetaHeight);

  // Bill To
  let bY = curY + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Bill To', leftX + 2, bY);
  bY += 3.5;
  doc.setFontSize(7);
  doc.text(`Name : ${party ? party.name : voucher.partyName || 'Rajiv Gupta'}`, leftX + 2, bY);
  bY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Address : ${party?.address || company.address || '# S-50, 3rd Cross PTC Building'}`, leftX + 2, bY);
  bY += 3.5;
  doc.text(`State : ${party?.state || company.state || 'Delhi - 07'}`, leftX + 2, bY);
  bY += 3.5;
  doc.text(`GSTIN : ${party?.gstin || 'HVBADAXX456'}`, leftX + 2, bY);

  // Shipp To
  let sY = curY + halfMetaHeight + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Shipp To', leftX + 2, sY);
  sY += 3.5;
  doc.setFontSize(7);
  doc.text(`Name : ${party ? party.name : voucher.partyName || 'Rajiv Gupta'}`, leftX + 2, sY);
  sY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Address : ${party?.address || company.address || '# S-50, 3rd Cross PTC Building'}`, leftX + 2, sY);
  sY += 3.5;
  doc.text(`State : ${voucher.stateOfSupply || party?.state || company.state || 'Delhi - 07'}`, leftX + 2, sY);
  sY += 3.5;
  doc.text(`GSTIN : ${party?.gstin || 'HVBADAXX456'}`, leftX + 2, sY);

  // Right: Key Value rows
  const rightLabels = [
    ['# Inv. No. :', voucher.voucherNumber],
    ['Inv. Date :', formatDate(voucher.date)],
    ['Payment Mode :', voucher.paymentMode],
    ['Reverse Charge :', 'NO'],
    ["Buyer's Order No :", voucher.referenceNo || 'B4589'],
    ["Supplier's Ref. :", voucher.referenceNo ? `S-${voucher.referenceNo.slice(0, 4)}` : 'S145'],
    ['Vehicle Number :', 'DL-01-AB-1456'],
    ['Delivery Date :', voucher.dueDate ? formatDate(voucher.dueDate) : formatDate(voucher.date)],
    ['Transport Details :', 'By Road Transport'],
    ['Terms Of Delivery :', voucher.narration || 'Door Delivery'],
  ];

  const rowStep = metaHeight / 10;
  const rightMidX = midX + 26;

  for (let i = 1; i < 10; i++) {
    doc.line(midX, curY + i * rowStep, rightX, curY + i * rowStep);
  }
  doc.line(rightMidX, curY, rightMidX, curY + metaHeight);

  doc.setFontSize(6.5);
  rightLabels.forEach(([lbl, val], idx) => {
    const yPos = curY + idx * rowStep + 3.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, midX + 1.5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, rightMidX + 1.5, yPos);
  });

  curY += metaHeight;

  // 3. Items Table
  const tableRows: string[][] = (voucher.items || []).map((item, idx) => {
    const totalGst = item.cgstAmount + item.sgstAmount + item.igstAmount;
    return [
      String(idx + 1),
      item.itemName,
      item.hsnCode || '1495',
      `${item.quantity} ${item.unit || 'Nos'}`,
      formatCurrency(item.rate, false),
      formatCurrency(item.taxableAmount, false),
      `${item.gstRate}%`,
      formatCurrency(totalGst, false),
      formatCurrency(item.totalAmount, false),
    ];
  });

  const totalQty = (voucher.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalTaxable = voucher.taxableAmount || voucher.subtotal || 0;
  const totalGstAmt = voucher.totalGst || 0;

  // Sub-Total row
  tableRows.push([
    '',
    'Sub-Total:',
    '',
    `${totalQty}`,
    '',
    formatCurrency(totalTaxable, false),
    '',
    formatCurrency(totalGstAmt, false),
    formatCurrency(voucher.grandTotal, false),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [
      [
        { content: 'Sr', rowSpan: 2 },
        { content: 'Goods & Service Discription', rowSpan: 2 },
        { content: 'HSN', rowSpan: 2 },
        { content: 'Quantity', rowSpan: 2 },
        { content: 'Rate', rowSpan: 2 },
        { content: 'Taxable', rowSpan: 2 },
        { content: 'GST', colSpan: 2 },
        { content: 'Total', rowSpan: 2 },
      ],
      ['%', 'Amt.'],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [224, 242, 254], // sky-100
      textColor: [15, 23, 42],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [148, 163, 184],
      lineWidth: 0.3,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 16, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterTableY = (doc as any).lastAutoTable?.finalY || curY + 40;

  // 4. Bottom Split Section: Bank Details (Left) + SUMMERY / AMOUNT Table (Right)
  const bottomBoxHeight = 36;
  const bMidX = leftX + (fullWidth * 0.55);

  doc.rect(leftX, afterTableY, fullWidth, bottomBoxHeight);
  doc.line(bMidX, afterTableY, bMidX, afterTableY + bottomBoxHeight);

  // Left Bank Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Our Bank Details', leftX + 2, afterTableY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Bank Name : ${company.bankName || 'STATE BANK OF INDIA'}`, leftX + 2, afterTableY + 8.5);
  doc.text(`Branch : ${company.branch || company.city || 'Delhi'}`, leftX + 2, afterTableY + 12);
  doc.text(`Account No : ${company.accountNumber || '20412XXXX05'}`, leftX + 2, afterTableY + 15.5);
  doc.text(`IFSC Cocde : ${company.ifscCode || 'SBIN003XXXX'}`, leftX + 2, afterTableY + 19);
  doc.text(`UPI ID : ${company.upiId || 'yourid@upi'}`, leftX + 2, afterTableY + 22.5);

  doc.line(leftX, afterTableY + 25, bMidX, afterTableY + 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Invoice Total in Word', leftX + 2, afterTableY + 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Rupees ${numberToWordsIndian(voucher.grandTotal).replace('Rupees', '').replace('Only', '').trim()} Only`, leftX + 2, afterTableY + 32.5);

  // Right SUMMERY / AMOUNT Table
  const summeryRowH = bottomBoxHeight / 6;
  const summeryMidX = bMidX + (rightX - bMidX) / 2;

  // Header row
  doc.setFillColor(224, 242, 254);
  doc.rect(bMidX, afterTableY, rightX - bMidX, summeryRowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SUMMERY', bMidX + (rightX - bMidX) / 4, afterTableY + 4, { align: 'center' });
  doc.text('AMOUNT', rightX - (rightX - bMidX) / 4, afterTableY + 4, { align: 'center' });

  for (let i = 1; i <= 6; i++) {
    doc.line(bMidX, afterTableY + i * summeryRowH, rightX, afterTableY + i * summeryRowH);
  }
  doc.line(summeryMidX, afterTableY, summeryMidX, afterTableY + bottomBoxHeight);

  const summeryItems = [
    ['CGST Amt :', isInterstate ? '-' : formatCurrency(voucher.cgstTotal, false)],
    ['SGST Amt :', isInterstate ? '-' : formatCurrency(voucher.sgstTotal, false)],
    ['IGST Amt :', isInterstate ? formatCurrency(voucher.igstTotal, false) : '-'],
    ['Freight Packing Charges :', '0.00'],
    ['Round off :', voucher.roundOff !== 0 ? formatCurrency(voucher.roundOff, false) : '0.00'],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  summeryItems.forEach(([lbl, val], idx) => {
    const yP = afterTableY + (idx + 1) * summeryRowH + 4;
    doc.text(lbl, bMidX + 2, yP);
    doc.text(val, rightX - 2, yP, { align: 'right' });
  });

  // Total Amount Row
  doc.setFillColor(186, 230, 253); // sky-200
  doc.rect(bMidX, afterTableY + 5 * summeryRowH, rightX - bMidX, summeryRowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Total Amount :', bMidX + 2, afterTableY + 5 * summeryRowH + 4);
  doc.text(formatCurrency(voucher.grandTotal, false), rightX - 2, afterTableY + 5 * summeryRowH + 4, { align: 'right' });

  afterTableY += bottomBoxHeight;

  // 5. Declaration, QR & Signatory Section
  const declH = 24;
  doc.rect(leftX, afterTableY, fullWidth, declH);

  // Left Declaration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Declaration', leftX + 2, afterTableY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(`1. Subject to ${company.city || 'Delhi'} jurisdiction`, leftX + 2, afterTableY + 8);
  doc.text('2. Terms & conditions are subject to our trade policy', leftX + 2, afterTableY + 11.5);
  doc.text('3. Our risk & responsibility ceases after the delivery of goods.', leftX + 2, afterTableY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text('E. & O.E.', leftX + 2, afterTableY + 19);

  // Center QR
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 8, afterTableY + 2.5, 18, 18);
  }

  // Right Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`For, ${company.companyName.toUpperCase()}`, rightX - 2, afterTableY + 4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Authorised Signatory', rightX - 2, afterTableY + declH - 3, { align: 'right' });

  // 6. Bottom Thank You note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Thank You For Business With US!', pageWidth / 2, afterTableY + declH + 5, { align: 'center' });

  const filename = `Invoice_${voucher.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Format2.pdf`;
  await handlePdfOutput(doc, filename, `Tax Invoice - ${voucher.voucherNumber}`, shouldShare);
}

export async function generateDoubleEntryVoucherPdf(
  voucher: Voucher,
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 12;
  const rightX = pageWidth - 12;
  const fullWidth = rightX - leftX;

  // Header Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(leftX, 10, fullWidth, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(company.companyName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const addr = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  doc.text(addr, pageWidth / 2, 21, { align: 'center' });

  const contactLine = [
    company.phone ? `Phone: ${company.phone}` : '',
    company.email ? `Email: ${company.email}` : '',
    company.gstin ? `GSTIN: ${company.gstin}` : '',
  ].filter(Boolean).join(' | ');
  doc.text(contactLine, pageWidth / 2, 25.5, { align: 'center' });

  let voucherTitle = 'JOURNAL VOUCHER';
  if (voucher.type === 'PAYMENT') voucherTitle = 'PAYMENT VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'RECEIPT') voucherTitle = 'RECEIPT VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'CONTRA') voucherTitle = 'CONTRA VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'SALE') voucherTitle = 'SALES VOUCHER (DOUBLE ENTRY)';
  if (voucher.type === 'PURCHASE') voucherTitle = 'PURCHASE VOUCHER (DOUBLE ENTRY)';

  doc.setFillColor(30, 41, 59);
  doc.rect(pageWidth / 2 - 38, 29, 76, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(voucherTitle, pageWidth / 2, 33.2, { align: 'center' });

  // Metadata Grid
  const metaY = 38;
  const metaH = 12;
  doc.rect(leftX, metaY, fullWidth, metaH);
  const colW = fullWidth / 4;
  doc.line(leftX + colW, metaY, leftX + colW, metaY + metaH);
  doc.line(leftX + colW * 2, metaY, leftX + colW * 2, metaY + metaH);
  doc.line(leftX + colW * 3, metaY, leftX + colW * 3, metaY + metaH);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VOUCHER NO.', leftX + 2, metaY + 3.5);
  doc.text('DATE', leftX + colW + 2, metaY + 3.5);
  doc.text('REFERENCE / PO NO.', leftX + colW * 2 + 2, metaY + 3.5);
  doc.text('ENTRY MODE', leftX + colW * 3 + 2, metaY + 3.5);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(voucher.voucherNumber, leftX + 2, metaY + 8.5);
  doc.text(formatDate(voucher.date), leftX + colW + 2, metaY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.referenceNo || 'N/A', leftX + colW * 2 + 2, metaY + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('DOUBLE ENTRY (Dr/Cr)', leftX + colW * 3 + 2, metaY + 8.5);

  const entries = voucher.doubleEntries || [];
  const totalDr = entries
    .filter((e) => e.type === 'Dr')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCr = entries
    .filter((e) => e.type === 'Cr')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const tableRows: string[][] = entries.map((entry) => {
    const isDr = entry.type === 'Dr';
    return [
      isDr ? 'By (Dr)' : 'To (Cr)',
      entry.ledgerName + (entry.narration ? `\nNote: ${entry.narration}` : ''),
      isDr ? formatCurrency(entry.amount, false) : '',
      !isDr ? formatCurrency(entry.amount, false) : '',
    ];
  });

  tableRows.push([
    'TOTAL',
    'Total (कुल योग) :',
    formatCurrency(totalDr, false),
    formatCurrency(totalCr, false),
  ]);

  autoTable(doc, {
    startY: metaY + metaH + 2,
    head: [['Type', 'Particulars / Account Ledger', 'Debit (Dr ₹)', 'Credit (Cr ₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontSize: 7.5,
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let curY = (doc as any).lastAutoTable?.finalY || 120;

  // In Words & Narration
  const words = `INR ${numberToWordsIndian(totalDr || voucher.grandTotal).replace(/^Rupees\s+/i, '').replace(/Only$/i, '').trim()} Only`;
  doc.rect(leftX, curY + 2, fullWidth, 9);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Amount in Words : ', leftX + 2, curY + 7);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(words, leftX + 26, curY + 7);

  curY += 13;

  if (voucher.narration) {
    doc.rect(leftX, curY, fullWidth, 12);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('NARRATION / EXPLANATION :', leftX + 2, curY + 3.5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Being ${voucher.narration.replace(/^being\s+/i, '')}`, leftX + 2, curY + 8);
    curY += 14;
  }

  // Signatures
  const sigH = 18;
  doc.rect(leftX, curY, fullWidth, sigH);
  const sigW = fullWidth / 3;
  doc.line(leftX + sigW, curY, leftX + sigW, curY + sigH);
  doc.line(leftX + sigW * 2, curY, leftX + sigW * 2, curY + sigH);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared By', leftX + sigW / 2, curY + sigH - 3, { align: 'center' });
  doc.text('Checked By / Accountant', leftX + sigW + sigW / 2, curY + sigH - 3, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Authorised Signatory', leftX + sigW * 2 + sigW / 2, curY + sigH - 3, { align: 'center' });

  const filename = `Voucher_${voucher.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}_DoubleEntry.pdf`;
  await handlePdfOutput(doc, filename, `Voucher - ${voucher.voucherNumber}`, shouldShare);
}

export async function generateInvoicePdf(
  voucher: Voucher,
  party: AccountLedger | undefined,
  company: CompanyProfile,
  shouldShare: boolean = false,
  format?: InvoiceFormatType
): Promise<void> {
  if (voucher.entryMode === 'DOUBLE' || (voucher.type === 'JOURNAL' && voucher.doubleEntries && voucher.doubleEntries.length > 0)) {
    return generateDoubleEntryVoucherPdf(voucher, company, shouldShare);
  }
  const chosenFormat = format || getPreferredInvoiceFormat();
  if (chosenFormat === 'FORMAT_2') {
    return generateInvoicePdfFormat2(voucher, party, company, shouldShare);
  }
  return generateInvoicePdfFormat1(voucher, party, company, shouldShare);
}

export async function generateStockSummaryPdf(
  items: InventoryItem[],
  company: CompanyProfile,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.companyName.toUpperCase(), 14, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`STOCK REGISTER & INVENTORY VALUATION REPORT`, 14, 17);

  const rows = items.map((item, idx) => {
    const valuation = item.currentStock * item.purchasePrice;
    return [
      String(idx + 1),
      item.name,
      item.sku || '-',
      item.hsnCode || '-',
      `${item.currentStock} ${item.unit}`,
      formatCurrency(item.purchasePrice, false),
      formatCurrency(item.salePrice, false),
      `${item.gstRate}%`,
      formatCurrency(valuation, false),
    ];
  });

  const totalStockValuation = items.reduce((acc, it) => acc + it.currentStock * it.purchasePrice, 0);

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Item Name', 'SKU', 'HSN', 'Current Stock', 'Cost (₹)', 'Sale (₹)', 'GST', 'Valuation (₹)']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Inventory Valuation: ${formatCurrency(totalStockValuation)}`, pageWidth - 14, finalY + 10, {
    align: 'right',
  });

  const filename = `Stock_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  await handlePdfOutput(doc, filename, 'Stock Summary Report', shouldShare);
}

export async function generateGSTReportPdf(
  gstr1: GSTR1Summary,
  gstr3b: GSTR3BSummary,
  company: CompanyProfile,
  periodText: string,
  shouldShare: boolean = false
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.companyName.toUpperCase(), 14, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`GST SUMMARY REPORT (${periodText}) - GSTIN: ${company.gstin || 'N/A'}`, 14, 17);

  let currentY = 32;

  // GSTR-3B Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. GSTR-3B Tax Liability, ITC & Tax Paid (Table 3.1 & 6.1)', 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Details', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)']],
    body: [
      [
        'Outward Supplies (Sales Tax Liability)',
        formatCurrency(gstr3b.outwardTaxable, false),
        formatCurrency(gstr3b.outwardCgst, false),
        formatCurrency(gstr3b.outwardSgst, false),
        formatCurrency(gstr3b.outwardIgst, false),
        formatCurrency(gstr3b.outwardTotalTax, false),
      ],
      [
        'Eligible ITC (Purchase Tax Credit)',
        formatCurrency(gstr3b.itcTaxable, false),
        formatCurrency(gstr3b.itcCgst, false),
        formatCurrency(gstr3b.itcSgst, false),
        formatCurrency(gstr3b.itcIgst, false),
        formatCurrency(gstr3b.itcTotalTax, false),
      ],
      [
        'Net Tax Liability (Outward - ITC)',
        '-',
        formatCurrency(gstr3b.netCgstLiability || 0, false),
        formatCurrency(gstr3b.netSgstLiability || 0, false),
        formatCurrency(gstr3b.netIgstLiability || 0, false),
        formatCurrency(gstr3b.netTotalLiability || 0, false),
      ],
      [
        'Tax Paid in Cash / Bank (Challans)',
        '-',
        formatCurrency(gstr3b.paidCgst || 0, false),
        formatCurrency(gstr3b.paidSgst || 0, false),
        formatCurrency(gstr3b.paidIgst || 0, false),
        formatCurrency(gstr3b.paidTotalTax || 0, false),
      ],
      [
        'Remaining Balance GST Payable',
        '-',
        formatCurrency(gstr3b.balanceCgstPayable ?? gstr3b.netCgstPayable, false),
        formatCurrency(gstr3b.balanceSgstPayable ?? gstr3b.netSgstPayable, false),
        formatCurrency(gstr3b.balanceIgstPayable ?? gstr3b.netIgstPayable, false),
        formatCurrency(gstr3b.balanceTotalPayable ?? gstr3b.netTotalPayable, false),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable?.finalY + 12;

  // GSTR-1 Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. GSTR-1 Outward Supplies Breakdown', 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Category', 'Count', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Invoice Total (₹)']],
    body: [
      [
        'B2B (Registered Invoices)',
        String(gstr1.b2bInvoices.count),
        formatCurrency(gstr1.b2bInvoices.taxableValue, false),
        formatCurrency(gstr1.b2bInvoices.cgst, false),
        formatCurrency(gstr1.b2bInvoices.sgst, false),
        formatCurrency(gstr1.b2bInvoices.igst, false),
        formatCurrency(gstr1.b2bInvoices.invoiceValue, false),
      ],
      [
        'B2C (Consumers / Unregistered)',
        String(gstr1.b2cInvoices.count),
        formatCurrency(gstr1.b2cInvoices.taxableValue, false),
        formatCurrency(gstr1.b2cInvoices.cgst, false),
        formatCurrency(gstr1.b2cInvoices.sgst, false),
        formatCurrency(gstr1.b2cInvoices.igst, false),
        formatCurrency(gstr1.b2cInvoices.invoiceValue, false),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // 3. GST Payments / Challans Table if any
  if (gstr3b.gstPayments && gstr3b.gstPayments.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable?.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. GST Challans & Tax Payment Records (Paid via Bank/Cash)', 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Date', 'Voucher #', 'Bank / Paid From', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Paid (₹)', 'Ref / Challan']],
      body: gstr3b.gstPayments.map((p) => [
        formatDate(p.date),
        p.voucherNumber,
        p.paymentLedgerName,
        formatCurrency(p.cgstPaid, false),
        formatCurrency(p.sgstPaid, false),
        formatCurrency(p.igstPaid, false),
        formatCurrency(p.totalPaid, false),
        p.referenceNo || p.narration || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] },
      styles: { fontSize: 7.5, cellPadding: 2 },
    });
  }

  const filename = `GST_Report_${periodText.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  await handlePdfOutput(doc, filename, 'GST Summary Report', shouldShare);
}
