import { formatAge, money, node } from './format.js';

const NS = 'http://www.w3.org/2000/svg';

function svgNode(tag, attributes = {}, text) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function aggregateYearlyData(rows, feasible) {
  const map = new Map();
  for (const row of rows) {
    const year = row.month.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(row);
  }

  return Array.from(map.entries()).map(([year, yearRows]) => {
    let capacityCents = 0;
    let contributionCents = 0;
    let longTermCents = 0;
    let expenseCents = 0;
    const events = [];

    for (const r of yearRows) {
      capacityCents += r.capacityCents;
      contributionCents += (feasible ? r.contributionCents : r.bestCaseContributionCents);
      longTermCents += (feasible ? r.longTermCents : 0);
      expenseCents += r.expenseCents;
      if (r.events?.length) events.push(...r.events);
    }

    const freePercent = capacityCents > 0 ? Math.round((longTermCents / capacityCents) * 100) : 0;
    const cashPercent = capacityCents > 0 ? Math.round((contributionCents / capacityCents) * 100) : 0;
    const lastRow = yearRows[yearRows.length - 1];

    return {
      year,
      age: yearRows[0].age,
      monthsCount: yearRows.length,
      capacityCents,
      contributionCents,
      longTermCents,
      expenseCents,
      freePercent,
      cashPercent,
      events,
      endCashCents: lastRow.cashCents,
      endReserveCents: lastRow.reserveCents,
    };
  });
}

function renderYearlySummary(years, feasible) {
  let totalCapacity = 0;
  let totalContribution = 0;
  let totalFree = 0;
  let totalExpenses = 0;

  for (const y of years) {
    totalCapacity += y.capacityCents;
    totalContribution += y.contributionCents;
    totalFree += y.longTermCents;
    totalExpenses += y.expenseCents;
  }

  const freePercent = totalCapacity > 0 ? Math.round((totalFree / totalCapacity) * 100) : 0;
  const cashPercent = totalCapacity > 0 ? Math.round((totalContribution / totalCapacity) * 100) : 0;

  const grid = node('div', 'summary-grid yearly-kpis');

  const freeCard = node('div', `metric${feasible ? ' positive' : ''}`);
  freeCard.append(
    node('span', 'metric-label', 'Übrig für Vermögensaufbau (Gesamt)'),
    node('strong', 'metric-value', feasible ? money(totalFree) : '–'),
    node('span', 'metric-detail', feasible
      ? `${freePercent} % deines gesamten Sparbudgets (${money(totalCapacity)})`
      : 'Nicht berechenbar, da der Plan unter den aktuellen Annahmen nicht finanzierbar ist.'),
  );

  const cashCard = node('div', 'metric');
  cashCard.append(
    node('span', 'metric-label', feasible ? 'In Cash zurückgelegt (für geplante Ausgaben)' : 'Volle monatliche Zuführung in Cash'),
    node('strong', 'metric-value', money(totalContribution)),
    node('span', 'metric-detail', feasible
      ? `${cashPercent} % deines gesamten Sparbudgets fließen in Liquidität`
      : `Rechnerische Vorschau mit vollem Monatsbudget (${cashPercent} %); der Plan bleibt nicht finanzierbar.`),
  );

  const expenseCard = node('div', 'metric');
  expenseCard.append(
    node('span', 'metric-label', 'Geplante Ausgaben'),
    node('strong', 'metric-value', money(totalExpenses)),
    node('span', 'metric-detail', `Summe der geplanten Ausgaben über ${years.length} Jahre`),
  );

  grid.append(freeCard, cashCard, expenseCard);
  return grid;
}

