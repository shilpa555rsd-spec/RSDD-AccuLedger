import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem, ProductionEntry } from '../../types';
import { formatCurrency, formatDateIndian } from '../../utils/formatters';
import { generateStockSummaryPdf } from '../../utils/pdfGenerator';
import { ManufacturingModal } from './ManufacturingModal';
import { ProductionSlipModal } from './ProductionSlipModal';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  AlertTriangle,
  CheckCircle,
  Share2,
  Factory,
  Layers,
  ChevronDown,
  Scissors,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface InventoryManagerViewProps {
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onOpenItemStatement: (item: InventoryItem) => void;
}

export const InventoryManagerView: React.FC<InventoryManagerViewProps> = ({
  onAddItem,
  onEditItem,
  onOpenItemStatement,
}) => {
  const { 
    items, 
    deleteItem, 
    companyProfile, 
    lowStockItems, 
    productions, 
    deleteProduction,
    boms 
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'items' | 'manufacturing' | 'boms'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'instock' | 'raw' | 'finished'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);

  // Manufacturing Modals
  const [isManufacturingOpen, setIsManufacturingOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<ProductionEntry | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const totalValuation = items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.purchasePrice || 0), 0);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.hsnCode && item.hsnCode.includes(searchTerm));

    if (!matchesSearch) return false;

    const isLow = (item.currentStock || 0) <= (item.minStockAlert || 5);
    const isRaw = item.name.toLowerCase().includes('fabric') || 
                  item.name.toLowerCase().includes('aster') || 
                  item.name.toLowerCase().includes('zip') || 
                  item.name.toLowerCase().includes('thread') ||
                  item.name.toLowerCase().includes('raw');
    const isFinished = item.name.toLowerCase().includes('jeans') || 
                       item.name.toLowerCase().includes('shirt') || 
                       item.name.toLowerCase().includes('finished');

    if (stockFilter === 'low') return isLow;
    if (stockFilter === 'instock') return !isLow;
    if (stockFilter === 'raw') return isRaw;
    if (stockFilter === 'finished') return isFinished;
    return true;
  });

  const handleDelete = (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete item "${item.name}"?`)) {
      const res = deleteItem(item.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleDeleteProduction = (pe: ProductionEntry) => {
    if (confirm(`Are you sure you want to delete production batch "${pe.entryNumber}"? This will reverse raw material consumption and finished goods addition.`)) {
      deleteProduction(pe.id);
    }
  };

  const handleDownloadStockPdf = async () => {
    try {
      setIsExporting(true);
      await generateStockSummaryPdf(items, companyProfile, false);
    } catch (err) {
      console.error('Error exporting stock PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareStockPdf = async () => {
    try {
      setIsExporting(true);
      await generateStockSummaryPdf(items, companyProfile, true);
    } catch (err) {
      console.error('Error sharing stock PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Left: Title & Report Button strictly in the exact same inline row */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-nowrap min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
            <h1 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 truncate">
              Inventory &amp; Manufacturing
            </h1>
          </div>

          {/* Report Dropdown Menu right after title on the same line */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
              disabled={isExporting}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-700" />
              <span>{isExporting ? 'Exporting...' : 'Report'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isReportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isReportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsReportMenuOpen(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setIsReportMenuOpen(false);
                      handleShareStockPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Share PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsReportMenuOpen(false);
                      handleDownloadStockPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: + Make Goods and + Add Item in a single straight line */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsManufacturingOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition active:scale-95 border border-slate-700 whitespace-nowrap cursor-pointer"
          >
            <Factory className="w-4 h-4 text-amber-400 shrink-0" />
            <span>+ Make Goods (माल निर्माण)</span>
          </button>

          <button
            onClick={onAddItem}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200 rounded-2xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition whitespace-nowrap ${
            activeTab === 'items'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Package className="w-4 h-4 text-amber-400" />
          <span>Stock Register (स्टॉक रजिस्टर - {items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manufacturing')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition whitespace-nowrap ${
            activeTab === 'manufacturing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Factory className="w-4 h-4 text-emerald-400" />
          <span>Manufacturing &amp; Production Batches (निर्माण इतिहास - {productions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('boms')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition whitespace-nowrap ${
            activeTab === 'boms'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Recipes &amp; BOM Formulas (रेसिपी फॉर्मूला - {boms.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK REGISTER */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items by name, Fabric, Jeans, SKU, or HSN..."
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    stockFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setStockFilter('raw')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    stockFilter === 'raw'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  Raw Material (कच्चा माल)
                </button>
                <button
                  onClick={() => setStockFilter('finished')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    stockFilter === 'finished'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-indigo-800 hover:bg-indigo-50'
                  }`}
                >
                  Finished (तैयार माल)
                </button>
                <button
                  onClick={() => setStockFilter('low')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    stockFilter === 'low'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Low ({lowStockItems.length})
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-3.5">Item Name / Category</th>
                    <th className="py-3 px-3">HSN Code</th>
                    <th className="py-3 px-3">GST Rate</th>
                    <th className="py-3 px-3">Purchase / Cost</th>
                    <th className="py-3 px-3">Sale Price</th>
                    <th className="py-3 px-3">Available Stock</th>
                    <th className="py-3 px-3 text-right">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = (item.currentStock || 0) <= (item.minStockAlert || 5);
                      const itemValuation = (item.currentStock || 0) * (item.purchasePrice || 0);

                      const isRaw = item.name.toLowerCase().includes('fabric') || 
                                    item.name.toLowerCase().includes('aster') || 
                                    item.name.toLowerCase().includes('zip') || 
                                    item.name.toLowerCase().includes('thread') ||
                                    item.name.toLowerCase().includes('rivet');

                      const isFinished = item.name.toLowerCase().includes('jeans') || 
                                         item.name.toLowerCase().includes('shirt');

                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => onOpenItemStatement(item)}
                          className="hover:bg-amber-50/60 active:bg-amber-100/50 transition cursor-pointer group"
                          title="Click to view Stock Movement / Ledger Statement"
                        >
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition">
                                {item.name}
                              </span>
                              {isRaw && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Raw Material
                                </span>
                              )}
                              {isFinished && (
                                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Finished Good
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {item.sku && <span>SKU: {item.sku}</span>}
                              {item.description && <span className="truncate max-w-[200px]">• {item.description}</span>}
                              <span className="text-amber-700/80 font-medium hidden sm:inline group-hover:inline">• Click for statement</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-600">
                            {item.hsnCode || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-[10px]">
                              {item.gstRate || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">
                            {formatCurrency(item.purchasePrice || 0)}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            {formatCurrency(item.salePrice || 0)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-black text-sm ${
                                  isLow ? 'text-rose-600' : 'text-slate-900'
                                }`}
                              >
                                {item.currentStock || 0} {item.unit}
                              </span>
                              {isLow && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                                  LOW
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">Min: {item.minStockAlert || 5} {item.unit}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-sm">
                            {formatCurrency(itemValuation)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUFACTURING & PRODUCTION BATCHES */}
      {activeTab === 'manufacturing' && (
        <div className="space-y-4">
          {/* Quick Stats banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
            <div>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Manufacturing Hub
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Automated Raw Material Consumption &amp; Stock Conversion
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5">
                Record finished items (जैसे Jeans) - fabric, aster, zips, threads are automatically deducted from inventory!
              </p>
            </div>

            <button
              onClick={() => setIsManufacturingOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 flex items-center space-x-2"
            >
              <Factory className="w-4 h-4" />
              <span>+ Record New Production Batch</span>
            </button>
          </div>

          {/* Batches Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Factory className="w-4 h-4 text-indigo-600" />
                <span>Production Batch Records (निर्माण बैच सूची)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Total Batches: <strong>{productions.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-3.5">Batch No. / Date</th>
                    <th className="py-3 px-3">Finished Good Produced</th>
                    <th className="py-3 px-3">Output Qty</th>
                    <th className="py-3 px-3 min-w-[200px]">Raw Materials Consumed</th>
                    <th className="py-3 px-3">Total Batch Cost</th>
                    <th className="py-3 px-3">Cost / Unit</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {productions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Factory className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-600">No production batches recorded yet.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click "+ Record New Production Batch" to produce finished goods from raw materials!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    productions.map((pe) => (
                      <tr key={pe.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-indigo-700 font-mono text-sm">{pe.entryNumber}</div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateIndian(pe.date)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                          {pe.finishedItemName}
                        </td>

                        <td className="py-3 px-3">
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-2.5 py-1 rounded-lg">
                            +{pe.outputQuantity} {pe.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {pe.rawMaterials?.slice(0, 3).map((rm, idx) => (
                              <div key={idx} className="text-[11px] text-slate-600 flex items-center justify-between">
                                <span>• {rm.itemName}:</span>
                                <span className="font-mono font-bold text-rose-700">-{rm.quantity} {rm.unit}</span>
                              </div>
                            ))}
                            {pe.rawMaterials && pe.rawMaterials.length > 3 && (
                              <div className="text-[10px] text-slate-400 italic">
                                +{pe.rawMaterials.length - 3} more materials
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(pe.totalProductionCost)}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-extrabold text-emerald-700 font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded">
                            {formatCurrency(pe.costPerUnit)}/{pe.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedProduction(pe);
                                setIsSlipOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition flex items-center space-x-1"
                              title="View Production Slip / Job Card"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Slip</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduction(pe)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILL OF MATERIALS (BOM) & FORMULAS */}
      {activeTab === 'boms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Standard Recipes &amp; Bill of Materials (BOM)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved manufacturing formulas for automated one-click batch calculation and costing.
              </p>
            </div>
            <button
              onClick={() => setIsManufacturingOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Use Recipe to Make Batch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map((bom) => {
              const baseCost = bom.rawMaterials.reduce(
                (acc, rm) => acc + rm.quantity * (rm.defaultRate || 0),
                0
              ) + (bom.standardAdditionalCosts?.reduce((acc, c) => acc + c.amount, 0) || 0);

              return (
                <div key={bom.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Recipe
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{bom.name}</h4>
                      <p className="text-xs text-slate-500">
                        Produces: <strong>{bom.baseOutputQty} {bom.unit} of {bom.finishedItemName}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsManufacturingOpen(true);
                      }}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs"
                    >
                      Produce Now
                    </button>
                  </div>

                  {/* Ingredients Table */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">Required Materials for {bom.baseOutputQty} {bom.unit}:</span>
                    <div className="bg-slate-50 rounded-xl p-3 divide-y divide-slate-200/60 text-xs">
                      {bom.rawMaterials.map((rm, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center text-slate-700">
                          <span className="font-medium">{rm.itemName}</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {rm.quantity} {rm.unit} @ ₹{rm.defaultRate || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standard Labour & Cost */}
                  {bom.standardAdditionalCosts && bom.standardAdditionalCosts.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block">Standard Labour &amp; Finishing:</span>
                      <div className="flex flex-wrap gap-2">
                        {bom.standardAdditionalCosts.map((c, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                            {c.name}: ₹{c.amount}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Estimated Unit Cost:</span>
                    <span className="font-black text-slate-900 text-sm font-mono">
                      {formatCurrency(baseCost / (bom.baseOutputQty || 1))} / {bom.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MANUFACTURING MODAL */}
      {isManufacturingOpen && (
        <ManufacturingModal
          isOpen={isManufacturingOpen}
          onClose={() => setIsManufacturingOpen(false)}
          onSuccess={(productionId) => {
            const found = productions.find((p) => p.id === productionId);
            if (found) {
              setSelectedProduction(found);
              setIsSlipOpen(true);
            }
          }}
        />
      )}

      {/* PRODUCTION SLIP MODAL */}
      {isSlipOpen && selectedProduction && (
        <ProductionSlipModal
          isOpen={isSlipOpen}
          onClose={() => {
            setIsSlipOpen(false);
            setSelectedProduction(null);
          }}
          production={selectedProduction}
        />
      )}
    </div>
  );
};

