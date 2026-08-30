import { stopAndDeletePilotResponses } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

export async function DELETE(request: Request) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const body = await readJsonObject(request, 2_000);
    const repairId = stringField(body.repairId, 'repairId', {
      maximum: 100,
    })!;
    const event = await stopAndDeletePilotResponses(repairId);
    if (!event) {
      throw new RequestValidationError('That repair was not found.', {}, 404);
    }
    return Response.json({
      ok: true,
      recordsDeleted: event.recordsDeleted,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
