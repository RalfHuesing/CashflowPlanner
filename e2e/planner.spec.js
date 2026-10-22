import { expect, test } from '@playwright/test';

function monthFromNow(offset) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function addGoal(page, { name, amount = '1.234,56', dueMonth = monthFromNow(3) }) {
  await page.getByRole('link', { name: /Ziele/ }).click();
  await page.getByRole('button', { name: '+ Ziel hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Neues Ziel' });
  await page.getByLabel('Bezeichnung').fill(name);
  await page.getByLabel('Betrag in Euro (heutiger Wert)').fill(amount);
  await page.getByLabel('Erste Fälligkeit').fill(dueMonth);
  await dialog.getByRole('button', { name: 'Ziel speichern' }).click();
  await expect(dialog).toBeHidden();
}

test('adding a goal updates the plan and survives a reload', async ({ page }) => {
  await page.goto('/#uebersicht');
  const requiredCash = page.locator('#summary .metric').filter({ hasText: 'Rechnerisch benötigtes Startkapital' }).locator('.metric-value');
  const initial = await requiredCash.textContent();

  await addGoal(page, { name: 'E2E Urlaub' });

  await expect(requiredCash).not.toHaveText(initial ?? '');
  await expect(page.getByRole('status').filter({ hasText: 'Ziel gespeichert.' })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: /Ziele/ }).click();
  await expect(page.getByRole('heading', { name: 'E2E Urlaub' })).toBeVisible();
  await expect(page.locator('#goal-count')).toHaveText('1');
});

test('export, change and confirmed import restore the saved plan', async ({ page }) => {
  await page.goto('/#uebersicht');
  await page.getByLabel('Aktueller Cashbestand').fill('2.500,00');
  await page.getByLabel('Monatliches Sparbudget').fill('700,00');
  await page.getByLabel('Mindestreserve').fill('400,00');
  await addGoal(page, { name: 'E2E Rücklage', amount: '3.210,00', dueMonth: monthFromNow(5) });
  await page.getByRole('link', { name: 'Übersicht' }).click();
  const savedSettings = await Promise.all(['cashCents', 'monthlyCents', 'reserveCents'].map(async (id) => page.locator(`#${id}`).inputValue()));

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportieren' }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  await page.getByLabel('Aktueller Cashbestand').fill('99,00');
  await page.getByLabel('Monatliches Sparbudget').fill('99,00');
  await page.getByLabel('Mindestreserve').fill('99,00');
  await page.getByRole('button', { name: 'Importieren' }).click();
  await page.locator('#import-file').setInputFiles(filePath);
  await page.getByRole('dialog', { name: 'Planung ersetzen?' }).getByRole('button', { name: 'Planung ersetzen' }).click();

  expect(await Promise.all(['cashCents', 'monthlyCents', 'reserveCents'].map(async (id) => page.locator(`#${id}`).inputValue()))).toEqual(savedSettings);
  await page.getByRole('link', { name: /Ziele/ }).click();
  await expect(page.getByRole('heading', { name: 'E2E Rücklage' })).toBeVisible();
});

test('goal dialog opens with focus and Escape returns focus to its opener', async ({ page }) => {
  await page.goto('/#ziele');
  const opener = page.getByRole('button', { name: '+ Ziel hinzufügen' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Neues Ziel' });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Bezeichnung')).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('deleting the plan requires confirmation and preserves unrelated browser data', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unrelated.app.data', 'keep'));
  await page.goto('/#ziele');
  await addGoal(page, { name: 'Delete me' });
  await page.getByRole('button', { name: 'Planung löschen' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Planung löschen?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(page.locator('#goal-count')).toHaveText('1');
  expect(await page.evaluate(() => localStorage.getItem('cashflow-planner.data'))).toBeTruthy();

  await page.getByRole('button', { name: 'Planung löschen' }).click();
  await page.getByRole('dialog', { name: 'Planung löschen?' }).getByRole('button', { name: 'Planung löschen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Die Planung wurde gelöscht.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cashflow-planner.data'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated.app.data'))).toBe('keep');
});

test('reviewing a stale cash balance keeps its amount and persists the review', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('cashflow-planner.data')) return;
    const previousMonth = new Date();
    previousMonth.setDate(1);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    previousMonth.setHours(12, 0, 0, 0);
    localStorage.setItem('cashflow-planner.data', JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      data: {
        settings: { cashCents: 12345, monthlyCents: 0, reserveCents: 0, currentAge: 30, horizonAge: 90, inflationBps: 200 },
        goals: [],
        cashUpdatedAt: previousMonth.toISOString(),
      },
    }));
  });
  await page.goto('/#uebersicht');
  const cash = page.getByLabel('Aktueller Cashbestand');
  const amountBefore = await cash.inputValue();
  const notice = page.locator('#stale-notice');
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Cashbestand stimmt' }).click();
  await expect(notice).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Cashbestand als aktuell bestätigt.' })).toBeVisible();
  await expect(cash).toHaveValue(amountBefore);
  await page.reload();
  await expect(page.locator('#stale-notice')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cashflow-planner.data')).data.settings.cashCents)).toBe(12345);
});

test('print media exposes planning views and hides screen navigation', async ({ page }) => {
  await page.goto('/#start');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.app-header')).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeHidden();
  await expect(page.locator('#overview-view')).toBeVisible();
  await expect(page.locator('#yearly-view')).toBeVisible();
  await expect(page.locator('#goals-view')).toBeVisible();
});

test('print preparation includes every goal even when the on-screen list is filtered', async ({ page }) => {
  const goals = Array.from({ length: 13 }, (_, index) => ({
    id: `goal-${index + 1}`,
    name: `Print goal ${index + 1}`,
    amountCents: (index + 1) * 10000,
    type: 'once',
    dueMonth: monthFromNow(2),
    flexMonths: 0,
    endMonth: null,
  }));
  await page.addInitScript((savedGoals) => localStorage.setItem('cashflow-planner.data', JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    data: {
      settings: { cashCents: 0, monthlyCents: 0, reserveCents: 0, currentAge: 30, horizonAge: 90, inflationBps: 200 },
      goals: savedGoals,
      cashUpdatedAt: null,
    },
  })), goals);
  await page.goto('/#ziele');
  await page.getByLabel('Ziele suchen').fill('Print goal 1');
  await expect(page.locator('#goal-list article')).toHaveCount(5);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('.print-goals-list article')).toHaveCount(13);
});
