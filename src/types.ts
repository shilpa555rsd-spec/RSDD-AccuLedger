export type GroupNature = 'Assets' | 'Liabilities' | 'Income' | 'Expenses';

export interface AccountGroup {
  id: string;
  name: string;
  nature: GroupNature;
  parentGroupId?: string;
  isDefault?: boolean;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BalanceType = 'Dr' | 'Cr';

export interface AccountLedger {
  id: string;
  name: string;
  groupId: string;
  groupName?: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  currentBalance?: number;
  currentBalanceType?: BalanceType;
  isDefault?: boolean;
  description?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  creditLimit?: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  hsnCode?: string;
  unit: string; // Pcs, Box, Kg, Mtr, Ltr, Nos, etc.
  salePrice: number;
  purchasePrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  openingStock: number;
  currentStock: number;
  minStockAlert?: number;
  description?: string;
  createdAt: string;
}

export interface RawMaterialConsumption {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  totalCost: number;
  amount?: number;
}

export interface AdditionalCostItem {
  id: string;
  name: string;
  amount: number;
}

export interface ProductionEntry {
  id: string;
  entryNumber: string;
  date: string;
  finishedItemId: string;
  finishedItemName: string;
  outputQuantity: number;
  unit: string;
  rawMaterials: RawMaterialConsumption[];
  totalRawMaterialCost: number;
  additionalCosts: AdditionalCostItem[];
  totalAdditionalCost: number;
  totalProductionCost: number;
  totalCost?: number;
  costPerUnit: number;
  notes?: string;
  createdAt: string;
}

export interface BillOfMaterial {
  id: string;
  name: string;
  finishedItemId: string;
  finishedItemName: string;
  baseOutputQty: number;
  unit: string;
  rawMaterials: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    defaultRate?: number;
  }>;
  standardAdditionalCosts?: Array<{
    name: string;
    amount: number;
  }>;
  createdAt: string;
}

export type VoucherType = 'SALE' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'CONTRA';
export type PaymentMode = 'CASH' | 'BANK' | 'CREDIT' | 'UPI' | 'CHEQUE';
export type EntryMode = 'SINGLE' | 'DOUBLE';

export interface DoubleEntryLine {
  id: string;
  type: 'Dr' | 'Cr'; // Debit or Credit (By / To)
  ledgerId: string;
  ledgerName?: string;
  amount: number;
  narration?: string;
}

export interface VoucherItem {
  id: string;
  itemId?: string;
  itemName: string;
  hsnCode?: string;
  unit?: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  amount?: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: VoucherType;
  entryMode?: EntryMode; // 'SINGLE' or 'DOUBLE'
  doubleEntries?: DoubleEntryLine[]; // Detailed Dr/Cr compound entries
  date: string; // YYYY-MM-DD
  partyLedgerId: string; // Customer, Supplier, or Primary Ledger
  partyName?: string;
  paymentLedgerId?: string; // Bank, Cash or Secondary Ledger
  paymentMode: PaymentMode;
  referenceNo?: string;
  stateOfSupply?: string;
  isInterState?: boolean;
  items: VoucherItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  narration?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  name?: string;
  tagline?: string;
  ownerName?: string;
  phone: string;
  email: string;
  country?: string;
  gstin?: string;
  pan?: string;
  address: string;
  city?: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  termsAndConditions?: string;
  invoicePrefix?: string;
  financialYearStart?: string;
  createdAt?: string;
}

export interface LedgerTransaction {
  id: string;
  voucherId: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balanceType: BalanceType;
  narration?: string;
}

