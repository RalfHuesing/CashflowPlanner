export function monthNumber(month) {
  if (typeof month !== 'string' || !/^(?:19\d{2}|[2-9]\d{3})-(?:0[1-9]|1[0-2])$/u.test(month)) {
    throw new RangeError('Bitte einen gültigen Kalendermonat angeben (JJJJ-MM).');
  }
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1;
}

export function addMonths(month, count) {
  if (!Number.isInteger(count)) throw new RangeError('Monatsabstand muss ganzzahlig sein.');
  const value = monthNumber(month) + count;
  const result = `${Math.floor(value / 12)}-${String(value % 12 + 1).padStart(2, '0')}`;
  monthNumber(result);
  return result;
}

export function monthDifference(start, end) {
  return monthNumber(end) - monthNumber(start);
}

export function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function ageAtMonth(currentAge, index) {
  return currentAge + index / 12;
}

export function horizonMonths(currentAge, horizonAge) {
  if (!Number.isInteger(currentAge) || !Number.isInteger(horizonAge)
    || currentAge < 0 || horizonAge < currentAge || horizonAge > 120) {
    throw new RangeError('Das Planungsalter muss zwischen aktuellem Alter und 120 Jahren liegen.');
  }
  return (horizonAge - currentAge) * 12;
}

export function formatMonth(month) {
  monthNumber(month);
  return new Intl.DateTimeFormat('de-DE', {month: 'long', year: 'numeric', timeZone: 'UTC'})
    .format(new Date(`${month}-01T00:00:00Z`));
}
