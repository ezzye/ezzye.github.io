import {
  createActionInvites,
  getActionResponseRetentionSweep,
  getPilotActionSettings,
} from '@/db/queries';
import { getAdminUser } from '@/lib/admin';
import { pilotRuntimeIsReady } from '@/lib/public-intake';
import {
  errorResponse,
  readJsonObject,
  RequestValidationError,
  stringField,
} from '@/lib/request';

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const body = await readJsonObject(request, 2_000);
    const actionId = stringField(body.actionId, 'actionId', {
      maximum: 100,
    })!;
    const [settings, retentionSweep] = await Promise.all([
      getPilotActionSettings(actionId),
      getActionResponseRetentionSweep(),
    ]);
    if (!settings || !pilotRuntimeIsReady(settings, retentionSweep)) {
      throw new RequestValidationError(
        'No link was made. The automatic deletion check must be recent, and every privacy and test decision must be ready.',
        {},
        409,
      );
    }
    const created = await createActionInvites(actionId, 1, settings);
    const invite = created[0];
    if (!invite) {
      throw new RequestValidationError(
        'No link was made. The job may be full or past its closing date.',
        {},
        409,
      );
    }

    const url = new URL(invite.responsePath, request.url);
    url.searchParams.set('invite', invite.token);
    return Response.json(
      {
        ok: true,
        invite: {
          id: invite.id,
          url: url.toString(),
          expiresAt: invite.expiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
