import { Badge } from '@/components/ui/badge';
import type { ActionStatus, OutcomeConfidence, RepairStage } from '@/lib/types';

const stageLabels: Record<RepairStage, string> = {
  listening: 'Hearing people',
  framing: 'Working out the problem',
  acting: 'Work under way',
  checking: 'Being checked',
  closed: 'Done',
  stopped: 'Stopped',
};

const actionLabels: Record<ActionStatus, string> = {
  ready: 'Help wanted',
  offered: 'Someone offered',
  assigned: 'Taken',
  doing: 'Being done',
  review: 'Being checked',
  verified: 'Done and checked',
  blocked: 'Stuck',
  stopped: 'Stopped',
};

const confidenceLabels: Record<OutcomeConfidence, string> = {
  claimed: 'Someone told us',
  observed: 'We saw it',
  independently_verified: 'Someone else checked it',
};

export function RepairStageBadge({ stage }: { stage: RepairStage }) {
  return (
    <Badge className={`status-badge status-${stage}`}>
      {stageLabels[stage]}
    </Badge>
  );
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return (
    <Badge variant="outline" className={`status-badge status-${status}`}>
      {actionLabels[status]}
    </Badge>
  );
}

export function ConfidenceBadge({
  confidence,
}: {
  confidence: OutcomeConfidence;
}) {
  return (
    <Badge
      variant="outline"
      className={`confidence-badge confidence-${confidence}`}
    >
      {confidenceLabels[confidence]}
    </Badge>
  );
}
