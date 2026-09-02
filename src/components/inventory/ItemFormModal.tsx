import React, { useState, useEffect, useRef } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem } from '../../types';
import {
  Package,
  X,
  AlertCircle,
  Check,
  Save,
  Trash2,
  Coins,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
}

const COMMON_UNITS = [
  { label: 'Pcs (Pieces - नग / पीस)', val: 'Pcs' },
  { label: 'Box (Boxes - डिब्बा / बॉक्स)', val: 'Box' },
  { label: 'Kg (Kilograms - किलोग्राम)', val: 'Kg' },
  { label: 'Gm (Grams - ग्राम)', val: 'Gm' },
  { label: 'Mtr (Meters - मीटर)', val: 'Mtr' },
  { label: 'Roll (Rolls - रोल)', val: 'Roll' },
  { label: 'Ltr (Liters - लीटर)', val: 'Ltr' },
  { label: 'Nos (Numbers - संख्या)', val: 'Nos' },
  { label: 'Pack (Packets - पैकेट)', val: 'Pack' },
  { label: 'Dozen (Dozens - दर्जन)', val: 'Dozen' },
  { label: 'Set (Sets - सेट)', val: 'Set' },
  { label: 'Bale (Bales - गांठ / बेल)', val: 'Bale' },
  { label: 'SqFt (Square Feet - वर्ग फुट)', val: 'SqFt' },
  { label: 'Ton (Metric Tons - टन)', val: 'Ton' },
  { label: 'Qtl (Quintal - क्विंटल)', val: 'Qtl' },
  { label: 'Pair (Pairs - जोड़ा)', val: 'Pair' },
  { label: 'Bottle (Bottles - बोतल)', val: 'Bottle' },
];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const { addItem, updateItem, deleteItem } = useAccounting();

  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [customUnit, setCustomUnit] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number | string>('0.00');
  const [description, setDescription] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 2-Step Safe Delete Confirmation State
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<
    'none' | 'confirm1' | 'confirm2'
  >('none');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name || '');
        setHsnCode(itemToEdit.hsnCode || '');
        const matchedUnit = COMMON_UNITS.some((u) => u.val === itemToEdit.unit);
        if (matchedUnit) {
          setUnit(itemToEdit.unit || 'Pcs');
          setCustomUnit('');
        } else {
          setUnit('CUSTOM');
          setCustomUnit(itemToEdit.unit || '');
        }
        setSalePrice(itemToEdit.salePrice || 0);
        setPurchasePrice(itemToEdit.purchasePrice || 0);
        setGstRate(itemToEdit.gstRate ?? 18);
        setOpeningStock(itemToEdit.openingStock || 0);
        setMinStockAlert(
          itemToEdit.minStockAlert !== undefined && itemToEdit.minStockAlert !== null
            ? itemToEdit.minStockAlert
            : '0.00'
        );
        setDescription(itemToEdit.description || '');
      } else {
        setName('');
        setHsnCode('');
        setUnit('Pcs');
        setCustomUnit('');
        setSalePrice(0);
        setPurchasePrice(0);
        setGstRate(18);
        setOpeningStock(0);
        setMinStockAlert('0.00');
        setDescription('');
      }
      setError(null);
      setDeleteError(null);
      setDeleteConfirmationStep('none');
      setSaveSuccess(false);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [itemToEdit, isOpen]);

  // Keyboard shortcut handler (Esc to close, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && deleteConfirmationStep === 'none') {
        onClose();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('itemForm') as HTMLFormElement | null;
        if (form) form.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteConfirmationStep, onClose]);

  if (!isOpen) return null;

  const effectiveUnit = unit === 'CUSTOM' ? customUnit.trim() || 'Unit' : unit;

  // Real-time calculations
  const profitPerUnit = salePrice > purchasePrice ? salePrice - purchasePrice : 0;
  const profitMarginPercent =
    salePrice > 0 && purchasePrice > 0
      ? (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(1)
      : '0.0';
  const openingStockValuation = (openingStock || 0) * (purchasePrice || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item / Product name is required (सामग्री का नाम अनिवार्य है)');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      sku: itemToEdit?.sku,
      hsnCode: hsnCode.trim() || undefined,
      unit: effectiveUnit,
      salePrice: Number(salePrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      gstRate: Number(gstRate) || 0,
      openingStock: Number(openingStock) || 0,
      currentStock: itemToEdit ? itemToEdit.currentStock : Number(openingStock) || 0,
      minStockAlert: minStockAlert === '' ? undefined : Number(minStockAlert) || 0,
      description: description.trim() || undefined,
    };

    try {
      if (itemToEdit) {
        updateItem(itemToEdit.id, payload);
      } else {
        addItem(payload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 350);
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Error saving item. Please check inputs.');
    }
  };

  const handleExecuteDelete = () => {
    if (!itemToEdit) return;
    const res = deleteItem(itemToEdit.id);
    if (!res.success) {
      setDeleteError(res.message || 'Cannot delete item because it is referenced in transactions.');
      setDeleteConfirmationStep('none');
    } else {
      setDeleteConfirmationStep('none');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Full Screen Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-md shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-black tracking-tight truncate flex items-center gap-2">
              <span>{itemToEdit ? 'Modify Inventory Item' : 'Add Inventory Item'}</span>
              <span className="text-xs sm:text-sm font-normal text-amber-400 hidden md:inline">
                ({itemToEdit ? 'सामग्री विवरण बदलें' : 'स्टॉक में नई सामग्री जोड़ें'})
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              HSN Code, GST Rates, Selling & Cost Prices, Measuring Unit & Stock Quantities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="submit"
            form="itemForm"
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
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Form Container - Unified Continuous Form without gaps */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-6 lg:p-8">
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

        <form id="itemForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Unified Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200 overflow-hidden">
            
            {/* Section 1: Basic Item / Product Details */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>1. Item / Product Details (सामग्री एवं नाम विवरण)</span>
                </div>
                <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                  * Marked fields are mandatory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Item Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Item / Product Name (सामग्री या उत्पाद का नाम) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samsung 32-inch LED TV, Copper Wire 2.5mm, Basmati Rice 25kg"
                    className="w-full text-sm sm:text-base px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-bold text-slate-900"
                  />
                </div>

                {/* Measuring Unit Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Measuring Unit (माप की इकाई) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-semibold text-slate-900 cursor-pointer"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u.val} value={u.val}>
                        {u.label}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Other / Custom Unit (अन्य इकाई दर्ज करें)</option>
                  </select>

                  {unit === 'CUSTOM' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="Type custom unit (e.g. Jar, Bundle, Tin)"
                        className="w-full text-xs px-3 py-2 border border-amber-400 bg-amber-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Tax & HSN/SAC Details */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>2. GST Tax Rate & HSN/SAC Code (जीएसटी दर एवं कर वर्गीकरण)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* HSN / SAC Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    HSN / SAC Code (4-8 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={8}
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 8528, 8471, 1006"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-mono font-bold tracking-wider text-slate-900"
                    />
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Harmonized System Nomenclature code for standard GST invoices
                  </p>
                </div>

                {/* GST Rate Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    GST Rate (जीएसटी दर) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="28">28%</option>
                    <option value="0">0% (Exempt / Nil Rated)</option>
                    <option value="3">3%</option>
                    <option value="0.25">0.25%</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing & Costing */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>3. Pricing & Profit Margin (मूल्य एवं लाभ मार्जिन)</span>
                </div>
                {salePrice > 0 && purchasePrice > 0 && (
                  <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Margin: ₹{profitPerUnit.toFixed(2)} ({profitMarginPercent}%)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Sale / Selling Price (विक्रय मूल्य - प्रति {effectiveUnit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-emerald-700">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={salePrice === 0 ? '' : salePrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setSalePrice(isNaN(val) ? 0 : val);
                      }}
                      placeholder="0.00"
                      className="w-full text-base pl-8 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-bold text-emerald-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Optional: Default rate fetched when generating sale invoices
                  </p>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Purchase / Cost Price (क्रय मूल्य / लागत - प्रति {effectiveUnit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchasePrice === 0 ? '' : purchasePrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setPurchasePrice(isNaN(val) ? 0 : val);
                      }}
                      placeholder="0.00"
                      className="w-full text-base pl-8 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-bold text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Optional: Used to calculate gross profit and closing inventory valuation
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Stock Levels & Valuation */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>4. Opening Stock & Stock Alerts (प्रारंभिक स्टॉक एवं अलर्ट)</span>
                </div>
                {openingStock > 0 && purchasePrice > 0 && (
                  <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                    Stock Valuation: {formatCurrency(openingStockValuation)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Opening Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {itemToEdit ? 'Opening Stock Quantity (प्रारंभिक मात्रा)' : 'Initial Opening Stock (शुरुआती स्टॉक)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingStock || ''}
                      onChange={(e) => setOpeningStock(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-sm sm:text-base px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">
                      {effectiveUnit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Current balance will dynamically track sales & purchases
                  </p>
                </div>

                {/* Low Stock Alert */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Low Stock Alert Limit (न्यूनतम स्टॉक चेतावनी सीमा)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm sm:text-base px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-semibold text-slate-900"
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">
                      {effectiveUnit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Triggers a red low-stock alert when stock dips below this limit
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Description & Actions */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm sm:text-base">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>5. Description & Specifications (विवरण व नोट्स)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Item Description / Notes / Specs (उत्पाद का विवरण / मॉडल आदि)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Color, size, warranty terms, manufacturer details..."
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Bottom Actions Area with Delete, Cancel & Save directly in one line */}
              <div className="pt-4 border-t border-slate-200 flex flex-row items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (itemToEdit) {
                      setDeleteConfirmationStep('confirm1');
                    } else {
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Delete</span>
                </button>

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
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </main>

      {/* 2-Step Safe Delete Confirmation Dialogs */}
      {deleteConfirmationStep === 'confirm1' && itemToEdit && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Inventory Item? (सामग्री हटाएं?)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">"{itemToEdit.name}"</strong> from your inventory catalogue?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-semibold">⚠️ Safety Notice:</p>
              <p>Items with recorded purchase or sales vouchers cannot be deleted to preserve accounting integrity.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('none')}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('confirm2')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Proceed to Delete →
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationStep === 'confirm2' && itemToEdit && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Final Confirmation (अंतिम पुष्टि)
              </h3>
              <p className="text-xs text-slate-600">
                This action is permanent and will remove item <strong>"{itemToEdit.name}"</strong>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationStep('none')}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition"
              >
                No, Keep Item
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg transition transform active:scale-95"
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
