import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PrivateFormState } from '@/components/use-private-form';

export function FormStatus({ state }: { state: PrivateFormState }) {
  if (state.kind === 'idle') return null;
  return (
    <Alert
      variant={state.kind === 'error' ? 'destructive' : 'default'}
      className="form-status"
    >
      <AlertTitle>
        {state.kind === 'success'
          ? 'Private submission received'
          : state.kind === 'error'
            ? 'Check the form'
            : 'Sending'}
      </AlertTitle>
      <AlertDescription>
        <p>{state.message}</p>
        {state.reference && (
          <p className="form-reference">Reference: {state.reference}</p>
        )}
        {Object.keys(state.fields).length > 0 && (
          <ul>
            {Object.values(state.fields).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
