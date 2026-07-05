import { riccoCharacters, riccoLocations, riccoSeries } from '../../data/riccoStudio';
import type { ReferenceAssetReview, ReferenceReviewState, ReferenceReviewStatus } from '../../types/riccoReferenceReview';

export type ReferenceSubjectType = 'character' | 'location' | 'style';

export type ReferenceAsset = {
  id: string;
  label: string;
  fileName: string;
  purpose: string;
  prompt: string;
};

export type ReferencePack = {
  id: string;
  type: ReferenceSubjectType;
  title: string;
  subtitle: string;
  priority: number;
  folder: string;
  mustKeep: string[];
  forbidden: string[];
  assets: ReferenceAsset[];
};

export const REFERENCE_REVIEW_STATUS_OPTIONS: ReferenceReviewStatus[] = [
  'raw',
  'candidate',
  'approved_reference',
  'needs_redraw',
  'rejected'
];

const STYLE_NEGATIVE = [
  'photorealistic',
  'hyperrealistic',
  'glossy 3D render',
  'anime',
  'manga',
  'children cartoon',
  'cute mascot',
  'Disney Pixar look',
  'corporate illustration',
  'luxury influencer look',
  'clean stock image',
  'watermark',
  'signature',
  'readable text',
  'speech bubble',
  'random letters'
].join(', ');

const HUMAN_ASSET_TEMPLATES = [
  { label: 'Front View', fileName: 'front_v1.png', purpose: 'Identity lock: full body, face, outfit, silhouette.' },
  { label: 'Side View', fileName: 'side_v1.png', purpose: 'Turnaround lock: profile, posture, body shape.' },
  { label: 'Back View', fileName: 'back_v1.png', purpose: 'Outfit and silhouette from behind.' },
  { label: 'Neutral Face', fileName: 'expression_neutral_v1.png', purpose: 'Default face for continuity.' },
  { label: 'Confused Face', fileName: 'expression_confused_v1.png', purpose: 'Comedy reaction / overwhelmed beat.' },
  { label: 'Angry Face', fileName: 'expression_angry_v1.png', purpose: 'Conflict reaction without changing identity.' },
  { label: 'Stress Pose', fileName: 'pose_stress_v1.png', purpose: 'Production pose for tense panels.' },
  { label: 'Negative Examples', fileName: 'negative_examples_v1.png', purpose: 'What this character must never drift into.' },
  { label: 'Contact Sheet', fileName: 'reference_contact_sheet_v1.png', purpose: 'Approved overview for later LoRA/dataset use.' }
];

const CAT_ASSET_TEMPLATES = [
  { label: 'Front Sitting', fileName: 'front_sitting_v1.png', purpose: 'Boss identity: face, body mass, posture.' },
  { label: 'Side Sitting', fileName: 'side_sitting_v1.png', purpose: 'Body shape and silhouette lock.' },
  { label: 'Walking', fileName: 'walking_v1.png', purpose: 'Movement reference without cuteness drift.' },
  { label: 'Boss Face', fileName: 'face_boss_v1.png', purpose: 'Close-up expression for intimidation/comedy timing.' },
  { label: 'Paw On Object', fileName: 'paw_on_object_v1.png', purpose: 'Recurring mafia-boss staging detail.' },
  { label: 'Negative Examples', fileName: 'negative_examples_v1.png', purpose: 'Reject cute kitten / fantasy cat drift.' },
  { label: 'Contact Sheet', fileName: 'reference_contact_sheet_v1.png', purpose: 'Approved overview for later LoRA/dataset use.' }
];

const LOCATION_ASSET_TEMPLATES = [
  { label: 'Wide Shot', fileName: 'wide_v1.png', purpose: 'Main layout and spatial continuity.' },
  { label: 'Detail Shot', fileName: 'detail_v1.png', purpose: 'Texture, props and recurring grime.' },
  { label: 'Prop Sheet', fileName: 'prop_sheet_v1.png', purpose: 'Reusable objects and continuity markers.' },
  { label: 'Lighting Rule', fileName: 'lighting_v1.png', purpose: 'Color temperature, shadows and mood.' },
  { label: 'Negative Examples', fileName: 'negative_examples_v1.png', purpose: 'What the location must never drift into.' },
  { label: 'Contact Sheet', fileName: 'reference_contact_sheet_v1.png', purpose: 'Approved overview for later prompt/ControlNet use.' }
];

export function slugifyReferenceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isCatReferenceCharacter(characterId: string, name: string) {
  return characterId.toLowerCase().includes('miau') || name.toLowerCase().includes('miau');
}

