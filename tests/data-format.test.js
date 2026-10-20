import test from 'node:test';
import assert from 'node:assert/strict';
import { exportData, parseImport, MAX_IMPORT_BYTES } from '../web/js/data/import-export.js';
import { buildPlan } from '../web/js/domain/scenarios.js';

const example = {
  settings: { cashCents: 4_000_000, monthlyCents: 50_000, reserveCents: 12_345, currentAge: 35, horizonAge: 60, inflationBps: 250 },
  goals: [{ id: 'g-1', name: 'Urlaub', amountCents: 500_001, type: 'annual', dueMonth: '2027-08', flexMonths: 3 }],
  cashUpdatedAt: '2026-10-20T10:30:00.000Z',
};

test('JSON-Export und Import erhalten alle Centwerte und Felder exakt', () => {
  const json = exportData(example, new Date('2026-10-20T12:00:00.000Z'));
  const normalized = structuredClone(example);
  normalized.goals[0].endMonth = null;
  assert.deepEqual(parseImport(json), normalized);
  const fractionalTimestamp = { ...example, cashUpdatedAt: '2026-10-20T10:30:00.123Z' };
  assert.deepEqual(parseImport(exportData(fractionalTimestamp, new Date('2026-10-20T12:00:00.123Z'))), {
    ...fractionalTimestamp,
    goals: [{ ...fractionalTimestamp.goals[0], endMonth: null }],
  });
});

test('v1 Import akzeptiert ältere Ziele ohne Endmonat und ergänzt null im Export', () => {
  const legacy = structuredClone(example);
  delete legacy.goals[0].endMonth;
  const document = { format: 'cashflow-planner', version: 1, exportedAt: '2026-10-20T12:00:00.000Z', data: legacy };
  const imported = parseImport(JSON.stringify(document));
  assert.equal(imported.goals[0].endMonth, null);
  assert.equal(JSON.parse(exportData(imported)).data.goals[0].endMonth, null);
});

test('Endmonat gilt einschließlich und wird für Jahresziele validiert', () => {
  const bounded = structuredClone(example);
  bounded.goals[0].endMonth = '2030-08';
  assert.equal(parseImport(exportData(bounded)).goals[0].endMonth, '2030-08');

  for (const endMonth of ['2027-07', '2027-13', 'gestern']) {
    const invalid = structuredClone(bounded);
    invalid.goals[0].endMonth = endMonth;
    assert.throws(() => exportData(invalid));
  }
  const once = structuredClone(bounded);
  once.goals[0].type = 'once';
  assert.throws(() => exportData(once), /Einmalige/);
});

test('v1 Import übernimmt fehlende Inflationsrate mit 2 Prozent und Export ergänzt sie', () => {
  const legacy = structuredClone(example);
  delete legacy.settings.inflationBps;
  const document = {
    format: 'cashflow-planner', version: 1,
    exportedAt: '2026-10-20T12:00:00.000Z', data: legacy,
  };

  const imported = parseImport(JSON.stringify(document));
  assert.equal(imported.settings.inflationBps, 200);
  const exported = JSON.parse(exportData(imported));
  assert.equal(exported.data.settings.inflationBps, 200);
  assert.equal(exported.version, 1);
});

test('Import weist ungültiges JSON, unbekannte Version und fehlende Felder zurück', () => {
  assert.throws(() => parseImport('{'), /gültiges JSON/);
  const document = JSON.parse(exportData(example));
  document.version = 2;
  assert.throws(() => parseImport(JSON.stringify(document)), /Version/);
  const missing = JSON.parse(exportData(example));
  delete missing.data.goals[0].flexMonths;
  assert.throws(() => parseImport(JSON.stringify(missing)), /Ungültiges Ziel/);
});

test('Import validiert Daten atomar, eindeutige IDs, Beträge und Datumsformate', () => {
  const duplicate = structuredClone(example);
  duplicate.goals.push({ ...duplicate.goals[0] });
  const duplicateDocument = { format: 'cashflow-planner', version: 1,
    exportedAt: '2026-10-20T12:00:00.000Z', data: duplicate };
  assert.throws(() => parseImport(JSON.stringify(duplicateDocument)), /eindeutig/);

  for (const change of [
    (data) => { data.settings.cashCents = -1; },
    (data) => { data.settings.inflationBps = -1; },
    (data) => { data.settings.inflationBps = 10_001; },
    (data) => { data.settings.inflationBps = 2.5; },
    (data) => { data.goals[0].amountCents = 1_000_000_000_001; },
    (data) => { data.goals[0].dueMonth = '2027-13'; },
    (data) => { data.cashUpdatedAt = 'gestern'; },
  ]) {
    const bad = structuredClone(example);
    change(bad);
    const document = { format: 'cashflow-planner', version: 1, exportedAt: '2026-10-20T12:00:00.000Z', data: bad };
    assert.throws(() => parseImport(JSON.stringify(document)));
  }
});

