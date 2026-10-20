import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEvents, validateGoal} from '../web/js/domain/goals.js';

const goal = {id: 'one', name: 'Urlaub', amountCents: 12345, type: 'annual', dueMonth: '2025-11', flexMonths: 6};

test('overdue annual goals are due immediately and retain future calendar-month cadence', () => {
  const plan = generateEvents([goal], '2026-10', 13, false, 0);
  assert.deepEqual(plan.events.map(event => event.index), [0, 1, 13]);
  assert.equal(plan.expensesCents[0], 12345);
  assert.equal(plan.expensesCents[1], 12345);
  assert.equal(plan.expensesCents[13], 12345);
  assert.deepEqual(plan.events.map(event => event.overdue), [true, false, false]);
  assert.deepEqual(plan.events.map(event => event.originalMonth), ['2025-11', '2026-11', '2027-11']);
  assert.deepEqual(plan.recurringGoalIds, ['one']);
  assert.equal(generateEvents([goal], '2026-10', 0).events.length, 1);
  assert.deepEqual(generateEvents([{...goal, dueMonth: '2027-11'}], '2026-10', 13).events.map(event => event.index), [13]);
  const currentAnnualMonth = generateEvents([{...goal, dueMonth: '2020-10'}], '2026-10', 24);
  assert.deepEqual(currentAnnualMonth.events.map(event => event.index), [0, 12, 24]);
  assert.equal(currentAnnualMonth.events[0].overdue, false);
  assert.equal(currentAnnualMonth.events[0].originalMonth, '2026-10');
  const earlierAnnualMonth = generateEvents([{...goal, dueMonth: '2020-04'}], '2026-10', 24);
  assert.deepEqual(earlierAnnualMonth.events.map(event => event.month), ['2026-10', '2027-04', '2028-04']);
});

test('past one-offs are payable today and only future goals beyond horizon are excluded', () => {
  const goals = [{...goal, type: 'once', dueMonth: '2026-10'}, {...goal, id: 'two', type: 'once', dueMonth: '2026-10'}, {...goal, id: 'past', type: 'once'}, {...goal, id: 'future', dueMonth: '2050-01'}];
  const result = generateEvents(goals, '2026-10', 12);
  assert.equal(result.expensesCents[0], 37035);
  assert.deepEqual(result.excludedGoals.map(item => item.reason), ['after-horizon']);
  const overdueEvent = result.events.find(event => event.goalId === 'past');
  assert.equal(overdueEvent.month, '2026-10');
  assert.equal(overdueEvent.originalMonth, '2025-11');
  assert.equal(overdueEvent.overdue, true);
  assert.equal(generateEvents([{...goal, type: 'once'}], '2026-10', 0).expensesCents[0], 12345);
});

test('flexibility retains all occurrences and consistent annual cadence', () => {
  const result = generateEvents([{...goal, dueMonth: '2026-10'}], '2026-10', 15, true);
  assert.deepEqual(result.events.map(event => event.index), [3, 15]);
  assert.equal(result.shiftedGoals[0].shiftMonths, 3);
  assert.equal(generateEvents([goal], '2026-10', 13, true).shiftedGoals.length, 0);
  const delayedOverdue = generateEvents([goal], '2026-10', 15, true);
  assert.deepEqual(delayedOverdue.events.map(event => event.index), [0, 3, 15]);
  assert.equal(delayedOverdue.events[0].overdue, true);
  assert.equal(delayedOverdue.events[0].originalMonth, '2025-11');
  assert.equal(delayedOverdue.events[0].shiftMonths, 0);
  assert.equal(delayedOverdue.shiftedGoals[0].fromMonth, '2026-11');
  assert.equal(delayedOverdue.shiftedGoals[0].toMonth, '2027-01');
  const overdueOnce = generateEvents([{...goal, type: 'once'}], '2026-10', 15, true);
  assert.equal(overdueOnce.events[0].index, 0);
  assert.equal(overdueOnce.events[0].shiftMonths, 0);
  assert.deepEqual(overdueOnce.shiftedGoals, []);
  const onlyOverdueAnnual = generateEvents([goal], '2026-10', 0, true);
  assert.equal(onlyOverdueAnnual.events[0].index, 0);
  assert.deepEqual(onlyOverdueAnnual.shiftedGoals, []);
});

