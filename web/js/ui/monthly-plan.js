import { money, monthLabel, node } from './format.js';
export function renderMonthlyPlan(plan) {
  const container = document.getElementById('monthly-plan');
  if (!plan.feasible) {
    container.replaceChildren(node('p', 'notice', 'Für dieses Szenario gibt es keinen vollständig finanzierbaren Sparplan. Das Diagramm zeigt den bestmöglichen Verlauf bei maximaler monatlicher Cash-Zuführung.'));
    const critical = plan.rows.find((row) => row.month === plan.firstCriticalMonth);
    if (critical?.events.length) container.append(node('p', 'small', `Ausgaben im ersten kritischen Monat: ${critical.events.map((event) => event.name ?? event.goalName).join(', ')}.`));
    return;
  }
  const wrapper = node('div', 'table-scroll');
  const table = node('table');
  const caption = node('caption', 'sr-only', 'Sparvorschau für die nächsten zwölf Monate');
  const head = node('thead'); const header = node('tr');
  for (const label of ['Monat', 'In Cash zurücklegen', 'Langfristig verfügbar', 'Cash am Monatsende']) { const cell = node('th', '', label); cell.scope = 'col'; header.append(cell); }
  head.append(header); const body = node('tbody');
  for (const row of plan.rows.slice(1, 13)) {
    const tr = node('tr');
    tr.append(node('td', '', monthLabel(row.month)), node('td', 'cash-contribution', money(row.contributionCents)), node('td', '', money(row.longTermCents)), node('td', '', money(row.cashCents)));
    body.append(tr);
  }
  table.append(caption, head, body); wrapper.append(table); container.replaceChildren(wrapper);
}
