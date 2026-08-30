import { publishOutcome } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
  errorResponse,
  linksField,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';
import type { OutcomeConfidence } from '@/lib/types';

const CONFIDENCE = new Set(['claimed', 'observed', 'independently_verified']);

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ ok: false }, { status: 403 });
    const body = await readJsonObject(request, 18_000);
    const confidence = stringField(body.confidence, 'confidence', {
      maximum: 40,
    })!;
    if (!CONFIDENCE.has(confidence)) {
      throw new RequestValidationError('Choose a valid confidence level.');
    }
    const evidenceLinks = linksField(body.evidenceUrl, 'evidenceUrl');
    const reference = await publishOutcome({
      repairId: stringField(body.repairId, 'repairId', { maximum: 100 })!,
      title: stringField(body.title, 'title', { minimum: 5, maximum: 160 })!,
      activity: stringField(body.activity, 'activity', {
        minimum: 20,
        maximum: 1_500,
      })!,
      observedEffect: stringField(body.observedEffect, 'observedEffect', {
        minimum: 20,
        maximum: 1_500,
      })!,
      evidence: stringField(body.evidence, 'evidence', {
        minimum: 20,
        maximum: 2_000,
      })!,
      evidenceUrl: evidenceLinks || null,
      confidence: confidence as OutcomeConfidence,
      verifierName: stringField(body.verifierName, 'verifierName', {
        minimum: 2,
        maximum: 120,
      })!,
      whoBenefited: stringField(body.whoBenefited, 'whoBenefited', {
        minimum: 10,
        maximum: 1_000,
      })!,
      whatDidNotChange: stringField(body.whatDidNotChange, 'whatDidNotChange', {
        minimum: 10,
        maximum: 1_000,
      })!,
      learning: stringField(body.learning, 'learning', {
        minimum: 10,
        maximum: 1_500,
      })!,
    });
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