test('invalid goals and limits fail explicitly', () => {
  for (const patch of [{id: ''}, {name: ''}, {name: 'x'.repeat(121)}, {amountCents: 0}, {type: 'monthly'}, {dueMonth: 'bad'}, {flexMonths: -1}, {flexMonths: 0.5}, {flexMonths: 1201}]) assert.throws(() => validateGoal({...goal, ...patch}));
  for (const invalid of [null, [], 1]) assert.throws(() => validateGoal(invalid));
  assert.throws(() => validateGoal({...goal, id: 'x'.repeat(101)}));
  assert.throws(() => generateEvents([goal, goal], '2026-10', 12));
  for (const horizon of [-1, 0.1, 1441]) assert.throws(() => generateEvents([], '2026-10', horizon));
  assert.throws(() => generateEvents(null, '2026-10', 1));
  assert.throws(() => generateEvents(Array(1001).fill(goal), '2026-10', 1));
});

test('annual effective inflation compounds from today and rounds each occurrence to cents', () => {
  const annual = {...goal, amountCents: 10000, dueMonth: '2026-10'};
  const result = generateEvents([annual], '2026-10', 24, false, 200);
  assert.deepEqual(result.events.map(event => event.amountCents), [10000, 10200, 10404]);
  assert.deepEqual(generateEvents([annual], '2026-10', 24, false, 0).events.map(event => event.amountCents), [10000, 10000, 10000]);
  const halfYear = generateEvents([{...annual, type: 'once', dueMonth: '2027-04'}], '2026-10', 12);
  assert.equal(halfYear.events[0].amountCents, 10100);
  assert.equal(halfYear.expensesCents[6], 10100);
  // An annual amount is calculated from its present value, not a rounded prior year.
  const rounding = generateEvents([{...annual, amountCents: 24}], '2026-10', 24, false, 200);
  assert.deepEqual(rounding.events.map(event => event.amountCents), [24, 24, 25]);
});

test('inflation uses actual delayed payment dates and leaves overdue payments at present value', () => {
  const annual = {...goal, amountCents: 10000, dueMonth: '2025-11'};
  const result = generateEvents([annual], '2026-10', 18, true, 200);
  assert.deepEqual(result.events.map(event => event.index), [0, 6, 18]);
  assert.deepEqual(result.events.map(event => event.amountCents), [10000, 10100, 10301]);
  assert.equal(result.events[0].overdue, true);
  const once = generateEvents([{...annual, type: 'once', dueMonth: '2027-04'}], '2026-10', 12, true, 200);
  assert.equal(once.events[0].amountCents, 10200);
  const overdue = generateEvents([{...annual, type: 'once'}], '2026-10', 12, true, 10000);
  assert.equal(overdue.events[0].amountCents, 10000);
});

test('invalid inflation and unsafe inflated payments or monthly totals fail explicitly', () => {
  for (const rate of [-1, 10001, 0.5, NaN, Infinity, null, '200']) {
    assert.throws(() => generateEvents([], '2026-10', 12, false, rate), RangeError);
  }
  const large = {...goal, amountCents: 10_000_000_000, type: 'once', dueMonth: '2046-10'};
  assert.throws(() => generateEvents([large], '2026-10', 240, false, 10000), /zu groß/u);
  const goals = [large, {...large, id: 'two'}].map(item => ({...item, dueMonth: '2045-10'}));
  // Each event fits safe integer cents, but their sum does not.
  assert.throws(() => generateEvents(goals, '2026-10', 228, false, 10000), /Gesamtbetrag/u);
  assert.equal(generateEvents([{...large, dueMonth: '2146-10'}], '2026-10', 1440, false, 0).events[0].amountCents, large.amountCents);
});
