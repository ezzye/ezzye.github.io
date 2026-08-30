# Coding for Justice phase-one implementation plan

## Where we are now

- Done: the dynamic Site, managed database, protected workshop, warm home page,
  first page-test rehearsal and owner-only deployment.
- Done: replies are off by default; capacity, closing date, consent and permanent
  reply deletion are enforced by the server.
- Done: outside proposal, offer and review forms now stay shut unless a public
  contact and an explicit intake setting are present.
- Done: the first test uses action-bound, expiring, one-use links. Only scrambled
  link values are stored.
- Done: a throw-away local-database rehearsal proved that the protected
  workshop can hold one private repair draft, build one bounded first job, keep
  that job stopped when the repair is published, and hold one weekly update
  privately until a separate publish choice.
- Done: a self-contained route rehearsal checks the exact owner workflow, and a
  separate built-Worker rehearsal checks the scheduled deletion job against a
  throw-away database. This is local proof, not proof that hosted scheduling is
  running.
- Not proved: the owner-only Site has not recorded an automatic hosted deletion
  heartbeat. A separate, route-less Cloudflare timer test is prepared in
  [CLOUDFLARE_CANARY.md](CLOUDFLARE_CANARY.md). It can test direct Cloudflare
  scheduling with an empty database; it cannot stand in for proof from Sites or
  approve public access.
- Done: full test replies carry a non-extendable deletion deadline. Overdue
  replies fail closed, the next site request tries to erase them, and the owner
  can stop the reply job and erase every full reply early. The retained deletion
  proof contains counts and dates, not answers.
- Not proved: no partner-backed repair has run and no fairness outcome has been
  achieved. The rehearsal proves maintenance machinery, not social impact or
  readiness for public launch.
- Next: the owner must complete and approve the choices in
  [LAUNCH_DECISIONS.md](LAUNCH_DECISIONS.md). Until then the real test stays
  locked.
- Prepared, not authorised: the current GitHub route, exact pending Sites DNS
  values, staged public-access approval, rollback triggers and maintenance
  routine are recorded in [PUBLIC_CUTOVER.md](PUBLIC_CUTOVER.md) and
  [PUBLIC_RELEASE_PACKET.md](PUBLIC_RELEASE_PACKET.md). The old GitHub
  custom-domain HTTPS fallback is broken and must be repaired or replaced
  before DNS approval.

The day-to-day pilot steps are in [PILOT_RUNBOOK.md](PILOT_RUNBOOK.md).
The low-effort upkeep routine is in [MAINTENANCE.md](MAINTENANCE.md).

## Outcome

Phase one turns Coding for Justice from a static statement into a small fairness repair workshop. It must prove one complete loop:

`listen → frame → act → check → publish → review`

The site succeeds when one partner-backed repair is adopted, deliberately changed, or stopped for an evidence-backed reason. Traffic and reaction counts are not success measures.

## Users and jobs

- A community organisation brings one recurring administrative or digital barrier.
- An affected person helps define the problem and judge the result without having to publish a personal story.
- A contributor offers one bounded skill or task rather than joining an endless volunteer queue.
- A service owner can see the evidence, respond and own a next step.
- The founder can triage private proposals, change public workflow state and publish an outcome without editing code.

## Phase-one product

### Public

- Homepage with one current repair, one useful action and one outcome.
- Repair ledger showing what is known, unknown and disputed.
- Action cards with time, output, owner, reviewer and completion evidence.
- Outcome ledger distinguishing activity, observed effect and independent verification.
- Covenant, moderation, correction, privacy and appeal routes.
- Closed-by-default private forms for proposing a repair, offering help and
  requesting a review.
- A clearly labelled fictional demonstration until the first partner repair passes the launch gate.

### Protected

- ChatGPT sign-in for the review area.
- An explicit administrator email allowlist configured in hosting.
- Proposal and appeal triage.
- Repair and action state updates.
- A one-thing-at-a-time editor for a private repair frame, its first stopped job
  and one private weekly update, with every public field shown before human
  publish checks.
- Human-reviewed outcome publication.
- A finish queue that reduces the current repair to one bounded next action.
- An optional DeepSeek Flash steward that drafts a weekly brief from public
  ledger data only; every result remains private until a human adopts it.

### Deliberately absent

- Public accounts, comments, likes, follower counts or popularity ranking.
- Direct messages, public accusation walls or file uploads.
- Legal advice, emergency handling or whistleblowing.
- Automatic AI publication or transfer of private submissions, offers, appeals
  or contact details to another provider.
- Open youth mentoring, payments or a general volunteer marketplace.

## Data boundaries

