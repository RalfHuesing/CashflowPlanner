import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan} from '../web/js/domain/scenarios.js';

const settings = {cashCents: 1000, monthlyCents: 100, reserveCents: 200, currentAge: 40, horizonAge: 41, inflationBps: 0};
const goal = {id: 'one', name: 'Auto', amountCents: 1000, type: 'once', dueMonth: '2027-04', flexMonths: 0};

test('the plan retains all real cash and contributes as late as possible', () => {
  const plan = buildPlan(settings, [goal], '2026-10');
  assert.equal(plan.rows[0].cashCents, 1000);
  assert.deepEqual(plan.rows.slice(1, 7).map(row => row.contributionCents), [0, 0, 0, 0, 100, 100]);
  assert.equal(plan.rows[6].cashCents, 200);
});

test('no goals, zero monthly capacity, reserve shortage and current-month goals', () => {
  const empty = buildPlan({...settings, monthlyCents: 0}, [], '2026-10');
  assert.equal(empty.requiredTodayCents, 200);
  assert.equal(empty.rows.at(-1).cashCents, 1000);
  const today = buildPlan(settings, [{...goal, dueMonth: '2026-10'}], '2026-10');
  assert.equal(today.requiredTodayCents, 1200);
  assert.equal(today.firstCriticalMonth, '2026-10');
  assert.equal(today.rows[0].bestCaseContributionCents, 0);
  assert.equal(today.rows[0].contributionCents, null);
  assert.equal(today.criticalEvents[0].goalId, 'one');
  const reserve = buildPlan({...settings, cashCents: 0}, [], '2026-10');
  assert.equal(reserve.firstCriticalMonth, '2026-10');
  assert.deepEqual(reserve.criticalEvents, []);
  assert.equal(buildPlan({...settings, horizonAge: 40}, [], '2026-10').rows.length, 1);
  assert.match(buildPlan(settings, []).startMonth, /^\d{4}-\d{2}$/u);
});

test('an infeasible plan exposes only best-case contributions and dates the first shortfall', () => {
  const plan = buildPlan({...settings, cashCents: 200}, [goal], '2026-10');
  assert.equal(plan.feasible, false);
  assert.equal(plan.gapCents, 400);
  assert.equal(plan.firstCriticalMonth, '2027-04');
  assert.ok(plan.rows.every(row => row.contributionCents === null && row.longTermCents === null));
});

test('overdue imported payments consume current cash without a current-month contribution', () => {
  for (const type of ['once', 'annual']) {
    const plan = buildPlan(settings, [{...goal, type, dueMonth: '2020-03'}], '2026-10');
    assert.equal(plan.feasible, false);
    assert.equal(plan.gapCents, type === 'annual' ? 700 : 200);
    assert.equal(plan.requiredTodayCents, type === 'annual' ? 1700 : 1200);
    assert.equal(plan.firstCriticalMonth, '2026-10');
    assert.equal(plan.rows[0].expenseCents, 1000);
    assert.equal(plan.rows[0].cashCents, 0);
    assert.equal(plan.rows[0].bestCaseContributionCents, 0);
    assert.equal(plan.criticalEvents[0].overdue, true);
    assert.equal(plan.criticalEvents[0].originalMonth, '2020-03');
    assert.equal(plan.events.length, type === 'annual' ? 2 : 1);
    assert.equal(plan.excludedGoals.length, 0);
  }
});

test('annual end months and legacy flexibility preserve original due dates', () => {
  const annual = {...goal, type: 'annual', dueMonth: '2027-04', endMonth: '2027-06', flexMonths: 6};
  const plan = buildPlan({...settings, cashCents: 200, horizonAge: 43}, [annual], '2026-10');
  assert.equal(plan.requiredTodayCents, 600);
  assert.equal(plan.events.length, 1);
  assert.equal(plan.events[0].month, '2027-04');
  assert.equal(plan.feasible, false);
  const ended = buildPlan(settings, [{...annual, dueMonth: '2020-10', endMonth: '2025-10'}], '2026-10');
  assert.equal(ended.requiredTodayCents, 1200);
  assert.equal(ended.events.length, 1);
  assert.equal(ended.rows[0].expenseCents, 1000);
  assert.equal(ended.criticalEvents[0].overdue, true);
});

test('deterministic generated cases uphold cash balance, feasibility and monotonicity', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const input = {...settings, cashCents: (seed * 97) % 4000, monthlyCents: (seed * 13) % 700, reserveCents: (seed * 3) % 100};
    const goals = [{...goal, amountCents: seed * 113, dueMonth: '2027-04'}, {...goal, id: 'two', amountCents: seed * 71, dueMonth: '2027-10'}];
    const plan = buildPlan(input, goals, '2026-10');
    assert.deepEqual(buildPlan(input, goals, '2026-10'), plan);
    // Independent prefix-sum criterion: each payment prefix must fit maximum inflows.
    let cumulativeExpenses = 0;
    let independentlyRequired = input.reserveCents;
    for (const row of plan.rows) {
      cumulativeExpenses += row.expenseCents;
      independentlyRequired = Math.max(independentlyRequired,
        input.reserveCents + cumulativeExpenses - row.index * input.monthlyCents);
    }
    assert.equal(plan.requiredTodayCents, independentlyRequired);
    const richer = buildPlan({...input, cashCents: input.cashCents + 1000}, goals, '2026-10');
    assert.ok(richer.gapCents <= plan.gapCents);
    const moreMonthly = buildPlan({...input, monthlyCents: input.monthlyCents + 10}, goals, '2026-10');
    assert.ok(moreMonthly.requiredTodayCents <= plan.requiredTodayCents);
    const later = buildPlan(input, goals.map(item => ({...item, dueMonth: '2027-10'})), '2026-10');
    assert.ok(later.requiredTodayCents <= plan.requiredTodayCents);
    {
      const paid = plan.rows.reduce((sum, row) => sum + row.expenseCents, 0);
      const added = plan.rows.reduce((sum, row) => sum + row.bestCaseContributionCents, 0);
      assert.equal(plan.rows.at(-1).cashCents, input.cashCents + added - paid);
      if (plan.feasible) for (const row of plan.rows) {
        assert.ok(row.cashCents >= input.reserveCents);
        assert.ok(row.contributionCents >= 0 && row.contributionCents <= input.monthlyCents);
        if (row.index > 0) assert.equal(row.contributionCents + row.longTermCents, input.monthlyCents);
      }
    }
  }
});

