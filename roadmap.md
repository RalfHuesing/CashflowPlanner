# Roadmap: gezielte UX-Verbesserungen

Diese Roadmap beschreibt ausschließlich die folgenden, bewusst kleinen Verbesserungen. Die sechs getrennten Ansichten und der fachliche Berechnungskern bleiben erhalten. Jeder Hauptpunkt wird erst nach Umsetzung aller darunter genannten Anforderungen und Prüfungen von `[ ]` auf `[x]` gesetzt.

## Verbindlicher Umfang

- Keine Ansichten zu einem Cockpit oder zu einer Single-Page-Ansicht zusammenführen.
- Keine Zinsen, Renditen, Steuern, Einkommenssteigerungen oder automatische Dynamisierung des monatlichen Sparbudgets ergänzen.
- Keine Aktiv-/Pausiert-Schalter, Alternativpläne oder sonstige Szenariofunktion ergänzen.
- Keine Berechnungsformel und kein Datenformat ändern. `docs/ALGORITHM.md` und `docs/DATA_FORMAT.md` bleiben unverändert.
- Keine neue Laufzeit- oder Entwicklungsabhängigkeit hinzufügen.
- Alle neuen UI-Texte bleiben deutsch. Vorhandene sichere DOM-Erzeugung mit `textContent`, `replaceChildren` und `node(...)` beibehalten; kein `innerHTML` verwenden.

## Umsetzung

