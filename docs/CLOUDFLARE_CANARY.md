# Cloudflare retention timer record

This evidence record does not give permission to open invitations, collect
replies, publish a result or change DNS.

## Production Site timer result

**Healthy when last checked at 07:45:15 UTC on 31 August 2026.** The live Site
database showed the `action_responses` retention sweep had completed 42 times.
The latest run deleted zero records and had no latest error. The protected page
test still had zero invitations, zero responses and zero retention events.

The separate route-less Cloudflare Worker calls the Site's protected retention
route every 15 minutes using a shared secret. The Worker's public address,
version preview addresses and custom routes remain off. Normal Site requests
repeat the deletion check as a backup.

This proves that the production timer can reach the Site deletion path and
record a content-free heartbeat. It does not approve the exact page-test terms,
create a link, collect a reply or prove that a justice repair has worked.

## Earlier isolated timer result

**Passed on 30 August 2026.** After the full setup delay, Cloudflare ran the
route-less Worker at the 18:30 and 18:45 UTC slots without an error. The remote
test database heartbeat advanced once at each slot, nothing was deleted and
the reply, invitation, proposal, offer, appeal and retention-event counts all
remained zero.

The final live check found one 15-minute schedule, no custom routes or domains,
and both the production `workers.dev` address and version preview addresses
disabled. The account namespace exists only because Cloudflare requires it to
attach a Cron Trigger.

That earlier result proved direct Cloudflare scheduling only. It did not prove
the Site-linked timer, open invitations, make anything public or approve a DNS
change. Detailed live IDs and timestamped checkpoints remain in the local,
ignored evidence file.

The remaining isolated-test instructions are kept below as a historical and
repeatable safety record. They are not the current production architecture.

## What was the first test?

It was one small test. It asked: **will Cloudflare run our automatic deletion job
every 15 minutes?**

## Why was it useful?

Two unattended runs showed that Cloudflare could run the Worker timer when it
was deployed directly. That found hosting faults before any private reply was
accepted.

That test did not prove the later Site-linked path and did not unlock
invitations.

## What do I do?

Nothing is required during ordinary Site use. A maintainer runs this only after
the owner approves the exact private test and Cloudflare is connected.

The safe order is:

1. Check that the Cloudflare account already has a `workers.dev` account
   namespace. Cloudflare requires the namespace before it will attach a Cron
   Trigger, even when this Worker's own `workers.dev` route is off. If it is
   missing, stop and ask before creating it: that is a separate account change.
   Never turn on this Worker's route or preview URLs.
2. Create a new Worker and a new empty D1 test database. Never copy the Sites
   database.
3. Apply the normal migrations and check the exact code-owned fixtures. A fresh
   database contains repairs `CFJ-R001` and `CFJ-R002` and actions `CFJ-A001`
   through `CFJ-A004`. `CFJ-R002` is marked non-demo because it is the private
   home-page preview, but it is still fixed source content with no participant
   data. There must be no replies, invitations, proposals, offers or appeals.
4. Deploy the Worker with its timer but **no web address**. Keep `workers.dev`
   off, preview addresses off and all domain routes absent.
5. Record the source commit, built package, Worker version, database name and
   starting heartbeat count.
6. Wait through Cloudflare's timer setup delay, then wait for two full
   15-minute slots. Do not press a test button and call that an automatic run.
7. Save two Cloudflare timer events and two database checks. The heartbeat must
   move forward twice, finish without an error and contain no reply text.
8. Stop if either run is missing, late or broken. Invitations stay shut.

That is the whole timer test. Owner web access is a later step, not part of the
first deployment.

## Keep it separate

- Use the same candidate source, but a separate Worker and throw-away database.
- Use made-up data only. No names, email addresses, private answers or copied
  Site records.
- Do not change the owner-only Site, its database or its access list.
- Do not change GitHub `master`, Hover, DNS, custom domains or the public site.
- Do not enable public intake, a pilot, invitations, outreach, real repair
  publication or DeepSeek settings.
