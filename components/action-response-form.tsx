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
  inviteToken,
  questions,
  disabledReason,
  dataOwner,
  responseDeleteDate,
}: {
  actionId: string;
  inviteToken?: string;
  questions: string[];
  disabledReason?: string;
  dataOwner?: string;
  responseDeleteDate?: string;
}) {
  const { state, submit } = usePrivateForm('/api/action-responses');
  const [consentPrivateUse, setConsentPrivateUse] = useState(false);
  const [confirmedAdult, setConfirmedAdult] = useState(false);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      actionId,
      inviteToken,
      answers: questions.map((_, index) => data.get(`answer${index + 1}`)),
      consentPrivateUse,
      confirmedAdult,
      companyWebsite: data.get('companyWebsite'),
    });
  }

  if (state.kind === 'success') {
    return (
      <div className="direct-response-success">
        <FormStatus state={state} />
        <p>
          Thank you. We will use the replies only to decide whether this page
          needs changing. We will not publish your answers or a result based on
          them. Keep your reference if you may want us to remove your reply.
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
      <Link
        className="repair-link"
        href="/"
        target="_blank"
        referrerPolicy="no-referrer"
      >
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
          I agree that {dataOwner ?? 'the site data owner'} may use my answers
          only to check and improve this home page. They stay private and will
          be deleted by {responseDeleteDate ?? 'the date on the privacy page'}.
          I can withdraw before then. Needed to send.{' '}
          <Link href="/privacy" target="_blank" referrerPolicy="no-referrer">
            Read how we use and delete your answers.
          </Link>
        </label>
        <FieldDescription>
          Do not add names, contact details, case details, or facts about
          anyone&apos;s health, disability, race, religion, politics, trade
          union, sex life or sexuality. We do not record your screen, voice or
          face. Your answers stay private and cannot be the source of a public
          result.
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