test('Import weist unbekannte Einstellungsfelder zurück', () => {
  const document = JSON.parse(exportData(example));
  document.data.settings.extra = true;
  assert.throws(() => parseImport(JSON.stringify(document)), /Einstellungen/);
});

test('Import lehnt übergroße Dateien und zusätzliche unbekannte Strukturfelder ab', () => {
  assert.throws(() => parseImport(' '.repeat(MAX_IMPORT_BYTES + 1)), /zu groß/);
  const document = JSON.parse(exportData(example));
  document.data.unexpected = 'ignored?';
  assert.throws(() => parseImport(JSON.stringify(document)), /Datenstruktur/);
  const badTopLevel = JSON.parse(exportData(example));
  badTopLevel.unknownTopField = true;
  assert.throws(() => parseImport(JSON.stringify(badTopLevel)), /Unbekanntes JSON-Datenformat/);
});

test('Export enthält einen LLM-optimierten vollständigen Plan mit Zusammenfassung und Monatsverlauf', () => {
  const plan = buildPlan(example.settings, example.goals, '2026-10');
  const json = exportData(example, new Date('2026-10-20T12:00:00.000Z'), plan);
  const parsed = JSON.parse(json);
  assert.ok(parsed.plan);
  assert.equal(typeof parsed.plan.summary.feasible, 'boolean');
  assert.equal(parsed.plan.summary.currentAge, 35);
  assert.equal(parsed.plan.summary.horizonAge, 60);
  assert.equal(parsed.plan.summary.initialCashEuro, 40000);
  assert.equal(parsed.plan.summary.monthlySavingsCapacityEuro, 500);
  assert.equal(parsed.plan.summary.initialMinimumReserveEuro, 123.45);
  assert.equal(parsed.plan.summary.annualInflationPercent, 2.5);
  const requiredToday = plan.requiredTodayCents;
  assert.equal(parsed.plan.summary.minimumStartingCashNeededEuro, requiredToday / 100);
  assert.equal(parsed.plan.summary.cashSurplusOrGapEuro, (example.settings.cashCents - requiredToday) / 100);
  assert.ok(Array.isArray(parsed.plan.goals));
  assert.equal(parsed.plan.goals[0].name, 'Urlaub');
  assert.ok(Array.isArray(parsed.plan.monthlyTimeline));
  assert.equal(parsed.plan.monthlyTimeline[0].month, '2026-10');
  assert.equal(parsed.plan.monthlyTimeline[0].age, 35);
  assert.equal(typeof parsed.plan.monthlyTimeline[0].cashEndEuro, 'number');
  assert.ok(parsed.plan.keyRules.strategy);
});

test('Maximaler Jahresplan bleibt als Export unter dem Importlimit wieder importierbar', () => {
  const data = {
    settings: { cashCents: 1_000_000, monthlyCents: 0, reserveCents: 0, currentAge: 0, horizonAge: 120, inflationBps: 0 },
    goals: Array.from({ length: 1_000 }, (_, index) => ({
      id: `goal-${index}`,
      name: `Jahresziel ${index}`,
      amountCents: 100,
      type: 'annual',
      dueMonth: '2026-10',
      endMonth: null,
      flexMonths: 0,
    })),
    cashUpdatedAt: null,
  };
  const plan = buildPlan(data.settings, data.goals, '2026-10');
  const json = exportData(data, new Date('2026-10-20T12:00:00.000Z'), plan);
  const parsed = JSON.parse(json);

  assert.ok(new TextEncoder().encode(json).byteLength <= MAX_IMPORT_BYTES);
  assert.equal(Object.hasOwn(parsed, 'plan'), false);
  const normalized = structuredClone(data);
  normalized.goals = normalized.goals.map((goal) => ({ ...goal, endMonth: null }));
  assert.deepEqual(parseImport(json), normalized);
});

test('Export weist bei Unterdeckung keinen freien Anlagebetrag aus', () => {
  const data = {
    settings: { cashCents: 0, monthlyCents: 0, reserveCents: 0, currentAge: 30, horizonAge: 31, inflationBps: 0 },
    goals: [{ id: 'g', name: 'Ausgabe', amountCents: 100, type: 'once', dueMonth: '2026-11', endMonth: null, flexMonths: 0 }],
    cashUpdatedAt: null,
  };
  const plan = buildPlan(data.settings, data.goals, '2026-10');
  const exported = JSON.parse(exportData(data, new Date('2026-10-20T12:00:00.000Z'), plan));
  assert.equal(exported.plan.summary.feasible, false);
  assert.equal(exported.plan.monthlyTimeline[1].freeForLongTermInvestmentEuro, null);
});
