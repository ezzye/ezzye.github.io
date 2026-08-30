import type { RepairBundle } from '@/lib/types';

export const STEWARD_MODEL = 'deepseek-v4-flash';

export type StewardDraft = {
  summary: string;
  nextAction: string;
  blockers: string[];
  draftUpdate: string;
  questions: string[];
};

export function publicStewardInput(bundle: RepairBundle) {
  return {
    privacyBoundary: 'PUBLIC_DATA_ONLY',
    repair: bundle.repair,
    actions: bundle.actions,
    outcomes: bundle.outcomes,
    updates: bundle.updates,
  };
}

export async function publicInputChecksum(bundle: RepairBundle) {
  const bytes = new TextEncoder().encode(
    JSON.stringify(publicStewardInput(bundle)),
  );
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function validText(value: unknown, maximum: number) {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maximum
    ? value.trim()
    : null;
}

function validList(
  value: unknown,
  maximumItems: number,
  maximumLength: number,
) {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const items = value.map((item) => validText(item, maximumLength));
  return items.every(Boolean) ? (items as string[]) : null;
}

function parseDraft(value: unknown): StewardDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The steward returned an invalid draft.');
  }
  const record = value as Record<string, unknown>;
  const summary = validText(record.summary, 600);
  const nextAction = validText(record.nextAction, 400);
  const blockers = validList(record.blockers, 4, 300);
  const draftUpdate = validText(record.draftUpdate, 1_200);
  const questions = validList(record.questions, 4, 300);
  if (!summary || !nextAction || !blockers || !draftUpdate || !questions) {
    throw new Error('The steward draft did not pass the output checks.');
  }
  return { summary, nextAction, blockers, draftUpdate, questions };
}

export async function generateStewardDraft(
  bundle: RepairBundle,
  apiKey: string,
): Promise<StewardDraft> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: STEWARD_MODEL,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are the Coding for Justice finishing steward. Use only the supplied public ledger. Do not invent facts, people, impact, legal advice or evidence. Optimise for finishing: identify one action taking at most 90 minutes, name blockers, and draft a calm factual weekly update. Return JSON exactly as {"summary":"...","nextAction":"...","blockers":["..."],"draftUpdate":"...","questions":["..."]}. The draft is for human review and must never claim publication or completion.',
        },
        {
          role: 'user',
          content: `Produce the JSON steward brief from this public data:\n${JSON.stringify(publicStewardInput(bundle))}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`The steward service returned ${response.status}.`);
  }
  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('The steward returned an empty draft.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('The steward returned unreadable JSON.');
  }
  return parseDraft(parsed);
}
