import { updateProposalStatus } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STATUSES = new Set([
  'new',
  'reviewing',
  'needs_information',
  'declined',
  'accepted',
  'deleted',
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
    await updateProposalStatus(id, status);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
