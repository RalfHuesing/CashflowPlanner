import test from 'node:test';
import assert from 'node:assert/strict';
import {addMonths, monthDifference, monthNumber, currentMonth, ageAtMonth, horizonMonths, formatMonth} from '../web/js/domain/calendar.js';

test('calendar arithmetic crosses years without day or leap-year effects', () => {
  assert.equal(addMonths('2024-02', 12), '2025-02');
  assert.equal(addMonths('2026-01', -1), '2025-12');
  assert.equal(monthDifference('2026-10', '2042-10'), 192);
  assert.equal(monthDifference('2026-10', '2026-09'), -1);
  assert.equal(ageAtMonth(40, 6), 40.5);
  assert.equal(horizonMonths(40, 56), 192);
  assert.equal(horizonMonths(40, 40), 0);
  assert.equal(currentMonth(new Date(2024, 1, 29)), '2024-02');
  assert.match(currentMonth(), /^\d{4}-\d{2}$/u);
  assert.equal(formatMonth('2026-10'), 'Oktober 2026');
});

test('invalid dates and horizons are rejected', () => {
  for (const month of [null, '2026-00', '2026-13', '26-01', '1899-12']) assert.throws(() => monthNumber(month));
  assert.throws(() => addMonths('2026-10', 0.5));
  assert.throws(() => addMonths('9999-12', 1));
  for (const ages of [[-1, 30], [40, 39], [1, 121], [1.5, 2], [1, 2.5]]) assert.throws(() => horizonMonths(...ages));
});
