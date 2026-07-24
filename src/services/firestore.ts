import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  UpdateData,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Add a new document to a Firestore collection with auto-generated ID
 */
export const addDocument = async <T extends WithFieldValue<DocumentData>>(
  collectionName: string,
  data: T
): Promise<string> => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Create or overwrite a document at a specific doc ID
 */
export const setDocument = async <T extends WithFieldValue<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T,
  merge: boolean = true
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Get a single document by ID
 */
export const getDocument = async <T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as T) };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Query documents from a collection
 */
export const getCollection = async <T = DocumentData>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): Promise<(T & { id: string })[]> => {
  try {
    const colRef = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as T),
    }));
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update specific fields of an existing document
 */
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: UpdateData<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Real-time listener for a collection query
 */
export const subscribeToCollection = <T = DocumentData>(
  collectionName: string,
  callback: (data: (T & { id: string })[]) => void,
  ...queryConstraints: QueryConstraint[]
): Unsubscribe => {
  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as T),
      }));
      callback(items);
    },
    (error) => {
      console.error(`Error listening to collection ${collectionName}:`, error);
    }
  );
};

/**
 * Real-time listener for a single document
 */
export const subscribeToDocument = <T = DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: (T & { id: string }) | null) => void
): Unsubscribe => {
  const docRef = doc(db, collectionName, docId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...(docSnap.data() as T) });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Error listening to document ${collectionName}/${docId}:`, error);
    }
  );
};
