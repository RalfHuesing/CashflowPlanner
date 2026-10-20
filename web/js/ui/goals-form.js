import { editableMoney, formatAge, money, node, parseMoney } from './format.js';
import { monthDifference } from '../domain/calendar.js';
export const GOALS_PER_PAGE = 12;
const listState = { query: '', sort: 'due', page: 1 };
const monthYear = (month) => `${month.slice(5)}/${month.slice(0, 4)}`;
const ageLabel = (month, startMonth, currentAge) => {
  const age = currentAge + monthDifference(startMonth, month) / 12;
  return formatAge(age);
};

/** Keep list selection independent of DOM so large lists remain easy to verify. */
export function selectGoals(goals, { query = '', sort = 'due', page = 1 } = {}) {
  const needle = query.trim().toLocaleLowerCase('de-DE');
  const filtered = goals.filter((goal) => goal.name.toLocaleLowerCase('de-DE').includes(needle));
  filtered.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'de');
    if (sort === 'amount') return b.amountCents - a.amountCents || a.name.localeCompare(b.name, 'de');
    return a.dueMonth.localeCompare(b.dueMonth) || a.name.localeCompare(b.name, 'de');
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / GOALS_PER_PAGE));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  return {
    goals: filtered.slice((currentPage - 1) * GOALS_PER_PAGE, currentPage * GOALS_PER_PAGE),
    total: filtered.length,
    page: currentPage,
    pageCount,
  };
}

export function bindGoalList(onChange) {
  document.getElementById('goal-search').addEventListener('input', (event) => {
    listState.query = event.target.value;
    listState.page = 1;
    onChange();
  });
  document.getElementById('goal-sort').addEventListener('change', (event) => {
    listState.sort = event.target.value;
    listState.page = 1;
    onChange();
  });
}