function buildHumanPrompt(characterName: string, visualPrompt: string, label: string) {
  return [
    'Gritty adult satirical cartoon character reference sheet.',
    `${label} of ${characterName}.`,
    visualPrompt,
    'Plain neutral background, full body where applicable, readable silhouette, consistent outfit, consistent face, bold black outlines, muted dirty Berlin urban color palette.',
    'No speech bubbles, no readable text, no watermark, no signature.',
    `Negative: ${STYLE_NEGATIVE}`
  ].join(' ');
}

function buildCatPrompt(characterName: string, visualPrompt: string, label: string) {
  return [
    'Gritty adult satirical cartoon animal character reference sheet.',
    `${label} of ${characterName}.`,
    visualPrompt,
    'Plain neutral background, boss-like stillness, readable silhouette, bold black outlines, muted dirty Berlin urban color palette.',
    'No speech bubbles, no readable text, no watermark, no signature.',
    `Negative: cute kitten, fantasy cat, magical glowing cat, realistic wildlife photo, anime cat, fluffy adorable pet, cartoon mascot, clean luxury pet portrait, horror monster, talking mouth, ${STYLE_NEGATIVE}`
  ].join(' ');
}

function buildLocationPrompt(locationName: string, visualPrompt: string, label: string) {
  return [
    'Gritty adult satirical cartoon location reference sheet.',
    `${label} for ${locationName}.`,
    visualPrompt,
    'Readable layout, recurring objects visible, bold black outlines, muted dirty Berlin urban color palette, lived-in chaos.',
    'No speech bubbles, no readable text, no watermark, no signature.',
    `Negative: luxury interior, clean designer room, sterile modern architecture, corporate illustration, glossy 3D render, photorealistic photo, anime background, ${STYLE_NEGATIVE}`
  ].join(' ');
}

export function buildRiccoCharacterReferencePacks(): ReferencePack[] {
  return riccoCharacters.map((character, index) => {
    const slug = slugifyReferenceName(character.name);
    const cat = isCatReferenceCharacter(character.id, character.name);
    const templates = cat ? CAT_ASSET_TEMPLATES : HUMAN_ASSET_TEMPLATES;
    const promptBuilder = cat ? buildCatPrompt : buildHumanPrompt;

    return {
      id: character.id,
      type: 'character',
      title: character.name,
      subtitle: character.role,
      priority: index + 1,
      folder: `public/references/characters/${slug}/`,
      mustKeep: character.continuityRules,
      forbidden: [character.negativePrompt, 'No speech bubbles', 'No readable text', 'No random letters', 'No watermark'].filter(Boolean),
      assets: templates.map((template) => ({
        id: `${character.id}_${template.fileName}`,
        label: template.label,
        fileName: template.fileName,
        purpose: template.purpose,
        prompt: promptBuilder(character.name, character.visualPromptBlock, template.label)
      }))
    };
  });
}

export function buildRiccoLocationReferencePacks(): ReferencePack[] {
  return riccoLocations.map((location, index) => {
    const slug = slugifyReferenceName(location.name);

    return {
      id: location.id,
      type: 'location',
      title: location.name,
      subtitle: location.atmosphere,
      priority: index + 1,
      folder: `public/references/locations/${slug}/`,
      mustKeep: location.continuityRules,
      forbidden: [location.negativePrompt, 'No speech bubbles', 'No readable text', 'No random letters', 'No watermark'].filter(Boolean),
      assets: LOCATION_ASSET_TEMPLATES.map((template) => ({
        id: `${location.id}_${template.fileName}`,
        label: template.label,
        fileName: template.fileName,
        purpose: template.purpose,
        prompt: buildLocationPrompt(location.name, location.visualPromptBlock, template.label)
      }))
    };
  });
}

export function buildRiccoStyleReferencePack(): ReferencePack {
  return {
    id: 'style_ricco_gritty_cartoon',
    type: 'style',
    title: 'Ricco Gritty Cartoon Style',
    subtitle: 'Series-wide visual style lock',
    priority: 99,
    folder: 'public/references/style/ricco-gritty-cartoon/',
    mustKeep: [
      'bold black outlines',
      'muted dirty Berlin urban palette',
      'exaggerated but grounded character designs',
      'messy lived-in backgrounds',
      'political stickers and graffiti without readable text',
      'adult satirical cartoon tone',
      'no speech bubbles inside generated images'
    ],
    forbidden: STYLE_NEGATIVE.split(', '),
    assets: [
      {
        id: 'style_sheet_v1',
        label: 'Master Style Sheet',
        fileName: 'master_style_sheet_v1.png',
        purpose: 'Series-wide look reference before any LoRA/style training.',
        prompt: [
          'Gritty adult satirical cartoon master style sheet for Ricco im Haus.',
          riccoSeries.masterStylePrompt,
          'Show a small set of non-specific sample figures, run-down Berlin hallway, dirty kitchen corner, cracked facade details, bold black outlines, muted dirty color palette, rough urban texture.',
          'No speech bubbles, no readable text, no watermark, no signature.',
          `Negative: ${STYLE_NEGATIVE}`
        ].join(' ')
      },
      {
        id: 'style_negative_examples_v1',
        label: 'Style Negative Examples',
        fileName: 'negative_examples_v1.png',
        purpose: 'Visual rejection guide for anime/Pixar/gloss/AI influencer drift.',
        prompt: [
          'Reference sheet showing wrong visual directions to reject for Ricco im Haus, arranged as abstract non-branded comparison thumbnails.',
          'Include wrong directions: glossy 3D, photorealistic, anime, children cartoon, luxury influencer, corporate vector, sterile modern interior.',
          'No readable text labels, no logos, no watermark, no speech bubbles.'
        ].join(' ')
      }
    ]
  };
}

