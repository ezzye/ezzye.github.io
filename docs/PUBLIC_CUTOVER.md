# Public domain change

This is preparation only. Do not change Site access or DNS without a separate,
explicit approval from the owner.

The five-person test is also a separate future choice. This plan does not
authorise invitations. Human choices belong in
[LAUNCH_DECISIONS.md](LAUNCH_DECISIONS.md).

This plan does not authorise publishing a Repair Receipt or contacting a
partner either.

## What is live now

Checked against Hover's authoritative nameserver on 30 August 2026.

The new Sites version remains owner-only and is not attached to this domain.

| Name   | Type  | Current value                             | TTL |
| ------ | ----- | ----------------------------------------- | --: |
| `@`    | A     | `185.199.108.153`                         | 900 |
| `@`    | A     | `185.199.109.153`                         | 900 |
| `@`    | A     | `185.199.110.153`                         | 900 |
| `@`    | A     | `185.199.111.153`                         | 900 |
| `www`  | CNAME | `ezzye.github.io.`                        | 900 |
| `@`    | MX    | `10 mx.hover.com.cust.hostedemail.com.`   | 900 |
| `mail` | CNAME | `mail.hover.com.cust.hostedemail.com.`    | 900 |
| `@`    | TXT   | existing OpenAI domain-verification value | 900 |

The four A records and the `www` CNAME are the old GitHub Pages web route.
[GitHub documents those four A addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Never change the MX, `mail`, TXT, nameserver or SOA records during a web
cutover. There is no authoritative apex AAAA record today. Do not copy DNS64
addresses returned by a local resolver.

The rollback source is GitHub `master` at
`a511d1455720fc18082c85caf0d81570a694c829`. The new application remains on
`phase-one-sites` until the owner approves a different release step.

## Gates before approval is requested

- The owner-only runbook rehearsal is complete. Any real pilot has its own
  explicit approval.
- The privacy contact and full privacy information are public.
- The larger proposal, offer and review forms remain shut unless separately
  staffed and approved.
- Every link in the old-site archive works.
- The approved version is checked from a phone and a computer.
- An unsigned visitor sees the intended public pages, while `/admin` and every
  admin write stay protected.
- The owner has a complete Hover zone export or screenshots.
- The old GitHub Pages HTTPS certificate is repaired or its existing failure is
  accepted as a rollback limitation.

OpenAI's Sites guidance says public access is the separate **Anyone on the
internet** choice and that custom-domain DNS values must be copied exactly from
**Add domain**. Do not infer them from the `chatgpt.site` address. See
[Creating and managing ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites).

## Approved cutover

1. Record the exact approved Site version, access choice and maintenance owner.
2. In Site settings, add `codingforjustice.org.uk` and copy the exact DNS values
   Sites provides into the launch decision register as the proposed after
   state.
3. Confirm how both the apex and `www` will receive valid TLS and redirect to one
   canonical name.
4. Write one exact before/after record diff. Ask the owner for explicit
   approval showing it. Stop if the diff includes mail, nameserver or unrelated
   TXT changes.
5. Apply only the web-record changes in the exact approved diff. Remove an old
   GitHub web record only where that diff replaces it, and add only ownership
   records Sites explicitly provides. Preserve mail and every unrelated TXT
   record.
6. Check HTTP and HTTPS for the apex and `www`, the certificate names, redirects,
   home, repairs, outcomes, privacy, archive, legacy paths, feed, robots and
   sitemap.
7. Confirm closed forms reject writes and `/admin` stays protected. Only if a
   future invited test was separately authorised, confirm that it accepts a
   fresh one-use link and nothing else. Check the database and error log.
8. Watch the site for two current TTL periods: 30 minutes.

## Rollback

1. Put back the four GitHub Pages A records and
   `www CNAME ezzye.github.io.`, all with TTL 900.
2. Leave mail, TXT, nameserver and SOA records untouched.
3. Keep the new Site and database intact but owner-only.
4. Wait 30 minutes, then check the GitHub home and old paths again.
5. Remove the custom-domain attachment from Sites only after DNS is back on
   GitHub. Do not delete the Site or database.
