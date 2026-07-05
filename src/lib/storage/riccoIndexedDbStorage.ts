import type { RiccoImageBlobRecord } from './riccoStoragePort';

export const RICCO_INDEXED_DB_NAME = 'ricco-comic-factory-db';
export const RICCO_INDEXED_DB_VERSION = 1;
export const RICCO_IMAGE_BLOB_OBJECT_STORE = 'imageBlobs';

export type RiccoIndexedDbMigrationSummary = {
  available: boolean;
  attempted: number;
  written: number;
  failed: number;
  totalBytes: number;
  message: string;
};

export function isRiccoIndexedDbAvailable(factory: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB) {
  return Boolean(factory?.open);
}

export function summarizeRiccoIndexedDbBlobMigration(input: {
  available: boolean;
  attempted: number;
  written: number;
  totalBytes: number;
}): RiccoIndexedDbMigrationSummary {
  const failed = Math.max(0, input.attempted - input.written);

  return {
    available: input.available,
    attempted: input.attempted,
    written: input.written,
    failed,
    totalBytes: input.totalBytes,
    message: input.available
      ? `${input.written}/${input.attempted} image blob records written to IndexedDB.`
      : 'IndexedDB is not available in this browser context.'
  };
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export function openRiccoIndexedDb(factory: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB): Promise<IDBDatabase> {
  if (!factory) return Promise.reject(new Error('IndexedDB is not available'));

  return new Promise((resolve, reject) => {
    const request = factory.open(RICCO_INDEXED_DB_NAME, RICCO_INDEXED_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RICCO_IMAGE_BLOB_OBJECT_STORE)) {
        db.createObjectStore(RICCO_IMAGE_BLOB_OBJECT_STORE, { keyPath: 'imageId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open Ricco IndexedDB'));
  });
}

export async function writeRiccoImageBlobsToIndexedDb(blobs: RiccoImageBlobRecord[], factory?: IDBFactory): Promise<RiccoIndexedDbMigrationSummary> {
  if (!isRiccoIndexedDbAvailable(factory)) {
    return summarizeRiccoIndexedDbBlobMigration({
      available: false,
      attempted: blobs.length,
      written: 0,
      totalBytes: blobs.reduce((sum, blob) => sum + blob.sizeBytes, 0)
    });
  }

  const db = await openRiccoIndexedDb(factory);

  try {
    const transaction = db.transaction(RICCO_IMAGE_BLOB_OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(RICCO_IMAGE_BLOB_OBJECT_STORE);

    for (const blob of blobs) {
      store.put(blob);
    }

    await transactionToPromise(transaction);

    return summarizeRiccoIndexedDbBlobMigration({
      available: true,
      attempted: blobs.length,
      written: blobs.length,
      totalBytes: blobs.reduce((sum, blob) => sum + blob.sizeBytes, 0)
    });
  } finally {
    db.close();
  }
}

export async function readRiccoImageBlobsFromIndexedDb(factory?: IDBFactory): Promise<RiccoImageBlobRecord[]> {
  if (!isRiccoIndexedDbAvailable(factory)) return [];

  const db = await openRiccoIndexedDb(factory);

  try {
    const transaction = db.transaction(RICCO_IMAGE_BLOB_OBJECT_STORE, 'readonly');
    const store = transaction.objectStore(RICCO_IMAGE_BLOB_OBJECT_STORE);
    const records = await requestToPromise<RiccoImageBlobRecord[]>(store.getAll());
    await transactionToPromise(transaction);
    return records;
  } finally {
    db.close();
  }
}

export async function deleteRiccoImageBlobFromIndexedDb(imageId: string, factory?: IDBFactory) {
  if (!isRiccoIndexedDbAvailable(factory)) return false;

  const db = await openRiccoIndexedDb(factory);

  try {
    const transaction = db.transaction(RICCO_IMAGE_BLOB_OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(RICCO_IMAGE_BLOB_OBJECT_STORE);
    store.delete(imageId);
    await transactionToPromise(transaction);
    return true;
  } finally {
    db.close();
  }
}

export async function clearRiccoImageBlobsFromIndexedDb(factory?: IDBFactory) {
  if (!isRiccoIndexedDbAvailable(factory)) return false;

  const db = await openRiccoIndexedDb(factory);

  try {
    const transaction = db.transaction(RICCO_IMAGE_BLOB_OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(RICCO_IMAGE_BLOB_OBJECT_STORE);
    store.clear();
    await transactionToPromise(transaction);
    return true;
  } finally {
    db.close();
  }
}