export function buildRiccoReferencePacks(): ReferencePack[] {
  return [
    ...buildRiccoCharacterReferencePacks(),
    ...buildRiccoLocationReferencePacks(),
    buildRiccoStyleReferencePack()
  ];
}

export const riccoReferencePacks = buildRiccoReferencePacks();

export function packTypeLabel(type: ReferenceSubjectType) {
  if (type === 'character') return 'Character';
  if (type === 'location') return 'Location';
  return 'Style';
}

export function assetStorageKey(pack: ReferencePack, asset: ReferenceAsset) {
  return `${pack.id}::${asset.id}`;
}

export function expectedReferenceAssetPath(pack: ReferencePack, asset: ReferenceAsset) {
  return `${pack.folder}${asset.fileName}`;
}

export function defaultReferenceAssetReview(now = new Date().toISOString()): ReferenceAssetReview {
  return {
    status: 'raw',
    imagePath: '',
    notes: '',
    updatedAt: now
  };
}

export function getReferenceAssetReview(reviewState: ReferenceReviewState, pack: ReferencePack, asset: ReferenceAsset) {
  return reviewState[assetStorageKey(pack, asset)] ?? defaultReferenceAssetReview();
}

export function referenceStatusClass(status: ReferenceReviewStatus) {
  if (status === 'approved_reference') return 'status-active';
  if (status === 'rejected') return 'status-rejected';
  if (status === 'needs_redraw') return 'status-needs_fix';
  if (status === 'candidate') return 'status-needs_fix';
  return '';
}

export function buildPackCopyText(pack: ReferencePack, reviewState: ReferenceReviewState = {}) {
  return [
    `${packTypeLabel(pack.type).toUpperCase()} REFERENCE PACK: ${pack.title}`,
    `Folder: ${pack.folder}`,
    `Priority: ${pack.priority}`,
    '',
    'MUST KEEP:',
    ...pack.mustKeep.map((rule) => `- ${rule}`),
    '',
    'FORBIDDEN:',
    ...pack.forbidden.map((rule) => `- ${rule}`),
    '',
    'ASSETS:',
    ...pack.assets.flatMap((asset) => {
      const review = getReferenceAssetReview(reviewState, pack, asset);
      return [
        '',
        `## ${asset.label}`,
        `File: ${expectedReferenceAssetPath(pack, asset)}`,
        `Status: ${review.status}`,
        `Image Path: ${review.imagePath || '-'}`,
        `Notes: ${review.notes || '-'}`,
        `Purpose: ${asset.purpose}`,
        'Prompt:',
        asset.prompt
      ];
    })
  ].join('\n');
}

export function buildAllReferencePacksCopyText(packs: ReferencePack[], reviewState: ReferenceReviewState) {
  return packs.map((pack) => buildPackCopyText(pack, reviewState)).join('\n\n====================\n\n');
}

export function buildReferenceReviewReport(packs: ReferencePack[], reviewState: ReferenceReviewState, generatedAt = new Date().toISOString()) {
  const lines = ['Ricco Reference Review Report', `Generated: ${generatedAt}`, ''];

  for (const pack of packs) {
    lines.push(`${packTypeLabel(pack.type).toUpperCase()}: ${pack.title}`);
    lines.push(`Folder: ${pack.folder}`);

    for (const asset of pack.assets) {
      const review = getReferenceAssetReview(reviewState, pack, asset);
      lines.push(`- ${asset.label}: ${review.status} · ${review.imagePath || expectedReferenceAssetPath(pack, asset)}`);
      if (review.notes.trim()) lines.push(`  Notes: ${review.notes.trim()}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

export function filterReferencePacks(packs: ReferencePack[], filter: ReferenceSubjectType | 'all') {
  return packs.filter((pack) => filter === 'all' || pack.type === filter);
}

export function countReferenceAssets(packs: ReferencePack[]) {
  return packs.reduce((sum, pack) => sum + pack.assets.length, 0);
}
