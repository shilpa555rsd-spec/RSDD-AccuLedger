import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  CompanyProfile,
  Voucher,
  AccountLedger,
  InventoryItem,
  AccountGroup,
  BillOfMaterial,
} from '../types';

export interface CloudCompanyData {
  profile: CompanyProfile;
  vouchers: Voucher[];
  ledgers: AccountLedger[];
  items: InventoryItem[];
  groups: AccountGroup[];
  boms: BillOfMaterial[];
}

// Helper to ensure network calls never hang indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs = 7000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Recursively strips all `undefined` values from an object or array,
 * preventing Firestore's "Function setDoc() called with invalid data. Unsupported field value: undefined" error.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) {
      return data;
    }
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// 1. Fetch user's company list
export async function getCloudCompanies(userId: string): Promise<CompanyProfile[]> {
  try {
    const colRef = collection(db, 'users', userId, 'companies');
    const snapshot = await withTimeout(getDocs(colRef), 7000, null as any);
    if (!snapshot) return [];
    const companies: CompanyProfile[] = [];
    snapshot.forEach((d: any) => {
      const data = d.data() as CompanyProfile;
      if (data && data.id) {
        companies.push(data);
      }
    });
    return companies;
  } catch (error) {
    console.error('Error loading companies from Firestore:', error);
    return [];
  }
}

// 2. Save a company to Firestore
export async function saveCompanyToCloud(userId: string, company: CompanyProfile): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', company.id);
    await withTimeout(setDoc(docRef, sanitizeForFirestore(company), { merge: true }), 7000, undefined);
  } catch (error) {
    console.error('Error saving company to Firestore:', error);
  }
}

// 3. Delete a company and its subcollections from Firestore
export async function deleteCompanyFromCloud(userId: string, companyId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId);
    await withTimeout(deleteDoc(docRef), 7000, undefined);

    // Clean up subcollections
    const subcollections = ['vouchers', 'ledgers', 'items', 'groups', 'boms'];
    for (const sub of subcollections) {
      const colRef = collection(db, 'users', userId, 'companies', companyId, sub);
      const snap = await withTimeout(getDocs(colRef), 5000, null as any);
      if (snap && !snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d: any) => batch.delete(d.ref));
        await withTimeout(batch.commit(), 5000, undefined);
      }
    }
  } catch (error) {
    console.error('Error deleting company from Firestore:', error);
  }
}

// 4. Load all accounting data for a specific company in parallel with timeout
export async function loadCompanyDataFromCloud(
  userId: string,
  companyId: string
): Promise<Partial<CloudCompanyData> | null> {
  try {
    const [profileSnap, vouchersSnap, ledgersSnap, itemsSnap, groupsSnap, bomsSnap] =
      await withTimeout(
        Promise.all([
          getDoc(doc(db, 'users', userId, 'companies', companyId)),
          getDocs(collection(db, 'users', userId, 'companies', companyId, 'vouchers')),
          getDocs(collection(db, 'users', userId, 'companies', companyId, 'ledgers')),
          getDocs(collection(db, 'users', userId, 'companies', companyId, 'items')),
          getDocs(collection(db, 'users', userId, 'companies', companyId, 'groups')),
          getDocs(collection(db, 'users', userId, 'companies', companyId, 'boms')),
        ]),
        8000,
        [null, null, null, null, null, null] as any[]
      );

    const profile = profileSnap?.exists?.() ? (profileSnap.data() as CompanyProfile) : undefined;

    const vouchers: Voucher[] = [];
    if (vouchersSnap) {
      vouchersSnap.forEach((d: any) => vouchers.push(d.data() as Voucher));
    }

    const ledgers: AccountLedger[] = [];
    if (ledgersSnap) {
      ledgersSnap.forEach((d: any) => ledgers.push(d.data() as AccountLedger));
    }

    const items: InventoryItem[] = [];
    if (itemsSnap) {
      itemsSnap.forEach((d: any) => items.push(d.data() as InventoryItem));
    }

    const groups: AccountGroup[] = [];
    if (groupsSnap) {
      groupsSnap.forEach((d: any) => groups.push(d.data() as AccountGroup));
    }

    const boms: BillOfMaterial[] = [];
    if (bomsSnap) {
      bomsSnap.forEach((d: any) => boms.push(d.data() as BillOfMaterial));
    }

    return {
      profile,
      vouchers,
      ledgers,
      items,
      groups,
      boms,
    };
  } catch (error) {
    console.error(`Error loading data for company ${companyId} from Firestore:`, error);
    return null;
  }
}