function renderYearlyChart(years, feasible) {
  const width = 860;
  const height = 320;
  const left = 75;
  const right = 20;
  const top = 25;
  const bottom = 55;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  let maxVal = 10000;
  for (const y of years) {
    maxVal = Math.max(maxVal, y.capacityCents, y.expenseCents);
  }
  maxVal = Math.ceil(maxVal * 1.1);

  const yPos = (cents) => top + (maxVal - cents) / maxVal * plotHeight;
  const slotWidth = plotWidth / Math.max(1, years.length);
  const barWidth = Math.max(6, Math.min(26, slotWidth * 0.72));
  const centerX = (i) => left + (i + 0.5) * slotWidth;
  const barX = (i) => centerX(i) - barWidth / 2;

  const svg = svgNode('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    tabindex: '0',
    'aria-labelledby': 'yearly-chart-title',
    'aria-describedby': 'yearly-chart-instructions yearly-chart-tooltip',
  });
  svg.append(svgNode('title', { id: 'yearly-chart-title' }, 'Stapeldiagramm: Cash-Zuführung und verbleibender Sparbetrag pro Jahr'));

  const instructions = node('p', 'sr-only', 'Stapeldiagramm: Die waagerechte Achse zeigt jedes Planungsjahr und das Alter. Grüne Balken zeigen den für langfristige Anlagen verbleibenden Sparbetrag, bernsteinfarbene Balken den für Cash zurückgelegten Betrag. Rote Rauten markieren geplante Ausgaben. Mit den Pfeiltasten erkundest du einzelne Jahre; Pos1 und Ende springen zum Anfang und Ende.');
  instructions.id = 'yearly-chart-instructions';

  // Horizontal grid lines
  for (let step = 0; step <= 4; step++) {
    const cents = (maxVal * step) / 4;
    const lineY = yPos(cents);
    svg.append(svgNode('line', { x1: left, x2: width - right, y1: lineY, y2: lineY, class: 'chart-grid' }));
    const label = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(cents / 100));
    svg.append(svgNode('text', { x: left - 10, y: lineY + 4, 'text-anchor': 'end', class: 'chart-label' }, `${label} €`));
  }

  // Stacked Bars and Expense Markers
  const baseZero = yPos(0);
  for (let i = 0; i < years.length; i++) {
    const yr = years[i];
    const bx = barX(i);

    // Contribution bar (bottom)
    const hCash = Math.max(0, (yr.contributionCents / maxVal) * plotHeight);
    const yCash = baseZero - hCash;
    if (hCash > 0) {
      svg.append(svgNode('rect', {
        x: bx, y: yCash, width: barWidth, height: hCash, rx: 2, class: 'bar-cash',
      }));
    }

    // Free bar (top)
    const hFree = Math.max(0, (yr.longTermCents / maxVal) * plotHeight);
    const yFree = yCash - hFree;
    if (hFree > 0) {
      svg.append(svgNode('rect', {
        x: bx, y: yFree, width: barWidth, height: hFree, rx: 2, class: 'bar-free',
      }));
    }

    // Expense diamond marker
    if (yr.expenseCents > 0) {
      const cx = centerX(i);
      const ye = yPos(yr.expenseCents);
      const points = `${cx},${ye - 5} ${cx + 5},${ye} ${cx},${ye + 5} ${cx - 5},${ye}`;
      const marker = svgNode('polygon', { points, class: 'marker-expense' });
      marker.append(svgNode('title', {}, `Ausgaben ${yr.year}: ${money(yr.expenseCents)}`));
      svg.append(marker);
    }
  }

  // X-Axis Year & Age Labels
  const stepInterval = years.length <= 14 ? 1 : years.length <= 26 ? 2 : 5;
  for (let i = 0; i < years.length; i++) {
    const isFirst = i === 0;
    const isLast = i === years.length - 1;
    const isStep = i % stepInterval === 0;
    if (!isFirst && !isLast && !isStep) continue;

    const cx = centerX(i);
    const yr = years[i];
    const tick = svgNode('text', { x: cx, y: height - 32, 'text-anchor': 'middle', class: 'chart-label' });
    tick.append(svgNode('tspan', { x: cx, dy: 0 }, yr.year));
    tick.append(svgNode('tspan', { x: cx, dy: 14 }, `Alter ${formatAge(yr.age, { withUnit: false })}`));
    svg.append(tick);
  }

  const indicator = svgNode('line', {
    y1: top, y2: height - bottom, stroke: '#82988d', 'stroke-dasharray': '3 3', opacity: '0',
  });
  svg.append(indicator);

  const tooltip = node('div', 'chart-tooltip yearly-tooltip');
  tooltip.id = 'yearly-chart-tooltip';
  tooltip.setAttribute('aria-live', 'polite');

  let selectedIndex = -1;
  const select = (index) => {
    index = Math.max(0, Math.min(years.length - 1, index));
    if (index === selectedIndex) return;
    selectedIndex = index;
    const yr = years[index];

    indicator.setAttribute('x1', centerX(index));
    indicator.setAttribute('x2', centerX(index));
    indicator.setAttribute('opacity', '1');

    const header = node('strong', '', `Jahr ${yr.year} · Alter ${formatAge(yr.age, { withUnit: false })}`);
    const freeText = node('span', 'tooltip-free', feasible
      ? `Übrig für Vermögensaufbau: ${money(yr.longTermCents)} (${yr.freePercent} %)`
      : 'Für langfristige Anlagen verfügbar: nicht berechenbar');
    const cashText = node('span', 'tooltip-cash', `In Cash zurückgelegt: ${money(yr.contributionCents)} (${yr.cashPercent} %)`);
    const budgetText = node('span', 'muted small', `Jahres-Sparbudget: ${money(yr.capacityCents)} · Cash-Endstand: ${money(yr.endCashCents)}`);

    const elements = [header, node('br'), freeText, node('br'), cashText, node('br'), budgetText];
    if (yr.expenseCents > 0) {
      const expenseText = node('span', 'tooltip-expense', `Geplante Ausgaben: ${money(yr.expenseCents)}`);
      elements.push(node('br'), expenseText);
      if (yr.events.length) {
        const eventsNames = yr.events.map((e) => e.name).join(', ');
        elements.push(node('span', 'muted small', ` (${eventsNames})`));
      }
    }
    tooltip.replaceChildren(...elements);
  };

  svg.addEventListener('pointermove', (event) => {
    const bounds = svg.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * width;
    const relX = svgX - left;
    const idx = Math.floor(relX / slotWidth);
    select(idx);
  });

  svg.addEventListener('pointerleave', () => {
    indicator.setAttribute('opacity', '0');
  });

  svg.addEventListener('keydown', (event) => {
    const indices = {
      ArrowRight: selectedIndex + 1,
      ArrowLeft: selectedIndex - 1,
      Home: 0,
      End: years.length - 1,
    };
    if (Object.hasOwn(indices, event.key)) {
      event.preventDefault();
      select(indices[event.key]);
    }
  });

  select(0);

  const wrapper = node('div', 'yearly-chart-wrap');
  wrapper.append(instructions, svg, tooltip);
  return wrapper;
}

