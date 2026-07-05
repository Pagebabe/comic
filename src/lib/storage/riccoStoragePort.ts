import type { RiccoPanelImage } from '../../types/riccoReview';

export const RICCO_IMAGE_METADATA_STORAGE_KEY = 'ricco-image-metadata-v1';
export const RICCO_IMAGE_BLOBS_STORAGE_KEY = 'ricco-image-blobs-v1';

export type BrowserStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type RiccoStoragePort = {
  readText(key: string): string;
  writeText(key: string, value: string): boolean;
  remove(key: string): boolean;
  readJson<T>(key: string, fallback: T): T;
  writeJson<T>(key: string, value: T): boolean;
  estimateBytes(keys: string[]): number;
};

export type RiccoImageDataKind = 'url' | 'local_data_url' | 'blob_ref';

export type RiccoImageBlobRecord = {
  imageId: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
};

export type RiccoImageMetadataRecord = Omit<RiccoPanelImage, 'imageUrl'> & {
  imageUrl: string;
  imageDataKind: RiccoImageDataKind;
  imageDataRef?: string;
};

export type RiccoImageStorageSplit = {
  metadataImages: RiccoImageMetadataRecord[];
  imageBlobs: RiccoImageBlobRecord[];
  summary: {
    totalImages: number;
    urlImages: number;
    localDataUrlImages: number;
    blobRefImages: number;
    blobBytes: number;
  };
};

function safeBlobSize(value: string) {
  try {
    return new Blob([value]).size;
  } catch {
    return value.length;
  }
}

export function createRiccoStoragePort(storage: BrowserStorageLike | null | undefined): RiccoStoragePort {
  function readText(key: string) {
    try {
      return storage?.getItem(key) ?? '';
    } catch {
      return '';
    }
  }

  function writeText(key: string, value: string) {
    try {
      storage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function remove(key: string) {
    try {
      storage?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  return {
    readText,
    writeText,
    remove,
    readJson<T>(key: string, fallback: T): T {
      const raw = readText(key);
      if (!raw) return fallback;

      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },
    writeJson<T>(key: string, value: T) {
      return writeText(key, JSON.stringify(value, null, 2));
    },
    estimateBytes(keys: string[]) {
      return safeBlobSize(keys.map((key) => readText(key)).join(''));
    }
  };
}

export function createBrowserRiccoStoragePort() {
  if (typeof window === 'undefined') return createRiccoStoragePort(null);
  return createRiccoStoragePort(window.localStorage);
}

export function createMemoryStorageLike(seed: Record<string, string> = {}): BrowserStorageLike & { dump: () => Record<string, string> } {
  const store = new Map(Object.entries(seed));

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    }
  };
}

export function isRiccoLocalDataUrl(value: string) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

export function mimeTypeFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  return match?.[1] ?? 'application/octet-stream';
}

export function buildRiccoImageBlobId(imageId: string) {
  return `ricco-image-blob:${imageId}`;
}

export function splitRiccoImageStorage(images: RiccoPanelImage[], updatedAt = new Date().toISOString()): RiccoImageStorageSplit {
  const imageBlobs: RiccoImageBlobRecord[] = [];
  const metadataImages = images.map((image): RiccoImageMetadataRecord => {
    if (!isRiccoLocalDataUrl(image.imageUrl)) {
      return {
        ...image,
        imageDataKind: 'url'
      };
    }

    const imageDataRef = buildRiccoImageBlobId(image.id);
    imageBlobs.push({
      imageId: image.id,
      dataUrl: image.imageUrl,
      mimeType: mimeTypeFromDataUrl(image.imageUrl),
      sizeBytes: safeBlobSize(image.imageUrl),
      updatedAt
    });

    return {
      ...image,
      imageUrl: imageDataRef,
      imageDataKind: 'blob_ref',
      imageDataRef
    };
  });

  return {
    metadataImages,
    imageBlobs,
    summary: {
      totalImages: images.length,
      urlImages: metadataImages.filter((image) => image.imageDataKind === 'url').length,
      localDataUrlImages: imageBlobs.length,
      blobRefImages: metadataImages.filter((image) => image.imageDataKind === 'blob_ref').length,
      blobBytes: imageBlobs.reduce((sum, record) => sum + record.sizeBytes, 0)
    }
  };
}

export function hydrateRiccoImagesFromSplit(metadataImages: RiccoImageMetadataRecord[], imageBlobs: RiccoImageBlobRecord[]): RiccoPanelImage[] {
  const blobById = new Map(imageBlobs.map((blob) => [blob.imageId, blob]));

  return metadataImages.map((metadata): RiccoPanelImage => {
    const blob = metadata.imageDataRef ? blobById.get(metadata.id) : undefined;
    const { imageDataKind, imageDataRef, ...image } = metadata;

    return {
      ...image,
      imageUrl: imageDataKind === 'blob_ref' && blob ? blob.dataUrl : image.imageUrl
    };
  });
}

export function buildRiccoImageStorageReport(split: RiccoImageStorageSplit) {
  return [
    'Ricco Image Storage Split Report',
    `Total images: ${split.summary.totalImages}`,
    `URL images: ${split.summary.urlImages}`,
    `Local data-url images moved to blob records: ${split.summary.localDataUrlImages}`,
    `Blob-ref metadata images: ${split.summary.blobRefImages}`,
    `Blob bytes: ${split.summary.blobBytes}`
  ].join('\n');
}
