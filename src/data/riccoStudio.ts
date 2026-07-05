export type RiccoSeries = {
  id: string;
  title: string;
  logline: string;
  tone: string;
  humorRules: string[];
  visualRules: string[];
  masterStylePrompt: string;
  masterNegativePrompt: string;
  forbiddenStyles: string[];
  status: 'active' | 'archived';
};

export type RiccoCharacter = {
  id: string;
  name: string;
  role: string;
  shortDescription: string;
  personality: string;
  contradiction: string;
  appearance: string;
  outfit: string;
  speechStyle: string;
  typicalLines: string[];
  visualPromptBlock: string;
  continuityRules: string[];
  negativePrompt: string;
  status: 'active' | 'inactive';
};

export type RiccoLocation = {
  id: string;
  name: string;
  role: string;
  description: string;
  atmosphere: string;
  recurringObjects: string[];
  visualPromptBlock: string;
  continuityRules: string[];
  negativePrompt: string;
  status: 'active' | 'inactive';
};

export type RiccoEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  logline: string;
  mainConflict: string;
  characterIds: string[];
  locationIds: string[];
  tone: string;
  panelCount: number;
  status: 'scripted' | 'panels_ready' | 'prompts_ready' | 'images_in_progress' | 'images_selected' | 'exported';
};

export type RiccoPanel = {
  id: string;
  episodeId: string;
  panelNumber: number;
  title: string;
  locationId: string;
  characterIds: string[];
  action: string;
  camera: string;
  mood: string;
  importantDetails: string[];
  dialogue: string;
  status: 'ready_for_prompt' | 'prompt_ready' | 'images_ready' | 'image_selected' | 'done';
};

export type RiccoPromptResult = {
  panelId: string;
  positivePrompt: string;
  negativePrompt: string;
  continuityChecklist: string[];
  dialogueOverlay: string;
  status: 'prompt_ready';
};

export const riccoSeries: RiccoSeries = {
  id: 'series_ricco_im_haus',
  title: 'Ricco im Haus',
  logline:
    'Ein chaotischer Musiker zieht in ein absurdes Berliner Haus und wird von illegaler Miete, Szene-Doppelmoral und Katzen-Gangstern zermürbt.',
  tone: 'Dreckige soziale Satire, komisch, direkt, leicht melancholisch.',
  humorRules: [
    'Jede Folge startet mit einem normalen Alltagsproblem.',
    'Der Humor kommt aus Widersprüchen, Doppelmoral und Überforderung.',
    'Keine billige Random-Comedy. Jede Szene braucht sozialen Druck.',
    'Ricco ist nicht dumm, aber chaotisch und ausweichend.',
    'Basti ist kein klassischer Bösewicht, sondern ein Heuchler, der sich selbst für gut hält.',
    'Die Katzen sagen nichts, wirken aber wie eine organisierte Gang.'
  ],
  visualRules: [
    'Gritty adult cartoon.',
    'Dicke schwarze Konturen.',
    'Matte, dreckige Farben.',
    'Überzeichnete, aber bodenständige Figuren.',
    'Kaputte Berliner Hinterhof-Ästhetik.',
    'Keine Hochglanz-Influencer-Optik.',
    'Keine saubere Kindercomic-Welt.'
  ],
  masterStylePrompt:
    'Gritty adult satirical cartoon set in a run-down Berlin squat house, bold black outlines, exaggerated but grounded character designs, muted dirty urban color palette, expressive faces, imperfect proportions, detailed messy backgrounds, political stickers, graffiti, handwritten notes, lived-in chaos, bittersweet social satire, cinematic comic panel composition, rough urban texture.',
  masterNegativePrompt:
    'photorealistic, hyperrealistic, glossy 3D render, clean corporate illustration, anime, manga, children cartoon, cute mascot, luxury lifestyle, perfect skin, beauty influencer style, sterile modern interior, fantasy armor, superhero costume, over-polished digital art, generic stock image, empty background, symmetrical perfect faces, bright toy-like colors, realistic photo, cinematic live action still, AI influencer look, watermark, signature',
  forbiddenStyles: [
    'Simpsons clone',
    'Hotze clone',
    'Anime',
    'realistic photo',
    'AI influencer look',
    'Disney/Pixar look',
    'clean corporate illustration',
    'luxury lifestyle render'
  ],
  status: 'active'
};

