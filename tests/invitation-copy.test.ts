import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const runbookPath = fileURLToPath(
  new URL('../docs/PILOT_RUNBOOK.md', import.meta.url),
);

void test('approved ask-first message is warm, useful and easy to copy', () => {
  const runbook = readFileSync(runbookPath, 'utf8');
  const start = runbook.indexOf('## Approved ask-first message');
  const end = runbook.indexOf('\n## ', start + 1);

  assert.notEqual(start, -1, 'approved message section is missing');
  const section = runbook.slice(start, end === -1 ? undefined : end);
  const invitation = section
    .split('\n')
    .filter((line) => line.startsWith('>'))
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n');
  const plainText = invitation.replace(/\s+/g, ' ');

  assert.match(plainText, /https:\/\/codingforjustice\.org\.uk/);
  assert.match(plainText, /Coding for Justice/);
  assert.match(plainText, /software engineer/i);
  assert.match(plainText, /fix unfair forms, rules and services/i);
  assert.match(plainText, /private, one-use link/i);
  assert.match(plainText, /please/i);
  assert.match(plainText, /thank you|thankful/i);
  assert.doesNotMatch(invitation, /\u2014/);
});
