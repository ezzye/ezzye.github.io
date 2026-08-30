const PILOT_TIME_ZONE = 'Europe/London';
const DAY_MS = 24 * 60 * 60 * 1_000;

type DateParts = { year: number; month: number; day: number };

function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function londonDateParts(at: Date): DateParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PILOT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function timeZoneOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PILOT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const shownAsUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return shownAsUtc - at.getTime();
}

function londonMidnightUtc(parts: DateParts): Date {
  const wallClock = Date.UTC(parts.year, parts.month - 1, parts.day);
  const firstGuess = new Date(wallClock);
  const corrected = new Date(wallClock - timeZoneOffsetMs(firstGuess));
  return new Date(wallClock - timeZoneOffsetMs(corrected));
}

export function isValidPublicEmail(value: string): boolean {
  return (
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !/[\r\n]/.test(value)
  );
}

export function isStrictIsoDate(value: string): boolean {
  return Boolean(parseIsoDate(value));
}

export function pilotApprovalSnapshotIsCurrent(
  approvedAt: string | null,
  approvedSnapshot: string | null,
  currentSnapshot: string | null,
): boolean {
  return Boolean(
    approvedAt &&
    approvedSnapshot &&
    currentSnapshot &&
    approvedSnapshot === currentSnapshot,
  );
}

export function pilotClosingDateIsAllowed(
  value: string,
  now = new Date(),
): boolean {
  const closing = parseIsoDate(value);
  if (!closing) return false;
  const today = londonDateParts(now);
  const closingDay = Date.UTC(closing.year, closing.month - 1, closing.day);
  const todayDay = Date.UTC(today.year, today.month - 1, today.day);
  const daysAway = (closingDay - todayDay) / DAY_MS;
  return daysAway >= 7 && daysAway <= 90;
}

export function pilotClosingInstant(value: string): string | null {
  const closing = parseIsoDate(value);
  if (!closing) return null;
  const followingDay = new Date(
    Date.UTC(closing.year, closing.month - 1, closing.day + 1),
  );
  return londonMidnightUtc({
    year: followingDay.getUTCFullYear(),
    month: followingDay.getUTCMonth() + 1,
    day: followingDay.getUTCDate(),
  }).toISOString();
}
