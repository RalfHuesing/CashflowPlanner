import { DEFAULT_INFLATION_BPS } from './import-export.js';
import { addMonths, currentMonth } from '../domain/calendar.js';

export function getSampleData(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  const startMonth = currentMonth(date);

  return {
    settings: {
      cashCents: 800_000,
      monthlyCents: 120_000,
      reserveCents: 600_000,
      currentAge: 35,
      horizonAge: 50,
      inflationBps: DEFAULT_INFLATION_BPS,
    },
    goals: [
      {
        id: 'sample-urlaub',
        name: 'Jährlicher Urlaub',
        amountCents: 300_000,
        type: 'annual',
        dueMonth: addMonths(startMonth, 8),
        endMonth: null,
        flexMonths: 0,
      },
      {
        id: 'sample-kueche',
        name: 'Neue Küche',
        amountCents: 1_200_000,
        type: 'once',
        dueMonth: addMonths(startMonth, 36),
        endMonth: null,
        flexMonths: 0,
      },
      {
        id: 'sample-auto',
        name: 'Nächstes Auto',
        amountCents: 2_500_000,
        type: 'once',
        dueMonth: addMonths(startMonth, 84),
        endMonth: null,
        flexMonths: 0,
      },
    ],
    cashUpdatedAt: date.toISOString(),
  };
}
