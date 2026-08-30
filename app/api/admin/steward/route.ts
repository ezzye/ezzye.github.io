import { env } from 'cloudflare:workers';

import {
  countRecentStewardBriefs,
  createStewardBrief,
  getPublicRepairBundle,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';
import {
  generateStewardDraft,
  publicInputChecksum,
  STEWARD_MODEL,
} from '@/lib/steward';

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) {
      return Response.json(
        { ok: false, message: 'Not authorised.' },
        { status: 403 },
      );
    }
    const apiKey = env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) {
      throw new RequestValidationError(
        'DeepSeek Flash is not configured for this deployment. The deterministic finish queue still works.',
        {},
        503,
      );
    }
    const body = await readJsonObject(request, 2_000);
    const slug = stringField(body.repairSlug, 'repairSlug', { maximum: 120 })!;
    const bundle = await getPublicRepairBundle(slug);
    if (!bundle) {
      throw new RequestValidationError(
        'The published repair was not found.',
        {},
        404,
      );
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
    if ((await countRecentStewardBriefs(bundle.repair.id, since)) >= 3) {
      throw new RequestValidationError(
        'The daily steward limit has been reached. Review an existing brief instead.',
        {},
        429,
      );
    }

    // The model receives only fields already published on the repair ledger.
    // Private proposals, offers, appeals and contact details are never queried here.
    const [draft, checksum] = await Promise.all([
      generateStewardDraft(bundle, apiKey),
      publicInputChecksum(bundle),
    ]);
    const reference = await createStewardBrief({
      repairId: bundle.repair.id,
      sourceChecksum: checksum,
      model: STEWARD_MODEL,
      ...draft,
    });
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
