'use client';

import Link from 'next/link';
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
import { Textarea } from '@/components/ui/textarea';
import { usePrivateForm } from '@/components/use-private-form';

export function ActionResponseForm({
  actionId,
  questions,
  disabledReason,
}: {
  actionId: string;
  questions: string[];
  disabledReason?: string;
}) {
  const { state, submit } = usePrivateForm('/api/action-responses');
  const [consentPrivateUse, setConsentPrivateUse] = useState(false);
  const [consentAnonymousSummary, setConsentAnonymousSummary] = useState(false);
  const [confirmedAdult, setConfirmedAdult] = useState(false);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      actionId,
      answers: questions.map((_, index) => data.get(`answer${index + 1}`)),
      consentPrivateUse,
      consentAnonymousSummary,
      confirmedAdult,
      companyWebsite: data.get('companyWebsite'),
    });
  }

  if (state.kind === 'success') {
    return (
      <div className="direct-response-success">
        <FormStatus state={state} />
        <p>
          Thank you. We will read your answers. When the test closes, we will
          say what we learned and whether we changed the page. Keep your
          reference if you may want us to remove your reply.
        </p>
      </div>
    );
  }

  return (
    <form className="offer-form direct-response-form" onSubmit={handleSubmit}>
      <h4>{disabledReason ? 'Preview this form' : 'Do this job now'}</h4>
      {disabledReason && <p className="demo-job-stop">{disabledReason}</p>}
      <p>
        Look at the home page first. Then answer in your own words. One short
        line for each is enough. We are testing the page, not you. Say what you
        really think. You can stop at any time, or write “skip”.
      </p>
      <Link className="repair-link" href="/" target="_blank">
        Open the home page in a new tab
      </Link>
      <FormStatus state={state} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`response-company-${actionId}`}>Company website</label>
        <input
          id={`response-company-${actionId}`}
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <FieldGroup>
        {questions.map((question, index) => (
          <Field key={question}>
            <FieldLabel htmlFor={`response-${actionId}-${index + 1}`}>
              {index + 1}. {question}
            </FieldLabel>
            <Textarea
              id={`response-${actionId}-${index + 1}`}
              name={`answer${index + 1}`}
              minLength={2}
              maxLength={800}
              rows={2}
              disabled={Boolean(disabledReason)}
              required
            />
          </Field>
        ))}
        <label className="checkbox-line" htmlFor={`response-adult-${actionId}`}>
          <Checkbox
            id={`response-adult-${actionId}`}
            checked={confirmedAdult}
            onCheckedChange={(value) => setConfirmedAdult(Boolean(value))}
            aria-required="true"
            aria-invalid={Boolean(state.fields.confirmedAdult)}
            disabled={Boolean(disabledReason)}
          />
          I am 18 or older. Needed for this first test.
        </label>
        <label
          className="checkbox-line"
          htmlFor={`response-private-consent-${actionId}`}
        >
          <Checkbox
            id={`response-private-consent-${actionId}`}
            checked={consentPrivateUse}
            onCheckedChange={(value) => setConsentPrivateUse(Boolean(value))}
            aria-required="true"
            aria-invalid={Boolean(state.fields.consentPrivateUse)}
            disabled={Boolean(disabledReason)}
          />
          You may use my full answers for this private test. They will not be
          posted. Needed to send.
        </label>
        <label
          className="checkbox-line"
          htmlFor={`response-summary-consent-${actionId}`}
        >
          <Checkbox
            id={`response-summary-consent-${actionId}`}
            checked={consentAnonymousSummary}
            onCheckedChange={(value) =>
              setConsentAnonymousSummary(Boolean(value))
            }
            disabled={Boolean(disabledReason)}
          />
          You may also publish nameless totals or a short nameless summary.
          Optional.
        </label>
        <FieldDescription>
          Do not add your name, diagnosis, case details or another person&apos;s
          private story. We do not record your screen, voice or face.
        </FieldDescription>
      </FieldGroup>
      <Button
        type="submit"
        disabled={Boolean(disabledReason) || state.kind === 'sending'}
      >
        {disabledReason
          ? 'Answers are not being accepted yet'
          : state.kind === 'sending'
            ? 'Sending privately…'
            : 'Send my answers'}
      </Button>
    </form>
  );
}
