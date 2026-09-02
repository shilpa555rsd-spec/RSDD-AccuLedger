import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AccountGroup,
  AccountLedger,
  InventoryItem,
  Voucher,
  CompanyProfile,
  VoucherType,
  LedgerStatementData,
  LedgerTransaction,
  ItemStatementData,
  ItemTransaction,
  GSTR1Summary,
  GSTR3BSummary,
  GSTPaymentEntry,
  BalanceType,
  ProductionEntry,
  BillOfMaterial,
  BackupData,
  BackupImportResult,
  CompanyDataBundle,
} from '../types';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_GROUPS,
  INITIAL_LEDGERS,
  INITIAL_ITEMS,
  INITIAL_VOUCHERS,
  INITIAL_BOMS,
  INITIAL_PRODUCTIONS,
} from '../data/initialData';
import { getFinancialYearDates, getTodayDateString } from '../utils/formatters';

interface AccountingContextType {
  // Companies Management
  companies: CompanyProfile[];
  activeCompanyId: string;
  createCompany: (profile: Omit<CompanyProfile, 'id' | 'createdAt'>) => CompanyProfile;
  updateCompany: (id: string, profile: Partial<CompanyProfile>) => void;
  deleteCompany: (id: string) => { success: boolean; message?: string };
  switchCompany: (id: string) => void;

  // Groups
  groups: AccountGroup[];
  addGroup: (group: Omit<AccountGroup, 'id' | 'createdAt'>) => AccountGroup;
  updateGroup: (id: string, group: Partial<AccountGroup>) => void;
  deleteGroup: (id: string) => { success: boolean; message?: string };

  // Ledgers
  ledgers: AccountLedger[];
  addLedger: (ledger: Omit<AccountLedger, 'id' | 'createdAt'>) => AccountLedger;
  updateLedger: (id: string, ledger: Partial<AccountLedger>) => void;
  deleteLedger: (id: string) => { success: boolean; message?: string };
  getLedgerById: (id: string) => AccountLedger | undefined;

  // Inventory Items
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => InventoryItem;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => { success: boolean; message?: string };
  getItemById: (id: string) => InventoryItem | undefined;

  // Manufacturing & Bill of Materials (BOM)
  productions: ProductionEntry[];
  addProduction: (entry: Omit<ProductionEntry, 'id' | 'createdAt'>) => ProductionEntry;
  deleteProduction: (id: string) => { success: boolean; message?: string };
  getNextProductionNumber: () => string;
  boms: BillOfMaterial[];
  addBOM: (bom: Omit<BillOfMaterial, 'id' | 'createdAt'>) => BillOfMaterial;
  updateBOM: (id: string, bom: Partial<BillOfMaterial>) => void;
  deleteBOM: (id: string) => void;

  // Vouchers
  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'createdAt'>) => Voucher;
  updateVoucher: (id: string, voucher: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  getNextVoucherNumber: (type: VoucherType) => string;

  // Company Profile (Active Company)
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;

  // Reports Generators
  getLedgerStatement: (ledgerId: string, startDate?: string, endDate?: string) => LedgerStatementData | null;
  getItemStatement: (itemId: string, startDate?: string, endDate?: string) => ItemStatementData | null;
  getGSTR1Summary: (startDate?: string, endDate?: string) => GSTR1Summary;
  getGSTR3BSummary: (startDate?: string, endDate?: string) => GSTR3BSummary;
  getDayBook: (date: string) => Voucher[];
  getTrialBalance: () => Array<{ ledger: AccountLedger; group?: AccountGroup; debit: number; credit: number }>;
  getProfitAndLoss: (startDate?: string, endDate?: string) => {
    salesTotal: number;
    closingStockValue: number;
    purchasesTotal: number;
    openingStockValue: number;
    directExpenses: number;
    grossProfit: number;
    indirectIncomes: number;
    indirectExpenses: number;
    netProfit: number;
  };
  getBalanceSheet: () => {
    assets: Array<{ name: string; amount: number; group: string }>;
    liabilities: Array<{ name: string; amount: number; group: string }>;
    totalAssets: number;
    totalLiabilities: number;
  };

  // Quick stats
  totalSales: number;
  totalPurchases: number;
  totalReceivables: number;
  totalPayables: number;
  totalCashBank: number;
  cashBalance: number;
  bankBalance: number;
  lowStockItems: InventoryItem[];

  // Data persistence
  exportBackupJson: () => void;
  importBackupJson: (file: File) => Promise<BackupImportResult>;
  resetToSampleData: () => void;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANIES: 'rsdd_companies_list',
  ACTIVE_COMPANY_ID: 'rsdd_active_company_id',
  LEGACY_COMPANY: 'rsdd_company_profile',
  LEGACY_GROUPS: 'rsdd_account_groups',
  LEGACY_LEDGERS: 'rsdd_account_ledgers',
  LEGACY_ITEMS: 'rsdd_inventory_items',
  LEGACY_VOUCHERS: 'rsdd_vouchers',
};

function getInitialCompanies(): { companies: CompanyProfile[]; activeId: string } {
  const savedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
  const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);

  if (savedCompanies) {
    try {
      const parsed: CompanyProfile[] = JSON.parse(savedCompanies);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeId = savedActiveId && parsed.some((c) => c.id === savedActiveId)
          ? savedActiveId
          : parsed[0].id;
        return { companies: parsed, activeId };
      }
    } catch (e) {
      console.error('Error parsing saved companies:', e);
    }
  }

  // Check legacy single company profile
  const legacyCompany = localStorage.getItem(STORAGE_KEYS.LEGACY_COMPANY);
  let defaultCompany: CompanyProfile = INITIAL_COMPANY_PROFILE;
  if (legacyCompany) {
    try {
      const parsed = JSON.parse(legacyCompany);
      defaultCompany = { ...INITIAL_COMPANY_PROFILE, ...parsed, id: parsed.id || 'comp-1' };
    } catch (e) {
      console.error('Error parsing legacy company:', e);
    }
  }

  const defaultId = defaultCompany.id || 'comp-1';

  // Migrate legacy data to default company if available
  if (!localStorage.getItem(`rsdd_comp_${defaultId}_groups`)) {
    const legacyGroups = localStorage.getItem(STORAGE_KEYS.LEGACY_GROUPS);
    if (legacyGroups) localStorage.setItem(`rsdd_comp_${defaultId}_groups`, legacyGroups);
  }
  if (!localStorage.getItem(`rsdd_comp_${defaultId}_ledgers`)) {
    const legacyLedgers = localStorage.getItem(STORAGE_KEYS.LEGACY_LEDGERS);
    if (legacyLedgers) localStorage.setItem(`rsdd_comp_${defaultId}_ledgers`, legacyLedgers);
  }
  if (!localStorage.getItem(`rsdd_comp_${defaultId}_items`)) {
    const legacyItems = localStorage.getItem(STORAGE_KEYS.LEGACY_ITEMS);
    if (legacyItems) localStorage.setItem(`rsdd_comp_${defaultId}_items`, legacyItems);
  }
  if (!localStorage.getItem(`rsdd_comp_${defaultId}_vouchers`)) {
    const legacyVouchers = localStorage.getItem(STORAGE_KEYS.LEGACY_VOUCHERS);
    if (legacyVouchers) localStorage.setItem(`rsdd_comp_${defaultId}_vouchers`, legacyVouchers);
  }

  const initialList = [{ ...defaultCompany, id: defaultId }];
  localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(initialList));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, defaultId);
  return { companies: initialList, activeId: defaultId };
}

const loadCompanyData = (companyId: string) => {
  const savedGroups = localStorage.getItem(`rsdd_comp_${companyId}_groups`);
  const savedLedgers = localStorage.getItem(`rsdd_comp_${companyId}_ledgers`);
  const savedItems = localStorage.getItem(`rsdd_comp_${companyId}_items`);
  const savedVouchers = localStorage.getItem(`rsdd_comp_${companyId}_vouchers`);
  const savedProductions = localStorage.getItem(`rsdd_comp_${companyId}_productions`);
  const savedBoms = localStorage.getItem(`rsdd_comp_${companyId}_boms`);

  let loadedGroups: AccountGroup[] = savedGroups ? JSON.parse(savedGroups) : INITIAL_GROUPS;
  // Ensure default groups (e.g. Sundry Debtors, Sundry Creditors) exist
  INITIAL_GROUPS.forEach((defaultGrp) => {
    if (!loadedGroups.some((g) => g.id === defaultGrp.id || g.name.toLowerCase() === defaultGrp.name.toLowerCase())) {
      loadedGroups.push(defaultGrp);
    }
  });

  let loadedLedgers: AccountLedger[] = savedLedgers ? JSON.parse(savedLedgers) : INITIAL_LEDGERS;
  // Ensure default GST ledgers (CGST, SGST, IGST) exist
  INITIAL_LEDGERS.forEach((defaultLed) => {
    if (!loadedLedgers.some((l) => l.id === defaultLed.id || l.name.toUpperCase() === defaultLed.name.toUpperCase())) {
      loadedLedgers.push(defaultLed);
    }
  });

  return {
    groups: loadedGroups,
    ledgers: loadedLedgers,
    items: savedItems ? JSON.parse(savedItems) : (companyId === 'comp-1' ? INITIAL_ITEMS : []),
    vouchers: savedVouchers ? JSON.parse(savedVouchers) : (companyId === 'comp-1' ? INITIAL_VOUCHERS : []),
    productions: savedProductions ? JSON.parse(savedProductions) : (companyId === 'comp-1' ? INITIAL_PRODUCTIONS : []),
    boms: savedBoms ? JSON.parse(savedBoms) : (companyId === 'comp-1' ? INITIAL_BOMS : []),
  };
};

