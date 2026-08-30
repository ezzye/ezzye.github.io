import { updateAppealStatus } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STATUSES = new Set(['new', 'reviewing', 'resolved', 'declined']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return Response.json({ ok: false }, { status: 403 });
    const { id } = await params;
    const body = await readJsonObject(request, 4_000);
    const status = stringField(body.status, 'status', { maximum: 40 })!;
    if (!STATUSES.has(status))
      throw new RequestValidationError('Invalid status.');
    const decisionNote = stringField(body.decisionNote, 'decisionNote', {
      optional: true,
      maximum: 1_000,
    });
    await updateAppealStatus(id, status, admin.userId, decisionNote);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
