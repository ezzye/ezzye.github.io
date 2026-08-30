import { updateStewardBriefStatus } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';
import type { StewardBrief } from '@/lib/types';

const STATUSES = new Set(['draft', 'adopted', 'discarded']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json(
        { ok: false, message: 'Not authorised.' },
        { status: 403 },
      );
    }
    const { id } = await params;
    const body = await readJsonObject(request, 2_000);
    const status = stringField(body.status, 'status', { maximum: 20 })!;
    if (!STATUSES.has(status))
      throw new RequestValidationError('Invalid status.');
    await updateStewardBriefStatus(id, status as StewardBrief['status']);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
