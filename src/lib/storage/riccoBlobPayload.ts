import type { RiccoImageBlobRecord } from './riccoStoragePort';

export type RiccoStoredImagePayload = Omit<RiccoImageBlobRecord, 'dataUrl'> & {
  blob: Blob;
};

export async function riccoDataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function toRiccoStoredImagePayload(record: RiccoImageBlobRecord): Promise<RiccoStoredImagePayload> {
  const blob = await riccoDataUrlToBlob(record.dataUrl);

  return {
    imageId: record.imageId,
    blob,
    mimeType: record.mimeType,
    sizeBytes: blob.size || record.sizeBytes,
    updatedAt: record.updatedAt
  };
}

export function riccoPayloadToObjectUrlRecord(record: RiccoStoredImagePayload): { record: RiccoImageBlobRecord; objectUrl: string } {
  const objectUrl = URL.createObjectURL(record.blob);

  return {
    objectUrl,
    record: {
      imageId: record.imageId,
      dataUrl: objectUrl,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      updatedAt: record.updatedAt
    }
  };
}

export function revokeRiccoObjectUrls(urls: string[]) {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }
}
