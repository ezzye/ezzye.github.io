'use client';

import { useState } from 'react';

export type PrivateFormState = {
  kind: 'idle' | 'sending' | 'success' | 'error';
  message: string;
  reference?: string;
  fields: Record<string, string>;
};

const idleState: PrivateFormState = {
  kind: 'idle',
  message: '',
  fields: {},
};

export function usePrivateForm(endpoint: string) {
  const [state, setState] = useState<PrivateFormState>(idleState);

  async function submit(payload: Record<string, unknown>) {
    setState({ kind: 'sending', message: 'Sending privately…', fields: {} });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        reference?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok || !result.ok) {
        setState({
          kind: 'error',
          message: result.message ?? 'The form could not be sent.',
          fields: result.fields ?? {},
        });
        return false;
      }
      setState({
        kind: 'success',
        message:
          'Received privately. Nothing has been published. Keep the reference below if one was supplied.',
        reference: result.reference,
        fields: {},
      });
      return true;
    } catch {
      setState({
        kind: 'error',
        message:
          'The private form could not be reached. Nothing has been published. Please try again later.',
        fields: {},
      });
      return false;
    }
  }

  return { state, submit, reset: () => setState(idleState) };
}
