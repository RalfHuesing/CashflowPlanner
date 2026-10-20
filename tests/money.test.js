import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCents, MAX_CENTS, parseEuro, formatEuro, safeSum} from '../web/js/domain/money.js';

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
