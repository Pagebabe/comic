import { expect, test } from '@playwright/test';
import {
  isRiccoIndexedDbAvailable,
  RICCO_IMAGE_BLOB_OBJECT_STORE,
  RICCO_INDEXED_DB_NAME,
  RICCO_INDEXED_DB_VERSION,
  summarizeRiccoIndexedDbBlobMigration
} from '../../src/lib/storage/riccoIndexedDbStorage';

test('exposes stable IndexedDB constants', () => {
  expect(RICCO_INDEXED_DB_NAME).toBe('ricco-comic-factory-db');
  expect(RICCO_INDEXED_DB_VERSION).toBe(1);
  expect(RICCO_IMAGE_BLOB_OBJECT_STORE).toBe('imageBlobs');
});

test('detects missing IndexedDB factory without throwing', () => {
  expect(isRiccoIndexedDbAvailable(undefined)).toBe(false);
});

test('summarizes unavailable migration', () => {
  const summary = summarizeRiccoIndexedDbBlobMigration({
    available: false,
    attempted: 3,
    written: 0,
    totalBytes: 1234
  });

  expect(summary).toEqual({
    available: false,
    attempted: 3,
    written: 0,
    failed: 3,
    totalBytes: 1234,
    message: 'IndexedDB is not available in this browser context.'
  });
});

test('summarizes successful migration', () => {
  const summary = summarizeRiccoIndexedDbBlobMigration({
    available: true,
    attempted: 4,
    written: 4,
    totalBytes: 2048
  });

  expect(summary).toEqual({
    available: true,
    attempted: 4,
    written: 4,
    failed: 0,
    totalBytes: 2048,
    message: '4/4 image blob records written to IndexedDB.'
  });
});

test('summarizes partial migration', () => {
  const summary = summarizeRiccoIndexedDbBlobMigration({
    available: true,
    attempted: 5,
    written: 3,
    totalBytes: 4096
  });

  expect(summary.failed).toBe(2);
  expect(summary.message).toBe('3/5 image blob records written to IndexedDB.');
});
