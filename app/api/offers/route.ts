import { createActionOffer } from '@/db/queries';
import { allowRequest } from '@/lib/rate-limit';
import { publicIntakeIsOpen } from '@/lib/public-intake';
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
    if (!publicIntakeIsOpen()) {
      throw new RequestValidationError(
        'Offers are not open yet. Nothing was saved.',
        {},
        409,
      );
    }
    const body = await readJsonObject(request, 12_000);
    if (
      stringField(body.companyWebsite, 'companyWebsite', { optional: true })
    ) {
      return Response.json({ ok: true, reference: 'received' });
    }
    if (!(await allowRequest(request, 'offer', 6))) {
      throw new RequestValidationError(
        'Too many offers were sent from this connection. Try again later.',
        {},
        429,
      );
    }
    if (!booleanField(body.consentContact)) {
      throw new RequestValidationError(
        'We need permission to email you about this job.',
        {
          consentContact: 'Tick this if you want to offer help.',
        },
      );
    }
    if (!booleanField(body.covenantAccepted)) {
      throw new RequestValidationError(
        'You need to agree to the ground rule before sending.',
        { covenantAccepted: 'Agree to the ground rule to carry on.' },
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