export const riccoCharacters: RiccoCharacter[] = [
  {
    id: 'char_ricco',
    name: 'Ricco',
    role: 'Hauptfigur',
    shortDescription: 'Chaotischer Musiker, neuer Bewohner im Haus, leicht naiv, aber nicht dumm.',
    personality:
      'Kreativ, impulsiv, konfliktscheu, charmant-chaotisch, lebt in Ausreden, will ernst genommen werden.',
    contradiction:
      'Ricco will Freiheit, aber keine Verantwortung. Er will Respekt, verhält sich aber oft unreif.',
    appearance:
      'Ende 20 bis Mitte 30, schlank bis leicht schlaksig, müde Augen, leichte Augenringe, dunkler Drei-Tage-Bart, zerzauste dunkle Haare.',
    outfit:
      'Alter Hoodie oder verwaschene Trainingsjacke, dunkle Jogginghose oder lockere Jeans, abgetragene Sneaker, Kopfhörer um den Hals, Handy in der Hand.',
    speechStyle: 'Direkt, umgangssprachlich, leicht straßig, aber nicht künstlich übertrieben.',
    typicalLines: [
      'Bruder, was ist das?',
      'Das war so nicht abgemacht.',
      'Ich brauch nur WLAN und Ruhe.',
      'Ich zahl doch nicht 780 für Schimmel mit Katze.',
      'Das ist nur Übergang.',
      'Ich bin grad in einer kreativen Phase.',
      'Ich geh später ran, das ist meine Mutter.'
    ],
    visualPromptBlock:
      'Chaotic young male musician named Ricco, late 20s to mid 30s, slim slightly lanky body, tired eyes, dark messy hair, light stubble, worn hoodie or old tracksuit jacket, headphones around his neck, cheap backpack, holding a smartphone, expressive confused face, urban adult cartoon character, grounded but exaggerated design.',
    continuityRules: [
      'headphones around neck',
      'tired eyes',
      'messy dark hair',
      'light stubble',
      'worn hoodie or old tracksuit jacket',
      'slightly overwhelmed posture',
      'never polished',
      'never rich-looking'
    ],
    negativePrompt:
      'realistic photo, luxury fashion, clean office look, superhero body, perfect skin, glossy influencer style, childish cute mascot style, anime schoolboy, elegant businessman, police uniform, rich lifestyle, hyperrealistic render',
    status: 'active'
  },
  {
    id: 'char_basti',
    name: 'Basti Prenzl',
    role: 'Illegaler Vermieter / Ex-Hausbesetzer',
    shortDescription:
      'Ehemaliger Hardcore-Linker, heute gentrifizierter Heuchler mit E-Bike, Jutebeutel und illegaler Mieteinnahme.',
    personality:
      'Pseudo-moralisch, weich redend, manipulativ, konfliktscheu bei Verantwortung, sehr gut im Rechtfertigen.',
    contradiction:
      'Basti ist gegen Kapitalismus, lebt aber von illegaler Miete. Er hasst Gentrifizierung, ist aber selbst gentrifiziert.',
    appearance:
      'Mitte 40, leicht ergraut, grauer Dutt oder dünner Haaransatz, kurzer gepflegter Bart, runde Brille, moralisches Dauerlächeln.',
    outfit:
      'Teure Outdoorjacke, schlichtes Bio-Shirt oder Merino-Pulli, saubere Sneaker, Jutebeutel, Coffee-to-go-Becher, E-Bike-Schlüssel.',
    speechStyle: 'Weich, politisch, indirekt, manipulativ. Klingt nie wie ein Betrüger.',
    typicalLines: [
      'Ich verstehe deinen Impuls.',
      'Wir müssen Wohnraum neu denken.',
      'Das ist kein Mietverhältnis.',
      'Ich nehme da keinen Profit raus.',
      'Das deckt nur meine emotionale Altlast.',
      'Bar wäre am unkompliziertesten.',
      'Die 780 sind eigentlich noch solidarisch gedacht.'
    ],
    visualPromptBlock:
      'Middle-aged former left-wing squatter turned gentrified landlord named Basti Prenzl, mid 40s, round glasses, grey tied-back hair or receding hairline, short neat beard, expensive outdoor jacket, clean sneakers, tote bag with political slogan, coffee-to-go cup, soft moral smile, pseudo-empathic expression, satirical hypocrisy.',
    continuityRules: [
      'round glasses',
      'clean outdoor jacket',
      'tote bag',
      'coffee cup or e-bike detail',
      'moral smile',
      'looks cleaner than the house',
      'never aggressive gangster',
      'never CEO suit'
    ],
    negativePrompt:
      'criminal gangster look, rich CEO suit, aggressive villain, homeless punk, military clothes, clean luxury apartment only, hyperrealistic portrait, anime style, superhero body, horror monster',
    status: 'active'
  },
  {
    id: 'char_jule',
    name: 'Jule',
    role: 'Hausaktivistin / Plenum-Machtzentrum',
    shortDescription:
      'Organisiert Plena, Awareness-Zettel, Küchenregeln und macht aus jeder Alltagssituation ein Grundsatzthema.',
    personality:
      'Dauerempört, kontrollierend, intelligent, anstrengend, bequem in ihrer Moral, nutzt Gruppensprache als Machtmittel.',
    contradiction:
      'Jule kämpft gegen Besitzdenken, verteidigt aber ihr Kühlschrankfach wie Privateigentum.',
    appearance:
      'Ende 20 bis Anfang 30, kurzer Pony oder messy Bob, mögliche gefärbte Haarsträhne, Nasenring, kritischer Blick.',
    outfit:
      'Oversized-Pullover, alte Worker-Hose, schwere Boots, Buttons, Patches, Stoffbeutel, Marker oder Klebeband in der Hand.',
    speechStyle: 'Politisierte Alltagssprache. Verpackt Kontrolle als Sensibilität.',
    typicalLines: [
      'Das müssen wir im Plenum besprechen.',
      'Ich finde deine Haltung schwierig.',
      'Das ist gerade kein sicherer Raum.',
      'Bitte reflektier mal deinen Kühlschrankanspruch.',
      'Eigentum an Hummus ist auch Eigentum.',
      'Dein Ton macht hier gerade was mit mir.'
    ],
    visualPromptBlock:
      'Young activist woman named Jule in a chaotic Berlin squat house, late 20s to early 30s, sharp critical eyes, messy bob haircut or short bangs, nose ring, oversized sweater, worker pants, heavy boots, patches and buttons, holding marker and tape, arms crossed, controlling activist body language.',
    continuityRules: [
      'critical eyes',
      'oversized sweater',
      'worker pants',
      'boots',
      'marker, tape or handwritten notes nearby',
      'often near fridge, hallway notes or plenum space',
      'never glamour model',
      'never cute anime girl'
    ],
    negativePrompt:
      'glamour influencer, elegant office woman, fantasy warrior, childish cute girl, anime schoolgirl, luxury fashion model, smiling corporate portrait, hyperrealistic photo, clean modern apartment',
    status: 'active'
  },
  {
    id: 'char_don_miau',
    name: 'Don Miau',
    role: 'Boss der Katzen-Gang',
    shortDescription:
      'Dicke alte Katze, bewegt sich wie ein Mafia-Pate und wirkt wie der heimliche Besitzer des Hauses.',
    personality:
      'Ruhig, dominant, unbeeindruckt, territorial, langsam, würdevoll, bedrohlich ohne aktiv bedrohlich zu sein.',
    contradiction: 'Er ist nur eine Katze, aber alle verhalten sich, als wäre er der echte Vermieter.',
    appearance:
      'Dicke alte Katze, breiter Kopf, halb geschlossene gelbe Augen, kleine Narbe am Ohr, schwerer Körper, struppiges dunkles Fell.',
    outfit: 'Kein Outfit. Optional altes Stoffband oder kaputtes Halsband, aber nicht zu niedlich.',
    speechStyle: 'Spricht nicht. Funktioniert über Blicke, Position und Timing.',
    typicalLines: [],
    visualPromptBlock:
      'Large old gangster-like cat named Don Miau, fat heavy body, broad face, half-closed yellow eyes, small scar on one ear, scruffy dark grey tabby fur, sitting elevated like a mafia boss, calm dominant expression, paw resting on important object, intimidating but funny, not cute.',
    continuityRules: [
      'fat old cat',
      'half-closed yellow eyes',
      'scarred ear',
      'heavy sitting posture',
      'paw on important object',
      'appears like he owns the place',
      'never cute kitten',
      'never fantasy cat'
    ],
    negativePrompt:
      'cute kitten, fantasy cat, magical glowing cat, realistic wildlife photo, anime cat, overly fluffy adorable pet, cartoon mascot, clean luxury pet portrait, horror monster, talking mouth',
    status: 'active'
  }
];

