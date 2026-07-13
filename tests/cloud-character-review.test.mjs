import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_ASSET_BYTES,
  TARGET_NAME,
  TOOLING_COMMIT,
  validateAssetSize,
  validateAttachmentUrl,
  validateTargetName
} from '../scripts/validate_cloud_character_review_input.mjs';

const validUrl = 'https://github.com/user-attachments/assets/123e4567-e89b-12d3-a456-426614174000';

const rejects = (fn, code) => assert.throws(fn, new RegExp(`\\[CLOUD_CHARACTER_REVIEW:${code}\\]`));

test('accepts one public GitHub user attachment URL and the exact target', () => {
  assert.equal(validateAttachmentUrl(validUrl), validUrl);
  assert.equal(validateTargetName(TARGET_NAME), TARGET_NAME);
  assert.match(TOOLING_COMMIT, /^[a-f0-9]{40}$/);
});

test('rejects non-HTTPS URLs', () => {
  rejects(() => validateAttachmentUrl(validUrl.replace('https:', 'http:')), 'HTTPS_REQUIRED');
});

test('rejects lookalike and non-GitHub hosts', () => {
  rejects(() => validateAttachmentUrl('https://github.com.evil.invalid/user-attachments/assets/123e4567-e89b-12d3-a456-426614174000'), 'HOST_NOT_ALLOWED');
});

test('rejects query strings, fragments, credentials and custom ports', () => {
  rejects(() => validateAttachmentUrl(`${validUrl}?token=secret`), 'QUERY_OR_FRAGMENT_FORBIDDEN');
  rejects(() => validateAttachmentUrl(`${validUrl}#fragment`), 'QUERY_OR_FRAGMENT_FORBIDDEN');
  rejects(() => validateAttachmentUrl('https://user:pass@github.com/user-attachments/assets/123e4567-e89b-12d3-a456-426614174000'), 'URL_CREDENTIALS_FORBIDDEN');
  rejects(() => validateAttachmentUrl('https://github.com:444/user-attachments/assets/123e4567-e89b-12d3-a456-426614174000'), 'CUSTOM_PORT_FORBIDDEN');
});

test('rejects repository files, releases and malformed attachment paths', () => {
  rejects(() => validateAttachmentUrl('https://github.com/Pagebabe/comic/blob/main/image.png'), 'ATTACHMENT_PATH_NOT_ALLOWED');
  rejects(() => validateAttachmentUrl('https://github.com/Pagebabe/comic/releases/download/v1/image.png'), 'ATTACHMENT_PATH_NOT_ALLOWED');
  rejects(() => validateAttachmentUrl('https://github.com/user-attachments/assets/not-a-uuid'), 'ATTACHMENT_PATH_NOT_ALLOWED');
});

test('rejects every filename except the exact bound Ricco target', () => {
  rejects(() => validateTargetName('Ricco-Charakterdesign Übersicht.png'), 'TARGET_NAME_MISMATCH');
  rejects(() => validateTargetName('ricco - charakterdesign übersicht.png'), 'TARGET_NAME_MISMATCH');
});

test('accepts only non-empty assets up to the hard size limit', () => {
  assert.equal(validateAssetSize(1), 1);
  assert.equal(validateAssetSize(MAX_ASSET_BYTES), MAX_ASSET_BYTES);
  rejects(() => validateAssetSize(0), 'ASSET_EMPTY');
  rejects(() => validateAssetSize(MAX_ASSET_BYTES + 1), 'ASSET_TOO_LARGE');
});
