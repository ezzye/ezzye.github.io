import { createActionResponse, getDirectActionTask } from '@/db/queries';
import { allowRequest } from '@/lib/rate-limit';
import {
  booleanField,
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
    if (!(await allowRequest(request, 'action-response', 8))) {
      throw new RequestValidationError(
        'Too many replies were sent from this connection. Try again later.',
        {},
        429,
      );
    }

    const actionId = stringField(body.actionId, 'actionId', {
      maximum: 100,
    })!;
    const task = await getDirectActionTask(actionId);
    if (!task || task.questions.length === 0) {
      throw new RequestValidationError(
        'This job is not taking replies now.',
        {},
        409,
      );
    }
    if (!Array.isArray(body.answers)) {
      throw new RequestValidationError('Please answer each question.');
    }
    if (body.answers.length !== task.questions.length) {
      throw new RequestValidationError('Please answer each question.');
    }

    const answers = body.answers.map((answer, index) =>
      stringField(answer, `answer${index + 1}`, {
        minimum: 2,
        maximum: 800,
      }),
    ) as string[];

    if (!booleanField(body.consentPrivateUse)) {
      throw new RequestValidationError(
        'We need your say-so to use your answers for this private test.',
        {
          consentPrivateUse: 'Tick this if we may use your private answers.',
        },
      );
    }
    if (!booleanField(body.confirmedAdult)) {
      throw new RequestValidationError('This first test is for adults.', {
        confirmedAdult: 'Tick this only if you are 18 or older.',
      });
    }

    const reference = await createActionResponse({
      actionId,
      answers,
      consentPrivateUse: true,
      consentAnonymousSummary: booleanField(body.consentAnonymousSummary),
      confirmedAdult: true,
    });
    if (!reference) {
      throw new RequestValidationError(
        'This job is full or has closed. Your answers were not saved.',
        {},
        409,
      );
    }

    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