export const riccoLocations: RiccoLocation[] = [
  {
    id: 'loc_haus_fassade',
    name: 'Hausfassade',
    role: 'Außenansicht / Eingang',
    description:
      'Alte Berliner Mietshausfassade mit Rissen, Graffiti, politischen Stickern, kaputten Klingelschildern und Fahrradleichen.',
    atmosphere: 'Dreckig, politisch, bedrohlich-komisch, lebendig, halb kaputt und halb bewohnt.',
    recurringObjects: ['Graffiti', 'politische Sticker', 'alte Plakate', 'kaputte Fahrräder', 'rissige Fassade', 'schmutzige Fenster', 'Katze im Fenster'],
    visualPromptBlock:
      'Run-down occupied Berlin apartment building facade, old cracked walls, graffiti, political stickers, torn posters, broken bicycles chained to railing, dirty windows, chaotic doorbells, lived-in urban decay, gritty Berlin squat atmosphere.',
    continuityRules: ['old Berlin building', 'cracks in facade', 'graffiti and stickers', 'broken bicycles', 'dirty windows', 'political posters', 'never luxury building'],
    negativePrompt:
      'clean modern apartment building, luxury facade, suburban house, futuristic architecture, sterile real estate render, bright cheerful family home',
    status: 'active'
  },
  {
    id: 'loc_riccos_zimmer',
    name: 'Riccos Zimmer',
    role: 'Hauptzimmer / Riccos Rückzugsort',
    description:
      'Winziges, überteuertes Zimmer mit Palettenmatratze, Schimmel, kaputtem Fenster, Kabeln und billigem Musik-Setup.',
    atmosphere: 'Eng, schäbig, überteuert, traurig-komisch, halb Studio und halb Gefängnis.',
    recurringObjects: ['Matratze auf Paletten', 'Laptop', 'Kabel', 'billiges Mikrofon', 'kleine Boxen', 'Schimmel in der Ecke', 'kaputtes Fenster', 'Don Miau auf dem Bett'],
    visualPromptBlock:
      'Tiny overpriced room inside Haus Nr. 13, mattress on wooden pallets, moldy corner, broken window, exposed outlet, cheap chair, laptop, tangled cables, cheap microphone, small speakers, dirty walls, cramped musician bedroom, urban loneliness.',
    continuityRules: ['tiny room', 'pallet mattress', 'moldy corner', 'music gear', 'cheap cables', 'dirty walls', 'never luxury loft', 'never clean studio'],
    negativePrompt:
      'clean modern bedroom, luxury apartment, professional recording studio, bright stylish influencer room, sterile minimalist room, expensive furniture',
    status: 'active'
  },
  {
    id: 'loc_flur',
    name: 'Flur / Treppenhaus',
    role: 'Konfliktzone',
    description:
      'Enges, dunkles Treppenhaus voller Zettel, Sticker, alter Flyer, Schuhe, Gerüche und passiv-aggressiver Hausregeln.',
    atmosphere: 'Überfordernd, eng, sozial unangenehm, voller Regeln und Begegnungen.',
    recurringObjects: ['Zettelwand', 'Hausregeln', 'politische Sticker', 'alte Flyer', 'schiefe Türen', 'Schuhe im Flur', 'gelbliches Treppenhauslicht'],
    visualPromptBlock:
      'Dirty narrow hallway and stairwell inside Haus Nr. 13, cracked walls, political stickers, many handwritten house rules, old flyers, shoes on the floor, crooked doors, bad yellowish stairwell light, cramped social tension.',
    continuityRules: ['narrow hallway', 'handwritten notes', 'political stickers', 'bad yellow light', 'crooked doors', 'shoes and clutter', 'never clean hotel hallway'],
    negativePrompt: 'clean hotel corridor, modern apartment hallway, luxury interior, empty sterile hallway, bright corporate building',
    status: 'active'
  },
  {
    id: 'loc_kueche',
    name: 'Gemeinschaftsküche',
    role: 'Kriegsschauplatz',
    description:
      'Chaotische Hausküche mit dreckigen Pfannen, leeren Hafermilchpackungen, Kühlschrankzetteln, überquellendem Müll und Katzen auf der Arbeitsplatte.',
    atmosphere: 'Sozialer Kampfplatz, laut, dreckig, moralisch aufgeladen und absurd.',
    recurringObjects: ['dreckige Pfannen', 'leere Hafermilch', 'beschriftete Kühlschrankfächer', 'Awareness-Zettel', 'überquellender Müll', 'Mate-Flaschen', 'Katzen auf der Arbeitsplatte'],
    visualPromptBlock:
      'Chaotic communal kitchen inside Berlin squat house, dirty pans, empty oat milk cartons, overflowing trash, labeled fridge shelves, awareness notes on fridge, Mate bottles, cats on counter and sink, open cupboards, social conflict atmosphere.',
    continuityRules: ['dirty pans', 'oat milk cartons', 'fridge notes', 'overflowing trash', 'cats on counter', 'Mate bottles', 'never clean designer kitchen'],
    negativePrompt: 'clean modern kitchen, luxury kitchen island, sterile restaurant kitchen, bright family kitchen, glossy surfaces, expensive appliances',
    status: 'active'
  }
];

