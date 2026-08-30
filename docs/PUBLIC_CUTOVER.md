# Public domain change

**Preparation only.** Do not make the Site public or change DNS without the
owner approving that exact step. Public access, DNS, invitations, outreach and
publishing real work are different decisions.

**Sites plan only.** A private Cloudflare timer test does not change or approve
the Sites records below. If Cloudflare is later chosen as the public host, stop
and write a fresh plan for the full DNS zone, access and rollback; do not reuse
these record values.

The exact candidate and evidence belong in
[PUBLIC_RELEASE_PACKET.md](PUBLIC_RELEASE_PACKET.md). Human choices belong in
[LAUNCH_DECISIONS.md](LAUNCH_DECISIONS.md).

## What is live now

Checked on 30 August 2026 against Sites, both Hover nameservers, GitHub and the
public URLs.

- At the evidence capture, Sites version 8 was owner-only: one owner, no groups
  and no visitors. A later private preparation version may replace it; the
  exact current candidate must come from the refreshed release packet.
- `codingforjustice.org.uk` and `www.codingforjustice.org.uk` are already
  attached to Sites, but both are **pending** with TLS waiting for validation.
  That attachment does not route public traffic.
- Public DNS still sends both names to the old GitHub Pages site.
- The old apex works over HTTP. HTTPS fails because GitHub presents a
  `*.github.io` certificate that does not cover either custom hostname.
- Hover webmail at `mail.codingforjustice.org.uk` also works over HTTP but has
  no valid HTTPS certificate. The candidate therefore uses a five-minute HSTS
  value for the apex and deliberately does **not** include subdomains.
- GitHub `master` remains the old site at
  `a511d1455720fc18082c85caf0d81570a694c829`.
- GitHub `phase-one-sites` contains the tested application source. `master` has
  not been changed.

## Exact current web records

Both authoritative Hover nameservers agreed. TTL is 900 seconds.

| Name  | Type  | Current value       |
| ----- | ----- | ------------------- |
| `@`   | A     | `185.199.108.153`   |
| `@`   | A     | `185.199.109.153`   |
| `@`   | A     | `185.199.110.153`   |
| `@`   | A     | `185.199.111.153`   |
| `www` | CNAME | `ezzye.github.io.`  |

There is no authoritative apex AAAA or CAA record.

## Exact proposed Sites records

These values were read from the two existing pending domain attachments on 30
August 2026. Refresh them from Sites immediately before approval. If any value
changes, make a new packet and ask again.

### Replace the web route

| Name  | Type  | Proposed value                 | Change                    |
| ----- | ----- | ------------------------------ | ------------------------- |
| `@`   | A     | `162.159.143.30`               | Replace current apex set  |
| `@`   | A     | `172.66.3.26`                  | Replace current apex set  |
| `www` | CNAME | `custom-domains.chatgpt.site.` | Replace current value     |

The four current GitHub A records are removed only when the two proposed apex
A records are added. Do not leave a mixed GitHub/Sites set.

### Add domain checks

| Name                                                        | Type | Proposed value |
| ----------------------------------------------------------- | ---- | -------------- |
| `_openai-site-verification.codingforjustice.org.uk`         | TXT  | `openai-site-verification=I8UP6EeIgeyXFJ2uLfBEx1Ii6-A7YHJOS9eUW02ryhA` |
| `_cf-custom-hostname.codingforjustice.org.uk`               | TXT  | `13f0eec5-4b17-4212-80b0-56a507cc8d35` |
| `_openai-site-verification.www.codingforjustice.org.uk`     | TXT  | `openai-site-verification=nHbtbExI3HRGMCPN1aN0JyFfbEUCkqYe7cdT2sLNjsw` |
| `_cf-custom-hostname.www.codingforjustice.org.uk`           | TXT  | `c7d396ae-4f51-402e-b19a-e41c889dc7c7` |

Use TTL 900 unless Hover requires a different safe value. Ignore the empty
validation row returned by Sites; it is not a DNS instruction.

## Records that must not change

| Name   | Type  | Value                                         |
| ------ | ----- | --------------------------------------------- |
| `@`    | MX    | `10 mx.hover.com.cust.hostedemail.com.`       |
| `mail` | CNAME | `mail.hover.com.cust.hostedemail.com.`        |
| `@`    | TXT   | `openai-domain-verification=dv-PepyKETmhHBrwPIR2p6QvNhR` |
| `share`| CNAME | `custom-domains.chatgpt.site.`                |
| `@`    | NS    | `ns1.hover.com.`, `ns2.hover.com.`             |
| `@`    | SOA   | `ns1.hover.com. dnsmaster.hover.com. <serial> 1800 900 604800 300` |

Hover refused a full public zone transfer. A Hover export or complete set of
screenshots is therefore required before cutover. Preserve every record in
that export, including any unseen mail, DKIM or service record. Never add a
wildcard record.

The Hover SOA serial should change when the zone changes. Preserve Hover as the
authority and preserve the SOA names and timers; do not require the serial to
stay byte-for-byte the same. Check the existing `share` service before and
after the cutover without changing it.

