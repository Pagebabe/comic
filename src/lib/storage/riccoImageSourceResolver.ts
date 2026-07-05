import type { RiccoPanelImage } from '../../types/riccoReview';
import { isRiccoLocalDataUrl, type RiccoImageBlobRecord, type RiccoImageMetadataRecord } from './riccoStoragePort';

export type RiccoResolvedImageSourceResult = {
  images: RiccoPanelImage[];
  primaryHits: number;
  secondaryHits: number;
  legacyHits: number;
  missingRefs: number;
};

export function resolveRiccoImageSources(input: {
  metadataImages: RiccoImageMetadataRecord[];
  primaryRecords: RiccoImageBlobRecord[];
  secondaryRecords?: RiccoImageBlobRecord[];
  legacyImages?: RiccoPanelImage[];
}): RiccoResolvedImageSourceResult {
  const primaryById = new Map(input.primaryRecords.map((record) => [record.imageId, record]));
  const secondaryById = new Map((input.secondaryRecords ?? []).map((record) => [record.imageId, record]));
  const legacyById = new Map((input.legacyImages ?? []).map((image) => [image.id, image]));
  let primaryHits = 0;
  let secondaryHits = 0;
  let legacyHits = 0;
  let missingRefs = 0;

  const images = input.metadataImages.map((metadata): RiccoPanelImage => {
    const { imageDataKind, imageDataRef, ...image } = metadata;
    if (imageDataKind !== 'blob_ref') return image;

    const primary = primaryById.get(metadata.id);
    if (primary) {
      primaryHits += 1;
      return { ...image, imageUrl: primary.dataUrl };
    }

    const secondary = secondaryById.get(metadata.id);
    if (secondary) {
      secondaryHits += 1;
      return { ...image, imageUrl: secondary.dataUrl };
    }

    const legacy = legacyById.get(metadata.id);
    if (legacy && isRiccoLocalDataUrl(legacy.imageUrl)) {
      legacyHits += 1;
      return { ...image, imageUrl: legacy.imageUrl };
    }

    missingRefs += 1;
    return image;
  });

  return { images, primaryHits, secondaryHits, legacyHits, missingRefs };
}
