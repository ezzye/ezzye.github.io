import { createAppeal } from '@/db/queries';
import { allowRequest } from '@/lib/rate-limit';
import { publicIntakeIsOpen } from '@/lib/public-intake';
import {
  emailField,
  errorResponse,
  linksField,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const REQUEST_TYPES = new Set([
  'factual-correction',
  'privacy-removal',
  'moderation-review',
  'accessibility',
  'other',
]);

export async function POST(request: Request) {
  try {
    if (!publicIntakeIsOpen()) {
      throw new RequestValidationError(
        'This private form is not open yet. Nothing was saved.',
        {},
        409,
      );
    }
    const body = await readJsonObject(request, 16_000);
    if (
      stringField(body.companyWebsite, 'companyWebsite', { optional: true })
    ) {
      return Response.json({ ok: true, reference: 'received' });
    }
    if (!(await allowRequest(request, 'appeal', 5))) {
      throw new RequestValidationError(
        'Too many review requests were sent from this connection. Please try again later.',
        {},
        429,
      );
    }

    const requestType = stringField(body.requestType, 'requestType', {
      maximum: 40,
    })!;
    if (!REQUEST_TYPES.has(requestType)) {
      throw new RequestValidationError('Choose a review type.', {
        requestType: 'Choose one of the listed review types.',
      });
    }

    const reference = await createAppeal({
      itemReference: stringField(body.itemReference, 'itemReference', {
        minimum: 2,
        maximum: 240,
      })!,
      requestType,
      explanation: stringField(body.explanation, 'explanation', {
        minimum: 30,
        maximum: 2_000,
      })!,
      evidenceLinks: linksField(body.evidenceLinks, 'evidenceLinks'),
      email: emailField(body.email)!,
      accessibilityNeed: stringField(
        body.accessibilityNeed,
        'accessibilityNeed',
        {
          optional: true,
          maximum: 600,
        },
      ),
    });
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
