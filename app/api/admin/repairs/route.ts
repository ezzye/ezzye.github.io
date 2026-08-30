import { createRepairDraft } from '@/db/queries';
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
    const body = await readJsonObject(request, 4_000);
    const reference = await createRepairDraft({
      title: stringField(body.title, 'title', { minimum: 5, maximum: 160 })!,
      summary: stringField(body.summary, 'summary', {
        minimum: 20,
        maximum: 400,
      })!,
    });
    if (!reference) {
      throw new RequestValidationError(
        'Finish the existing private draft, or safely stop and clear the live reply test, before starting another repair.',
        {},
        409,
      );
    }
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
