import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, STORAGE_VERSION, createDefaultData, loadData, saveData, getCashFreshness } from '../web/js/data/storage.js';
import { getSampleData } from '../web/js/data/sample-data.js';

const data = {
  settings: { cashCents: 1_234_567, monthlyCents: 75_000, reserveCents: 5_000, currentAge: 40, horizonAge: 75, inflationBps: 300 },
  goals: [{ id: 'goal', name: 'Ziel', amountCents: 250_001, type: 'once', dueMonth: '2030-02', flexMonths: 2 }],
  cashUpdatedAt: '2026-10-20T00:00:00.000Z',
};

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test('LocalStorage speichert und lädt das vollständige versionierte Datenmodell', () => {
  const storage = memoryStorage();
  assert.deepEqual(saveData(data, storage, new Date('2026-10-20T12:00:00.000Z')), { ok: true, error: null });
  const record = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(record.version, STORAGE_VERSION);
  assert.equal(record.savedAt, '2026-10-20T12:00:00.000Z');
  assert.deepEqual(loadData(storage).data, data);
});

test('Standard- und Beispieldaten verwenden 2 Prozent Inflation', () => {
  assert.equal(createDefaultData().settings.inflationBps, 200);
  assert.equal(getSampleData(new Date('2026-10-20T12:00:00.000Z')).settings.inflationBps, 200);
});

test('alte v1 LocalStorage-Daten erhalten 2 Prozent und werden beim Speichern ergänzt', () => {
  const storage = memoryStorage();
  const legacy = structuredClone(data);
  delete legacy.settings.inflationBps;
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: legacy }));

  const loaded = loadData(storage).data;
  assert.equal(loaded.settings.inflationBps, 200);
  assert.equal(saveData(loaded, storage).ok, true);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).data.settings.inflationBps, 200);
});

test('fehlender, beschädigter oder unbekannt versionierter Speicher liefert Defaults mit Hinweis', () => {
  assert.equal(loadData(null).warning, 'Lokaler Speicher ist nicht verfügbar.');
  const storage = memoryStorage();
  assert.equal(loadData(storage).data.goals.length, 0);
  storage.setItem(STORAGE_KEY, '{broken');
  assert.match(loadData(storage).warning, /beschädigt/);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, data }));
  assert.match(loadData(storage).warning, /unbekannte Version/);
});

test('Speicherfehler und ungültige Daten werden ohne Teilübernahme gemeldet', () => {
  const throwingStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.match(loadData(throwingStorage).warning, /nicht gelesen/);
  assert.equal(saveData(data, throwingStorage).ok, false);
  assert.equal(saveData({ ...data, goals: 'invalid' }, memoryStorage()).ok, false);
});

test('Cash-Aktualisierungshinweis wird nach einem Jahr angezeigt', () => {
  assert.deepEqual(getCashFreshness('2025-10-20T00:00:00.000Z', new Date('2026-10-20T00:00:00.000Z')), {
    stale: true,
    daysSinceUpdate: 365,
  });
  assert.equal(getCashFreshness('2026-10-19T00:00:00.000Z', new Date('2026-10-20T00:00:00.000Z')).stale, false);
  assert.equal(getCashFreshness(null).stale, true);
});
