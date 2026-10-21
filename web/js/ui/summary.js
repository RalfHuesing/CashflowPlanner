import { money, monthLabel, node } from './format.js';
function nextMonthMetrics(plan, settings) {
  const next = plan.rows[1];
  if (!next) {
    return [
      ['Nächsten Monat für Cash zurücklegen', '–', 'Kein weiterer Monat im Planungshorizont', ''],
      ['Nächsten Monat für langfristige Anlagen verfügbar', '–', 'Kein weiterer Monat im Planungshorizont', ''],
    ];
  }

  const month = monthLabel(next.month);
  if (!plan.feasible) {
    return [
      ['Nächsten Monat für Cash zurücklegen', money(next.bestCaseContributionCents), `${month} · volle monatliche Zuführung; insgesamt nicht finanzierbar`, ''],
      ['Nächsten Monat für langfristige Anlagen verfügbar', '–', 'Nicht berechenbar, solange der Plan unter den aktuellen Annahmen nicht finanzierbar ist.', ''],
    ];
  }

  return [
    ['Nächsten Monat für Cash zurücklegen', money(next.contributionCents), `${month} · geplante Zuführung`, ''],
    ['Nächsten Monat für langfristige Anlagen verfügbar', money(next.longTermCents), `Von ${money(settings.monthlyCents)} monatlichem Sparbudget`, next.longTermCents > 0 ? 'positive' : ''],
  ];
}

function criticalMonthExplanation(plan) {
  const row = plan.rows.find(row => row.month === plan.firstCriticalMonth);
  if (!row) return '';
  const month = monthLabel(row.month);
  const shortfall = money(Math.max(0, row.reserveCents - row.cashCents));
  if (plan.criticalEvents.length === 0) {
    return ` Im ersten Engpassmonat ${month} fällt keine Zielausgabe an; Auslöser ist die steigende Mindestreserve. Der Bestand liegt ${shortfall} unter der Mindestreserve.`;
  }
  const goals = plan.criticalEvents.map(event => `${event.name} (${money(event.amountCents)})`).join(', ');
  return ` Im ${month} sind ${goals} fällig. Nach diesen Ausgaben liegt der Bestand ${shortfall} unter der Mindestreserve.`;
}

export function buildSummaryModel(plan, settings) {
  const next = plan.rows[1];
  const firstShortfall = plan.firstCriticalMonth ? monthLabel(plan.firstCriticalMonth) : null;
  const metrics = [
    ...nextMonthMetrics(plan, settings),
    ['Dein aktueller Cashbestand', money(settings.cashCents), 'Tatsächlich heute verfügbar', ''],
    ['Ausgaben im aktuellen Monat', money(plan.rows[0].expenseCents), 'Aus dem heutigen Cashbestand; keine Sparrate in diesem Monat', ''],
    plan.feasible
      ? ['Für den Plan heute nicht benötigt', money(plan.releasableCents), plan.releasableCents > 0 ? 'Differenz zwischen aktuellem Cashbestand und rechnerisch benötigtem Startkapital' : 'Der aktuelle Cashbestand entspricht dem rechnerisch benötigten Startkapital', plan.releasableCents > 0 ? 'positive' : '']
      : ['Fehlender Cashbestand', money(plan.gapCents), firstShortfall ? `Erster Engpass: ${firstShortfall}` : 'Innerhalb des Planungshorizonts', 'negative'],
    ['Rechnerisch benötigtes Startkapital', money(plan.requiredTodayCents), `Für alle Ziele bis ${monthLabel(plan.horizonMonth)} bei ${money(settings.monthlyCents)} monatlichem Sparbudget`, ''],
  ];
  let explanation = plan.feasible
    ? `Unter den eingestellten Annahmen reicht dein heutiger Bestand zusammen mit dem gleichbleibenden Sparbudget für den gesamten Planungshorizont. Zuführungen werden so spät wie möglich eingeplant${next?.contributionCents === 0 ? '; im nächsten Monat ist noch keine Zuführung nötig.' : '.'}`
    : `Mit ${money(settings.monthlyCents)} monatlichem Sparbudget, gleichbleibend in jedem künftigen Monat, reicht die Planung bei ${settings.inflationBps / 100}% Inflation nicht bis zum Ende des Horizonts. Der fehlende Cashbestand beträgt ${money(plan.gapCents)}; der erste Engpass entsteht ${firstShortfall ? `im ${firstShortfall}` : 'innerhalb des Planungshorizonts'}. Ein anderes Sparbudget oder angepasste Ziele verändern das Ergebnis.`;
  if (plan.feasible && plan.releasableCents > 0) {
    explanation += ` Von deinem heutigen Cashbestand werden ${money(plan.releasableCents)} unter diesen Annahmen nicht für den Plan benötigt.`;
  } else if (!plan.feasible) {
    explanation += criticalMonthExplanation(plan);
  }
  return { metrics, explanation };
}

export function renderSummary(plan, settings) {
  const { metrics, explanation } = buildSummaryModel(plan, settings);
  document.getElementById('summary').replaceChildren(...metrics.map(([label, value, detail, style]) => {
    const card = node('div', `metric ${style}`);
    card.append(node('div', 'metric-label', label), node('strong', 'metric-value', value), node('span', 'metric-detail', detail));
    return card;
  }));
  const status = document.getElementById('plan-status');
  status.textContent = plan.feasible ? '✓ Im Modell finanzierbar' : 'Im Modell nicht finanzierbar';
  status.classList.toggle('negative', !plan.feasible);
  document.getElementById('explanation').textContent = explanation;
}
