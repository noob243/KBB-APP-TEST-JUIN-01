import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Secure Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Low-level write wrapper
export async function dbCreateDoc<T extends { id: string | number }>(collectionName: string, id: string | number, data: Omit<T, 'id'>) {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, String(id));
    await setDoc(docRef, { ...data, id });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Low-level update wrapper
export async function dbUpdateDoc<T extends { id: string | number }>(collectionName: string, id: string | number, data: Partial<T>) {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, String(id));
    await updateDoc(docRef, data as any);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Low-level delete wrapper
export async function dbDeleteDoc(collectionName: string, id: string | number) {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Helper to seed database if empty
export async function seedCollectionIfEmpty<T extends { id: string | number }>(collectionName: string, initialData: T[]) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log(`Seeding Firestore collection: ${collectionName}`);
      for (const item of initialData) {
        const id = item.id;
        const data = { ...item };
        await setDoc(doc(db, collectionName, String(id)), data);
      }
    }
  } catch (error) {
    console.error(`Failed to seed collection ${collectionName}:`, error);
  }
}

// Bi-directional safety sync: pushes local entries that do not exist in Firestore yet
export async function syncLocalCollection<T extends { id: string | number }>(
  collectionName: string,
  localItems: T[]
): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    
    // Case 1: Firestore is empty - Seed with current local state (contains any custom edits)
    if (snap.empty) {
      console.log(`Firestore ${collectionName} is empty. Seeding with current local state of size:`, localItems.length);
      for (const item of localItems) {
        const docRef = doc(db, collectionName, String(item.id));
        const data = { ...item };
        await setDoc(docRef, data);
      }
      return;
    }

    // Case 2: Firestore has entries - Detect and push any items ONLY existing locally (e.g. offline inserts)
    const cloudIds = new Set(snap.docs.map(d => String(d.id)));
    let uploadedCount = 0;
    
    for (const item of localItems) {
      if (!cloudIds.has(String(item.id))) {
        console.log(`Uploading missing offline/local insert to Firestore for ${collectionName}: ID ${item.id}`);
        const docRef = doc(db, collectionName, String(item.id));
        const data = { ...item };
        await setDoc(docRef, data);
        uploadedCount++;
      }
    }
    
    if (uploadedCount > 0) {
      console.log(`Uploaded ${uploadedCount} missing local records to Cloud Firestore for ${collectionName}.`);
    }
  } catch (error) {
    console.error(`Failed to sync local collection ${collectionName} with Firestore:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/_sync`);
  }
}