Public repair data is separate from private submissions. A proposal never
becomes public automatically. Repairs, updates and results use an exact private
preview and revision-bound human approval. In phase one, a public result must
stand on a public HTTPS evidence page that can be opened without signing in.
Private test replies cannot be selected, summarised or used as the source of a
published result. Ending a private test and deleting its full replies is a
separate job from writing any public result.

The intake does not request addresses, credentials, identity numbers, case numbers or detailed medical, financial, immigration or legal records. Phase one accepts public source links but no uploads. Private data is stored in the managed database and deleted according to the published retention rule.

## Technical shape

- Server-rendered React application using the OpenAI Sites runtime.
- Managed D1 database for repairs, actions, outcomes and private intake records.
- A separate Cloudflare Worker/D1 package for a made-up-data timer test. It is
  not deployed, has no public-domain route and never copies the Sites database.
- A 15-minute scheduled deletion check, with the same deletion check on page
  requests as a backup and a content-free heartbeat visible to the owner.
- Dispatch-owned ChatGPT sign-in for the protected review area.
- Server-side validation, request-size limits, honeypots and rate limiting on public forms.
- Human-readable URLs and server-rendered content for resilience and search.
- Optional `deepseek-v4-flash` server-side drafting behind the protected workshop.
  It receives only an explicit allowlist of already-public repair, action,
  update and outcome fields. Owner-only approvals, recruitment plans, reply
  readers and private intake records cannot enter its payload. It is limited to
  three runs per repair per day and cannot publish.
- A deterministic finish queue remains available when no model credential is configured.

## Delivery stages

### Stage 1 — safe foundation

- Publish the covenant and operating boundaries.
- Add the fictional demonstration repair and outcome.
- Make all public and private record types explicit.
- Validate accessibility, privacy language and moderation routes.
- Configure the model secret only after the private deployment passes review;
  never put it in source control or browser code.

### Stage 2 — partner-gated proof

- Hold six discovery conversations from 20–25 tailored invitations.
- Select one repeatable process with an affected-person reviewer and an adoption owner.
- Replace the demonstration as the homepage lead only after consent, evidence and publication review.
- Run one 90-day repair with a weekly Workshop Note and dated Repair Receipt.

### Stage 3 — decision

- Continue if there is a useful outcome or meaningful institutional response, safe contributor experience, a maintenance owner and sustainable founder workload.
- Iterate if the process is useful but the intervention fails.
- Stop or narrow if demand becomes individual casework, safety cannot be maintained or no institution will own a response.

## Repository and hosting migration

- Preserve `ezzye/ezzye.github.io` `master` and legacy commit `a511d1455720fc18082c85caf0d81570a694c829` as the rollback baseline.
- Put the new application on a separate review branch before any Pages change.
- Deploy to managed hosting and verify its generated URL before touching DNS.
- Preserve every old public content route or redirect it to a labelled archive;
  the source-backed inventory is in [LEGACY_URLS.md](LEGACY_URLS.md).
- Treat [PUBLIC_CUTOVER.md](PUBLIC_CUTOVER.md) as the one authoritative DNS
  record, cutover and rollback plan. It requires an exact before/after diff from
  Sites before approval and preserves every mail, nameserver and unrelated TXT
  record.
- Do not turn the Cloudflare timer test into a public host by drift. A future
  Cloudflare public-hosting choice would need a fresh plan for the whole DNS
  zone, access and rollback. The Sites record values cannot approve it.

## Launch gate

Do not replace the fictional repair with a real one until all are true:

- one partner and one responsible owner are named;
- an affected-person reviewer has decision rights;
- the scope excludes emergencies, active legal cases and uncontrolled sensitive data;
- the baseline and desired change are measurable;
- the publication and consent agreement is complete;
- the maintenance or hand-off owner is known;
- the covenant, correction and appeal routes have been tested.

## Acceptance criteria

- The first mobile viewport explains the proposition and shows a current repair.
- A reader can follow repair → action → outcome and distinguish known, unknown and verified claims.
- Forms remain private, preserve accessible error messages and never auto-publish.
- An authorised reviewer can triage submissions and change workflow states without a redeploy.
- The finish queue always names one next output, time-box, evidence requirement
  and stop condition; model-assisted briefs are visibly drafts.
- Every action has an owner, evidence requirement, review date and stop condition.
- A private repair and its first job do not appear in public reads before
  publication; publishing the repair leaves that job stopped.
- Only one active repair, one unfinished repair draft and one unfinished update
  draft are allowed. An update stays private until its own human-reviewed
  publish choice.
- Every outcome states what changed, what did not and the confidence level.
- Every phase-one outcome names its public evidence and never depends on a
  private reply.
- No engagement ranking, public comments or private-data exposure exists.
- Build, keyboard, reflow, contrast, HTTPS, security-header and legacy-route checks pass before cutover.
