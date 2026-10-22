import test from 'node:test';
import assert from 'node:assert/strict';
import {renderYearlyPlan} from '../web/js/ui/yearly-plan.js';

class Element {
  attributes = {};
  children = [];
  listeners = {};
  textContent = '';
  constructor(tag) { this.tag = tag; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  get text() { return this.textContent + this.children.map((child) => child.text).join(''); }
}

test('yearly chart maps exact stacked values and expense markers through its nice axis', () => {
  const containers = Object.fromEntries(['yearly-summary', 'yearly-chart', 'yearly-table-container', 'yearly-infeasible-notice']
    .map((id) => [id, new Element('div')]));
  globalThis.document = {
    createElement: (tag) => new Element(tag),
    createElementNS: (_namespace, tag) => new Element(tag),
    getElementById: (id) => containers[id],
  };
  try {
    const row = {
      month: '2026-10', age: 40, capacityCents: 2_884_300, contributionCents: 884_300,
      longTermCents: 2_000_000, expenseCents: 2_700_000, events: [{name: 'Auto', amountCents: 2_700_000}],
      cashCents: 2_800_000, reserveCents: 0,
    };
    renderYearlyPlan({feasible:true, rows:[row]});
    const wrapper = containers['yearly-chart'].children[0];
    const svg = wrapper.children[1];
    const cash = svg.children.find((child) => child.attributes.class === 'bar-cash');
    const free = svg.children.find((child) => child.attributes.class === 'bar-free');
    const expense = svg.children.find((child) => child.tag === 'polygon');
    const plotHeight = 320 - 25 - 55;
    const y = (cents) => 25 + (4_000_000 - cents) / 4_000_000 * plotHeight;
    assert.ok(Math.abs(Number(cash.attributes.y) - y(row.contributionCents)) < 0.01);
    assert.ok(Math.abs(Number(free.attributes.y) - y(row.contributionCents + row.longTermCents)) < 0.01);
    assert.ok(Math.abs(Number(expense.attributes.points.split(' ')[0].split(',')[1]) + 5 - y(row.expenseCents)) < 0.01);
    assert.ok(y(row.expenseCents) > 25);
    assert.match(wrapper.text, /27\.000,00\u00a0€/u);
  } finally {
    delete globalThis.document;
  }
});
