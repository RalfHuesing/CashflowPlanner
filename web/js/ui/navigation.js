const views = {
  start: { id: 'start', title: 'Cashflow planen, Ziele im Blick behalten', description: 'Plane, wie viel Cash du für kommende Ausgaben brauchst – und was von deinem Monatsbudget übrig bleibt.' },
  uebersicht: { id: 'overview', title: 'Deine Übersicht', description: 'Dein aktueller Bestand, die Ausgaben dieses Monats und die Tragfähigkeit deiner Ziele.' },
  ziele: { id: 'goals', title: 'Deine finanziellen Ziele', description: 'Plane große Wünsche und regelmäßige Ausgaben an einem Ort.' },
  zeitplan: { id: 'timeline', title: 'Dein Zeitplan', description: 'Sieh, wann du Cash zurücklegen musst und wie sich dein Bestand entwickelt.' },
  jahresplan: { id: 'yearly', title: 'Dein Jahresplan', description: 'Wieviel Cash du für Ausgaben zurücklegst und wieviel für langfristige Anlagen übrig bleibt.' },
  monatsplan: { id: 'monthly', title: 'Dein Monatsplan', description: 'Monatsgenauer Verlauf aller Ausgaben, Cash-Zuführungen und Endstände bis zum Planungsende.' },
};

export function bindNavigation() {
  const showView = (moveFocus) => {
    const key = window.location.hash.slice(1);
    const view = views[key] ?? views.start;
    for (const panel of document.querySelectorAll('.app-view')) {
      panel.hidden = panel.id !== `${view.id}-view`;
    }
    for (const link of document.querySelectorAll('.primary-nav a')) {
      if (link.dataset.view === view.id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const title = document.getElementById('page-title');
    title.textContent = view.title;
    document.getElementById('page-description').textContent = view.description;
    document.title = view.id === 'start'
      ? 'Liquiditätsplaner für private Ausgaben | Cashflow-Planner'
      : `${view.title} · Cashflow-Planner`;
    if (moveFocus) {
      title.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };
  window.addEventListener('hashchange', () => showView(true));
  showView(false);
}
