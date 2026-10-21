import test from 'node:test';
import assert from 'node:assert/strict';
import { selectGoals } from '../web/js/ui/goals-form.js';

function goals(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `goal-${index + 1}`,
    name: `Ziel ${index + 1}`,
    amountCents: (index + 1) * 100,
    dueMonth: `2027-${String(index % 12 + 1).padStart(2, '0')}`,
  }));
}

test('Zielliste bleibt bis einschließlich zwölf sichtbarer Ziele auf einer Seite', () => {
  for (const count of [0, 1, 12]) {
    const selection = selectGoals(goals(count));
    assert.equal(selection.total, count);
    assert.equal(selection.pageCount, 1);
    assert.equal(selection.page, 1);
    assert.equal(selection.goals.length, count);
  }
});

test('Zielliste teilt dreizehn sichtbare Ziele auf zwei Seiten und begrenzt die Seite', () => {
  const selection = selectGoals(goals(13), { page: 3 });
  assert.equal(selection.total, 13);
  assert.equal(selection.pageCount, 2);
  assert.equal(selection.page, 2);
  assert.equal(selection.goals.length, 1);
});

test('Suchfilter bestimmt die Seitenzahl aus den Treffern', () => {
  const items = [...goals(13), { id: 'match-1', name: 'Urlaub', amountCents: 100, dueMonth: '2027-01' }, { id: 'match-2', name: 'Urlaub zuhause', amountCents: 200, dueMonth: '2027-02' }];
  const selection = selectGoals(items, { query: 'urlaub' });
  assert.equal(selection.total, 2);
  assert.equal(selection.pageCount, 1);
  assert.deepEqual(selection.goals.map((goal) => goal.name), ['Urlaub', 'Urlaub zuhause']);
});