export const riccoEpisode: RiccoEpisode = {
  id: 'ep_001',
  episodeNumber: 1,
  title: 'Das Zimmer',
  logline:
    'Ricco zieht in sein neues günstiges Zimmer ein und merkt, dass er nicht in eine solidarische Wohnform geraten ist, sondern in eine sehr teure Absurdität mit politischem Anstrich.',
  mainConflict:
    'Ricco glaubt, ein günstiges Zimmer gefunden zu haben. Basti verkauft ihm die überteuerte illegale Miete als solidarisches Nutzungsverhältnis.',
  characterIds: ['char_ricco', 'char_basti', 'char_jule', 'char_don_miau'],
  locationIds: ['loc_haus_fassade', 'loc_riccos_zimmer', 'loc_flur', 'loc_kueche'],
  tone: 'Satirisch, dreckig, komisch mit leicht traurigem Ende.',
  panelCount: 8,
  status: 'panels_ready'
};

export const riccoPanels: RiccoPanel[] = [
  {
    id: 'panel_001',
    episodeId: 'ep_001',
    panelNumber: 1,
    title: 'Ankunft',
    locationId: 'loc_haus_fassade',
    characterIds: ['char_ricco', 'char_don_miau'],
    action:
      'Ricco steht mit zwei Plastiktüten, Rucksack, Sporttasche und billigem Mikrofonständer vor Haus Nr. 13. Don Miau sitzt im Fenster und starrt ihn an.',
    camera: 'wide shot, slight low angle',
    mood: 'chaotic comedy with suspicious undertone',
    importantDetails: ['broken bicycle', 'political stickers', 'fat cat in upstairs window', 'cheap microphone stand', 'Ricco looks hopeful but unsure'],
    dialogue: 'Ricco: Bruder, endlich was Eigenes.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_002',
    episodeId: 'ep_001',
    panelNumber: 2,
    title: 'Basti erscheint',
    locationId: 'loc_haus_fassade',
    characterIds: ['char_ricco', 'char_basti'],
    action:
      'Basti kommt mit sauberem E-Bike-Outfit, Coffee-to-go und Jutebeutel ins Bild. Ricco steht mit seinen Taschen vor dem Haus.',
    camera: 'medium shot',
    mood: 'social satire',
    importantDetails: ['Basti looks cleaner than the house', 'coffee-to-go cup', 'political tote bag', 'old squat house in background', 'Ricco confused but polite'],
    dialogue:
      'Basti: Ricco, schön, dass du da bist. Wichtig: Das hier ist kein Mietverhältnis.\nRicco: Noch besser. Dann muss ich ja keine Miete zahlen.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_003',
    episodeId: 'ep_001',
    panelNumber: 3,
    title: 'Solidarische Nutzungsgebühr',
    locationId: 'loc_flur',
    characterIds: ['char_ricco', 'char_basti'],
    action:
      'Basti hält Ricco einen zerknitterten informellen Zettel hin. Ricco liest ihn und merkt, dass das Zimmer 780 warm kosten soll.',
    camera: 'close-up',
    mood: 'sharp social satire',
    importantDetails: ['crumpled agreement paper', 'Ricco offended confusion', 'Basti moral smile', 'dirty hallway notes in background', 'cash deal feeling'],
    dialogue:
      'Ricco: 780? Für ein Zimmer?\nBasti: Nicht Zimmer. Raum.\nRicco: Was ist der Unterschied?\nBasti: Zimmer klingt bürgerlich.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_004',
    episodeId: 'ep_001',
    panelNumber: 4,
    title: 'Das Zimmer',
    locationId: 'loc_riccos_zimmer',
    characterIds: ['char_ricco', 'char_basti', 'char_don_miau'],
    action:
      'Ricco steht in seinem winzigen neuen Zimmer. Basti erklärt es schön. Don Miau sitzt bereits auf der Palettenmatratze.',
    camera: 'wide angle interior shot',
    mood: 'overwhelmed comedy',
    importantDetails: ['tiny room', 'mold in corner', 'broken window', 'pallet mattress', 'exposed outlet', 'cat owns the mattress'],
    dialogue:
      'Ricco: Das ist ja kleiner als auf den Fotos.\nBasti: Die Fotos waren symbolisch.\nRicco: Symbolisch wofür?\nBasti: Wohnraumknappheit.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_005',
    episodeId: 'ep_001',
    panelNumber: 5,
    title: 'Mama ruft an',
    locationId: 'loc_riccos_zimmer',
    characterIds: ['char_ricco', 'char_basti', 'char_don_miau'],
    action:
      'Riccos Handy klingelt. Seine Mutter ruft an. Ricco drückt den Anruf weg, während Basti ihn pseudo-empathisch beobachtet. Don Miau kratzt an Riccos Tasche.',
    camera: 'close-up on phone and Riccos hand',
    mood: 'bittersweet awkward comedy',
    importantDetails: ['phone call from mother without readable text', 'Ricco rejects call', 'Basti fake empathy', 'cat scratching bag', 'Ricco guilty face'],
    dialogue:
      'Basti: Familie ist wichtig.\nRicco: Ja, deswegen geh ich später ran.\nBasti: Später ist oft ein kapitalistisches Konzept.\nRicco: Was?',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_006',
    episodeId: 'ep_001',
    panelNumber: 6,
    title: 'Hausregeln',
    locationId: 'loc_flur',
    characterIds: ['char_ricco', 'char_basti'],
    action:
      'Basti zeigt Ricco eine Wand voller widersprüchlicher Hausregeln. Ricco liest alles und wird sichtbar müder.',
    camera: 'medium wide shot',
    mood: 'overwhelmed social satire',
    importantDetails: ['wall full of handwritten rules', 'contradictory notes', 'cat paw signature on one note', 'Ricco visibly tired', 'Basti calm and explaining'],
    dialogue: 'Ricco: Muss ich mir das alles merken?\nBasti: Nein. Du musst es fühlen.\nRicco: Ich fühl grad Schimmel.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_007',
    episodeId: 'ep_001',
    panelNumber: 7,
    title: 'Die Küche',
    locationId: 'loc_kueche',
    characterIds: ['char_ricco', 'char_basti', 'char_jule', 'char_don_miau'],
    action:
      'Ricco und Basti stehen in der chaotischen Gemeinschaftsküche. Jule klebt einen Awareness-Zettel an den Kühlschrank. Don Miau sitzt auf der Arbeitsplatte.',
    camera: 'wide shot with many background details',
    mood: 'chaotic social comedy',
    importantDetails: ['dirty pans', 'empty oat milk cartons', 'overflowing trash', 'fridge notes', 'Jule with marker and tape', 'Ricco clutching grocery bag', 'cats on counter'],
    dialogue:
      'Jule: Du bist der Neue? Wichtig: Alles hier ist gemeinschaftlich.\nRicco: Auch mein Essen?\nJule: Kommt auf deinen Klassenhintergrund an.',
    status: 'ready_for_prompt'
  },
  {
    id: 'panel_008',
    episodeId: 'ep_001',
    panelNumber: 8,
    title: 'Mietrealität',
    locationId: 'loc_riccos_zimmer',
    characterIds: ['char_ricco', 'char_don_miau', 'char_basti'],
    action:
      'Ricco sitzt abends allein auf seiner Palettenmatratze, hält den Mietzettel in der Hand und sieht verpasste Anrufe seiner Mutter. Don Miau legt die Pfote auf den Zettel. Basti fährt draußen auf seinem E-Bike weg.',
    camera: 'medium wide shot',
    mood: 'bittersweet social satire',
    importantDetails: ['dim room', 'phone glow', 'missed calls from mother without readable text', 'cat paw on rent note', 'Basti riding away outside window', 'moldy corner', 'cheap music gear'],
    dialogue:
      'Ricco: Okay. Nur Übergang.\nAus der Wand: Mach mal leiser, ich produzier grad!\nMama-Sprachnachricht: Ricco, ich wollte nur wissen, ob du gut angekommen bist.',
    status: 'ready_for_prompt'
  }
];

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function joinBlocks(blocks: string[]) {
  return blocks.map((block) => block.trim()).filter(Boolean).join('\n\n');
}

