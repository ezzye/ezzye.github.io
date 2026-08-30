# Coding for Justice

The new site is still owner-only. The live public domain still points to the old
GitHub Pages site. No real pilot or private intake form is open.

Coding for Justice is being built as a public fairness repair workshop: bring
one unfair process that keeps happening, test a small repair and show what
actually happened.

## Phase one

Phase one prepares a public list of repairs and results, small jobs with clear
limits, private forms that stay locked until they are ready, the community
covenant and a protected owner work area. It deliberately excludes public
comments, popularity ranking, uploads, legal casework and automatic AI
publication.

The protected work area also includes a one-next-job finish list and an optional
DeepSeek Flash helper. The model sees public repair fields only and can create
private drafts; it cannot read private answers or publish anything.

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) and [the marketing plan](docs/MARKETING_PLAN.md).

The owner-only rehearsal and any later, separately authorised five-person test
use [the first-five runbook](docs/PILOT_RUNBOOK.md). Human choices are recorded
in [the launch decision register](docs/LAUNCH_DECISIONS.md). The separately
approved domain move and rollback steps are in
[the public cutover plan](docs/PUBLIC_CUTOVER.md).

## Local development

Install dependencies, apply the local D1 migration and run the development server using the scripts in `package.json`.

Private submissions must never be copied into fixtures, logs, screenshots or external AI tools.
