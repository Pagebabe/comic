import type { Location } from '../types/comic';

export const locations: Location[] = [
  {
    id: 'haus_nebenwirkung',
    name: 'Haus Nebenwirkung',
    description:
      'Ein angeblich besetztes Haus in Berlin. Außen voller linker Sticker, kaputter Klingeln, Fahrradleichen und politischer Plakate. Innen chaotisch, eng, überteuert und voller Widersprüche.',
    visualRules:
      'Gritty Berlin cartoon look. Alte Wände, Sticker, Graffiti, schiefe Türen, kaputte Lampen, politische Zettel. Der Ort soll rebellisch wirken, aber gleichzeitig absurd kommerzialisiert.',
    recurringDetails: [
      'Sticker: Kapitalismus enteignen',
      'Kaputte Klingelanlage',
      'Handgeschriebene Zettel mit absurden Gebühren',
      'Fahrradleichen im Flur',
      'Mate-Flaschen überall',
      'Schiefe Türen und schlechte Beleuchtung'
    ],
    referenceImages: []
  },
  {
    id: 'prenzlauer_berg_flat',
    name: 'Prenzlauer Berg Wohnung',
    description:
      'Die eigentliche Wohnung des Vermieters. Sanierter Altbau, teure Espressomaschine, Designerlampen, Öko-Wein und politisches Bücherregal.',
    visualRules:
      'Sauber, warm, teuer, bürgerlich. Soll im harten Kontrast zum Haus Nebenwirkung stehen.',
    recurringDetails: [
      'Espressomaschine',
      'Designerlampe',
      'Öko-Wein',
      'Kinderfahrrad im Flur',
      'Regal mit linken Theorie-Büchern',
      'Sehr gepflegte Altbaudielen'
    ],
    referenceImages: []
  },
  {
    id: 'goerlitzer_park',
    name: 'Görlitzer Park',
    description:
      'Absurd überzeichneter Berliner Park als Revier der Görli-Katzen. Dreckig, lebendig, chaotisch, halb realistisch, halb mythisch.',
    visualRules:
      'Urbaner Cartoon-Park mit dunklem Humor. Katzen sitzen auf Mauern, Mülleimern und Parkbänken wie eine kleine Gang.',
    recurringDetails: [
      'Parkbank',
      'Mülleimer',
      'Graffiti',
      'Katzen auf Mauern',
      'Späti-Tüten',
      'Chaotische Berliner Parkstimmung'
    ],
    referenceImages: []
  }
];
