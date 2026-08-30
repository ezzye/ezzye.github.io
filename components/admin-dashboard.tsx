'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaintainerPanel } from '@/components/maintainer-panel';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type {
  ActionCard,
  AdminActionInvite,
  AdminActionResponse,
  AdminAppeal,
  AdminProposal,
  AdminRepair,
  AdminRepairUpdate,
  AdminRetentionEvent,
  Repair,
  StewardBrief,
} from '@/lib/types';
import type {
  PilotInviteAuthorization,
  PilotPrivacyConfiguration,
} from '@/lib/public-intake';

type MutationState = {
  kind: 'idle' | 'sending' | 'success' | 'error';
  message: string;
};

const idleState: MutationState = { kind: 'idle', message: '' };

async function sendMutation(
  url: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body: unknown,
) {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    error?: string;
    message?: string;
  };
  if (!response.ok || !payload.ok)
    throw new Error(payload.message ?? payload.error ?? 'The update failed.');
}

function StatusEditor({
  url,
  field,
  value,
  options,
}: {
  url: string;
  field: string;
  value: string;
  options: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>(idleState);
  const [selected, setSelected] = useState(value);

  async function update() {
    setState({ kind: 'sending', message: 'Saving…' });
    try {
      await sendMutation(url, 'PATCH', { [field]: selected });
      setState({ kind: 'success', message: 'Saved.' });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  return (
    <div className="admin-status-editor">
      <NativeSelect
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button
        type="button"
        variant="outline"
        onClick={update}
        disabled={state.kind === 'sending'}
      >
        Save
      </Button>
      <span
        className={state.kind === 'error' ? 'admin-error' : ''}
        aria-live="polite"
      >
        {state.message}
      </span>
    </div>
  );
}

function DeleteResponseButton({ responseId }: { responseId: string }) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>(idleState);

  async function remove() {
    if (
      !window.confirm(
        'Permanently delete this full reply? This cannot be undone.',
      )
    ) {
      return;
    }
    setState({ kind: 'sending', message: 'Deleting…' });
    try {
      const response = await fetch(
        `/api/admin/action-responses/${responseId}`,
        { method: 'DELETE' },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? 'The reply could not be deleted.');
      }
      setState({ kind: 'success', message: 'Reply deleted.' });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  return (
    <div className="admin-delete-row">
      <Button
        type="button"
        variant="destructive"
        onClick={remove}
        disabled={state.kind === 'sending'}
      >
        Delete full reply
      </Button>
      <span
        className={state.kind === 'error' ? 'admin-error' : ''}
        aria-live="polite"
      >
        {state.message}
      </span>
    </div>
  );
}

function StopAndDeletePilotButton({
  repairId,
  replyCount,
}: {
  repairId: string;
  replyCount: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>(idleState);

  async function removeAll() {
    if (
      !window.confirm(
        `Stop this test and permanently delete all ${replyCount} full replies? Invitation links will be revoked. This cannot be undone.`,
      )
    ) {
      return;
    }
    setState({ kind: 'sending', message: 'Stopping and deleting…' });
    try {
      await sendMutation('/api/admin/action-responses', 'DELETE', {
        repairId,
      });
      setState({
        kind: 'success',
        message:
          'Test stopped. Full replies deleted and invitation links revoked.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  return (
    <div className="admin-delete-row">
      <Button
        type="button"
        variant="destructive"
        onClick={removeAll}
        disabled={state.kind === 'sending'}
      >
        Stop reply job and delete every full reply
      </Button>
      <span
        className={state.kind === 'error' ? 'admin-error' : ''}
        aria-live="polite"
      >
        {state.message}
      </span>
    </div>
  );
}

function PilotControls({
  actions,
  invites,
  publicContactEmail,
  pilotPrivacy,
  pilotPrivacyReady,
  pilotInviteAuthorization,
  pilotInvitesAuthorized,
  pilotTermsApproved,
  publicIntakeOpen,
}: {
  actions: ActionCard[];
  invites: AdminActionInvite[];
  publicContactEmail: string | null;
  pilotPrivacy: PilotPrivacyConfiguration | null;
  pilotPrivacyReady: boolean;
  pilotInviteAuthorization: PilotInviteAuthorization | null;
  pilotInvitesAuthorized: boolean;
  pilotTermsApproved: boolean;
  publicIntakeOpen: boolean;
}) {
  const router = useRouter();
  const action = actions.find(
    (item) => item.participationMode === 'direct_response',
  );
  const [state, setState] = useState<MutationState>(idleState);
  const [newLink, setNewLink] = useState('');
  const [workingInviteId, setWorkingInviteId] = useState<string | null>(null);
  const [compensation, setCompensation] = useState(action?.compensation ?? '');
  const [reviewerName, setReviewerName] = useState(action?.reviewerName ?? '');
  const [reviewDate, setReviewDate] = useState(action?.reviewDate ?? '');
  const activeInviteCount = invites.filter(
    (invite) => !invite.usedAt && !invite.revokedAt && !invite.isExpired,
  ).length;
  const settingsMatchAction = Boolean(
    action &&
    compensation === action.compensation &&
    reviewerName === action.reviewerName &&
    reviewDate === action.reviewDate,
  );
  const canMakeLink = Boolean(
    action &&
    publicContactEmail &&
    pilotPrivacyReady &&
    pilotInvitesAuthorized &&
    pilotTermsApproved &&
    settingsMatchAction &&
    !publicIntakeOpen,
  );
  const pilotRuntimeReady = canMakeLink;
  const canOpen = Boolean(canMakeLink && activeInviteCount > 0);

  async function createLink() {
    if (!action) return;
    setState({ kind: 'sending', message: 'Making one link…' });
    setNewLink('');
    try {
      const response = await fetch('/api/admin/action-invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actionId: action.id }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        invite?: { url: string };
      };
      if (!response.ok || !payload.ok || !payload.invite?.url) {
        throw new Error(payload.message ?? 'The link could not be made.');
      }
      setNewLink(payload.invite.url);
      setState({
        kind: 'success',
        message:
          'One link made. The readable link is shown only in this response.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  async function savePilotSettings() {
    if (!action) return;
    setState({ kind: 'sending', message: 'Saving the test details…' });
    try {
      await sendMutation(`/api/admin/actions/${action.id}`, 'PATCH', {
        operation: 'pilot-settings',
        compensation,
        reviewerName,
        reviewDate,
      });
      setState({
        kind: 'success',
        message: 'Test details saved. Check the terms again before opening.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(newLink);
      setState({ kind: 'success', message: 'Link copied.' });
    } catch {
      setState({
        kind: 'error',
        message: 'Copy did not work. Select the link in the box instead.',
      });
    }
  }

  async function approvePilotTerms() {
    if (!action) return;
    setState({ kind: 'sending', message: 'Approving these exact details…' });
    try {
      await sendMutation(`/api/admin/actions/${action.id}`, 'PATCH', {
        operation: 'approve-pilot-terms',
      });
      setState({
        kind: 'success',
        message:
          'These exact test details are approved. Changing them removes approval.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  async function togglePreview() {
    if (!action) return;
    if (
      action.isPreview &&
      !window.confirm(
        'Open this test to valid one-use links? Site sharing is a separate step.',
      )
    ) {
      return;
    }
    setState({
      kind: 'sending',
      message: action.isPreview ? 'Opening the test…' : 'Stopping replies…',
    });
    try {
      await sendMutation(`/api/admin/actions/${action.id}`, 'PATCH', {
        isPreview: !action.isPreview,
      });
      setState({
        kind: 'success',
        message: action.isPreview
          ? 'Valid one-use links can now reply.'
          : 'Replies are stopped. Unused links are stopped too. Fresh approval and links are needed to restart.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  async function revoke(inviteId: string) {
    setWorkingInviteId(inviteId);
    setState({ kind: 'sending', message: 'Stopping that link…' });
    try {
      const response = await fetch(`/api/admin/action-invites/${inviteId}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? 'The link could not be stopped.');
      }
      setState({ kind: 'success', message: 'Link stopped.' });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    } finally {
      setWorkingInviteId(null);
    }
  }

  if (!action) return null;

  return (
    <section className="pilot-control">
      <h2>First five people</h2>
      <p className="admin-warning">
        The test stays closed until every required line below is ready. Public
        site access and the domain are separate and are not changed here.
      </p>
      <details className="pilot-settings">
        <summary>Set pay, closing date and reviewer</summary>
        <p>
          Set these before making links. After any change, check that the invite
          words and approved terms still match.
        </p>
        <label htmlFor="pilot-compensation">
          Pay or unpaid terms
          <Textarea
            id="pilot-compensation"
            value={compensation}
            onChange={(event) => setCompensation(event.target.value)}
            minLength={10}
            maxLength={240}
            rows={2}
          />
        </label>
        <div className="form-two-column">
          <label htmlFor="pilot-reviewer">
            Person who checks the result
            <Input
              id="pilot-reviewer"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              minLength={2}
              maxLength={120}
            />
          </label>
          <label htmlFor="pilot-closing-date">
            Closing date
            <Input
              id="pilot-closing-date"
              type="date"
              value={reviewDate}
              onChange={(event) => setReviewDate(event.target.value)}
            />
          </label>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={savePilotSettings}
          disabled={
            state.kind === 'sending' ||
            !action.isPreview ||
            activeInviteCount > 0
          }
        >
          Save test details
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={approvePilotTerms}
          disabled={
            state.kind === 'sending' ||
            !action.isPreview ||
            activeInviteCount > 0 ||
            !pilotPrivacyReady ||
            !pilotInvitesAuthorized ||
            publicIntakeOpen ||
            !settingsMatchAction
          }
        >
          Approve these exact details
        </Button>
        {!settingsMatchAction && (
          <p className="admin-warning">Save these changes before approval.</p>
        )}
      </details>
      <details className="pilot-settings">
        <summary>Read the exact deal before approval</summary>
        <p>
          <strong>Job:</strong> {action.title}. {action.intendedOutput}
        </p>
        <p>
          <strong>Why:</strong> {action.whyItMatters}
        </p>
        <p>
          <strong>Time and place:</strong> {action.timeSize};{' '}
          {action.locationMode}.
        </p>
        <p>
          <strong>Pay:</strong> {action.compensation}
        </p>
        <p>
          <strong>People:</strong> owner {action.ownerName}; checker{' '}
          {action.reviewerName}; reply reader{' '}
          {pilotInviteAuthorization?.replyReader ?? 'not set'}.
        </p>
        <p>
          <strong>Places and closing date:</strong> {action.capacity} places;
          closes {action.reviewDate}.
        </p>
        <p>
          <strong>Questions:</strong>{' '}
          {action.responseQuestions.length > 0
            ? action.responseQuestions.join(' / ')
            : 'none set'}
        </p>
        <p>
          <strong>What counts:</strong> {action.evidenceRequired}
        </p>
        <p>
          <strong>When to stop:</strong> {action.stopCondition}
        </p>
        <p>
          <strong>Privacy:</strong>{' '}
          {pilotPrivacy
            ? `${pilotPrivacy.dataOwner}; ${pilotPrivacy.lawfulBasis}; ${pilotPrivacy.recipients}; reply within ${pilotPrivacy.replyTime}; delete full replies by ${pilotPrivacy.responseDeleteDate}.`
            : 'not fully set.'}
        </p>
        <p>
          <strong>Invitation decision:</strong>{' '}
          {pilotInviteAuthorization
            ? `${pilotInviteAuthorization.approvalReference}. ${pilotInviteAuthorization.recruitmentPlan}`
            : 'not authorised.'}
        </p>
      </details>
      <ul className="pilot-checklist">
        <li data-ready={Boolean(publicContactEmail)}>
          Public privacy contact: {publicContactEmail ?? 'missing'}
        </li>
        <li data-ready={pilotPrivacyReady}>
          Pilot privacy check: {pilotPrivacyReady ? 'recorded' : 'not recorded'}
        </li>
        <li data-ready={pilotInvitesAuthorized}>
          Real invitation permission:{' '}
          {pilotInvitesAuthorized ? 'authorised' : 'not authorised'}
        </li>
        <li data-ready={pilotTermsApproved}>
          Exact questions, pay, people, privacy and dates:{' '}
          {pilotTermsApproved ? 'approved' : 'not approved'}
        </li>
        <li data-ready={activeInviteCount > 0}>
          Unused one-use links: {activeInviteCount}
        </li>
        <li data-ready={action.isPreview || pilotRuntimeReady}>
          Replies:{' '}
          {action.isPreview
            ? 'locked'
            : pilotRuntimeReady
              ? 'open to valid links'
              : 'off — a safety check failed'}
        </li>
        <li data-ready={!publicIntakeOpen}>
          Other private forms: {publicIntakeOpen ? 'open' : 'closed'}
        </li>
      </ul>

      <div className="pilot-actions">
        <Button
          type="button"
          variant="outline"
          onClick={createLink}
          disabled={state.kind === 'sending' || !canMakeLink}
        >
          Make one one-use link
        </Button>
        <Button
          type="button"
          variant={action.isPreview ? 'default' : 'destructive'}
          onClick={togglePreview}
          disabled={state.kind === 'sending' || (action.isPreview && !canOpen)}
        >
          {action.isPreview ? 'Open test to valid links' : 'Stop replies now'}
        </Button>
        <span
          className={state.kind === 'error' ? 'admin-error' : ''}
          aria-live="polite"
        >
          {state.message}
        </span>
      </div>

      {newLink && (
        <div className="new-invite-link">
          <label htmlFor="new-pilot-link">
            Copy this now. The site database keeps only a scrambled copy.
          </label>
          <Input id="new-pilot-link" value={newLink} readOnly />
          <Button type="button" variant="outline" onClick={copyLink}>
            Copy link
          </Button>
        </div>
      )}

      <div className="admin-list invite-list">
        {invites.length === 0 ? (
          <p className="empty-ledger">No one-use links have been made.</p>
        ) : (
          invites.map((invite) => {
            const stateLabel = invite.usedAt
              ? 'used'
              : invite.revokedAt
                ? 'stopped'
                : invite.isExpired
                  ? 'expired'
                  : 'unused';
            return (
              <article className="admin-item" key={invite.id}>
                <p className="mini-label">{invite.id}</p>
                <h3>{stateLabel}</h3>
                <p>
                  Closes after{' '}
                  {new Date(
                    new Date(invite.expiresAt).getTime() - 1,
                  ).toLocaleDateString('en-GB', {
                    timeZone: 'Europe/London',
                    dateStyle: 'long',
                  })}
                </p>
                {stateLabel === 'unused' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => revoke(invite.id)}
                    disabled={workingInviteId === invite.id}
                  >
                    Stop this link
                  </Button>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function AppealEditor({ appeal }: { appeal: AdminAppeal }) {
  const router = useRouter();
  const [status, setStatus] = useState(appeal.status);
  const [decisionNote, setDecisionNote] = useState(appeal.decisionNote ?? '');
  const [state, setState] = useState<MutationState>(idleState);

  async function update() {
    setState({ kind: 'sending', message: 'Saving…' });
    try {
      await sendMutation(`/api/admin/appeals/${appeal.id}`, 'PATCH', {
        status,
        decisionNote,
      });
      setState({ kind: 'success', message: 'Review saved.' });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  return (
    <div className="admin-review-controls">
      <NativeSelect
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {['new', 'reviewing', 'resolved', 'declined'].map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Textarea
        value={decisionNote}
        onChange={(event) => setDecisionNote(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Private reasoned decision note"
      />
      <Button
        type="button"
        variant="outline"
        onClick={update}
        disabled={state.kind === 'sending'}
      >
        Save review
      </Button>
      <span
        className={state.kind === 'error' ? 'admin-error' : ''}
        aria-live="polite"
      >
        {state.message}
      </span>
    </div>
  );
}

function OutcomePublisher({ repairId }: { repairId: string }) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>(idleState);

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setState({ kind: 'sending', message: 'Publishing…' });
    try {
      const form = event.currentTarget;
      await sendMutation('/api/admin/outcomes', 'POST', {
        ...Object.fromEntries(new FormData(form).entries()),
        repairId,
      });
      form.reset();
      setState({
        kind: 'success',
        message: 'Outcome published to the public ledger.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed.',
      });
    }
  }

  return (
    <form className="admin-outcome-form" onSubmit={submit}>
      <div className="form-two-column">
        <label htmlFor="outcome-title">
          Title
          <Input
            id="outcome-title"
            name="title"
            minLength={5}
            maxLength={160}
            required
          />
        </label>
        <label htmlFor="outcome-confidence">
          Confidence
          <NativeSelect id="outcome-confidence" name="confidence" required>
            <NativeSelectOption value="claimed">Claimed</NativeSelectOption>
            <NativeSelectOption value="observed">Observed</NativeSelectOption>
            <NativeSelectOption value="independently_verified">
              Independently verified
            </NativeSelectOption>
          </NativeSelect>
        </label>
      </div>
      <label htmlFor="outcome-activity">
        Activity completed
        <Textarea
          id="outcome-activity"
          name="activity"
          minLength={20}
          maxLength={1500}
          rows={3}
          required
        />
      </label>
      <label htmlFor="outcome-effect">
        Observed effect
        <Textarea
          id="outcome-effect"
          name="observedEffect"
          minLength={20}
          maxLength={1500}
          rows={3}
          required
        />
      </label>
      <label htmlFor="outcome-evidence">
        Evidence and method
        <Textarea
          id="outcome-evidence"
          name="evidence"
          minLength={20}
          maxLength={2000}
          rows={4}
          required
        />
      </label>
      <div className="form-two-column">
        <label htmlFor="outcome-evidence-url">
          Public evidence URL (optional)
          <Input id="outcome-evidence-url" name="evidenceUrl" type="url" />
        </label>
        <label htmlFor="outcome-verifier">
          Verifier
          <Input
            id="outcome-verifier"
            name="verifierName"
            minLength={2}
            maxLength={120}
            required
          />
        </label>
      </div>
      <label htmlFor="outcome-benefit">
        Who benefited
        <Textarea
          id="outcome-benefit"
          name="whoBenefited"
          minLength={10}
          maxLength={1000}
          rows={3}
          required
        />
      </label>
      <label htmlFor="outcome-limit">
        What did not change
        <Textarea
          id="outcome-limit"
          name="whatDidNotChange"
          minLength={10}
          maxLength={1000}
          rows={3}
          required
        />
      </label>
      <label htmlFor="outcome-learning">
        Learning and next decision
        <Textarea
          id="outcome-learning"
          name="learning"
          minLength={10}
          maxLength={1500}
          rows={3}
          required
        />
      </label>
      <Button type="submit" disabled={state.kind === 'sending'}>
        Publish reviewed outcome
      </Button>
      <p
        className={state.kind === 'error' ? 'admin-error' : ''}
        aria-live="polite"
      >
        {state.message}
      </p>
    </form>
  );
}

function StewardPanel({
  repair,
  actions,
  briefs,
}: {
  repair: Repair;
  actions: ActionCard[];
  briefs: StewardBrief[];
}) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>(idleState);
  const nextAction = actions.find(
    (action) => action.status === 'ready' || action.status === 'offered',
  );
  async function generate() {
    setState({
      kind: 'sending',
      message: 'Preparing a public-data-only brief…',
    });
    try {
      await sendMutation('/api/admin/steward', 'POST', {
        repairSlug: repair.slug,
      });
      setState({
        kind: 'success',
        message: 'Draft ready below. Nothing was published.',
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'The steward failed.',
      });
    }
  }

  return (
    <section className="steward-panel" aria-labelledby="steward-title">
      <div className="steward-heading">
        <div>
          <p className="eyebrow">Finish line</p>
          <h2 id="steward-title">One useful move, then stop.</h2>
        </div>
        <p>
          This queue is deterministic and works without AI. DeepSeek Flash may
          draft a weekly brief from the public ledger only; a person must adopt,
          edit or discard it.
        </p>
      </div>
      <div className="finish-queue">
        <article>
          <p className="mini-label">Do next</p>
          <h3>
            {nextAction?.title ?? 'Review whether this repair should close'}
          </h3>
          <p>{nextAction?.intendedOutput ?? repair.desiredChange}</p>
        </article>
        <article>
          <p className="mini-label">Time box</p>
          <h3>{nextAction?.timeSize ?? '30 minutes'}</h3>
          <p>
            Review date {repair.reviewDate}. At that point, update, close or
            stop the repair rather than carrying it as invisible backlog.
          </p>
        </article>
        <article>
          <p className="mini-label">Definition of done</p>
          <h3>
            {nextAction?.evidenceRequired ??
              'A reasoned close-or-continue decision'}
          </h3>
          <p>{nextAction?.stopCondition ?? repair.safeguards}</p>
        </article>
      </div>
      <div className="steward-run-row">
        <Button
          type="button"
          onClick={generate}
          disabled={state.kind === 'sending'}
        >
          {state.kind === 'sending'
            ? 'Drafting…'
            : 'Ask DeepSeek Flash for a finishing brief'}
        </Button>
        <p
          className={state.kind === 'error' ? 'admin-error' : ''}
          aria-live="polite"
        >
          {state.message ||
            'No private proposal, contact detail, appeal or offer is sent.'}
        </p>
      </div>
      {briefs.length > 0 && (
        <div className="steward-briefs">
          {briefs.map((brief) => (
            <article className="steward-brief" key={brief.id}>
              <div className="ledger-card-meta">
                <span>{brief.status}</span>
                <span>{brief.model}</span>
                <span>
                  {new Date(brief.generatedAt).toLocaleString('en-GB')}
                </span>
              </div>
              <h3>{brief.nextAction}</h3>
              <p>{brief.summary}</p>
              <div>
                <p className="mini-label">Draft weekly update</p>
                <p>{brief.draftUpdate}</p>
              </div>
              {brief.blockers.length > 0 && (
                <div>
                  <p className="mini-label">Blockers</p>
                  <ul>
                    {brief.blockers.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.questions.length > 0 && (
                <div>
                  <p className="mini-label">Questions for a human</p>
                  <ul>
                    {brief.questions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <StatusEditor
                url={`/api/admin/steward/${brief.id}`}
                field="status"
                value={brief.status}
                options={['draft', 'adopted', 'discarded']}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminDashboard({
  repair,
  actions,
  actionInvites,
  actionResponses,
  retentionEvents,
  updates,
  proposals,
  appeals,
  stewardBriefs,
  publicContactEmail,
  pilotPrivacy,
  pilotPrivacyReady,
  pilotInviteAuthorization,
  pilotInvitesAuthorized,
  pilotTermsApproved,
  publicIntakeOpen,
}: {
  repair: AdminRepair;
  actions: ActionCard[];
  actionInvites: AdminActionInvite[];
  actionResponses: AdminActionResponse[];
  retentionEvents: AdminRetentionEvent[];
  updates: AdminRepairUpdate[];
  proposals: AdminProposal[];
  appeals: AdminAppeal[];
  stewardBriefs: StewardBrief[];
  publicContactEmail: string | null;
  pilotPrivacy: PilotPrivacyConfiguration | null;
  pilotPrivacyReady: boolean;
  pilotInviteAuthorization: PilotInviteAuthorization | null;
  pilotInvitesAuthorized: boolean;
  pilotTermsApproved: boolean;
  publicIntakeOpen: boolean;
}) {
  const pilotNeedsAttention =
    actionResponses.length > 0 ||
    actionInvites.some(
      (invite) => !invite.usedAt && !invite.revokedAt && !invite.isExpired,
    ) ||
    actions.some(
      (action) =>
        action.participationMode === 'direct_response' && !action.isPreview,
    );
  return (
    <div className="admin-dashboard">
      <MaintainerPanel
        repair={repair}
        actions={actions}
        updates={updates}
        pilotNeedsAttention={pilotNeedsAttention}
      />
      {repair.isPublished && (
        <>
          <PilotControls
            actions={actions}
            invites={actionInvites}
            publicContactEmail={publicContactEmail}
            pilotPrivacy={pilotPrivacy}
            pilotPrivacyReady={pilotPrivacyReady}
            pilotInviteAuthorization={pilotInviteAuthorization}
            pilotInvitesAuthorized={pilotInvitesAuthorized}
            pilotTermsApproved={pilotTermsApproved}
            publicIntakeOpen={publicIntakeOpen}
          />
          <StewardPanel
            repair={repair}
            actions={actions}
            briefs={stewardBriefs}
          />
        </>
      )}
      {repair.isPublished && (
        <section>
          <h2>Current repair</h2>
          <article className="admin-item">
            <p className="mini-label">{repair.id}</p>
            <h3>{repair.title}</h3>
            <StatusEditor
              url={`/api/admin/repairs/${repair.id}`}
              field="stage"
              value={repair.stage}
              options={[
                'listening',
                'framing',
                'acting',
                'checking',
                'closed',
                'stopped',
              ]}
            />
          </article>
          <div className="admin-list">
            {actions.map((action) => (
              <article className="admin-item" key={action.id}>
                <p className="mini-label">{action.id}</p>
                <h3>{action.title}</h3>
                <StatusEditor
                  url={`/api/admin/actions/${action.id}`}
                  field="status"
                  value={action.status}
                  options={[
                    'ready',
                    'offered',
                    'assigned',
                    'doing',
                    'review',
                    'verified',
                    'blocked',
                    'stopped',
                  ]}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {repair.isPublished && (
        <section>
          <h2>Job replies</h2>
          <p>
            Every full reply has its own erase-after time. Overdue replies are
            hidden before this page loads and the site then tries to erase them.
            The deletion log below stores only a count and dates, never answers.
          </p>
          {actionResponses.length > 0 && (
            <StopAndDeletePilotButton
              repairId={repair.id}
              replyCount={actionResponses.length}
            />
          )}
          {actionResponses.length === 0 ? (
            <p className="empty-ledger">No replies to the current job.</p>
          ) : (
            <div className="admin-list">
              {actionResponses.map((response) => (
                <article className="admin-item" key={response.id}>
                  <p className="mini-label">
                    {response.id} · {response.status} ·{' '}
                    {new Date(response.createdAt).toLocaleString('en-GB')}
                  </p>
                  <h3>{response.actionTitle}</h3>
                  <ol className="admin-response-list">
                    {response.questions.map((question, index) => (
                      <li key={question}>
                        <strong>{question}</strong>
                        <p>{response.answers[index]}</p>
                      </li>
                    ))}
                  </ol>
                  <p>
                    Private test consent:{' '}
                    {response.consentPrivateUse ? 'yes' : 'no'} · Adult
                    confirmed: {response.confirmedAdult ? 'yes' : 'no'}
                  </p>
                  <p>
                    Nameless public totals allowed:{' '}
                    {response.consentAnonymousSummary ? 'yes' : 'no'}
                  </p>
                  <p>
                    Full answer hidden and due to be erased after:{' '}
                    {new Date(response.deleteAfter).toLocaleString('en-GB')}
                  </p>
                  <StatusEditor
                    url={`/api/admin/action-responses/${response.id}`}
                    field="status"
                    value={response.status}
                    options={['new', 'reviewed', 'rejected']}
                  />
                  <DeleteResponseButton responseId={response.id} />
                </article>
              ))}
            </div>
          )}
          {retentionEvents.length > 0 && (
            <details>
              <summary>Deletion proof</summary>
              <ul className="admin-response-list">
                {retentionEvents.map((event) => (
                  <li key={event.id}>
                    {event.recordsDeleted} full repl
                    {event.recordsDeleted === 1 ? 'y' : 'ies'} deleted{' '}
                    {event.trigger === 'automatic'
                      ? 'by the site'
                      : 'by the owner'}{' '}
                    on {new Date(event.completedAt).toLocaleString('en-GB')}.
                    Deadline: {event.dueDate}.
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <section>
        <h2>Private proposals</h2>
        {proposals.length === 0 ? (
          <p className="empty-ledger">No private proposals.</p>
        ) : (
          <div className="admin-list">
            {proposals.map((proposal) => (
              <article className="admin-item" key={proposal.id}>
                <p className="mini-label">{proposal.id}</p>
                <h3>{proposal.workingTitle}</h3>
                <p>{proposal.problem}</p>
                <details>
                  <summary>Review full private record</summary>
                  <dl className="admin-record">
                    <div>
                      <dt>Affected groups</dt>
                      <dd>{proposal.affectedGroups}</dd>
                    </div>
                    <div>
                      <dt>Evidence state</dt>
                      <dd>{proposal.evidenceState}</dd>
                    </div>
                    <div>
                      <dt>Desired change</dt>
                      <dd>{proposal.desiredChange}</dd>
                    </div>
                    <div>
                      <dt>Smallest step</dt>
                      <dd>{proposal.firstStep}</dd>
                    </div>
                    <div>
                      <dt>Help needed</dt>
                      <dd>{proposal.helpNeeded}</dd>
                    </div>
                    <div>
                      <dt>Contact</dt>
                      <dd>{proposal.email ?? 'Not supplied'}</dd>
                    </div>
                    <div>
                      <dt>AI permission</dt>
                      <dd>
                        {proposal.consentAi ? 'Explicitly offered' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </details>
                <StatusEditor
                  url={`/api/admin/proposals/${proposal.id}`}
                  field="status"
                  value={proposal.status}
                  options={[
                    'new',
                    'reviewing',
                    'needs_information',
                    'declined',
                    'accepted',
                    'deleted',
                  ]}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Appeals and corrections</h2>
        {appeals.length === 0 ? (
          <p className="empty-ledger">No review requests.</p>
        ) : (
          <div className="admin-list">
            {appeals.map((appeal) => (
              <article className="admin-item" key={appeal.id}>
                <p className="mini-label">{appeal.requestType}</p>
                <h3>{appeal.itemReference}</h3>
                <p>{appeal.explanation}</p>
                <AppealEditor appeal={appeal} />
              </article>
            ))}
          </div>
        )}
      </section>

      {repair.isPublished && (
        <section>
          <h2>Publish a reviewed outcome</h2>
          <p className="admin-warning">
            This action is immediately public. Verify consent, evidence,
            confidence level and identifying detail before submitting.
          </p>
          <OutcomePublisher repairId={repair.id} />
        </section>
      )}
    </div>
  );
}
