import { Voucher, CompanyProfile, AccountLedger } from '../types';

export type InvoiceFormatType = 'FORMAT_1' | 'FORMAT_2';

export const INVOICE_FORMAT_STORAGE_KEY = 'rsdd_preferred_invoice_format';

export function getPreferredInvoiceFormat(): InvoiceFormatType {
  try {
    const saved = localStorage.getItem(INVOICE_FORMAT_STORAGE_KEY);
    if (saved === 'FORMAT_1' || saved === 'FORMAT_2') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'FORMAT_1';
}

export function setPreferredInvoiceFormat(format: InvoiceFormatType): void {
  try {
    localStorage.setItem(INVOICE_FORMAT_STORAGE_KEY, format);
  } catch {
    // ignore
  }
}

// Generate pseudo IRN hash for e-invoice presentation if not provided
export function generatePseudoIrn(voucherNumber: string, date: string, gstin?: string): string {
  const seed = `${voucherNumber}-${date}-${gstin || '29AACCT3705E000'}-RSDD-INV`;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 |= 0;
    hash2 = ((hash2 << 7) + hash2) ^ char;
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const pad = 'fef1df90406b928db26a62f816debc9bb5256d9375e60dc4226653cc23a8c595';
  return (hex1 + hex2 + pad).slice(0, 64);
}

export function generateAckNumber(voucherNumber: string, date: string): string {
  const numOnly = voucherNumber.replace(/[^0-9]/g, '') || '101';
  const dateOnly = date.replace(/[^0-9]/g, '') || '20260101';
  return `1120${numOnly.padStart(4, '0')}${dateOnly.slice(2, 8)}`.slice(0, 15);
}

export function getUpiQrString(company: CompanyProfile, voucher: Voucher): string {
  if (company.upiId) {
    const amount = voucher.grandTotal.toFixed(2);
    const payeeName = encodeURIComponent(company.companyName);
    const note = encodeURIComponent(`Invoice ${voucher.voucherNumber}`);
    return `upi://pay?pa=${company.upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
  }
  // Standard verification string
  return `GSTIN:${company.gstin || 'N/A'}|INV:${voucher.voucherNumber}|DATE:${voucher.date}|VAL:${voucher.grandTotal.toFixed(2)}`;
}