test('expenses follow inflation while monthly capacity and the reserve stay nominal', () => {
  const input = {...settings, cashCents: 200, inflationBps: 200};
  const result = buildPlan(input, [{...goal, dueMonth: '2027-10', flexMonths: 12}], '2026-10');
  assert.equal(result.expensesCents[12], 1020);
  assert.equal(result.rows[12].cashCents, 200);
  assert.equal(result.rows[12].requiredCents, 200);
  assert.equal(result.events[0].amountCents, 1020);
  for (const row of result.rows.slice(1)) {
    assert.equal(row.contributionCents + row.longTermCents, 100);
  }
  const {inflationBps: omitted, ...legacy} = input;
  assert.equal(omitted, 200);
  assert.deepEqual(buildPlan(legacy, [goal], '2026-10'), buildPlan(input, [goal], '2026-10'));
});

test('a long horizon with fixed nominal capacity includes inflation-driven future shortfalls', () => {
  const input = {cashCents: 4_000_000, monthlyCents: 100_000, reserveCents: 600_000,
    currentAge: 30, horizonAge: 90, inflationBps: 200};
  // Anonymous payment schedule: no personal names, IDs or imported file dependency.
  const schedule = [
    [1_500_000, '2027-08', 'once'], [250_000, '2026-10', 'once'],
    [100_000, '2026-10', 'annual'], [4_000_000, '2030-10', 'once'],
    [2_000_000, '2036-10', 'once'], [100_000, '2026-10', 'annual'],
    [500_000, '2028-07', 'annual'],
  ];
  const goals = schedule.map(([amountCents, dueMonth, type], index) => ({
    id: String(index), name: `Payment ${index}`, amountCents, dueMonth, type, flexMonths: 0,
  }));
  const plan = buildPlan(input, goals, '2026-10');
  assert.equal(plan.requiredTodayCents, 17_980_743);
  assert.equal(plan.gapCents, 13_980_743);
  assert.equal(plan.firstCriticalMonth, '2030-10');
  assert.equal(plan.feasible, false);
  assert.equal(plan.expensesCents.reduce((sum, value) => sum + value, 0), 89_380_743);
  assert.equal(plan.rows.at(-1).cashCents, -13_380_743);
  assert.ok(plan.rows.slice(1).every(row => row.capacityCents === 100_000
    && row.bestCaseContributionCents === 100_000 && row.contributionCents === null));
  // Independent prefix sums identify the end of the horizon as the binding date.
  let expenses = 0;
  let required = input.reserveCents;
  let bindingMonth = null;
  for (const row of plan.rows) {
    expenses += row.expenseCents;
    const prefixRequirement = input.reserveCents + expenses - row.index * input.monthlyCents;
    if (prefixRequirement > required) {
      required = prefixRequirement;
      bindingMonth = row.month;
    }
  }
  assert.equal(required, plan.requiredTodayCents);
  assert.equal(bindingMonth, '2086-10');
  assert.equal(buildPlan({...input, inflationBps: 0}, goals, '2026-10').requiredTodayCents, 4_050_000);
  const funded = buildPlan({...input, cashCents: required}, goals, '2026-10');
  assert.equal(funded.feasible, true);
  assert.ok(funded.rows.every(row => row.cashCents >= input.reserveCents));
  assert.equal(buildPlan({...input, cashCents: required - 1}, goals, '2026-10').gapCents, 1);
});

test('a feasible plan delays every contributed cent until it is needed', () => {
  const input = {...settings, cashCents: 200, monthlyCents: 300};
  const plan = buildPlan(input, [{...goal, dueMonth: '2027-04'}], '2026-10');
  assert.equal(plan.feasible, true);
  assert.deepEqual(plan.rows.slice(1, 7).map(row => row.contributionCents), [0, 0, 100, 300, 300, 300]);
  // With one cent less in any funded month, even all later capacity cannot pay the goal.
  for (const row of plan.rows.filter(item => item.contributionCents > 0)) {
    const laterCapacity = (6 - row.index) * input.monthlyCents;
    const remainingExpense = plan.rows.slice(row.index + 1, 7).reduce((sum, item) => sum + item.expenseCents, 0);
    assert.equal(row.cashCents - 1 + laterCapacity - remainingExpense, input.reserveCents - 1);
  }
});
