import type { Character } from '../types/comic';

export const characters: Character[] = [
  {
    id: 'rico',
    name: 'Rico',
    role: 'Hauptfigur',
    visualDescription:
      'Junger Typ Anfang 20, müde Augen, leicht chaotische Haare, verpeilter Blick, wirkt gleichzeitig hoffnungsvoll und überfordert.',
    clothing:
      'Abgetragener Hoodie, alte Jeans, Sneaker, großer Rucksack, günstige Kopfhörer um den Hals.',
    personality:
      'Naiv, direkt, gutgläubig, aber nicht dumm. Er merkt oft zu spät, dass er gerade verarscht wird.',
    speechStyle:
      'Kurze direkte Sätze, manchmal trocken, manchmal komplett verwirrt.',
    runningGags: [
      'Versteht Abzocke erst, wenn sie schon passiert ist.',
      'Starrt bei absurden Aussagen direkt in die Kamera.',
      "Sagt oft: 'Warte, was?'"
    ],
    relationships: [
      'Wird vom Vermieter ausgenutzt.',
      'Wird von den Görli-Katzen beobachtet und kommentiert.'
    ],
    referenceImages: []
  },
  {
    id: 'vermieter',
    name: 'Der Vermieter',
    role: 'Antagonist / Szene-Heuchler',
    visualDescription:
      'Mann Ende 30 bis Mitte 40, gepflegter Alternativ-Look, teure Brille, Dreitagebart, wirkt wie ein ehemaliger Hausbesetzer, der inzwischen sehr bequem lebt.',
    clothing:
      'Schwarzer Rollkragen oder altes Polit-Shirt unter teurer Jacke, saubere Sneaker, Mate-Flasche in der Hand.',
    personality:
      'Redet radikal links, handelt aber wie ein Immobilienhai. Erkennt seine eigene Doppelmoral nicht.',
    speechStyle:
      'Politische Floskeln, Szene-Sprache, moralisch überhöht, vermeidet klare Begriffe wie Miete oder Vermieter.',
    runningGags: [
      'Nennt Miete nie Miete.',
      'Verwandelt jede Abzocke in einen solidarischen Beitrag.',
      "Sagt Dinge wie: 'Ich besitze nicht, ich ermögliche.'"
    ],
    relationships: [
      'Vermietet Rico ein Zimmer im besetzten Haus.',
      'Wohnt selbst bequem im Prenzlauer Berg.',
      'Wird von anderen Hausbewohnern durchschaut.'
    ],
    referenceImages: []
  },
  {
    id: 'goerli_cats',
    name: 'Görli-Katzen',
    role: 'Kommentierende Nebenfiguren / Straßenchor',
    visualDescription:
      'Gruppe frecher Straßenkatzen mit Gangster-Attitüde. Kleine, schmutzige, aber charismatische Katzen, die wie eine Berliner Straßencrew auftreten.',
    clothing:
      'Keine echte Kleidung, aber kleine visuelle Details wie eingerissenes Ohr, Halsband, Pflaster, zerzaustes Fell.',
    personality:
      'Sarkastisch, abgeklärt, street-smart. Sie durchschauen alles schneller als die Menschen.',
    speechStyle:
      'Kurze harte Kommentare, Berliner Straßenhumor, trocken und absurd.',
    runningGags: [
      'Kommentieren menschliche Dummheit.',
      'Sprechen wie Kleinkriminelle.',
      'Tauchen immer auf, wenn Rico eine schlechte Entscheidung trifft.'
    ],
    relationships: [
      'Beobachten Rico.',
      'Kommentieren den Vermieter.',
      'Funktionieren wie ein griechischer Chor, nur als Katzen-Gang.'
    ],
    referenceImages: []
  }
];
