import { formatEuro, parseEuro } from '../domain/money.js';
const numbers = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = formatEuro;
export const editableMoney = (cents) => numbers.format(cents / 100);
export const parseMoney = parseEuro;
export function monthLabel(month) {
  const [year, value] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, value - 1, 1)));
}
export function formatAge(age, { withUnit = true } = {}) {
  const rounded = Math.round(age);
  if (rounded < 0) return 'vor Geburt';
  if (!withUnit) return String(rounded);
  return rounded === 1 ? '1 Jahr' : `${rounded} Jahre`;
}
export function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