// Helper to identify GST ledgers
const isCgstLedger = (ledger?: AccountLedger | null) => {
  if (!ledger) return false;
  const n = (ledger.name || '').trim().toUpperCase();
  const id = (ledger.id || '').toLowerCase();
  return (
    id === 'led-cgst' ||
    n === 'CGST' ||
    n === 'CGST A/C' ||
    n === 'CENTRAL GST' ||
    n.includes('CGST') ||
    n.includes('CENTRAL GST')
  );
};

const isSgstLedger = (ledger?: AccountLedger | null) => {
  if (!ledger) return false;
  const n = (ledger.name || '').trim().toUpperCase();
  const id = (ledger.id || '').toLowerCase();
  return (
    id === 'led-sgst' ||
    n === 'SGST' ||
    n === 'SGST A/C' ||
    n === 'STATE GST' ||
    n === 'UTGST' ||
    n.includes('SGST') ||
    n.includes('STATE GST') ||
    n.includes('UTGST')
  );
};

const isIgstLedger = (ledger?: AccountLedger | null) => {
  if (!ledger) return false;
  const n = (ledger.name || '').trim().toUpperCase();
  const id = (ledger.id || '').toLowerCase();
  return (
    id === 'led-igst' ||
    n === 'IGST' ||
    n === 'IGST A/C' ||
    n === 'INTEGRATED GST' ||
    n.includes('IGST') ||
    n.includes('INTEGRATED GST')
  );
};

