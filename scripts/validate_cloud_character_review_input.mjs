import { pathToFileURL } from 'node:url';

export const TARGET_NAME = 'Ricco - Charakterdesign Übersicht.png';
export const TOOLING_COMMIT = '19835df9fd3baaaa91d25ef58b2279ecf708e64c';
export const MAX_ASSET_BYTES = 50 * 1024 * 1024;

const fail = (code, detail = '') => {
  throw new Error(`[CLOUD_CHARACTER_REVIEW:${code}]${detail ? ` ${detail}` : ''}`);
};

export function validateTargetName(value) {
  if (value !== TARGET_NAME) fail('TARGET_NAME_MISMATCH');
  return value;
}

export function validateAttachmentUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') fail('ASSET_URL_REQUIRED');
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('ASSET_URL_INVALID');
  }

  if (url.protocol !== 'https:') fail('HTTPS_REQUIRED');
  if (url.hostname !== 'github.com') fail('HOST_NOT_ALLOWED', url.hostname);
  if (url.username || url.password) fail('URL_CREDENTIALS_FORBIDDEN');
  if (url.port) fail('CUSTOM_PORT_FORBIDDEN');
  if (url.search || url.hash) fail('QUERY_OR_FRAGMENT_FORBIDDEN');

  const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  const pattern = new RegExp(`^/user-attachments/assets/${uuid}$`);
  if (!pattern.test(url.pathname)) fail('ATTACHMENT_PATH_NOT_ALLOWED', url.pathname);

  return url.toString();
}

export function validateAssetSize(sizeBytes) {
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) fail('ASSET_EMPTY');
  if (sizeBytes > MAX_ASSET_BYTES) fail('ASSET_TOO_LARGE', String(sizeBytes));
  return sizeBytes;
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) fail('UNKNOWN_ARGUMENT', key);
    const value = argv[index + 1];
    if (value === undefined) fail('ARGUMENT_VALUE_MISSING', key);
    result[key.slice(2)] = value;
    index += 1;
  }
  return result;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const url = validateAttachmentUrl(args.url);
  const targetName = validateTargetName(args['target-name'] || TARGET_NAME);
  console.log(JSON.stringify({
    status: 'CLOUD_CHARACTER_REVIEW_INPUT_VALID',
    url,
    targetName,
    toolingCommit: TOOLING_COMMIT,
    maxAssetBytes: MAX_ASSET_BYTES
  }));
}
