# Public release packet

**Status: historical draft. Do not use it to make anything public.**

The exact values below are an old snapshot, not the current candidate. They
cannot approve access, DNS, rollback or publication. The public domain still
serves the old GitHub Pages site. Any public move needs a fresh packet for the
exact live private version, a separate access approval, then a fresh second
packet and a separate DNS approval. Stop and refresh if any live value differs.

This is the evidence form for two exact approval boundaries. Packet A covers
owner-only to a public generated address. Packet B is made afterwards and
covers that checked public version to the exact DNS cutover. Refreshed copies
are kept locally as `release/PUBLIC_RELEASE_A.md` and
`release/PUBLIC_RELEASE_B.md`; both are ignored by Git so a stale packet cannot
look like source truth.

Each packet revision becomes historical after its authorised state change. It
also becomes invalid before use if code, Site version, access, environment,
database contents, domain instructions, DNS or the planned record diff changes.
Refresh every live-state check within 30 minutes of asking for its approval.

## Historical baseline — do not use for a release

Captured on 30 August 2026 between 14:24 and 14:31 UTC.

| Item                   | Verified value                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Private Site           | `https://coding-for-justice.ezzye.chatgpt.site`                                     |
| Live saved version     | 8                                                                                   |
| Live version ID        | `appgprj_6a93f45a225081918e01fb4cdafb0990~appgver_ed1e8a4d02a08191b1c8c52ffb082039` |
| Live source            | `f644321e517d752fd44f8fe0636732fe41b84998`                                          |
| Live archive hash      | `sha256:e8f611ff088d2b3abf6163fc704212da3cb96bdf7cf918f3318624c1878f725e`           |
| Previous saved version | 7, source `d0b15c281e74b49770789b8bc394abe5e9f1a007`                                |
| Site access            | Custom: one owner, no group, no outside visitor                                     |
| GitHub review branch   | `phase-one-sites` at `f644321e517d752fd44f8fe0636732fe41b84998`                     |
| GitHub rollback branch | `master` at `a511d1455720fc18082c85caf0d81570a694c829`                              |
| Public GitHub source   | `master/docs`                                                                       |
| Package-lock hash      | `fad5886e864c3671285a0a42f4942efe48e3f62201956fce18bd3d62feac6456`                  |
| Build tools            | Node `24.13.0`, npm `11.6.2`                                                        |
| Latest migration       | `0010_fast_jasper_sitwell.sql`                                                      |
| Hosted environment     | Revision 1; only `ADMIN_EMAIL` present                                              |
| Custom domains         | Apex and `www` attached, both pending; TLS pending validation                       |

The current version remains owner-only. The next privately deployed version
will replace the release-candidate fields below; do not copy the baseline by
habit.

## Content-free database baseline

No row contents were copied. Each table returned fewer than 25 rows, so these
counts are complete at the capture time.

| Table               | Rows |
| ------------------- | ---: |
| Repairs             |    2 |
| Action cards        |    4 |
| Repair updates      |    1 |
| Outcomes            |    1 |
| Proposals           |    0 |
| Offers              |    0 |
| Appeals             |    0 |
| Action invitations  |    0 |
| Full action replies |    0 |
| Retention events    |    0 |
| Steward drafts      |    0 |
| Corrections         |    0 |
| Rate-limit records  |    0 |

Any unexpected private row blocks public access until it is understood. Do not
put row contents in this packet.

## Gates that stay shut after a read-only launch

A public home page would not authorise real participation. The next candidate
contains revision-bound repair and update publishing, public-evidence-only
result drafts and a 15-minute deletion worker with request-time backup.
Fresh-database, upgrade, built-Worker and complete owner-route rehearsals pass
locally. Private replies cannot be used as the source of a public result.

Keep invitations and real result publication shut until the exact owner-only
deployed version proves a recent automatic-check heartbeat and its access,
environment and private row counts are rechecked. Local proof does not prove
that the Sites control plane installed the cron trigger.

