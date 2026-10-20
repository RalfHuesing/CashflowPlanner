/** Input ceiling keeps even 1,000 annual goals over 120 years safely integral. */
export const MAX_CENTS = 10_000_000_000;

export function assertCents(value, name = 'Betrag', positive = false) {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0) || value > MAX_CENTS) {
    throw new RangeError(`${name} muss ein gültiger ganzzahliger Centbetrag sein.`);
  }
  return value;
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
