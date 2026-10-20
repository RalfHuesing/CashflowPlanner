import { MAX_CENTS } from '../domain/money.js';
import { buildPlan } from '../domain/scenarios.js';

export const FORMAT_NAME = 'cashflow-planner';
export const FORMAT_VERSION = 1;
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_GOALS = 1_000;
export const DEFAULT_INFLATION_BPS = 200;

const DATE_RE = /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const LEGACY_SETTINGS_KEYS = ['cashCents', 'monthlyCents', 'reserveCents', 'currentAge', 'horizonAge'];
const SETTINGS_KEYS = [...LEGACY_SETTINGS_KEYS, 'inflationBps'];
const GOAL_KEYS = ['id', 'name', 'amountCents', 'type', 'dueMonth', 'flexMonths'];
const GOAL_KEYS_WITH_END_MONTH = [...GOAL_KEYS, 'endMonth'];

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
  if (!isPlainObject(settings) || !(hasExactKeys(settings, LEGACY_SETTINGS_KEYS) || hasExactKeys(settings, SETTINGS_KEYS))) {
    fail('Ungültige Einstellungen.');
  }
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
  const inflationBps = Object.hasOwn(settings, 'inflationBps') ? settings.inflationBps : DEFAULT_INFLATION_BPS;
  if (!Number.isInteger(inflationBps) || inflationBps < 0 || inflationBps > 10_000) {
    fail('Ungültige Inflationsrate.');
  }
  return { ...settings, inflationBps };
}

function validateEndMonth(goal) {
  const endMonth = Object.hasOwn(goal, 'endMonth') ? goal.endMonth : null;
  if (endMonth !== null && (typeof endMonth !== 'string' || !DATE_RE.test(endMonth))) fail('Ungültiger Endmonat.');
  if (goal.type === 'once' && endMonth !== null) fail('Einmalige Ziele dürfen keinen Endmonat haben.');
  if (endMonth !== null && endMonth < goal.dueMonth) fail('Der Endmonat darf nicht vor dem Fälligkeitsmonat liegen.');
  return endMonth;
}

