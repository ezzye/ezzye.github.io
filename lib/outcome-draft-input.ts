import { linksField, RequestValidationError, stringField } from './request.ts';
import type { OutcomeConfidence, OutcomeSourceMode } from './types.ts';

const CONFIDENCE = new Set<OutcomeConfidence>([
  'claimed',
  'observed',
  'independently_verified',
]);
const SOURCE_MODES = new Set<OutcomeSourceMode>(['public_evidence_only']);

function ipv4IsPrivate(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

export function publicEvidenceUrlIsSafe(value: string | null): boolean {
  if (!value || value.includes('\n') || value.includes('\r')) return false;
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      (parsed.port && parsed.port !== '443')
    ) {
      return false;
    }
    const hostname = parsed.hostname
      .toLowerCase()
      .replace(/^\[/, '')
      .replace(/\]$/, '');
    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.home') ||
      hostname.endsWith('.lan') ||
      // Phase one needs an ordinary public web address. Reject every IPv6
      // literal, including hexadecimal IPv4-mapped private addresses.
      hostname.includes(':')
    ) {
      return false;
    }
    if (ipv4IsPrivate(hostname)) return false;
    return hostname.includes('.');
  } catch {
    return false;
  }
}

export type OutcomeDraftFields = {
  title: string;
  activity: string;
  observedEffect: string;
  evidence: string;
  evidenceUrl: string | null;
  confidence: OutcomeConfidence;
  verifierName: string;
  whoBenefited: string;
  whatDidNotChange: string;
  learning: string;
  sourceMode: OutcomeSourceMode;
};

export function outcomeDraftFields(
  body: Record<string, unknown>,
): OutcomeDraftFields {
  const confidence = stringField(body.confidence, 'confidence', {
    maximum: 40,
  }) as OutcomeConfidence;
  if (!CONFIDENCE.has(confidence)) {
    throw new RequestValidationError('Choose a valid confidence level.');
  }
  const sourceMode = stringField(body.sourceMode, 'sourceMode', {
    maximum: 40,
  }) as OutcomeSourceMode;
  if (!SOURCE_MODES.has(sourceMode)) {
    throw new RequestValidationError(
      'This first version can publish results only from public evidence. Private replies stay private.',
    );
  }
  const evidenceUrl = linksField(body.evidenceUrl, 'evidenceUrl');
  if (evidenceUrl.split(/\r?\n/).filter(Boolean).length > 1) {
    throw new RequestValidationError('Use one public evidence link.');
  }
  return {
    title: stringField(body.title, 'title', {
      minimum: 5,
      maximum: 160,
    })!,
    activity: stringField(body.activity, 'activity', {
      minimum: 20,
      maximum: 1_500,
    })!,
    observedEffect: stringField(body.observedEffect, 'observedEffect', {
      minimum: 20,
      maximum: 1_500,
    })!,
    evidence: stringField(body.evidence, 'evidence', {
      minimum: 20,
      maximum: 2_000,
    })!,
    evidenceUrl: evidenceUrl || null,
    confidence,
    verifierName: stringField(body.verifierName, 'verifierName', {
      minimum: 2,
      maximum: 120,
    })!,
    whoBenefited: stringField(body.whoBenefited, 'whoBenefited', {
      minimum: 10,
      maximum: 1_000,
    })!,
    whatDidNotChange: stringField(body.whatDidNotChange, 'whatDidNotChange', {
      minimum: 10,
      maximum: 1_000,
    })!,
    learning: stringField(body.learning, 'learning', {
      minimum: 10,
      maximum: 1_500,
    })!,
    sourceMode,
  };
}
