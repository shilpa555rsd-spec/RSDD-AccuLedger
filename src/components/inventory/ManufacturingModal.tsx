import React, { useState, useEffect, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem, RawMaterialConsumption, AdditionalCostItem, BillOfMaterial } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { 
  X, 
  Factory, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Package, 
  Scissors, 
  Info,
  Maximize2,
  Minimize2,
  FileSpreadsheet
} from 'lucide-react';

interface ManufacturingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (productionId: string) => void;
}

export const ManufacturingModal: React.FC<ManufacturingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    items, 
    productions, 
    addProduction, 
    getNextProductionNumber, 
    boms, 
    addBOM, 
    addItem, 
    companyProfile 
  } = useAccounting();

  // Fullscreen toggle state (Default to full screen view)
  const [isFullScreen, setIsFullScreen] = useState(true);

  // Form states
  const [entryNumber, setEntryNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [finishedItemId, setFinishedItemId] = useState('');
  const [outputQuantity, setOutputQuantity] = useState<number | string>('0.00');
  const [unit, setUnit] = useState('Pcs');
  const [notes, setNotes] = useState('');
  const [selectedBOMId, setSelectedBOMId] = useState<string>('');
  const [saveAsBOM, setSaveAsBOM] = useState(false);
  const [bomName, setBOMName] = useState('');

  // Raw Materials list
  const [rawMaterials, setRawMaterials] = useState<
    Array<{
      tempId: string;
      itemId: string;
      itemName: string;
      unit: string;
      quantity: number;
      rate: number;
      totalCost: number;
      availableStock: number;
    }>
  >([]);

  // Additional direct costs (e.g. stitching labour, washing, packaging)
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>([
    { id: 'cost-1', name: 'Stitching & Tailoring Labour (सिलाई मजदूरी)', amount: 0 },
    { id: 'cost-2', name: 'Washing, Dyeing & Finishing (वॉशिंग व फिनिशिंग)', amount: 0 },
  ]);

  // Quick Add Item inline modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddItemName, setQuickAddItemName] = useState('');
  const [quickAddItemUnit, setQuickAddItemUnit] = useState('Pcs');
  const [quickAddItemType, setQuickAddItemType] = useState<'RAW' | 'FINISHED'>('RAW');
  const [quickAddItemPurchasePrice, setQuickAddItemPurchasePrice] = useState<number>(0);
  const [quickAddItemOpeningStock, setQuickAddItemOpeningStock] = useState<number>(0);

  // Success message state
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Reset & initialize
  useEffect(() => {
    if (isOpen) {
      setEntryNumber(getNextProductionNumber());
      setDate(getTodayDateString());
      setNotes('');
      setSelectedBOMId('');
      setSaveAsBOM(false);
      setOutputQuantity('0.00');

      // Default select finished item if available (e.g. jeans or first finished good)
      const defaultFG = items.find(
        (i) => i.id === 'item-fg-jeans' || i.name.toLowerCase().includes('jeans') || i.name.toLowerCase().includes('finished')
      ) || items[0];

      if (defaultFG) {
        setFinishedItemId(defaultFG.id);
        setUnit(defaultFG.unit || 'Pcs');
      }

      // Check if there is a preset BOM for this finished item
      const matchingBOM = boms.find((b) => defaultFG && b.finishedItemId === defaultFG.id) || boms[0];
      if (matchingBOM) {
        applyBOMTemplate(matchingBOM, 1);
        setOutputQuantity('0.00');
      } else {
        // Default sample raw materials row
        const fabricItem = items.find((i) => i.name.toLowerCase().includes('fabric') || i.name.toLowerCase().includes('denim'));
        const asterItem = items.find((i) => i.name.toLowerCase().includes('aster') || i.name.toLowerCase().includes('lining'));
        const zipItem = items.find((i) => i.name.toLowerCase().includes('zip'));
        const threadItem = items.find((i) => i.name.toLowerCase().includes('thread'));

        const initialRows = [];
        if (fabricItem) {
          initialRows.push({
            tempId: 'row-1',
            itemId: fabricItem.id,
            itemName: fabricItem.name,
            unit: fabricItem.unit,
            quantity: 13.5,
            rate: fabricItem.purchasePrice || 180,
            totalCost: 13.5 * (fabricItem.purchasePrice || 180),
            availableStock: fabricItem.currentStock,
          });
        }
        if (asterItem) {
          initialRows.push({
            tempId: 'row-2',
            itemId: asterItem.id,
            itemName: asterItem.name,
            unit: asterItem.unit,
            quantity: 2.5,
            rate: asterItem.purchasePrice || 45,
            totalCost: 2.5 * (asterItem.purchasePrice || 45),
            availableStock: asterItem.currentStock,
          });
        }
        if (zipItem) {
          initialRows.push({
            tempId: 'row-3',
            itemId: zipItem.id,
            itemName: zipItem.name,
            unit: zipItem.unit,
            quantity: 10,
            rate: zipItem.purchasePrice || 8.5,
            totalCost: 10 * (zipItem.purchasePrice || 8.5),
            availableStock: zipItem.currentStock,
          });
        }
        if (threadItem) {
          initialRows.push({
            tempId: 'row-4',
            itemId: threadItem.id,
            itemName: threadItem.name,
            unit: threadItem.unit,
            quantity: 0.5,
            rate: threadItem.purchasePrice || 65,
            totalCost: 0.5 * (threadItem.purchasePrice || 65),
            availableStock: threadItem.currentStock,
          });
        }

        if (initialRows.length > 0) {
          setRawMaterials(initialRows);
          setAdditionalCosts([
            { id: 'cost-1', name: 'Stitching & Tailoring Labour (सिलाई मजदूरी)', amount: 850 },
            { id: 'cost-2', name: 'Washing, Scrapping & Dyeing (वॉशिंग व रंगाई)', amount: 450 },
            { id: 'cost-3', name: 'Trimming, Ironing & Brand Packing (फिनिशिंग)', amount: 150 },
          ]);
        } else {
          setRawMaterials([
            {
              tempId: `row-${Date.now()}`,
              itemId: '',
              itemName: '',
              unit: 'Pcs',
              quantity: 1,
              rate: 0,
              totalCost: 0,
              availableStock: 0,
            },
          ]);
        }
      }
    }
  }, [isOpen]);

  // When Finished Item changes, update unit
  const handleFinishedItemChange = (newItemId: string) => {
    setFinishedItemId(newItemId);
    const item = items.find((i) => i.id === newItemId);
    if (item) {
      setUnit(item.unit || 'Pcs');
      setBOMName(`${item.name} BOM Recipe`);
      // Check if there is a matching BOM
      const matchingBOM = boms.find((b) => b.finishedItemId === newItemId);
      if (matchingBOM) {
        setSelectedBOMId(matchingBOM.id);
        applyBOMTemplate(matchingBOM, Number(outputQuantity) || 1);
      }
    }
  };

  // Apply BOM recipe to current form
  const applyBOMTemplate = (bom: BillOfMaterial, qty: number) => {
    setSelectedBOMId(bom.id);
    setFinishedItemId(bom.finishedItemId);
    setUnit(bom.unit || 'Pcs');
    const multiplier = (Number(qty) || 1) / (bom.baseOutputQty || 1);

    const rows = bom.rawMaterials.map((rm, idx) => {
      const invItem = items.find((i) => i.id === rm.itemId);
      const rowQty = Math.round(rm.quantity * multiplier * 100) / 100;
      const rowRate = rm.defaultRate || invItem?.purchasePrice || 0;
      return {
        tempId: `bom-rm-${idx}-${Date.now()}`,
        itemId: rm.itemId,
        itemName: invItem?.name || rm.itemName,
        unit: rm.unit || invItem?.unit || 'Pcs',
        quantity: rowQty,
        rate: rowRate,
        totalCost: Math.round(rowQty * rowRate * 100) / 100,
        availableStock: invItem?.currentStock || 0,
      };
    });
    setRawMaterials(rows);

    if (bom.standardAdditionalCosts && bom.standardAdditionalCosts.length > 0) {
      setAdditionalCosts(
        bom.standardAdditionalCosts.map((c, idx) => ({
          id: `bom-cost-${idx}-${Date.now()}`,
          name: c.name,
          amount: Math.round(c.amount * multiplier * 100) / 100,
        }))
      );
    }
  };

  // When output quantity changes, if a BOM is active, prompt/scale raw material quantities proportionally
  const handleOutputQuantityChange = (val: string | number) => {
    setOutputQuantity(val);
    const newQty = Number(val) || 0;

    if (selectedBOMId && newQty > 0) {
      const activeBOM = boms.find((b) => b.id === selectedBOMId);
      if (activeBOM) {
        applyBOMTemplate(activeBOM, newQty);
      }
    }
  };

  // Add new raw material row
  const handleAddRawMaterialRow = () => {
    setRawMaterials((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}`,
        itemId: '',
        itemName: '',
        unit: 'Pcs',
        quantity: 1,
        rate: 0,
        totalCost: 0,
        availableStock: 0,
      },
    ]);
  };

  // Remove raw material row
  const handleRemoveRawMaterialRow = (tempId: string) => {
    setRawMaterials((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Update raw material row
  const handleUpdateRawMaterialRow = (tempId: string, updates: Partial<(typeof rawMaterials)[0]>) => {
    setRawMaterials((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const updated = { ...r, ...updates };

        // If item selected, populate rate, unit, stock
        if (updates.itemId !== undefined && updates.itemId !== r.itemId) {
          const invItem = items.find((i) => i.id === updates.itemId);
          if (invItem) {
            updated.itemName = invItem.name;
            updated.unit = invItem.unit || 'Pcs';
            updated.rate = invItem.purchasePrice || 0;
            updated.availableStock = invItem.currentStock || 0;
          }
        }

        // Recalculate total cost
        const qty = Number(updated.quantity) || 0;
        const rate = Number(updated.rate) || 0;
        updated.totalCost = Math.round(qty * rate * 100) / 100;

        return updated;
      })
    );
  };

  // Add additional cost item
  const handleAddAdditionalCost = () => {
    setAdditionalCosts((prev) => [
      ...prev,
      { id: `cost-${Date.now()}`, name: 'Other Direct Expense', amount: 0 },
    ]);
  };

  // Remove additional cost item
  const handleRemoveAdditionalCost = (id: string) => {
    setAdditionalCosts((prev) => prev.filter((c) => c.id !== id));
  };

  // Update additional cost item
  const handleUpdateAdditionalCost = (id: string, updates: Partial<AdditionalCostItem>) => {
    setAdditionalCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Quick Add Item Handler
  const handleCreateQuickItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddItemName.trim()) return;

    const newItem = addItem({
      name: quickAddItemName.trim(),
      unit: quickAddItemUnit || 'Pcs',
      purchasePrice: Number(quickAddItemPurchasePrice) || 0,
      salePrice: quickAddItemType === 'FINISHED' ? (Number(quickAddItemPurchasePrice) * 1.5 || 0) : 0,
      openingStock: Number(quickAddItemOpeningStock) || 0,
      currentStock: Number(quickAddItemOpeningStock) || 0,
      gstRate: 5,
      minStockAlert: 10,
      description: quickAddItemType === 'RAW' ? 'Raw Material for manufacturing' : 'Finished Goods manufactured in-house',
    });

    if (quickAddItemType === 'FINISHED') {
      setFinishedItemId(newItem.id);
      setUnit(newItem.unit);
    } else {
      // Add as raw material row
      setRawMaterials((prev) => [
        ...prev,
        {
          tempId: `row-${Date.now()}`,
          itemId: newItem.id,
          itemName: newItem.name,
          unit: newItem.unit,
          quantity: 1,
          rate: newItem.purchasePrice || 0,
          totalCost: newItem.purchasePrice || 0,
          availableStock: newItem.currentStock || 0,
        },
      ]);
    }

    setQuickAddItemName('');
    setQuickAddItemPurchasePrice(0);
    setQuickAddItemOpeningStock(0);
    setIsQuickAddOpen(false);
  };

  // CALCULATIONS
  const totalRawMaterialCost = useMemo(() => {
    return rawMaterials.reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
  }, [rawMaterials]);

  const totalAdditionalCost = useMemo(() => {
    return additionalCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  }, [additionalCosts]);

  const totalProductionCost = useMemo(() => {
    return Math.round((totalRawMaterialCost + totalAdditionalCost) * 100) / 100;
  }, [totalRawMaterialCost, totalAdditionalCost]);

  const costPerUnit = useMemo(() => {
    const qty = Number(outputQuantity) || 1;
    return Math.round((totalProductionCost / (qty > 0 ? qty : 1)) * 100) / 100;
  }, [totalProductionCost, outputQuantity]);

  // Finished item name
  const finishedItemObj = useMemo(() => {
    return items.find((i) => i.id === finishedItemId);
  }, [items, finishedItemId]);

  // Validation
  const hasValidRawMaterials = rawMaterials.some((r) => r.itemId && r.quantity > 0);
  const isFormValid = finishedItemId && Number(outputQuantity) > 0 && hasValidRawMaterials;

  // Submit Manufacturing Entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !finishedItemObj) return;

    // Filter valid raw materials
    const formattedRawMaterials: RawMaterialConsumption[] = rawMaterials
      .filter((r) => r.itemId && r.quantity > 0)
      .map((r) => ({
        itemId: r.itemId,
        itemName: r.itemName,
        unit: r.unit,
        quantity: Number(r.quantity) || 0,
        rate: Number(r.rate) || 0,
        totalCost: Number(r.totalCost) || 0,
      }));

    const formattedAdditionalCosts = additionalCosts
      .filter((c) => c.name.trim() && Number(c.amount) > 0)
      .map((c) => ({
        id: c.id,
        name: c.name.trim(),
        amount: Number(c.amount) || 0,
      }));

    // Save as BOM recipe if requested
    if (saveAsBOM) {
      const baseQty = Number(outputQuantity) || 1;
      addBOM({
        name: bomName.trim() || `${finishedItemObj.name} Recipe (${baseQty} ${unit})`,
        finishedItemId: finishedItemObj.id,
        finishedItemName: finishedItemObj.name,
        baseOutputQty: baseQty,
        unit: unit,
        rawMaterials: formattedRawMaterials.map((rm) => ({
          itemId: rm.itemId,
          itemName: rm.itemName,
          quantity: rm.quantity,
          unit: rm.unit,
          defaultRate: rm.rate,
        })),
        standardAdditionalCosts: formattedAdditionalCosts.map((c) => ({
          name: c.name,
          amount: c.amount,
        })),
      });
    }

    // Record production
    const newProduction = addProduction({
      entryNumber: entryNumber.trim() || getNextProductionNumber(),
      date,
      finishedItemId: finishedItemObj.id,
      finishedItemName: finishedItemObj.name,
      outputQuantity: Number(outputQuantity) || 1,
      unit: unit || 'Pcs',
      rawMaterials: formattedRawMaterials,
      totalRawMaterialCost,
      additionalCosts: formattedAdditionalCosts,
      totalAdditionalCost,
      totalProductionCost,
      costPerUnit,
      notes: notes.trim(),
    });

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
      if (onSuccess) {
        onSuccess(newProduction.id);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex flex-col justify-center items-center">
      <div 
        className={`bg-white w-full h-full flex flex-col transition-all duration-200 overflow-hidden ${
          isFullScreen 
            ? 'fixed inset-0 z-50 rounded-none' 
            : 'max-w-6xl max-h-[96vh] rounded-2xl border border-slate-200 shadow-2xl'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Factory className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white truncate">
                  Production / Manufacturing (माल निर्माण एवं खपत)
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
                  Auto Stock Conversion
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5">
                Consume raw materials (कच्चा माल) &amp; generate finished stock (तैयार माल)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Full Screen Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={isFullScreen ? "Window View" : "Full Screen View"}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* TOAST ON SUCCESS */}
        {showSuccessToast && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 flex items-center justify-center space-x-2 animate-bounce shrink-0 text-xs sm:text-sm font-bold shadow-md">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              माल सफलतापूर्वक तैयार हुआ! कच्चा माल स्टॉक से कम हो गया और तैयार माल स्टॉक में जुड़ गया।
            </span>
          </div>
        )}

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50">
          {/* SECTION 1: FINISHED GOOD & BATCH INFO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Finished Product to Produce (क्या माल तैयार करना है?)
                </h3>
              </div>

              {/* Load BOM dropdown if available */}
              {boms.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-600 shrink-0">Formula / Recipe:</span>
                  <select
                    value={selectedBOMId}
                    onChange={(e) => {
                      const found = boms.find((b) => b.id === e.target.value);
                      if (found) applyBOMTemplate(found, Number(outputQuantity) || 1);
                    }}
                    className="text-xs bg-slate-50 border border-indigo-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Load Saved Recipe --</option>
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Finished Item Dropdown */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <span>Finished Item Name (तैयार माल का नाम)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddItemType('FINISHED');
                      setIsQuickAddOpen(true);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Item</span>
                  </button>
                </div>
                <select
                  value={finishedItemId}
                  onChange={(e) => handleFinishedItemChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Select or Create Finished Item --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Current Stock: {it.currentStock || 0} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quantity Produced (कितने पीस बने) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={outputQuantity}
                    onChange={(e) => handleOutputQuantityChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                    required
                  />
                  <span className="bg-slate-200 border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-xl font-black shrink-0">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Production Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Production Date (तारीख) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: RAW MATERIALS CONSUMPTION TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2.5">
              <div className="flex items-start sm:items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">2</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Raw Materials Consumed (कच्चा माल जो इस बैच में लगा)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Fabric, Aster, Zips, Thread, Buttons etc. will be automatically deducted from stock.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddItemType('RAW');
                    setIsQuickAddOpen(true);
                  }}
                  className="flex-1 sm:flex-none text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-300 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>+ Quick Add Material</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRawMaterialRow}
                  className="flex-1 sm:flex-none text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>+ Add Row</span>
                </button>
              </div>
            </div>

            {/* MOBILE CARDS VIEW (Visible on Small Screens) */}
            <div className="block md:hidden space-y-3">
              {rawMaterials.map((row, idx) => {
                const isOverStock = row.itemId && row.quantity > row.availableStock;
                return (
                  <div 
                    key={row.tempId} 
                    className="bg-slate-50/90 border border-slate-200 hover:border-slate-300 rounded-2xl p-3.5 space-y-3 shadow-2xs transition"
                  >
                    {/* Card Header: Row Number + Select Item + Delete */}
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <select
                        value={row.itemId}
                        onChange={(e) => handleUpdateRawMaterialRow(row.tempId, { itemId: e.target.value })}
                        className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none truncate cursor-pointer"
                        required
                      >
                        <option value="">-- Select Raw Material --</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.unit})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveRawMaterialRow(row.tempId)}
                        disabled={rawMaterials.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded-xl transition shrink-0 cursor-pointer"
                        title="Remove material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Available Stock & Unit Info Bar */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-semibold">Available:</span>
                        {row.itemId ? (
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap ${
                              row.availableStock <= 0
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : isOverStock
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {row.availableStock} {row.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        Unit: {row.unit || 'Pcs'}
                      </span>
                    </div>

                    {/* Numeric Inputs 3-Column Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {/* Consumed Qty */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 truncate">
                          Qty ({row.unit || 'Unit'})
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={row.quantity || ''}
                          onChange={(e) =>
                            handleUpdateRawMaterialRow(row.tempId, { quantity: Number(e.target.value) })
                          }
                          className={`w-full bg-white border rounded-xl px-2.5 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-center ${
                            isOverStock ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      {/* Cost Rate */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 truncate">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.rate || ''}
                          onChange={(e) =>
                            handleUpdateRawMaterialRow(row.tempId, { rate: Number(e.target.value) })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Total Cost */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 truncate">
                          Cost (₹)
                        </label>
                        <div className="w-full bg-indigo-50/80 border border-indigo-200 rounded-xl px-2 py-2 text-center flex flex-col justify-center min-h-[34px]">
                          <span className="text-xs font-black font-mono text-indigo-950 truncate">
                            {formatCurrency(row.totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Total Bar */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                <span className="text-slate-300 uppercase tracking-wider text-[11px]">Total Raw Material:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {formatCurrency(totalRawMaterialCost)}
                </span>
              </div>
            </div>

            {/* DESKTOP TABLE VIEW (Visible on Medium & Large Screens) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Raw Material Item</th>
                    <th className="py-3 px-3 w-32 text-center whitespace-nowrap">Available Stock</th>
                    <th className="py-3 px-3 w-32 text-right whitespace-nowrap">Consumed Qty</th>
                    <th className="py-3 px-3 w-20 text-center">Unit</th>
                    <th className="py-3 px-3 w-28 text-right whitespace-nowrap">Cost Rate (₹)</th>
                    <th className="py-3 px-3 w-32 text-right whitespace-nowrap">Total Cost (₹)</th>
                    <th className="py-3 px-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {rawMaterials.map((row, idx) => {
                    const isOverStock = row.itemId && row.quantity > row.availableStock;
                    return (
                      <tr key={row.tempId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-slate-400 font-mono text-center">{idx + 1}</td>

                        {/* Item selector */}
                        <td className="py-2.5 px-3">
                          <select
                            value={row.itemId}
                            onChange={(e) => handleUpdateRawMaterialRow(row.tempId, { itemId: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            required
                          >
                            <option value="">-- Select Raw Material --</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} ({it.unit})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Stock status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {row.itemId ? (
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap inline-block ${
                                row.availableStock <= 0
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isOverStock
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {row.availableStock} {row.unit}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={row.quantity || ''}
                            onChange={(e) =>
                              handleUpdateRawMaterialRow(row.tempId, { quantity: Number(e.target.value) })
                            }
                            className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-right ${
                              isOverStock ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300'
                            }`}
                            placeholder="0.00"
                            required
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {row.unit || 'Pcs'}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.rate || ''}
                            onChange={(e) =>
                              handleUpdateRawMaterialRow(row.tempId, { rate: Number(e.target.value) })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                            placeholder="0.00"
                          />
                        </td>

                        {/* Total Cost */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(row.totalCost)}
                        </td>

                        {/* Delete button */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRawMaterialRow(row.tempId)}
                            disabled={rawMaterials.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1 rounded transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-800 text-xs border-t border-slate-200">
                    <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider">
                      Total Raw Material Cost (कच्चे माल की कुल लागत):
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-700 font-black text-sm whitespace-nowrap">
                      {formatCurrency(totalRawMaterialCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL DIRECT COSTS / LABOUR */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    Direct Production Expenses &amp; Labour (सिलाई, मजदूरी व अन्य खर्चे)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add Tailoring/Stitching wages, Washing, Finishing, Packaging expenses for exact per-piece costing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddAdditionalCost}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Expense Row</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {additionalCosts.map((cost) => (
                <div key={cost.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-2">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={cost.name}
                      onChange={(e) => handleUpdateAdditionalCost(cost.id, { name: e.target.value })}
                      placeholder="Expense Name (e.g. सिलाई मजदूरी)"
                      className="w-full text-xs font-semibold text-slate-800 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none pb-0.5"
                    />
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cost.amount || ''}
                        onChange={(e) => handleUpdateAdditionalCost(cost.id, { amount: Number(e.target.value) })}
                        placeholder="0.00"
                        className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalCost(cost.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                    title="Remove expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: LIVE COST CALCULATION & RECIPE PRESET */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Notes & Recipe save option */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Production Batch Notes / Remarks (टिप्पणी / बैच विवरण)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Batch #42: 32-34 Size Denim Jeans produced in Lot 1 with heavy enzyme wash"
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              {/* Save as BOM Recipe checkbox */}
              <div className="pt-2 border-t border-slate-100 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="saveBOMCheckbox"
                  checked={saveAsBOM}
                  onChange={(e) => setSaveAsBOM(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="saveBOMCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold">Save this formula as a Recipe / BOM template</span> (ताकि अगली बार 1-क्लिक में यही फॉर्मूला लोड हो सके)
                </label>
              </div>

              {saveAsBOM && (
                <div className="pl-6">
                  <input
                    type="text"
                    value={bomName}
                    onChange={(e) => setBOMName(e.target.value)}
                    placeholder="Recipe Name (e.g. Men's Jeans Standard Formula)"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Live Cost Summary Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-indigo-700/50 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                    <Calculator className="w-4 h-4" />
                    <span>Cost Analysis (लागत सारांश)</span>
                  </h4>
                  <span className="text-xs text-slate-300 font-mono">
                    Batch: {outputQuantity} {unit}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Raw Material Cost:</span>
                    <span className="font-mono text-white">{formatCurrency(totalRawMaterialCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Direct Wages &amp; Expenses:</span>
                    <span className="font-mono text-white">{formatCurrency(totalAdditionalCost)}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-700/50 flex justify-between font-bold text-sm text-amber-300">
                    <span>Total Batch Cost:</span>
                    <span className="font-mono">{formatCurrency(totalProductionCost)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-700/50 bg-indigo-950/60 rounded-lg p-2.5 text-center">
                <span className="text-xs text-slate-300 block mb-0.5">Calculated Cost Per Piece (प्रति पीस लागत)</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  {formatCurrency(costPerUnit)} <span className="text-xs font-normal text-slate-300">/{unit}</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: FINAL ACTION & SUBMIT BUTTONS (SABSE LAST ME) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="bg-sky-50 border border-sky-200 text-sky-950 rounded-xl p-3 flex items-center space-x-2.5 text-xs sm:text-sm">
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <span>
                On clicking produce, raw materials stock will decrease &amp; <strong>{outputQuantity} {unit} of {finishedItemObj?.name || 'finished goods'}</strong> will be added to stock!
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <Factory className="w-5 h-5" />
                <span>Produce &amp; Update Stock (माल तैयार करें)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* QUICK ADD ITEM INLINE MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>
                  {quickAddItemType === 'FINISHED' ? 'Add New Finished Item (जैसे Jeans)' : 'Add New Raw Material (जैसे Fabric / Zip / Aster)'}
                </span>
              </h4>
              <button onClick={() => setIsQuickAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickAddItemName}
                  onChange={(e) => setQuickAddItemName(e.target.value)}
                  placeholder={quickAddItemType === 'FINISHED' ? 'e.g. Slim-Fit Jeans' : 'e.g. Denim Fabric Indigo / Metal Zip'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={quickAddItemUnit}
                    onChange={(e) => setQuickAddItemUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Mtr">Mtr (Meters)</option>
                    <option value="Spool">Spool / Reel</option>
                    <option value="Kg">Kg</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost / Purchase Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quickAddItemPurchasePrice || ''}
                    onChange={(e) => setQuickAddItemPurchasePrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {quickAddItemType === 'RAW' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current In-Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quickAddItemOpeningStock || ''}
                    onChange={(e) => setQuickAddItemOpeningStock(Number(e.target.value))}
                    placeholder="Opening Stock Available"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
