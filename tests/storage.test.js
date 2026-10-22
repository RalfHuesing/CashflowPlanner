import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, STORAGE_VERSION, clearData, createDefaultData, loadData, saveData, getCashFreshness } from '../web/js/data/storage.js';
import { getSampleData } from '../web/js/data/sample-data.js';
import { buildPlan } from '../web/js/domain/scenarios.js';

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
    removeItem(key) { values.delete(key); },
  };
}

test('LocalStorage speichert und lädt das vollständige versionierte Datenmodell', () => {
  const storage = memoryStorage();
  const saved = saveData(data, storage, new Date('2026-10-20T12:00:00.000Z'));
  assert.equal(saved.ok, true);
  assert.equal(saved.error, null);
  assert.equal(saved.storageValue, storage.getItem(STORAGE_KEY));
  const record = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(record.version, STORAGE_VERSION);
  assert.equal(record.savedAt, '2026-10-20T12:00:00.000Z');
  const normalized = structuredClone(data);
  normalized.goals[0].endMonth = null;
  assert.deepEqual(loadData(storage).data, normalized);
});

test('Ein veralteter Tab überschreibt keine neuere gespeicherte Planung', () => {
  const storage = memoryStorage();
  const original = saveData(data, storage, new Date('2026-10-20T12:00:00.000Z'));
  const otherTab = loadData(storage);
  const newer = { ...data, settings: { ...data.settings, cashCents: 2_000_000 } };
  const updated = saveData(newer, storage, new Date('2026-10-20T12:01:00.000Z'), otherTab.storageValue);
  assert.equal(updated.ok, true);
  assert.notEqual(updated.storageValue, original.storageValue);

  const stale = saveData(data, storage, new Date('2026-10-20T12:02:00.000Z'), otherTab.storageValue);
  assert.equal(stale.ok, false);
  assert.match(stale.error, /anderen Tab/);
  assert.equal(storage.getItem(STORAGE_KEY), updated.storageValue);
});

test('Planung löschen prüft den erwarteten Stand und lässt fremde Speicherwerte erhalten', () => {
  const storage = memoryStorage();
  storage.setItem('other-app.data', 'bleibt');
  const original = saveData(data, storage);
  assert.equal(clearData(storage, 'veralteter Stand').ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), original.storageValue);
  const cleared = clearData(storage, original.storageValue);
  assert.equal(cleared.ok, true);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('other-app.data'), 'bleibt');
});

test('Planung löschen meldet nicht verfügbaren oder fehlerhaften Speicher', () => {
  assert.equal(clearData(null).ok, false);
  assert.equal(clearData({ getItem() { throw new Error('blocked'); } }).ok, false);
  assert.equal(clearData({ getItem() { return null; }, removeItem() { throw new Error('blocked'); } }).ok, false);
});

test('Beispieldaten zeigen einen finanzierbaren Plan mit relativ terminierten Zielen', () => {
  assert.equal(createDefaultData().settings.inflationBps, 200);
  const sample = getSampleData(new Date('2026-10-20T12:00:00.000Z'));
  assert.deepEqual(sample.settings, {
    cashCents: 800_000,
    monthlyCents: 120_000,
    reserveCents: 600_000,
    currentAge: 35,
    horizonAge: 50,
    inflationBps: 200,
  });
  assert.deepEqual(sample.goals, [
    { id: 'sample-urlaub', name: 'Jährlicher Urlaub', amountCents: 300_000, type: 'annual', dueMonth: '2027-06', endMonth: null, flexMonths: 0 },
    { id: 'sample-kueche', name: 'Neue Küche', amountCents: 1_200_000, type: 'once', dueMonth: '2029-10', endMonth: null, flexMonths: 0 },
    { id: 'sample-auto', name: 'Nächstes Auto', amountCents: 2_500_000, type: 'once', dueMonth: '2033-10', endMonth: null, flexMonths: 0 },
  ]);
  assert.equal(sample.cashUpdatedAt, '2026-10-20T12:00:00.000Z');

  const plan = buildPlan(sample.settings, sample.goals, '2026-10');
  assert.equal(plan.feasible, true);
  assert.equal(plan.gapCents, 0);
  assert.equal(plan.requiredTodayCents, 600_000);
  assert.equal(plan.releasableCents, 200_000);
  assert.equal(plan.rows[1].contributionCents, 0);
  assert.equal(plan.rows[1].longTermCents, 120_000);
  assert.ok(plan.rows.some((row) => row.contributionCents > 0 && row.longTermCents > 0));
});

test('alte v1 LocalStorage-Daten erhalten 2 Prozent und werden beim Speichern ergänzt', () => {
  const storage = memoryStorage();
  const legacy = structuredClone(data);
  delete legacy.settings.inflationBps;
  delete legacy.goals[0].endMonth;
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: legacy }));

  const loaded = loadData(storage).data;
  assert.equal(loaded.settings.inflationBps, 200);
  assert.equal(saveData(loaded, storage).ok, true);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).data.settings.inflationBps, 200);
  assert.equal(loaded.goals[0].endMonth, null);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).data.goals[0].endMonth, null);
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

test('Cashbestand wird nach einem Kalendermonat als prüfbedürftig markiert', () => {
  assert.deepEqual(getCashFreshness('2025-10-20T12:00:00.000Z', new Date('2026-10-20T12:00:00.000Z')), {
    stale: true,
    monthsSinceUpdate: 12,
  });
  const januaryEnd = new Date(2026, 0, 31, 12).toISOString();
  const februaryStart = new Date(2026, 1, 1, 12);
  assert.deepEqual(getCashFreshness(januaryEnd, februaryStart), { stale: true, monthsSinceUpdate: 1 });
  assert.equal(getCashFreshness(new Date(2026, 1, 1, 12).toISOString(), new Date(2026, 1, 28, 12)).stale, false);
  assert.deepEqual(getCashFreshness(null), { stale: false, monthsSinceUpdate: null });
});