- [ ] **1. Kennzahlen der Übersicht eindeutig und handlungsnah formulieren**

  Betroffene Dateien: `web/js/ui/summary.js`, `tests/summary.test.js` (neu), `docs/PRODUCT.md`.

  Umsetzung:

  1. In `web/js/ui/summary.js` eine exportierte pure Funktion `buildSummaryModel(plan, settings)` anlegen. Sie liefert die sechs anzuzeigenden Kennzahlen und den Erklärungstext als Datenstruktur. `renderSummary(plan, settings)` verwendet ausschließlich dieses Modell für die DOM-Ausgabe. Die vorhandene Status-Badge-Logik darf in `renderSummary` bleiben.
  2. Die Reihenfolge der sechs Kennzahlen bleibt:
     1. Nächsten Monat für Cash zurücklegen
     2. Nächsten Monat für langfristige Anlagen verfügbar
     3. Dein aktueller Cashbestand
     4. Ausgaben im aktuellen Monat
     5. heutiger Überschuss oder Fehlbetrag
     6. rechnerisch benötigtes Startkapital
  3. Die Kennzahl `Heute nötiger Cashbestand` in `Rechnerisch benötigtes Startkapital` umbenennen.
  4. Als Detailtext dieser Kennzahl exakt folgendes Muster verwenden: `Für alle Ziele bis <Monat Jahr> bei <Betrag> monatlichem Sparbudget`. `<Monat Jahr>` ist `plan.horizonMonth` über `monthLabel(...)`; `<Betrag>` ist `settings.monthlyCents` über `money(...)`.
  5. Die fünfte Kennzahl abhängig vom Plan darstellen:
     - Bei `plan.feasible === true`: Label `Für den Plan heute nicht benötigt`, Wert `money(plan.releasableCents)`. Bei einem Wert größer als null erhält die Karte den vorhandenen Stil `positive`. Detailtext bei einem Wert größer als null: `Differenz zwischen aktuellem Cashbestand und rechnerisch benötigtem Startkapital`. Detailtext bei null: `Der aktuelle Cashbestand entspricht dem rechnerisch benötigten Startkapital`.
     - Bei `plan.feasible === false`: Label `Fehlender Cashbestand`, Wert `money(plan.gapCents)`, Stil `negative`. Detailtext: `Erster Engpass: <Monat Jahr>`, sofern `plan.firstCriticalMonth` vorhanden ist; andernfalls `Innerhalb des Planungshorizonts`.
  6. Beim finanzierbaren Plan den vorhandenen Erklärungstext beibehalten und bei `plan.releasableCents > 0` exakt diesen Satz anhängen: `Von deinem heutigen Cashbestand werden <Betrag> unter diesen Annahmen nicht für den Plan benötigt.` Das Wort `investieren` und eine Anlageempfehlung dürfen an dieser Stelle nicht verwendet werden.
  7. Beim nicht finanzierbaren Plan den ersten Engpass vollständig erklären:
     - Die Zeile des Engpassmonats aus `plan.rows` anhand von `plan.firstCriticalMonth` bestimmen.
     - Den Fehlbetrag dieses Monats als `max(0, row.reserveCents - row.cashCents)` berechnen. Dieser Monatsfehlbetrag ist nicht durch `plan.gapCents` zu ersetzen.
     - Wenn `plan.criticalEvents` nicht leer ist, an den vorhandenen Erklärungstext anhängen: `Im <Monat Jahr> sind <Zielname> (<Betrag>)<weitere Ziele im gleichen Format> fällig. Nach diesen Ausgaben liegt der Bestand <Monatsfehlbetrag> unter der Mindestreserve.` Namen und inflationsberechnete Beträge stammen aus `plan.criticalEvents`; mehrere Ziele werden mit Komma getrennt.
     - Wenn `plan.criticalEvents` leer ist, anhängen: `Im ersten Engpassmonat <Monat Jahr> fällt keine Zielausgabe an; Auslöser ist die steigende Mindestreserve. Der Bestand liegt <Monatsfehlbetrag> unter der Mindestreserve.`
     - Den bisherigen Satz, der das rechnerisch benötigte Startkapital als „keine Empfehlung“ bezeichnet, entfernen. Der allgemeine Hinweis, dass es sich um eine Modellrechnung und nicht um Anlageberatung handelt, bleibt im Footer.
  8. In `docs/PRODUCT.md` dokumentieren, dass die Übersicht bei einem finanzierbaren Plan den heute nicht benötigten Modellüberschuss und bei einem nicht finanzierbaren Plan den ersten Engpass einschließlich der dort fälligen Ziele ausweist.

  Tests und Abnahme:

  - `tests/summary.test.js` testet `buildSummaryModel(...)` ohne Browser-DOM.
  - Testfall finanzierbar mit positivem `releasableCents`: Label, Wert, positiver Stil, neues Startkapital-Label und angehängter Erklärungssatz stimmen exakt.
  - Testfall finanzierbar mit `releasableCents === 0`: neutraler Stil und Null-Detailtext stimmen exakt.
  - Testfall nicht finanzierbar mit einem kritischen Ziel: Engpassmonat, Zielname, inflationsberechneter Zielbetrag und Monatsfehlbetrag stehen im Erklärungstext.
  - Testfall nicht finanzierbar nur wegen der Mindestreserve: Der Text nennt ausdrücklich die steigende Mindestreserve und keinen Zielnamen.

- [ ] **2. Leere Planung in der Übersicht direkt zur ersten Zielanlage führen**

  Betroffene Dateien: `web/index.html`, `web/js/main.js`, `web/css/views.css`, `docs/PRODUCT.md`.

  Umsetzung:

  1. In `#overview-view` unmittelbar vor `.overview-layout` einen zunächst versteckten Hinweis mit der ID `no-goals-notice` ergänzen.
  2. Der Hinweis enthält exakt den Text `Du hast noch keine Ziele angelegt. Lege dein erstes Ziel an, damit der Planer künftige Ausgaben berücksichtigen kann.` und einen Button mit der ID `overview-add-goal`, dem Text `Erstes Ziel anlegen`, `type="button"` und den Klassen `button primary`.
  3. Der Button öffnet über die bereits von `bindGoalForm(...)` zurückgegebene Funktion `openGoal()` direkt den vorhandenen Dialog zur Zielanlage. Es findet kein vorheriger Wechsel in die Zielansicht statt.
  4. `render()` setzt `no-goals-notice.hidden` genau dann auf `false`, wenn `data.goals.length === 0`; ab dem ersten gespeicherten oder importierten Ziel ist der Hinweis verborgen. Nach dem Löschen des letzten Ziels erscheint er wieder.
  5. In `web/css/views.css` den Hinweis auf breiten Ansichten als flexible Zeile mit Text links und Button rechts darstellen. Unter `760px` stehen Text und Button untereinander; der Button wird nicht auf volle Breite gezwungen.
  6. In `docs/PRODUCT.md` ergänzen, dass eine leere Übersicht eine direkte Aktion zum Anlegen des ersten Ziels anbietet.

  Abnahme:

  - Bei null Zielen ist der Hinweis sichtbar und der Button öffnet den bestehenden Dialog mit dem Fokus im Feld `Bezeichnung`.
  - Nach dem Speichern des ersten Ziels verschwindet der Hinweis ohne Neuladen.
  - Nach dem Löschen des letzten Ziels erscheint der Hinweis wieder.
  - Bei importierten oder geladenen Beispieldaten mit Zielen ist der Hinweis nicht sichtbar.