function validateGoal(goal) {
  if (!isPlainObject(goal) || !(hasExactKeys(goal, GOAL_KEYS) || hasExactKeys(goal, GOAL_KEYS_WITH_END_MONTH))) fail('Ungültiges Ziel.');
  if (typeof goal.id !== 'string' || !goal.id.trim() || goal.id.length > 100) fail('Ungültige Ziel-ID.');
  if (typeof goal.name !== 'string' || goal.name.trim().length < 1 || goal.name.trim().length > 120) fail('Ungültiger Zielname.');
  if (!Number.isSafeInteger(goal.amountCents) || goal.amountCents <= 0 || goal.amountCents > MAX_CENTS) fail('Ungültiger Zielbetrag.');
  if (goal.type !== 'once' && goal.type !== 'annual') fail('Ungültiger Zieltyp.');
  if (typeof goal.dueMonth !== 'string' || !DATE_RE.test(goal.dueMonth)) fail('Ungültiger Fälligkeitsmonat.');
  const endMonth = validateEndMonth(goal);
  if (!Number.isInteger(goal.flexMonths) || goal.flexMonths < 0 || goal.flexMonths > 1200) fail('Ungültiger zeitlicher Spielraum.');
  return { ...goal, endMonth };
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

function centsToEuro(cents) {
  if (cents === null || cents === undefined) return null;
  return Number((cents / 100).toFixed(2));
}

export function buildLlmPlanExport(settings, goals, plan) {
  const inflationPercent = settings.inflationBps / 100;
  const horizonYears = settings.horizonAge - settings.currentAge;

  let totalExpensesInflatedCents = 0;
  for (const ev of plan.events) {
    totalExpensesInflatedCents += ev.amountCents;
  }

  const summary = {
    feasible: plan.feasible,
    status: plan.feasible
      ? 'Machbar: Die Liquidität und die wachsende Mindestreserve sind über den gesamten Horizont gesichert.'
      : `Engpass: Bei voller Monatszuführung fällt der Cashbestand erstmals im ${plan.firstCriticalMonth} unter die Mindestreserve.`,
    startMonth: plan.startMonth,
    horizonMonth: plan.horizonMonth,
    horizonYears,
    currentAge: settings.currentAge,
    horizonAge: settings.horizonAge,
    initialCashEuro: centsToEuro(settings.cashCents),
    monthlySavingsCapacityEuro: centsToEuro(settings.monthlyCents),
    initialMinimumReserveEuro: centsToEuro(settings.reserveCents),
    annualInflationPercent: Number(inflationPercent.toFixed(2)),
    minimumStartingCashNeededEuro: centsToEuro(plan.requiredTodayCents),
    cashSurplusOrGapEuro: centsToEuro(settings.cashCents - plan.requiredTodayCents),
    firstShortfallMonth: plan.firstCriticalMonth,
    totalPlannedExpensesEuro: centsToEuro(totalExpensesInflatedCents),
  };

  const keyRules = {
    strategy: 'So wenig Cash wie möglich, so viel wie nötig. Der Cashbestand puffert anstehende Ausgaben und die Mindestreserve.',
    monthlySavingsAllocation: 'In jedem Monat wird nur so viel vom monatlichen Sparbetrag in Cash zurückgelegt, wie für künftige Ausgaben und Mindestreserve nötig ist. Der Rest steht frei für langfristige Vermögensanlagen (z. B. ETFs) zur Verfügung.',
    inflationMethod: 'Ausgaben und Mindestreserve steigen jährlich mit der Inflationsrate. Die monatliche Sparrate bleibt nominal konstant.',
  };

  const goalsSummary = goals.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type === 'annual' ? 'annual' : 'once',
    baseAmountEuro: centsToEuro(g.amountCents),
    firstDueMonth: g.dueMonth,
    endMonth: g.endMonth,
  }));

  let prevCash = settings.cashCents;
  const monthlyTimeline = plan.rows.map((row) => {
    const isCurrentMonth = row.index === 0;
    const contributionCents = isCurrentMonth
      ? 0
      : (plan.feasible ? row.contributionCents : row.bestCaseContributionCents);
    const freeForInvestmentsCents = isCurrentMonth || !plan.feasible
      ? null
      : row.longTermCents;

    const monthData = {
      month: row.month,
      age: row.age,
      cashStartEuro: centsToEuro(prevCash),
      contributionToCashEuro: centsToEuro(contributionCents),
      freeForLongTermInvestmentEuro: centsToEuro(freeForInvestmentsCents),
      expensesEuro: centsToEuro(row.expenseCents),
      cashEndEuro: centsToEuro(row.cashCents),
      minimumReserveEuro: centsToEuro(row.reserveCents),
      bufferAboveReserveEuro: centsToEuro(row.cashCents - row.reserveCents),
    };

    if (row.events.length > 0) {
      monthData.events = row.events.map((e) => ({
        name: e.name,
        amountEuro: centsToEuro(e.amountCents),
        overdue: Boolean(e.overdue),
      }));
    }

    prevCash = row.cashCents;
    return monthData;
  });

  return {
    summary,
    keyRules,
    goals: goalsSummary,
    monthlyTimeline,
  };
}

export function exportData(data, now = new Date(), plan = null) {
  const validated = validateData(data);
  const exportedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const effectivePlan = plan ?? buildPlan(validated.settings, validated.goals);
  const document = {
    format: FORMAT_NAME,
    version: FORMAT_VERSION,
    exportedAt,
    data: validated,
    plan: buildLlmPlanExport(validated.settings, validated.goals, effectivePlan),
  };
  let serialized = JSON.stringify(document, null, 2);
  if (new TextEncoder().encode(serialized).byteLength > MAX_IMPORT_BYTES) {
    delete document.plan;
    serialized = JSON.stringify(document, null, 2);
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_IMPORT_BYTES) {
    serialized = JSON.stringify(document);
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_IMPORT_BYTES) {
    fail('Die Eingabedaten sind zu groß für einen wieder importierbaren Export.');
  }
  return serialized;
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
  const requiredTopKeys = ['format', 'version', 'exportedAt', 'data'];
  const allowedTopKeys = new Set([...requiredTopKeys, 'plan']);
  if (!isPlainObject(parsed)) fail('Unbekanntes JSON-Datenformat.');
  const keys = Object.keys(parsed);
  if (!requiredTopKeys.every((k) => keys.includes(k)) || keys.some((k) => !allowedTopKeys.has(k))) {
    fail('Unbekanntes JSON-Datenformat.');
  }
  if (parsed.format !== FORMAT_NAME) fail('Die Datei stammt nicht aus dem Cashflow-Planner.');
  if (parsed.version !== FORMAT_VERSION) fail('Diese Datenformat-Version wird nicht unterstützt.');
  validateTimestamp(parsed.exportedAt, 'exportedAt');
  return validateData(parsed.data);
}