// 5. Save a voucher to Firestore
export async function saveVoucherToCloud(
  userId: string,
  companyId: string,
  voucher: Voucher
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'vouchers', voucher.id);
    await withTimeout(setDoc(docRef, sanitizeForFirestore(voucher), { merge: true }), 7000, undefined);
  } catch (error) {
    console.error('Error saving voucher to Firestore:', error);
  }
}

// 6. Delete a voucher from Firestore
export async function deleteVoucherFromCloud(
  userId: string,
  companyId: string,
  voucherId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'vouchers', voucherId);
    await withTimeout(deleteDoc(docRef), 7000, undefined);
  } catch (error) {
    console.error('Error deleting voucher from Firestore:', error);
  }
}

// 7. Save a ledger to Firestore
export async function saveLedgerToCloud(
  userId: string,
  companyId: string,
  ledger: AccountLedger
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'ledgers', ledger.id);
    await withTimeout(setDoc(docRef, sanitizeForFirestore(ledger), { merge: true }), 7000, undefined);
  } catch (error) {
    console.error('Error saving ledger to Firestore:', error);
  }
}

// 8. Delete a ledger from Firestore
export async function deleteLedgerFromCloud(
  userId: string,
  companyId: string,
  ledgerId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'ledgers', ledgerId);
    await withTimeout(deleteDoc(docRef), 7000, undefined);
  } catch (error) {
    console.error('Error deleting ledger from Firestore:', error);
  }
}

// 9. Save an inventory item to Firestore
export async function saveItemToCloud(
  userId: string,
  companyId: string,
  item: InventoryItem
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'items', item.id);
    await withTimeout(setDoc(docRef, sanitizeForFirestore(item), { merge: true }), 7000, undefined);
  } catch (error) {
    console.error('Error saving item to Firestore:', error);
  }
}

// 10. Delete an inventory item from Firestore
export async function deleteItemFromCloud(
  userId: string,
  companyId: string,
  itemId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'items', itemId);
    await withTimeout(deleteDoc(docRef), 7000, undefined);
  } catch (error) {
    console.error('Error deleting item from Firestore:', error);
  }
}

// 11. Save a group to Firestore
export async function saveGroupToCloud(
  userId: string,
  companyId: string,
  group: AccountGroup
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'companies', companyId, 'groups', group.id);
    await withTimeout(setDoc(docRef, sanitizeForFirestore(group), { merge: true }), 7000, undefined);
  } catch (error) {
    console.error('Error saving group to Firestore:', error);
  }
}

// 12. Batch sync an entire company (useful on first cloud upload / restore)
export async function batchSyncEntireCompanyToCloud(
  userId: string,
  company: CompanyProfile,
  data: {
    vouchers: Voucher[];
    ledgers: AccountLedger[];
    items: InventoryItem[];
    groups: AccountGroup[];
    boms: BillOfMaterial[];
  }
): Promise<void> {
  try {
    // 1. Company profile doc
    await setDoc(doc(db, 'users', userId, 'companies', company.id), sanitizeForFirestore(company), { merge: true });

    // 2. Vouchers batch
    if (data.vouchers.length > 0) {
      const batch = writeBatch(db);
      data.vouchers.forEach((v) => {
        batch.set(doc(db, 'users', userId, 'companies', company.id, 'vouchers', v.id), sanitizeForFirestore(v), {
          merge: true,
        });
      });
      await batch.commit();
    }

    // 3. Ledgers batch
    if (data.ledgers.length > 0) {
      const batch = writeBatch(db);
      data.ledgers.forEach((l) => {
        batch.set(doc(db, 'users', userId, 'companies', company.id, 'ledgers', l.id), sanitizeForFirestore(l), {
          merge: true,
        });
      });
      await batch.commit();
    }

    // 4. Items batch
    if (data.items.length > 0) {
      const batch = writeBatch(db);
      data.items.forEach((item) => {
        batch.set(doc(db, 'users', userId, 'companies', company.id, 'items', item.id), sanitizeForFirestore(item), {
          merge: true,
        });
      });
      await batch.commit();
    }

    // 5. Groups batch
    if (data.groups.length > 0) {
      const batch = writeBatch(db);
      data.groups.forEach((g) => {
        batch.set(doc(db, 'users', userId, 'companies', company.id, 'groups', g.id), sanitizeForFirestore(g), {
          merge: true,
        });
      });
      await batch.commit();
    }

    // 6. BOMs batch
    if (data.boms.length > 0) {
      const batch = writeBatch(db);
      data.boms.forEach((b) => {
        batch.set(doc(db, 'users', userId, 'companies', company.id, 'boms', b.id), sanitizeForFirestore(b), {
          merge: true,
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error batch syncing company ${company.id} to Firestore:`, error);
  }
}
