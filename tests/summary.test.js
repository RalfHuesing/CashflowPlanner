import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSummaryModel} from '../web/js/ui/summary.js';
import {buildPlan} from '../web/js/domain/scenarios.js';
import {money, monthLabel} from '../web/js/ui/format.js';

const settings = {cashCents: 800_000, monthlyCents: 120_000, reserveCents: 600_000, currentAge: 35, horizonAge: 36, inflationBps: 0};

test('a feasible summary explains the surplus and preserves the six metric positions', () => {
  const plan = buildPlan(settings, [], '2026-10');
  const before = structuredClone({plan, settings});
  const model = buildSummaryModel(plan, settings);
  assert.equal(model.metrics.length, 6);
  assert.deepEqual(model.metrics.slice(0, 4).map(metric => metric[0]), [
    'Nächsten Monat für Cash zurücklegen',
    'Nächsten Monat für langfristige Anlagen verfügbar',
    'Dein aktueller Cashbestand',
    'Ausgaben im aktuellen Monat',
  ]);
  assert.deepEqual(model.metrics[4], [
    'Für den Plan heute nicht benötigt', money(200_000),
    'Differenz zwischen aktuellem Cashbestand und rechnerisch benötigtem Startkapital', 'positive',
  ]);
  assert.deepEqual(model.metrics[5], [
    'Rechnerisch benötigtes Startkapital', money(600_000),
    `Für alle Ziele bis Oktober 2027 bei ${money(120_000)} monatlichem Sparbudget`, '',
  ]);
  assert.equal(model.explanation, `Unter den eingestellten Annahmen reicht dein heutiger Bestand zusammen mit dem gleichbleibenden Sparbudget für den gesamten Planungshorizont. Zuführungen werden so spät wie möglich eingeplant; im nächsten Monat ist noch keine Zuführung nötig. Von deinem heutigen Cashbestand werden ${money(200_000)} unter diesen Annahmen nicht für den Plan benötigt.`);
  assert.doesNotMatch(model.explanation, /investieren|Anlageempfehlung/u);
  assert.deepEqual({plan, settings}, before);
});

test('a feasible plan without surplus uses a neutral metric and the exact detail', () => {
  const exactSettings = {...settings, cashCents: settings.reserveCents};
  const model = buildSummaryModel(buildPlan(exactSettings, [], '2026-10'), exactSettings);
  assert.deepEqual(model.metrics[4], [
    'Für den Plan heute nicht benötigt', money(0),
    'Der aktuelle Cashbestand entspricht dem rechnerisch benötigten Startkapital', '',
  ]);
  assert.doesNotMatch(model.explanation, /Von deinem heutigen Cashbestand/u);
});

test('an infeasible summary names the first inflated goal and its monthly shortfall', () => {
  const limited = {...settings, cashCents: 600_000, inflationBps: 200};
  const goal = {id: 'kitchen', name: 'Neue Küche', amountCents: 1_200_000, type: 'once', dueMonth: '2027-04', endMonth: null, flexMonths: 0};
  const plan = buildPlan(limited, [goal, {...goal, id: 'later', name: 'Späteres Ziel', dueMonth: '2027-10'}], '2026-10');
  const model = buildSummaryModel(plan, limited);
  const row = plan.rows.find(row => row.month === plan.firstCriticalMonth);
  const monthlyShortfall = money(Math.max(0, row.reserveCents - row.cashCents));
  assert.equal(plan.criticalEvents[0].amountCents, 1_211_941);
  assert.notEqual(plan.gapCents, row.reserveCents - row.cashCents);
  assert.deepEqual(model.metrics[4], ['Fehlender Cashbestand', money(plan.gapCents), 'Erster Engpass: April 2027', 'negative']);
  assert.ok(model.explanation.endsWith(`Im April 2027 sind Neue Küche (${money(1_211_941)}) fällig. Nach diesen Ausgaben liegt der Bestand ${monthlyShortfall} unter der Mindestreserve.`));
  assert.doesNotMatch(model.explanation, /Späteres Ziel|keine Empfehlung/u);
});

test('multiple critical goals use comma-separated names and event amounts', () => {
  const goal = {id: 'one', name: 'Küche', amountCents: 900_000, type: 'once', dueMonth: '2026-10', flexMonths: 0};
  const plan = buildPlan(settings, [goal, {...goal, id: 'two', name: 'Auto', amountCents: 2_000_000}], '2026-10');
  const model = buildSummaryModel(plan, settings);
  assert.ok(model.explanation.includes(`Küche (${money(900_000)}), Auto (${money(2_000_000)}) fällig.`));
});

test('a rising reserve explains the first critical month without naming any goal', () => {
  const limited = {...settings, cashCents: 600_000, monthlyCents: 0, inflationBps: 200};
  const plan = buildPlan(limited, [], '2026-10');
  const row = plan.rows.find(row => row.month === plan.firstCriticalMonth);
  const model = buildSummaryModel(plan, limited);
  assert.ok(model.explanation.endsWith(`Im ersten Engpassmonat ${monthLabel(row.month)} fällt keine Zielausgabe an; Auslöser ist die steigende Mindestreserve. Der Bestand liegt ${money(row.reserveCents - row.cashCents)} unter der Mindestreserve.`));
  assert.doesNotMatch(model.explanation, /sind .* fällig/u);
});

test('a horizon ending today shows both unavailable next-month metrics', () => {
  const currentOnly = {...settings, horizonAge: settings.currentAge};
  const model = buildSummaryModel(buildPlan(currentOnly, [], '2026-10'), currentOnly);
  for (const metric of model.metrics.slice(0, 2)) {
    assert.equal(metric[1], '–');
    assert.equal(metric[2], 'Kein weiterer Monat im Planungshorizont');
  }
});

test('an infeasible next month shows full cash contribution and unavailable investments', () => {
  const limited = {...settings, cashCents: 0};
  const plan = buildPlan(limited, [], '2026-10');
  const model = buildSummaryModel(plan, limited);
  assert.equal(model.metrics[0][1], money(limited.monthlyCents));
  assert.equal(model.metrics[1][1], '–');
});

test('an absent critical month uses the planning horizon fallback', () => {
  const plan = {...buildPlan(settings, [], '2026-10'), feasible: false, firstCriticalMonth: null};
  const model = buildSummaryModel(plan, settings);
  assert.equal(model.metrics[4][2], 'Innerhalb des Planungshorizonts');
  assert.match(model.explanation, /innerhalb des Planungshorizonts/u);
});
