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
  let inflated;
  if (monthIndex % 12 === 0) {
    // Whole years are rational: round only the final amount, exactly half up.
    const years = BigInt(monthIndex / 12);
    const numerator = BigInt(cents) * BigInt(10000 + inflationBps) ** years;
    const denominator = 10000n ** years;
    inflated = Number((numerator + denominator / 2n) / denominator);
  } else {
    const approximate = cents * (1 + inflationBps / 10000) ** (monthIndex / 12);
    // Allow for error in both the annual factor and its fractional power.
    const uncertainty = Math.abs(approximate) * Number.EPSILON * (monthIndex / 12 + 2) * 4;
    const halfDistance = Math.abs(approximate - Math.floor(approximate) - 0.5);
    if (!Number.isFinite(approximate) || approximate - uncertainty > Number.MAX_SAFE_INTEGER) inflated = approximate;
    else if (halfDistance > uncertainty) inflated = Math.round(approximate);
    else inflated = roundFractionalInflation(cents, inflationBps, monthIndex, approximate, uncertainty);
  }
  if (!Number.isSafeInteger(inflated)) {
    const article = name === 'Mindestreserve' ? 'Die' : 'Der';
    throw new RangeError(`${article} ${name} mit Inflation ist zu groß.`);
  }
  return inflated;
}

function roundFractionalInflation(cents, inflationBps, monthIndex, approximate, uncertainty) {
  // Near a half-cent, compare positive twelfth powers instead of adding an
  // epsilon that could incorrectly round a genuine value below the boundary.
  const numerator = (2n * BigInt(cents)) ** 12n * BigInt(10000 + inflationBps) ** BigInt(monthIndex);
  const denominator = 10000n ** BigInt(monthIndex);
  let low = BigInt(Math.max(0, Math.floor(approximate - uncertainty) - 1));
  let high = BigInt(Math.min(Number.MAX_SAFE_INTEGER + 1, Math.ceil(approximate + uncertainty) + 1));
  while (low < high) {
    const middle = (low + high) / 2n;
    if (numerator >= (2n * middle + 1n) ** 12n * denominator) low = middle + 1n;
    else high = middle;
  }
  return Number(low);
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
