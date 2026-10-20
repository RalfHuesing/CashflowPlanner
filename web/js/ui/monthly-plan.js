import { formatAge, money, monthLabel, node } from './format.js';

let selectedYear = null;

function groupRowsByYear(rows) {
  const map = new Map();
  for (const row of rows) {
    const year = row.month.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(row);
  }
  return Array.from(map.entries()).map(([year, yearRows]) => ({
    year,
    rows: yearRows,
    startAge: yearRows[0].age,
    endAge: yearRows[yearRows.length - 1].age,
  }));
}

export function renderMonthlyPlan(plan) {
  const container = document.getElementById('monthly-plan');
  if (!container) return;

  const years = groupRowsByYear(plan.rows);
  if (!years.length) {
    container.replaceChildren(node('p', 'muted', 'Keine Plandaten vorhanden.'));
    return;
  }

  let yearIndex = years.findIndex((y) => y.year === selectedYear);
  if (yearIndex === -1) {
    yearIndex = 0;
    selectedYear = years[0].year;
  }
  const currentYear = years[yearIndex];

  const content = [];

  if (!plan.feasible) {
    content.push(node('p', 'notice', 'Der gleichbleibende Monatsbetrag reicht zusammen mit dem heutigen Bestand bei der eingestellten Inflation auf Zielbeträge nicht für den gesamten Planungshorizont. Die Vorschau zeigt den Verlauf bei voller monatlicher Zuführung. Sie ist kein finanzierbarer Sparplan; der heute nötige Cashbestand muss nicht pauschal heute vorgehalten werden.'));
    const critical = currentYear.rows.find((row) => row.month === plan.firstCriticalMonth);
    if (critical?.events.length) {
      content.push(node('p', 'small', `Ausgaben im ersten Engpassmonat (${monthLabel(plan.firstCriticalMonth)}): ${critical.events.map((event) => event.name ?? event.goalName).join(', ')}.`));
    }
  }

  if (yearIndex === 0) {
    const current = plan.rows[0];
    const currentSummary = node('div', 'current-month-summary');
    currentSummary.append(
      node('strong', '', `Aktuelle Monatsausgaben (${monthLabel(current.month)}): ${money(current.expenseCents)}`),
      node('span', '', `Cash nach diesen Ausgaben: ${money(current.cashCents)}`),
    );
    content.push(currentSummary);
  }

  const createPagination = (isTop = false) => {
    const nav = node('nav', isTop ? 'monthly-pagination monthly-pagination-top' : 'monthly-pagination');
    nav.setAttribute('aria-label', `Monatsplan-Jahre (aktuell Jahr ${currentYear.year})`);

    const prevBtn = node('button', 'button subtle', '← Vorheriges Jahr');
    prevBtn.type = 'button';
    prevBtn.disabled = yearIndex === 0;
    prevBtn.onclick = () => {
      selectedYear = years[yearIndex - 1].year;
      renderMonthlyPlan(plan);
      nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const selectorWrap = node('div', 'monthly-year-picker');
    const select = node('select', 'monthly-year-select');
    select.setAttribute('aria-label', 'Jahr auswählen');
    for (const y of years) {
      const opt = node('option', '', `${y.year} (Alter ${formatAge(y.startAge, { withUnit: false })})`);
      opt.value = y.year;
      if (y.year === selectedYear) opt.selected = true;
      select.append(opt);
    }
    select.onchange = (e) => {
      selectedYear = e.target.value;
      renderMonthlyPlan(plan);
    };
    selectorWrap.append(select);

    const nextBtn = node('button', 'button subtle', 'Nächstes Jahr →');
    nextBtn.type = 'button';
    nextBtn.disabled = yearIndex === years.length - 1;
    nextBtn.onclick = () => {
      selectedYear = years[yearIndex + 1].year;
      renderMonthlyPlan(plan);
      nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const pageInfo = node('span', 'monthly-page-info', `Jahr ${currentYear.year} · Alter ${formatAge(currentYear.startAge, { withUnit: false })} · ${yearIndex + 1} von ${years.length}`);

    nav.append(prevBtn, selectorWrap, pageInfo, nextBtn);
    return nav;
  };

  content.push(createPagination(true));

  const wrapper = node('div', 'table-scroll');
  const table = node('table');
  const caption = node('caption', 'sr-only', `Cashverlauf für das Jahr ${currentYear.year}`);
  const head = node('thead');
  const header = node('tr');
  const contributionLabel = plan.feasible ? 'In Cash zurücklegen' : 'Volle Monatszuführung';

  for (const label of ['Monat / Alter', contributionLabel, 'Übrig vom Monatsbetrag', 'Cash am Monatsende']) {
    const cell = node('th', '', label);
    cell.scope = 'col';
    header.append(cell);
  }
  head.append(header);

  const body = node('tbody');
  for (const row of currentYear.rows) {
    const tr = node('tr');
    const isCurrentMonth = row.index === 0;
    const contribution = isCurrentMonth
      ? '–'
      : money(plan.feasible ? row.contributionCents : row.bestCaseContributionCents);
    const remainder = isCurrentMonth
      ? '–'
      : money(plan.feasible ? row.longTermCents : 0);

    const dateAge = node('td', 'month-age-cell');
    dateAge.append(
      node('span', '', `${row.month.slice(5)}/${row.month.slice(0, 4)}`),
      node('span', 'muted', isCurrentMonth ? `Alter ${formatAge(row.age)} · Aktuell` : `Alter ${formatAge(row.age)}`),
    );
    if (row.events.length) {
      dateAge.append(node('span', 'event-note', row.events.map((e) => `${e.name} (${money(e.amountCents)})`).join(', ')));
    }

    tr.append(
      dateAge,
      node('td', isCurrentMonth ? '' : 'cash-contribution', contribution),
      node('td', '', remainder),
      node('td', '', money(row.cashCents)),
    );
    body.append(tr);
  }
  table.append(caption, head, body);
  wrapper.append(table);
  content.push(wrapper);

  content.push(createPagination(false));

  container.replaceChildren(...content);
}
