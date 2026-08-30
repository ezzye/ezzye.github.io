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
        <FieldLegend>1. The repeatable problem</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="workingTitle">Working title</FieldLabel>
            <Input
              id="workingTitle"
              name="workingTitle"
              minLength={10}
              maxLength={120}
              required
              aria-invalid={Boolean(state.fields.workingTitle)}
              placeholder="For example: Make a council form understandable on a phone"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="problem">What keeps happening?</FieldLabel>
            <Textarea
              id="problem"
              name="problem"
              minLength={100}
              maxLength={2000}
              required
              rows={7}
              aria-invalid={Boolean(state.fields.problem)}
              placeholder="Describe the process and the recurring barrier. Do not include names of private people, case numbers or sensitive records."
            />
            <FieldDescription>
              100–2,000 characters. No accusations about named private people.
            </FieldDescription>
          </Field>
          <div className="form-two-column">
            <Field>
              <FieldLabel htmlFor="broadLocation">
                Broad location (optional)
              </FieldLabel>
              <Input
                id="broadLocation"
                name="broadLocation"
                maxLength={120}
                placeholder="Borough, city or UK-wide"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="relationship">Your relationship</FieldLabel>
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
              Who carries the cost?
            </FieldLabel>
            <Textarea
              id="affectedGroups"
              name="affectedGroups"
              minLength={20}
              maxLength={800}
              required
              rows={4}
              placeholder="Use broad, non-identifying descriptions. Include who may be missing."
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>2. Evidence and a useful first step</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="evidenceState">
              What is known, unknown or disputed?
            </FieldLabel>
            <Textarea
              id="evidenceState"
              name="evidenceState"
              minLength={20}
              maxLength={1200}
              required
              rows={5}
              placeholder="Separate what you observed, what someone reported, what a source supports and what still needs checking."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sourceLinks">
              Public source links (optional)
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
              What would be measurably fairer?
            </FieldLabel>
            <Textarea
              id="desiredChange"
              name="desiredChange"
              minLength={20}
              maxLength={1000}
              required
              rows={4}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="firstStep">Smallest useful test</FieldLabel>
            <Textarea
              id="firstStep"
              name="firstStep"
              minLength={10}
              maxLength={800}
              required
              rows={3}
              placeholder="A step small enough to complete and check within a few weeks."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="helpNeeded">
              What help would be useful?
            </FieldLabel>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              minLength={10}
              maxLength={500}
              required
              rows={3}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>3. Privacy and contact</FieldLegend>
        <FieldDescription>
          These details stay private. Nothing above becomes public unless a
          separate redacted draft is prepared and you approve it.
        </FieldDescription>
        <FieldGroup>
          <div className="form-two-column">
            <Field>
              <FieldLabel htmlFor="chosenName">
                Chosen name or pseudonym (optional)
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
              Contact preference (optional)
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
              Accessibility need (optional)
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
              Immediate privacy or safety concern (optional)
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
              Prepare a separate redacted public draft for my review.
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
              Keep this as private background only.
            </label>
          </fieldset>
          <label className="checkbox-line" htmlFor="consentContact">
            <Checkbox
              id="consentContact"
              checked={consentContact}
              onCheckedChange={(value) => setConsentContact(Boolean(value))}
            />
            You may contact me using the email I supplied.
          </label>
          <label className="checkbox-line" htmlFor="consentCredit">
            <Checkbox
              id="consentCredit"
              checked={consentCredit}
              onCheckedChange={(value) => setConsentCredit(Boolean(value))}
            />
            You may credit my chosen public name only after I approve the final
            preview.
          </label>
          <label className="checkbox-line" htmlFor="consentAi">
            <Checkbox
              id="consentAi"
              checked={consentAi}
              onCheckedChange={(value) => setConsentAi(Boolean(value))}
            />
            I permit specified AI assistance on this submission after I am told
            the provider and purpose. This is off by default.
          </label>
        </FieldGroup>
      </FieldSet>

      <div className="form-submit-row">
        <Button type="submit" size="lg" disabled={state.kind === 'sending'}>
          {state.kind === 'sending'
            ? 'Sending privately…'
            : 'Send private proposal'}
        </Button>
        <p>Not an emergency, legal-advice or whistleblowing channel.</p>
      </div>
    </form>
  );
}
