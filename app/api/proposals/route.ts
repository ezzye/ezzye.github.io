import { createProposal } from '@/db/queries';
import { allowRequest } from '@/lib/rate-limit';
import { publicIntakeIsOpen } from '@/lib/public-intake';
import {
  booleanField,
  emailField,
  errorResponse,
  linksField,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

const RELATIONSHIPS = new Set([
  'affected',
  'supporter',
  'practitioner',
  'observer',
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
    const body = await readJsonObject(request);

    if (
      stringField(body.companyWebsite, 'companyWebsite', { optional: true })
    ) {
      return Response.json({ ok: true, reference: 'received' });
    }
    if (!(await allowRequest(request, 'proposal', 4))) {
      throw new RequestValidationError(
        'Too many proposals were sent from this connection. Please try again later.',
        {},
        429,
      );
    }

    const relationship = stringField(body.relationship, 'relationship', {
      maximum: 30,
    })!;
    if (!RELATIONSHIPS.has(relationship)) {
      throw new RequestValidationError(
        'Choose how you relate to the problem.',
        {
          relationship: 'Choose one of the listed relationships.',
        },
      );
    }

    const email = emailField(body.email, true);
    const consentContact = booleanField(body.consentContact);
    const consentRedactedDraft = booleanField(body.consentRedactedDraft);
    const backgroundOnly = booleanField(body.backgroundOnly);

    if (email && !consentContact) {
      throw new RequestValidationError(
        'Permission to contact you is required when an email is supplied.',
        {
          consentContact:
            'Tick this only if you want us to use the email supplied.',
        },
      );
    }
    if (consentRedactedDraft && !email) {
      throw new RequestValidationError(
        'An email is needed so you can review a redacted draft before publication.',
        { email: 'Add an email or choose private background only.' },
      );
    }
    if (consentRedactedDraft === backgroundOnly) {
      throw new RequestValidationError(
        'Choose exactly one publication preference.',
        {
          publicationPreference:
            'Choose either a redacted draft for review or private background only.',
        },
      );
    }

    const reference = await createProposal({
      workingTitle: stringField(body.workingTitle, 'workingTitle', {
        minimum: 10,
        maximum: 120,
      })!,
      problem: stringField(body.problem, 'problem', {
        minimum: 30,
        maximum: 2_000,
      })!,
      broadLocation: stringField(body.broadLocation, 'broadLocation', {
        optional: true,
        maximum: 120,
      }),
      affectedGroups: stringField(body.affectedGroups, 'affectedGroups', {
        minimum: 10,
        maximum: 800,
      })!,
      evidenceState: stringField(body.evidenceState, 'evidenceState', {
        minimum: 10,
        maximum: 1_200,
      })!,
      sourceLinks: linksField(body.sourceLinks, 'sourceLinks'),
      desiredChange: stringField(body.desiredChange, 'desiredChange', {
        minimum: 10,
        maximum: 1_000,
      })!,
      firstStep: stringField(body.firstStep, 'firstStep', {
        minimum: 10,
        maximum: 800,
      })!,
      helpNeeded: stringField(body.helpNeeded, 'helpNeeded', {
        minimum: 5,
        maximum: 500,
      })!,
      relationship,
      chosenName: stringField(body.chosenName, 'chosenName', {
        optional: true,
        maximum: 100,
      }),
      email,
      contactPreference: stringField(
        body.contactPreference,
        'contactPreference',
        {
          optional: true,
          maximum: 200,
        },
      ),
      accessibilityNeed: stringField(
        body.accessibilityNeed,
        'accessibilityNeed',
        {
          optional: true,
          maximum: 600,
        },
      ),
      privacyConcern: stringField(body.privacyConcern, 'privacyConcern', {
        optional: true,
        maximum: 800,
      }),
      consentContact,
      consentRedactedDraft,
      backgroundOnly,
      consentCredit: booleanField(body.consentCredit),
      consentAi: booleanField(body.consentAi),
    });

    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
