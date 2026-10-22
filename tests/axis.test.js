import test from 'node:test';
import assert from 'node:assert/strict';
import {formatAxisEuros, niceAxis} from '../web/js/ui/axis.js';

test('nice axes use evenly spaced 1/2/2.5/5 steps, include zero, and cover padded values', () => {
  const axis = niceAxis([-234_500, 2_884_300], {headroom:0.08, negativeHeadroom:0.05});
  assert.equal(axis.ticks.length - 1 >= 4 && axis.ticks.length - 1 <= 6, true);
  assert.ok(axis.ticks.includes(0));
  assert.ok(axis.minimum <= -234_500);
  assert.ok(axis.maximum >= 2_884_300 * 1.08);
  assert.ok(axis.ticks.every((tick, index) => index === 0 || Math.abs(tick - axis.ticks[index - 1] - axis.step) < 0.001));
});

test('empty and tiny ranges remain useful and cent labels stay distinct', () => {
  const axis = niceAxis([0, 1]);
  assert.equal(axis.minimum, 0);
  assert.ok(axis.maximum >= 10_000);
  assert.equal(axis.ticks.length - 1 >= 4 && axis.ticks.length - 1 <= 6, true);
  assert.equal(formatAxisEuros(0, 1), '0,00');
  assert.equal(formatAxisEuros(1, 1), '0,01');
  assert.equal(formatAxisEuros(100_000_000_000, 20_000_000_000), '1 Mrd.');

  const cents = niceAxis([0, 12], {minimumSpan:1});
  assert.ok(cents.ticks.every((tick, index) => index === 0 || tick - cents.ticks[index - 1] === cents.step));
  assert.equal(cents.ticks[0], cents.minimum);
  assert.equal(cents.ticks.at(-1), cents.maximum);
});
