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
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePrivateForm } from '@/components/use-private-form';

export function OfferHelpForm({
  actionId,
  actionTitle,
}: {
  actionId: string;
  actionTitle: string;
}) {
  const { state, submit } = usePrivateForm('/api/offers');
  const [covenantAccepted, setCovenantAccepted] = useState(false);
  const [consentContact, setConsentContact] = useState(false);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    await submit({
      ...Object.fromEntries(new FormData(event.currentTarget).entries()),
      actionId,
      covenantAccepted,
      consentContact,
    });
  }

  return (
    <form className="offer-form" onSubmit={handleSubmit} noValidate>
      <h4>Offer help with “{actionTitle}”</h4>
      <p>
        This does not assign the task immediately. The owner will check fit,
        capacity and boundaries first.
      </p>
      <FormStatus state={state} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`offer-company-${actionId}`}>Company website</label>
        <input
          id={`offer-company-${actionId}`}
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <FieldGroup>
        <div className="form-two-column">
          <Field>
            <FieldLabel htmlFor={`offer-name-${actionId}`}>
              Chosen name
            </FieldLabel>
            <Input
              id={`offer-name-${actionId}`}
              name="chosenName"
              minLength={2}
              maxLength={100}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`offer-email-${actionId}`}>Email</FieldLabel>
            <Input
              id={`offer-email-${actionId}`}
              name="email"
              type="email"
              maxLength={254}
              required
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`offer-contribution-${actionId}`}>
            What can you contribute to this output?
          </FieldLabel>
          <Textarea
            id={`offer-contribution-${actionId}`}
            name="contribution"
            minLength={20}
            maxLength={1000}
            rows={4}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`offer-access-${actionId}`}>
            Accessibility need (optional)
          </FieldLabel>
          <Input
            id={`offer-access-${actionId}`}
            name="accessibilityNeed"
            maxLength={600}
          />
        </Field>
        <label className="checkbox-line" htmlFor={`offer-covenant-${actionId}`}>
          <Checkbox
            id={`offer-covenant-${actionId}`}
            checked={covenantAccepted}
            onCheckedChange={(value) => setCovenantAccepted(Boolean(value))}
          />
          I affirm the community covenant: DEI, dignity, evidence, no pile-ons
          and correction when evidence changes.
        </label>
        <label className="checkbox-line" htmlFor={`offer-contact-${actionId}`}>
          <Checkbox
            id={`offer-contact-${actionId}`}
            checked={consentContact}
            onCheckedChange={(value) => setConsentContact(Boolean(value))}
          />
          Coding for Justice may contact me about this bounded task.
        </label>
        <FieldDescription>
          Your offer and contact details stay private. They are not a public
          endorsement or profile.
        </FieldDescription>
      </FieldGroup>
      <Button type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? 'Sending privately…' : 'Send private offer'}
      </Button>
    </form>
  );
}