export interface LedgerStatementData {
  ledger: AccountLedger;
  group?: AccountGroup;
  startDate: string;
  endDate: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  transactions: LedgerTransaction[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  closingBalanceType: BalanceType;
}

export interface ItemTransaction {
  id: string;
  sourceId: string;
  sourceNumber: string;
  sourceType: 'SALE' | 'PURCHASE' | 'MANUFACTURING_IN' | 'MANUFACTURING_OUT' | 'OPENING';
  typeBadge: string;
  date: string;
  particulars: string;
  inwardQty: number;
  outwardQty: number;
  rate: number;
  amount: number;
  runningStock: number;
  narration?: string;
}

export interface ItemStatementData {
  item: InventoryItem;
  startDate: string;
  endDate: string;
  openingStock: number;
  openingStockValue: number;
  totalInwardQty: number;
  totalInwardValue: number;
  totalOutwardQty: number;
  totalOutwardValue: number;
  closingStock: number;
  closingStockValue: number;
  transactions: ItemTransaction[];
}

export interface GSTR1Summary {
  b2bInvoices: {
    count: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    invoiceValue: number;
  };
  b2cInvoices: {
    count: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    invoiceValue: number;
  };
  hsnSummary: Array<{
    hsnCode: string;
    description: string;
    unit: string;
    totalQuantity: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
  }>;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotalTax: number;
  grandTotalValue: number;
}

export interface GSTPaymentEntry {
  id: string;
  voucherId: string;
  voucherNumber: string;
  date: string;
  voucherType: VoucherType;
  partyName: string;
  paymentLedgerName: string;
  paymentMode: string;
  cgstPaid: number;
  sgstPaid: number;
  igstPaid: number;
  totalPaid: number;
  referenceNo?: string;
  narration?: string;
}

export interface GSTR3BSummary {
  // Table 3.1 Outward Supplies (Sales)
  outwardTaxable: number;
  outwardCgst: number;
  outwardSgst: number;
  outwardIgst: number;
  outwardTotalTax: number;

  // Table 4 Eligible ITC (Purchases)
  itcTaxable: number;
  itcCgst: number;
  itcSgst: number;
  itcIgst: number;
  itcTotalTax: number;

  // Table 5.1 Tax Liability (Outward - ITC)
  netCgstLiability: number;
  netSgstLiability: number;
  netIgstLiability: number;
  netTotalLiability: number;

  // Backward compatibility alias (now reflects remaining balance payable)
  netCgstPayable: number;
  netSgstPayable: number;
  netIgstPayable: number;
  netTotalPayable: number;

  // Table 6.1 Payment of Tax (Cash/Bank Challan payments recorded via Payment Vouchers)
  paidCgst: number;
  paidSgst: number;
  paidIgst: number;
  paidOtherGst: number;
  paidTotalTax: number;

  // Remaining Net Balance Tax Payable after Challan payments
  balanceCgstPayable: number;
  balanceSgstPayable: number;
  balanceIgstPayable: number;
  balanceTotalPayable: number;

  // Status
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'NIL_LIABILITY';

  // Detailed payment records
  gstPayments: GSTPaymentEntry[];
}

export interface CompanyDataBundle {
  groups: AccountGroup[];
  ledgers: AccountLedger[];
  items: InventoryItem[];
  vouchers: Voucher[];
  productions?: ProductionEntry[];
  boms?: BillOfMaterial[];
}

export interface BackupData {
  version: string;
  app: string;
  exportedAt: string;
  companies: CompanyProfile[];
  activeCompanyId: string;
  activeCompanyProfile?: CompanyProfile;
  // Current active datasets for backward compatibility
  groups: AccountGroup[];
  ledgers: AccountLedger[];
  items: InventoryItem[];
  vouchers: Voucher[];
  productions?: ProductionEntry[];
  boms?: BillOfMaterial[];
  // Complete per-company databases
  allCompaniesData?: Record<string, CompanyDataBundle>;
}

export interface BackupImportResult {
  success: boolean;
  message: string;
  details?: {
    companiesCount: number;
    ledgersCount: number;
    vouchersCount: number;
    itemsCount: number;
    groupsCount: number;
    productionsCount?: number;
  };
}