Do not enable `includeSubDomains` in the Site's HSTS header while `mail.` lacks
valid HTTPS. Do not raise the five-minute HSTS value until both the GitHub
rollback target and mail have tested HTTPS; cached HSTS cannot be undone by a
DNS rollback.

## Approval 1 — public generated address only

This is needed before an unsigned-person check. It does not change DNS.

Do not ask for this approval until a public privacy contact, an honest reply
time and every supporting privacy field required by the privacy page have been
approved, configured and checked on the private Site. Merely adding an email is
not enough. That setup does not open the pilot or any form; invitation and
intake settings stay off. The generated address must also send
`X-Robots-Tag: noindex, nofollow` so a short validation does not become a search
launch.

> I approve making only the exact Sites version named in release packet A
> available to **Anyone on the internet** at its generated
> `chatgpt.site` address. Do not change DNS, environment values, data, forms,
> invitations or published content. Keep all intake shut. Return the Site to
> owner-only if a privacy, security, content or access check fails.

After that approval:

1. Recheck the exact version, source commit, environment keys, database counts
   and access immediately before the change.
2. Change only Site access and deploy that same saved version.
3. Check it as an unsigned visitor from a phone and a computer.
4. Run the read-only public check documented in the release packet.
   Require the generated-address `noindex` check.
5. Confirm `/admin` still needs sign-in and an unsigned admin write gets `403`
   before its body is read.
6. Confirm proposal, offer, review and invited-answer paths are still shut.
7. Record results. Do not touch DNS yet.
8. Capture a new immutable packet B with the now-public access, fresh Site and
   domain state, accepted checks, environment, database counts and exact DNS
   diff. Packet A is historical after the access change and cannot approve DNS.

## Approval 2 — exact DNS diff

Ask only after approval 1 has passed, packet B is complete and the Hover export
exists.

> I approve the exact, unexpired release packet B named in this decision.
> Add its four validation TXT records, replace only the five old GitHub web
> records with its three Sites web records, and preserve mail, `share`,
> nameservers, the SOA provider settings and every unrelated record. Keep all
> intake shut. Stop if any live value
> differs from the packet or if Sites does not issue valid TLS for both names.
> If a recorded rollback trigger occurs, I authorise the named rollback
> operator to apply packet B's exact rollback, including its exact previous
> Sites version or saved Hover web records as appropriate.
> This does not approve invitations, outreach, a real repair, a Workshop Note
> or a Repair Receipt.

## Applying an approved cutover

1. Capture fresh Sites access, version, domain values, Hover export, GitHub
   branch heads, environment-key list and content-free database counts.
2. Stop if the packet has expired or any value differs.
3. Add only the four approved validation TXT records.
4. Refresh both domain statuses in Sites. Stop on an error.
5. In one short change, replace the four apex GitHub A records with the two
   Sites A records and replace the `www` CNAME with the Sites CNAME.
6. Check authoritative DNS from both Hover nameservers.
7. Wait for both Sites domains and both TLS certificates to become active.
8. Check apex and `www`; `www` must redirect once to the apex while keeping the
   path and query string.
9. Check home, repairs, outcomes, privacy, archive, feed, robots, sitemap,
   social image, the three old article paths and the three old information
   paths.
10. Confirm the apex HSTS header is exactly the approved short value, contains
    no `includeSubDomains`, and existing Hover webmail still opens over HTTP.
11. Recheck protection, closed forms, database counts and error logs.
12. Watch closely for two TTL periods (30 minutes), then check again after 24
    hours because DNS and certificates can take longer to settle.

## Rollback triggers

Rollback starts if any of these is true:

- private information or an unintended draft is visible;
- `/admin` or an admin write is not protected;
- a closed form accepts data;
- either hostname lacks valid HTTPS;
- the wrong content, redirect or DNS record is served;
- mail, `share`, nameservers, the SOA provider settings or an unrelated record
  changed unexpectedly;
- the apex sends `includeSubDomains` while webmail lacks valid HTTPS;
- the live error log shows a launch fault that affects visitors.

## Rollback order

### Privacy or security failure

1. Make the Site owner-only immediately.
2. Restore the saved GitHub web records from the Hover export.
3. Keep the Site and database intact for review; do not delete them.

### Code or content failure with healthy Sites hosting

1. Keep DNS on Sites.
2. Deploy the exact previous saved Sites version from the packet.
3. Re-run access, content and database checks.

### Hosting, domain or TLS failure

1. Restore the four GitHub A records and `www CNAME ezzye.github.io.` from the
   export. Do not touch any other record.
2. Check both Hover nameservers and wait two TTL periods.
3. Make Sites owner-only.
4. Remove the custom-domain attachments only after DNS is back on GitHub.

The old GitHub custom-domain HTTPS is broken today. For a browser that has seen
even the candidate's short HSTS header, the HTTP GitHub page is not an emergency
fallback: the browser will force HTTPS and reject GitHub's certificate until
the five-minute cache expires. Do not approve the cutover until GitHub HTTPS is
repaired or another HTTPS fallback is tested and recorded.

After any rollback, record the trigger, times, exact changes, final access,
authoritative DNS and whether any data arrived. Never delete the Site or D1 as
part of rollback.
