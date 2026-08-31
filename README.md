# Coding for Justice

The dynamic site is live at
[codingforjustice.org.uk](https://codingforjustice.org.uk). OpenAI Sites hosts
the application and managed database. GitHub keeps the source and release
history, but no longer hosts the public website.

The Sites hosting preview link remains off. Separately, the five-person test
action remains a locked preview inside the protected workshop.

Coding for Justice is a public fairness repair workshop: take one unfair form,
rule or service that keeps causing trouble, try one small repair and show
honestly what happened.

## Phase one

The public site shows the process, a labelled made-up example, the community
covenant and clear safety boundaries. The proposal, offer, review and private
page-test forms remain closed.

The first prepared test asks five fresh readers whether the home page explains
the name, goal and next step, and whether it feels warm. The owner has approved
the recruitment rules and ask-first message. The exact pilot terms are not yet
approved in the protected workshop, no one-use link exists and no answer has
been collected.

The protected work area includes a one-next-job finish list and an optional
DeepSeek Flash helper. The model sees public repair fields only and can create
private drafts. It cannot read private answers or publish anything.

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md), [the marketing
plan](docs/MARKETING_PLAN.md) and [the first-five runbook](docs/PILOT_RUNBOOK.md).
Human choices are recorded in [the launch decision
register](docs/LAUNCH_DECISIONS.md).

## Retention safety

A separate route-less Cloudflare Worker calls the Site's private deletion route
every 15 minutes. It has no public or preview web address. Unattended runs have
completed successfully, and normal Site requests repeat the deletion check as a
backup.

The checked timer evidence is in [the Cloudflare timer
record](docs/CLOUDFLARE_CANARY.md). The small weekly and monthly routine is in
[maintenance](docs/MAINTENANCE.md).

## Local development

Install dependencies, apply the local D1 migrations and use the scripts in
`package.json`.

Private submissions must never be copied into fixtures, logs, screenshots or
external AI tools.
