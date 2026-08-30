'use client';

import { useState, type SyntheticEvent } from 'react';

import { FormStatus } from '@/components/form-status';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { usePrivateForm } from '@/components/use-private-form';

export function ProposalForm() {
  const { state, submit } = usePrivateForm('/api/proposals');
  const [consentContact, setConsentContact] = useState(false);
  const [consentRedactedDraft, setConsentRedactedDraft] = useState(false);
  const [backgroundOnly, setBackgroundOnly] = useState(true);
  const [consentCredit, setConsentCredit] = useState(false);
  const [consentAi, setConsentAi] = useState(false);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    await submit({
      ...values,
      consentContact,
      consentRedactedDraft,
      backgroundOnly,
      consentCredit,
      consentAi,
    });
  }

  return (
    <form className="private-form" onSubmit={handleSubmit} noValidate>
      <FormStatus state={state} />

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="proposal-company">Company website</label>
        <input
          id="proposal-company"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <FieldSet>
        <FieldLegend>1. What keeps going wrong?</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="workingTitle">Give it a short name</FieldLabel>
            <Input
              id="workingTitle"
              name="workingTitle"
              minLength={10}
              maxLength={120}
              required
              aria-invalid={Boolean(state.fields.workingTitle)}
              placeholder="For example: This council form is hard to use on a phone"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="problem">What keeps happening?</FieldLabel>
            <Textarea
              id="problem"
              name="problem"
              minLength={30}
              maxLength={2000}
              required
              rows={7}
              aria-invalid={Boolean(state.fields.problem)}
              placeholder="Tell us what happens. Leave out names, case numbers and private facts."
            />
            <FieldDescription>
              A few short lines is fine. Do not name private people.
            </FieldDescription>
          </Field>
          <div className="form-two-column">
            <Field>
              <FieldLabel htmlFor="broadLocation">
                Where is this? (optional)
              </FieldLabel>
              <Input
                id="broadLocation"
                name="broadLocation"
                maxLength={120}
                placeholder="Borough, city or UK-wide"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="relationship">
                How do you know about it?
              </FieldLabel>
              <NativeSelect
                id="relationship"
                name="relationship"
                required
                className="w-full"
              >
                <NativeSelectOption value="">Choose one</NativeSelectOption>
                <NativeSelectOption value="affected">
                  Affected by it
                </NativeSelectOption>
                <NativeSelectOption value="supporter">
                  Supporting someone affected
                </NativeSelectOption>
                <NativeSelectOption value="practitioner">
                  Working in the service
                </NativeSelectOption>
                <NativeSelectOption value="observer">
                  Observed or researched it
                </NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="affectedGroups">
              Who does this hurt or shut out?
            </FieldLabel>
            <Textarea
              id="affectedGroups"
              name="affectedGroups"
              minLength={10}
              maxLength={800}
              required
              rows={4}
              placeholder="Use broad groups. Do not name people."
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>2. What do you know? What could help?</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="evidenceState">
              What have you seen or found out?
            </FieldLabel>
            <Textarea
              id="evidenceState"
              name="evidenceState"
              minLength={10}
              maxLength={1200}
              required
              rows={5}
              placeholder="Say what you saw, what someone told you and what still needs a check."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sourceLinks">
              Links anyone can read (optional)
            </FieldLabel>
            <Textarea
              id="sourceLinks"
              name="sourceLinks"
              maxLength={2000}
              rows={3}
              placeholder={
                'https://example.org/source\nhttps://example.org/another-source'
              }
            />
            <FieldDescription>
              One public http or https link per line. No file uploads.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="desiredChange">
              What would better look like?
            </FieldLabel>
            <Textarea
              id="desiredChange"
              name="desiredChange"
              minLength={10}
              maxLength={1000}
              required
              rows={4}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="firstStep">
              What small thing could we try first?
            </FieldLabel>
            <Textarea
              id="firstStep"
              name="firstStep"
              minLength={10}
              maxLength={800}
              required
              rows={3}
              placeholder="One small step we could finish and check."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="helpNeeded">What help do you need?</FieldLabel>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              minLength={5}
              maxLength={500}
              required
              rows={3}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>3. Your name, email and say-so</FieldLegend>
        <FieldDescription>
          These details stay private. Nothing goes online until you see it and
          say yes.
        </FieldDescription>
        <FieldGroup>
          <div className="form-two-column">
            <Field>
              <FieldLabel htmlFor="chosenName">
                Name you want us to use (optional)
              </FieldLabel>
              <Input id="chosenName" name="chosenName" maxLength={100} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
              <Input id="email" name="email" type="email" maxLength={254} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="contactPreference">
              How and when should we get in touch? (optional)
            </FieldLabel>
            <Input
              id="contactPreference"
              name="contactPreference"
              maxLength={200}
              placeholder="For example: email only, weekdays"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="accessibilityNeed">
              What would make this easier for you? (optional)
            </FieldLabel>
            <Textarea
              id="accessibilityNeed"
              name="accessibilityNeed"
              maxLength={600}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="privacyConcern">
              Is there anything we must keep out? (optional)
            </FieldLabel>
            <Textarea
              id="privacyConcern"
              name="privacyConcern"
              maxLength={800}
              rows={3}
            />
          </Field>
          <fieldset className="choice-stack">
            <legend className="sr-only">Publication preference</legend>
            <label className="checkbox-line" htmlFor="consentRedactedDraft">
              <Checkbox
                id="consentRedactedDraft"
                checked={consentRedactedDraft}
                onCheckedChange={(checked) => {
                  setConsentRedactedDraft(Boolean(checked));
                  if (checked) setBackgroundOnly(false);
                }}
              />
              Make a copy with names and private facts taken out. Send it to me
              first.
            </label>
            <label className="checkbox-line" htmlFor="backgroundOnly">
              <Checkbox
                id="backgroundOnly"
                checked={backgroundOnly}
                onCheckedChange={(checked) => {
                  setBackgroundOnly(Boolean(checked));
                  if (checked) setConsentRedactedDraft(false);
                }}
              />
              Keep all of this off the site.
            </label>
          </fieldset>
          <label className="checkbox-line" htmlFor="consentContact">
            <Checkbox
              id="consentContact"
              checked={consentContact}
              onCheckedChange={(value) => setConsentContact(Boolean(value))}
            />
            You can email me.
          </label>
          <label className="checkbox-line" htmlFor="consentCredit">
            <Checkbox
              id="consentCredit"
              checked={consentCredit}
              onCheckedChange={(value) => setConsentCredit(Boolean(value))}
            />
            You can name me only after I say yes to the final page.
          </label>
          <label className="checkbox-line" htmlFor="consentAi">
            <Checkbox
              id="consentAi"
              checked={consentAi}
              onCheckedChange={(value) => setConsentAi(Boolean(value))}
            />
            You may use AI only after you tell me which tool, what it will do,
            and I say yes.
          </label>
        </FieldGroup>
      </FieldSet>

      <div className="form-submit-row">
        <Button type="submit" size="lg" disabled={state.kind === 'sending'}>
          {state.kind === 'sending'
            ? 'Sending privately…'
            : 'Send this in private'}
        </Button>
        <p>Not for emergencies, legal help or whistleblowing.</p>
      </div>
    </form>
  );
}
