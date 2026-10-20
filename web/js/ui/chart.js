import { formatAge, money, monthLabel, node } from './format.js';
const NS = 'http://www.w3.org/2000/svg';
function svgNode(tag, attributes = {}, text) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}
export function renderChart(plan) {
  const container = document.getElementById('chart');
  const rows = plan.rows;
  const width = 820; const height = 300;
  const left = 77; const right = 20; const top = 20; const bottom = 53;
  let minimum = 0; let maximum = 0;
  for (const row of rows) {
    minimum = Math.min(minimum, row.cashCents, row.reserveCents);
    maximum = Math.max(maximum, row.cashCents, row.requiredCents, row.reserveCents);
  }
  const range = Math.max(maximum - minimum, 10000);
  maximum += range * 0.08; minimum -= minimum < 0 ? range * 0.05 : 0;
  const x = (index) => left + index / Math.max(1, rows.length - 1) * (width - left - right);
  const y = (cents) => top + (maximum - cents) / (maximum - minimum) * (height - top - bottom);
  const svg = svgNode('svg', {viewBox: `0 0 ${width} ${height}`, role: 'img', tabindex: '0', 'aria-labelledby': 'cash-chart-title', 'aria-describedby': 'chart-instructions chart-tooltip'});
  svg.append(svgNode('title', {id: 'cash-chart-title'}, 'Cashbestand und erforderliche Liquidität nach Monat, Jahr und Alter'));
  const instructions = node('p', 'sr-only', 'Diagramm: Die waagerechte Achse zeigt Jahr und Alter. Mit Pfeiltasten einzelne Monate erkunden. Pos1 und Ende springen zum Anfang und Ende. Die Monatsvorschau steht als Tabelle unter dem Diagramm.');
  instructions.id = 'chart-instructions';
  for (let step = 0; step <= 4; step++) {
    const cents = minimum + (maximum - minimum) * step / 4;
    const lineY = y(cents);
    svg.append(svgNode('line', {x1:left, x2:width-right, y1:lineY, y2:lineY, class:'chart-grid'}));
    const label = new Intl.NumberFormat('de-DE', {maximumFractionDigits:0, notation: maximum > 100000000 ? 'compact' : 'standard'}).format(cents / 100);
    svg.append(svgNode('text', {x:left-10, y:lineY+4, 'text-anchor':'end', class:'chart-label'}, `${label} €`));
  }
  for (let step = 0; step <= 5; step++) {
    const index = Math.round((rows.length - 1) * step / 5);
    if (step && index === 0) continue;
    const tick = svgNode('text', {x:x(index), y:height-36, 'text-anchor':'middle', class:'chart-label'});
    tick.append(svgNode('tspan', {x:x(index), dy:0}, rows[index].month.slice(0, 4)));
    tick.append(svgNode('tspan', {x:x(index), dy:15}, `Alter ${formatAge(rows[index].age, { withUnit: false })}`));
    svg.append(tick);
  }
  const path = (key) => rows.map((row, index) => `${index ? 'L' : 'M'}${x(index).toFixed(2)},${y(row[key]).toFixed(2)}`).join(' ');
  const cashPath = path('cashCents');
  svg.append(svgNode('path', {d:`${cashPath} L${x(rows.length-1)},${y(0)} L${x(0)},${y(0)} Z`, class:'chart-fill'}));
  for (let index = 1; index < rows.length; index++) {
    if (rows[index].cashCents >= rows[index].reserveCents && rows[index-1].cashCents >= rows[index-1].reserveCents) continue;
    svg.append(svgNode('rect', {x:x(index-1), y:top, width:Math.max(1,x(index)-x(index-1)), height:height-top-bottom, fill:'#b43b3814'}));
  }
  svg.append(svgNode('path', {d:path('reserveCents'), class:'chart-reserve', fill:'none'}));
  svg.append(svgNode('path', {d:path('requiredCents'),class:'chart-required'}), svgNode('path', {d:cashPath,class:'chart-cash'}));
  for (const row of rows.filter((entry) => entry.events.length)) {
    const marker = svgNode('circle', {cx:x(row.index),cy:y(row.cashCents),r:3.3,fill:'#876846',stroke:'#fff','stroke-width':1});
    marker.append(svgNode('title', {}, `${monthLabel(row.month)}: ${row.events.map((event) => `${event.name}: ${money(event.amountCents)}`).join(', ')}`));
    svg.append(marker);
  }
  const indicator = svgNode('line', {y1:top,y2:height-bottom,stroke:'#82988d','stroke-dasharray':'3 3'});
  svg.append(indicator);
  const tooltip = node('div', 'chart-tooltip'); tooltip.id = 'chart-tooltip'; tooltip.setAttribute('aria-live','polite');
  let selected = -1;
  const select = (index) => {
    index = Math.max(0, Math.min(rows.length - 1, index));
    if (index === selected) return;
    selected = index;
    const row = rows[index];
    indicator.setAttribute('x1',x(index)); indicator.setAttribute('x2',x(index));
    const date = node('strong','',`${monthLabel(row.month)} · Alter ${formatAge(row.age, { withUnit: false })}`);
    const detailText = row.reserveCents > 0
      ? `Cash: ${money(row.cashCents)} · Erforderlich: ${money(row.requiredCents)} · Reserve: ${money(row.reserveCents)} · Ausgaben: ${money(row.expenseCents)}`
      : `Cash: ${money(row.cashCents)} · Erforderlich: ${money(row.requiredCents)} · Ausgaben: ${money(row.expenseCents)}`;
    const detail = node('span','',detailText);
    tooltip.replaceChildren(date,node('br'),detail);
    if (row.events.length) tooltip.append(node('br'),node('span','',row.events.map((event) => event.name).join(', ')));
  };
  svg.addEventListener('pointermove', (event) => {
    const bounds = svg.getBoundingClientRect();
    select(Math.round(((event.clientX - bounds.left) / bounds.width * width - left) / (width - left - right) * (rows.length - 1)));
  });
  svg.addEventListener('keydown', (event) => {
    const indices = {ArrowRight:selected+1,ArrowLeft:selected-1,Home:0,End:rows.length-1,ArrowUp:selected+12,ArrowDown:selected-12};
    if (Object.hasOwn(indices,event.key)) {event.preventDefault();select(indices[event.key]);}
  });
  select(0);
  container.replaceChildren(instructions,svg,tooltip);
}
