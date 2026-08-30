import { createRepairUpdateDraft } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { pilotClosingDateIsAllowed } from '@/lib/pilot-rules';
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
    const body = await readJsonObject(request, 12_000);
    const nextReviewDate = stringField(body.nextReviewDate, 'nextReviewDate', {
      minimum: 10,
      maximum: 10,
    })!;
    if (!pilotClosingDateIsAllowed(nextReviewDate)) {
      throw new RequestValidationError(
        'Use a real next review date from 7 to 90 calendar days away.',
      );
    }
    const reference = await createRepairUpdateDraft({
      repairId: stringField(body.repairId, 'repairId', { maximum: 100 })!,
      title: stringField(body.title, 'title', { minimum: 5, maximum: 160 })!,
      body: stringField(body.body, 'body', {
        minimum: 20,
        maximum: 1_500,
      })!,
      evidenceChanged: stringField(body.evidenceChanged, 'evidenceChanged', {
        minimum: 10,
        maximum: 1_500,
      })!,
      remainsUnfair: stringField(body.remainsUnfair, 'remainsUnfair', {
        minimum: 10,
        maximum: 1_500,
      })!,
      nextOwner: stringField(body.nextOwner, 'nextOwner', {
        minimum: 2,
        maximum: 120,
      })!,
      nextReviewDate,
    });
    if (!reference) {
      throw new RequestValidationError(
        'Finish the existing private update draft first.',
        {},
        409,
      );
    }
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
