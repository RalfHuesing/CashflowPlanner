import {addMonths, ageAtMonth, currentMonth, horizonMonths} from './calendar.js';
import {generateEvents} from './goals.js';
import {calculateLiquidity, validateSettings} from './liquidity.js';
import {safeSum} from './money.js';

/** t=0 has no contribution. Future contributions precede their month's expenses. */
export function buildPlan(settings, goals, startMonth = currentMonth(), {release = false, delayed = false} = {}) {
  validateSettings(settings);
  const horizon = horizonMonths(settings.currentAge, settings.horizonAge);
  const generated = generateEvents(goals, startMonth, horizon, delayed, settings.inflationBps);
  const liquidity = calculateLiquidity(generated.expensesCents, settings);
  const releasedCents = release ? liquidity.releasableCents : 0;
  let cash = settings.cashCents - releasedCents;
  let firstCriticalMonth = null;
  let criticalEvents = [];
  const rows = [];
  const eventsByMonth = Array.from({length: horizon + 1}, () => []);
  for (const event of generated.events) eventsByMonth[event.index].push(event);
  for (let index = 0; index <= horizon; index++) {
    const expenseCents = generated.expensesCents[index];
    const requiredCents = liquidity.requirementsCents[index];
    const contribution = index === 0 ? 0 : liquidity.feasible
      ? Math.max(0, safeSum(requiredCents, expenseCents) - cash) : settings.monthlyCents;
    cash = safeSum(cash, contribution) - expenseCents;
    if (cash < settings.reserveCents && firstCriticalMonth === null) {
      firstCriticalMonth = addMonths(startMonth, index);
      criticalEvents = eventsByMonth[index];
    }
    rows.push({index, month: addMonths(startMonth, index), age: ageAtMonth(settings.currentAge, index),
      cashCents: cash, requiredCents, expenseCents,
      contributionCents: liquidity.feasible ? contribution : null,
      longTermCents: liquidity.feasible ? (index === 0 ? 0 : settings.monthlyCents - contribution) : null,
      bestCaseContributionCents: contribution, events: eventsByMonth[index]});
  }
  return {...liquidity, ...generated, releasedCents, rows, firstCriticalMonth, criticalEvents,
    scenario: delayed ? 'flexibility' : release ? 'release' : 'keep', theoretical: delayed || release,
    startMonth, horizonMonth: addMonths(startMonth, horizon)};
}

export function buildScenarios(settings, goals, startMonth = currentMonth()) {
  const keep = buildPlan(settings, goals, startMonth);
  const release = buildPlan(settings, goals, startMonth, {release: true});
  const flexible = !keep.feasible && goals.some(goal => goal.flexMonths > 0)
    ? buildPlan(settings, goals, startMonth, {delayed: true}) : null;
  return {keep, release, flexibility: flexible};
}
