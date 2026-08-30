import {
  publishRepairUpdateDraft,
  updateRepairUpdateDraft,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { pilotClosingDateIsAllowed } from '@/lib/pilot-rules';
import {
  booleanField,
  errorResponse,
  integerField,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const body = await readJsonObject(request, 12_000);
    if (body.operation === 'publish') {
      if (
        !booleanField(body.noPrivateDetails) ||
        !booleanField(body.humanReviewed)
      ) {
        throw new RequestValidationError(
          'Confirm both checks before making this update visible.',
        );
      }
      const expectedSnapshotHash = stringField(
        body.expectedSnapshotHash,
        'expectedSnapshotHash',
        { maximum: 80 },
      )!;
      if (!/^v1:sha256:[0-9a-f]{64}$/.test(expectedSnapshotHash)) {
        throw new RequestValidationError(
          'Reload the exact public preview before publishing.',
        );
      }
      const result = await publishRepairUpdateDraft(id, {
        revision: integerField(body.expectedRevision, 'expectedRevision', {
          minimum: 1,
        }),
        snapshotHash: expectedSnapshotHash,
      });
      if (result === 'stale') {
        throw new RequestValidationError(
          'The words changed in another tab. Reload this page and check them again.',
          {},
          409,
        );
      }
      if (result === 'not_ready') {
        throw new RequestValidationError(
          'This private update draft was not found.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }

    const nextReviewDate = stringField(body.nextReviewDate, 'nextReviewDate', {
      minimum: 10,
      maximum: 10,
    })!;
    if (!pilotClosingDateIsAllowed(nextReviewDate)) {
      throw new RequestValidationError(
        'Use a real next review date from 7 to 90 calendar days away.',
      );
    }
    const changed = await updateRepairUpdateDraft(id, {
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
    if (!changed) {
      throw new RequestValidationError(
        'This private update draft was not found.',
        {},
        409,
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
