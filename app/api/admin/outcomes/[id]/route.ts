import {
  discardOutcomeDraft,
  publishReviewedOutcomeDraft,
  reviewOutcomeDraft,
  updateOutcomeDraft,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { outcomeDraftFields } from '@/lib/outcome-draft-input';
import {
  booleanField,
  errorResponse,
  integerField,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';
import type { PublicationGuard } from '@/lib/types';

function expectedGuard(body: Record<string, unknown>): PublicationGuard {
  const snapshotHash = stringField(
    body.expectedSnapshotHash,
    'expectedSnapshotHash',
    { maximum: 80 },
  )!;
  if (!/^v1:sha256:[0-9a-f]{64}$/.test(snapshotHash)) {
    throw new RequestValidationError(
      'Reload the exact public preview before continuing.',
    );
  }
  return {
    revision: integerField(body.expectedRevision, 'expectedRevision', {
      minimum: 1,
    }),
    snapshotHash,
  };
}

function staleOutcome(): never {
  throw new RequestValidationError(
    'The words or sources changed. Reload this page and check them again.',
    {},
    409,
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const body = await readJsonObject(request, 18_000);
    const operation = stringField(body.operation, 'operation', {
      maximum: 30,
    })!;

    if (operation === 'save') {
      if (!(await updateOutcomeDraft(id, outcomeDraftFields(body)))) {
        staleOutcome();
      }
      return Response.json({ ok: true });
    }

    if (operation === 'review') {
      if (
        !booleanField(body.humanReviewed) ||
        !booleanField(body.noPrivateDetails)
      ) {
        throw new RequestValidationError(
          'Confirm both checks after reading every public word.',
        );
      }
      const result = await reviewOutcomeDraft(id, expectedGuard(body), {
        noPrivateRepliesUsed: booleanField(body.noPrivateRepliesUsed),
        publicEvidenceOpened: booleanField(body.publicEvidenceOpened),
        publicEvidenceContainsNoPrivateMaterial: booleanField(
          body.publicEvidenceContainsNoPrivateMaterial,
        ),
      });
      if (result === 'stale' || result === 'not_found') staleOutcome();
      if (result === 'not_ready') {
        throw new RequestValidationError(
          'The public proof is not ready for review.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }

    if (operation === 'publish') {
      if (!booleanField(body.publishExactReviewedDraft)) {
        throw new RequestValidationError(
          'Confirm that you mean to publish this exact reviewed draft.',
        );
      }
      const result = await publishReviewedOutcomeDraft(id, expectedGuard(body));
      if (result === 'stale' || result === 'not_found') staleOutcome();
      if (result === 'not_ready') {
        throw new RequestValidationError(
          'The exact reviewed public proof is not ready.',
          {},
          409,
        );
      }
      return Response.json({ ok: true });
    }

    if (operation === 'discard') {
      if (!(await discardOutcomeDraft(id))) staleOutcome();
      return Response.json({ ok: true });
    }

    throw new RequestValidationError('Choose a valid private draft action.');
  } catch (error) {
    return errorResponse(error);
  }
}
