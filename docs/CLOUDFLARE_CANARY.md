# Private Cloudflare timer test

**Plan only. This page does not give permission to deploy, publish, change DNS,
open invitations or use real replies.**

## What is this?

It is one small test. It asks: **will Cloudflare run our automatic deletion job
every 15 minutes?**

The owner-only Site has not proved that its hosted timer runs. The code works in
local tests, but that is not the same thing as an unattended job on a host.

## Why is it useful?

If the Cloudflare test runs twice by itself, we know the Worker can run its timer
when it is deployed directly. If it does not, we have found a real fault before
any private reply is accepted.

This test does not prove that Sites installed the timer. It does not make the
Site ready for the public. It does not unlock invitations.

## What do I do?

Nothing is required during ordinary Site use. A maintainer runs this only after
the owner approves the exact private test and Cloudflare is connected.

The safe order is:

1. Create a new Worker and a new empty D1 test database. Never copy the Sites
   database.
2. Apply the normal migrations and check that only the made-up demonstration is
   present.
3. Deploy the Worker with its timer but **no web address**. Keep `workers.dev`
   off, preview addresses off and all domain routes absent.
4. Record the source commit, built package, Worker version, database name and
   starting heartbeat count.
5. Wait through Cloudflare's timer setup delay, then wait for two full
   15-minute slots. Do not press a test button and call that an automatic run.
6. Save two Cloudflare timer events and two database checks. The heartbeat must
   move forward twice, finish without an error and contain no reply text.
7. Stop if either run is missing, late or broken. Invitations stay shut.

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

## Owner web check — only after the timer passes

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
