import { createInitialActionDraft } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const body = await readJsonObject(request, 2_000);
    const repairId = stringField(body.repairId, 'repairId', {
      maximum: 100,
    })!;
    const reference = await createInitialActionDraft(repairId);
    if (!reference) {
      throw new RequestValidationError(
        'This repair is already public, missing, or already has its first job.',
        {},
        409,
      );
    }
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
