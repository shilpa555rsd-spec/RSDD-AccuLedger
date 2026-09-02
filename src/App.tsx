import React, { useState } from 'react';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { VoucherListView } from './components/vouchers/VoucherListView';
import { VoucherFormModal } from './components/vouchers/VoucherFormModal';
import { InvoiceViewModal } from './components/vouchers/InvoiceViewModal';
import { LedgerListView } from './components/ledgers/LedgerListView';
import { LedgerFormModal } from './components/ledgers/LedgerFormModal';
import { LedgerStatementModal } from './components/ledgers/LedgerStatementModal';
import { GroupManagerModal } from './components/groups/GroupManagerModal';
import { InventoryManagerView } from './components/inventory/InventoryManagerView';
import { ItemFormModal } from './components/inventory/ItemFormModal';
import { ItemStatementModal } from './components/inventory/ItemStatementModal';
import { ReportsHubView } from './components/reports/ReportsHubView';
import { CompanyProfileModal } from './components/company/CompanyProfileModal';
import { CreateCompanyModal } from './components/company/CreateCompanyModal';
import { DeleteCompanyModal } from './components/company/DeleteCompanyModal';
import { CompanyManagerModal } from './components/company/CompanyManagerModal';
import { DataBackupModal } from './components/backup/DataBackupModal';
import { AccountLedger, CompanyProfile, InventoryItem, Voucher, VoucherType } from './types';

