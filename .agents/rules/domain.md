# Fachliche Invarianten

- Ein einziger gemeinsamer Cashbestand; keine Spartöpfe.
- Geldbeträge werden ausschließlich als sichere ganzzahlige Centwerte gerechnet. Gleiche Eingaben ergeben gleiche Ergebnisse.
- Keine Einnahmen, Zinsen, Inflation oder Depotentnahmen erfinden; keine Ausgabe stillschweigend auslassen.
- Termine und jährliche Wiederholungen chronologisch und innerhalb des Horizonts berücksichtigen. Vergangene Termine gelten ohne Zahlungsstatus als offen: eine Ausgabe sofort, künftige Jahresfälligkeiten im ursprünglichen Kalendermonat. Eine Verschiebung ist nur in gekennzeichneten Alternativplänen zulässig und darf keine Ausgabe verschwinden lassen.
- Der Wunschtermin bleibt im normalen Plan erhalten.
- Die Mindestreserve darf in einem als finanzierbar ausgewiesenen Plan niemals unterschritten werden; monatliche Cash-Zuführungen dürfen `monthlyCents` nie überschreiten.
- Ein nicht finanzierbarer Verlauf darf nicht als gültiger Sparplan erscheinen.
- Rückwärtsrechnung: Für Horizont `H`, Reserve `R[t]` (bei Inflation aufgezinst), Monatsausgaben `E[t]` und monatlich verfügbar `M` gilt `F[H] = R[H]`, `F[t-1] = max(R[t-1], F[t] + E[t] - M)` für `t = H…1`. Heute nötig sind `E[0] + F[0]`.
- Änderungen an der Berechnung brauchen passende Tests und eine Aktualisierung von `docs/ALGORITHM.md`.