export function buildRiccoPanelPrompt(panelId: string): RiccoPromptResult {
  const panel = riccoPanels.find((item) => item.id === panelId);

  if (!panel) {
    throw new Error(`Panel not found: ${panelId}`);
  }

  const location = riccoLocations.find((item) => item.id === panel.locationId);

  if (!location) {
    throw new Error(`Location not found for panel: ${panelId}`);
  }

  const characters = riccoCharacters.filter((character) => panel.characterIds.includes(character.id));
  const missingCharacters = panel.characterIds.filter((id) => !characters.some((character) => character.id === id));

  if (missingCharacters.length > 0) {
    throw new Error(`Missing characters for panel ${panelId}: ${missingCharacters.join(', ')}`);
  }

  const continuityChecklist = unique([
    ...characters.flatMap((character) => character.continuityRules),
    ...location.continuityRules
  ]);

  const positivePrompt = joinBlocks([
    riccoSeries.masterStylePrompt,
    `Series: ${riccoSeries.title}. Episode ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}. Panel ${panel.panelNumber}: ${panel.title}.`,
    location.visualPromptBlock,
    ...characters.map((character) => character.visualPromptBlock),
    `Panel action: ${panel.action}`,
    `Camera: ${panel.camera}`,
    `Mood: ${panel.mood}`,
    `Important visual details: ${panel.importantDetails.join(', ')}`,
    `Continuity requirements: ${continuityChecklist.join(', ')}`,
    'Comic panel, clear composition, readable silhouettes, strong facial expressions, no speech bubbles, no dialogue text, no random letters, no logos, no watermark.'
  ]);

  const negativePrompt = joinBlocks([
    riccoSeries.masterNegativePrompt,
    ...characters.map((character) => character.negativePrompt),
    location.negativePrompt,
    'bad anatomy, inconsistent character design, different outfit, missing key character features, deformed hands, extra limbs, distorted face, messy unreadable composition, text artifacts, random letters, fake logos, watermark, signature.'
  ]);

  return {
    panelId: panel.id,
    positivePrompt: cleanText(positivePrompt),
    negativePrompt: cleanText(negativePrompt),
    continuityChecklist,
    dialogueOverlay: panel.dialogue,
    status: 'prompt_ready'
  };
}

export function buildAllRiccoPanelPrompts() {
  return riccoPanels.map((panel) => buildRiccoPanelPrompt(panel.id));
}
