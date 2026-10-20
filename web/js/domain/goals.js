import {addMonths, monthDifference, monthNumber} from './calendar.js';
import {assertCents, safeSum} from './money.js';

export function validateGoal(goal) {
  if (!goal || typeof goal !== 'object' || Array.isArray(goal)) throw new TypeError('Ungültiges Ziel.');
  if (typeof goal.id !== 'string' || !goal.id.trim() || goal.id.length > 100) throw new TypeError('Ungültige Ziel-ID.');
  if (typeof goal.name !== 'string' || !goal.name.trim() || goal.name.length > 120) throw new TypeError('Bitte einen Zielnamen mit maximal 120 Zeichen eingeben.');
  assertCents(goal.amountCents, 'Zielbetrag', true);
  if (!['once', 'annual'].includes(goal.type)) throw new TypeError('Ungültige Wiederholung.');
  monthNumber(goal.dueMonth);
  if (!Number.isInteger(goal.flexMonths) || goal.flexMonths < 0 || goal.flexMonths > 1200) throw new RangeError('Ungültiger zeitlicher Spielraum.');
  return goal;
}

function occurrenceIndices(goal, dueIndex, horizon) {
  const first = Math.max(0, dueIndex);
  const indices = [first];
  if (goal.type === 'annual') {
    let next = dueIndex < 0 ? ((dueIndex % 12) + 12) % 12 : first + 12;
    if (next === 0) next = 12;
    for (let index = next; index <= horizon; index += 12) indices.push(index);
  }
  return indices;
}

function isOverduePayment(goal, dueIndex) {
  // An annual payment in this calendar month is regularly due, not overdue.
  return dueIndex < 0 && (goal.type !== 'annual' || dueIndex % 12 !== 0);
}

/** Delay future events together, preserving overdue payments today and every event. */
export function generateEvents(goals, startMonth, horizon, delayed = false) {
  monthNumber(startMonth);
  if (!Number.isInteger(horizon) || horizon < 0 || horizon > 1440) throw new RangeError('Ungültiger Planungshorizont.');
  if (!Array.isArray(goals) || goals.length > 1000) throw new RangeError('Maximal 1.000 Ziele sind zulässig.');
  const seen = new Set();
  const events = [];
  const excludedGoals = [];
  const shiftedGoals = [];
  const recurringGoalIds = [];
  for (const goal of goals) {
    validateGoal(goal);
    if (seen.has(goal.id)) throw new TypeError('Ziel-IDs müssen eindeutig sein.');
    seen.add(goal.id);
    const dueIndex = monthDifference(startMonth, goal.dueMonth);
    const overdue = isOverduePayment(goal, dueIndex);
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
    const indices = occurrenceIndices(goal, dueIndex, horizon);
    const last = indices.at(-1);
    const firstShiftableIndex = overdue ? indices[1] : first;
    const shiftMonths = delayed && firstShiftableIndex !== undefined ? Math.min(goal.flexMonths, horizon - last) : 0;
    if (shiftMonths > 0) shiftedGoals.push({id: goal.id, name: goal.name, shiftMonths, fromMonth: addMonths(startMonth, firstShiftableIndex), toMonth: addMonths(startMonth, firstShiftableIndex + shiftMonths)});
    for (const index of indices) {
      const overdueOccurrence = overdue && index === 0;
      const eventShift = overdueOccurrence ? 0 : shiftMonths;
      events.push({goalId: goal.id, name: goal.name, amountCents: goal.amountCents,
        index: index + eventShift, month: addMonths(startMonth, index + eventShift),
        originalMonth: overdueOccurrence ? goal.dueMonth : addMonths(startMonth, index),
        overdue: overdueOccurrence, shiftMonths: eventShift});
    }
  }
  events.sort((a, b) => a.index - b.index || a.goalId.localeCompare(b.goalId));
  const expensesCents = Array(horizon + 1).fill(0);
  for (const event of events) expensesCents[event.index] = safeSum(expensesCents[event.index], event.amountCents);
  return {events, expensesCents, excludedGoals, shiftedGoals, recurringGoalIds};
}