- [ ] **3. Monatsbudget und lokale Speicherung klarer beschriften**

  Betroffene Dateien: `web/index.html`, `docs/PRODUCT.md`.

  Umsetzung:

  1. Das Label des Feldes `monthlyCents` von `Monatlich verfügbar` in `Monatliches Sparbudget` ändern.
  2. Den Hilfetext darunter exakt ersetzen durch: `Alles, was nach laufenden Ausgaben monatlich für geplante Ausgaben und langfristige Anlagen zusammen verfügbar ist. Der Betrag bleibt in der Rechnung nominal gleich.`
  3. Alle Ergebnisformulierungen, die sich direkt auf `settings.monthlyCents` beziehen, verwenden anschließend den Begriff `monatliches Sparbudget` oder `Sparbudget`; fachlich anders gemeinte Vorkommen wie `Cash-Zuführung` bleiben unverändert.
  4. Den Footer-Absatz exakt ersetzen durch: `Die Ergebnisse sind Modellrechnungen auf Grundlage deiner Angaben und keine individuelle Anlageberatung. Die Anwendung überträgt keine Finanzdaten an einen Server. Die Planung bleibt lokal in diesem Browserprofil. Auf gemeinsam genutzten Geräten können andere Nutzer dieses Browserprofils darauf zugreifen. Beim Löschen der Browserdaten kann die Planung verloren gehen; sichere sie regelmäßig über „Exportieren“.`
  5. In `docs/PRODUCT.md` bei der ersten Beschreibung des monatlich verfügbaren Betrags klarstellen, dass dies das gemeinsame Sparbudget für geplante Ausgaben und langfristige Anlagen ist. Die fachliche Aussage, dass es nominal konstant bleibt, unverändert lassen.

  Abnahme:

  - Direkt am Eingabefeld ist ohne Rückgriff auf die Startseite erkennbar, dass bestehende langfristige Sparraten nicht vorher abzuziehen sind.
  - Der Footer erklärt lokale Speicherung konkret über das Browserprofil und enthält nicht mehr den Satz `Lokale Daten sind nicht automatisch verschlüsselt.`
  - Es entsteht keine Aussage, dass lokale Daten gegen andere Nutzer desselben Browserprofils geschützt seien.

- [ ] **4. Seitennavigation der Zielliste nur bei echtem Seitenwechsel anzeigen**

  Betroffene Dateien: `web/js/ui/goals-form.js`, `tests/goals-form.test.js` (neu).

  Umsetzung:

  1. Suche, Sortierung und `GOALS_PER_PAGE = 12` unverändert beibehalten.
  2. In `renderGoals(...)` die vorhandene Navigation `.goal-pagination` ausblenden, wenn `selection.pageCount <= 1`, und anzeigen, wenn `selection.pageCount > 1`.
  3. Zum Ausblenden ausschließlich das native `hidden`-Attribut verwenden. Die globale vorhandene `[hidden]`-Regel bleibt zuständig; keine zusätzliche CSS-Klasse ergänzen.
  4. Die Seitennavigation richtet sich nach dem gefilterten Ergebnis: Reduziert eine Suche beispielsweise 13 Gesamtziele auf 2 Treffer, wird die Navigation ausgeblendet. Nach Leeren der Suche erscheint sie wieder.
  5. Die bestehende Begrenzung von `listState.page` auf eine gültige Seite und der Fokuswechsel nach einem Seitenwechsel bleiben erhalten.

  Tests und Abnahme:

  - `tests/goals-form.test.js` testet die pure Funktion `selectGoals(...)` mit 0, 1, 12 und 13 Zielen sowie mit einem Suchfilter.
  - 0 bis 12 sichtbare Ziele ergeben `pageCount === 1`; 13 sichtbare Ziele ergeben `pageCount === 2`.
  - Im Browser sind bei einer Seite weder die deaktivierten Pfeile noch `Seite 1 von 1` sichtbar.
  - Bei zwei Seiten funktionieren Vor, Zurück, Seitenanzeige und Fokusführung unverändert.

