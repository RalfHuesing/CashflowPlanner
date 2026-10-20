import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan, buildScenarios} from '../web/js/domain/scenarios.js';

const settings = {cashCents: 1000, monthlyCents: 100, reserveCents: 200, currentAge: 40, horizonAge: 41, inflationBps: 0};
const goal = {id: 'one', name: 'Auto', amountCents: 1000, type: 'once', dueMonth: '2027-04', flexMonths: 0};

test('A retains real cash while B simulates explicit release and saves as late as possible', () => {
  const {keep, release, flexibility} = buildScenarios(settings, [goal], '2026-10');
  assert.equal(keep.releasedCents, 0);
  assert.equal(release.releasedCents, 400);
  assert.equal(release.rows[0].cashCents, 600);
  assert.deepEqual(keep.rows.slice(1, 7).map(row => row.contributionCents), [0, 0, 0, 0, 100, 100]);
  assert.equal(keep.rows[6].cashCents, 200);
  assert.equal(flexibility, null);
  assert.equal(release.theoretical, true);
});

test('no goals, zero monthly capacity, reserve shortage and current-month goals', () => {
  const empty = buildScenarios({...settings, monthlyCents: 0}, [], '2026-10');
  assert.equal(empty.keep.requiredTodayCents, 200);
  assert.equal(empty.release.rows.at(-1).cashCents, 200);
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

test('maximum permitted delay can solve shortfalls without dropping horizon payments', () => {
  const result = buildScenarios({...settings, cashCents: 200}, [{...goal, flexMonths: 4}], '2026-10');
  assert.equal(result.keep.feasible, false);
  assert.equal(result.flexibility.feasible, true);
  assert.equal(result.flexibility.events[0].month, '2027-08');
  assert.equal(result.flexibility.events.length, result.keep.events.length);
  const blocked = buildScenarios({...settings, cashCents: 0}, [{...goal, dueMonth: '2027-10', amountCents: 2000, flexMonths: 6}], '2026-10');
  assert.equal(blocked.flexibility.feasible, false);
  assert.equal(blocked.flexibility.events[0].month, '2027-10');
});

test('annual end months constrain funding and cannot be crossed to solve a shortfall', () => {
  const annual = {...goal, type: 'annual', dueMonth: '2027-04', endMonth: '2027-06', flexMonths: 6};
  const result = buildScenarios({...settings, cashCents: 200, horizonAge: 43}, [annual], '2026-10');
  assert.equal(result.keep.requiredTodayCents, 600);
  assert.equal(result.keep.events.length, 1);
  assert.equal(result.flexibility.events.length, 1);
  assert.equal(result.flexibility.events[0].month, '2027-06');
  assert.equal(result.flexibility.requiredTodayCents, 400);
  assert.equal(result.flexibility.feasible, false);
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
    const scenarios = buildScenarios(input, goals, '2026-10');
    assert.deepEqual(buildScenarios(input, goals, '2026-10'), scenarios);
    // Independent prefix-sum criterion: each payment prefix must fit maximum inflows.
    let cumulativeExpenses = 0;
    let independentlyRequired = input.reserveCents;
    for (const row of scenarios.keep.rows) {
      cumulativeExpenses += row.expenseCents;
      independentlyRequired = Math.max(independentlyRequired,
        input.reserveCents + cumulativeExpenses - row.index * input.monthlyCents);
    }
    assert.equal(scenarios.keep.requiredTodayCents, independentlyRequired);
    const richer = buildPlan({...input, cashCents: input.cashCents + 1000}, goals, '2026-10');
    assert.ok(richer.gapCents <= scenarios.keep.gapCents);
    const moreMonthly = buildPlan({...input, monthlyCents: input.monthlyCents + 10}, goals, '2026-10');
    assert.ok(moreMonthly.requiredTodayCents <= scenarios.keep.requiredTodayCents);
    const later = buildPlan(input, goals.map(item => ({...item, dueMonth: '2027-10'})), '2026-10');
    assert.ok(later.requiredTodayCents <= scenarios.keep.requiredTodayCents);
    for (const plan of [scenarios.keep, scenarios.release]) {
      const paid = plan.rows.reduce((sum, row) => sum + row.expenseCents, 0);
      const added = plan.rows.reduce((sum, row) => sum + row.bestCaseContributionCents, 0);
      assert.equal(plan.rows.at(-1).cashCents, input.cashCents - plan.releasedCents + added - paid);
      if (plan.feasible) for (const row of plan.rows) {
        assert.ok(row.cashCents >= input.reserveCents);
        assert.ok(row.contributionCents >= 0 && row.contributionCents <= input.monthlyCents);
        if (row.index > 0) assert.equal(row.contributionCents + row.longTermCents, input.monthlyCents);
      }
    }
  }
});

test('inflated expenses determine funding while monthly capacity and reserve remain nominal', () => {
  const input = {...settings, cashCents: 200, inflationBps: 200};
  const result = buildScenarios(input, [{...goal, dueMonth: '2027-10', flexMonths: 12}], '2026-10');
  assert.equal(result.keep.expensesCents[12], 1020);
  assert.equal(result.keep.rows[12].cashCents, 200);
  assert.equal(result.keep.rows[12].requiredCents, 200);
  assert.equal(result.release.events[0].amountCents, 1020);
  for (const row of result.keep.rows.slice(1)) {
    assert.equal(row.contributionCents + row.longTermCents, 100);
  }
  const {inflationBps: omitted, ...legacy} = input;
  assert.equal(omitted, 200);
  assert.deepEqual(buildPlan(legacy, [goal], '2026-10'), buildPlan(input, [goal], '2026-10'));
  const flexible = buildScenarios(input, [{...goal, flexMonths: 4}], '2026-10');
  assert.equal(flexible.keep.feasible, false);
  assert.equal(flexible.flexibility.events[0].index, 10);
  assert.equal(flexible.flexibility.events[0].amountCents, 1017);
  assert.equal(flexible.flexibility.feasible, false);
});
