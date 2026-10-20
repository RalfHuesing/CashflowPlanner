import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCents, inflateAmount, MAX_CENTS, parseEuro, formatEuro, safeSum} from '../web/js/domain/money.js';

test('German decimals convert exactly to integral cents', () => {
  for (const [text, cents] of [['0', 0], ['0,01', 1], ['1,1', 110], ['1.234,56 €', 123456], [' 123 ', 12300]]) assert.equal(parseEuro(text), cents);
  assert.equal(assertCents(MAX_CENTS), MAX_CENTS);
  assert.equal(safeSum(1, 2), 3);
  assert.equal(formatEuro(-123456).replace(/\s/gu, ' '), '-1.234,56 €');
});

test('malformed and unsafe money values are rejected', () => {
  for (const text of ['', '-1', '1.2', '1,234', '1e3', 'NaN', '2.00,00', '100000001']) assert.throws(() => parseEuro(text));
  assert.throws(() => parseEuro(1));
  for (const value of [NaN, Infinity, -1, 0.1, MAX_CENTS + 1]) assert.throws(() => assertCents(value));
  assert.throws(() => assertCents(0, 'Ziel', true));
  assert.throws(() => safeSum(Number.MAX_SAFE_INTEGER, 1));
  assert.throws(() => formatEuro(0.1));
});

test('whole-year inflation rounds exact half cents up without binary rate errors', () => {
  for (const [rate, expected] of [[50, 101], [150, 102], [250, 103], [350, 104]]) {
    assert.equal(inflateAmount(100, rate, 12), expected);
  }
  assert.equal(inflateAmount(100, 49, 12), 100);
  assert.equal(inflateAmount(100, 51, 12), 101);
  // 100 × 1.015³ = 104.5678375; intermediate years are not rounded.
  assert.equal(inflateAmount(100, 150, 36), 105);
  assert.equal(inflateAmount(24, 200, 24), 25);
});

test('fractional years round exact boundaries without pushing lower values upwards', () => {
  // sqrt(1.21) = 1.1 and sqrt(1.5625) = 1.25, exactly.
  assert.equal(inflateAmount(5, 2100, 6), 6);
  assert.equal(inflateAmount(2, 5625, 6), 3);
  assert.equal(inflateAmount(9_999_999_995, 2100, 6), 10_999_999_995);
  // 50 × sqrt(1.02) = 50.4975… remains below the half-cent boundary.
  assert.equal(inflateAmount(50, 200, 6), 50);
  // This value is only about 0.0000015 cents below the boundary. Squaring
  // both sides proves it: 4 × A² × 102 - 100 × (2 × 10098310123 + 1)² = -12242508.
  assert.equal(inflateAmount(9_998_816_957, 200, 6), 10_098_310_123);
  assert.equal(inflateAmount(10000, 200, 6), 10100);
  assert.throws(() => inflateAmount(MAX_CENTS, 10000, 239), /zu groß/u);
});
