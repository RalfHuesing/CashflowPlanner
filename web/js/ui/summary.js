import { money, monthLabel, node } from './format.js';
export function renderSummary(plan, settings) {
  const next = plan.rows[1];
  const firstShortfall = plan.firstCriticalMonth ? monthLabel(plan.firstCriticalMonth) : null;
  const metrics = [
    ['Dein aktueller Cashbestand', money(settings.cashCents), 'Tatsächlich heute verfügbar', ''],
    ['Ausgaben im aktuellen Monat', money(plan.rows[0].expenseCents), 'Aus dem heutigen Cashbestand; keine Sparrate in diesem Monat', ''],
    ['Fehlender Cashbestand', money(plan.gapCents), plan.feasible ? 'Keine Lücke unter den eingestellten Annahmen' : firstShortfall ? `Erster Engpass: ${firstShortfall}` : 'Bei heutigem Bestand und gleichbleibendem Monatsbetrag', plan.feasible ? '' : 'negative'],
    ['Heute nötiger Cashbestand', money(plan.requiredTodayCents), `Rechnerischer Mindestbestand bei ${money(settings.monthlyCents)} monatlich; keine Halteempfehlung`, ''],
  ];
  document.getElementById('summary').replaceChildren(...metrics.map(([label, value, detail, style]) => {
    const card = node('div', `metric ${style}`);
    card.append(node('div', 'metric-label', label), node('strong', 'metric-value', value), node('span', 'metric-detail', detail));
    return card;
  }));
  const status = document.getElementById('plan-status');
  status.textContent = plan.feasible ? '✓ Im Modell finanzierbar' : 'Im Modell nicht finanzierbar';
  status.classList.toggle('negative', !plan.feasible);
  const explanation = plan.feasible
    ? `Unter den eingestellten Annahmen reicht dein heutiger Bestand zusammen mit dem gleichbleibenden Monatsbetrag für den gesamten Planungshorizont. Zuführungen werden so spät wie möglich eingeplant${next?.contributionCents === 0 ? '; im nächsten Monat ist noch keine Zuführung nötig.' : '.'}`
    : `Mit ${money(settings.monthlyCents)} monatlich, gleichbleibend in jedem künftigen Monat, reicht die Planung bei ${settings.inflationBps / 100}% Inflation nicht bis zum Ende des Horizonts. Der fehlende Cashbestand beträgt ${money(plan.gapCents)}; der erste Engpass entsteht ${firstShortfall ? `im ${firstShortfall}` : 'innerhalb des Planungshorizonts'}. Der heute nötige Cashbestand ist ein Rechenwert für den gesamten Horizont und keine Empfehlung, diesen Betrag heute vorzuhalten. Ein anderer Monatsbetrag oder angepasste Ziele verändern das Ergebnis.`;
  document.getElementById('explanation').textContent = explanation;
}
