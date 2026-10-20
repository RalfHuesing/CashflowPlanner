import { editableMoney, parseMoney } from './format.js';
const moneyFields = ['cashCents', 'monthlyCents', 'reserveCents'];
function editableInflation(basisPoints) {
  const whole = Math.floor(basisPoints / 100);
  const fraction = String(basisPoints % 100).padStart(2, '0').replace(/0+$/, '');
  return fraction ? `${whole},${fraction}` : String(whole);
}
function parseInflation(value) {
  const normalized = value.trim().replace(/\s*%$/, '').trim();
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(normalized);
  if (!match) throw new Error('Bitte gib eine jährliche Inflation zwischen 0 und 100 % mit höchstens zwei Nachkommastellen ein.');
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  const basisPoints = whole * 100 + fraction;
  if (basisPoints > 10000) throw new Error('Die jährliche Inflation darf höchstens 100 % betragen.');
  return basisPoints;
}
export function fillSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    const field = document.getElementById(key);
    if (field) field.value = moneyFields.includes(key) ? editableMoney(value) : key === 'inflationBps' ? editableInflation(value) : value;
  }
}
export function bindSettings(onChange) {
  const form = document.getElementById('settings-form');
  const error = document.getElementById('settings-error');
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', (event) => {
    const settings = {};
    let invalid = false;
    for (const field of form.querySelectorAll('input')) {
      try {
        let value;
        if (moneyFields.includes(field.name)) value = parseMoney(field.value);
        else if (field.name === 'inflationBps') value = parseInflation(field.value);
        else {
          value = Number(field.value);
          if (!field.value || !Number.isInteger(value) || value < 0 || value > 120) throw new Error('Bitte gib ein ganzzahliges Alter zwischen 0 und 120 ein.');
        }
        settings[field.name] = value;
        field.removeAttribute('aria-invalid');
      } catch (problem) {
        field.setAttribute('aria-invalid', 'true');
        if (!invalid) error.textContent = problem.message;
        invalid = true;
      }
    }
    if (!invalid && settings.horizonAge < settings.currentAge) {
      error.textContent = 'Das Planungsalter darf nicht vor deinem aktuellen Alter liegen.';
      document.getElementById('horizonAge').setAttribute('aria-invalid', 'true');
      invalid = true;
    }
    if (!invalid) {
      error.textContent = '';
      onChange(settings, event.target.name === 'cashCents');
    }
  });
  for (const field of form.querySelectorAll('input')) {
    const helpId = field.id === 'cashCents' ? 'cash-help' : field.id === 'inflationBps' ? 'inflation-help' : null;
    field.setAttribute('aria-describedby', helpId ? `${helpId} settings-error` : 'settings-error');
  }
  for (const key of moneyFields) {
    const field = document.getElementById(key);
    field.addEventListener('blur', () => {
      try { field.value = editableMoney(parseMoney(field.value)); } catch { /* Keep invalid input available for correction. */ }
    });
  }
  const inflationField = document.getElementById('inflationBps');
  inflationField.addEventListener('blur', () => {
    try { inflationField.value = editableInflation(parseInflation(inflationField.value)); } catch { /* Keep invalid input available for correction. */ }
  });
}
