import { revokeActionInvite } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { errorResponse, RequestValidationError } from '@/lib/request';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const revoked = await revokeActionInvite(id);
    if (!revoked) {
      throw new RequestValidationError(
        'That link was not found or was already used or stopped.',
        {},
        409,
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