A direct Cloudflare timer-test pass is useful fault-finding evidence only. It
does not prove the timer on the exact Site version and cannot open this gate.

## Packet A — refresh after the final private deployment

| Field                                 | Required value                                 |
| ------------------------------------- | ---------------------------------------------- |
| Packet ID                             | `CFJ-PUBLIC-A-<date>-<version>-<short source>` |
| Made at / expires at                  | — / —                                          |
| Sites project                         | `appgprj_6a93f45a225081918e01fb4cdafb0990`     |
| Candidate version and full version ID | —                                              |
| Full source commit                    | —                                              |
| Archive content hash                  | —                                              |
| Previous safe Sites version and ID    | —                                              |
| GitHub review branch head             | —                                              |
| GitHub rollback branch head           | —                                              |
| Lockfile hash and build tools         | —                                              |
| Access before / target                | owner-only / public generated address only     |
| Canonical hostname                    | proposed: `codingforjustice.org.uk`            |
| Environment revision and key names    | —                                              |
| Latest migration and table counts     | —                                              |
| Domain IDs, status and exact records  | —                                              |
| Hover zone export or screenshots      | —                                              |

The full source commit, GitHub review-branch head and saved Sites version source
must be identical. Stop on any mismatch.

Do not ask for packet A approval until an active public role address and its
honest reply time are approved, configured and visible on the private Site.
Pilot-specific privacy, permission and staffing values stay absent, and
invitation and intake settings remain off. Packet A must also prove that the
generated hostname will carry `noindex, nofollow`.

## Packet B — refresh after packet A has passed

Packet A cannot authorise DNS because its own access change makes its state
historical. Packet B repeats every field above from fresh evidence and adds:

| Field                                          | Required value                                          |
| ---------------------------------------------- | ------------------------------------------------------- |
| Packet ID                                      | `CFJ-PUBLIC-B-<date>-<version>-<short source>`          |
| Packet A ID and approval evidence              | —                                                       |
| Current / target access                        | public generated address / same access on custom domain |
| Accepted generated-address checks              | —                                                       |
| Exact current and proposed DNS records         | —                                                       |
| Exact previous Sites version for code rollback | —                                                       |
| Exact Hover web records for DNS rollback       | —                                                       |
| Named rollback operator and triggers           | —                                                       |
| Tested HTTPS fallback                          | Both names pass normal hostname checks; no insecure override |

Packet B is the only packet that can be named in DNS approval.

## Human owners — all required

| Role               | Person | Backup or absence rule | Status      |
| ------------------ | ------ | ---------------------- | ----------- |
| Release operator   | —      | —                      | Not decided |
| Release approver   | —      | —                      | Not decided |
| Weekly maintainer  | —      | —                      | Not decided |
| Deputy maintainer  | —      | —                      | Not decided |
| Privacy contact    | —      | —                      | Not decided |
| Rollback authority | —      | —                      | Not decided |

If the maintainer and deputy are both unavailable for the agreed reply time,
keep intake shut. If live private data cannot be watched, return the Site to
owner-only.

## Local release proof

Record the result and time for each item. A command passing is evidence only for
what it actually checks.

| Check                         | Expected                                    | Actual / evidence | Pass? |
| ----------------------------- | ------------------------------------------- | ----------------- | ----- |
| Locked dependencies unchanged | Lockfile hash matches                       | —                 | —     |
| Unit and database tests       | All pass                                    | —                 | —     |
| Lint                          | No errors                                   | —                 | —     |
| Database schema check         | Migrations and schema agree                 | —                 | —     |
| Production build              | Completes from candidate source             | —                 | —     |
| Private deployment            | Exact saved candidate succeeds              | —                 | —     |
| Post-deploy access            | One owner, no group, no visitor             | —                 | —     |
| Environment                   | Only approved keys; intake remains off      | —                 | —     |
| Database                      | Expected migrations and content-free counts | —                 | —     |
| Error log                     | No candidate launch errors                  | —                 | —     |