export function renderGoals(goals, onEdit, onDelete, startMonth, currentAge) {
  const selection = selectGoals(goals, listState);
  listState.page = selection.page;
  const container = document.getElementById('goal-list');
  container.replaceChildren();
  document.getElementById('goal-count').textContent = goals.length;
  document.getElementById('nav-goal-count').textContent = goals.length;
  const first = (selection.page - 1) * GOALS_PER_PAGE + 1;
  const last = Math.min(selection.page * GOALS_PER_PAGE, selection.total);
  document.getElementById('goal-results-status').textContent = selection.total
    ? `${selection.total === 1 ? '1' : `${first}–${last}`} von ${selection.total} ${selection.total === 1 ? 'Ziel' : 'Zielen'}${listState.query ? ` · ${goals.length} insgesamt` : ''}`
    : goals.length ? 'Keine passenden Ziele. Ändere deinen Suchbegriff.' : 'Deine Ziele erscheinen hier.';
  if (!selection.total) {
    container.append(node('p', 'empty-state', goals.length
      ? 'Für diesen Suchbegriff wurden keine Ziele gefunden.'
      : 'Was steht bei dir an? Füge dein erstes Ziel hinzu oder probiere die Beispieldaten aus.'));
  }
  for (const goal of selection.goals) {
    const card = node('article', 'goal-card');
    const content = node('div', 'goal-content');
    const heading = node('div', 'goal-card-header');
    heading.append(node('h3', '', goal.name), node('span', 'goal-amount', money(goal.amountCents)));
    const timing = `${monthYear(goal.dueMonth)} · Alter: ${ageLabel(goal.dueMonth, startMonth, currentAge)} · ${goal.type === 'annual' ? 'Jährlich' : 'Einmalig'}${goal.type === 'annual' && goal.endMonth ? ` · bis ${monthYear(goal.endMonth)} · Alter: ${ageLabel(goal.endMonth, startMonth, currentAge)}` : ''}`;
    content.append(heading, node('p', '', timing));
    if (goal.dueMonth < startMonth && (goal.type !== 'annual' || goal.dueMonth.slice(5) !== startMonth.slice(5) || (goal.endMonth && goal.endMonth < startMonth))) {
      content.append(node('p', 'overdue-label', goal.type === 'annual'
        ? 'Überfällig · eine offene Ausgabe wird heute nachgeholt.'
        : 'Überfällig · im aktuellen Monat eingeplant.'));
    }
    const actions = node('div', 'goal-actions');
    const edit = node('button', 'text-button', 'Bearbeiten');
    edit.type = 'button';
    edit.setAttribute('aria-label', `${goal.name} bearbeiten`);
    edit.addEventListener('click', () => onEdit(goal));
    const remove = node('button', 'text-button delete-button', 'Löschen');
    remove.type = 'button';
    remove.setAttribute('aria-label', `${goal.name} löschen`);
    remove.addEventListener('click', () => onDelete(goal.id));
    actions.append(edit, remove);
    card.append(content, actions);
    container.append(card);
  }
  const previous = document.getElementById('goals-previous');
  const next = document.getElementById('goals-next');
  previous.disabled = selection.page === 1;
  next.disabled = selection.page === selection.pageCount;
  document.getElementById('goals-page').textContent = `Seite ${selection.page} von ${selection.pageCount}`;
  const turnPage = (direction) => {
    listState.page += direction;
    renderGoals(goals, onEdit, onDelete, startMonth, currentAge);
    document.getElementById('goals-page').focus({ preventScroll: true });
    document.getElementById('goals-view').scrollIntoView({ block: 'start' });
  };
  previous.onclick = () => turnPage(-1);
  next.onclick = () => turnPage(1);
}
export function bindGoalForm(onSave, startMonth, getCurrentAge) {
  const dialog = document.getElementById('goal-dialog');
  const form = document.getElementById('goal-form');
  const fields = ['name', 'amount', 'dueMonth', 'type', 'flexMonths', 'endMonth'].map((name) => form.elements[name]);
  for (const field of fields) field.setAttribute('aria-describedby', field.name === 'endMonth' ? 'goal-end-month-help goal-error' : 'goal-error');
  const validateEndMonth = (type, endMonth, dueMonth, reject) => {
    if (type !== 'annual' || !endMonth) return;
    if (!/^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(endMonth)) reject(form.elements.endMonth, 'Bitte wähle einen gültigen letzten Fälligkeitsmonat.');
    if (endMonth < dueMonth) reject(form.elements.endMonth, 'Die letzte Fälligkeit muss im ersten Fälligkeitsmonat oder später liegen.');
  };
  const endMonthField = document.getElementById('goal-end-month-field');
  const updateEndMonthField = () => {
    const annual = form.elements.type.value === 'annual';
    endMonthField.hidden = !annual;
    form.elements.endMonth.disabled = !annual;
    if (!annual) {
      form.elements.endMonth.value = '';
      form.elements.endMonth.removeAttribute('aria-invalid');
    }
  };
  const updateAgePreviews = () => {
    const currentAge = getCurrentAge();
    const dueMonth = form.elements.dueMonth.value;
    const duePreview = document.getElementById('goal-month-age');
    duePreview.textContent = /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(dueMonth)
      ? `Entspricht ungefähr Alter ${ageLabel(dueMonth, startMonth, currentAge)}.`
      : '';
    const endMonth = form.elements.endMonth.value;
    const endPreview = document.getElementById('goal-end-month-age');
    endPreview.textContent = /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(endMonth)
      ? ` Entspricht ungefähr Alter ${ageLabel(endMonth, startMonth, currentAge)}.`
      : '';
  };
  for (const field of [form.elements.dueMonth, form.elements.endMonth]) {
    field.addEventListener('input', updateAgePreviews);
    field.addEventListener('change', updateAgePreviews);
  }
  form.elements.type.addEventListener('change', () => {
    updateEndMonthField();
    updateAgePreviews();
  });
  let editingId = null;
  let opener = null;
  dialog.addEventListener('close', () => {
    const target = opener?.isConnected ? opener : document.getElementById('add-goal');
    target.focus({ preventScroll: true });
  });
  const open = (goal = null) => {
    opener = document.activeElement;
    editingId = goal?.id ?? null;
    form.reset();
    document.getElementById('goal-dialog-title').textContent = goal ? 'Ziel bearbeiten' : 'Neues Ziel';
    document.getElementById('goal-name').value = goal?.name ?? '';
    document.getElementById('goal-amount').value = goal ? editableMoney(goal.amountCents) : '';
    document.getElementById('goal-month').value = goal?.dueMonth ?? startMonth;
    document.getElementById('goal-type').value = goal?.type ?? 'once';
    document.getElementById('goal-flex').value = goal?.flexMonths ?? 0;
    form.elements.endMonth.value = goal?.type === 'annual' ? goal.endMonth ?? '' : '';
    updateEndMonthField();
    updateAgePreviews();
    document.getElementById('goal-error').textContent = '';
    for (const field of fields) field.removeAttribute('aria-invalid');
    dialog.showModal();
  };
  document.getElementById('add-goal').addEventListener('click', () => open());
  for (const id of ['cancel-goal', 'close-goal']) document.getElementById(id).addEventListener('click', () => dialog.close());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const field of fields) field.removeAttribute('aria-invalid');
    const reject = (field, message) => {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      throw new Error(message);
    };
    try {
      const name = form.elements.name.value.trim();
      if (!name) reject(form.elements.name, 'Bitte gib deinem Ziel eine Bezeichnung.');
      let amountCents;
      try { amountCents = parseMoney(form.elements.amount.value); }
      catch (error) { reject(form.elements.amount, error.message); }
      const dueMonth = form.elements.dueMonth.value;
      const type = form.elements.type.value;
      const endMonth = type === 'annual' ? form.elements.endMonth.value || null : null;
      const flexMonths = Number(form.elements.flexMonths.value);
      if (!amountCents) reject(form.elements.amount, 'Der Zielbetrag muss größer als 0 € sein.');
      if (!/^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(dueMonth)) reject(form.elements.dueMonth, 'Bitte wähle einen gültigen Fälligkeitsmonat.');
      validateEndMonth(type, endMonth, dueMonth, reject);
      if (!Number.isInteger(flexMonths) || flexMonths < 0 || flexMonths > 1200) reject(form.elements.flexMonths, 'Der Spielraum muss zwischen 0 und 1200 Monaten liegen.');
      onSave({ id: editingId ?? (globalThis.crypto?.randomUUID?.() ?? "goal-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)), name, amountCents, dueMonth, type, endMonth, flexMonths });
      dialog.close();
    } catch (problem) { document.getElementById('goal-error').textContent = problem.message; }
  });
  return open;
}
