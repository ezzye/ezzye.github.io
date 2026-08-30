import { createActionOffer } from '@/db/queries';
import { allowRequest } from '@/lib/rate-limit';
import {
  booleanField,
  emailField,
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request, 12_000);
    if (
      stringField(body.companyWebsite, 'companyWebsite', { optional: true })
    ) {
      return Response.json({ ok: true, reference: 'received' });
    }
    if (!(await allowRequest(request, 'offer', 6))) {
      throw new RequestValidationError(
        'Too many offers were sent from this connection. Please try again later.',
        {},
        429,
      );
    }
    if (!booleanField(body.consentContact)) {
      throw new RequestValidationError(
        'Permission to contact you is required.',
        {
          consentContact:
            'We need permission to reply about this bounded task.',
        },
      );
    }
    if (!booleanField(body.covenantAccepted)) {
      throw new RequestValidationError(
        'You must affirm the community covenant before joining a repair.',
        { covenantAccepted: 'Read and affirm the covenant to continue.' },
      );
    }

    const reference = await createActionOffer({
      actionId: stringField(body.actionId, 'actionId', { maximum: 100 })!,
      chosenName: stringField(body.chosenName, 'chosenName', {
        minimum: 2,
        maximum: 100,
      })!,
      email: emailField(body.email)!,
      contribution: stringField(body.contribution, 'contribution', {
        minimum: 20,
        maximum: 1_000,
      })!,
      accessibilityNeed: stringField(
        body.accessibilityNeed,
        'accessibilityNeed',
        {
          optional: true,
          maximum: 600,
        },
      ),
      covenantVersion: '2026-08-30-v1',
      consentContact: true,
    });
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