`npm run verify:release` covers unit/database tests, lint, Drizzle's schema
check, the production build, a built-Worker scheduled-job rehearsal and the
complete owner-route rehearsal. Its Worker proof uses a local throw-away
runtime; it does not prove that Sites installed or is running the hosted timer.
The command also does not install dependencies, compare the lockfile hash,
inspect Git, deploy, inspect access, read the hosted environment or check the
live database. Record those as separate evidence. A clean locked install, when
claimed, must use `npm ci` in a disposable copy at the recorded Node/npm
versions.

## Public generated-address proof — only after approval 1

| Check                      | Expected                                                                                    | Actual / evidence | Pass? |
| -------------------------- | ------------------------------------------------------------------------------------------- | ----------------- | ----- |
| Unsigned home              | 200, approved content                                                                       | —                 | —     |
| Public privacy contact     | Address and honest reply time work                                                          | —                 | —     |
| Generated-address indexing | `X-Robots-Tag: noindex, nofollow`                                                           | —                 | —     |
| Phone orientation          | What, why and next step are clear                                                           | —                 | —     |
| Keyboard and reflow        | Usable without a mouse or sideways page scroll                                              | —                 | —     |
| Public routes              | Expected pages/assets return direct 200 with right type/content                             | —                 | —     |
| Old paths                  | Every inventoried old URL uses only permanent redirects and ends at its exact intended page | —                 | —     |
| Security headers           | CSP, five-minute apex-only HSTS, frame, type, referrer and permissions present              | —                 | —     |
| Protected workshop         | Unsigned visitor is sent to sign-in                                                         | —                 | —     |
| Admin write                | Unsigned request gets 403 before its body is read                                           | —                 | —     |
| Public intake              | Proposal, offer and review remain shut                                                      | —                 | —     |
| Invited reply              | No reply without a separately approved live one-use link                                    | —                 | —     |
| Database after checks      | No unexpected row-count change                                                              | —                 | —     |
| Error log after checks     | No launch error                                                                             | —                 | —     |

Use `npm run check:public -- --origin <generated HTTPS address>
--expect-noindex` for the read-only page, old-route, content-type, marker,
header and admin-sign-in checks. It does not attempt an admin write, submit a
closed form, inspect the database or read logs. Those operational checks, plus
human phone, keyboard and content checks, remain separate.

## DNS and final-address proof — only after approval 2

The exact before/after records and rollback are in
[PUBLIC_CUTOVER.md](PUBLIC_CUTOVER.md).

| Check                  | Expected                                                                              | Actual / evidence | Pass? |
| ---------------------- | ------------------------------------------------------------------------------------- | ----------------- | ----- |
| Both Hover nameservers | Exact approved records                                                                | —                 | —     |
| Preserved zone         | Mail, `share`, NS and unrelated records unchanged; Hover SOA serial alone may advance | —                 | —     |
| Apex TLS and home      | Valid certificate, 200                                                                | —                 | —     |
| `www`                  | One redirect to apex, path and query kept                                             | —                 | —     |
| HSTS and webmail       | `max-age=300`, no subdomains; Hover webmail still works                               | —                 | —     |
| Sites domain status    | Both active, no error                                                                 | —                 | —     |
| Public check at apex   | Passes                                                                                | —                 | —     |
| 30-minute watch        | No critical error                                                                     | —                 | —     |
| 24-hour recheck        | DNS, TLS, content and mail still right                                                | —                 | —     |

## Approval records

Copy the exact staged words from [PUBLIC_CUTOVER.md](PUBLIC_CUTOVER.md) into
[LAUNCH_DECISIONS.md](LAUNCH_DECISIONS.md). Approval is valid only for this
packet ID and its unexpired values. It never authorises invitations, outreach,
real repair content, Workshop Notes, Repair Receipts or private-data transfer.
