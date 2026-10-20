import { DEFAULT_INFLATION_BPS } from './import-export.js';

export function getSampleData(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDue = new Date(year, month + 1, 1);
  const firstDueMonth = `${firstDue.getFullYear()}-${String(firstDue.getMonth() + 1).padStart(2, '0')}`;
  const carDue = new Date(year + 6, month, 1);
  const carDueMonth = `${carDue.getFullYear()}-${String(carDue.getMonth() + 1).padStart(2, '0')}`;

  return {
    settings: {
      cashCents: 4_000_000,
      monthlyCents: 50_000,
      reserveCents: 0,
      currentAge: 35,
      horizonAge: 60,
      inflationBps: DEFAULT_INFLATION_BPS,
    },
    goals: [
      {
        id: 'sample-urlaub',
        name: 'Jährlicher Urlaub',
        amountCents: 500_000,
        type: 'annual',
        dueMonth: firstDueMonth,
        flexMonths: 0,
      },
      {
        id: 'sample-auto',
        name: 'Autokauf',
        amountCents: 4_000_000,
        type: 'once',
        dueMonth: carDueMonth,
        flexMonths: 6,
      },
    ],
    cashUpdatedAt: date.toISOString(),
  };
}