- [ ] **5. Hauptnavigation auf schmalen Bildschirmen vollständig sichtbar machen**

  Betroffene Dateien: `web/css/base.css`, `web/css/views.css`.

  Umsetzung:

  1. Desktop-Verhalten oberhalb von `760px` unverändert lassen: horizontale, sticky Navigation mit allen sechs Ansichten.
  2. Im bestehenden Breakpoint `@media (max-width: 760px)` `.primary-nav` als Raster mit exakt drei gleich breiten Spalten und zwei Zeilen darstellen: `display: grid`, `grid-template-columns: repeat(3, minmax(0, 1fr))`, `position: static`, `overflow: visible`, `padding: 0 8px` und `gap: 0`.
  3. Die Reihenfolge bleibt `Start`, `Übersicht`, `Ziele`, `Zeitplan`, `Jahresplan`, `Monatsplan`.
  4. Die Links im mobilen Raster zentrieren, mit `min-width: 0`, `padding: 12px 6px 10px`, `font-size: .78rem` und `white-space: nowrap` darstellen.
  5. Unter `760px` nur das jeweils erste, dekorative Icon-`span` jedes Navigationslinks ausblenden. Der Zielzähler `#nav-goal-count` bleibt sichtbar.
  6. Weil die mobile Hauptnavigation nicht mehr sticky ist, im mobilen Breakpoint von `web/css/views.css` für `.goals-toolbar` `top: 0` setzen. Die Toolbar selbst bleibt sticky.
  7. Keine Menüs, Dropdowns oder JavaScript-Zustände für die mobile Navigation einführen.

  Abnahme:

  - Bei Viewportbreiten 320px, 375px, 531px und 760px sind alle sechs Navigationsziele gleichzeitig sichtbar und per Tastatur erreichbar.
  - Die Hauptnavigation erzeugt keine horizontale Scrollleiste.
  - `document.documentElement.scrollWidth === document.documentElement.clientWidth` gilt auf Start, Übersicht, Ziele und Zeitplan. Breite Tabellen in Jahres- und Monatsplan scrollen ausschließlich innerhalb ihres vorhandenen `.table-scroll`-Containers und verbreitern nicht die gesamte Seite.
  - Aktiver Tab, Hover- und Fokuszustände bleiben eindeutig sichtbar.
  - Oberhalb von 760px bleibt das bisherige Layout unverändert.

