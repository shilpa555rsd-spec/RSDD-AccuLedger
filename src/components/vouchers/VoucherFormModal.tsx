import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import {
  Voucher,
  VoucherType,
  VoucherItem,
  PaymentMode,
  AccountLedger,
  EntryMode,
  DoubleEntryLine,
} from '../../types';
import { formatCurrency, formatDate, getTodayDateString, INDIAN_STATES, openWhatsAppShare } from '../../utils/formatters';
import { DoubleEntryEditor, SearchableLedgerSelect } from './DoubleEntryEditor';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  AlertCircle,
  Check,
  Save,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  Calendar,
  FileText,
  Search,
  ChevronDown,
  Hash,
  Share2,
  MessageCircle,
  Scale,
  Sparkles,
} from 'lucide-react';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: VoucherType;
  voucherToEdit?: Voucher | null;
  defaultPartyId?: string;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  onClose,
  initialType = 'SALE',
  voucherToEdit,
  defaultPartyId,
}) => {
  const {
    vouchers,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    groups,
    ledgers,
    addLedger,
    items,
    getNextVoucherNumber,
    companyProfile,
  } = useAccounting();

  const [type, setType] = useState<VoucherType>(initialType);
  const [entryMode, setEntryMode] = useState<EntryMode>(initialType === 'JOURNAL' ? 'DOUBLE' : 'SINGLE');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState('');
  const [partyLedgerId, setPartyLedgerId] = useState('');
  const [paymentLedgerId, setPaymentLedgerId] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CREDIT');
  const [referenceNo, setReferenceNo] = useState('');
  const [stateOfSupply, setStateOfSupply] = useState(companyProfile?.state || 'Delhi');
  const [isInterState, setIsInterState] = useState(false);
  const [narration, setNarration] = useState('');

  // Double Entry Lines
  const [doubleEntries, setDoubleEntries] = useState<DoubleEntryLine[]>([
    { id: 'de-1', type: 'Dr', ledgerId: '', ledgerName: '', amount: 0, narration: '' },
    { id: 'de-2', type: 'Cr', ledgerId: '', ledgerName: '', amount: 0, narration: '' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 2-Step Safe Delete Confirmation State
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<
    'none' | 'confirm1' | 'confirm2'
  >('none');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Dynamic Item Rows for Sales / Purchases
  const [voucherItems, setVoucherItems] = useState<VoucherItem[]>([
    {
      id: `vi-${Date.now()}`,
      itemName: '',
      quantity: 1,
      rate: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    },
  ]);

  // Non-item total for Receipt / Payment / Journal / Contra
  const [directAmount, setDirectAmount] = useState<number>(0);

  // Search/Type query for Party & Dropdown state
  const [partySearchText, setPartySearchText] = useState<string>('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState<boolean>(false);
  const [openItemDropdownRowId, setOpenItemDropdownRowId] = useState<string | null>(null);
  const partyContainerRef = useRef<HTMLDivElement | null>(null);
  const partySelectRef = useRef<HTMLSelectElement | null>(null);

  // Filter ledgers based on voucher type
  const selectableParties = useMemo(() => {
    if (type === 'SALE') {
      const filtered = ledgers.filter((l) => {
        const grp = groups.find((g) => g.id === l.groupId);
        const grpName = (grp?.name || '').toLowerCase();
        return (
          grp?.nature === 'Assets' ||
          grp?.nature === 'Income' ||
          grpName.includes('debtor') ||
          grpName.includes('current asset') ||
          grpName.includes('sales') ||
          grpName.includes('cash') ||
          grpName.includes('bank')
        );
      });
      return filtered.length > 0 ? filtered : ledgers;
    }
    if (type === 'PURCHASE') {
      const filtered = ledgers.filter((l) => {
        const grp = groups.find((g) => g.id === l.groupId);
        const grpName = (grp?.name || '').toLowerCase();
        return (
          grp?.nature === 'Liabilities' ||
          grp?.nature === 'Expenses' ||
          grpName.includes('creditor') ||
          grpName.includes('current liabilit') ||
          grpName.includes('purchase') ||
          grpName.includes('cash') ||
          grpName.includes('bank')
        );
      });
      return filtered.length > 0 ? filtered : ledgers;
    }
    // For Payment / Receipt / Journal / Contra, show all parties/expenses/incomes
    return ledgers;
  }, [type, ledgers, groups]);

  // Filter parties by typed search text
  const filteredParties = useMemo(() => {
    if (!partySearchText.trim()) return selectableParties;
    const q = partySearchText.toLowerCase().trim();
    return selectableParties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.gstin && p.gstin.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [selectableParties, partySearchText]);

  const bankAndCashLedgers = useMemo(() => {
    const list = ledgers.filter((l) => {
      const grp = groups.find((g) => g.id === l.groupId);
      const grpName = (grp?.name || '').toLowerCase();
      const lName = l.name.toLowerCase();
      return (
        grpName.includes('bank') ||
        grpName.includes('cash') ||
        lName.includes('bank') ||
        lName.includes('cash') ||
        Boolean(l.bankName) ||
        Boolean(l.accountNumber)
      );
    });
    return list.length > 0 ? list : ledgers;
  }, [ledgers, groups]);

  // Initialization
  useEffect(() => {
    if (isOpen) {
      if (voucherToEdit) {
        setType(voucherToEdit.type);
        const resolvedMode = voucherToEdit.entryMode || (voucherToEdit.type === 'JOURNAL' ? 'DOUBLE' : 'SINGLE');
        setEntryMode(resolvedMode);
        setVoucherNumber(voucherToEdit.voucherNumber);
        setDate(voucherToEdit.date);
        setDueDate(voucherToEdit.dueDate || '');
        setPartyLedgerId(voucherToEdit.partyLedgerId);
        const currentParty = ledgers.find((l) => l.id === voucherToEdit.partyLedgerId);
        setPartySearchText(currentParty?.name || '');
        setPaymentLedgerId(voucherToEdit.paymentLedgerId || '');
        setPaymentMode(voucherToEdit.paymentMode);
        setReferenceNo(voucherToEdit.referenceNo || '');
        setStateOfSupply(voucherToEdit.stateOfSupply || companyProfile?.state || 'Delhi');
        setIsInterState(voucherToEdit.isInterState || false);
        setNarration(voucherToEdit.narration || '');

        if (voucherToEdit.doubleEntries && voucherToEdit.doubleEntries.length > 0) {
          setDoubleEntries(voucherToEdit.doubleEntries);
        } else {
          // Initialize default Dr / Cr rows from existing single-entry voucher
          const drLedgerId =
            voucherToEdit.type === 'RECEIPT' || voucherToEdit.type === 'CONTRA'
              ? voucherToEdit.paymentLedgerId || ''
              : voucherToEdit.partyLedgerId;
          const crLedgerId =
            voucherToEdit.type === 'RECEIPT' || voucherToEdit.type === 'CONTRA'
              ? voucherToEdit.partyLedgerId
              : voucherToEdit.paymentLedgerId || '';

          setDoubleEntries([
            {
              id: `de-${Date.now()}-1`,
              type: 'Dr',
              ledgerId: drLedgerId,
              ledgerName: ledgers.find((l) => l.id === drLedgerId)?.name || '',
              amount: voucherToEdit.grandTotal || 0,
              narration: '',
            },
            {
              id: `de-${Date.now()}-2`,
              type: 'Cr',
              ledgerId: crLedgerId,
              ledgerName: ledgers.find((l) => l.id === crLedgerId)?.name || '',
              amount: voucherToEdit.grandTotal || 0,
              narration: '',
            },
          ]);
        }

        if (voucherToEdit.items && voucherToEdit.items.length > 0) {
          setVoucherItems(voucherToEdit.items);
          setDirectAmount(0);
        } else {
          setDirectAmount(voucherToEdit.grandTotal || 0);
          setVoucherItems([]);
        }
      } else {
        const newType = initialType;
        setType(newType);
        const resolvedMode = newType === 'JOURNAL' ? 'DOUBLE' : 'SINGLE';
        setEntryMode(resolvedMode);
        setVoucherNumber(getNextVoucherNumber(newType));
        setDate(getTodayDateString());
        setDueDate('');
        setPaymentMode(newType === 'SALE' || newType === 'PURCHASE' ? 'CREDIT' : 'BANK');
        setReferenceNo('');
        setNarration('');

        let initialPartyId = '';
        if (defaultPartyId) {
          initialPartyId = defaultPartyId;
          setPartyLedgerId(defaultPartyId);
          const party = ledgers.find((l) => l.id === defaultPartyId);
          setPartySearchText(party?.name || '');
          if (party?.state) {
            setStateOfSupply(party.state);
            setIsInterState(party.state !== companyProfile.state);
          }
        } else {
          setPartyLedgerId('');
          setPartySearchText('');
        }

        const initialPayLedgerId = bankAndCashLedgers[0]?.id || '';
        setPaymentLedgerId(initialPayLedgerId);

        // Double entry default rows
        setDoubleEntries([
          {
            id: `de-${Date.now()}-1`,
            type: 'Dr',
            ledgerId: newType === 'RECEIPT' || newType === 'CONTRA' ? initialPayLedgerId : initialPartyId,
            ledgerName: '',
            amount: 0,
            narration: '',
          },
          {
            id: `de-${Date.now()}-2`,
            type: 'Cr',
            ledgerId: newType === 'RECEIPT' || newType === 'CONTRA' ? initialPartyId : initialPayLedgerId,
            ledgerName: '',
            amount: 0,
            narration: '',
          },
        ]);

        setVoucherItems([
          {
            id: `vi-${Date.now()}`,
            itemName: '',
            quantity: 0,
            rate: 0,
            taxableAmount: 0,
            gstRate: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalAmount: 0,
          },
        ]);
        setDirectAmount(0);
      }
      setError(null);
      setDeleteError(null);
      setDeleteConfirmationStep('none');
      setSaveSuccess(false);

      setTimeout(() => {
        partySelectRef.current?.focus();
      }, 100);
    }
  }, [voucherToEdit, initialType, isOpen]);

  // Keyboard shortcut handler (Esc to close, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && deleteConfirmationStep === 'none') {
        onClose();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('voucherForm') as HTMLFormElement | null;
        if (form) form.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteConfirmationStep, onClose]);

  // Close party and item dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (partyContainerRef.current && !partyContainerRef.current.contains(target)) {
        setIsPartyDropdownOpen(false);
      }
      if (!target.closest('[data-item-selector]')) {
        setOpenItemDropdownRowId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When party changes, auto-detect interstate supply
  const handlePartyChange = (selectedId: string) => {
    setPartyLedgerId(selectedId);
    const party = ledgers.find((l) => l.id === selectedId);
    if (party) {
      setPartySearchText(party.name);
      if (party.state) {
        setStateOfSupply(party.state);
        setIsInterState(party.state !== companyProfile.state);
      }
    } else {
      setPartySearchText('');
    }
  };

  // Re-calculate individual row math
  const recalculateItemRow = (
    item: VoucherItem,
    qty: number,
    rate: number,
    gstRate: number,
    interstate: boolean
  ): VoucherItem => {
    const taxable = Math.round(qty * rate * 100) / 100;
    const taxTotal = Math.round(((taxable * gstRate) / 100) * 100) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (interstate) {
      igst = taxTotal;
    } else {
      cgst = Math.round((taxTotal / 2) * 100) / 100;
      sgst = Math.round((taxTotal - cgst) * 100) / 100;
    }

    const total = Math.round((taxable + taxTotal) * 100) / 100;

    return {
      ...item,
      quantity: qty,
      rate,
      gstRate,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: total,
    };
  };

  const handleItemSelect = (rowId: string, inventoryItemId: string) => {
    const invItem = items.find((i) => i.id === inventoryItemId);
    if (!invItem) return;

    const rate = type === 'SALE' ? invItem.salePrice : invItem.purchasePrice;
    setVoucherItems((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = {
            ...row,
            itemId: invItem.id,
            itemName: invItem.name,
            hsnCode: invItem.hsnCode,
            unit: invItem.unit,
            rate: rate !== undefined ? rate : row.rate,
            gstRate: invItem.gstRate !== undefined ? invItem.gstRate : row.gstRate,
          };
          return recalculateItemRow(
            updated,
            row.quantity || 0,
            rate !== undefined ? rate : row.rate,
            invItem.gstRate !== undefined ? invItem.gstRate : row.gstRate,
            isInterState
          );
        }
        return row;
      })
    );
  };

  // Combined item name typing / datalist selection handler
  const handleItemNameChange = (rowId: string, nameValue: string) => {
    const matched = items.find(
      (i) => i.name.toLowerCase().trim() === nameValue.toLowerCase().trim()
    );
    if (matched) {
      const rate = type === 'SALE' ? matched.salePrice : matched.purchasePrice;
      setVoucherItems((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            const updated = {
              ...row,
              itemId: matched.id,
              itemName: matched.name,
              hsnCode: matched.hsnCode,
              unit: matched.unit,
              rate: rate !== undefined ? rate : row.rate,
              gstRate: matched.gstRate !== undefined ? matched.gstRate : row.gstRate,
            };
            return recalculateItemRow(
              updated,
              row.quantity || 0,
              rate !== undefined ? rate : row.rate,
              matched.gstRate !== undefined ? matched.gstRate : row.gstRate,
              isInterState
            );
          }
          return row;
        })
      );
    } else {
      handleItemChange(rowId, 'itemName', nameValue);
    }
  };

  const handleItemChange = (rowId: string, field: keyof VoucherItem, value: any) => {
    setVoucherItems((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          const qty = field === 'quantity' ? Number(value) || 0 : row.quantity || 0;
          const rate = field === 'rate' ? Number(value) || 0 : row.rate || 0;
          const gst = field === 'gstRate' ? Number(value) || 0 : row.gstRate || 0;
          return recalculateItemRow(updated, qty, rate, gst, isInterState);
        }
        return row;
      })
    );
  };

  // Re-calculate all items when isInterState toggles
  const handleInterStateToggle = (checked: boolean) => {
    setIsInterState(checked);
    setVoucherItems((prev) =>
      prev.map((row) => recalculateItemRow(row, row.quantity || 0, row.rate || 0, row.gstRate || 0, checked))
    );
  };

  const handleAddItemRow = () => {
    const newRow: VoucherItem = {
      id: `vi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemName: '',
      quantity: 0,
      rate: 0,
      taxableAmount: 0,
      gstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    };
    setVoucherItems((prev) => [...prev, newRow]);
  };

  const handleRemoveItemRow = (rowId: string) => {
    if (voucherItems.length === 1) {
      // Reset single row
      setVoucherItems([
        {
          id: `vi-${Date.now()}`,
          itemName: '',
          quantity: 0,
          rate: 0,
          taxableAmount: 0,
          gstRate: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalAmount: 0,
        },
      ]);
      return;
    }
    setVoucherItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleToggleEntryMode = (newMode: EntryMode) => {
    if (newMode === entryMode) return;
    if (newMode === 'DOUBLE') {
      const drLedgerId =
        type === 'RECEIPT' || type === 'CONTRA' ? paymentLedgerId : partyLedgerId;
      const crLedgerId =
        type === 'RECEIPT' || type === 'CONTRA' ? partyLedgerId : paymentLedgerId;
      const amt = directAmount > 0 ? directAmount : totals.grandTotal || 0;

      setDoubleEntries([
        {
          id: `de-${Date.now()}-1`,
          type: 'Dr',
          ledgerId: drLedgerId || '',
          ledgerName: ledgers.find((l) => l.id === drLedgerId)?.name || '',
          amount: amt,
          narration: '',
        },
        {
          id: `de-${Date.now()}-2`,
          type: 'Cr',
          ledgerId: crLedgerId || '',
          ledgerName: ledgers.find((l) => l.id === crLedgerId)?.name || '',
          amount: amt,
          narration: '',
        },
      ]);
    } else {
      const drLine = doubleEntries.find((e) => e.type === 'Dr');
      const crLine = doubleEntries.find((e) => e.type === 'Cr');
      if (drLine && crLine) {
        if (type === 'RECEIPT' || type === 'CONTRA') {
          setPaymentLedgerId(drLine.ledgerId);
          setPartyLedgerId(crLine.ledgerId);
          setPartySearchText(ledgers.find((l) => l.id === crLine.ledgerId)?.name || '');
        } else {
          setPartyLedgerId(drLine.ledgerId);
          setPartySearchText(ledgers.find((l) => l.id === drLine.ledgerId)?.name || '');
          setPaymentLedgerId(crLine.ledgerId);
        }
        setDirectAmount(drLine.amount || 0);
      }
    }
    setEntryMode(newMode);
  };

  // Summary Totals Calculation
  const totals = useMemo(() => {
    if (type === 'SALE' || type === 'PURCHASE') {
      let subtotal = 0;
      let taxable = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let grand = 0;

      voucherItems.forEach((i) => {
        subtotal += (i.quantity || 0) * (i.rate || 0);
        taxable += i.taxableAmount || 0;
        cgst += i.cgstAmount || 0;
        sgst += i.sgstAmount || 0;
        igst += i.igstAmount || 0;
        grand += i.totalAmount || 0;
      });

      const totalGst = cgst + sgst + igst;
      const roundedGrand = Math.round(grand);
      const roundOff = Math.round((roundedGrand - grand) * 100) / 100;

      return {
        subtotal,
        taxableAmount: taxable,
        cgstTotal: cgst,
        sgstTotal: sgst,
        igstTotal: igst,
        totalGst,
        roundOff,
        grandTotal: roundedGrand,
      };
    } else {
      return {
        subtotal: directAmount,
        taxableAmount: directAmount,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalGst: 0,
        roundOff: 0,
        grandTotal: directAmount,
      };
    }
  }, [type, voucherItems, directAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryMode === 'DOUBLE') {
      // Double Entry Validation
      const validLines = doubleEntries.filter((l) => l.ledgerId && Number(l.amount) > 0);
      if (validLines.length < 2) {
        setError('Double entry requires at least 2 complete ledger lines with amounts (कम से कम 2 लेजर पंक्तियाँ आवश्यक हैं)');
        return;
      }

      const drLines = validLines.filter((l) => l.type === 'Dr');
      const crLines = validLines.filter((l) => l.type === 'Cr');

      if (drLines.length === 0 || crLines.length === 0) {
        setError('Double entry requires at least one Debit (By/Dr) and one Credit (To/Cr) line (कम से कम 1 Dr और 1 Cr लाइन आवश्यक है)');
        return;
      }

      const totalDr = drLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const totalCr = crLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const difference = Math.round(Math.abs(totalDr - totalCr) * 100) / 100;

      if (difference !== 0) {
        setError(`Total Debit (₹${totalDr.toLocaleString('en-IN')}) must equal Total Credit (₹${totalCr.toLocaleString('en-IN')}). Difference: ₹${difference.toLocaleString('en-IN')}`);
        return;
      }

      if (totalDr <= 0) {
        setError('Total transaction amount must be greater than zero (लेन-देन राशि शून्य से अधिक होनी चाहिए)');
        return;
      }

      setIsSaving(true);
      setError(null);

      const populatedDoubleEntries = validLines.map((line) => {
        const found = ledgers.find((l) => l.id === line.ledgerId);
        return {
          ...line,
          ledgerName: found?.name || line.ledgerName || 'Ledger',
        };
      });

      const effectivePartyId = drLines[0]?.ledgerId || populatedDoubleEntries[0]?.ledgerId || '';
      const effectivePaymentId = crLines[0]?.ledgerId || undefined;

      const payload: Omit<Voucher, 'id' | 'createdAt'> = {
        voucherNumber: voucherNumber.trim(),
        type,
        date,
        partyLedgerId: effectivePartyId,
        paymentMode,
        stateOfSupply,
        isInterState,
        entryMode: 'DOUBLE',
        doubleEntries: populatedDoubleEntries,
        items: [],
        subtotal: totalDr,
        totalDiscount: 0,
        taxableAmount: totalDr,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalGst: 0,
        roundOff: 0,
        grandTotal: totalDr,
      };

      if (dueDate) payload.dueDate = dueDate;
      if (effectivePaymentId) payload.paymentLedgerId = effectivePaymentId;
      if (referenceNo.trim()) payload.referenceNo = referenceNo.trim();
      if (narration.trim()) payload.narration = narration.trim();

      try {
        if (voucherToEdit) {
          updateVoucher(voucherToEdit.id, payload);
        } else {
          addVoucher(payload);
        }

        setSaveSuccess(true);
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 350);
      } catch (err: any) {
        setIsSaving(false);
        setError(err?.message || 'Error saving double entry voucher. Please check inputs.');
      }
      return;
    }

    // Single Entry Mode Resolution
    let effectivePartyId = partyLedgerId;
    if (!effectivePartyId && partySearchText.trim()) {
      const matched = selectableParties.find(
        (p) => p.name.toLowerCase().trim() === partySearchText.toLowerCase().trim()
      );
      if (matched) {
        effectivePartyId = matched.id;
      } else {
        const defaultGroup =
          type === 'PURCHASE'
            ? groups.find((g) => g.name.toLowerCase().includes('current liab') || g.name.toLowerCase().includes('creditor'))?.id || groups[0]?.id || 'grp-current-liabilities'
            : groups.find((g) => g.name.toLowerCase().includes('current asset') || g.name.toLowerCase().includes('debtor'))?.id || groups[0]?.id || 'grp-current-assets';
        const newParty = addLedger({
          name: partySearchText.trim(),
          groupId: defaultGroup,
          openingBalance: 0,
          openingBalanceType: type === 'PURCHASE' ? 'Cr' : 'Dr',
          currentBalance: 0,
          currentBalanceType: type === 'PURCHASE' ? 'Cr' : 'Dr',
          state: stateOfSupply,
        });
        effectivePartyId = newParty.id;
      }
    }

    if (!effectivePartyId) {
      setError('Please select or type Party Name (पार्टी का नाम दर्ज करें या चुनें)');
      return;
    }

    if ((type === 'SALE' || type === 'PURCHASE') && voucherItems.some((i) => !i.itemName.trim())) {
      setError('Please provide names/descriptions for all item rows (सामग्री का नाम दर्ज करें)');
      return;
    }

    if (totals.grandTotal <= 0) {
      setError('Total transaction amount must be greater than zero (लेन-देन राशि शून्य से अधिक होनी चाहिए)');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: Omit<Voucher, 'id' | 'createdAt'> = {
      voucherNumber: voucherNumber.trim(),
      type,
      date,
      partyLedgerId: effectivePartyId,
      paymentMode,
      stateOfSupply,
      isInterState,
      entryMode: 'SINGLE',
      items: type === 'SALE' || type === 'PURCHASE' ? voucherItems : [],
      subtotal: totals.subtotal,
      totalDiscount: 0,
      taxableAmount: totals.taxableAmount,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      igstTotal: totals.igstTotal,
      totalGst: totals.totalGst,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
    };

    if (dueDate) payload.dueDate = dueDate;
    if (paymentLedgerId) payload.paymentLedgerId = paymentLedgerId;
    if (referenceNo.trim()) payload.referenceNo = referenceNo.trim();
    if (narration.trim()) payload.narration = narration.trim();

    try {
      if (voucherToEdit) {
        updateVoucher(voucherToEdit.id, payload);
      } else {
        addVoucher(payload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 350);
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Error saving voucher. Please check inputs.');
    }
  };

  const handleExecuteDelete = () => {
    if (!voucherToEdit) return;
    deleteVoucher(voucherToEdit.id);
    setDeleteConfirmationStep('none');
    onClose();
  };

  const handleWhatsAppShareVoucher = () => {
    if (!voucherToEdit) return;
    const party = ledgers.find((l) => l.id === partyLedgerId);
    const text = `*${voucherToEdit.type} VOUCHER: ${voucherToEdit.voucherNumber}*
From: *${companyProfile?.companyName || 'RSDD AccuLedger'}*
To: *${party?.name || voucherToEdit.partyName || 'Party'}*
Date: ${formatDate(voucherToEdit.date)}
Amount: *${formatCurrency(voucherToEdit.grandTotal)}*
Payment Mode: ${voucherToEdit.paymentMode}
${voucherToEdit.referenceNo ? `Ref No: ${voucherToEdit.referenceNo}` : ''}
${voucherToEdit.narration ? `Note: ${voucherToEdit.narration}` : ''}
--------------------------------
Generated via ${companyProfile?.companyName || 'RSDD AccuLedger'}`;

    openWhatsAppShare(text, party?.phone);
  };

  const selectedParty = ledgers.find((l) => l.id === partyLedgerId);

  const getVoucherTitle = () => {
    switch (type) {
      case 'SALE':
        return {
          en: voucherToEdit ? 'Modify Sale Invoice' : 'New Sale Invoice',
          hi: 'बिक्री वाउचर / बिल',
          icon: TrendingUp,
          color: 'from-emerald-500 to-teal-600',
        };
      case 'PURCHASE':
        return {
          en: 'Purchase',
          hi: 'Purchase Bill',
          icon: TrendingDown,
          color: 'from-rose-500 to-red-600',
        };
      case 'RECEIPT':
        return {
          en: voucherToEdit ? 'Modify Receipt Voucher' : 'New Receipt Voucher',
          hi: 'रसीद / भुगतान प्राप्ति',
          icon: ArrowDownLeft,
          color: 'from-cyan-500 to-blue-600',
        };
      case 'PAYMENT':
        return {
          en: voucherToEdit ? 'Modify Payment Voucher' : 'New Payment Voucher',
          hi: 'भुगतान वाउचर',
          icon: ArrowUpRight,
          color: 'from-amber-500 to-orange-600',
        };
      case 'JOURNAL':
        return {
          en: voucherToEdit ? 'Modify Journal Entry' : 'New Journal Entry',
          hi: 'जर्नल वाउचर',
          icon: FileText,
          color: 'from-purple-500 to-indigo-600',
        };
      case 'CONTRA':
        return {
          en: voucherToEdit ? 'Modify Contra Voucher' : 'New Contra Voucher',
          hi: 'बैंक / कैश ट्रांसफर',
          icon: Building2,
          color: 'from-slate-600 to-slate-800',
        };
      default:
        return {
          en: 'Voucher Entry',
          hi: 'वाउचर प्रविष्टि',
          icon: Receipt,
          color: 'from-amber-500 to-orange-600',
        };
    }
  };

  const currentTitleInfo = getVoucherTitle();
  const TitleIcon = currentTitleInfo.icon;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-md shrink-0">
            <TitleIcon className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-black tracking-tight truncate flex items-center gap-2">
              <span>{currentTitleInfo.en}</span>
              <span className="text-xs sm:text-sm font-normal text-amber-400 hidden md:inline">
                ({currentTitleInfo.hi})
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Vch #{voucherNumber} • {date} • {companyProfile?.name || 'My Company'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="submit"
            form="voucherForm"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Form Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {deleteError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{deleteError}</span>
          </div>
        )}

        <form id="voucherForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Unified Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200 overflow-hidden">
            
            {type === 'PURCHASE' || type === 'SALE' ? (
              /* ================= DEDICATED INVOICE VOUCHER FORMAT (SALE & PURCHASE) ================= */
              <div className="p-4 sm:p-6 space-y-6">
                {/* 1. Header: "Sale Invoice" or "Purchase" */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 ${type === 'SALE' ? 'bg-emerald-500' : 'bg-rose-500'} text-white rounded-xl shadow-xs`}>
                        {type === 'SALE' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                          {type === 'SALE' ? 'Sale Invoice' : 'Purchase'}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {type === 'SALE'
                            ? 'Record customer sale invoice & tax breakdown'
                            : 'Record supplier purchase invoice & inventory entry'}
                        </p>
                      </div>
                    </div>
                    
                    {!voucherToEdit && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Type:</span>
                        <select
                          value={type}
                          onChange={(e) => {
                            const newType = e.target.value as VoucherType;
                            setType(newType);
                            setVoucherNumber(getNextVoucherNumber(newType));
                            if (newType === 'SALE' || newType === 'PURCHASE') {
                              setPaymentMode('CREDIT');
                            } else {
                              setPaymentMode('BANK');
                            }
                          }}
                          className="text-xs font-bold px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                        >
                          <option value="SALE">Sale Invoice</option>
                          <option value="PURCHASE">Purchase Bill</option>
                          <option value="PAYMENT">Payment</option>
                          <option value="RECEIPT">Receipt</option>
                          <option value="JOURNAL">Journal</option>
                          <option value="CONTRA">Contra</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 1. Invoice Date, Invoice Number, Payment Mode in ONE HORIZONTAL ROW */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {/* Invoice Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Invoice Date <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs sm:text-sm px-2.5 sm:px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold text-slate-900 shadow-2xs"
                      />
                    </div>

                    {/* Invoice Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Invoice Number <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={voucherNumber}
                        onChange={(e) => setVoucherNumber(e.target.value)}
                        placeholder={type === 'SALE' ? 'e.g. INV-2026-001' : 'e.g. PUR-2026-001'}
                        className="w-full text-xs sm:text-sm px-2.5 sm:px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono font-bold text-slate-900 shadow-2xs"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Payment Mode <span className="text-rose-500">*</span></span>
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                        className="w-full text-xs sm:text-sm px-2.5 sm:px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-bold text-slate-900 cursor-pointer shadow-2xs"
                      >
                        <option value="CREDIT">Credit (उधार / Khata)</option>
                        <option value="CASH">Cash (नकद)</option>
                        <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="CHEQUE">Cheque (चेक)</option>
                      </select>
                    </div>
                  </div>

                  {/* 2. Party Name (Customer / Supplier) - Single Unified Searchable Dropdown */}
                  <div className="space-y-1.5" ref={partyContainerRef}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {type === 'SALE' ? 'Party Name (Customer / Client)' : 'Party Name (Supplier / Vendor)'}{' '}
                          <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      {selectedParty && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
                            Bal: <strong className="text-amber-800">{selectedParty.currentBalanceType || (type === 'SALE' ? 'Dr' : 'Cr')} {formatCurrency(selectedParty.currentBalance || 0)}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPartyLedgerId('');
                              setPartySearchText('');
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            ✕ Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        list="invoice-parties-datalist"
                        value={partySearchText}
                        onFocus={() => setIsPartyDropdownOpen(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPartySearchText(val);
                          setIsPartyDropdownOpen(true);
                          const exact = selectableParties.find((p) => p.name.toLowerCase() === val.toLowerCase().trim());
                          if (exact) {
                            handlePartyChange(exact.id);
                          } else {
                            setPartyLedgerId('');
                          }
                        }}
                        placeholder={type === 'SALE' ? 'Type or select customer / client name...' : 'Type or select supplier / vendor name...'}
                        className="w-full text-xs sm:text-sm pl-9 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-bold text-slate-900 shadow-2xs"
                      />

                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                        {partySearchText && (
                          <button
                            type="button"
                            onClick={() => {
                              setPartyLedgerId('');
                              setPartySearchText('');
                              setIsPartyDropdownOpen(false);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Clear input"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsPartyDropdownOpen((prev) => !prev)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                          title="Toggle party list"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isPartyDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Native datalist for quick keyboard/mobile autocomplete */}
                      <datalist id="invoice-parties-datalist">
                        {selectableParties.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.gstin ? `GSTIN: ${p.gstin}` : `Bal: ${p.currentBalanceType || (type === 'SALE' ? 'Dr' : 'Cr')} ${p.currentBalance}`}
                          </option>
                        ))}
                      </datalist>

                      {/* Interactive Dropdown Popup */}
                      {isPartyDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-xl divide-y divide-slate-100 animate-in fade-in duration-100">
                          {filteredParties.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 text-center">
                              No matching {type === 'SALE' ? 'customers' : 'suppliers'} found. Press enter or save to use &quot;<span className="font-bold text-slate-800">{partySearchText}</span>&quot;.
                            </div>
                          ) : (
                            filteredParties.map((party) => (
                              <button
                                key={party.id}
                                type="button"
                                onClick={() => {
                                  handlePartyChange(party.id);
                                  setIsPartyDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50/80 transition flex items-center justify-between gap-2 cursor-pointer ${
                                  party.id === partyLedgerId ? 'bg-amber-100/70 font-bold text-amber-950' : 'text-slate-800'
                                }`}
                              >
                                <div>
                                  <span className="font-bold block text-slate-900">{party.name}</span>
                                  {party.gstin && (
                                    <span className="text-[11px] font-mono text-slate-500">GST: {party.gstin}</span>
                                  )}
                                </div>
                                <div className="text-right shrink-0 text-[11px]">
                                  <span className="font-semibold text-slate-700 block">
                                    {party.currentBalanceType || (type === 'SALE' ? 'Dr' : 'Cr')} {formatCurrency(party.currentBalance || 0)}
                                  </span>
                                  {party.state && <span className="text-slate-400">📍 {party.state}</span>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Party Summary Bar */}
                    {selectedParty && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{selectedParty.name}</span>
                          {selectedParty.gstin && (
                            <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                              GSTIN: {selectedParty.gstin}
                            </span>
                          )}
                          {selectedParty.state && (
                            <span className="text-slate-600 text-[11px]">📍 {selectedParty.state}</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-700">
                          Current Balance: {selectedParty.currentBalanceType || (type === 'SALE' ? 'Dr' : 'Cr')} {formatCurrency(selectedParty.currentBalance || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Items Table: Clearly Adjusted Quantity, Rate (₹), GST %, Total (₹) with Single Item Input */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Item Details</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Item</span>
                    </button>
                  </div>

                  {/* 3. Items List: Responsive Mobile Cards + Desktop Table */}
                  {/* MOBILE VIEW (Screens < 640px): Stacked high-contrast Item Cards */}
                  <div className="sm:hidden space-y-3">
                    {voucherItems.map((item, idx) => (
                      <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-300 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[11px] font-black">
                              {idx + 1}
                            </span>
                            <span>Item #{idx + 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Item Name / Description - Direct typing + Dropdown list picker */}
                        <div className="space-y-1" data-item-selector="true">
                          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>Item Name / Description <span className="text-rose-500">*</span></span>
                            {item.itemId && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Inventory Linked
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={item.itemName}
                              onChange={(e) => {
                                handleItemNameChange(item.id, e.target.value);
                                setOpenItemDropdownRowId(item.id);
                              }}
                              onFocus={() => setOpenItemDropdownRowId(item.id)}
                              placeholder="Type item name or click ▾ to select..."
                              className="w-full text-xs sm:text-sm pl-3 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-950 shadow-2xs placeholder:font-normal placeholder:text-slate-400"
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                              {item.itemName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleItemChange(item.id, 'itemName', '');
                                    handleItemChange(item.id, 'itemId', undefined);
                                    setOpenItemDropdownRowId(item.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                                  title="Clear item name"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenItemDropdownRowId((prev) => (prev === item.id ? null : item.id));
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer transition"
                                title="Show inventory items"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    openItemDropdownRowId === item.id ? 'rotate-180 text-amber-600' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Dropdown Popup List */}
                            {openItemDropdownRowId === item.id && (
                              <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-2xl divide-y divide-slate-100 animate-in fade-in duration-100">
                                {items.length === 0 ? (
                                  <div className="p-3 text-xs text-slate-500 text-center">
                                    No inventory items added yet. Type your custom item name above.
                                  </div>
                                ) : (
                                  items
                                    .filter((inv) =>
                                      !item.itemName.trim()
                                        ? true
                                        : inv.name.toLowerCase().includes(item.itemName.toLowerCase().trim()) ||
                                          (inv.hsnCode && inv.hsnCode.includes(item.itemName.trim()))
                                    )
                                    .map((inv) => {
                                      const price = type === 'SALE' ? inv.salePrice : inv.purchasePrice;
                                      const isSelected = inv.name.toLowerCase() === item.itemName.toLowerCase().trim();
                                      return (
                                        <button
                                          key={inv.id}
                                          type="button"
                                          onClick={() => {
                                            handleItemSelect(item.id, inv.id);
                                            setOpenItemDropdownRowId(null);
                                          }}
                                          className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50/80 transition flex items-center justify-between gap-2 cursor-pointer ${
                                            isSelected ? 'bg-amber-100/70 font-bold text-amber-950' : 'text-slate-800'
                                          }`}
                                        >
                                          <div>
                                            <span className="font-bold block text-slate-900">{inv.name}</span>
                                            <span className="text-[11px] text-slate-500">
                                              Stock: <strong className="text-slate-700">{inv.currentStock} {inv.unit}</strong>{' '}
                                              {inv.hsnCode ? `• HSN: ${inv.hsnCode}` : ''} • GST: {inv.gstRate}%
                                            </span>
                                          </div>
                                          <div className="text-right shrink-0 text-[11px]">
                                            <span className="font-black text-amber-700 text-xs block">
                                              ₹{price?.toLocaleString('en-IN') || '0.00'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 uppercase">
                                              {type === 'SALE' ? 'Sale Price' : 'Cost Price'}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3 Clear, High-Contrast Inputs: Quantity, Rate (₹), GST % */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {/* Quantity */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1 text-center">
                              Quantity <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleItemChange(item.id, 'quantity', isNaN(val) ? 0 : val);
                              }}
                              placeholder=""
                              className="w-full text-sm font-black text-center px-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-950 shadow-2xs focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          {/* Rate (₹) */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1 text-center">
                              Rate (₹) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate === 0 ? '' : item.rate}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleItemChange(item.id, 'rate', isNaN(val) ? 0 : val);
                              }}
                              placeholder=""
                              className="w-full text-sm font-black text-right px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-950 shadow-2xs focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          {/* GST % */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1 text-center">
                              GST %
                            </label>
                            <select
                              value={item.gstRate === undefined || item.gstRate === null || item.gstRate === 0 ? '' : item.gstRate}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                handleItemChange(item.id, 'gstRate', val);
                              }}
                              className="w-full text-xs font-black text-center px-1.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-950 shadow-2xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                            >
                              <option value="">-- % --</option>
                              <option value="0">0% (Nil)</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                              <option value="3">3%</option>
                              <option value="0.25">0.25%</option>
                            </select>
                          </div>
                        </div>

                        {/* Amount & Subtotal in card footer */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs">
                          <span className="text-slate-600 font-medium">
                            Taxable: <strong className="text-slate-900">{formatCurrency(item.taxableAmount || 0)}</strong>
                          </span>
                          <div className="text-right">
                            <span className="text-slate-500 text-[11px] mr-1">Total:</span>
                            <span className="text-sm font-black text-amber-600">{formatCurrency(item.totalAmount, true)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP & TABLET VIEW (Screens >= 640px): Full Table */}
                  <div className="hidden sm:block border border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-800 text-white font-bold tracking-wide">
                            <th className="py-3 px-3.5 min-w-[220px] text-left text-xs font-bold uppercase">Item Name / Description</th>
                            <th className="py-3 px-3 w-28 text-center text-xs font-bold uppercase">Quantity</th>
                            <th className="py-3 px-3 w-36 text-right text-xs font-bold uppercase">Rate (₹)</th>
                            <th className="py-3 px-3 w-32 text-center text-xs font-bold uppercase">GST %</th>
                            <th className="py-3 px-3.5 w-36 text-right text-xs font-bold uppercase">Total (₹)</th>
                            <th className="py-3 px-2 text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {voucherItems.map((item) => (
                            <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                              {/* Item Name - Unified typing and dropdown popup picker */}
                              <td className="p-3 align-top min-w-[240px]">
                                <div className="relative" data-item-selector="true">
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      required
                                      value={item.itemName}
                                      onChange={(e) => {
                                        handleItemNameChange(item.id, e.target.value);
                                        setOpenItemDropdownRowId(item.id);
                                      }}
                                      onFocus={() => setOpenItemDropdownRowId(item.id)}
                                      placeholder="Type or click ▾ to select..."
                                      className="w-full text-xs sm:text-sm pl-3 pr-14 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 shadow-2xs placeholder:font-normal placeholder:text-slate-400"
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                      {item.itemName && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleItemChange(item.id, 'itemName', '');
                                            handleItemChange(item.id, 'itemId', undefined);
                                            setOpenItemDropdownRowId(item.id);
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                                          title="Clear"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenItemDropdownRowId((prev) => (prev === item.id ? null : item.id));
                                        }}
                                        className="p-1 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer transition"
                                        title="Show items"
                                      >
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 transition-transform ${
                                            openItemDropdownRowId === item.id ? 'rotate-180 text-amber-600' : ''
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Dropdown Popup List */}
                                  {openItemDropdownRowId === item.id && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-2xl divide-y divide-slate-100 animate-in fade-in duration-100">
                                      {items.length === 0 ? (
                                        <div className="p-3 text-xs text-slate-500 text-center">
                                          No inventory items yet. Type name above.
                                        </div>
                                      ) : (
                                        items
                                          .filter((inv) =>
                                            !item.itemName.trim()
                                              ? true
                                              : inv.name.toLowerCase().includes(item.itemName.toLowerCase().trim()) ||
                                                (inv.hsnCode && inv.hsnCode.includes(item.itemName.trim()))
                                          )
                                          .map((inv) => {
                                            const price = type === 'SALE' ? inv.salePrice : inv.purchasePrice;
                                            const isSelected = inv.name.toLowerCase() === item.itemName.toLowerCase().trim();
                                            return (
                                              <button
                                                key={inv.id}
                                                type="button"
                                                onClick={() => {
                                                  handleItemSelect(item.id, inv.id);
                                                  setOpenItemDropdownRowId(null);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-amber-50/80 transition flex items-center justify-between gap-2 cursor-pointer ${
                                                  isSelected ? 'bg-amber-100/70 font-bold text-amber-950' : 'text-slate-800'
                                                }`}
                                              >
                                                <div>
                                                  <span className="font-bold block text-slate-900">{inv.name}</span>
                                                  <span className="text-[10px] text-slate-500">
                                                    Stock: {inv.currentStock} {inv.unit} • GST: {inv.gstRate}%
                                                  </span>
                                                </div>
                                                <div className="text-right shrink-0 text-[11px] font-black text-amber-700">
                                                  ₹{price?.toLocaleString('en-IN') || '0.00'}
                                                </div>
                                              </button>
                                            );
                                          })
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Quantity */}
                              <td className="p-3 align-top">
                                <input
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    handleItemChange(item.id, 'quantity', isNaN(val) ? 0 : val);
                                  }}
                                  placeholder=""
                                  className="w-full text-sm font-black text-center px-2.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 shadow-2xs"
                                />
                              </td>

                              {/* Rate (₹) */}
                              <td className="p-3 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.rate === 0 ? '' : item.rate}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    handleItemChange(item.id, 'rate', isNaN(val) ? 0 : val);
                                  }}
                                  placeholder=""
                                  className="w-full text-sm font-black text-right px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 shadow-2xs"
                                />
                              </td>

                              {/* GST % */}
                              <td className="p-3 align-top text-center">
                                <select
                                  value={item.gstRate === undefined || item.gstRate === null || item.gstRate === 0 ? '' : item.gstRate}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                    handleItemChange(item.id, 'gstRate', val);
                                  }}
                                  className="w-full text-xs sm:text-sm font-bold text-center px-2 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 cursor-pointer shadow-2xs"
                                >
                                  <option value="">-- % --</option>
                                  <option value="0">0% (Nil)</option>
                                  <option value="5">5% GST</option>
                                  <option value="12">12% GST</option>
                                  <option value="18">18% GST</option>
                                  <option value="28">28% GST</option>
                                  <option value="3">3% GST</option>
                                  <option value="0.25">0.25%</option>
                                </select>
                              </td>

                              {/* Total (₹) */}
                              <td className="p-3 align-top text-right">
                                <div className="py-2 px-1 font-black text-slate-900 text-sm sm:text-base">
                                  {formatCurrency(item.totalAmount, true)}
                                </div>
                              </td>

                              {/* Remove */}
                              <td className="p-3 align-top text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(item.id)}
                                  title="Remove Row"
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Area: Left Information & Right-Shifted GST Detail + Total */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                  {/* Left Side: Place of Supply, Reference, Narration */}
                  <div className="lg:col-span-6 space-y-3.5">
                    {/* Place of Supply & Inter-state toggle */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Place of Supply (आपूर्ति राज्य)</label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isInterState}
                            onChange={(e) => handleInterStateToggle(e.target.checked)}
                            className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                          />
                          <span>Inter-State (IGST)</span>
                        </label>
                      </div>
                      <select
                        value={stateOfSupply}
                        onChange={(e) => {
                          setStateOfSupply(e.target.value);
                          setIsInterState(e.target.value !== companyProfile.state);
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.name}>
                            {st.code} - {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reference / Supplier Bill No. or Order No. */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {type === 'SALE' ? 'Reference / PO / Order No.' : 'Reference / Supplier Bill No.'}
                      </label>
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder={type === 'SALE' ? 'e.g. PO-9921, Order-102' : 'e.g. SUPP-INV-9921'}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    {/* Narration / Remarks */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Narration / Remarks</label>
                      <input
                        type="text"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder={type === 'SALE' ? 'Sale invoice remarks or payment terms' : 'Purchase bill remarks or terms'}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Right Side: Shifted GST Detail Card & Total */}
                  <div className="lg:col-span-6">
                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">GST Detail</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          {isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                        </span>
                      </div>

                      {/* Line by line breakdown shifted to the right */}
                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-600 font-medium">Taxable Amount:</span>
                          <span className="font-bold text-slate-900 text-sm">{formatCurrency(totals.taxableAmount)}</span>
                        </div>

                        {isInterState ? (
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-slate-600 font-medium">IGST:</span>
                            <span className="font-bold text-slate-900 text-sm">{formatCurrency(totals.igstTotal)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-slate-600 font-medium">CGST:</span>
                              <span className="font-bold text-slate-900 text-sm">{formatCurrency(totals.cgstTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-slate-600 font-medium">SGST:</span>
                              <span className="font-bold text-slate-900 text-sm">{formatCurrency(totals.sgstTotal)}</span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between py-1 border-t border-slate-200">
                          <span className="text-slate-800 font-bold">Total GST:</span>
                          <span className="font-black text-amber-600 text-sm sm:text-base">{formatCurrency(totals.totalGst)}</span>
                        </div>

                        {totals.roundOff !== 0 && (
                          <div className="flex items-center justify-between text-xs text-slate-500 py-0.5">
                            <span>Round Off:</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(totals.roundOff)}</span>
                          </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-300">
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">Total (कुल राशि)</span>
                            <span className="text-[11px] text-slate-500">{voucherItems.length} Item(s)</span>
                          </div>
                          <span className="text-xl sm:text-2xl font-black text-amber-600">
                            {formatCurrency(totals.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= AUTHENTIC FORMAT FOR PAYMENT, RECEIPT, CONTRA, JOURNAL ================= */
              <div className="p-4 sm:p-7 space-y-6 w-full max-w-5xl mx-auto">
                {/* 1. Top Controls: Voucher Type & Entry Mode always in a Single Row (Side-by-Side) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-4 border-b border-slate-200">
                  {/* Voucher Type Dropdown */}
                  <div className="min-w-0">
                    <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5 truncate">
                      <Receipt className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">VOUCHER TYPE</span>
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        disabled={!!voucherToEdit}
                        onChange={(e) => {
                          const vType = e.target.value as VoucherType;
                          setType(vType);
                          setVoucherNumber(getNextVoucherNumber(vType));
                          if (vType === 'JOURNAL') {
                            setEntryMode('DOUBLE');
                          }
                          setPaymentMode('BANK');
                        }}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white appearance-none cursor-pointer pr-8 sm:pr-10 shadow-2xs truncate ${
                          voucherToEdit ? 'opacity-90 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      >
                        <option value="PAYMENT">PAYMENT</option>
                        <option value="RECEIPT">RECEIPT</option>
                        <option value="CONTRA">CONTRA</option>
                        <option value="JOURNAL">JOURNAL</option>
                      </select>
                      <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-500 absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Entry Mode Dropdown */}
                  <div className="min-w-0">
                    <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5 truncate">
                      <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">ENTRY MODE</span>
                    </label>
                    <div className="relative">
                      <select
                        value={entryMode}
                        onChange={(e) => handleToggleEntryMode(e.target.value as EntryMode)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white appearance-none cursor-pointer pr-8 sm:pr-10 shadow-2xs truncate"
                      >
                        <option value="SINGLE">Single Entry</option>
                        <option value="DOUBLE">Double Entry (Dr / Cr)</option>
                      </select>
                      <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-500 absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 2. DATE, VOUCHER NO. and REF NO. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Date Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>DATE</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Voucher No. Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>VOUCHER NO.</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={voucherNumber}
                      onChange={(e) => setVoucherNumber(e.target.value)}
                      placeholder="e.g. P202608023"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Ref / Cheque No. Input */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                      <span>REF / CHEQUE NO.</span>
                    </label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="Optional ref / chq #"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 3. Render either Double Entry Grid OR Single Entry Inputs */}
                {entryMode === 'DOUBLE' ? (
                  <DoubleEntryEditor
                    entries={doubleEntries}
                    onChange={setDoubleEntries}
                    ledgers={ledgers}
                    groups={groups}
                    narration={narration}
                    onNarrationChange={setNarration}
                    voucherType={type}
                  />
                ) : (
                  <div className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
                    {/* First Ledger Selection (Debit Side) */}
                    <div>
                      <label className="block text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                        {type === 'PAYMENT'
                          ? 'PARTICULARS / RECEIVER (DR)'
                          : type === 'RECEIPT'
                          ? 'DEPOSIT TO / ACCOUNT (DR)'
                          : type === 'CONTRA'
                          ? 'DEPOSIT TO ACCOUNT (DR)'
                          : 'BY / DEBIT ACCOUNT (DR)'}
                      </label>

                      <SearchableLedgerSelect
                        selectedLedgerId={
                          type === 'RECEIPT' || type === 'CONTRA'
                            ? paymentLedgerId
                            : partyLedgerId
                        }
                        onSelect={(ledger) => {
                          if (type === 'RECEIPT' || type === 'CONTRA') {
                            setPaymentLedgerId(ledger.id);
                          } else {
                            handlePartyChange(ledger.id);
                          }
                        }}
                        ledgers={type === 'RECEIPT' || type === 'CONTRA' ? bankAndCashLedgers : selectableParties}
                        placeholder={
                          type === 'RECEIPT' || type === 'CONTRA'
                            ? 'Search & select debit ledger (Bank / Cash)...'
                            : 'Search & select debit ledger / party...'
                        }
                      />
                    </div>

                    {/* Second Ledger Selection (Credit Side) */}
                    <div>
                      <label className="block text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                        {type === 'PAYMENT'
                          ? 'PAID FROM ACCOUNT (CR)'
                          : type === 'RECEIPT'
                          ? 'RECEIVED FROM / GIVER (CR)'
                          : type === 'CONTRA'
                          ? 'PAID FROM ACCOUNT (CR)'
                          : 'TO / CREDIT ACCOUNT (CR)'}
                      </label>

                      <SearchableLedgerSelect
                        selectedLedgerId={
                          type === 'RECEIPT' || type === 'CONTRA'
                            ? partyLedgerId
                            : paymentLedgerId
                        }
                        onSelect={(ledger) => {
                          if (type === 'RECEIPT' || type === 'CONTRA') {
                            handlePartyChange(ledger.id);
                          } else {
                            setPaymentLedgerId(ledger.id);
                          }
                        }}
                        ledgers={type === 'PAYMENT' || type === 'CONTRA' ? bankAndCashLedgers : selectableParties}
                        placeholder={
                          type === 'PAYMENT' || type === 'CONTRA'
                            ? 'Search & select credit ledger (Bank / Cash)...'
                            : 'Search & select credit ledger / party...'
                        }
                      />
                    </div>

                    {/* Amount (₹) */}
                    <div>
                      <label className="block text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                        AMOUNT (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 select-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={directAmount === 0 ? '' : directAmount}
                          onChange={(e) => setDirectAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Narration / Remarks */}
                    <div>
                      <label className="block text-[11px] font-black tracking-wider text-slate-700 uppercase mb-1.5">
                        NARRATION / REMARKS
                      </label>
                      <textarea
                        rows={2}
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder="Enter narration or transaction details..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Golden Amber Accept / Save Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>SAVING VOUCHER...</span>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-5 h-5 text-slate-950" />
                      <span>VOUCHER SAVED!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 text-slate-950" />
                      <span>ACCEPT (SAVE VOUCHER)</span>
                    </>
                  )}
                </button>

                {/* Action buttons if modifying */}
                {voucherToEdit && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmationStep('confirm1')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Delete Voucher"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppShareVoucher}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Share Voucher on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Bar for Invoice Form (SALE / PURCHASE) */}
            {(type === 'SALE' || type === 'PURCHASE') && (
              <div className="p-4 sm:p-6 bg-slate-50 flex flex-row items-center justify-end gap-2 sm:gap-3">
                {voucherToEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmationStep('confirm1')}
                      className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                      title="Delete Voucher"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppShareVoucher}
                      className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                      title="Share Voucher on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{type === 'PURCHASE' ? 'Save Purchase' : 'Save'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </form>
      </main>

      {/* 2-Step Safe Delete Confirmation Dialogs */}
      {deleteConfirmationStep === 'confirm1' && voucherToEdit && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
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
                  Are you sure you want to delete <strong className="text-slate-900">"{voucherToEdit.type} #{voucherToEdit.voucherNumber}"</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-semibold">⚠️ Safety Notice:</p>
              <p>Deleting this voucher will automatically reverse all ledger balances and inventory stock movements associated with it.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('none')}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('confirm2')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Proceed to Delete →
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationStep === 'confirm2' && voucherToEdit && (
        <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Final Confirmation (अंतिम पुष्टि)
              </h3>
              <p className="text-xs text-slate-600">
                This action is permanent and cannot be undone. Voucher #{voucherToEdit.voucherNumber} will be deleted.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('none')}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                No, Keep Voucher
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg transition transform active:scale-95 cursor-pointer"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
