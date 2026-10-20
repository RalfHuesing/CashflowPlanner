import { DEFAULT_INFLATION_BPS, validateData } from './import-export.js';

export const STORAGE_KEY = 'cashflow-planner.data';
export const STORAGE_VERSION = 1;
export const CASH_STALE_AFTER_DAYS = 365;

export const DEFAULT_DATA = Object.freeze({
  settings: Object.freeze({
    cashCents: 0,
    monthlyCents: 0,
    reserveCents: 0,
    currentAge: 30,
    horizonAge: 90,
    inflationBps: DEFAULT_INFLATION_BPS,
  }),
  goals: Object.freeze([]),
  cashUpdatedAt: null,
});

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function cloneDefaults() {
  return {
    settings: { ...DEFAULT_DATA.settings },
    goals: [],
    cashUpdatedAt: null,
  };
}

export function createDefaultData() {
  return cloneDefaults();
}

export function loadData(storage) {
  const target = resolveStorage(storage);
  if (!target) return { data: cloneDefaults(), warning: 'Lokaler Speicher ist nicht verfügbar.' };

  let raw;
  try {
    raw = target.getItem(STORAGE_KEY);
  } catch {
    return { data: cloneDefaults(), warning: 'Gespeicherte Daten konnten nicht gelesen werden.' };
  }
  if (raw === null) return { data: cloneDefaults(), warning: null, storageValue: null };

  try {
    const record = JSON.parse(raw);
    if (record?.version !== STORAGE_VERSION || !Object.hasOwn(record, 'data')) {
      return { data: cloneDefaults(), warning: 'Gespeicherte Daten haben eine unbekannte Version und wurden nicht geladen.', storageValue: raw };
    }
    const data = validateData(record.data);
    const freshness = getCashFreshness(data.cashUpdatedAt);
    return {
      data,
      warning: freshness.stale ? 'Der gespeicherte Cashbestand wurde seit längerer Zeit nicht aktualisiert.' : null,
      storageValue: raw,
    };
  } catch {
    return { data: cloneDefaults(), warning: 'Gespeicherte Daten sind beschädigt und wurden nicht geladen.', storageValue: raw };
  }
}

export function saveData(data, storage, now = new Date(), expectedValue) {
  const target = resolveStorage(storage);
  if (!target) return { ok: false, error: 'Lokaler Speicher ist nicht verfügbar.' };
  let validated;
  try {
    validated = validateData(data);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  try {
    if (expectedValue !== undefined && target.getItem(STORAGE_KEY) !== expectedValue) {
      return { ok: false, error: 'Die gespeicherte Planung wurde in einem anderen Tab geändert. Exportiere deinen aktuellen Stand vor dem Neuladen.' };
    }
    const storageValue = JSON.stringify({
      version: STORAGE_VERSION,
      savedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
      data: validated,
    });
    target.setItem(STORAGE_KEY, storageValue);
    return { ok: true, error: null, storageValue };
  } catch {
    return { ok: false, error: 'Daten konnten nicht gespeichert werden. Exportiere deinen aktuellen Stand vor dem Neuladen; der lokale Speicher ist möglicherweise voll.' };
  }
}

export function getCashFreshness(cashUpdatedAt, now = new Date()) {
  if (typeof cashUpdatedAt !== 'string' || Number.isNaN(Date.parse(cashUpdatedAt))) {
    return { stale: true, daysSinceUpdate: null };
  }
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const ageMs = Math.max(0, nowMs - Date.parse(cashUpdatedAt));
  const daysSinceUpdate = Math.floor(ageMs / 86_400_000);
  return { stale: daysSinceUpdate >= CASH_STALE_AFTER_DAYS, daysSinceUpdate };
}
