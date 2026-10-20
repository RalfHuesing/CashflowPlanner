import { currentMonth } from './domain/calendar.js';
import { buildPlan } from './domain/scenarios.js';
import { getCashFreshness, loadData, saveData } from './data/storage.js';
import { exportData, MAX_IMPORT_BYTES, parseImport, validateData } from './data/import-export.js';
import { getSampleData } from './data/sample-data.js';
import { bindSettings, fillSettings } from './ui/settings-form.js';
import { bindGoalForm, bindGoalList, renderGoals } from './ui/goals-form.js';
import { renderSummary } from './ui/summary.js';
import { renderChart } from './ui/chart.js';
import { renderMonthlyPlan } from './ui/monthly-plan.js';
import { money, monthLabel } from './ui/format.js';
import { bindNavigation } from './ui/navigation.js';

const loaded = loadData();
let data = loaded.data;
let plan;
const startMonth = currentMonth();
const message = document.getElementById('app-message');
function notify(text) { message.textContent = text; message.hidden = !text; }
function persist() {
  const result = saveData(data);
  if (!result.ok) notify(result.error);
}
function updateFreshness() {
  const notice = document.getElementById('stale-notice');
  const { stale } = getCashFreshness(data.cashUpdatedAt);
  notice.hidden = !stale || data.cashUpdatedAt === null;
  if (!notice.hidden) notice.textContent = `Dein Cashbestand wurde zuletzt am ${new Date(data.cashUpdatedAt).toLocaleDateString('de-DE')} aktualisiert. Prüfe den aktuellen Betrag für eine zuverlässige Planung.`;
}
function renderResult() {
  renderSummary(plan, data.settings);
  renderChart(plan);
  renderMonthlyPlan(plan);
}
function render() {
  try {
    plan = buildPlan(data.settings, data.goals, startMonth);
    renderGoals(data.goals, openGoal, removeGoal, startMonth, data.settings.currentAge);
    const overdue = plan.events.filter((event) => event.overdue);
    const overdueNotice = document.getElementById('overdue-notice');
    overdueNotice.hidden = !overdue.length;
    overdueNotice.textContent = overdue.length ? `${overdue.length} ${overdue.length === 1 ? 'überfällige Ausgabe wird' : 'überfällige Ausgaben werden'} im aktuellen Monat aus deinem heutigen Cashbestand bezahlt: ${overdue.slice(0, 3).map((event) => event.name).join(', ')}${overdue.length > 3 ? ` und ${overdue.length - 3} weitere` : ''}. Bitte aktualisiere bereits bezahlte Ziele.` : '';
    const excluded = plan.excludedGoals;
    const excludedNotice = document.getElementById('excluded-notice');
    excludedNotice.hidden = !excluded.length;
    excludedNotice.textContent = `Nicht im Plan enthalten: ${excluded.map((goal) => ` ${goal.name} (nach dem Planungshorizont)`.trim()).join('; ')}. Bitte prüfe Fälligkeiten und Planungshorizont.`;
    document.getElementById('horizon-note').textContent = `Der Plan endet im ${monthLabel(plan.horizonMonth)}. ${excluded.length ? `Nicht berücksichtigt: ${excluded.map((goal) => `${goal.name} (nach dem Planungshorizont)`).join('; ')}.` : 'Alle im Planungshorizont fälligen Ziele sind berücksichtigt.'}`;
    renderResult(); updateFreshness();
  } catch (error) { notify(`Die Planung konnte nicht berechnet werden: ${error.message}`); }
}
function applyData(next) {
  const valid = validateData(next);
  buildPlan(valid.settings, valid.goals, startMonth);
  data = valid;
  fillSettings(data.settings); persist(); render();
}
function removeGoal(id) {
  data = {...data,goals:data.goals.filter((goal) => goal.id !== id)};
  persist(); render();
  document.getElementById('add-goal').focus({ preventScroll: true });
  notify('Ziel gelöscht. Die Planung wurde aktualisiert.');
}
const openGoal = bindGoalForm((goal) => {
  const goals = data.goals.filter((entry) => entry.id !== goal.id);
  goals.push(goal);
  applyData({...data,goals}); notify('Ziel gespeichert.');
},startMonth, () => data.settings.currentAge);
bindSettings((settings, cashChanged) => {
  data = {...data,settings,cashUpdatedAt:cashChanged ? new Date().toISOString() : data.cashUpdatedAt};
  persist(); render();
});
function confirmReplacement(description, action) {
  const dialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-description').textContent = description;
  document.getElementById('confirm-accept').onclick = () => {
    try {action();dialog.close();} catch (error) {dialog.close();notify(error.message);}
  };
  document.getElementById('confirm-cancel').onclick = () => dialog.close();
  dialog.showModal();
}
document.getElementById('sample-button').addEventListener('click',() => {
  const action = () => {applyData(getSampleData());notify('Beispieldaten geladen. Du kannst alle Werte ausprobieren und anpassen.');};
  if (data.goals.length || data.settings.cashCents || data.settings.monthlyCents || data.settings.reserveCents) confirmReplacement('Die Beispieldaten ersetzen deine aktuelle Planung. Sichere sie bei Bedarf zuerst über „Exportieren“.',action);
  else action();
});
document.getElementById('export-button').addEventListener('click',() => {
  try {
    const blob = new Blob([exportData(data, new Date(), plan)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href=url;anchor.download=`cashflow-planner-${startMonth}.json`;
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    notify('Deine Planung wurde als JSON-Datei zum Download bereitgestellt.');
  } catch (error) {notify(`Export fehlgeschlagen: ${error.message}`);}
});
const fileInput = document.getElementById('import-file');
document.getElementById('import-button').addEventListener('click',() => fileInput.click());
fileInput.addEventListener('change',async () => {
  const file = fileInput.files[0];
  fileInput.value='';
  if (!file) return;
  try {
    if (file.size>MAX_IMPORT_BYTES) throw new Error('Die Datei ist zu groß. Erlaubt ist maximal 1 MB.');
    const imported = parseImport(await file.text());
    buildPlan(imported.settings,imported.goals,startMonth);
    confirmReplacement(`Die gültige Datei enthält ${imported.goals.length} Ziele und ${money(imported.settings.cashCents)} Cashbestand. Deine aktuelle Planung wird vollständig ersetzt.`,() => {applyData(imported);notify('Die Planung wurde vollständig importiert.');});
  } catch (error) {notify(`Import fehlgeschlagen: ${error.message}`);}
});
bindGoalList(() => renderGoals(data.goals, openGoal, removeGoal, startMonth, data.settings.currentAge));
bindNavigation();
fillSettings(data.settings);
render();
if (loaded.warning) notify(loaded.warning);
