import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateLiquidity, reserveAtMonth, validateSettings} from '../web/js/domain/liquidity.js';
import {buildPlan} from '../web/js/domain/scenarios.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/scenarios.json', import.meta.url), 'utf8'));
const settings = {cashCents: 100, monthlyCents: 20, reserveCents: 10, currentAge: 40, horizonAge: 41};

test('backwards requirements and current-month expenses use exact cents', () => {
  const result = calculateLiquidity([7, 0, 71], settings);
  assert.deepEqual(result.requirementsCents, [41, 61, 10]);
  assert.equal(result.requiredTodayCents, 48);
  assert.equal(result.releasableCents, 52);
  assert.equal(result.gapCents, 0);
  assert.equal(calculateLiquidity([101], settings).gapCents, 11);
});

test('reference fixtures deliver exact minimum start and funding gap', () => {
  for (const fixture of fixtures) {
    const result = buildPlan(fixture.settings, fixture.goals, fixture.startMonth);
    for (const [key, value] of Object.entries(fixture.expected)) assert.equal(result[key], value, `${fixture.id}: ${key}`);
  }
  const reference = fixtures[0];
  const result = buildPlan(reference.settings, reference.goals, reference.startMonth);
  assert.equal(result.events.length, 18);
  assert.equal(result.expensesCents.reduce((a, b) => a + b), 14000000);
  assert.equal(result.rows.at(-1).cashCents, -400000);
});

test('invalid settings and expense input are rejected', () => {
  for (const invalid of [null, [], 1]) assert.throws(() => validateSettings(invalid));
  for (const key of ['cashCents', 'monthlyCents', 'reserveCents']) assert.throws(() => validateSettings({...settings, [key]: -1}));
  for (const input of [null, [], [-1], [0.5], [Number.MAX_SAFE_INTEGER + 1]]) assert.throws(() => calculateLiquidity(input, settings));
  assert.throws(() => calculateLiquidity([Number.MAX_SAFE_INTEGER, 0], {...settings, reserveCents: 1}));
  for (const inflationBps of [-1, 10001, 0.1, null, NaN, Infinity, '200']) {
    assert.throws(() => validateSettings({...settings, inflationBps}), RangeError);
  }
  for (const inflationBps of [0, 200, 10000]) assert.equal(validateSettings({...settings, inflationBps}).inflationBps, inflationBps);
});

test('reserveAtMonth compounds reserve with inflation and rejects overflow', () => {
  assert.equal(reserveAtMonth(100, 50, 12), 101);
  assert.equal(reserveAtMonth(10000, 200, 12), 10200);
  assert.equal(reserveAtMonth(10000, 200, 24), 10404);
  assert.equal(reserveAtMonth(10000, 0, 120), 10000);
  assert.equal(reserveAtMonth(0, 500, 120), 0);
  assert.throws(() => reserveAtMonth(10_000_000_000, 10000, 240), /zu groß/u);
});
