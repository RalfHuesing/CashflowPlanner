import { formatAge, money, node } from './format.js';
export function renderMonthlyPlan(plan) {
  const container = document.getElementById('monthly-plan');
  const current = plan.rows[0];
  const currentMonth = node('div', 'current-month-summary');
  currentMonth.append(
    node('strong', '', `Aktuelle Monatsausgaben: ${money(current.expenseCents)}`),
    node('span', '', `Cash nach diesen Ausgaben: ${money(current.cashCents)}`),
  );
  if (!plan.feasible) {
    currentMonth.classList.add('notice');
    container.replaceChildren(
      node('p', 'notice', 'Der gleichbleibende Monatsbetrag reicht zusammen mit dem heutigen Bestand bei der eingestellten Inflation auf Zielbeträge nicht für den gesamten Planungshorizont. Die Vorschau zeigt den Verlauf bei voller monatlicher Zuführung. Sie ist kein finanzierbarer Sparplan; der langfristige Modellbedarf muss nicht pauschal heute vorgehalten werden.'),
      currentMonth,
    );
    const critical = plan.rows.find((row) => row.month === plan.firstCriticalMonth);
    if (critical?.events.length) container.append(node('p', 'small', `Ausgaben im ersten Engpassmonat: ${critical.events.map((event) => event.name ?? event.goalName).join(', ')}.`));
  } else {
    container.replaceChildren(currentMonth);
  }
  const wrapper = node('div', 'table-scroll');
  const table = node('table');
  const caption = node('caption', 'sr-only', 'Cashvorschau für die nächsten zwölf Monate');
  const head = node('thead'); const header = node('tr');
  const contributionLabel = plan.feasible ? 'In Cash zurücklegen' : 'Volle Monatszuführung';
  for (const label of ['Monat / Alter', contributionLabel, 'Übrig vom Monatsbetrag', 'Cash am Monatsende']) { const cell = node('th', '', label); cell.scope = 'col'; header.append(cell); }
  head.append(header); const body = node('tbody');
  for (const row of plan.rows.slice(1, 13)) {
    const tr = node('tr');
    const contribution = plan.feasible ? row.contributionCents : row.bestCaseContributionCents;
    const remainder = plan.feasible ? row.longTermCents : 0;
    const dateAge = node('td', 'month-age-cell');
    dateAge.append(node('span', '', `${row.month.slice(5)}/${row.month.slice(0, 4)}`), node('span', 'muted', `Alter ${formatAge(row.age)}`));
    tr.append(dateAge, node('td', 'cash-contribution', money(contribution)), node('td', '', money(remainder)), node('td', '', money(row.cashCents)));
    body.append(tr);
  }
  table.append(caption, head, body); wrapper.append(table); container.append(wrapper);
}
