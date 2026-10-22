import test from 'node:test';
import assert from 'node:assert/strict';
import {renderChart} from '../web/js/ui/chart.js';
import {buildPlan} from '../web/js/domain/scenarios.js';

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

test('event markers sit on the cash path before expenses, including the current and final month', () => {
  const container = new Element('div');
  globalThis.document = {
    createElement: (tag) => new Element(tag),
    createElementNS: (_namespace, tag) => new Element(tag),
    getElementById: () => container,
  };
  try {
    const plan = buildPlan({cashCents: 50_000, monthlyCents: 50_000, reserveCents: 20_000,
      currentAge: 40, horizonAge: 41, inflationBps: 0}, [
      {id: 'today', name: 'Heute', type: 'once', amountCents: 10_000, dueMonth: '2026-10', flexMonths: 0},
      {id: 'final', name: 'Am Horizont', type: 'once', amountCents: 150_000, dueMonth: '2027-10', flexMonths: 0},
    ], '2026-10');
    assert.ok(plan.rows.at(-1).bestCaseContributionCents > 0);
    assert.equal(plan.rows.at(-1).events[0].amountCents, plan.rows.at(-1).expenseCents);
    assert.equal(plan.rows.at(-1).cashCents + plan.rows.at(-1).expenseCents, 170_000);
    renderChart(plan);

    const svg = container.children[1];
    const cashLine = svg.children.find((child) => child.attributes.class === 'chart-cash');
    const markers = svg.children.filter((child) => child.tag === 'circle');
    const pathPoints = [...cashLine.attributes.d.matchAll(/[ML]([\d.]+),([\d.]+)/gu)]
      .map(([, x, y]) => [x, y]);
    assert.equal(markers.length, 2);
    for (const marker of markers) {
      const markerX = Number(marker.attributes.cx);
      const markerY = Number(marker.attributes.cy);
      const pointIndex = pathPoints.findIndex(([x, y]) => Math.abs(Number(x) - markerX) < 0.01 && Math.abs(Number(y) - markerY) < 0.01);
      assert.notEqual(pointIndex, -1);
      assert.equal(Number(pathPoints[pointIndex + 1][0]), markerX);
      assert.ok(Number(pathPoints[pointIndex + 1][1]) > Number(markerY));
    }
    const values = plan.rows.flatMap((row) => [row.cashCents, row.cashCents + row.expenseCents, row.requiredCents, row.reserveCents]);
    const peak = Math.max(...values);
    assert.equal(peak, 170_000);
    const expectedPeakY = 20 + (200_000 - peak) / 200_000 * (300 - 20 - 53);
    assert.ok(Math.abs(Number(markers.at(-1).attributes.cy) - expectedPeakY) < 0.01);
    assert.ok(Number(markers.at(-1).attributes.cy) > 20);
    const grid = svg.children.filter((child) => child.attributes.class === 'chart-grid');
    assert.equal(grid.length, 5);
    assert.deepEqual(grid.map((line) => Number(line.attributes.y1)), [247, 190.25, 133.5, 76.75, 20]);

    const tooltip = container.children[2];
    assert.match(tooltip.text, /Cash vor Ausgaben/u);
    svg.listeners.keydown({key: 'End', preventDefault() {}});
    assert.match(tooltip.text, /Cash danach/u);
    assert.match(tooltip.text, /Am Horizont/u);
  } finally {
    delete globalThis.document;
  }
});
