import { updateActionStatus } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STATUSES = new Set([
  'ready',
  'offered',
  'assigned',
  'doing',
  'review',
  'verified',
  'blocked',
  'stopped',
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ ok: false }, { status: 403 });
    const { id } = await params;
    const body = await readJsonObject(request, 2_000);
    const status = stringField(body.status, 'status', { maximum: 40 })!;
    if (!STATUSES.has(status))
      throw new RequestValidationError('Invalid status.');
    await updateActionStatus(id, status);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
