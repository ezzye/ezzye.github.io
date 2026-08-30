import { updateRepairStage } from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import {
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
    const body = await readJsonObject(request, 2_000);
    const stage = stringField(body.stage, 'stage', { maximum: 40 })!;
    if (!STAGES.has(stage)) throw new RequestValidationError('Invalid stage.');
    await updateRepairStage(id, stage);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
