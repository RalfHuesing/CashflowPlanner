# Architektur

Die statische Anwendung besteht aus `web/index.html`, lokalem CSS und ES Modules. `web/js/main.js` verbindet Eingaben, Berechnung, lokale Speicherung und Darstellung. Die Navigation zeigt sechs Ansichten über lokale Hash-Links: Startseite, Übersicht, Ziele, Zeitplan, Jahresplan und Monatsplan. Die Zielansicht filtert, sortiert und paginiert die Eingaben, damit auch große Listen bedienbar bleiben. Die Module in `web/js/ui/` erzeugen Navigation, Zielverwaltung, Kennzahlen, SVG-Grafiken (Liquiditätsverlauf und Jahres-Stapeldiagramm) und Tabellen. Sie enthalten keine eigene Finanzmathematik.

`web/js/domain/` enthält pure, browserunabhängige Funktionen für Kalender, Zielereignisse, Inflationshochrechnung, Rückwärtsbedarf und den einzigen Cashplan. Geld wird intern als ganzzahlige Centzahl gehalten; der jährliche Inflationssatz wird als ganzzahlige Basispunkte gespeichert (200 = 2 %). Der Monatsbetrag bleibt in allen künftigen Monaten konstant. `web/js/data/` validiert gespeicherte und importierte Eingaben, kapselt LocalStorage und erzeugt den JSON-Export. Berechnete Ergebnisse werden nicht gespeichert.

Der Datenfluss ist: Eingabe → Validierung → Domain-Berechnung → UI-Darstellung; bei gültigen Änderungen zusätzlich → LocalStorage. Beim Start wird gespeicherter Zustand validiert und geladen. JSON-Import ersetzt ihn erst nach vollständiger Prüfung und Benutzerbestätigung. Es gibt keine Netzwerkübertragung von Finanzdaten und keine produktiven npm-Abhängigkeiten.

Node.js betreibt nur den lokalen Entwicklungsserver, Tests und Doku-Prüfungen. `npm run dev` liefert `web/` direkt aus. Statische Bereitstellung benötigt keinen Build-Prozess.
