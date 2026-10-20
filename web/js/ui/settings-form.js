import { editableMoney, parseMoney } from './format.js';
const moneyFields = ['cashCents', 'monthlyCents', 'reserveCents'];
export function fillSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    const field = document.getElementById(key);
    if (field) field.value = moneyFields.includes(key) ? editableMoney(value) : value;
  }
}
export function bindSettings(onChange, onConfirm) {
  const form = document.getElementById('settings-form');
  const error = document.getElementById('settings-error');
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', (event) => {
    const settings = {};
    let invalid = false;
    for (const field of form.querySelectorAll('input')) {
      try {
        const value = moneyFields.includes(field.name) ? parseMoney(field.value) : Number(field.value);
        if (!moneyFields.includes(field.name) && (!field.value || !Number.isInteger(value) || value < 0 || value > 120)) throw new Error('Bitte gib ein ganzzahliges Alter zwischen 0 und 120 ein.');
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
  for (const field of form.querySelectorAll('input')) field.setAttribute('aria-describedby', field.id === 'cashCents' ? 'cash-help settings-error' : 'settings-error');
  for (const key of moneyFields) {
    const field = document.getElementById(key);
    field.addEventListener('blur', () => {
      try { field.value = editableMoney(parseMoney(field.value)); } catch { /* Keep invalid input available for correction. */ }
    });
  }
  document.getElementById('confirm-cash').addEventListener('click', () => {
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid) {
      error.textContent = 'Bitte korrigiere zuerst die markierten Eingaben, bevor du den Cashbestand bestätigst.';
      invalid.focus();
      return;
    }
    onConfirm();
  });
}