const isGeneralGstLedger = (ledger?: AccountLedger | null) => {
  if (!ledger) return false;
  const n = (ledger.name || '').trim().toUpperCase();
  const gId = (ledger.groupId || '').toLowerCase();
  return (
    isCgstLedger(ledger) ||
    isSgstLedger(ledger) ||
    isIgstLedger(ledger) ||
    gId === 'grp-duties-taxes' ||
    n.includes('DUTIES & TAXES') ||
    n.includes('GST PAYABLE') ||
    n.includes('GST CHALLAN') ||
    n.includes('TAX PAYMENT') ||
    n.includes('GST PAYMENT')
  );
};

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSetup = useMemo(() => getInitialCompanies(), []);
  const [companies, setCompanies] = useState<CompanyProfile[]>(initialSetup.companies);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(initialSetup.activeId);

  const activeCompany = useMemo(() => {
    const found = companies.find((c) => c.id === activeCompanyId);
    return found || companies[0] || INITIAL_COMPANY_PROFILE;
  }, [companies, activeCompanyId]);

  const [groups, setGroups] = useState<AccountGroup[]>(() => loadCompanyData(initialSetup.activeId).groups);
  const [ledgers, setLedgers] = useState<AccountLedger[]>(() => loadCompanyData(initialSetup.activeId).ledgers);
  const [items, setItems] = useState<InventoryItem[]>(() => loadCompanyData(initialSetup.activeId).items);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => loadCompanyData(initialSetup.activeId).vouchers);
  const [productions, setProductions] = useState<ProductionEntry[]>(() => loadCompanyData(initialSetup.activeId).productions);
  const [boms, setBoms] = useState<BillOfMaterial[]>(() => loadCompanyData(initialSetup.activeId).boms);

  // Persist companies list and active ID
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, activeCompanyId);
    // Legacy sync
    if (activeCompany) {
      localStorage.setItem(STORAGE_KEYS.LEGACY_COMPANY, JSON.stringify(activeCompany));
    }
  }, [activeCompanyId, activeCompany]);

  // Persist current company's data
  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_groups`, JSON.stringify(groups));
      localStorage.setItem(STORAGE_KEYS.LEGACY_GROUPS, JSON.stringify(groups));
    }
  }, [groups, activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_ledgers`, JSON.stringify(ledgers));
      localStorage.setItem(STORAGE_KEYS.LEGACY_LEDGERS, JSON.stringify(ledgers));
    }
  }, [ledgers, activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_items`, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.LEGACY_ITEMS, JSON.stringify(items));
    }
  }, [items, activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_vouchers`, JSON.stringify(vouchers));
      localStorage.setItem(STORAGE_KEYS.LEGACY_VOUCHERS, JSON.stringify(vouchers));
    }
  }, [vouchers, activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_productions`, JSON.stringify(productions));
    }
  }, [productions, activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(`rsdd_comp_${activeCompanyId}_boms`, JSON.stringify(boms));
    }
  }, [boms, activeCompanyId]);

  // Switch Company
  const switchCompany = (targetCompanyId: string) => {
    if (targetCompanyId === activeCompanyId) return;
    const targetCompany = companies.find((c) => c.id === targetCompanyId);
    if (!targetCompany) return;

    // Load data for new active company
    const data = loadCompanyData(targetCompanyId);
    setActiveCompanyId(targetCompanyId);
    setGroups(data.groups);
    setLedgers(data.ledgers);
    setItems(data.items);
    setVouchers(data.vouchers);
    setProductions(data.productions);
    setBoms(data.boms);
  };

  // Create Company
  const createCompany = (profileData: Omit<CompanyProfile, 'id' | 'createdAt'>): CompanyProfile => {
    const newId = `comp-${Date.now()}`;
    const newCompany: CompanyProfile = {
      ...profileData,
      id: newId,
      country: profileData.country || 'India',
      createdAt: getTodayDateString(),
    };

    // Store new company's data in localStorage with standard default groups and GST ledgers
    localStorage.setItem(`rsdd_comp_${newId}_groups`, JSON.stringify(INITIAL_GROUPS));
    localStorage.setItem(`rsdd_comp_${newId}_ledgers`, JSON.stringify(INITIAL_LEDGERS));
    localStorage.setItem(`rsdd_comp_${newId}_items`, JSON.stringify([]));
    localStorage.setItem(`rsdd_comp_${newId}_vouchers`, JSON.stringify([]));
    localStorage.setItem(`rsdd_comp_${newId}_productions`, JSON.stringify([]));
    localStorage.setItem(`rsdd_comp_${newId}_boms`, JSON.stringify([]));

    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);

    // Switch to new company
    setActiveCompanyId(newId);
    setGroups(INITIAL_GROUPS);
    setLedgers(INITIAL_LEDGERS);
    setItems([]);
    setVouchers([]);
    setProductions([]);
    setBoms([]);

    return newCompany;
  };

  // Update Company
  const updateCompany = (id: string, profileData: Partial<CompanyProfile>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...profileData } : c))
    );
  };

  // Delete Company
  const deleteCompany = (id: string): { success: boolean; message?: string } => {
    if (companies.length <= 1) {
      return {
        success: false,
        message: 'कम से कम एक कंपनी का होना अनिवार्य है। आप एकमात्र कंपनी को डिलीट नहीं कर सकते।',
      };
    }

    const remainingCompanies = companies.filter((c) => c.id !== id);

    // Remove stored data for deleted company
    localStorage.removeItem(`rsdd_comp_${id}_groups`);
    localStorage.removeItem(`rsdd_comp_${id}_ledgers`);
    localStorage.removeItem(`rsdd_comp_${id}_items`);
    localStorage.removeItem(`rsdd_comp_${id}_vouchers`);
    localStorage.removeItem(`rsdd_comp_${id}_productions`);
    localStorage.removeItem(`rsdd_comp_${id}_boms`);

    setCompanies(remainingCompanies);

    // If active company was deleted, switch to the first remaining company
    if (activeCompanyId === id) {
      const nextActiveId = remainingCompanies[0].id;
      setActiveCompanyId(nextActiveId);
      const data = loadCompanyData(nextActiveId);
      setGroups(data.groups);
      setLedgers(data.ledgers);
      setItems(data.items);
      setVouchers(data.vouchers);
      setProductions(data.productions);
      setBoms(data.boms);
    }

    return { success: true };
  };

  const updateCompanyProfile = (profileData: Partial<CompanyProfile>) => {
    updateCompany(activeCompanyId, profileData);
  };

  // Recalculate stock and ledger balances dynamically
  const calculatedLedgers = useMemo(() => {
    return ledgers.map((ledger) => {
      const isCgst = isCgstLedger(ledger);
      const isSgst = isSgstLedger(ledger);
      const isIgst = isIgstLedger(ledger);

      let balance = ledger.openingBalanceType === 'Dr' ? ledger.openingBalance : -ledger.openingBalance;

      vouchers.forEach((v) => {
        // 1. Handle Double Entry Mode Vouchers
        if (v.entryMode === 'DOUBLE' && v.doubleEntries && v.doubleEntries.length > 0) {
          v.doubleEntries.forEach((entry) => {
            if (entry.ledgerId === ledger.id) {
              if (entry.type === 'Dr') {
                balance += entry.amount; // Debit adds to positive (Dr)
              } else if (entry.type === 'Cr') {
                balance -= entry.amount; // Credit subtracts from positive (Cr)
              }
            }
          });
          return;
        }

        // 2. Handle Single Entry / Standard Vouchers
        if (isCgst || isSgst || isIgst) {
          // GST Ledger calculation:
          // SALE -> Output Tax Credit (liability increases => -)
          // PURCHASE -> Input Tax Debit (ITC increases => +)
          // PAYMENT -> Tax Paid Debit (+); RECEIPT -> Tax Refund Credit (-)
          let taxAmt = 0;
          if (isCgst) taxAmt = v.cgstTotal || 0;
          else if (isSgst) taxAmt = v.sgstTotal || 0;
          else if (isIgst) taxAmt = v.igstTotal || 0;

          if (v.type === 'SALE' && taxAmt > 0) {
            balance -= taxAmt; // Credit (Liability)
          } else if (v.type === 'PURCHASE' && taxAmt > 0) {
            balance += taxAmt; // Debit (Input Tax Credit)
          }

          if (v.partyLedgerId === ledger.id) {
            if (v.type === 'PAYMENT') {
              balance += v.grandTotal;
            } else if (v.type === 'RECEIPT') {
              balance -= v.grandTotal;
            } else if (v.type === 'JOURNAL') {
              balance += v.grandTotal;
            }
          }

          if (v.paymentLedgerId === ledger.id) {
            if (v.type === 'JOURNAL') {
              balance -= v.grandTotal;
            }
          }
        } else {
          if (v.partyLedgerId === ledger.id) {
            if (v.type === 'SALE') {
              balance += v.grandTotal; // Debited (Customer owes more)
            } else if (v.type === 'RECEIPT') {
              balance -= v.grandTotal; // Credited (Customer paid)
            } else if (v.type === 'PURCHASE') {
              balance -= v.grandTotal; // Credited (We owe vendor more)
            } else if (v.type === 'PAYMENT') {
              balance += v.grandTotal; // Debited (Vendor paid / expense paid)
            } else if (v.type === 'CONTRA') {
              balance -= v.grandTotal; // Credited (Paid from / Outflow)
            } else if (v.type === 'JOURNAL') {
              balance += v.grandTotal; // Debited
            }
          }

          if (v.paymentLedgerId === ledger.id) {
            if (v.type === 'RECEIPT' || (v.type === 'SALE' && v.paymentMode !== 'CREDIT')) {
              balance += v.grandTotal; // Bank / Cash inflow
            } else if (v.type === 'PAYMENT' || (v.type === 'PURCHASE' && v.paymentMode !== 'CREDIT')) {
              balance -= v.grandTotal; // Bank / Cash outflow
            } else if (v.type === 'CONTRA') {
              balance += v.grandTotal; // Deposit to / Inflow
            } else if (v.type === 'JOURNAL') {
              balance -= v.grandTotal; // Credit ledger
            }
          }
        }
      });

      const currentBalanceType: BalanceType = balance >= 0 ? 'Dr' : 'Cr';
      return {
        ...ledger,
        currentBalance: Math.round(Math.abs(balance) * 100) / 100,
        currentBalanceType,
      };
    });
  }, [ledgers, vouchers]);

  // Calculated Items stock (considering Opening Stock, Sales, Purchases, and Production Consumption/Output)
  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      let stock = item.openingStock || 0;

      // 1. Invoices & Sales / Purchases
      vouchers.forEach((v) => {
        v.items?.forEach((vi) => {
          if (vi.itemId === item.id) {
            if (v.type === 'SALE') {
              stock -= vi.quantity;
            } else if (v.type === 'PURCHASE') {
              stock += vi.quantity;
            }
          }
        });
      });

      // 2. Manufacturing / Production Entries
      productions.forEach((pe) => {
        // Finished Good manufactured -> stock increases
        if (pe.finishedItemId === item.id) {
          stock += Number(pe.outputQuantity) || 0;
        }
        // Raw Material consumed -> stock decreases
        pe.rawMaterials?.forEach((rm) => {
          if (rm.itemId === item.id) {
            stock -= Number(rm.quantity) || 0;
          }
        });
      });

      return {
        ...item,
        currentStock: Math.round(stock * 100) / 100,
      };
    });
  }, [items, vouchers, productions]);

  // GROUPS Operations
  const addGroup = (groupData: Omit<AccountGroup, 'id' | 'createdAt'>): AccountGroup => {
    const newGroup: AccountGroup = {
      ...groupData,
      id: `grp-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const updateGroup = (id: string, groupData: Partial<AccountGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...groupData, updatedAt: getTodayDateString() } : g))
    );
  };

  const deleteGroup = (id: string): { success: boolean; message?: string } => {
    // Check if any ledger is attached
    const isUsedInLedger = ledgers.some((l) => l.groupId === id);
    if (isUsedInLedger) {
      return { success: false, message: 'Cannot delete group because ledgers are assigned to it. Please reassign or delete those ledgers first.' };
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    return { success: true };
  };

  // LEDGERS Operations
  const addLedger = (ledgerData: Omit<AccountLedger, 'id' | 'createdAt'>): AccountLedger => {
    const newLedger: AccountLedger = {
      ...ledgerData,
      id: `led-${Date.now()}`,
      currentBalance: ledgerData.openingBalance,
      currentBalanceType: ledgerData.openingBalanceType,
      createdAt: getTodayDateString(),
    };
    setLedgers((prev) => [...prev, newLedger]);
    return newLedger;
  };

  const updateLedger = (id: string, ledgerData: Partial<AccountLedger>) => {
    setLedgers((prev) => prev.map((l) => (l.id === id ? { ...l, ...ledgerData } : l)));
  };

  const deleteLedger = (id: string): { success: boolean; message?: string } => {
    const isUsedInVouchers = vouchers.some((v) => v.partyLedgerId === id || v.paymentLedgerId === id);
    if (isUsedInVouchers) {
      return { success: false, message: 'Cannot delete ledger because transactions are recorded for this party/account.' };
    }
    setLedgers((prev) => prev.filter((l) => l.id !== id));
    return { success: true };
  };

  const getLedgerById = (id: string) => calculatedLedgers.find((l) => l.id === id);

  // INVENTORY ITEMS Operations
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      currentStock: itemData.openingStock,
      createdAt: getTodayDateString(),
    };
    setItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateItem = (id: string, itemData: Partial<InventoryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...itemData } : item)));
  };

  const deleteItem = (id: string): { success: boolean; message?: string } => {
    const isUsedInVouchers = vouchers.some((v) => v.items?.some((vi) => vi.itemId === id));
    if (isUsedInVouchers) {
      return { success: false, message: 'Cannot delete item because it is referenced in past sales or purchases.' };
    }
    const isUsedInProductions = productions.some(
      (p) => p.finishedItemId === id || p.rawMaterials?.some((rm) => rm.itemId === id)
    );
    if (isUsedInProductions) {
      return { success: false, message: 'Cannot delete item because it is referenced in production / manufacturing batches.' };
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  const getItemById = (id: string) => calculatedItems.find((i) => i.id === id);

  // MANUFACTURING & BILL OF MATERIALS (BOM) Operations
  const getNextProductionNumber = (): string => {
    const currentYear = new Date().getFullYear();
    const count = productions.length + 1;
    return `MFG-${currentYear}-${String(count).padStart(3, '0')}`;
  };

  const addProduction = (entryData: Omit<ProductionEntry, 'id' | 'createdAt'>): ProductionEntry => {
    const newEntry: ProductionEntry = {
      ...entryData,
      id: `mfg-${Date.now()}`,
      entryNumber: entryData.entryNumber || getNextProductionNumber(),
      createdAt: new Date().toISOString(),
    };

    setProductions((prev) => [newEntry, ...prev]);

    // Automatically update finished item purchase/cost price if current price is 0
    const finishedItem = items.find((i) => i.id === entryData.finishedItemId);
    if (finishedItem && (!finishedItem.purchasePrice || finishedItem.purchasePrice === 0)) {
      updateItem(finishedItem.id, { purchasePrice: Math.round(newEntry.costPerUnit * 100) / 100 });
    }

    return newEntry;
  };

  const deleteProduction = (id: string): { success: boolean; message?: string } => {
    setProductions((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  };

  const addBOM = (bomData: Omit<BillOfMaterial, 'id' | 'createdAt'>): BillOfMaterial => {
    const newBOM: BillOfMaterial = {
      ...bomData,
      id: `bom-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setBoms((prev) => [newBOM, ...prev]);
    return newBOM;
  };

  const updateBOM = (id: string, bomData: Partial<BillOfMaterial>) => {
    setBoms((prev) => prev.map((b) => (b.id === id ? { ...b, ...bomData } : b)));
  };

  const deleteBOM = (id: string) => {
    setBoms((prev) => prev.filter((b) => b.id !== id));
  };

  // VOUCHERS Operations
  const getNextVoucherNumber = (type: VoucherType): string => {
    const prefixMap: Record<VoucherType, string> = {
      SALE: 'INV',
      PURCHASE: 'PUR',
      RECEIPT: 'REC',
      PAYMENT: 'PAY',
      JOURNAL: 'JRN',
      CONTRA: 'CNT',
    };
    const currentYear = new Date().getFullYear();
    const typeVouchers = vouchers.filter((v) => v.type === type);
    const count = typeVouchers.length + 1;
    return `${prefixMap[type]}-${currentYear}-${String(count).padStart(3, '0')}`;
  };

  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'createdAt'>): Voucher => {
    const party = calculatedLedgers.find((l) => l.id === voucherData.partyLedgerId);
    const newVoucher: Voucher = {
      ...voucherData,
      id: `vch-${Date.now()}`,
      partyName: party?.name || voucherData.partyName,
      createdAt: new Date().toISOString(),
    };
    setVouchers((prev) => [newVoucher, ...prev]);
    return newVoucher;
  };

  const updateVoucher = (id: string, voucherData: Partial<Voucher>) => {
    const party = voucherData.partyLedgerId ? calculatedLedgers.find((l) => l.id === voucherData.partyLedgerId) : undefined;
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              ...voucherData,
              partyName: party ? party.name : (voucherData.partyName || v.partyName),
            }
          : v
      )
    );
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  // LEDGER STATEMENT GENERATOR
  const getLedgerStatement = (
    ledgerId: string,
    startDate?: string,
    endDate?: string
  ): LedgerStatementData | null => {
    const ledger = calculatedLedgers.find((l) => l.id === ledgerId);
    if (!ledger) return null;

    const group = groups.find((g) => g.id === ledger.groupId);
    const { start: defaultStart, end: defaultEnd } = getFinancialYearDates();
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    const isCgst = isCgstLedger(ledger);
    const isSgst = isSgstLedger(ledger);
    const isIgst = isIgstLedger(ledger);
    const isGst = isCgst || isSgst || isIgst;

    // Filter relevant vouchers involving this ledger
    const relevantVouchers = vouchers
      .filter((v) => {
        if (v.entryMode === 'DOUBLE' && v.doubleEntries && v.doubleEntries.length > 0) {
          return v.doubleEntries.some((e) => e.ledgerId === ledgerId);
        }
        if (isGst) {
          const taxAmt = isCgst ? (v.cgstTotal || 0) : isSgst ? (v.sgstTotal || 0) : (v.igstTotal || 0);
          return taxAmt > 0 || v.partyLedgerId === ledgerId || v.paymentLedgerId === ledgerId;
        }
        return v.partyLedgerId === ledgerId || v.paymentLedgerId === ledgerId;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate opening balance up to start date
    let effectiveOpeningBalance = ledger.openingBalanceType === 'Dr' ? ledger.openingBalance : -ledger.openingBalance;

    const periodTransactions: LedgerTransaction[] = [];
    let runningVal = effectiveOpeningBalance;

    relevantVouchers.forEach((v) => {
      let debit = 0;
      let credit = 0;
      let particulars = '';

      if (v.entryMode === 'DOUBLE' && v.doubleEntries && v.doubleEntries.length > 0) {
        const thisLedgerLines = v.doubleEntries.filter((e) => e.ledgerId === ledgerId);
        const opposingLines = v.doubleEntries.filter((e) => e.ledgerId !== ledgerId);
        
        const opposingNames = opposingLines
          .map((e) => {
            const found = calculatedLedgers.find((l) => l.id === e.ledgerId);
            return found ? found.name : e.ledgerName || 'Account';
          })
          .filter((name, idx, arr) => arr.indexOf(name) === idx);

        thisLedgerLines.forEach((line) => {
          if (line.type === 'Dr') {
            debit += line.amount;
          } else if (line.type === 'Cr') {
            credit += line.amount;
          }
        });

        if (debit > 0 && credit === 0) {
          particulars = opposingNames.length > 0 
            ? `To ${opposingNames.slice(0, 2).join(', ')}${opposingNames.length > 2 ? ' & others' : ''}`
            : 'To Double Entry (Dr)';
        } else if (credit > 0 && debit === 0) {
          particulars = opposingNames.length > 0
            ? `By ${opposingNames.slice(0, 2).join(', ')}${opposingNames.length > 2 ? ' & others' : ''}`
            : 'By Double Entry (Cr)';
        } else {
          particulars = `Double Entry (${v.type})`;
        }
      } else if (isGst) {
        const taxAmt = isCgst ? (v.cgstTotal || 0) : isSgst ? (v.sgstTotal || 0) : (v.igstTotal || 0);

        if (v.type === 'SALE' && taxAmt > 0) {
          credit = taxAmt;
          particulars = `By Sales A/c (${v.partyName || 'Customer'})`;
        } else if (v.type === 'PURCHASE' && taxAmt > 0) {
          debit = taxAmt;
          particulars = `To Purchase A/c (${v.partyName || 'Supplier'})`;
        } else if (v.partyLedgerId === ledgerId) {
          const otherParty = calculatedLedgers.find((l) => l.id === v.paymentLedgerId);
          if (v.type === 'PAYMENT') {
            debit = v.grandTotal;
            particulars = otherParty ? `To ${otherParty.name}` : `To Tax Payment (${v.paymentMode})`;
          } else if (v.type === 'RECEIPT') {
            credit = v.grandTotal;
            particulars = otherParty ? `By ${otherParty.name}` : `By Tax Refund (${v.paymentMode})`;
          } else if (v.type === 'JOURNAL') {
            debit = v.grandTotal;
            particulars = otherParty ? `To ${otherParty.name}` : 'To Journal Adjustment';
          }
        } else if (v.paymentLedgerId === ledgerId) {
          const otherParty = calculatedLedgers.find((l) => l.id === v.partyLedgerId);
          if (v.type === 'JOURNAL') {
            credit = v.grandTotal;
            particulars = otherParty ? `By ${otherParty.name}` : 'By Journal Adjustment';
          }
        }
      } else {
        if (v.partyLedgerId === ledgerId) {
          const otherParty = calculatedLedgers.find((l) => l.id === v.paymentLedgerId);
          if (v.type === 'SALE') {
            debit = v.grandTotal;
            particulars = 'To Sales A/c';
          } else if (v.type === 'RECEIPT') {
            credit = v.grandTotal;
            particulars = otherParty ? `By ${otherParty.name}` : `By Receipt (${v.paymentMode})`;
          } else if (v.type === 'PURCHASE') {
            credit = v.grandTotal;
            particulars = 'By Purchase A/c';
          } else if (v.type === 'PAYMENT') {
            debit = v.grandTotal;
            particulars = otherParty ? `To ${otherParty.name}` : `To Payment (${v.paymentMode})`;
          } else if (v.type === 'CONTRA') {
            credit = v.grandTotal;
            particulars = otherParty ? `By ${otherParty.name}` : 'By Contra Transfer';
          } else if (v.type === 'JOURNAL') {
            debit = v.grandTotal;
            particulars = otherParty ? `To ${otherParty.name}` : 'To Journal Adjustment';
          }
        } else if (v.paymentLedgerId === ledgerId) {
          // Bank / Cash or Credit perspective
          const otherParty = calculatedLedgers.find((l) => l.id === v.partyLedgerId);
          if (v.type === 'RECEIPT' || (v.type === 'SALE' && v.paymentMode !== 'CREDIT')) {
            debit = v.grandTotal;
            particulars = `To ${otherParty?.name || v.partyName || 'Party Receipt'}`;
          } else if (v.type === 'PAYMENT' || (v.type === 'PURCHASE' && v.paymentMode !== 'CREDIT')) {
            credit = v.grandTotal;
            particulars = `By ${otherParty?.name || v.partyName || 'Party Payment'}`;
          } else if (v.type === 'CONTRA') {
            debit = v.grandTotal;
            particulars = `To ${otherParty?.name || v.partyName || 'Cash/Bank'}`;
          } else if (v.type === 'JOURNAL') {
            credit = v.grandTotal;
            particulars = `By ${otherParty?.name || v.partyName || 'Journal Adjustment'}`;
          }
        }
      }

      if (debit > 0 || credit > 0) {
        if (v.date < start) {
          runningVal += debit - credit;
          effectiveOpeningBalance = runningVal;
        } else if (v.date >= start && v.date <= end) {
          runningVal += debit - credit;
          const currentBalanceType: BalanceType = runningVal >= 0 ? 'Dr' : 'Cr';
          periodTransactions.push({
            id: `tx-${v.id}`,
            voucherId: v.id,
            voucherNumber: v.voucherNumber,
            voucherType: v.type,
            date: v.date,
            particulars: particulars,
            debit,
            credit,
            runningBalance: Math.abs(runningVal),
            balanceType: currentBalanceType,
            narration: v.narration,
          });
        }
      }
    });

    const totalDebit = periodTransactions.reduce((acc, t) => acc + t.debit, 0);
    const totalCredit = periodTransactions.reduce((acc, t) => acc + t.credit, 0);
    const closingBalanceType: BalanceType = runningVal >= 0 ? 'Dr' : 'Cr';

    return {
      ledger,
      group,
      startDate: start,
      endDate: end,
      openingBalance: Math.abs(effectiveOpeningBalance),
      openingBalanceType: effectiveOpeningBalance >= 0 ? 'Dr' : 'Cr',
      transactions: periodTransactions,
      totalDebit,
      totalCredit,
      closingBalance: Math.abs(runningVal),
      closingBalanceType,
    };
  };

  // INVENTORY ITEM STATEMENT / LEDGER GENERATOR
  const getItemStatement = (
    itemId: string,
    startDate?: string,
    endDate?: string
  ): ItemStatementData | null => {
    const item = calculatedItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
    if (!item) return null;

    const { start: defaultStart, end: defaultEnd } = getFinancialYearDates();
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // Collect all inventory movement events
    interface RawStockEvent {
      id: string;
      sourceId: string;
      sourceNumber: string;
      sourceType: 'SALE' | 'PURCHASE' | 'MANUFACTURING_IN' | 'MANUFACTURING_OUT';
      typeBadge: string;
      date: string;
      particulars: string;
      inwardQty: number;
      outwardQty: number;
      rate: number;
      amount: number;
      narration?: string;
    }

    const allEvents: RawStockEvent[] = [];

    // 1. Voucher Invoices (Sales & Purchases)
    vouchers.forEach((v) => {
      v.items?.forEach((vi, idx) => {
        if (vi.itemId === item.id) {
          const party = calculatedLedgers.find((l) => l.id === v.partyLedgerId);
          const partyName = party?.name || v.partyName || (v.type === 'SALE' ? 'Sales Customer' : 'Purchase Supplier');
          
          if (v.type === 'SALE') {
            allEvents.push({
              id: `vch-${v.id}-${idx}`,
              sourceId: v.id,
              sourceNumber: v.voucherNumber,
              sourceType: 'SALE',
              typeBadge: 'SALE',
              date: v.date,
              particulars: partyName,
              inwardQty: 0,
              outwardQty: vi.quantity,
              rate: vi.rate,
              amount: vi.amount || (vi.quantity * vi.rate),
              narration: v.narration,
            });
          } else if (v.type === 'PURCHASE') {
            allEvents.push({
              id: `vch-${v.id}-${idx}`,
              sourceId: v.id,
              sourceNumber: v.voucherNumber,
              sourceType: 'PURCHASE',
              typeBadge: 'PURCHASE',
              date: v.date,
              particulars: partyName,
              inwardQty: vi.quantity,
              outwardQty: 0,
              rate: vi.rate,
              amount: vi.amount || (vi.quantity * vi.rate),
              narration: v.narration,
            });
          }
        }
      });
    });

    // 2. Manufacturing / Production batches
    productions.forEach((pe) => {
      // Finished Good Output (Inward)
      if (pe.finishedItemId === item.id) {
        const qty = Number(pe.outputQuantity) || 0;
        const rate = pe.costPerUnit || (qty > 0 ? (pe.totalCost || 0) / qty : item.purchasePrice || 0);
        allEvents.push({
          id: `prod-in-${pe.id}`,
          sourceId: pe.id,
          sourceNumber: pe.entryNumber,
          sourceType: 'MANUFACTURING_IN',
          typeBadge: 'PRODUCTION',
          date: pe.date,
          particulars: `Manufacturing Output (Batch #${pe.entryNumber})`,
          inwardQty: qty,
          outwardQty: 0,
          rate,
          amount: pe.totalCost || (qty * rate),
          narration: pe.notes || `Manufactured ${pe.outputQuantity} ${item.unit}`,
        });
      }

      // Raw Material Consumed (Outward)
      pe.rawMaterials?.forEach((rm, rIdx) => {
        if (rm.itemId === item.id) {
          const qty = Number(rm.quantity) || 0;
          const rate = rm.rate || item.purchasePrice || 0;
          allEvents.push({
            id: `prod-out-${pe.id}-${rIdx}`,
            sourceId: pe.id,
            sourceNumber: pe.entryNumber,
            sourceType: 'MANUFACTURING_OUT',
            typeBadge: 'RAW CONSUMED',
            date: pe.date,
            particulars: `Consumed in #${pe.entryNumber} (${pe.finishedItemName})`,
            inwardQty: 0,
            outwardQty: qty,
            rate,
            amount: rm.amount || (qty * rate),
            narration: pe.notes || `Raw material used in Batch #${pe.entryNumber}`,
          });
        }
      });
    });

    // Sort chronologically by date
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate opening stock prior to start date
    let effectiveOpeningStock = item.openingStock || 0;
    let runningQty = effectiveOpeningStock;
    const periodTransactions: ItemTransaction[] = [];

    allEvents.forEach((ev) => {
      if (ev.date < start) {
        runningQty += (ev.inwardQty - ev.outwardQty);
        effectiveOpeningStock = runningQty;
      } else if (ev.date >= start && ev.date <= end) {
        runningQty += (ev.inwardQty - ev.outwardQty);
        periodTransactions.push({
          id: ev.id,
          sourceId: ev.sourceId,
          sourceNumber: ev.sourceNumber,
          sourceType: ev.sourceType,
          typeBadge: ev.typeBadge,
          date: ev.date,
          particulars: ev.particulars,
          inwardQty: ev.inwardQty,
          outwardQty: ev.outwardQty,
          rate: ev.rate,
          amount: ev.amount,
          runningStock: Math.round(runningQty * 100) / 100,
          narration: ev.narration,
        });
      }
    });

    const totalInwardQty = periodTransactions.reduce((acc, t) => acc + t.inwardQty, 0);
    const totalInwardValue = periodTransactions.reduce((acc, t) => acc + (t.inwardQty > 0 ? t.amount : 0), 0);
    const totalOutwardQty = periodTransactions.reduce((acc, t) => acc + t.outwardQty, 0);
    const totalOutwardValue = periodTransactions.reduce((acc, t) => acc + (t.outwardQty > 0 ? t.amount : 0), 0);

    const unitPrice = item.purchasePrice || 0;
    const openingStockRounded = Math.round(effectiveOpeningStock * 100) / 100;
    const closingStockRounded = Math.round(runningQty * 100) / 100;

    return {
      item,
      startDate: start,
      endDate: end,
      openingStock: openingStockRounded,
      openingStockValue: openingStockRounded * unitPrice,
      totalInwardQty,
      totalInwardValue,
      totalOutwardQty,
      totalOutwardValue,
      closingStock: closingStockRounded,
      closingStockValue: closingStockRounded * unitPrice,
      transactions: periodTransactions,
    };
  };

  // GST SUMMARIES
  const getGSTR1Summary = (startDate?: string, endDate?: string): GSTR1Summary => {
    const { start: defaultStart, end: defaultEnd } = getFinancialYearDates();
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    const salesVouchers = vouchers.filter((v) => v.type === 'SALE' && v.date >= start && v.date <= end);

    const b2b = { count: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 };
    const b2c = { count: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 };

    const hsnMap: Record<
      string,
      {
        hsnCode: string;
        description: string;
        unit: string;
        totalQuantity: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalAmount: number;
      }
    > = {};

    salesVouchers.forEach((v) => {
      const party = calculatedLedgers.find((l) => l.id === v.partyLedgerId);
      const isB2B = Boolean(party?.gstin && party.gstin.trim().length >= 10);

      const target = isB2B ? b2b : b2c;
      target.count += 1;
      target.taxableValue += v.taxableAmount || v.subtotal;
      target.cgst += v.cgstTotal;
      target.sgst += v.sgstTotal;
      target.igst += v.igstTotal;
      target.totalTax += v.totalGst;
      target.invoiceValue += v.grandTotal;

      v.items?.forEach((item) => {
        const hsn = item.hsnCode || 'OTHER';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsnCode: hsn,
            description: item.itemName,
            unit: item.unit || 'Pcs',
            totalQuantity: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalAmount: 0,
          };
        }
        hsnMap[hsn].totalQuantity += item.quantity;
        hsnMap[hsn].taxableValue += item.taxableAmount;
        hsnMap[hsn].cgst += item.cgstAmount;
        hsnMap[hsn].sgst += item.sgstAmount;
        hsnMap[hsn].igst += item.igstAmount;
        hsnMap[hsn].totalAmount += item.totalAmount;
      });
    });

    const totalTaxable = b2b.taxableValue + b2c.taxableValue;
    const totalCgst = b2b.cgst + b2c.cgst;
    const totalSgst = b2b.sgst + b2c.sgst;
    const totalIgst = b2b.igst + b2c.igst;
    const grandTotalTax = totalCgst + totalSgst + totalIgst;
    const grandTotalValue = b2b.invoiceValue + b2c.invoiceValue;

    return {
      b2bInvoices: b2b,
      b2cInvoices: b2c,
      hsnSummary: Object.values(hsnMap),
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      grandTotalTax,
      grandTotalValue,
    };
  };

  const getGSTR3BSummary = (startDate?: string, endDate?: string): GSTR3BSummary => {
    const { start: defaultStart, end: defaultEnd } = getFinancialYearDates();
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // 1. Table 3.1: Sales Invoices (Outward Taxable Supplies)
    const sales = vouchers.filter((v) => v.type === 'SALE' && v.date >= start && v.date <= end);
    const outwardTaxable = sales.reduce((acc, v) => acc + (v.taxableAmount || v.subtotal || 0), 0);
    const outwardCgst = sales.reduce((acc, v) => acc + (v.cgstTotal || 0), 0);
    const outwardSgst = sales.reduce((acc, v) => acc + (v.sgstTotal || 0), 0);
    const outwardIgst = sales.reduce((acc, v) => acc + (v.igstTotal || 0), 0);
    const outwardTotalTax = outwardCgst + outwardSgst + outwardIgst;

    // 2. Table 4: Purchase Invoices (Eligible Input Tax Credit - ITC)
    const purchases = vouchers.filter((v) => v.type === 'PURCHASE' && v.date >= start && v.date <= end);
    const itcTaxable = purchases.reduce((acc, v) => acc + (v.taxableAmount || v.subtotal || 0), 0);
    const itcCgst = purchases.reduce((acc, v) => acc + (v.cgstTotal || 0), 0);
    const itcSgst = purchases.reduce((acc, v) => acc + (v.sgstTotal || 0), 0);
    const itcIgst = purchases.reduce((acc, v) => acc + (v.igstTotal || 0), 0);
    const itcTotalTax = itcCgst + itcSgst + itcIgst;

    // 3. Table 5.1: Tax Liability after ITC adjustment
    const netCgstLiability = Math.max(0, outwardCgst - itcCgst);
    const netSgstLiability = Math.max(0, outwardSgst - itcSgst);
    const netIgstLiability = Math.max(0, outwardIgst - itcIgst);
    const netTotalLiability = Math.max(0, outwardTotalTax - itcTotalTax);

    // 4. Table 6.1: Tax Paid via Cash/Bank Challans (Payment & Journal vouchers)
    const paymentVouchers = vouchers.filter(
      (v) => (v.type === 'PAYMENT' || v.type === 'JOURNAL') && v.date >= start && v.date <= end
    );

    let paidCgst = 0;
    let paidSgst = 0;
    let paidIgst = 0;
    let paidOtherGst = 0;
    const gstPayments: GSTPaymentEntry[] = [];

    paymentVouchers.forEach((v) => {
      let isGstPayment = false;
      let vCgst = 0;
      let vSgst = 0;
      let vIgst = 0;
      let vTotal = 0;
      let partyTitle = v.partyName || '';
      let bankTitle = '';

      const bankLedger = calculatedLedgers.find((l) => l.id === v.paymentLedgerId);
      if (bankLedger) bankTitle = bankLedger.name;

      if (v.entryMode === 'DOUBLE' && v.doubleEntries && v.doubleEntries.length > 0) {
        // Double entry: Inspect debit lines for GST ledgers
        const drEntries = v.doubleEntries.filter((e) => e.type === 'Dr');
        const crEntries = v.doubleEntries.filter((e) => e.type === 'Cr');

        drEntries.forEach((dr) => {
          const l = calculatedLedgers.find((led) => led.id === dr.ledgerId);
          if (isCgstLedger(l)) {
            paidCgst += dr.amount;
            vCgst += dr.amount;
            vTotal += dr.amount;
            isGstPayment = true;
          } else if (isSgstLedger(l)) {
            paidSgst += dr.amount;
            vSgst += dr.amount;
            vTotal += dr.amount;
            isGstPayment = true;
          } else if (isIgstLedger(l)) {
            paidIgst += dr.amount;
            vIgst += dr.amount;
            vTotal += dr.amount;
            isGstPayment = true;
          } else if (isGeneralGstLedger(l)) {
            paidOtherGst += dr.amount;
            vTotal += dr.amount;
            isGstPayment = true;
          }
        });

        if (crEntries.length > 0 && !bankTitle) {
          bankTitle = crEntries.map((c) => c.ledgerName || 'Bank / Cash').join(', ');
        }
      } else {
        // Single entry payment
        const partyL = calculatedLedgers.find((l) => l.id === v.partyLedgerId);
        if (isCgstLedger(partyL)) {
          paidCgst += v.grandTotal;
          vCgst += v.grandTotal;
          vTotal += v.grandTotal;
          isGstPayment = true;
        } else if (isSgstLedger(partyL)) {
          paidSgst += v.grandTotal;
          vSgst += v.grandTotal;
          vTotal += v.grandTotal;
          isGstPayment = true;
        } else if (isIgstLedger(partyL)) {
          paidIgst += v.grandTotal;
          vIgst += v.grandTotal;
          vTotal += v.grandTotal;
          isGstPayment = true;
        } else if (isGeneralGstLedger(partyL)) {
          if ((v.cgstTotal || 0) > 0 || (v.sgstTotal || 0) > 0 || (v.igstTotal || 0) > 0) {
            const c = v.cgstTotal || 0;
            const s = v.sgstTotal || 0;
            const i = v.igstTotal || 0;
            paidCgst += c;
            paidSgst += s;
            paidIgst += i;
            vCgst += c;
            vSgst += s;
            vIgst += i;
            vTotal += v.grandTotal;
          } else {
            paidOtherGst += v.grandTotal;
            vTotal += v.grandTotal;
          }
          isGstPayment = true;
        }
      }

      if (isGstPayment && vTotal > 0) {
        gstPayments.push({
          id: `gst-pay-${v.id}`,
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          date: v.date,
          voucherType: v.type,
          partyName: partyTitle || 'GST Tax Authority / Challan',
          paymentLedgerName: bankTitle || v.paymentMode || 'Bank / Cash',
          paymentMode: v.paymentMode || 'BANK',
          cgstPaid: vCgst,
          sgstPaid: vSgst,
          igstPaid: vIgst,
          totalPaid: vTotal,
          referenceNo: v.referenceNo,
          narration: v.narration,
        });
      }
    });

    const paidTotalTax = paidCgst + paidSgst + paidIgst + paidOtherGst;

    // 5. Remaining Net Balance GST Payable after Challan payments
    let balanceCgstPayable = Math.max(0, netCgstLiability - paidCgst);
    let balanceSgstPayable = Math.max(0, netSgstLiability - paidSgst);
    let balanceIgstPayable = Math.max(0, netIgstLiability - paidIgst);

    if (paidOtherGst > 0) {
      const combinedRemaining = balanceCgstPayable + balanceSgstPayable + balanceIgstPayable;
      if (combinedRemaining > 0) {
        const factor = Math.min(1, paidOtherGst / combinedRemaining);
        balanceCgstPayable = Math.max(0, balanceCgstPayable - balanceCgstPayable * factor);
        balanceSgstPayable = Math.max(0, balanceSgstPayable - balanceSgstPayable * factor);
        balanceIgstPayable = Math.max(0, balanceIgstPayable - balanceIgstPayable * factor);
      }
    }

    const balanceTotalPayable = Math.max(0, netTotalLiability - paidTotalTax);

    // 6. Payment Status
    let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'NIL_LIABILITY' = 'PENDING';
    if (netTotalLiability === 0) {
      paymentStatus = 'NIL_LIABILITY';
    } else if (balanceTotalPayable === 0 || paidTotalTax >= netTotalLiability) {
      paymentStatus = 'PAID';
    } else if (paidTotalTax > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'PENDING';
    }

    return {
      outwardTaxable,
      outwardCgst,
      outwardSgst,
      outwardIgst,
      outwardTotalTax,
      itcTaxable,
      itcCgst,
      itcSgst,
      itcIgst,
      itcTotalTax,
      netCgstLiability,
      netSgstLiability,
      netIgstLiability,
      netTotalLiability,
      netCgstPayable: balanceCgstPayable,
      netSgstPayable: balanceSgstPayable,
      netIgstPayable: balanceIgstPayable,
      netTotalPayable: balanceTotalPayable,
      paidCgst,
      paidSgst,
      paidIgst,
      paidOtherGst,
      paidTotalTax,
      balanceCgstPayable,
      balanceSgstPayable,
      balanceIgstPayable,
      balanceTotalPayable,
      paymentStatus,
      gstPayments,
    };
  };

  const getDayBook = (date: string): Voucher[] => {
    return vouchers.filter((v) => v.date === date);
  };

  const getTrialBalance = () => {
    return calculatedLedgers.map((ledger) => {
      const group = groups.find((g) => g.id === ledger.groupId);
      const isDebit = ledger.currentBalanceType === 'Dr';
      return {
        ledger,
        group,
        debit: isDebit ? ledger.currentBalance || 0 : 0,
        credit: !isDebit ? ledger.currentBalance || 0 : 0,
      };
    });
  };

  const getProfitAndLoss = (startDate?: string, endDate?: string) => {
    const { start: defaultStart, end: defaultEnd } = getFinancialYearDates();
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    const sales = vouchers.filter((v) => v.type === 'SALE' && v.date >= start && v.date <= end);
    const purchases = vouchers.filter((v) => v.type === 'PURCHASE' && v.date >= start && v.date <= end);

    const salesTotal = sales.reduce((acc, v) => acc + (v.taxableAmount || v.subtotal), 0);
    const purchasesTotal = purchases.reduce((acc, v) => acc + (v.taxableAmount || v.subtotal), 0);

    const openingStockValue = calculatedItems.reduce((acc, it) => acc + (it.openingStock || 0) * it.purchasePrice, 0);
    const closingStockValue = calculatedItems.reduce((acc, it) => acc + it.currentStock * it.purchasePrice, 0);

    // Direct Expenses
    const directExpGroupIds = groups.filter((g) => g.name.toLowerCase().includes('direct expense')).map((g) => g.id);
    const directExpenses = calculatedLedgers
      .filter((l) => directExpGroupIds.includes(l.groupId))
      .reduce((acc, l) => acc + (l.currentBalance || 0), 0);

    // Indirect Expenses
    const indirectExpGroupIds = groups.filter((g) => g.name.toLowerCase().includes('indirect expense')).map((g) => g.id);
    const indirectExpenses = calculatedLedgers
      .filter((l) => indirectExpGroupIds.includes(l.groupId))
      .reduce((acc, l) => acc + (l.currentBalance || 0), 0);

    // Indirect Income
    const indirectIncGroupIds = groups.filter((g) => g.name.toLowerCase().includes('indirect income')).map((g) => g.id);
    const indirectIncomes = calculatedLedgers
      .filter((l) => indirectIncGroupIds.includes(l.groupId))
      .reduce((acc, l) => acc + (l.currentBalance || 0), 0);

    const grossProfit = salesTotal + closingStockValue - (openingStockValue + purchasesTotal + directExpenses);
    const netProfit = grossProfit + indirectIncomes - indirectExpenses;

    return {
      salesTotal,
      closingStockValue,
      purchasesTotal,
      openingStockValue,
      directExpenses,
      grossProfit,
      indirectIncomes,
      indirectExpenses,
      netProfit,
    };
  };

  const getBalanceSheet = () => {
    const assets: Array<{ name: string; amount: number; group: string }> = [];
    const liabilities: Array<{ name: string; amount: number; group: string }> = [];

    // Closing Stock
    const closingStockValue = calculatedItems.reduce((acc, it) => acc + it.currentStock * it.purchasePrice, 0);
    if (closingStockValue > 0) {
      assets.push({ name: 'Closing Stock (Inventory)', amount: closingStockValue, group: 'Current Assets' });
    }

    calculatedLedgers.forEach((l) => {
      const group = groups.find((g) => g.id === l.groupId);
      const balance = l.currentBalance || 0;
      if (balance === 0) return;

      if (group?.nature === 'Assets' || l.currentBalanceType === 'Dr') {
        if (group?.nature !== 'Expenses' && group?.nature !== 'Income') {
          assets.push({ name: l.name, amount: balance, group: group?.name || 'Assets' });
        }
      } else if (group?.nature === 'Liabilities' || l.currentBalanceType === 'Cr') {
        if (group?.nature !== 'Expenses' && group?.nature !== 'Income') {
          liabilities.push({ name: l.name, amount: balance, group: group?.name || 'Liabilities' });
        }
      }
    });

    const totalAssets = assets.reduce((acc, a) => acc + a.amount, 0);
    const totalLiabilities = liabilities.reduce((acc, l) => acc + l.amount, 0);

    return { assets, liabilities, totalAssets, totalLiabilities };
  };

  // Quick stats
  const totalSales = useMemo(() => {
    return vouchers.filter((v) => v.type === 'SALE').reduce((acc, v) => acc + v.grandTotal, 0);
  }, [vouchers]);

  const totalPurchases = useMemo(() => {
    return vouchers.filter((v) => v.type === 'PURCHASE').reduce((acc, v) => acc + v.grandTotal, 0);
  }, [vouchers]);

  const totalReceivables = useMemo(() => {
    const debtorGroupIds = groups
      .filter((g) => g.nature === 'Assets' || g.name.toLowerCase().includes('debtor') || g.name.toLowerCase().includes('current asset'))
      .map((g) => g.id);
    return calculatedLedgers
      .filter((l) => {
        const isNotCashBank = !l.name.toLowerCase().includes('cash') && !l.name.toLowerCase().includes('bank');
        return debtorGroupIds.includes(l.groupId) && l.currentBalanceType === 'Dr' && isNotCashBank;
      })
      .reduce((acc, l) => acc + (l.currentBalance || 0), 0);
  }, [groups, calculatedLedgers]);

  const totalPayables = useMemo(() => {
    const creditorGroupIds = groups
      .filter((g) => g.nature === 'Liabilities' || g.name.toLowerCase().includes('creditor') || g.name.toLowerCase().includes('current liab'))
      .map((g) => g.id);
    return calculatedLedgers
      .filter((l) => {
        const isNotCapital = !l.name.toLowerCase().includes('capital');
        return creditorGroupIds.includes(l.groupId) && l.currentBalanceType === 'Cr' && isNotCapital;
      })
      .reduce((acc, l) => acc + (l.currentBalance || 0), 0);
  }, [groups, calculatedLedgers]);

  const totalCashBank = useMemo(() => {
    return calculatedLedgers
      .filter((l) => {
        const grp = groups.find((g) => g.id === l.groupId);
        const grpName = (grp?.name || '').toLowerCase();
        const ledName = l.name.toLowerCase();
        return (
          grpName.includes('cash') ||
          grpName.includes('bank') ||
          ledName.includes('cash') ||
          ledName.includes('bank') ||
          Boolean(l.bankName) ||
          Boolean(l.accountNumber)
        );
      })
      .reduce((acc, l) => acc + (l.currentBalanceType === 'Dr' ? l.currentBalance || 0 : -(l.currentBalance || 0)), 0);
  }, [groups, calculatedLedgers]);

  const cashBalance = useMemo(() => {
    return calculatedLedgers
      .filter((l) => l.name.toLowerCase().includes('cash') || l.groupId.includes('cash'))
      .reduce((acc, l) => acc + (l.currentBalanceType === 'Dr' ? l.currentBalance || 0 : -(l.currentBalance || 0)), 0);
  }, [calculatedLedgers]);

  const bankBalance = useMemo(() => {
    return calculatedLedgers
      .filter((l) => l.name.toLowerCase().includes('bank') || l.groupId.includes('bank') || Boolean(l.bankName) || Boolean(l.accountNumber))
      .reduce((acc, l) => acc + (l.currentBalanceType === 'Dr' ? l.currentBalance || 0 : -(l.currentBalance || 0)), 0);
  }, [calculatedLedgers]);

  const lowStockItems = useMemo(() => {
    return calculatedItems.filter((i) => i.currentStock <= (i.minStockAlert || 5));
  }, [calculatedItems]);

  // Data persistence methods
  const exportBackupJson = () => {
    // Collect all companies data bundles from localStorage or current state
    const allCompaniesData: Record<string, CompanyDataBundle> = {};
    companies.forEach((comp) => {
      if (comp.id === activeCompanyId) {
        allCompaniesData[comp.id] = {
          groups,
          ledgers,
          items,
          vouchers,
          productions,
          boms,
        };
      } else {
        const compData = loadCompanyData(comp.id);
        allCompaniesData[comp.id] = compData;
      }
    });

    const fullData: BackupData = {
      version: '1.2',
      app: 'RSDD AccuLedger Accounting System',
      exportedAt: new Date().toISOString(),
      activeCompanyProfile: activeCompany,
      companies,
      activeCompanyId,
      // Backward compatibility fields
      groups,
      ledgers,
      items,
      vouchers,
      productions,
      boms,
      allCompaniesData,
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = (activeCompany?.companyName || 'Accounts').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `RSDD_AccuLedger_${sanitizedName}_Backup_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackupJson = async (file: File): Promise<BackupImportResult> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format. Please upload a valid AccuLedger JSON backup.' };
      }

      // 1. Process companies structure
      let importedCompanies: CompanyProfile[] = [];
      if (Array.isArray(data.companies) && data.companies.length > 0) {
        importedCompanies = data.companies;
      } else if (data.companyProfile || data.activeCompanyProfile) {
        const singleComp = data.companyProfile || data.activeCompanyProfile;
        importedCompanies = [{ ...INITIAL_COMPANY_PROFILE, ...singleComp, id: singleComp.id || 'comp-1' }];
      } else {
        importedCompanies = companies;
      }

      setCompanies(importedCompanies);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(importedCompanies));

      // 2. Determine target active company
      const targetActiveId = data.activeCompanyId && importedCompanies.some((c) => c.id === data.activeCompanyId)
        ? data.activeCompanyId
        : (importedCompanies[0]?.id || 'comp-1');

      setActiveCompanyId(targetActiveId);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, targetActiveId);

      // 3. Restore all per-company data bundles if present
      if (data.allCompaniesData && typeof data.allCompaniesData === 'object') {
        Object.entries(data.allCompaniesData).forEach(([cId, bundle]: [string, any]) => {
          if (bundle && typeof bundle === 'object') {
            if (Array.isArray(bundle.groups)) localStorage.setItem(`rsdd_comp_${cId}_groups`, JSON.stringify(bundle.groups));
            if (Array.isArray(bundle.ledgers)) localStorage.setItem(`rsdd_comp_${cId}_ledgers`, JSON.stringify(bundle.ledgers));
            if (Array.isArray(bundle.items)) localStorage.setItem(`rsdd_comp_${cId}_items`, JSON.stringify(bundle.items));
            if (Array.isArray(bundle.vouchers)) localStorage.setItem(`rsdd_comp_${cId}_vouchers`, JSON.stringify(bundle.vouchers));
            if (Array.isArray(bundle.productions)) localStorage.setItem(`rsdd_comp_${cId}_productions`, JSON.stringify(bundle.productions));
            if (Array.isArray(bundle.boms)) localStorage.setItem(`rsdd_comp_${cId}_boms`, JSON.stringify(bundle.boms));
          }
        });
      }

      // 4. Determine and activate datasets for the active company
      const activeBundle = (data.allCompaniesData && data.allCompaniesData[targetActiveId]) || data;

      const newGroups: AccountGroup[] = Array.isArray(activeBundle.groups) && activeBundle.groups.length > 0
        ? activeBundle.groups
        : INITIAL_GROUPS;

      const newLedgers: AccountLedger[] = Array.isArray(activeBundle.ledgers)
        ? activeBundle.ledgers
        : INITIAL_LEDGERS;

      const newItems: InventoryItem[] = Array.isArray(activeBundle.items) ? activeBundle.items : [];
      const newVouchers: Voucher[] = Array.isArray(activeBundle.vouchers) ? activeBundle.vouchers : [];
      const newProductions: ProductionEntry[] = Array.isArray(activeBundle.productions) ? activeBundle.productions : [];
      const newBoms: BillOfMaterial[] = Array.isArray(activeBundle.boms) ? activeBundle.boms : [];

      // Update State
      setGroups(newGroups);
      setLedgers(newLedgers);
      setItems(newItems);
      setVouchers(newVouchers);
      setProductions(newProductions);
      setBoms(newBoms);

      // Persist active company keys in localStorage
      localStorage.setItem(`rsdd_comp_${targetActiveId}_groups`, JSON.stringify(newGroups));
      localStorage.setItem(`rsdd_comp_${targetActiveId}_ledgers`, JSON.stringify(newLedgers));
      localStorage.setItem(`rsdd_comp_${targetActiveId}_items`, JSON.stringify(newItems));
      localStorage.setItem(`rsdd_comp_${targetActiveId}_vouchers`, JSON.stringify(newVouchers));
      localStorage.setItem(`rsdd_comp_${targetActiveId}_productions`, JSON.stringify(newProductions));
      localStorage.setItem(`rsdd_comp_${targetActiveId}_boms`, JSON.stringify(newBoms));

      // Also update legacy keys for maximum recovery safety
      localStorage.setItem(STORAGE_KEYS.LEGACY_GROUPS, JSON.stringify(newGroups));
      localStorage.setItem(STORAGE_KEYS.LEGACY_LEDGERS, JSON.stringify(newLedgers));
      localStorage.setItem(STORAGE_KEYS.LEGACY_ITEMS, JSON.stringify(newItems));
      localStorage.setItem(STORAGE_KEYS.LEGACY_VOUCHERS, JSON.stringify(newVouchers));

      return {
        success: true,
        message: 'Backup restored successfully! All companies, ledgers, vouchers, and items are now active.',
        details: {
          companiesCount: importedCompanies.length,
          ledgersCount: newLedgers.length,
          vouchersCount: newVouchers.length,
          itemsCount: newItems.length,
          groupsCount: newGroups.length,
          productionsCount: newProductions.length,
        },
      };
    } catch (err: any) {
      console.error('Failed to import JSON backup:', err);
      return {
        success: false,
        message: `Restore failed: ${err?.message || 'Invalid or corrupt JSON file format.'}`,
      };
    }
  };

  const resetToSampleData = () => {
    updateCompany(activeCompanyId, INITIAL_COMPANY_PROFILE);
    setGroups(INITIAL_GROUPS);
    setLedgers(INITIAL_LEDGERS);
    setItems(INITIAL_ITEMS);
    setVouchers(INITIAL_VOUCHERS);
    setProductions(INITIAL_PRODUCTIONS);
    setBoms(INITIAL_BOMS);

    localStorage.setItem(`rsdd_comp_${activeCompanyId}_groups`, JSON.stringify(INITIAL_GROUPS));
    localStorage.setItem(`rsdd_comp_${activeCompanyId}_ledgers`, JSON.stringify(INITIAL_LEDGERS));
    localStorage.setItem(`rsdd_comp_${activeCompanyId}_items`, JSON.stringify(INITIAL_ITEMS));
    localStorage.setItem(`rsdd_comp_${activeCompanyId}_vouchers`, JSON.stringify(INITIAL_VOUCHERS));
    localStorage.setItem(`rsdd_comp_${activeCompanyId}_productions`, JSON.stringify(INITIAL_PRODUCTIONS));
    localStorage.setItem(`rsdd_comp_${activeCompanyId}_boms`, JSON.stringify(INITIAL_BOMS));
  };

  return (
    <AccountingContext.Provider
      value={{
        companies,
        activeCompanyId,
        createCompany,
        updateCompany,
        deleteCompany,
        switchCompany,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        ledgers: calculatedLedgers,
        addLedger,
        updateLedger,
        deleteLedger,
        getLedgerById,
        items: calculatedItems,
        addItem,
        updateItem,
        deleteItem,
        getItemById,
        productions,
        addProduction,
        deleteProduction,
        getNextProductionNumber,
        boms,
        addBOM,
        updateBOM,
        deleteBOM,
        vouchers,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        getNextVoucherNumber,
        companyProfile: activeCompany,
        updateCompanyProfile,
        getLedgerStatement,
        getItemStatement,
        getGSTR1Summary,
        getGSTR3BSummary,
        getDayBook,
        getTrialBalance,
        getProfitAndLoss,
        getBalanceSheet,
        totalSales,
        totalPurchases,
        totalReceivables,
        totalPayables,
        totalCashBank,
        cashBalance,
        bankBalance,
        lowStockItems,
        exportBackupJson,
        importBackupJson,
        resetToSampleData,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
