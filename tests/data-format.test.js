import test from 'node:test';
import assert from 'node:assert/strict';
import { exportData, parseImport, MAX_IMPORT_BYTES } from '../web/js/data/import-export.js';

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
});