- [ ] **6. Beispieldaten durch einen realistischen, finanzierbaren Demonstrationsplan ersetzen**

  Betroffene Dateien: `web/js/data/sample-data.js`, `tests/storage.test.js`, bei Bedarf `docs/PRODUCT.md` nur zur Beschreibung des Beispiels.

  Umsetzung:

  1. In `web/js/data/sample-data.js` `currentMonth` und `addMonths` aus `web/js/domain/calendar.js` verwenden. Keine eigenen `Date`-Berechnungen für Fälligkeitsmonate beibehalten.
  2. `getSampleData(now)` verwendet weiterhin den übergebenen Zeitpunkt für `cashUpdatedAt`. Der Startmonat ist `currentMonth(now)`.
  3. Die Einstellungen exakt setzen auf:
     - `cashCents: 800_000` (8.000 €)
     - `monthlyCents: 120_000` (1.200 €)
     - `reserveCents: 600_000` (6.000 €)
     - `currentAge: 35`
     - `horizonAge: 50`
     - `inflationBps: DEFAULT_INFLATION_BPS` (2 %)
  4. Exakt diese drei Ziele in dieser Reihenfolge erzeugen:
     - `id: "sample-urlaub"`, `name: "Jährlicher Urlaub"`, `amountCents: 300_000`, `type: "annual"`, `dueMonth: addMonths(startMonth, 8)`, `endMonth: null`, `flexMonths: 0`.
     - `id: "sample-kueche"`, `name: "Neue Küche"`, `amountCents: 1_200_000`, `type: "once"`, `dueMonth: addMonths(startMonth, 36)`, `endMonth: null`, `flexMonths: 0`.
     - `id: "sample-auto"`, `name: "Nächstes Auto"`, `amountCents: 2_500_000`, `type: "once"`, `dueMonth: addMonths(startMonth, 84)`, `endMonth: null`, `flexMonths: 0`.
  5. Keine weiteren Beispielziele oder Sonderfälle ergänzen. Das Beispiel soll den normalen finanzierbaren Produktpfad zeigen; Unterdeckung wird weiterhin durch bestehende Tests abgedeckt.

  Tests und Abnahme:

  - Den bisherigen Inflationstest in `tests/storage.test.js` um vollständige Assertions für Einstellungen, Zielnamen, Beträge, Typen, Endmonate und relative Fälligkeiten ergänzen.
  - Für `getSampleData(new Date('2026-10-20T12:00:00.000Z'))` müssen die Fälligkeiten `2027-06`, `2029-10` und `2033-10` entstehen.
  - Den Beispielplan im Test mit `buildPlan(sample.settings, sample.goals, '2026-10')` berechnen und exakt prüfen:
    - `plan.feasible === true`
    - `plan.gapCents === 0`
    - `plan.requiredTodayCents === 600_000`
    - `plan.releasableCents === 200_000`
    - Im November 2026 (`plan.rows[1]`) gilt `contributionCents === 0` und `longTermCents === 120_000`.
    - Mindestens ein späterer Monat hat `contributionCents > 0` und `longTermCents > 0`, damit das Beispiel die Aufteilung des Sparbudgets demonstriert.
  - Nach `Beispiel laden` zeigt die Übersicht den Status `Im Modell finanzierbar`, 2.000 € als heute nicht benötigten Betrag und für den nächsten Monat 0 € Cash-Zuführung sowie 1.200 € für langfristige Anlagen.
  - Jahresplan, Zeitplan und Monatsplan enthalten alle drei Ziele; keine Warnung wegen eines Ziels außerhalb des Planungshorizonts erscheint.

- [ ] **7. Gesamtabnahme, Dokumentation und fokussierter Commit**

  Umsetzung und Abnahme:

  1. Prüfen, dass ausschließlich die in den Punkten 1 bis 6 beschriebenen Funktionen geändert wurden. Insbesondere bleiben Berechnungsformeln, Datenformat, Import/Export-Schema und die Trennung der sechs Ansichten unverändert.
  2. Die App mit leerem Zustand, den neuen Beispieldaten und einem gezielt nicht finanzierbaren Plan manuell prüfen. Dabei Desktop und die unter Punkt 5 genannten mobilen Breiten abdecken.
  3. `npm run lint`, `npm test`, `npm run test:coverage` und `npm run docs:check` erfolgreich ausführen.
  4. Nur aufgabenbezogene Dateien aufnehmen und die vollständige Umsetzung in einem fokussierten Commit festhalten. Vorgeschlagene Commit-Message: `feat: improve planning guidance and sample data`.

## Definition of Done

Die Roadmap ist umgesetzt, wenn alle sieben Hauptpunkte `[x]` tragen, alle genannten Akzeptanzkriterien erfüllt sind, die vollständigen Prüfungen erfolgreich waren und keine der unter „Verbindlicher Umfang“ ausgeschlossenen Funktionen eingeführt wurde.