function renderYearlyTable(years, feasible) {
  const wrapper = node('div', 'table-scroll');
  const table = node('table');
  const caption = node('caption', 'sr-only', 'Jahresübersicht aller Sparraten, Zuführungen und Ausgaben');

  const head = node('thead');
  const header = node('tr');
  const headers = [
    { label: 'Jahr / Alter', align: 'left' },
    { label: 'Übrig vom Sparbudget', align: 'right' },
    { label: 'In Cash zurücklegen', align: 'right' },
    { label: 'Anteil frei', align: 'right' },
    { label: 'Geplante Ausgaben', align: 'right' },
    { label: 'Cash am Jahresende', align: 'right' },
  ];

  for (const h of headers) {
    const th = node('th', h.align === 'left' ? 'text-left' : '', h.label);
    th.scope = 'col';
    header.append(th);
  }
  head.append(header);

  const body = node('tbody');
  for (const yr of years) {
    const tr = node('tr');

    const yearAgeCell = node('td', 'month-age-cell');
    yearAgeCell.append(
      node('span', '', yr.year),
      node('span', 'muted', `Alter ${formatAge(yr.age)}`),
    );
    if (yr.events.length) {
      yearAgeCell.append(node('span', 'event-note', yr.events.map((e) => e.name).join(', ')));
    }

    const freeCell = node('td', feasible && yr.longTermCents > 0 ? 'cash-contribution' : '', feasible ? money(yr.longTermCents) : '–');
    const cashCell = node('td', '', money(yr.contributionCents));
    const ratioCell = node('td', '', feasible ? `${yr.freePercent} %` : '–');
    const expenseCell = node('td', yr.expenseCents > 0 ? 'expense-amount' : '', yr.expenseCents > 0 ? `- ${money(yr.expenseCents)}` : '–');
    const endCashCell = node('td', '', money(yr.endCashCents));

    tr.append(yearAgeCell, freeCell, cashCell, ratioCell, expenseCell, endCashCell);
    body.append(tr);
  }

  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

export function renderYearlyPlan(plan) {
  const summaryContainer = document.getElementById('yearly-summary');
  const chartContainer = document.getElementById('yearly-chart');
  const tableContainer = document.getElementById('yearly-table-container');
  const infeasibleNotice = document.getElementById('yearly-infeasible-notice');

  if (!summaryContainer || !chartContainer || !tableContainer) return;

  const years = aggregateYearlyData(plan.rows, plan.feasible);
  if (infeasibleNotice) {
    infeasibleNotice.hidden = true;
    infeasibleNotice.textContent = '';
  }

  if (!years.length) {
    summaryContainer.replaceChildren(node('p', 'muted', 'Keine Plandaten vorhanden.'));
    chartContainer.replaceChildren();
    tableContainer.replaceChildren();
    return;
  }

  if (infeasibleNotice && !plan.feasible) {
    infeasibleNotice.hidden = false;
    infeasibleNotice.textContent = 'Der Jahresverlauf zeigt eine rechnerische Vorschau mit voller monatlicher Zuführung ab dem nächsten Monat. Auch damit reicht der Plan unter den aktuellen Annahmen nicht für alle Ziele; die dargestellten Zuführungen sind kein finanzierbarer Sparplan.';
  }

  summaryContainer.replaceChildren(renderYearlySummary(years, plan.feasible));
  chartContainer.replaceChildren(renderYearlyChart(years, plan.feasible));
  tableContainer.replaceChildren(renderYearlyTable(years, plan.feasible));
}