type NavigationTab = 'dashboard' | 'vouchers' | 'ledgers' | 'inventory' | 'reports';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherModalType, setVoucherModalType] = useState<VoucherType>('SALE');
  const [voucherToEdit, setVoucherToEdit] = useState<Voucher | null>(null);
  const [defaultPartyIdForVoucher, setDefaultPartyIdForVoucher] = useState<string | undefined>(undefined);

  const [selectedInvoiceVoucher, setSelectedInvoiceVoucher] = useState<Voucher | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [selectedStatementLedger, setSelectedStatementLedger] = useState<AccountLedger | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerToEdit, setLedgerToEdit] = useState<AccountLedger | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [selectedStatementItem, setSelectedStatementItem] = useState<InventoryItem | null>(null);
  const [isItemStatementModalOpen, setIsItemStatementModalOpen] = useState(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Multi-Company Management Modals State
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyProfile | null>(null);
  const [isDeleteCompanyModalOpen, setIsDeleteCompanyModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyProfile | null>(null);
  const [isCompanyManagerModalOpen, setIsCompanyManagerModalOpen] = useState(false);

  // Quick Action Handlers
  const handleOpenNewVoucher = (type: VoucherType, partyId?: string) => {
    setVoucherModalType(type);
    setVoucherToEdit(null);
    setDefaultPartyIdForVoucher(partyId);
    setIsVoucherModalOpen(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setVoucherModalType(voucher.type);
    setVoucherToEdit(voucher);
    setIsVoucherModalOpen(true);
  };

  const handleViewInvoice = (voucher: Voucher) => {
    setSelectedInvoiceVoucher(voucher);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenStatement = (ledger: AccountLedger) => {
    setSelectedStatementLedger(ledger);
    setIsStatementModalOpen(true);
  };

  const handleAddLedger = () => {
    setLedgerToEdit(null);
    setIsLedgerModalOpen(true);
  };

  const handleEditLedger = (ledger: AccountLedger) => {
    setLedgerToEdit(ledger);
    setIsLedgerModalOpen(true);
  };

  const handleAddItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleOpenItemStatement = (item: InventoryItem) => {
    setSelectedStatementItem(item);
    setIsItemStatementModalOpen(true);
  };

  const handleOpenCreateCompany = () => {
    setCompanyToEdit(null);
    setIsCreateCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (company: CompanyProfile) => {
    setCompanyToEdit(company);
    setIsCreateCompanyModalOpen(true);
  };

  const handleOpenDeleteCompany = (company: CompanyProfile) => {
    setCompanyToDelete(company);
    setIsDeleteCompanyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as NavigationTab)}
        onSelectTab={(tab) => setActiveTab(tab as NavigationTab)}
        onOpenSettings={() => setIsProfileModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenNewVoucher={handleOpenNewVoucher}
        onOpenAddLedger={handleAddLedger}
        onOpenAddGroup={() => setIsGroupModalOpen(true)}
        onOpenAddItem={handleAddItem}
        onOpenGroupManager={() => setIsGroupModalOpen(true)}
        onOpenQuickSale={() => handleOpenNewVoucher('SALE')}
        onOpenCreateCompany={handleOpenCreateCompany}
        onOpenCompanyManager={() => setIsCompanyManagerModalOpen(true)}
        onOpenDeleteCompany={handleOpenDeleteCompany}
      />

      {/* Main View Container */}
      <main className="flex-1 px-2.5 sm:px-6 pt-2 pb-4 sm:pt-3 sm:pb-6 max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setActiveTab}
            onOpenNewVoucher={handleOpenNewVoucher}
            onOpenAddParty={handleAddLedger}
            onOpenAddItem={handleAddItem}
            onViewInvoice={handleViewInvoice}
            onOpenStatement={handleOpenStatement}
            onOpenCreateCompany={handleOpenCreateCompany}
            onOpenCompanyManager={() => setIsCompanyManagerModalOpen(true)}
            onOpenDeleteCompany={handleOpenDeleteCompany}
          />
        )}

        {activeTab === 'vouchers' && (
          <VoucherListView
            onOpenNewVoucher={handleOpenNewVoucher}
            onViewInvoice={handleViewInvoice}
            onEditVoucher={handleEditVoucher}
          />
        )}

        {activeTab === 'ledgers' && (
          <LedgerListView
            onOpenStatement={handleOpenStatement}
            onOpenNewVoucher={handleOpenNewVoucher}
            onAddLedger={handleAddLedger}
            onEditLedger={handleEditLedger}
            onOpenGroupManager={() => setIsGroupModalOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagerView
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onOpenItemStatement={handleOpenItemStatement}
          />
        )}

        {activeTab === 'reports' && <ReportsHubView />}
      </main>

      {/* Bottom Navigation for mobile screens */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickAdd={() => handleOpenNewVoucher('SALE')}
      />

      {/* ALL MODALS */}
      {/* 1. Voucher / Invoice Form Modal */}
      <VoucherFormModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        initialType={voucherModalType}
        voucherToEdit={voucherToEdit}
        defaultPartyId={defaultPartyIdForVoucher}
      />

      {/* 2. Tax Invoice Preview & PDF Modal */}
      <InvoiceViewModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        voucher={selectedInvoiceVoucher}
        onEditVoucher={handleEditVoucher}
      />

      {/* 3. Ledger Statement Modal (Full screen detail view with instant PDF and WhatsApp share) */}
      <LedgerStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        ledger={selectedStatementLedger}
        onOpenNewVoucher={(type, partyId) => {
          setIsStatementModalOpen(false);
          handleOpenNewVoucher(type, partyId);
        }}
        onViewInvoice={(vch) => {
          handleViewInvoice(vch);
        }}
        onEditVoucher={(vch) => {
          setIsStatementModalOpen(false);
          handleEditVoucher(vch);
        }}
        onEditLedger={(led) => {
          setIsStatementModalOpen(false);
          handleEditLedger(led);
        }}
      />

      {/* 4. Party / Ledger Creation & Edit Modal */}
      <LedgerFormModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        ledgerToEdit={ledgerToEdit}
      />

      {/* 5. Group Manager Modal (Add / Edit Account Groups) */}
      <GroupManagerModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {/* 6. Inventory Item Modal */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
      />

      {/* 6.1. Inventory Item Statement / Movement Register Modal */}
      <ItemStatementModal
        isOpen={isItemStatementModalOpen}
        onClose={() => setIsItemStatementModalOpen(false)}
        item={selectedStatementItem}
        onViewInvoice={(vch) => {
          handleViewInvoice(vch);
        }}
        onEditVoucher={(vch) => {
          setIsItemStatementModalOpen(false);
          handleEditVoucher(vch);
        }}
        onEditItem={(item) => {
          setIsItemStatementModalOpen(false);
          handleEditItem(item);
        }}
      />

      {/* 7. Company & GST Settings Modal */}
      <CompanyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenCreateCompany={handleOpenCreateCompany}
        onOpenEditCompany={handleOpenEditCompany}
        onOpenCompanyManager={() => setIsCompanyManagerModalOpen(true)}
        onOpenDeleteCompany={handleOpenDeleteCompany}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* 8. Full-Screen Create / Edit Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => {
          setIsCreateCompanyModalOpen(false);
          setCompanyToEdit(null);
        }}
        editCompany={companyToEdit}
      />

      {/* 9. 2-Step Delete Company Confirmation Modal */}
      <DeleteCompanyModal
        isOpen={isDeleteCompanyModalOpen}
        onClose={() => {
          setIsDeleteCompanyModalOpen(false);
          setCompanyToDelete(null);
        }}
        company={companyToDelete}
      />

      {/* 10. Company Manager & Switcher Modal */}
      <CompanyManagerModal
        isOpen={isCompanyManagerModalOpen}
        onClose={() => setIsCompanyManagerModalOpen(false)}
        onCreateNewCompany={handleOpenCreateCompany}
        onEditCompany={handleOpenEditCompany}
        onDeleteCompany={handleOpenDeleteCompany}
      />

      {/* 11. Complete Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AccountingProvider>
      <MainAppContent />
    </AccountingProvider>
  );
}

export default App;

