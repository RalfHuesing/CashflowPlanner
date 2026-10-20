import {addMonths, monthDifference, monthNumber} from './calendar.js';
import {assertCents, assertInflationBps, DEFAULT_INFLATION_BPS, safeSum} from './money.js';

export function validateGoal(goal) {
  if (!goal || typeof goal !== 'object' || Array.isArray(goal)) throw new TypeError('Ungültiges Ziel.');
  if (typeof goal.id !== 'string' || !goal.id.trim() || goal.id.length > 100) throw new TypeError('Ungültige Ziel-ID.');
  if (typeof goal.name !== 'string' || !goal.name.trim() || goal.name.length > 120) throw new TypeError('Bitte einen Zielnamen mit maximal 120 Zeichen eingeben.');
  assertCents(goal.amountCents, 'Zielbetrag', true);
  if (!['once', 'annual'].includes(goal.type)) throw new TypeError('Ungültige Wiederholung.');
  monthNumber(goal.dueMonth);
  if (goal.endMonth !== undefined && goal.endMonth !== null) {
    if (goal.type !== 'annual') throw new TypeError('Ein Endmonat ist nur für jährliche Ziele zulässig.');
    if (monthNumber(goal.endMonth) < monthNumber(goal.dueMonth)) throw new RangeError('Der Endmonat darf nicht vor der ersten Fälligkeit liegen.');
  }
  if (!Number.isInteger(goal.flexMonths) || goal.flexMonths < 0 || goal.flexMonths > 1200) throw new RangeError('Ungültiger zeitlicher Spielraum.');
  return goal;
}

function occurrenceIndices(goal, dueIndex, lastMonthIndex) {
  const first = Math.max(0, dueIndex);
  const indices = [first];
  if (goal.type === 'annual') {
    let next = dueIndex < 0 ? ((dueIndex % 12) + 12) % 12 : first + 12;
    if (next === 0) next = 12;
    for (let index = next; index <= lastMonthIndex; index += 12) indices.push(index);
  }
  return indices;
}

function isOverduePayment(goal, dueIndex, endIndex) {
  // A current annual payment is regular only while its schedule is still active.
  return dueIndex < 0 && (goal.type !== 'annual' || dueIndex % 12 !== 0 || endIndex < 0);
}

function validateEventInputs(goals, startMonth, horizon, inflationBps) {
  monthNumber(startMonth);
  assertInflationBps(inflationBps);
  if (!Number.isInteger(horizon) || horizon < 0 || horizon > 1440) throw new RangeError('Ungültiger Planungshorizont.');
  if (!Array.isArray(goals) || goals.length > 1000) throw new RangeError('Maximal 1.000 Ziele sind zulässig.');
}

/** Preserve due dates, with outstanding past payments payable today. */
export function generateEvents(goals, startMonth, horizon, inflationBps = DEFAULT_INFLATION_BPS) {
  validateEventInputs(goals, startMonth, horizon, inflationBps);
  const seen = new Set();
  const events = [];
  const excludedGoals = [];
  const recurringGoalIds = [];
  for (const goal of goals) {
    validateGoal(goal);
    if (seen.has(goal.id)) throw new TypeError('Ziel-IDs müssen eindeutig sein.');
    seen.add(goal.id);
    const dueIndex = monthDifference(startMonth, goal.dueMonth);
    const endIndex = goal.endMonth === undefined || goal.endMonth === null ? horizon : monthDifference(startMonth, goal.endMonth);
    const lastMonthIndex = Math.min(horizon, endIndex);
    const overdue = isOverduePayment(goal, dueIndex, endIndex);
    // Past dates represent one outstanding payment, payable now. Future annual
    // payments retain their original calendar month; past years are not backfilled.
    const first = Math.max(0, dueIndex);
    if (goal.type === 'annual') {
      recurringGoalIds.push(goal.id);
    }
    if (first > horizon) {
      excludedGoals.push({...goal, reason: 'after-horizon'});
      continue;
    }
    const indices = occurrenceIndices(goal, dueIndex, lastMonthIndex);
    for (const index of indices) {
      const overdueOccurrence = overdue && index === 0;
      const amountCents = Math.round(goal.amountCents * (1 + inflationBps / 10000) ** (index / 12));
      if (!Number.isSafeInteger(amountCents)) throw new RangeError('Der Zielbetrag mit Inflation ist zu groß.');
      events.push({goalId: goal.id, name: goal.name, amountCents,
        index, month: addMonths(startMonth, index),
        originalMonth: overdueOccurrence ? goal.dueMonth : addMonths(startMonth, index),
        overdue: overdueOccurrence});
    }
  }
  events.sort((a, b) => a.index - b.index || a.goalId.localeCompare(b.goalId));
  const expensesCents = Array(horizon + 1).fill(0);
  for (const event of events) expensesCents[event.index] = safeSum(expensesCents[event.index], event.amountCents);
  return {events, expensesCents, excludedGoals, recurringGoalIds};
}
