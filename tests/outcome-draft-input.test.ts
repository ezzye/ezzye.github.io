import assert from 'node:assert/strict';
import test from 'node:test';

import { publicEvidenceUrlIsSafe } from '../lib/outcome-draft-input.ts';

void test('public outcome evidence accepts only public HTTPS addresses', () => {
  assert.equal(publicEvidenceUrlIsSafe('https://example.org/proof'), true);
  assert.equal(publicEvidenceUrlIsSafe('http://example.org/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://localhost/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://127.0.0.1/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://10.0.0.1/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://192.168.1.2/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://[::1]/proof'), false);
  assert.equal(publicEvidenceUrlIsSafe('https://[::ffff:7f00:1]/proof'), false);
  assert.equal(
    publicEvidenceUrlIsSafe('https://[::ffff:a9fe:a9fe]/proof'),
    false,
  );
  assert.equal(publicEvidenceUrlIsSafe('https://[::ffff:a00:1]/proof'), false);
  assert.equal(
    publicEvidenceUrlIsSafe('https://[::ffff:c0a8:102]/proof'),
    false,
  );
  assert.equal(
    publicEvidenceUrlIsSafe('https://service.internal/proof'),
    false,
  );
  assert.equal(
    publicEvidenceUrlIsSafe('https://name:secret@example.org'),
    false,
  );
});
