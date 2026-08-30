'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { currentUpdateDraft, repairDraftNextStep } from '@/lib/admin-content';
import type { ActionCard, AdminRepair, AdminRepairUpdate } from '@/lib/types';

type Method = 'POST' | 'PATCH';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

async function mutate(url: string, method: Method, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    message?: string;
  };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? 'The draft could not be saved.');
  }
}

function WorkshopForm({
  children,
  url,
  method,
  buildBody,
  button,
  success = 'Saved. Loading the next small step…',
}: {
  children?: ReactNode;
  url: string;
  method: Method;
  buildBody: (data: FormData) => unknown;
  button: string;
  success?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setFailed(false);
    setMessage('Saving…');
    try {
      await mutate(url, method, buildBody(new FormData(form)));
      setMessage(success);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="maintainer-form" onSubmit={submit}>
      {children}
      <div className="maintainer-submit">
        <Button type="submit" disabled={sending}>
          {sending ? 'Saving…' : button}
        </Button>
        <span className={failed ? 'admin-error' : ''} aria-live="polite">
          {message}
        </span>
      </div>
    </form>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return <label htmlFor={htmlFor}>{children}</label>;
}

function ProblemStep({ repair }: { repair: AdminRepair }) {
  return (
    <WorkshopForm
      url={`/api/admin/repairs/${repair.id}`}
      method="PATCH"
      button="Save what is wrong"
      buildBody={(data) => ({
        operation: 'draft-problem',
        title: text(data, 'title'),
        summary: text(data, 'summary'),
        scope: text(data, 'scope'),
        affectedGroups: text(data, 'affectedGroups'),
        knownFacts: text(data, 'knownFacts'),
        unknowns: text(data, 'unknowns'),
        disputedClaims: text(data, 'disputedClaims'),
      })}
    >
      <Label htmlFor="draft-title">Short working title</Label>
      <Input id="draft-title" name="title" defaultValue={repair.title} />
      <Label htmlFor="draft-summary">What is going wrong?</Label>
      <Textarea
        id="draft-summary"
        name="summary"
        defaultValue={repair.summary}
      />
      <Label htmlFor="draft-scope">
        What is inside this repair—and outside it?
      </Label>
      <Textarea id="draft-scope" name="scope" defaultValue={repair.scope} />
      <Label htmlFor="draft-groups">Who is being held back?</Label>
      <Textarea
        id="draft-groups"
        name="affectedGroups"
        defaultValue={repair.affectedGroups}
      />
      <Label htmlFor="draft-facts">What do we know?</Label>
      <Textarea
        id="draft-facts"
        name="knownFacts"
        defaultValue={repair.knownFacts}
      />
      <Label htmlFor="draft-unknowns">What do we still need to check?</Label>
      <Textarea
        id="draft-unknowns"
        name="unknowns"
        defaultValue={repair.unknowns}
      />
      <Label htmlFor="draft-disputed">
        What is disputed? Write “None found” if none.
      </Label>
      <Textarea
        id="draft-disputed"
        name="disputedClaims"
        defaultValue={repair.disputedClaims}
      />
    </WorkshopForm>
  );
}

function ChangeStep({ repair }: { repair: AdminRepair }) {
  return (
    <WorkshopForm
      url={`/api/admin/repairs/${repair.id}`}
      method="PATCH"
      button="Save the change and smallest test"
      buildBody={(data) => ({
        operation: 'draft-change',
        desiredChange: text(data, 'desiredChange'),
        smallestTest: text(data, 'smallestTest'),
      })}
    >
      <Label htmlFor="draft-change">What would be fairer?</Label>
      <Textarea
        id="draft-change"
        name="desiredChange"
        defaultValue={repair.desiredChange}
      />
      <Label htmlFor="draft-test">What is the smallest honest test?</Label>
      <Textarea
        id="draft-test"
        name="smallestTest"
        defaultValue={repair.smallestTest}
      />
    </WorkshopForm>
  );
}

function GuardStep({ repair }: { repair: AdminRepair }) {
  return (
    <WorkshopForm
      url={`/api/admin/repairs/${repair.id}`}
      method="PATCH"
      button="Save people, safety and date"
      buildBody={(data) => ({
        operation: 'draft-guard',
        safeguards: text(data, 'safeguards'),
        ownerName: text(data, 'ownerName'),
        partnerName: text(data, 'partnerName'),
        reviewDate: text(data, 'reviewDate'),
      })}
    >
      <Label htmlFor="draft-safety">How will people be kept safe?</Label>
      <Textarea
        id="draft-safety"
        name="safeguards"
        defaultValue={repair.safeguards}
      />
      <Label htmlFor="draft-owner">Who owns the next move?</Label>
      <Input
        id="draft-owner"
        name="ownerName"
        defaultValue={repair.ownerName}
      />
      <Label htmlFor="draft-partner">
        Which affected group or partner checks this?
      </Label>
      <Input
        id="draft-partner"
        name="partnerName"
        defaultValue={repair.partnerName ?? ''}
      />
      <Label htmlFor="draft-review">When must it be checked?</Label>
      <Input
        id="draft-review"
        name="reviewDate"
        type="date"
        defaultValue={repair.reviewDate}
      />
    </WorkshopForm>
  );
}

function ActionBasicsStep({ action }: { action: ActionCard }) {
  return (
    <WorkshopForm
      url={`/api/admin/actions/${action.id}`}
      method="PATCH"
      button="Save the job"
      buildBody={(data) => ({
        operation: 'draft-basics',
        title: text(data, 'title'),
        intendedOutput: text(data, 'intendedOutput'),
        whyItMatters: text(data, 'whyItMatters'),
        timeSize: text(data, 'timeSize'),
        compensation: text(data, 'compensation'),
      })}
    >
      <Label htmlFor="job-title">What is the small job?</Label>
      <Input id="job-title" name="title" defaultValue={action.title} />
      <Label htmlFor="job-output">What must exist when it is done?</Label>
      <Textarea
        id="job-output"
        name="intendedOutput"
        defaultValue={action.intendedOutput}
      />
      <Label htmlFor="job-why">Why does this help the repair?</Label>
      <Textarea
        id="job-why"
        name="whyItMatters"
        defaultValue={action.whyItMatters}
      />
      <Label htmlFor="job-time">How long should it take?</Label>
      <Input id="job-time" name="timeSize" defaultValue={action.timeSize} />
      <Label htmlFor="job-pay">Paid, expenses or unpaid?</Label>
      <Input
        id="job-pay"
        name="compensation"
        defaultValue={
          action.compensation === 'Pay not set — job cannot open'
            ? ''
            : action.compensation
        }
      />
    </WorkshopForm>
  );
}

function ActionGuardStep({ action }: { action: ActionCard }) {
  return (
    <WorkshopForm
      url={`/api/admin/actions/${action.id}`}
      method="PATCH"
      button="Save the job checks"
      buildBody={(data) => ({
        operation: 'draft-guard',
        skillsNeeded: text(data, 'skillsNeeded'),
        locationMode: text(data, 'locationMode'),
        ownerName: text(data, 'ownerName'),
        reviewerName: text(data, 'reviewerName'),
        capacity: Number(text(data, 'capacity')),
        evidenceRequired: text(data, 'evidenceRequired'),
        reviewDate: text(data, 'reviewDate'),
        stopCondition: text(data, 'stopCondition'),
      })}
    >
      <Label htmlFor="job-skills">What skill is needed?</Label>
      <Input
        id="job-skills"
        name="skillsNeeded"
        defaultValue={action.skillsNeeded}
      />
      <Label htmlFor="job-place">Where can it be done?</Label>
      <Input
        id="job-place"
        name="locationMode"
        defaultValue={action.locationMode}
      />
      <Label htmlFor="job-owner">Who owns it?</Label>
      <Input id="job-owner" name="ownerName" defaultValue={action.ownerName} />
      <Label htmlFor="job-checker">Who checks it?</Label>
      <Input
        id="job-checker"
        name="reviewerName"
        defaultValue={action.reviewerName}
      />
      <Label htmlFor="job-places">How many people or replies?</Label>
      <Input
        id="job-places"
        name="capacity"
        type="number"
        min="1"
        max="10"
        defaultValue={action.capacity}
      />
      <Label htmlFor="job-proof">What proof says it is done?</Label>
      <Textarea
        id="job-proof"
        name="evidenceRequired"
        defaultValue={action.evidenceRequired}
      />
      <Label htmlFor="job-review">When is it checked?</Label>
      <Input
        id="job-review"
        name="reviewDate"
        type="date"
        defaultValue={action.reviewDate}
      />
      <Label htmlFor="job-stop">When must it stop?</Label>
      <Textarea
        id="job-stop"
        name="stopCondition"
        defaultValue={action.stopCondition}
      />
    </WorkshopForm>
  );
}

function PublishRepairStep({
  repair,
  action,
}: {
  repair: AdminRepair;
  action: ActionCard;
}) {
  const publicationGuard = repair.publicationGuard;
  if (!publicationGuard) {
    return (
      <p className="admin-warning">
        The exact preview could not be locked. Reload this page before
        publishing.
      </p>
    );
  }
  return (
    <>
      <div
        className="maintainer-preview"
        data-publication-revision={publicationGuard.revision}
        data-publication-snapshot={publicationGuard.snapshotHash}
      >
        <p className="mini-label">
          Public words and behaviour — check each line
        </p>
        <h3>{repair.title}</h3>
        <p>{repair.summary}</p>
        <dl className="maintainer-public-words">
          <div>
            <dt>Public address</dt>
            <dd>/repairs/{repair.slug}</dd>
          </div>
          <div>
            <dt>Repair reference</dt>
            <dd>{repair.id}</dd>
          </div>
          <div>
            <dt>Starting stage</dt>
            <dd>acting</dd>
          </div>
          <div>
            <dt>Made-up example?</dt>
            <dd>{repair.isDemo ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Lead</dt>
            <dd>{repair.ownerName}</dd>
          </div>
          <div>
            <dt>Group we work with</dt>
            <dd>{repair.partnerName}</dd>
          </div>
          <div>
            <dt>Check again</dt>
            <dd>{repair.reviewDate}</dd>
          </div>
          <div>
            <dt>Where this happens</dt>
            <dd>{repair.scope}</dd>
          </div>
          <div>
            <dt>Who gets hurt or shut out</dt>
            <dd>{repair.affectedGroups}</dd>
          </div>
          <div>
            <dt>What we know</dt>
            <dd>{repair.knownFacts}</dd>
          </div>
          <div>
            <dt>What we do not know</dt>
            <dd>{repair.unknowns}</dd>
          </div>
          <div>
            <dt>What people do not agree on</dt>
            <dd>{repair.disputedClaims}</dd>
          </div>
          <div>
            <dt>What better would look like</dt>
            <dd>{repair.desiredChange}</dd>
          </div>
          <div>
            <dt>What we will try first</dt>
            <dd>{repair.smallestTest}</dd>
          </div>
          <div>
            <dt>How we keep people safe — and when we stop</dt>
            <dd>{repair.safeguards}</dd>
          </div>
          <div>
            <dt>Small job</dt>
            <dd>{action.title}</dd>
          </div>
          <div>
            <dt>Job reference</dt>
            <dd>{action.id}</dd>
          </div>
          <div>
            <dt>Job belongs to</dt>
            <dd>{action.repairId}</dd>
          </div>
          <div>
            <dt>Job starts</dt>
            <dd>stopped — nobody can volunteer yet</dd>
          </div>
          <div>
            <dt>How people take part</dt>
            <dd>offer — no reply form or questions</dd>
          </div>
          <div>
            <dt>What the job must make</dt>
            <dd>{action.intendedOutput}</dd>
          </div>
          <div>
            <dt>Why it matters</dt>
            <dd>{action.whyItMatters}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{action.timeSize}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{action.locationMode}</dd>
          </div>
          <div>
            <dt>Pay</dt>
            <dd>{action.compensation}</dd>
          </div>
          <div>
            <dt>People needed</dt>
            <dd>{action.capacity}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{action.skillsNeeded}</dd>
          </div>
          <div>
            <dt>Job owner</dt>
            <dd>{action.ownerName}</dd>
          </div>
          <div>
            <dt>Job checker</dt>
            <dd>{action.reviewerName}</dd>
          </div>
          <div>
            <dt>Check job by</dt>
            <dd>{action.reviewDate}</dd>
          </div>
          <div>
            <dt>How we know it is done</dt>
            <dd>{action.evidenceRequired}</dd>
          </div>
          <div>
            <dt>When the job must stop</dt>
            <dd>{action.stopCondition}</dd>
          </div>
        </dl>
      </div>
      <WorkshopForm
        url={`/api/admin/repairs/${repair.id}`}
        method="PATCH"
        button="Make this repair visible"
        success="Repair published. Its job stays stopped until you open it."
        buildBody={(data) => ({
          operation: 'publish-draft',
          noPrivateDetails: data.get('noPrivateDetails') === 'on',
          humanReviewed: data.get('humanReviewed') === 'on',
          covenantAligned: data.get('covenantAligned') === 'on',
          expectedRevision: publicationGuard.revision,
          expectedSnapshotHash: publicationGuard.snapshotHash,
        })}
      >
        <label className="maintainer-check">
          <input type="checkbox" name="noPrivateDetails" />
          The preview contains no private case details.
        </label>
        <label className="maintainer-check">
          <input type="checkbox" name="humanReviewed" />
          A person checked every public field shown above.
        </label>
        <label className="maintainer-check">
          <input type="checkbox" name="covenantAligned" />
          The repair follows the fairness covenant and rejects pile-ons.
        </label>
      </WorkshopForm>
    </>
  );
}

function RepairDraftWorkflow({
  repair,
  actions,
}: {
  repair: AdminRepair;
  actions: ActionCard[];
}) {
  const step = repairDraftNextStep(repair, actions);
  const action = actions[0];
  const headings = {
    problem: ['1 of 7', 'Say what is wrong.'],
    change: ['2 of 7', 'Say what better looks like.'],
    guard: ['3 of 7', 'Name the people, safety and date.'],
    'start-action': ['4 of 7', 'Make one small job.'],
    'action-basics': ['5 of 7', 'Say exactly what the job makes.'],
    'action-guard': ['6 of 7', 'Add proof and a stop rule.'],
    publish: ['7 of 7', 'Read it once, then choose.'],
  } as const;
  const heading = step ? headings[step] : null;

  return (
    <section className="maintainer-panel" aria-labelledby="maintainer-title">
      <p className="eyebrow">Do this next · {heading?.[0]}</p>
      <h2 id="maintainer-title">{heading?.[1]}</h2>
      <p>
        This repair is private. Only the one step below matters now; saving it
        brings up the next one.
      </p>
      {step === 'problem' && <ProblemStep repair={repair} />}
      {step === 'change' && <ChangeStep repair={repair} />}
      {step === 'guard' && <GuardStep repair={repair} />}
      {step === 'start-action' && (
        <WorkshopForm
          url="/api/admin/actions"
          method="POST"
          button="Start the first job"
          buildBody={() => ({ repairId: repair.id })}
        />
      )}
      {step === 'action-basics' && action && (
        <ActionBasicsStep action={action} />
      )}
      {step === 'action-guard' && action && <ActionGuardStep action={action} />}
      {step === 'publish' && action && (
        <PublishRepairStep repair={repair} action={action} />
      )}
    </section>
  );
}

function UpdateDraftForm({
  repair,
  draft,
}: {
  repair: AdminRepair;
  draft: AdminRepairUpdate | null;
}) {
  const method: Method = draft ? 'PATCH' : 'POST';
  const url = draft ? `/api/admin/updates/${draft.id}` : '/api/admin/updates';
  return (
    <WorkshopForm
      url={url}
      method={method}
      button={draft ? 'Save private update draft' : 'Make private update draft'}
      buildBody={(data) => ({
        repairId: repair.id,
        title: text(data, 'title'),
        body: text(data, 'body'),
        evidenceChanged: text(data, 'evidenceChanged'),
        remainsUnfair: text(data, 'remainsUnfair'),
        nextOwner: text(data, 'nextOwner'),
        nextReviewDate: text(data, 'nextReviewDate'),
      })}
    >
      <Label htmlFor="update-title">Short update title</Label>
      <Input id="update-title" name="title" defaultValue={draft?.title ?? ''} />
      <Label htmlFor="update-body">What happened?</Label>
      <Textarea id="update-body" name="body" defaultValue={draft?.body ?? ''} />
      <Label htmlFor="update-evidence">What new proof do we have?</Label>
      <Textarea
        id="update-evidence"
        name="evidenceChanged"
        defaultValue={draft?.evidenceChanged ?? ''}
      />
      <Label htmlFor="update-unfair">What is still unfair?</Label>
      <Textarea
        id="update-unfair"
        name="remainsUnfair"
        defaultValue={draft?.remainsUnfair ?? ''}
      />
      <Label htmlFor="update-owner">Who owns the next move?</Label>
      <Input
        id="update-owner"
        name="nextOwner"
        defaultValue={draft?.nextOwner ?? repair.ownerName}
      />
      <Label htmlFor="update-review">When must it be checked again?</Label>
      <Input
        id="update-review"
        name="nextReviewDate"
        type="date"
        defaultValue={draft?.nextReviewDate ?? repair.reviewDate}
      />
    </WorkshopForm>
  );
}

function PublishedWorkflow({
  repair,
  actions,
  updates,
  pilotNeedsAttention,
}: {
  repair: AdminRepair;
  actions: ActionCard[];
  updates: AdminRepairUpdate[];
  pilotNeedsAttention: boolean;
}) {
  const action = actions[0];
  const draft = currentUpdateDraft(updates);
  const draftPublicationGuard = draft?.publicationGuard ?? null;
  const actionNeedsOpening =
    action?.status === 'stopped' &&
    repair.stage !== 'closed' &&
    repair.stage !== 'stopped';
  const canStartAnotherRepair =
    repair.stage === 'closed' || repair.stage === 'stopped';

  if (pilotNeedsAttention) {
    return (
      <section className="maintainer-panel" aria-labelledby="maintainer-title">
        <p className="eyebrow">Do this next</p>
        <h2 id="maintainer-title">Check the live reply test.</h2>
        <p>
          Use the “First five people” and “Job replies” boxes below. Review,
          stop or erase what needs attention before starting another repair.
        </p>
      </section>
    );
  }

  return (
    <section className="maintainer-panel" aria-labelledby="maintainer-title">
      <p className="eyebrow">Do this next</p>
      <h2 id="maintainer-title">
        {draft
          ? 'Read the private update. Then choose.'
          : actionNeedsOpening
            ? 'Open the first small job when people are ready.'
            : 'Keep one honest update ready.'}
      </h2>
      {actionNeedsOpening && action ? (
        <>
          <p>
            {action.title}. Check its owner, checker, pay and stop rule below.
            Opening it makes it a real commitment.
          </p>
          <WorkshopForm
            url={`/api/admin/actions/${action.id}`}
            method="PATCH"
            button="Mark the first job ready"
            success="The job is ready."
            buildBody={() => ({ status: 'ready' })}
          />
        </>
      ) : (
        <UpdateDraftForm repair={repair} draft={draft} />
      )}
      {draft &&
        (draftPublicationGuard ? (
          <>
            <div
              className="maintainer-preview"
              data-publication-revision={draftPublicationGuard.revision}
              data-publication-snapshot={draftPublicationGuard.snapshotHash}
            >
              <p className="mini-label">Exact public preview</p>
              <h3>{draft.title}</h3>
              <p>{draft.body}</p>
              <p>
                <strong>New proof:</strong> {draft.evidenceChanged}
              </p>
              <p>
                <strong>Still unfair:</strong> {draft.remainsUnfair}
              </p>
              <p>
                <strong>Next:</strong> {draft.nextOwner}, checked{' '}
                {draft.nextReviewDate}.
              </p>
            </div>
            <WorkshopForm
              url={`/api/admin/updates/${draft.id}`}
              method="PATCH"
              button="Make this update visible"
              buildBody={(data) => ({
                operation: 'publish',
                noPrivateDetails: data.get('noPrivateDetails') === 'on',
                humanReviewed: data.get('humanReviewed') === 'on',
                expectedRevision: draftPublicationGuard.revision,
                expectedSnapshotHash: draftPublicationGuard.snapshotHash,
              })}
            >
              <label className="maintainer-check">
                <input type="checkbox" name="noPrivateDetails" />
                The update contains no private case details.
              </label>
              <label className="maintainer-check">
                <input type="checkbox" name="humanReviewed" />
                A person checked every public word.
              </label>
            </WorkshopForm>
          </>
        ) : (
          <p className="admin-warning">
            The exact update preview could not be locked. Reload this page
            before publishing.
          </p>
        ))}
      {!draft && actionNeedsOpening && (
        <details className="maintainer-secondary">
          <summary>Write an update instead</summary>
          <UpdateDraftForm repair={repair} draft={null} />
        </details>
      )}
      {canStartAnotherRepair ? (
        <details className="maintainer-secondary">
          <summary>Start one new private repair</summary>
          <p>Only one unfinished repair draft is allowed at a time.</p>
          <WorkshopForm
            url="/api/admin/repairs"
            method="POST"
            button="Start private repair draft"
            buildBody={(data) => ({
              title: text(data, 'title'),
              summary: text(data, 'summary'),
            })}
          >
            <Label htmlFor="new-repair-title">Working title</Label>
            <Input id="new-repair-title" name="title" />
            <Label htmlFor="new-repair-summary">What is going wrong?</Label>
            <Textarea id="new-repair-summary" name="summary" />
          </WorkshopForm>
        </details>
      ) : (
        <p className="maintainer-secondary">
          Finish, close or stop this repair before starting another one.
        </p>
      )}
    </section>
  );
}

export function MaintainerPanel({
  repair,
  actions,
  updates,
  pilotNeedsAttention,
}: {
  repair: AdminRepair;
  actions: ActionCard[];
  updates: AdminRepairUpdate[];
  pilotNeedsAttention: boolean;
}) {
  return repair.isPublished ? (
    <PublishedWorkflow
      repair={repair}
      actions={actions}
      updates={updates}
      pilotNeedsAttention={pilotNeedsAttention}
    />
  ) : (
    <RepairDraftWorkflow repair={repair} actions={actions} />
  );
}
