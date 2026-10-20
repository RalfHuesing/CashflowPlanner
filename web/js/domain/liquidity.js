import {horizonMonths} from './calendar.js';
import {assertCents, assertInflationBps, DEFAULT_INFLATION_BPS, inflateAmount, safeSum} from './money.js';

export function validateSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('Ungültige Ausgangslage.');
  assertCents(settings.cashCents, 'Cashbestand');
  assertCents(settings.monthlyCents, 'Monatsbetrag');
  assertCents(settings.reserveCents, 'Mindestreserve');
  assertInflationBps(settings.inflationBps === undefined ? DEFAULT_INFLATION_BPS : settings.inflationBps);
  horizonMonths(settings.currentAge, settings.horizonAge);
  return settings;
}

export function reserveAtMonth(reserveCents, inflationBps = DEFAULT_INFLATION_BPS, monthIndex = 0) {
  return inflateAmount(reserveCents, inflationBps, monthIndex, 'Mindestreserve');
}

/** F[t] is required at month END, after all month t expenses. E[0] is separate. */
export function calculateLiquidity(expensesCents, settings) {
  validateSettings(settings);
  if (!Array.isArray(expensesCents) || !expensesCents.length) throw new TypeError('Monatsausgaben fehlen.');
  for (const value of expensesCents) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Ungültige Monatsausgaben.');
  }
  const inflationBps = settings.inflationBps === undefined ? DEFAULT_INFLATION_BPS : settings.inflationBps;
  const horizon = expensesCents.length - 1;
  const requirementsCents = Array(expensesCents.length);
  requirementsCents[horizon] = reserveAtMonth(settings.reserveCents, inflationBps, horizon);
  for (let t = horizon; t > 0; t--) {
    const reserve = reserveAtMonth(settings.reserveCents, inflationBps, t - 1);
    requirementsCents[t - 1] = Math.max(reserve,
      safeSum(requirementsCents[t], expensesCents[t]) - settings.monthlyCents);
  }
  const requiredTodayCents = safeSum(expensesCents[0], requirementsCents[0]);
  const gapCents = Math.max(0, requiredTodayCents - settings.cashCents);
  return {requirementsCents, requiredTodayCents, gapCents,
    releasableCents: Math.max(0, settings.cashCents - requiredTodayCents), feasible: gapCents === 0};
}
