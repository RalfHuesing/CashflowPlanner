import { money, monthLabel, node } from './format.js';
export function renderSummary(plan, settings) {
  const next = plan.rows[1];
  const metrics = [
    ['Heute erforderlich', money(plan.requiredTodayCents), 'Vor aktuellen Monatsausgaben', ''],
    [plan.feasible ? 'Rechnerisch freigebbar' : 'Finanzierungslücke', money(plan.feasible ? plan.releasableCents : plan.gapCents), plan.feasible ? 'Unter den Modellannahmen' : 'Zusätzlich heute erforderlich', plan.feasible ? 'positive' : 'negative'],
    ['Nächste Cash-Zuführung', plan.feasible && next ? money(next.contributionCents) : '—', next ? monthLabel(next.month) : 'Kein weiterer Planungsmonat', ''],
    ['Langfristig verfügbar', plan.feasible && next ? money(next.longTermCents) : '—', plan.feasible ? 'Vom nächsten Monatsbetrag' : 'Kein gültiger Sparplan', ''],
  ];
  document.getElementById('summary').replaceChildren(...metrics.map(([label, value, detail, style]) => {
    const card = node('div', `metric ${style}`);
    card.append(node('div', 'metric-label', label), node('strong', 'metric-value', value), node('span', 'metric-detail', detail));
    return card;
  }));
  const status = document.getElementById('plan-status');
  status.textContent = plan.feasible ? '✓ Ziele finanzierbar' : 'Finanzierungslücke';
  status.classList.toggle('negative', !plan.feasible);
  const explanation = plan.feasible
    ? `Für deine geplanten Ausgaben brauchst du heute mindestens ${money(plan.requiredTodayCents)}. Dein tatsächlicher Cashbestand beträgt ${money(settings.cashCents)}. ${next?.contributionCents === 0 ? 'Im nächsten Monat musst du noch kein zusätzliches Cash ansparen.' : 'Die monatlichen Zuführungen werden so spät wie möglich eingeplant.'}`
    : `Für deine geplanten Ausgaben fehlen heute mindestens ${money(plan.gapCents)}. ${plan.firstCriticalMonth ? `Der erste Engpass entsteht im ${monthLabel(plan.firstCriticalMonth)}. ` : ''}Zusätzlicher Cashbestand, ein höherer Monatsbetrag oder angepasste Ziele sind erforderlich.`;
  document.getElementById('explanation').textContent = explanation;
}
