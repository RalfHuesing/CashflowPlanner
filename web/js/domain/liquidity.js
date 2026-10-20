import {horizonMonths} from './calendar.js';
import {assertCents, safeSum} from './money.js';

export function validateSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('Ungültige Ausgangslage.');
  assertCents(settings.cashCents, 'Cashbestand');
  assertCents(settings.monthlyCents, 'Monatsbetrag');
  assertCents(settings.reserveCents, 'Mindestreserve');
  horizonMonths(settings.currentAge, settings.horizonAge);
  return settings;
}

/** F[t] is required at month END, after all month t expenses. E[0] is separate. */
export function calculateLiquidity(expensesCents, settings) {
  validateSettings(settings);
  if (!Array.isArray(expensesCents) || !expensesCents.length) throw new TypeError('Monatsausgaben fehlen.');
  for (const value of expensesCents) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Ungültige Monatsausgaben.');
  }
  const requirementsCents = Array(expensesCents.length).fill(settings.reserveCents);
  for (let t = expensesCents.length - 1; t > 0; t--) {
    requirementsCents[t - 1] = Math.max(settings.reserveCents,
      safeSum(requirementsCents[t], expensesCents[t]) - settings.monthlyCents);
  }
  const requiredTodayCents = safeSum(expensesCents[0], requirementsCents[0]);
  const gapCents = Math.max(0, requiredTodayCents - settings.cashCents);
  return {requirementsCents, requiredTodayCents, gapCents,
    releasableCents: Math.max(0, settings.cashCents - requiredTodayCents), feasible: gapCents === 0};
}
