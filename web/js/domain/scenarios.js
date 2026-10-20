import {addMonths, ageAtMonth, currentMonth, horizonMonths} from './calendar.js';
import {generateEvents} from './goals.js';
import {calculateLiquidity, validateSettings} from './liquidity.js';
import {safeSum} from './money.js';

/** t=0 has no contribution. Future contributions precede their month's expenses. */
export function buildPlan(settings, goals, startMonth = currentMonth()) {
  validateSettings(settings);
  const horizon = horizonMonths(settings.currentAge, settings.horizonAge);
  const generated = generateEvents(goals, startMonth, horizon, settings.inflationBps);
  const liquidity = calculateLiquidity(generated.expensesCents, settings);
  let cash = settings.cashCents;
  let firstCriticalMonth = null;
  let criticalEvents = [];
  const rows = [];
  const eventsByMonth = Array.from({length: horizon + 1}, () => []);
  for (const event of generated.events) eventsByMonth[event.index].push(event);
  for (let index = 0; index <= horizon; index++) {
    const capacityCents = index === 0 ? 0 : settings.monthlyCents;
    const expenseCents = generated.expensesCents[index];
    const requiredCents = liquidity.requirementsCents[index];
    const contribution = index === 0 ? 0 : liquidity.feasible
      ? Math.max(0, safeSum(requiredCents, expenseCents) - cash) : capacityCents;
    cash = safeSum(cash, contribution) - expenseCents;
    if (cash < settings.reserveCents && firstCriticalMonth === null) {
      firstCriticalMonth = addMonths(startMonth, index);
      criticalEvents = eventsByMonth[index];
    }
    rows.push({index, month: addMonths(startMonth, index), age: ageAtMonth(settings.currentAge, index),
      cashCents: cash, requiredCents, expenseCents, capacityCents,
      contributionCents: liquidity.feasible ? contribution : null,
      longTermCents: liquidity.feasible ? capacityCents - contribution : null,
      bestCaseContributionCents: contribution, events: eventsByMonth[index]});
  }
  return {...liquidity, ...generated, rows, firstCriticalMonth, criticalEvents,
    startMonth, horizonMonth: addMonths(startMonth, horizon)};
}
