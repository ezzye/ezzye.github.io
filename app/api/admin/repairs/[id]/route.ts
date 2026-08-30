import {
  publishRepairDraft,
  updateRepairDraftChange,
  updateRepairDraftGuard,
  updateRepairDraftProblem,
  updateRepairStage,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { pilotClosingDateIsAllowed } from '@/lib/pilot-rules';
import {
  booleanField,
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STAGES = new Set([
  'listening',
  'framing',
  'acting',
  'checking',
  'closed',
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
    const body = await readJsonObject(request, 16_000);
    if (body.operation === 'draft-problem') {
      const changed = await updateRepairDraftProblem(id, {
        title: stringField(body.title, 'title', { minimum: 5, maximum: 160 })!,
        summary: stringField(body.summary, 'summary', {
          minimum: 20,
          maximum: 400,
        })!,
        scope: stringField(body.scope, 'scope', {
          minimum: 10,
          maximum: 1_000,
        })!,
        affectedGroups: stringField(body.affectedGroups, 'affectedGroups', {
          minimum: 10,
          maximum: 1_000,
        })!,
        knownFacts: stringField(body.knownFacts, 'knownFacts', {
          minimum: 10,
          maximum: 2_000,
        })!,
        unknowns: stringField(body.unknowns, 'unknowns', {
          minimum: 10,
          maximum: 2_000,
        })!,
        disputedClaims: stringField(body.disputedClaims, 'disputedClaims', {
          minimum: 4,
          maximum: 1_500,
        })!,
      });
      if (!changed) {
        throw new RequestValidationError(
          'This private draft was not found or is already public.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'draft-change') {
      const changed = await updateRepairDraftChange(id, {
        desiredChange: stringField(body.desiredChange, 'desiredChange', {
          minimum: 20,
          maximum: 2_000,
        })!,
        smallestTest: stringField(body.smallestTest, 'smallestTest', {
          minimum: 20,
          maximum: 1_500,
        })!,
      });
      if (!changed) {
        throw new RequestValidationError(
          'This private draft was not found or is already public.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'draft-guard') {
      const reviewDate = stringField(body.reviewDate, 'reviewDate', {
        minimum: 10,
        maximum: 10,
      })!;
      if (!pilotClosingDateIsAllowed(reviewDate)) {
        throw new RequestValidationError(
          'Use a real review date from 7 to 90 calendar days away.',
        );
      }
      const changed = await updateRepairDraftGuard(id, {
        safeguards: stringField(body.safeguards, 'safeguards', {
          minimum: 20,
          maximum: 2_000,
        })!,
        ownerName: stringField(body.ownerName, 'ownerName', {
          minimum: 2,
          maximum: 120,
        })!,
        partnerName: stringField(body.partnerName, 'partnerName', {
          minimum: 2,
          maximum: 120,
        })!,
        reviewDate,
      });
      if (!changed) {
        throw new RequestValidationError(
          'This private draft was not found or is already public.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'publish-draft') {
      if (
        !booleanField(body.noPrivateDetails) ||
        !booleanField(body.humanReviewed) ||
        !booleanField(body.covenantAligned)
      ) {
        throw new RequestValidationError(
          'Confirm all three checks before making this repair visible.',
        );
      }
      if (!(await publishRepairDraft(id))) {
        throw new RequestValidationError(
          'Finish the repair frame and its first bounded job before publishing.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    const stage = stringField(body.stage, 'stage', { maximum: 40 })!;
    if (!STAGES.has(stage)) throw new RequestValidationError('Invalid stage.');
    await updateRepairStage(id, stage);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
