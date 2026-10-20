import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildScenarios } from '../web/js/domain/scenarios.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixturePath = resolve(root, 'tests/fixtures/scenarios.json');
export const examplesPath = resolve(root, 'docs/EXAMPLES.md');
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const money = cents => euro.format(cents / 100);

export async function generateExamples() {
  const fixtures = JSON.parse(await readFile(fixturePath, 'utf8'));
  const lines = [
    '# Beispielszenarien',
    '',
    'Automatisch aus `tests/fixtures/scenarios.json` und dem aktuellen Berechnungskern erzeugt. Nicht manuell bearbeiten.',
    ''
  ];
  for (const fixture of fixtures) {
    const result = buildScenarios(fixture.settings, fixture.goals, fixture.startMonth).keep;
    lines.push(`## ${fixture.name}`, '');
    lines.push(`Startmonat: ${fixture.startMonth}; Alter: ${fixture.settings.currentAge} bis ${fixture.settings.horizonAge} Jahre.`, '');
    lines.push(`Cash heute: ${money(fixture.settings.cashCents)}; monatlich verfügbar: ${money(fixture.settings.monthlyCents)}; Mindestreserve: ${money(fixture.settings.reserveCents)}.`, '');
    lines.push('| Ziel | Betrag | Erster Termin | Wiederholung | Spielraum |', '|---|---:|---|---|---:|');
    for (const goal of fixture.goals) {
      lines.push(`| ${goal.name} | ${money(goal.amountCents)} | ${goal.dueMonth} | ${goal.type === 'annual' ? 'jährlich' : 'einmalig'} | ± ${goal.flexMonths} Monate |`);
    }
    lines.push('', `Erforderlicher Cashbestand heute: **${money(result.requiredTodayCents)}**. Finanzierungslücke: **${money(result.gapCents)}**. Rechnerisch freigebbar: **${money(result.releasableCents)}**. Plan: **${result.feasible ? 'finanzierbar' : 'nicht finanzierbar'}**.`, '');
    if (result.firstCriticalMonth) lines.push(`Erster kritischer Monat im Maximalzuführungsverlauf: ${result.firstCriticalMonth}.`, '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeFile(examplesPath, await generateExamples(), 'utf8');
  process.stdout.write('docs/EXAMPLES.md aktualisiert.\n');
}
