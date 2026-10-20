/** Input ceiling; inflated payments and their totals are checked separately. */
export const MAX_CENTS = 10_000_000_000;
export const DEFAULT_INFLATION_BPS = 200;

export function assertInflationBps(value) {
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new RangeError('Die Inflation muss zwischen 0 und 100 Prozent liegen.');
  }
  return value;
}

export function assertCents(value, name = 'Betrag', positive = false) {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0) || value > MAX_CENTS) {
    throw new RangeError(`${name} muss ein gültiger ganzzahliger Centbetrag sein.`);
  }
  return value;
}

export function inflateAmount(cents, inflationBps = DEFAULT_INFLATION_BPS, monthIndex = 0, name = 'Betrag') {
  if (inflationBps === 0 || monthIndex === 0 || cents === 0) return cents;
  const inflated = Math.round(cents * (1 + inflationBps / 10000) ** (monthIndex / 12));
  if (!Number.isSafeInteger(inflated)) {
    const article = name === 'Mindestreserve' ? 'Die' : 'Der';
    throw new RangeError(`${article} ${name} mit Inflation ist zu groß.`);
  }
  return inflated;
}

export function safeSum(a, b) {
  const result = a + b;
  if (!Number.isSafeInteger(result)) throw new RangeError('Der Gesamtbetrag ist zu groß.');
  return result;
}

/** Decimal text is converted digit by digit; no floating point multiplication. */
export function parseEuro(value) {
  if (typeof value !== 'string') throw new TypeError('Bitte einen Eurobetrag eingeben.');
  const text = value.trim().replace(/\s|€/gu, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/u.test(text)) {
    throw new TypeError('Bitte einen gültigen Eurobetrag eingeben (z. B. 1.234,56).');
  }
  const [whole, fraction = ''] = text.replaceAll('.', '').split(',');
  return assertCents(Number(`${whole}${fraction.padEnd(2, '0')}`));
}

export function formatEuro(cents) {
  if (!Number.isSafeInteger(cents)) throw new RangeError('Ungültiger Centbetrag.');
  return new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(cents / 100);
}
