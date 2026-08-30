import { Badge } from '@/components/ui/badge';
import type { ActionStatus, OutcomeConfidence, RepairStage } from '@/lib/types';

const stageLabels: Record<RepairStage, string> = {
  listening: 'Listening',
  framing: 'Framing',
  acting: 'Acting',
  checking: 'Checking',
  closed: 'Closed',
  stopped: 'Stopped',
};

const actionLabels: Record<ActionStatus, string> = {
  ready: 'Ready',
  offered: 'Offers received',
  assigned: 'Assigned',
  doing: 'In progress',
  review: 'In review',
  verified: 'Verified',
  blocked: 'Blocked',
  stopped: 'Stopped',
};

const confidenceLabels: Record<OutcomeConfidence, string> = {
  claimed: 'Claimed',
  observed: 'Observed',
  independently_verified: 'Independently verified',
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
