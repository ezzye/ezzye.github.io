import { deleteActionResponse, updateActionResponseStatus } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STATUSES = new Set(['new', 'reviewed', 'rejected']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const body = await readJsonObject(request, 2_000);
    const status = stringField(body.status, 'status', { maximum: 40 })!;
    if (!STATUSES.has(status)) {
      throw new RequestValidationError('Invalid status.');
    }
    const changed = await updateActionResponseStatus(
      id,
      status as 'new' | 'reviewed' | 'rejected',
    );
    if (!changed) {
      throw new RequestValidationError(
        'That reply could not be changed. The job may already be full.',
        {},
        409,
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const deleted = await deleteActionResponse(id);
    if (!deleted) {
      throw new RequestValidationError('That reply was not found.', {}, 404);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
