import { createOutcomeDraft } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { outcomeDraftFields } from '@/lib/outcome-draft-input';
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
    const body = await readJsonObject(request, 18_000);
    const reference = await createOutcomeDraft({
      repairId: stringField(body.repairId, 'repairId', { maximum: 100 })!,
      ...outcomeDraftFields(body),
    });
    if (!reference) {
      throw new RequestValidationError(
        'This repair already has a private result draft, or it is not ready.',
        {},
        409,
      );
    }
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