- Keep preview addresses off. The first Worker has no HTTP route at all.

## A pass means

Both unattended timer runs must agree in two places:

- Cloudflare records a successful scheduled Worker run for the exact deployed
  version; and
- D1 shows the heartbeat count at least two higher, a recent completion time
  and no latest error.

For a stronger deletion test, add one carefully checked, already-due made-up
reply to the throw-away database. It must disappear without keeping its words
in logs or evidence. This is optional and needs its own checked seed step.

A pass proves direct Cloudflare scheduling only. Real invitations remain
locked. A later public move still needs a new hosting decision, a fresh release
packet and separate access and DNS approvals.

## Owner web check: only after the timer passes

If the owner separately approves a private web check:

1. Add a Cloudflare Access application for this exact Worker. Protect **All
   traffic** for the Worker itself, not “Previews only”.
2. Allow only the owner's exact email address. Do not use “Everyone”, an email
   domain rule or a bypass. Check the saved policy before enabling the web
   address.
3. Add the three ignored Worker secrets: `ADMIN_EMAIL`,
   `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`.
4. Build the same canary with the owner route explicitly enabled.
5. Check that an unsigned visitor, a different account and forged identity
   headers all fail. Check that the owner can open `/admin`.
6. Keep `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store`
   and preview addresses off.

The Worker checks the signed Access token itself. It never trusts identity
headers sent by a caller.

## Local package checks

These do not contact Cloudflare or deploy anything:

```sh
npm run verify:cloudflare-canary
```

The check builds a rehearsal package with a fake D1 ID, rejects the Sites
placeholder, proves there is no route, checks the timer and database paths, and
does a Wrangler dry run. It also checks the existing Sites mode. Run the normal
release check last so `dist/` returns to the Sites package:

```sh
npm run verify:release
```

For a real private timer package, the maintainer must first create the separate
D1 database, set its UUID only in the local shell and run:

```sh
CFJ_CLOUDFLARE_CANARY_DATABASE_ID=<separate-d1-uuid> npm run build:cloudflare-canary
npm run check:cloudflare-canary-package:real
```

The real build deliberately fails if the D1 UUID is absent, malformed, the
Sites placeholder or the rehearsal UUID. There is no one-command live deploy
script.

Every live database command must name the generated canary config and say
`--remote`. Without `--remote`, Wrangler may use a local throw-away database
and give false reassurance. The migration command is:

```sh
./node_modules/.bin/wrangler d1 migrations apply DB --remote \
  --config dist/server/wrangler.json
```

Use the same `DB --remote --config dist/server/wrangler.json` target for the
content-free fixture counts and each heartbeat check. Record counts only; do
not copy reply words or other private fields into test evidence.

After the owner-only Access application and secrets have been checked, the
private web package uses the same D1 UUID with:

```sh
CFJ_CLOUDFLARE_CANARY_DATABASE_ID=<separate-d1-uuid> npm run build:cloudflare-canary:owner
npm run check:cloudflare-canary-package:owner
```

These commands still only build and check. They do not deploy.

## Roll back

Code rollback and database recovery are different jobs. A Worker version
rollback does not undo D1 migrations. Keep migrations compatible with the
previous Worker and record a D1 recovery bookmark before a risky change.

The canary never becomes the public domain by accident. A future Cloudflare
public-hosting choice would need a new plan because the domain is not currently
on Cloudflare DNS. Do not reuse the old Sites DNS packet for that move.

If first deployment reports Cloudflare error `10063`, the script version may
have uploaded but the timer did not. Do not call that a pass and do not keep
retrying. Confirm there are no deployed web targets and no heartbeat, then ask
before initialising the account's `workers.dev` namespace. After that separate
approval, deploy the same checked config again and verify both the production
route and version preview routing are disabled before waiting for Cron.
