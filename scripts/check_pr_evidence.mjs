import { pathToFileURL } from 'node:url';

export const requiredSections = [
  'Behauptung',
  'Quelle',
  'Test',
  'Artefakt',
  'Deployment oder Laufbeweis',
  'Sichtprüfung',
  'Aktueller Status',
  'Nicht behauptet',
  'Repository-Scope',
  'Pflichtbestätigungen'
];

export const requiredConfirmations = [
  'Scope auf `Pagebabe/comic` begrenzt',
  'Canon und autorisierende Quelle geprüft',
  'Regressionstest oder begründete Nichtanwendbarkeit dokumentiert',
  'Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe',
  'Nicht behauptete Ergebnisse ausdrücklich benannt',
  'Sichtprüfung oder verbindlicher Prüfplan vorhanden'
];

const allowedStatuses = new Set([
  'PENDING_DEPLOY',
  'PROVEN',
  'DISPROVEN',
  'NOT_YET_BUILT',
  'HISTORICALLY_UNVERIFIABLE',
  'SUPERSEDED'
]);

const templateBoilerplate = [
  'Beschreibe exakt, was dieser Pull Request',
  'Nenne Canon-Datei, Vertrag, Issue',
  'Nenne die ausführbaren Tests',
  'Nenne die erzeugten oder veränderten Dateien',
  'Nenne Workflow, lokales reproduzierbares Kommando',
  'Beschreibe, was sichtbar oder menschlich geprüft wurde',
  'Liste ausdrücklich auf, was durch diesen Pull Request nicht fertig'
];

const sectionMap = (body) => {
  const matches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  const sections = new Map();
  for (let index = 0; index < matches.length; index += 1) {
    const title = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : body.length;
    sections.set(title, body.slice(start, end).trim());
  }
  return sections;
};

export const validatePullRequestBody = (body) => {
  const errors = [];
  if (!body || !body.trim()) throw new Error('Pull request body is empty. Evidence packet required.');

  const sections = sectionMap(body);
  for (const title of requiredSections) {
    if (!sections.has(title)) {
      errors.push(`Missing section: ${title}`);
      continue;
    }
    const value = sections.get(title);
    if (value.length < 12) errors.push(`Section is too short to be evidence: ${title}`);
  }

  for (const boilerplate of templateBoilerplate) {
    if (body.includes(boilerplate)) errors.push(`Template boilerplate was not replaced: ${boilerplate}`);
  }

  const statusText = sections.get('Aktueller Status') || '';
  const status = [...allowedStatuses].find((candidate) => statusText.toUpperCase().includes(candidate));
  if (!status) errors.push(`Aktueller Status must contain one of: ${[...allowedStatuses].join(', ')}`);

  const scope = sections.get('Repository-Scope') || '';
  if (!scope.includes('Pagebabe/comic')) errors.push('Repository-Scope must explicitly name Pagebabe/comic.');

  const confirmations = sections.get('Pflichtbestätigungen') || '';
  for (const confirmation of requiredConfirmations) {
    const checked = new RegExp(`^- \\[x\\] ${confirmation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'mi').test(confirmations);
    if (!checked) errors.push(`Unchecked or missing confirmation: ${confirmation}`);
  }

  const nonClaims = sections.get('Nicht behauptet') || '';
  if (!/(nicht|keine|kein|0\/)/i.test(nonClaims)) errors.push('Nicht behauptet must explicitly name excluded or unfinished outcomes.');

  if (status === 'PENDING_DEPLOY') {
    const deployment = sections.get('Deployment oder Laufbeweis') || '';
    const visible = sections.get('Sichtprüfung') || '';
    if (!/(deploy|workflow|run|artifact|pages|preview|kommando)/i.test(deployment)) errors.push('PENDING_DEPLOY requires a concrete deployment or execution plan.');
    if (!/(prüf|review|screenshot|sicht|gegenprüfung)/i.test(visible)) errors.push('PENDING_DEPLOY requires a concrete visible countercheck plan.');
  }

  if (errors.length) throw new Error(`Evidence packet invalid:\n- ${errors.join('\n- ')}`);
  return { status: 'pass', repository: 'Pagebabe/comic', currentStatus: status, sections: requiredSections.length };
};

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const result = validatePullRequestBody(process.env.PR_BODY || '');
  console.log(JSON.stringify(result));
}
