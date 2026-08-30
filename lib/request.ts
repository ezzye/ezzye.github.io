export class RequestValidationError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(
    message: string,
    fields: Record<string, string> = {},
    status = 400,
  ) {
    super(message);
    this.name = 'RequestValidationError';
    this.status = status;
    this.fields = fields;
  }
}

export async function readJsonObject(request: Request, maximumBytes = 24_000) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > maximumBytes) {
    throw new RequestValidationError('This submission is too large.', {}, 413);
  }

  const text = await request.text();
  if (text.length > maximumBytes) {
    throw new RequestValidationError('This submission is too large.', {}, 413);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new RequestValidationError('The form could not be read.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestValidationError('The form could not be read.');
  }
  return value as Record<string, unknown>;
}

export function stringField(
  value: unknown,
  label: string,
  options: { minimum?: number; maximum?: number; optional?: boolean } = {},
): string | null {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result && options.optional) return null;
  if (!result)
    throw new RequestValidationError(`${label} is required.`, {
      [label]: `${label} is required.`,
    });
  if (options.minimum && result.length < options.minimum) {
    throw new RequestValidationError(`${label} is too short.`, {
      [label]: `${label} must be at least ${options.minimum} characters.`,
    });
  }
  if (options.maximum && result.length > options.maximum) {
    throw new RequestValidationError(`${label} is too long.`, {
      [label]: `${label} must be ${options.maximum} characters or fewer.`,
    });
  }
  return result;
}

export function booleanField(value: unknown): boolean {
  return value === true;
}

export function emailField(value: unknown, optional = false): string | null {
  const email = stringField(value, 'email', { maximum: 254, optional });
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError('Enter a valid email address.', {
      email: 'Enter a valid email address.',
    });
  }
  return email.toLowerCase();
}

export function linksField(value: unknown, label: string): string {
  const links =
    stringField(value, label, { maximum: 2_000, optional: true }) ?? '';
  if (!links) return '';
  for (const line of links
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)) {
    let url: URL;
    try {
      url = new URL(line);
    } catch {
      throw new RequestValidationError(
        `${label} must contain one full web link per line.`,
        {
          [label]: 'Use one full http or https link per line.',
        },
      );
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new RequestValidationError(
        `${label} must use http or https links.`,
        {
          [label]: 'Use only http or https links.',
        },
      );
    }
  }
  return links;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestValidationError) {
    return Response.json(
      { ok: false, message: error.message, fields: error.fields },
      { status: error.status },
    );
  }
  console.error('Coding for Justice form error', error);
  return Response.json(
    {
      ok: false,
      message:
        'The private form is temporarily unavailable. Nothing has been published. Please try again later.',
      fields: {},
    },
    { status: 503 },
  );
}
