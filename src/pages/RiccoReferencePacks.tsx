import { useEffect, useMemo, useState } from 'react';
import { riccoCharacters, riccoLocations, riccoSeries } from '../data/riccoStudio';

type ReferenceSubjectType = 'character' | 'location' | 'style';
type ReferenceReviewStatus = 'raw' | 'candidate' | 'approved_reference' | 'needs_redraw' | 'rejected';

type ReferenceAsset = {
  id: string;
  label: string;
  fileName: string;
  purpose: string;
  prompt: string;
};

type ReferencePack = {
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

type ReferenceAssetReview = {
  status: ReferenceReviewStatus;
  imagePath: string;
  notes: string;
  updatedAt: string;
};

type ReferenceReviewState = Record<string, ReferenceAssetReview>;

const REFERENCE_REVIEW_STORAGE_KEY = 'ricco-reference-review-v1';

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

function slugify(value: string) {
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

function isCatCharacter(characterId: string, name: string) {
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

function buildCharacterPacks(): ReferencePack[] {
  return riccoCharacters.map((character, index) => {
    const slug = slugify(character.name);
    const cat = isCatCharacter(character.id, character.name);
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

function buildLocationPacks(): ReferencePack[] {
  return riccoLocations.map((location, index) => {
    const slug = slugify(location.name);

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

function buildStylePack(): ReferencePack {
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

const referencePacks = [...buildCharacterPacks(), ...buildLocationPacks(), buildStylePack()];

function packTypeLabel(type: ReferenceSubjectType) {
  if (type === 'character') return 'Character';
  if (type === 'location') return 'Location';
  return 'Style';
}

function assetStorageKey(pack: ReferencePack, asset: ReferenceAsset) {
  return `${pack.id}::${asset.id}`;
}

function defaultReview(): ReferenceAssetReview {
  return {
    status: 'raw',
    imagePath: '',
    notes: '',
    updatedAt: new Date().toISOString()
  };
}

function readReferenceReviewState(): ReferenceReviewState {
  try {
    const raw = window.localStorage.getItem(REFERENCE_REVIEW_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReferenceReviewState;
  } catch {
    return {};
  }
}

function statusClass(status: ReferenceReviewStatus) {
  if (status === 'approved_reference') return 'status-active';
  if (status === 'rejected') return 'status-rejected';
  if (status === 'needs_redraw') return 'status-needs_fix';
  if (status === 'candidate') return 'status-needs_fix';
  return '';
}

function buildPackCopyText(pack: ReferencePack, reviewState: ReferenceReviewState = {}) {
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
      const review = reviewState[assetStorageKey(pack, asset)] ?? defaultReview();
      return [
        '',
        `## ${asset.label}`,
        `File: ${pack.folder}${asset.fileName}`,
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

function buildAllCopyText(packs: ReferencePack[], reviewState: ReferenceReviewState) {
  return packs.map((pack) => buildPackCopyText(pack, reviewState)).join('\n\n====================\n\n');
}

function buildReferenceReviewReport(packs: ReferencePack[], reviewState: ReferenceReviewState) {
  const lines = ['Ricco Reference Review Report', `Generated: ${new Date().toISOString()}`, ''];

  for (const pack of packs) {
    lines.push(`${packTypeLabel(pack.type).toUpperCase()}: ${pack.title}`);
    lines.push(`Folder: ${pack.folder}`);

    for (const asset of pack.assets) {
      const review = reviewState[assetStorageKey(pack, asset)] ?? defaultReview();
      lines.push(`- ${asset.label}: ${review.status} · ${review.imagePath || `${pack.folder}${asset.fileName}`}`);
      if (review.notes.trim()) lines.push(`  Notes: ${review.notes.trim()}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

function statusOptions(): ReferenceReviewStatus[] {
  return ['raw', 'candidate', 'approved_reference', 'needs_redraw', 'rejected'];
}

export function RiccoReferencePacks() {
  const [filter, setFilter] = useState<ReferenceSubjectType | 'all'>('character');
  const [selectedPackId, setSelectedPackId] = useState(referencePacks[0]?.id ?? '');
  const [copyStatus, setCopyStatus] = useState('');
  const [reviewState, setReviewState] = useState<ReferenceReviewState>(() => readReferenceReviewState());

  useEffect(() => {
    try {
      window.localStorage.setItem(REFERENCE_REVIEW_STORAGE_KEY, JSON.stringify(reviewState));
    } catch {
      setCopyStatus('Reference Review konnte nicht gespeichert werden');
    }
  }, [reviewState]);

  const filteredPacks = useMemo(() => {
    return referencePacks.filter((pack) => filter === 'all' || pack.type === filter);
  }, [filter]);

  const selectedPack = referencePacks.find((pack) => pack.id === selectedPackId) ?? filteredPacks[0] ?? referencePacks[0];
  const totalAssets = referencePacks.reduce((sum, pack) => sum + pack.assets.length, 0);
  const filteredAssets = filteredPacks.reduce((sum, pack) => sum + pack.assets.length, 0);
  const allAssetKeys = referencePacks.flatMap((pack) => pack.assets.map((asset) => assetStorageKey(pack, asset)));
  const approvedCount = allAssetKeys.filter((key) => reviewState[key]?.status === 'approved_reference').length;
  const candidateCount = allAssetKeys.filter((key) => reviewState[key]?.status === 'candidate').length;
  const needsRedrawCount = allAssetKeys.filter((key) => reviewState[key]?.status === 'needs_redraw').length;
  const rejectedCount = allAssetKeys.filter((key) => reviewState[key]?.status === 'rejected').length;

  async function copyText(text: string, status: string) {
    await navigator.clipboard.writeText(text);
    setCopyStatus(status);
    window.setTimeout(() => setCopyStatus(''), 1600);
  }

  function handleFilter(nextFilter: ReferenceSubjectType | 'all') {
    setFilter(nextFilter);
    const firstPack = referencePacks.find((pack) => nextFilter === 'all' || pack.type === nextFilter);
    if (firstPack) setSelectedPackId(firstPack.id);
  }

  function updateAssetReview(pack: ReferencePack, asset: ReferenceAsset, patch: Partial<ReferenceAssetReview>) {
    const key = assetStorageKey(pack, asset);
    setReviewState((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? defaultReview()),
        ...patch,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function resetReferenceReview() {
    const ok = window.confirm('Alle Reference-Pack-Review-Status im Browser löschen?');
    if (!ok) return;

    setReviewState({});
    window.localStorage.removeItem(REFERENCE_REVIEW_STORAGE_KEY);
    setCopyStatus('Reference Review zurückgesetzt');
    window.setTimeout(() => setCopyStatus(''), 1600);
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Reference Packs v0.2</p>
        <h2>Figuren, Locations und Style stabilisieren</h2>
        <p className="body-copy">
          Bevor LoRA, API-Batch oder echte Serienproduktion Sinn machen, brauchen Ricco, Basti, Jule, Don Miau und die Hauptlocations stabile Referenzbilder. Diese Seite macht daraus einen Produktionsplan mit Dateinamen, Prompts, Review-Status und lokalen Notizen.
        </p>
        <div className="chips">
          <span>{referencePacks.length} Packs</span>
          <span>{totalAssets} Referenz-Assets</span>
          <span>{approvedCount} approved</span>
          <span>{candidateCount} candidates</span>
          <span>{needsRedrawCount} redraw</span>
          <span>{rejectedCount} rejected</span>
          <span>{filteredPacks.length} gefiltert</span>
          <span>{filteredAssets} Assets gefiltert</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={() => copyText(buildPackCopyText(selectedPack, reviewState), `${selectedPack.title} kopiert`)}>Ausgewähltes Pack kopieren</button>
          <button className="ghost-button" onClick={() => copyText(buildAllCopyText(referencePacks, reviewState), 'Alle Reference Packs kopiert')}>Alle Packs kopieren</button>
          <button className="ghost-button" onClick={() => copyText(buildReferenceReviewReport(referencePacks, reviewState), 'Reference Review Report kopiert')}>Review Report kopieren</button>
          <button className="ghost-button" onClick={resetReferenceReview}>Review Reset</button>
          <a className="ghost-link" href="#/ricco-studio">Ricco Studio</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review</a>
        </div>
      </div>

      <div className="grid three-col">
        <button className={filter === 'character' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('character')}>Characters</button>
        <button className={filter === 'location' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('location')}>Locations</button>
        <button className={filter === 'style' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('style')}>Style</button>
      </div>

      <div className="grid two-col">
        <aside className="card sticky-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Reference Pack</p>
              <h3>{selectedPack.title}</h3>
            </div>
            <span className="status-badge status-needs_fix">Priority {selectedPack.priority}</span>
          </div>

          <label>Pack auswählen</label>
          <select value={selectedPack.id} onChange={(event) => setSelectedPackId(event.target.value)}>
            {filteredPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>{packTypeLabel(pack.type)} · {pack.title}</option>
            ))}
          </select>

          <div className="dialogue-box">
            <p className="eyebrow">Folder</p>
            <p>{selectedPack.folder}</p>
          </div>

          <div className="dialogue-box">
            <p className="eyebrow">Must Keep</p>
            <ul>
              {selectedPack.mustKeep.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>

          <div className="dialogue-box">
            <p className="eyebrow">Forbidden Drift</p>
            <ul>
              {selectedPack.forbidden.slice(0, 10).map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>
        </aside>

        <div className="page-stack compact-stack">
          <section className="card rule-card">
            <p className="eyebrow">Review Rule</p>
            <h3>Erst approve, dann weiter</h3>
            <ul>
              <li>Keine Sprechblasen im Bild.</li>
              <li>Kein lesbarer Text, keine Fake-Buchstaben, kein Wasserzeichen.</li>
              <li>Figur/Location muss klar wiedererkennbar sein.</li>
              <li>Stil muss gritty adult cartoon bleiben, nicht Anime/Pixar/Influencer.</li>
              <li>Nur approved_reference darf später in Dataset/LoRA wandern.</li>
            </ul>
          </section>

          {selectedPack.assets.map((asset) => {
            const reviewKey = assetStorageKey(selectedPack, asset);
            const review = reviewState[reviewKey] ?? defaultReview();
            const expectedPath = `${selectedPack.folder}${asset.fileName}`;

            return (
              <article className="card prompt-card" key={asset.id}>
                <div className="card-header">
                  <div>
                    <p className="eyebrow">{packTypeLabel(selectedPack.type)} Asset</p>
                    <h3>{asset.label}</h3>
                  </div>
                  <span className={`status-badge ${statusClass(review.status)}`}>{review.status}</span>
                </div>

                <div className="shot-meta">
                  <span>{asset.fileName}</span>
                  <span>{selectedPack.folder}</span>
                </div>

                <div className="dialogue-box">
                  <p className="eyebrow">Purpose</p>
                  <p>{asset.purpose}</p>
                </div>

                <div className="grid two-col">
                  <div>
                    <label>Review Status</label>
                    <select value={review.status} onChange={(event) => updateAssetReview(selectedPack, asset, { status: event.target.value as ReferenceReviewStatus })}>
                      {statusOptions().map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>

                  <div>
                    <label>Expected File Path</label>
                    <input readOnly value={expectedPath} />
                  </div>
                </div>

                <div>
                  <label>Actual Image Path optional</label>
                  <input
                    value={review.imagePath}
                    onChange={(event) => updateAssetReview(selectedPack, asset, { imagePath: event.target.value })}
                    placeholder={expectedPath}
                  />
                </div>

                <div>
                  <label>Review Notes</label>
                  <textarea
                    value={review.notes}
                    onChange={(event) => updateAssetReview(selectedPack, asset, { notes: event.target.value })}
                    placeholder="Was stimmt? Was driftet? Warum approved oder rejected?"
                  />
                </div>

                <label>Prompt</label>
                <textarea readOnly value={asset.prompt} />

                <div className="review-actions">
                  <button className="ghost-button" onClick={() => copyText(asset.prompt, `${asset.label} Prompt kopiert`)}>Prompt kopieren</button>
                  <button className="ghost-button" onClick={() => copyText(expectedPath, `${asset.fileName} Pfad kopiert`)}>Dateipfad kopieren</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { imagePath: expectedPath })}>Pfad übernehmen</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { status: 'approved_reference' })}>Approve</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { status: 'needs_redraw' })}>Needs Redraw</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
