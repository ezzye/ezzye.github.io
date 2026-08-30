'use client';

import type { SyntheticEvent } from 'react';

import { FormStatus } from '@/components/form-status';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { usePrivateForm } from '@/components/use-private-form';

export function AppealForm() {
  const { state, submit } = usePrivateForm('/api/appeals');

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    await submit(
      Object.fromEntries(new FormData(event.currentTarget).entries()),
    );
  }

  return (
    <form
      className="private-form compact-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <FormStatus state={state} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="appeal-company">Company website</label>
        <input
          id="appeal-company"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="itemReference">
            Page, repair or decision
          </FieldLabel>
          <Input
            id="itemReference"
            name="itemReference"
            required
            minLength={2}
            maxLength={240}
            placeholder="URL, repair reference or moderation decision"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="requestType">What kind of review?</FieldLabel>
          <NativeSelect
            id="requestType"
            name="requestType"
            required
            className="w-full"
          >
            <NativeSelectOption value="">Choose one</NativeSelectOption>
            <NativeSelectOption value="factual-correction">
              Factual correction
            </NativeSelectOption>
            <NativeSelectOption value="privacy-removal">
              Privacy or removal
            </NativeSelectOption>
            <NativeSelectOption value="moderation-review">
              Moderation appeal
            </NativeSelectOption>
            <NativeSelectOption value="accessibility">
              Accessibility problem
            </NativeSelectOption>
            <NativeSelectOption value="other">
              Another review
            </NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="explanation">
            What should be reviewed, and why?
          </FieldLabel>
          <Textarea
            id="explanation"
            name="explanation"
            required
            minLength={30}
            maxLength={2000}
            rows={7}
          />
          <FieldDescription>
            Explain the specific claim or decision. Immediate privacy and safety
            requests are prioritised.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="evidenceLinks">
            Relevant public links (optional)
          </FieldLabel>
          <Textarea
            id="evidenceLinks"
            name="evidenceLinks"
            maxLength={2000}
            rows={3}
            placeholder="One full web link per line"
          />
        </Field>
        <div className="form-two-column">
          <Field>
            <FieldLabel htmlFor="appealEmail">Email</FieldLabel>
            <Input
              id="appealEmail"
              name="email"
              type="email"
              maxLength={254}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="appealAccessibility">
              Accessibility need (optional)
            </FieldLabel>
            <Input
              id="appealAccessibility"
              name="accessibilityNeed"
              maxLength={600}
            />
          </Field>
        </div>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={state.kind === 'sending'}>
        {state.kind === 'sending'
          ? 'Sending privately…'
          : 'Request an independent review'}
      </Button>
    </form>
  );
}
