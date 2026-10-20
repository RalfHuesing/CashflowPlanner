import test from 'node:test';
import assert from 'node:assert/strict';
import { exportData, parseImport, MAX_IMPORT_BYTES } from '../web/js/data/import-export.js';

const example = {
  settings: { cashCents: 4_000_000, monthlyCents: 50_000, reserveCents: 12_345, currentAge: 35, horizonAge: 60 },
  goals: [{ id: 'g-1', name: 'Urlaub', amountCents: 500_001, type: 'annual', dueMonth: '2027-08', flexMonths: 3 }],
  cashUpdatedAt: '2026-10-20T10:30:00.000Z',
};

test('JSON-Export und Import erhalten alle Centwerte und Felder exakt', () => {
  const json = exportData(example, new Date('2026-10-20T12:00:00.000Z'));
  assert.deepEqual(parseImport(json), example);
  const fractionalTimestamp = { ...example, cashUpdatedAt: '2026-10-20T10:30:00.123Z' };
  assert.deepEqual(parseImport(exportData(fractionalTimestamp, new Date('2026-10-20T12:00:00.123Z'))), fractionalTimestamp);
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

test('Import lehnt übergroße Dateien und zusätzliche unbekannte Strukturfelder ab', () => {
  assert.throws(() => parseImport(' '.repeat(MAX_IMPORT_BYTES + 1)), /zu groß/);
  const document = JSON.parse(exportData(example));
  document.data.unexpected = 'ignored?';
  assert.throws(() => parseImport(JSON.stringify(document)), /Datenstruktur/);
});
