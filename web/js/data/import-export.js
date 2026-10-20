import { MAX_CENTS } from '../domain/money.js';

export const FORMAT_NAME = 'cashflow-planner';
export const FORMAT_VERSION = 1;
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_GOALS = 1_000;

const DATE_RE = /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const SETTINGS_KEYS = ['cashCents', 'monthlyCents', 'reserveCents', 'currentAge', 'horizonAge'];
const GOAL_KEYS = ['id', 'name', 'amountCents', 'type', 'dueMonth', 'flexMonths'];

function fail(message) {
  throw new TypeError(message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, keys) {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function validateSettings(settings) {
  if (!isPlainObject(settings) || !hasExactKeys(settings, SETTINGS_KEYS)) fail('Ungültige Einstellungen.');
  for (const key of ['cashCents', 'monthlyCents', 'reserveCents']) {
    const amount = settings[key];
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_CENTS) {
      fail(`Ungültiger Geldbetrag in „${key}“.`);
    }
  }
  for (const key of ['currentAge', 'horizonAge']) {
    if (!Number.isInteger(settings[key]) || settings[key] < 0 || settings[key] > 120) {
      fail(`Ungültiges Alter in „${key}“.`);
    }
  }
  if (settings.horizonAge < settings.currentAge) fail('Der Planungshorizont darf nicht vor dem aktuellen Alter liegen.');
  return { ...settings };
}

function validateGoal(goal) {
  if (!isPlainObject(goal) || !hasExactKeys(goal, GOAL_KEYS)) fail('Ungültiges Ziel.');
  if (typeof goal.id !== 'string' || !goal.id.trim() || goal.id.length > 100) fail('Ungültige Ziel-ID.');
  if (typeof goal.name !== 'string' || goal.name.trim().length < 1 || goal.name.trim().length > 120) fail('Ungültiger Zielname.');
  if (!Number.isSafeInteger(goal.amountCents) || goal.amountCents <= 0 || goal.amountCents > MAX_CENTS) fail('Ungültiger Zielbetrag.');
  if (goal.type !== 'once' && goal.type !== 'annual') fail('Ungültiger Zieltyp.');
  if (typeof goal.dueMonth !== 'string' || !DATE_RE.test(goal.dueMonth)) fail('Ungültiger Fälligkeitsmonat.');
  if (!Number.isInteger(goal.flexMonths) || goal.flexMonths < 0 || goal.flexMonths > 1200) fail('Ungültiger zeitlicher Spielraum.');
  return { ...goal };
}

function validateTimestamp(timestamp, fieldName) {
  if (timestamp === null) return null;
  if (typeof timestamp !== 'string' || !ISO_TIMESTAMP_RE.test(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    fail(`Ungültiges Datum in „${fieldName}“.`);
  }
  const parsed = new Date(timestamp);
  const canonical = timestamp.endsWith('Z') && !timestamp.includes('.')
    ? timestamp.replace(/Z$/, '.000Z')
    : timestamp.replace(/\.(\d{1,3})Z$/, (_, fraction) => `.${fraction.padEnd(3, '0')}Z`);
  if (parsed.toISOString() !== canonical) fail(`Ungültiges Datum in „${fieldName}“.`);
  return timestamp;
}

export function validateData(data) {
  const keys = ['settings', 'goals', 'cashUpdatedAt'];
  if (!isPlainObject(data) || !hasExactKeys(data, keys)) fail('Ungültige Datenstruktur.');
  if (!Array.isArray(data.goals) || data.goals.length > MAX_GOALS) fail('Ungültige Anzahl finanzieller Ziele.');
  const goals = data.goals.map(validateGoal);
  const ids = new Set();
  for (const goal of goals) {
    if (ids.has(goal.id)) fail('Ziel-IDs müssen eindeutig sein.');
    ids.add(goal.id);
  }
  return {
    settings: validateSettings(data.settings),
    goals,
    cashUpdatedAt: validateTimestamp(data.cashUpdatedAt, 'cashUpdatedAt'),
  };
}

export function exportData(data, now = new Date()) {
  const validated = validateData(data);
  const exportedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  return JSON.stringify({
    format: FORMAT_NAME,
    version: FORMAT_VERSION,
    exportedAt,
    data: validated,
  }, null, 2);
}

export function parseImport(text) {
  if (typeof text !== 'string') fail('Die Importdatei muss Text enthalten.');
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) fail('Die Importdatei ist zu groß (maximal 1 MB).');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('Die Datei enthält kein gültiges JSON.');
  }
  if (!isPlainObject(parsed) || !hasExactKeys(parsed, ['format', 'version', 'exportedAt', 'data'])) fail('Unbekanntes JSON-Datenformat.');
  if (parsed.format !== FORMAT_NAME) fail('Die Datei stammt nicht aus dem CashflowPlanner.');
  if (parsed.version !== FORMAT_VERSION) fail('Diese Datenformat-Version wird nicht unterstützt.');
  validateTimestamp(parsed.exportedAt, 'exportedAt');
  return validateData(parsed.data);
}
