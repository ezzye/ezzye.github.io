import {
  approvePilotActionTerms,
  getActionResponseRetentionSweep,
  getPilotActionSettings,
  updateInitialActionDraftBasics,
  updateInitialActionDraftGuard,
  updateActionPreview,
  updateActionStatus,
  updatePilotActionSettings,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  getCurrentPilotApprovalSnapshot,
  getPublicContactEmail,
  pilotPrivacyIsReady,
  pilotRuntimeIsReady,
  pilotTermsAreApproved,
  publicIntakeIsOpen,
} from '@/lib/public-intake';
import { pilotClosingDateIsAllowed } from '@/lib/pilot-rules';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const STATUSES = new Set([
  'ready',
  'offered',
  'assigned',
  'doing',
  'review',
  'verified',
  'blocked',
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
    if (body.operation === 'draft-basics') {
      const compensation = stringField(body.compensation, 'compensation', {
        minimum: 10,
        maximum: 240,
      })!;
      if (compensation === 'Pay not set — job cannot open') {
        throw new RequestValidationError(
          'Say plainly whether the job is paid, expenses-only or unpaid.',
        );
      }
      const changed = await updateInitialActionDraftBasics(id, {
        title: stringField(body.title, 'title', { minimum: 5, maximum: 160 })!,
        intendedOutput: stringField(body.intendedOutput, 'intendedOutput', {
          minimum: 10,
          maximum: 1_000,
        })!,
        whyItMatters: stringField(body.whyItMatters, 'whyItMatters', {
          minimum: 10,
          maximum: 1_000,
        })!,
        timeSize: stringField(body.timeSize, 'timeSize', {
          minimum: 2,
          maximum: 80,
        })!,
        compensation,
      });
      if (!changed) {
        throw new RequestValidationError(
          'This private job was not found, its repair is public, or its check date is after the repair check date.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'draft-guard') {
      const capacity = Number(body.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10) {
        throw new RequestValidationError('Capacity must be from 1 to 10.');
      }
      const reviewDate = stringField(body.reviewDate, 'reviewDate', {
        minimum: 10,
        maximum: 10,
      })!;
      if (!pilotClosingDateIsAllowed(reviewDate)) {
        throw new RequestValidationError(
          'Use a real review date from 7 to 90 calendar days away.',
        );
      }
      const changed = await updateInitialActionDraftGuard(id, {
        skillsNeeded: stringField(body.skillsNeeded, 'skillsNeeded', {
          minimum: 2,
          maximum: 500,
        })!,
        locationMode: stringField(body.locationMode, 'locationMode', {
          minimum: 2,
          maximum: 240,
        })!,
        ownerName: stringField(body.ownerName, 'ownerName', {
          minimum: 2,
          maximum: 120,
        })!,
        reviewerName: stringField(body.reviewerName, 'reviewerName', {
          minimum: 2,
          maximum: 120,
        })!,
        capacity,
        evidenceRequired: stringField(
          body.evidenceRequired,
          'evidenceRequired',
          {
            minimum: 10,
            maximum: 1_000,
          },
        )!,
        reviewDate,
        stopCondition: stringField(body.stopCondition, 'stopCondition', {
          minimum: 10,
          maximum: 1_000,
        })!,
      });
      if (!changed) {
        throw new RequestValidationError(
          'This private job draft was not found or its repair is already public.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'pilot-settings') {
      const compensation = stringField(body.compensation, 'compensation', {
        minimum: 10,
        maximum: 240,
      })!;
      const reviewerName = stringField(body.reviewerName, 'reviewerName', {
        minimum: 2,
        maximum: 120,
      })!;
      const reviewDate = stringField(body.reviewDate, 'reviewDate', {
        minimum: 10,
        maximum: 10,
      })!;
      if (!pilotClosingDateIsAllowed(reviewDate)) {
        throw new RequestValidationError(
          'Use a real closing date from 7 to 90 calendar days away.',
        );
      }
      const changed = await updatePilotActionSettings(id, {
        compensation,
        reviewerName,
        reviewDate,
      });
      if (!changed) {
        throw new RequestValidationError(
          'Stop or use every active link and remove any dummy replies before changing these details.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (body.operation === 'approve-pilot-terms') {
      const settings = await getPilotActionSettings(id);
      if (!settings || !pilotClosingDateIsAllowed(settings.reviewDate)) {
        throw new RequestValidationError(
          'Set a real closing date from 7 to 90 days away before approving the test.',
          {},
          409,
        );
      }
      if (publicIntakeIsOpen()) {
        throw new RequestValidationError(
          'Close the other private forms before approving this test.',
          {},
          409,
        );
      }
      const approvalSnapshot = getCurrentPilotApprovalSnapshot(settings);
      if (!approvalSnapshot) {
        throw new RequestValidationError(
          'Finish the privacy, recruitment, reply-reader and invitation-permission decisions before approving this test.',
          {},
          409,
        );
      }
      const approved = await approvePilotActionTerms(id, approvalSnapshot);
      if (!approved) {
        throw new RequestValidationError(
          'Stop every active link and remove any dummy replies before approving these details.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    if (typeof body.isPreview === 'boolean') {
      if (!body.isPreview && !getPublicContactEmail()) {
        throw new RequestValidationError(
          'Add the public privacy contact before opening this test.',
          {},
          409,
        );
      }
      const [settings, retentionSweep] = await Promise.all([
        getPilotActionSettings(id),
        getActionResponseRetentionSweep(),
      ]);
      if (!body.isPreview && !pilotPrivacyIsReady(settings?.reviewDate)) {
        throw new RequestValidationError(
          'Finish the full pilot privacy details and record the check before opening this test.',
          {},
          409,
        );
      }
      if (!body.isPreview && (!settings || !pilotTermsAreApproved(settings))) {
        throw new RequestValidationError(
          'Approve the exact questions, pay, people, privacy and dates before opening this test.',
          {},
          409,
        );
      }
      if (!body.isPreview && publicIntakeIsOpen()) {
        throw new RequestValidationError(
          'Close the other private forms before opening this five-person test.',
          {},
          409,
        );
      }
      if (
        !body.isPreview &&
        (!settings || !pilotRuntimeIsReady(settings, retentionSweep))
      ) {
        throw new RequestValidationError(
          'The test is not ready to open. The automatic deletion check must be recent.',
          {},
          409,
        );
      }
      const changed = await updateActionPreview(id, body.isPreview);
      if (!changed) {
        throw new RequestValidationError(
          body.isPreview
            ? 'This test could not be stopped.'
            : 'Create an unused one-use link and check the closing date before opening this test.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }
    const status = stringField(body.status, 'status', { maximum: 40 })!;
    if (!STATUSES.has(status))
      throw new RequestValidationError('Invalid status.');
    if (!(await updateActionStatus(id, status))) {
      throw new RequestValidationError(
        'Use the first-five controls to change this test.',
        {},
        409,
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
