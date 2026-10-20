# Implementierungsauftrag: CashflowPlanner

## 1. Auftrag und Arbeitsweise

Du bist ein autonom arbeitender Senior-Softwareentwickler und Softwarearchitekt.

Entwickle **CashflowPlanner** als vollständige, produktionsfähige, clientseitige Webanwendung.

Arbeite eigenständig von der Konzeption über die Implementierung bis zur abschließenden Qualitätssicherung. Du darfst geeignete Subagenten für Implementierung, Tests, Code-Reviews oder fachliche Prüfungen einsetzen. Entscheide selbst, wann dies einen tatsächlichen Mehrwert bietet.

**Grundsätze:**

- Einfachheit vor Funktionsumfang.
- Korrektheit vor Optimierung.
- Verständlicher Code vor cleveren Abstraktionen.
- Hohe Testbarkeit, insbesondere der Finanzmathematik.
- Keine unnötigen Abhängigkeiten, Frameworks oder Architekturabstraktionen.
- Keine bürokratischen Agenten-Workflows.
- Keine unnötigen Rückfragen. Triff sinnvolle technische Entscheidungen eigenständig und dokumentiere wesentliche Annahmen.
- Erhalte den gesamten vereinbarten Funktionsumfang; vereinfache die Umsetzung, nicht die Anforderungen.
- Implementiere tatsächlich funktionsfähige Lösungen, keine Platzhalter oder Mock-Funktionen.

Das Projekt wird vollständig agentisch entwickelt und soll auch langfristig von KI-Agenten gut verstanden, geprüft und erweitert werden können.

---

## 2. Produktintention

### 2.1 Ausgangsproblem

Ein Nutzer besitzt einen bestimmten Cashbestand und kann monatlich einen weiteren Betrag entweder liquide zurücklegen oder langfristig investieren.

Gleichzeitig existieren zukünftige Ausgaben:

- Regelmäßige Ausgaben, beispielsweise jährliche Urlaube.
- Große einmalige Ausgaben, beispielsweise ein Autokauf.
- Kurzfristige und weit entfernte finanzielle Ziele.
- Ziele mit zeitlichem Spielraum.

Die wesentliche Frage lautet:

**Wie viel Cash muss ich heute vorhalten und wie viel muss ich zukünftig monatlich in Cash zurücklegen, damit meine finanziellen Ziele erreichbar bleiben, ohne unnötig viel Geld liquide zu halten?**

### 2.2 Zentrale Produktphilosophie

**So wenig Cash wie möglich, so viel wie nötig.**

CashflowPlanner soll eine einzige, gemeinsame Liquiditätsplanung erstellen.

Es gibt keine separaten Spartöpfe für einzelne Ziele.

Alle zukünftigen Ausgaben werden gemeinsam gegen den vorhandenen Cashbestand und die möglichen monatlichen Zuführungen geplant.

Das System soll insbesondere erkennen:

1. Welche zukünftigen Ausgaben mit dem bestehenden Cash bereits abgedeckt werden können.
2. Wie viel Cash aktuell tatsächlich benötigt wird.
3. Wie viel vom aktuellen Cashbestand rechnerisch nicht gebunden ist.
4. Ab wann zusätzliche monatliche Cash-Zuführungen erforderlich werden.
5. Welche monatlichen Beträge künftig in Cash zurückgelegt werden müssen.
6. Welcher Anteil des monatlich verfügbaren Geldes damit für langfristige Investitionen frei bleibt.
7. Ob geplante Ausgaben unter den gegebenen Bedingungen überhaupt finanzierbar sind.
8. Wie groß eine Finanzierungslücke ist.
9. Ob zeitliche Verschiebungen innerhalb erlaubter Zielzeiträume die Finanzierbarkeit verbessern.

Die Anwendung trifft keine Anlageentscheidungen und verwaltet kein Depot. Sie berechnet ausschließlich Liquiditätsbedarf und mögliche Liquiditätszuführungen.

### 2.3 Bewusste Abgrenzung

CashflowPlanner ist ausdrücklich **kein**:

- Haushaltsbuch
- Budgetmanager
- Spartopf-/Envelope-System
- Banking-Dashboard
- Depotmanager
- Investmentberater
- Rentenplaner
- Buchhaltungssystem
- Vermögensverwaltungssystem

Insbesondere gibt es keine virtuellen Geldkonten je Ziel.

Ein Ziel besitzt einen Betrag und einen Fälligkeitstermin, aber keinen eigenen angesparten Kontostand.

Die Anwendung soll keine vollständige Finanzplanung werden.

### 2.4 Zielgruppe

Privatpersonen ohne technische oder finanzmathematische Fachkenntnisse.

Der Nutzer soll die Anwendung ohne Anleitung verstehen können.

Benutzeroberfläche, Beschriftungen, Fehlermeldungen und Hilfetexte sind vollständig auf Deutsch.

---

## 3. Technologie und Architektur

### 3.1 Technologiestack

Verwende:

- HTML5
- Modernes JavaScript (ES Modules)
- CSS3
- SVG für Diagramme
- Browser LocalStorage für persistente Daten
- JSON für Import und Export

Keine serverseitige Anwendung.

Keine Datenbank.

Keine Benutzerkonten.

Keine Cloud.

Keine externen APIs.

Keine Telemetrie.

Keine externen Schriftarten.

Keine Laufzeitabhängigkeiten, sofern nicht nachweislich notwendig.

Verwende keine React-, Vue-, Angular-, Svelte- oder vergleichbaren Frameworks.

Eine kleine Anwendung dieser Art rechtfertigt kein umfangreiches Frontend-Framework.

### 3.2 Entwicklungswerkzeuge

Node.js darf ausschließlich für Entwicklungswerkzeuge, Tests und lokale Ausführung verwendet werden.

Zulässige Entwicklungsabhängigkeiten:

- ESLint und notwendige ESLint-Konfiguration.
- Weitere Entwicklungswerkzeuge nur bei konkretem, dokumentiertem Nutzen.

Verwende möglichst den integrierten Node.js-Test-Runner.

Vermeide zusätzliche Testframeworks, wenn die eingebauten Möglichkeiten ausreichen.

Für die Laufzeit im Browser sind keine npm-Pakete erforderlich.

### 3.3 Deployment

Die fertige Anwendung muss als statische Webseite bereitgestellt werden können.

Sie darf kein Node.js auf dem Produktivserver benötigen.

Keine Build-Pipeline für die eigentliche Browseranwendung, sofern technisch nicht erforderlich.

Die ausgelieferte Anwendung besteht aus HTML-, CSS- und JavaScript-Dateien.

Verwende einen minimalen lokalen Entwicklungsserver, damit ES Modules zuverlässig funktionieren.

---

## 4. Datenmodell

### 4.1 Allgemeine Einstellungen

Der Nutzer kann folgende Werte verwalten:

| Einstellung | Bedeutung |
|---|---|
| Aktueller Cashbestand | Tatsächlich vorhandene liquide Mittel |
| Monatlich verfügbar | Maximale monatliche Zuführung zu Cash oder langfristigen Anlagen |
| Mindestreserve | Optionaler Cashbetrag, der niemals unterschritten werden soll |
| Aktuelles Lebensalter | Grundlage der Altersachse |
| Planungshorizont | Lebensalter, bis zu dem gerechnet wird |

Alle Geldbeträge werden nominal betrachtet.

Die monatlich verfügbare Summe wird als konstant angenommen.

Die Mindestreserve ist standardmäßig 0 €, kann aber vom Nutzer frei festgelegt werden.

Bei der Berechnung dürfen keine stillschweigenden Annahmen über weitere Einnahmen, Zinsen oder Depotentnahmen getroffen werden.

### 4.2 Finanzielle Ziele

Jedes Ziel besitzt:

- Eindeutige technische ID.
- Bezeichnung.
- Betrag in Euro.
- Typ: einmalig oder jährlich wiederkehrend.
- Wunschtermin beziehungsweise ersten Fälligkeitstermin.
- Optionalen zeitlichen Spielraum in Monaten.

Beispiele:

**Jährlicher Urlaub**

- Bezeichnung: Urlaub
- Betrag: 5.000 €
- Wiederholung: jährlich
- Erste Fälligkeit: August 2027
- Spielraum: 0 Monate

**Autokauf**

- Bezeichnung: Auto
- Betrag: 40.000 €
- Wiederholung: einmalig
- Fälligkeit: Oktober 2032
- Spielraum: ± 6 Monate

### 4.3 Wiederkehrende Ziele

Wiederkehrende Ziele werden ausschließlich jährlich unterstützt.

Keine monatlichen, wöchentlichen oder komplexen Wiederholungsregeln.

Ein jährliches Ziel wird ab seiner ersten Fälligkeit alle zwölf Monate berücksichtigt, solange seine jeweilige Fälligkeit innerhalb des Planungshorizonts liegt.

Es ist keine separate Spartopf-Verwaltung erforderlich.

Für die Berechnung werden die einzelnen Fälligkeiten eines wiederkehrenden Ziels intern als Ereignisse erzeugt.

### 4.4 Zeitliche Flexibilität

Ein Ziel besitzt einen Wunschtermin und optional einen Zeitraum von ± N Monaten.

Der Wunschtermin bleibt grundsätzlich maßgeblich.

Die Anwendung darf für alternative Planungsszenarien spätere zulässige Termine berücksichtigen.

Wichtig:

- Terminverschiebungen dürfen niemals stillschweigend erfolgen.
- Der normale Plan verwendet den Wunschtermin.
- Alternative Pläne müssen eindeutig gekennzeichnet sein.
- Eine Verschiebung darf keine Ausgabe verschwinden lassen.
- Wiederkehrende Ziele müssen bei Verschiebungen konsistent bleiben.
- Eine Ausgabe darf nicht einfach über den Planungshorizont hinausgeschoben werden, um künstlich Finanzierbarkeit vorzutäuschen.

Bei ausschließlich positiven Ausgaben und ohne Zinsen oder Inflation verbessert ein späterer Zahlungstermin die Liquiditätsplanung mindestens genauso stark wie ein früherer Termin.

Eine automatische Vorverlegung ist deshalb für die finanzielle Optimierung nicht erforderlich. Frühere Termine bleiben als zulässige manuelle Szenarien möglich.

---

## 5. Finanzmathematische Berechnung

**Dies ist die wichtigste Komponente des gesamten Projekts.**

Der Berechnungsalgorithmus muss deterministisch, transparent und vollständig unabhängig von der Benutzeroberfläche implementiert werden.

Keine KI, keine Heuristik ohne klare mathematische Definition und keine Monte-Carlo-Simulation.

### 5.1 Zeitauflösung

Intern wird monatsgenau gerechnet.

Die X-Achse der Visualisierung zeigt das Lebensalter in Jahren.

Berechnungen arbeiten mit Kalendermonaten.

Die Anwendung verwendet den aktuellen Kalendermonat als Ausgangspunkt.

Das aktuelle Lebensalter dient zur Darstellung der Altersachse. Da kein vollständiges Geburtsdatum erfasst wird, können die Altersangaben zwischen den Jahresmarkierungen nur näherungsweise sein. Konkrete Fälligkeiten und Berechnungen verwenden immer echte Kalendermonate.

### 5.2 Grundgleichung

Für jeden zukünftigen Monat gilt:

`Cash_neu = Cash_alt + Cash_Zuführung − Ausgaben`

Dabei gilt:

`0 <= Cash_Zuführung <= Monatlich_verfügbar`

Außerdem muss nach den Ausgaben eines Monats der Mindestreservebetrag erhalten bleiben.

Verwende folgende zeitliche Konvention:

- Der aktuelle Cashbestand ist der tatsächlich heute vorhandene Betrag.
- Bereits für den aktuellen Kalendermonat fällige, noch offene Ziele werden aus diesem Bestand bezahlt.
- Für den laufenden Monat wird keine zusätzliche monatliche Sparrate unterstellt.
- Ab dem nächsten Kalendermonat erfolgt die geplante Zuführung vor den jeweiligen Monatsausgaben.
- Monatsendstände werden nach Ausgaben und Zuführung ermittelt.

Dokumentiere diese Konvention eindeutig.

### 5.3 Keine Gleitkommafehler

Sämtliche Geldbeträge werden intern als ganzzahlige Centbeträge verarbeitet.

Verwende keine unkontrollierten Floating-Point-Berechnungen für Geld.

Begrenze Eingabewerte so, dass die verwendete Integer-Repräsentation sicher bleibt.

Die Formatierung erfolgt benutzerfreundlich mit deutschen Zahlen- und Währungsformaten.

### 5.4 Zentrale Rückwärtsberechnung

Implementiere einen Algorithmus zur Ermittlung des minimal erforderlichen Cashbestands.

Definitionen:

- `H`: letzter Planungsmonat.
- `R`: dauerhaft erforderliche Mindestreserve.
- `M`: maximal mögliche monatliche Cash-Zuführung.
- `E[t]`: Summe aller im Monat `t` fälligen Ausgaben.
- `F[t]`: minimal erforderlicher Cashbestand am Ende von Monat `t`, um sämtliche späteren Ziele innerhalb des Planungshorizonts mit den verfügbaren monatlichen Mitteln erfüllen zu können.

Initialisierung:

`F[H] = R`

Rückwärts für alle Monate von `H` bis `1`:

`F[t-1] = max(R, F[t] + E[t] - M)`

Diese Berechnung liefert unter den definierten Annahmen den minimal erforderlichen Bestand, der vorhanden sein muss, damit die zukünftigen Ausgaben grundsätzlich finanzierbar bleiben.

Die Ausgaben des aktuellen Monats `E[0]` werden separat berücksichtigt.

Der heute erforderliche Cashbestand vor diesen Ausgaben beträgt:

`Cash_erforderlich_heute = E[0] + F[0]`

Daraus folgen:

`Finanzierungslücke_heute = max(0, Cash_erforderlich_heute - Cash_aktuell)`

`Maximal_freigebbar_heute = max(0, Cash_aktuell - Cash_erforderlich_heute)`

Der maximal freigebbare Betrag setzt voraus, dass künftig bei Bedarf die vollständige monatlich verfügbare Summe für Cash eingesetzt werden kann.

Er ist keine pauschale Empfehlung, sofort in dieser Höhe zu investieren.

### 5.5 Monatlicher Sparplan

Nach Prüfung der Finanzierbarkeit wird ein monatlicher Plan berechnet.

Ausgangspunkt ist der Cashbestand nach den aktuellen Monatsausgaben und gegebenenfalls nach einer ausdrücklich simulierten Freigabe überschüssiger Liquidität.

Für jeden zukünftigen Monat:

`Sparrate[t] = max(0, F[t] + E[t] - Cash[t-1])`

Anschließend:

`Cash[t] = Cash[t-1] + Sparrate[t] - E[t]`

Ein gültiger Finanzierungsplan muss garantieren:

- `Sparrate[t] <= M`
- `Sparrate[t] >= 0`
- `Cash[t] >= R`
- Jede Ausgabe wird vollständig berücksichtigt.

Der verbleibende Monatsbetrag ist:

`Langfristig_verfügbar[t] = M - Sparrate[t]`

### 5.6 Optimierungsziel

Für Version 1 gilt eine eindeutig definierte Strategie:

**Spare Cash so spät wie mathematisch möglich, ohne die Finanzierbarkeit eines Ziels zu gefährden.**

Dies minimiert die frühzeitig gebundene Liquidität unter den Modellannahmen.

Die daraus entstehenden Sparraten müssen nicht gleichmäßig sein.

Ein später Beginn mit höheren Sparraten ist zulässig, sofern die monatlich verfügbaren Mittel ausreichen.

Implementiere keine zusätzliche Glättung oder gleichmäßige Verteilung ohne ausdrückliche Produktanforderung.

Eine spätere Erweiterung um alternative Sparstrategien muss möglich bleiben, ohne den Berechnungskern neu zu schreiben.

### 5.7 Aktuellen Cashüberschuss berücksichtigen

Unterscheide zwei nachvollziehbare Szenarien:

**Szenario A: Bestehenden Cash vollständig behalten**

- Der tatsächliche Cashbestand bleibt Ausgangspunkt.
- Die monatlichen Sparraten werden möglichst spät aufgebaut.
- Kein fiktiver Cashabfluss wird angenommen.

**Szenario B: Rechnerisch freigebbaren Cashüberschuss verwenden**

- Der maximal freigebbare Cashbetrag wird als hypothetische sofortige Entnahme aus dem Cashbestand betrachtet.
- Die verbleibende Liquidität wird für die langfristige Planung verwendet.
- Die zukünftigen Cash-Sparraten werden entsprechend neu berechnet.

Szenario B ist eine reine Simulation.

Die Anwendung darf niemals so tun, als sei eine Überweisung, Investition oder Depottransaktion tatsächlich erfolgt.

Kennzeichne deutlich, welches Szenario die Grafik zeigt.

### 5.8 Unzureichende Liquidität

Die Anwendung muss zuverlässig erkennen, wenn Ziele auch bei maximaler monatlicher Cash-Zuführung nicht finanziert werden können.

In diesem Fall:

- Finanzierbarkeit als nicht gegeben markieren.
- Höhe der erforderlichen zusätzlichen Anfangsliquidität berechnen.
- Den ersten kritischen Monat bestimmen.
- Die betroffenen Ausgaben identifizieren.
- Keine scheinbar gültigen Sparraten anzeigen.
- Optional einen Best-Case-Verlauf mit maximalen Zuführungen darstellen, dessen Unterdeckung klar sichtbar bleibt.

Beispiele für mögliche Hinweise:

„Für deine geplanten Ausgaben fehlen mindestens 4.000 €.“

„Der Engpass entsteht voraussichtlich im Oktober 2042.“

„Mit deinem verfügbaren Monatsbetrag ist dieser Plan nicht vollständig finanzierbar.“

Die Anwendung darf erwähnen, dass zusätzliche Mittel, höhere Sparraten oder veränderte Ziele erforderlich sind.

Sie darf keine Depotverkäufe planen oder simulieren.

### 5.9 Alternative Termine

Berechne zunächst den normalen Plan mit den Wunschterminen.

Ist er nicht finanzierbar, darf ergänzend ein klar gekennzeichnetes Szenario mit maximal zulässiger Verschiebung der flexiblen Ausgaben berechnet werden.

Dieses Szenario dient zunächst nur dazu, festzustellen, ob die zeitliche Flexibilität grundsätzlich ausreichen würde.

Es muss ausdrücklich als theoretische Variante gekennzeichnet werden.

Eine global optimale Kombination minimaler Einzelverschiebungen ist für Version 1 nicht erforderlich.

Keine kombinatorisch aufwendige Terminoptimierung.

Ein späterer Ausbau darf solche Verfahren ergänzen.

### 5.10 Planungshorizont

Es werden nur Ausgaben berücksichtigt, deren geplante Fälligkeiten im definierten Planungshorizont liegen.

Der Nutzer muss erkennen können, dass Ausgaben nach dem Planungshorizont nicht berücksichtigt wurden.

Wiederkehrende Ziele enden rechnerisch mit dem gewählten Planungshorizont, nicht zwangsläufig im tatsächlichen Leben.

Verhindere irreführende Ergebnisse durch stillschweigend ausgelassene oder über den Horizont verschobene Ausgaben.

### 5.11 Zinsen und Inflation

Version 1 arbeitet vollständig nominal.

- Keine Inflation.
- Keine Cash-Verzinsung.
- Keine Steuern.
- Keine Renditesimulation.
- Keine Kapitalmarktprognosen.
- Keine Depotentwicklung.

Diese Einschränkungen sind in der Oberfläche verständlich zu erklären.

---

## 6. Benutzeroberfläche

### 6.1 Gestaltung

Die Benutzeroberfläche soll professionell, ruhig, sachlich und modern wirken.

Designprinzipien:

- Heller Hintergrund.
- Dezente Farben.
- Gute Lesbarkeit.
- Klare visuelle Hierarchie.
- Keine überladenen Dashboards.
- Keine dekorativen Berge oder aufwendigen Illustrationen.
- Wenige, gezielt eingesetzte Farben.
- Grün für finanzierbare Situationen.
- Rot für Finanzierungslücken.
- Neutrale Farben für gewöhnliche Finanzwerte.
- Responsive Darstellung für Desktop, Tablet und Smartphone.

Die Gestaltung soll eher an ein seriöses Finanzwerkzeug als an eine spielerische Spar-App erinnern.

Verwende verständliche deutsche Begriffe.

Vermeide unnötige Finanzfachbegriffe.

### 6.2 Grundaufbau

Die Hauptansicht enthält vier Bereiche.

**A. Ausgangslage**

Kompakte Eingabefelder für:

- Aktuellen Cashbestand.
- Monatlich verfügbaren Betrag.
- Mindestreserve.
- Aktuelles Alter.
- Planungshorizont.

Änderungen sollen die Berechnung unmittelbar aktualisieren.

**B. Finanzielle Ziele**

Eine übersichtliche Liste aller Ziele.

Pro Eintrag:

- Name.
- Betrag.
- Fälligkeit.
- Wiederholung.
- Zeitlicher Spielraum.
- Bearbeiten.
- Löschen.

Ein neues Ziel muss mit wenigen Eingaben angelegt werden können.

Keine langen Formulare oder mehrstufigen Assistenten.

Sortierung standardmäßig chronologisch.

**C. Finanzielle Auswertung**

Oberhalb des Diagramms werden die wichtigsten Ergebnisse deutlich dargestellt:

- Heute erforderlicher Cashbestand.
- Rechnerisch freigebbarer Cashüberschuss beziehungsweise Finanzierungslücke.
- Empfohlene Cash-Zuführung für den nächsten Monat.
- Für langfristige Anlagen verbleibender Monatsbetrag.

Ergänzend ein kurzer, automatisch erzeugter Erklärungstext in einfacher Sprache.

**D. Zeitliche Planung**

Diagramm und darunter eine Tabelle mit den kommenden monatlichen Cash-Zuführungen.

### 6.3 Diagramm

Das Diagramm ist das zentrale visuelle Element.

X-Achse: Lebensalter in Jahren.

Y-Achse: absoluter Eurobetrag.

Darstellung:

- Tatsächlicher Cashbestand am heutigen Tag.
- Prognostizierter Cashbestand im gewählten Szenario.
- Minimal erforderlicher Cashbestand über die Zeit.
- Markierungen für geplante Ausgaben.
- Horizontale Markierung für die Mindestreserve.
- Deutliche Kennzeichnung von Finanzierungslücken.
- Markierung des aktuellen Zeitpunkts.

Ziele sollen als gut erkennbare Ereignisse dargestellt werden.

Einzelne große Ausgaben dürfen als vertikale Balken oder Marker mit ihrer absoluten Höhe erscheinen.

Jährliche kleine Ausgaben dürfen kompakter dargestellt werden, damit das Diagramm bei vielen Jahren nicht überladen wird.

Für Ziele mit zeitlicher Flexibilität soll der erlaubte Zeitraum bei Bedarf erkennbar sein.

Nutze natives SVG.

Erstelle eine verständliche Legende.

Bei Interaktion mit einem Datenpunkt sollen mindestens Kalenderzeitpunkt, Lebensalter, Cashbestand, erforderlicher Bestand und relevante Ausgaben erkennbar sein.

Die Darstellung darf mathematisch unterschiedliche Größen nicht irreführend miteinander vermischen.

Keine doppelte Verwendung derselben Farbe für unterschiedliche Bedeutungen.

### 6.4 Monatliche Sparvorschau

Unterhalb des Diagramms eine kompakte Tabelle, standardmäßig für die nächsten zwölf Monate.

Spalten:

- Monat.
- In Cash zurücklegen.
- Für langfristige Anlagen verfügbar.
- Erwarteter Cashbestand nach Monatsabschluss.

Die beiden ersten Geldspalten müssen zusammen höchstens den monatlich verfügbaren Betrag ergeben.

Bei einem nicht finanzierbaren Szenario darf diese Tabelle keinen gültigen optimierten Sparplan vortäuschen.

### 6.5 Benutzerfreundlichkeit

Die Anwendung soll:

- Eingabefehler sofort verständlich anzeigen.
- Ergebnisse ohne expliziten Berechnungsbutton aktualisieren.
- Bei fehlenden Daten sinnvoll reagieren.
- Eine übersichtliche Erstbenutzeransicht besitzen.
- Optional realistische Beispieldaten zum Ausprobieren anbieten.
- Formatierte Eurobeträge anzeigen.
- Änderungen automatisch lokal speichern.
- Auch mit vielen Zielen bedienbar bleiben.
- Dialoge, Tabellen und Diagramme barrierearm gestalten.
- Mit Tastatur bedienbar sein.
- Auf kleinen Bildschirmen funktionieren.

Keine Pop-up-Flut.

Keine dauernden Bestätigungsdialoge.

Bestätigungen nur bei tatsächlich destruktiven Aktionen wie dem Ersetzen bestehender Daten durch einen Import.

### 6.6 Erklärbarkeit

Jedes wichtige Ergebnis muss nachvollziehbar sein.

Beispiel:

„Für deine geplanten Ausgaben benötigst du rechnerisch mindestens 28.000 € Cash. Dein aktueller Bestand beträgt 40.000 €. Die Differenz von 12.000 € könnte unter den getroffenen Annahmen langfristig angelegt werden.“

Oder:

„Deine nächste größere Ausgabe liegt in sechs Jahren. Damit sie finanzierbar bleibt, musst du derzeit noch keinen zusätzlichen Cash ansparen.“

Keine übertriebenen Warnungen.

Keine Anlageberatung.

Keine Aussagen über garantierte zukünftige finanzielle Sicherheit.

---

## 7. Lokale Datenhaltung

### 7.1 Speicherung

Alle Daten verbleiben im Browser.

Verwende LocalStorage für:

- Einstellungen.
- Ziele.
- Tatsächlichen Cashbestand.
- Datum der letzten Aktualisierung des Cashbestands.

Die Anwendung soll bei einem späteren Besuch automatisch den gespeicherten Zustand wiederherstellen.

Der tatsächliche Cashbestand wird niemals automatisch anhand früherer Prognosen fortgeschrieben.

Wenn der Bestand längere Zeit nicht aktualisiert wurde, zeige einen dezenten Hinweis.

Beispiel:

„Dein Cashbestand wurde zuletzt im September aktualisiert. Prüfe den aktuellen Betrag für eine zuverlässige Planung.“

Ein Wechsel des Kalendermonats darf keine stillschweigenden Änderungen am gespeicherten Cashbestand auslösen.

### 7.2 JSON-Export

Der Nutzer kann sämtliche Eingabedaten als JSON exportieren.

Die Datei enthält:

- Formatversion.
- Einstellungen.
- Ziele.
- Gespeicherten Cashbestand.
- Aktualisierungsdatum.

Keine unnötigen berechneten Ergebnisse speichern, die jederzeit reproduzierbar sind.

Keine externen Ressourcen zum Export verwenden.

### 7.3 JSON-Import

Implementiere einen sicheren Import.

Anforderungen:

- Formatversion prüfen.
- JSON-Struktur validieren.
- Datentypen validieren.
- Geldbeträge und Datumsangaben prüfen.
- Ungültige Dateien verständlich zurückweisen.
- Importgröße sinnvoll begrenzen.
- Alte Daten erst nach erfolgreicher Validierung und Benutzerbestätigung ersetzen.
- Keine teilweise übernommenen Daten bei Importfehlern.
- Keine Ausführung von importierten Inhalten.
- Versionierbares Datenformat.

Import und Export müssen verlustfrei zusammenarbeiten.

### 7.4 Datenschutz

Keine personenbezogenen Daten übertragen.

Keine Analytics.

Keine Werbung.

Keine externen Skripte.

Keine Cookies für Tracking.

Hinweis in der Anwendung, dass Browserdaten beim Löschen lokaler Websitedaten verloren gehen können.

JSON-Export dient als manuelle Sicherungsmöglichkeit.

Lokale Daten werden nicht automatisch verschlüsselt. Stelle deshalb keine Sicherheitsgarantien in Aussicht, die technisch nicht erfüllt werden.

---

## 8. Projektstruktur

Verwende folgende Struktur als Orientierung und initiale Zielarchitektur.

Passe Details nur an, wenn dadurch nachweislich eine einfachere und klarere Lösung entsteht.

```text
CashflowPlanner/
│
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── eslint.config.js
├── .gitignore
│
├── .agents/
│   └── rules/
│       ├── domain.md
│       ├── code-quality.md
│       └── ui.md
│
├── web/
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   │
│   └── js/
│       ├── main.js
│       │
│       ├── domain/
│       │   ├── calendar.js
│       │   ├── goals.js
│       │   ├── liquidity.js
│       │   └── scenarios.js
│       │
│       ├── data/
│       │   ├── storage.js
│       │   └── import-export.js
│       │
│       └── ui/
│           ├── goals-form.js
│           ├── summary.js
│           ├── chart.js
│           └── monthly-plan.js
│
├── tests/
│   ├── liquidity.test.js
│   ├── scenarios.test.js
│   ├── goals.test.js
│   ├── calendar.test.js
│   ├── data-format.test.js
│   ├── storage.test.js
│   │
│   └── fixtures/
│       └── scenarios.json
│
├── scripts/
│   ├── dev-server.mjs
│   ├── docs-sync.mjs
│   └── docs-check.mjs
│
└── docs/
    ├── PRODUCT.md
    ├── ARCHITECTURE.md
    ├── ALGORITHM.md
    ├── DATA_FORMAT.md
    └── EXAMPLES.md
```

Die Dateien sind nach tatsächlichen fachlichen Verantwortlichkeiten aufzuteilen.

Keine künstliche Aufteilung um eine bestimmte Dateianzahl zu erreichen.

Keine unnötigen Interfaces, Klassenhierarchien, Factories, Dependency-Injection-Container oder Repository-Patterns.

Verwende einfache Funktionen und ES Modules, wo dies ausreicht.

Die gesamte berechenbare Geschäftslogik liegt unabhängig vom DOM in `web/js/domain/`.

Die Benutzeroberfläche ruft die Berechnungslogik auf, nicht umgekehrt.

Die Inhalte unter `web/` müssen vollständig statisch auslieferbar sein.

---

## 9. AGENTS.md

Erstelle eine kurze, verbindliche Datei `AGENTS.md` im Projektstamm.

Sie ist die dauerhafte Einstiegsvorschrift für sämtliche zukünftigen Coding-Agenten.

Folgende Regeln müssen enthalten sein:

### Projektverständnis

- CashflowPlanner ist ein einfacher, vollständig clientseitiger Liquiditätsplaner.
- Es gibt einen einzigen gemeinsamen Cashbestand.
- Die zentrale Funktion ist die Berechnung des minimal notwendigen Cashbedarfs und zukünftiger Sparraten.
- Fachliche Details liegen in `docs/PRODUCT.md` und `docs/ALGORITHM.md`.
- Die laufende Implementierung ist maßgeblich für das tatsächliche Verhalten; Dokumentation beschreibt die beabsichtigten Verträge und muss mit dem Code übereinstimmen.

### Agentisches Arbeiten

- Lies nur die für die konkrete Aufgabe relevanten Dateien.
- Analysiere vorhandenen Code, bevor du Änderungen vornimmst.
- Ändere möglichst nur die betroffenen Komponenten.
- Bevorzuge einfache, lokale Änderungen.
- Führe bei Änderungen an Berechnungen passende Tests aus.
- Dokumentiere relevante fachliche Entscheidungen.
- Aktualisiere betroffene Dokumentation im selben Arbeitsschritt.
- Vermeide eigenständige funktionale Erweiterungen außerhalb des Auftrags.
- Verwende Subagenten nur bei echtem Nutzen.
- Vermeide unnötige Planungs-, Review- und Dokumentationsschleifen.
- Bestehende, nicht zur Aufgabe gehörende Änderungen dürfen nicht überschrieben werden.

### Abschluss einer Änderung

- Betroffene Tests ausführen.
- Linter ausführen.
- Bei relevanten Änderungen vollständige Test-Suite ausführen.
- Dokumentationskonsistenz prüfen.
- Keine unbelegten Behauptungen über erfolgreich ausgeführte Tests.
- Keine unvollständigen Änderungen als abgeschlossen melden.
- Neue Abhängigkeiten nur bei begründetem Bedarf.
- Keine automatischen externen Veröffentlichungen.

### Weitere Regeln

Verweise ausdrücklich auf:

- `.agents/rules/domain.md` bei Änderungen der Finanzmathematik oder des Datenmodells.
- `.agents/rules/code-quality.md` bei Implementierung und Refactoring.
- `.agents/rules/ui.md` bei Änderungen der Benutzeroberfläche.

Diese Dateien sind projektspezifische Regeldateien und werden nicht automatisch von jedem Agenten-Harness eingelesen. Die Verweise in `AGENTS.md` stellen sicher, dass Agenten sie bei relevanten Arbeiten berücksichtigen.

Halte `AGENTS.md` kompakt. Wiederhole nicht die vollständigen Fachspezifikationen.

---

## 10. .agents/rules/

### 10.1 domain.md

Erstelle verbindliche fachliche Invarianten.

Mindestens:

- Ein einziger Cashbestand.
- Keine Spartöpfe.
- Centgenaue Geldbeträge.
- Deterministische Berechnung.
- Kein negativer zulässiger Cashbestand unterhalb der Mindestreserve.
- Keine erfundenen Einnahmen.
- Keine stillschweigend ausgelassenen Ausgaben.
- Keine Terminverschiebung ohne Kennzeichnung.
- Keine Cash-Zuführung oberhalb der monatlich verfügbaren Summe.
- Keine Ausgabe eines gültigen Plans, wenn die Bedingungen nicht erfüllt sind.
- Alle Ziele werden chronologisch korrekt berücksichtigt.
- Änderungen an der Berechnung benötigen passende Tests.

Dokumentiere die Rückwärtsberechnung als wesentliche fachliche Invariante.

### 10.2 code-quality.md

Verankere folgende Regeln:

- KISS, DRY und YAGNI pragmatisch anwenden.
- Lesbarkeit und Verständlichkeit priorisieren.
- Keine spekulativen Abstraktionen.
- Keine unnötigen Klassen.
- Keine generischen Frameworks für einmalige Problemstellungen.
- Möglichst kleine, klar abgegrenzte Funktionen.
- Pure Functions für Fachlogik bevorzugen.
- Seiteneffekte auf UI und Speicherung begrenzen.
- Keine versteckten globalen Zustände.
- Explizite Parameter und Rückgabewerte.
- Fehlerfälle nachvollziehbar behandeln.
- Keine leeren Catch-Blöcke.
- Keine ungenutzten Funktionen oder toten Codepfade.
- Keine deaktivierten Tests ohne Begründung.
- Keine Warnungen dauerhaft ignorieren.
- Kein unnötiges Logging.
- Keine riesigen monolithischen Dateien.
- Keine künstliche Fragmentierung zusammengehöriger Funktionen.

Als Orientierung sollten JavaScript-Dateien möglichst überschaubar bleiben, idealerweise im Bereich weniger hundert Zeilen.

Dies ist kein starres Limit. Fachlich zusammengehöriger Code darf zusammenbleiben, wenn die Lesbarkeit dadurch besser ist.

### 10.3 ui.md

Verankere:

- Deutsche Benutzeroberfläche.
- Verständliche Begriffe.
- Keine unnötigen Eingabefelder.
- Responsive Layout.
- Gute Tastaturbedienbarkeit.
- Verständliche Fehlermeldungen.
- Barrierearme Diagramme und Tabellen.
- Keine irreführenden Finanzdarstellungen.
- Keine unnötigen Dialoge.
- Keine überladenen Designkomponenten.
- Saubere Trennung zwischen Darstellung und Berechnung.
- HTML-Inhalte aus Benutzereingaben sicher behandeln.

---

## 11. Linting und statische Codequalität

Richte ESLint ein.

Verwende eine aktuelle, stabile ESLint-Konfiguration.

Aktiviere sinnvolle Regeln für:

- Ungenutzte Variablen.
- Unerreichbaren Code.
- Problematische Vergleiche.
- Unbeabsichtigte globale Variablen.
- Fehlerhafte Kontrollflusskonstruktionen.
- Doppelte Deklarationen.
- Unnötig komplexe Funktionen.
- Unnötig tief verschachtelte Kontrollstrukturen.
- Konsistente Modulsyntax.

Warnungen sollen im normalen Prüfablauf als Fehler behandelt werden.

Keine hunderten willkürlichen Stilregeln.

Keine automatischen, semantisch riskanten Änderungen.

Implementiere npm-Skripte:

```text
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run docs:sync
npm run docs:check
npm run verify
```

`npm run verify` führt die relevanten vollständigen Qualitätsprüfungen aus.

Die Tests müssen ohne Browser, Backend und externe Dienste ausführbar sein.

Für reproduzierbare Installationen sind konkrete Dependency-Versionen und eine Lockdatei zu verwenden.

---

## 12. Umfassende automatisierte Tests

### 12.1 Grundsatz

Die Finanzmathematik muss besonders intensiv getestet werden.

Teste nicht nur einzelne Funktionen, sondern auch vollständige Szenarien mit bekannten, unabhängig nachvollziehbaren Ergebnissen.

Tests sollen Fehler finden, nicht lediglich die aktuelle Implementierung bestätigen.

### 12.2 Pflichtszenarien

Implementiere mindestens Tests für:

**Basisfälle**

- Kein Ziel vorhanden.
- Ein einzelnes Ziel.
- Mehrere Ziele.
- Ziel im nächsten Monat.
- Ziel im aktuellen Monat.
- Ziel am Ende des Planungshorizonts.
- Ziele mit identischer Fälligkeit.
- Zielbetrag 0, sofern als Eingabe zulässig; andernfalls Validierungsfehler.

**Cashbestand**

- Kein vorhandenes Cash.
- Bereits vollständig finanzierte Ziele.
- Hoher überschüssiger Cashbestand.
- Cashbestand exakt auf dem erforderlichen Minimum.
- Cashbestand unterhalb der Mindestreserve.
- Aktuelle Finanzierungslücke.
- Cashbestand größer als sämtliche geplanten Ausgaben.

**Monatliche Sparmöglichkeiten**

- Monatlich verfügbar = 0 €.
- Monatlich verfügbar kleiner als der zukünftige Bedarf.
- Monatlich verfügbar exakt ausreichend.
- Hoher monatlich verfügbarer Betrag.
- Finanzierbarer Plan mit zeitweise 0 € Cash-Sparrate.
- Plan mit zeitweise maximal notwendiger Cash-Sparrate.
- Kein Überschreiten der verfügbaren Summe.

**Wiederkehrende Ziele**

- Jährliche Ausgaben.
- Beginn eines wiederkehrenden Ziels in der Zukunft.
- Mehrere jährliche Ziele.
- Wiederholungen über Jahrzehnte.
- Fälligkeiten an Jahresgrenzen.
- Schaltjahre und Kalenderarithmetik.
- Keine zusätzlichen Wiederholungen außerhalb des Horizonts.

**Zeitliche Flexibilität**

- Ziel ohne Flexibilität.
- Ziel mit ± 6 Monaten.
- Verschiebung verbessert Finanzierbarkeit.
- Verschiebung reicht nicht aus.
- Alternative Termine verändern gespeicherte Wunschtermine nicht.
- Keine Ausgabe verschwindet durch Verschiebungen.

**Finanzierbarkeit**

- Finanzierungslücke bei großem zukünftigen Ziel.
- Erste Unterdeckung korrekt bestimmen.
- Gleichzeitige große und wiederkehrende Ausgaben.
- Finanzierungslücke trotz maximaler Cash-Zuführung.
- Exakte Behandlung der Mindestreserve.
- Wiederherstellung eines gültigen Plans durch zusätzliche Anfangsliquidität.

**Daten**

- JSON-Export/Import ohne Datenverlust.
- Ungültiges JSON.
- Unbekannte Datenformatversion.
- Fehlende Pflichtfelder.
- Ungültige Datumsformate.
- Negative oder übergroße Geldbeträge.
- Doppelte IDs.
- Beschädigte LocalStorage-Daten.
- LocalStorage nicht verfügbar.
- Import ohne versehentlichen Datenverlust.

### 12.3 Referenzszenario

Verwende zusätzlich folgenden Testfall:

- Anfangsbestand: 40.000 €.
- Monatlich verfügbar: 500 €.
- Mindestreserve: 0 €.
- Planungshorizont: 16 Jahre.
- Jährlicher Urlaub: 5.000 €, jeweils am Ende jedes der 16 Jahre.
- Erstes Auto: 40.000 € nach 6 Jahren.
- Zweites Auto: 20.000 € nach 16 Jahren.
- Keine Verzinsung und keine Inflation.
- Alle Zahlungen am jeweiligen Monatsende; monatliche Zuführungen ab dem Folgemonat.

Erwartete Gesamtrechnung:

- Anfangsbestand: 40.000 €.
- Monatliche Zuführungsmöglichkeit: 96.000 €.
- Urlaubsausgaben: 80.000 €.
- Autokäufe: 60.000 €.
- Finanzierungslücke: 4.000 €.
- Minimal erforderlicher Anfangsbestand: 44.000 €.

Das Ergebnis muss zusätzlich anhand des tatsächlichen zeitlichen Zahlungsverlaufs geprüft werden, nicht ausschließlich anhand der Gesamtsummen.

### 12.4 Mathematische Eigenschaften

Prüfe zusätzlich allgemeine Invarianten, möglichst auch durch deterministisch erzeugte Testfälle:

- Mehr Anfangscash darf einen Plan nicht weniger finanzierbar machen.
- Höhere verfügbare Monatsbeträge dürfen die Finanzierbarkeit nicht verschlechtern.
- Ein späterer Zahlungstermin darf bei ansonsten gleichen Annahmen die erforderliche Anfangsliquidität nicht erhöhen.
- Die Summe aller Einzahlungen, Ausgaben und Endbestände muss der Cashbilanz entsprechen.
- Der Plan darf nie mehr Geld zuführen, als monatlich verfügbar ist.
- Bei einem als finanzierbar gemeldeten Plan muss jede Ausgabe vollständig bezahlt werden können.
- Ein freigegebener Cashüberschuss muss mit dem dafür berechneten zukünftigen Sparplan vereinbar sein.
- Die gleiche Eingabe muss immer das gleiche Ergebnis erzeugen.

### 12.5 Testabdeckung

Strebe für die fachliche Berechnungslogik eine sehr hohe Statement- und Branch-Coverage an, möglichst mindestens 90 %.

Wichtiger als ein Prozentwert ist, dass wesentliche Randfälle und Invarianten geprüft sind.

Keine sinnlosen Tests zum Erreichen einer Kennzahl.

Verwende nachvollziehbare Fixtures für komplexere Szenarien.

Die Tests müssen vollständig automatisiert und wiederholbar sein.

---

## 13. Dokumentation

Erstelle das Verzeichnis `docs/`.

Dokumentation ist Bestandteil der Implementierung und muss mit dem tatsächlichen Verhalten übereinstimmen.

### 13.1 PRODUCT.md

Beschreibe:

- Problem.
- Zielgruppe.
- Produktintention.
- Hauptfunktionen.
- Wesentliche Nutzerabläufe.
- Bewusste Abgrenzungen.
- Nicht-Ziele.
- Fachliche Annahmen.

Keine technische Detailimplementierung.

### 13.2 ARCHITECTURE.md

Beschreibe:

- Architekturübersicht.
- Wesentliche Module.
- Datenfluss.
- Abhängigkeiten.
- Speicherung.
- Import/Export.
- Trennung zwischen Berechnung und UI.

Kurz und präzise.

Keine automatisch erzeugten endlosen Klassendiagramme.

### 13.3 ALGORITHM.md

Dokumentiere die Berechnungslogik vollständig.

Insbesondere:

- Zeitmodell.
- Rechenkonventionen.
- Rückwärtsberechnung.
- Finanzierbarkeit.
- Monatsplanung.
- Cashüberschuss.
- Finanzierungslücken.
- Umgang mit flexiblen Terminen.
- Bekannte Grenzen des Modells.

Dieses Dokument soll es einem anderen Entwickler ermöglichen, den Algorithmus zu verstehen und unabhängig zu überprüfen.

### 13.4 DATA_FORMAT.md

Dokumentiere:

- JSON-Struktur.
- Formatversion.
- Feldnamen.
- Datentypen.
- Validierungsregeln.
- Versionierung.
- Rückwärtskompatibilität, soweit vorhanden.

### 13.5 EXAMPLES.md

Dieses Dokument soll aus den Test-Fixtures und dem tatsächlichen Berechnungskern generiert werden.

Es enthält einige aussagekräftige Beispielszenarien mit Eingaben und berechneten Ergebnissen.

Keine manuell gepflegten, möglicherweise veralteten Rechenbeispiele.

---

## 14. Automatische Dokumentationspflege

Die Dokumentation soll bei der agentischen Weiterentwicklung möglichst wenig manuelle Pflege erfordern.

Implementiere dafür zwei Mechanismen.

### 14.1 Agentische Synchronisation

Verankere in `AGENTS.md`:

Wenn sich die tatsächliche Funktionalität, Architektur, Berechnungslogik oder das Austauschformat ändert, aktualisiert der implementierende Agent die betroffenen Dokumente im selben Arbeitsgang.

Es darf keine separate spätere Dokumentationsphase erforderlich sein.

Dokumentiere nur relevante Änderungen.

Keine redundante Wiederholung derselben Information in mehreren Dokumenten.

### 14.2 Technische Synchronisation

Implementiere:

`npm run docs:sync`

Dieser Befehl aktualisiert die automatisch generierten Dokumentationsabschnitte, insbesondere `docs/EXAMPLES.md`, aus dem tatsächlichen Code und den Test-Fixtures.

`npm run docs:check`

Dieser Befehl prüft mindestens:

- Alle erforderlichen Dokumente vorhanden.
- Relevante interne Dokumentationsverweise gültig.
- Generierte Beispiele konsistent mit der aktuellen Implementierung.
- Generierte Dokumentation aktuell.

Die Prüfung soll keine Dateien verändern.

Die Generierung muss reproduzierbar sein, ohne zeitabhängige oder zufällige Unterschiede.

Die Konsistenzprüfung wird in `npm run verify` integriert.

Wichtig: Eine technische Prüfung kann nicht beweisen, dass frei formulierte Dokumentation fachlich vollständig aktuell ist. Dafür bleibt die agentische Synchronisationsregel verbindlich.

Keine überkomplexe Dokumentationspipeline bauen.

---

## 15. Code- und Datensicherheit

Trotz rein lokaler Anwendung sind robuste Sicherheitsregeln einzuhalten.

Mindestens:

- Eingaben konsequent validieren.
- Importierte Daten als nicht vertrauenswürdig behandeln.
- Kein `eval`.
- Keine dynamische Ausführung importierter Inhalte.
- Keine unkontrollierte `innerHTML`-Verwendung für Benutzerdaten.
- DOM-Inhalte sicher mit geeigneten APIs erzeugen.
- Keine unkontrollierte Datei- oder Speicherverarbeitung.
- Keine Netzwerkkommunikation mit Finanzdaten.
- Keine unnötigen Browserberechtigungen.
- Keine dauerhaften Debug-Ausgaben mit Finanzdaten.
- Klare Fehlerbehandlung bei Speicherproblemen.
- Keine Abhängigkeit von Online-Diensten.

Setze sinnvolle Größenlimits für Eingaben und Importdateien.

Berücksichtige, dass Finanzdaten auf gemeinsam genutzten Geräten über den Browser zugänglich sein können.

---

## 16. Nicht gewünschte Funktionen

Implementiere ausdrücklich nicht:

- Benutzerkonten.
- Login.
- Backend.
- Datenbanksystem.
- Synchronisation über mehrere Geräte.
- Cloudspeicherung.
- Bankanbindung.
- Depotanbindung.
- Automatische Geldtransaktionen.
- Spartöpfe pro Ziel.
- Haushaltsbuch.
- Ausgabenkategorisierung.
- Einnahmen-/Ausgabenanalyse.
- Kreditplanung.
- Schuldenverwaltung.
- Versicherungsverwaltung.
- Steuerberechnungen.
- Inflationssimulation.
- Kapitalmarktmodellierung.
- KI-Integration.
- Chatbot.
- Benachrichtigungssystem.
- Automatische Kalenderintegration.
- Mehrbenutzerbetrieb.
- Komplexe Wiederholungsregeln.
- Umfangreiche Themes.
- Pluginsystem.
- Frameworkartige Erweiterungsarchitektur.

Insbesondere darf nicht aus vorsorglicher Zukunftssicherheit eine komplexe Softwareplattform entstehen.

Erweiterbarkeit entsteht durch saubere Modulgrenzen, nicht durch möglichst viele Abstraktionen.

---

## 17. Implementierungsstrategie

Arbeite in sinnvollen, kleinen, überprüfbaren Schritten.

Empfohlene Reihenfolge:

### Schritt 1: Projektgrundlage

- Projektstruktur.
- AGENTS.md.
- Agentenregeln.
- Entwicklungsserver.
- ESLint.
- Testinfrastruktur.
- Grundlegende Dokumentation.

### Schritt 2: Fachlicher Berechnungskern

- Datenvalidierung.
- Kalenderarithmetik.
- Zieltermine und Wiederholungen.
- Rückwärtsberechnung.
- Finanzierbarkeit.
- Monatlicher Cashplan.
- Finanzierungslücken.
- Szenarien.

Implementiere hier zuerst umfassende Tests.

Der fachliche Berechnungskern muss ohne Browser ausführbar sein.

### Schritt 3: Datenhaltung

- LocalStorage.
- JSON-Export.
- JSON-Import.
- Versionsverwaltung des Datenformats.
- Validierung.
- Fehlerbehandlung.

### Schritt 4: Benutzeroberfläche

- Einstellungen.
- Zielverwaltung.
- Finanzielle Zusammenfassung.
- Monatsvorschau.
- Szenariowechsel.
- Diagramm.
- Responsive Gestaltung.

### Schritt 5: Qualitätssicherung

- Unit-Tests.
- Integrationstests.
- Prüfung fachlicher Invarianten.
- Browser-Smoke-Tests.
- Prüfung der deutschen Benutzeroberfläche.
- Prüfung von Tastaturbedienung und mobiler Darstellung.
- Dokumentationssynchronisation.
- Linting.
- Vollständige Regressionstests.

Die Schritte sind eine sinnvolle Reihenfolge, kein bürokratischer Freigabeprozess.

Arbeite bis zur vollständigen Umsetzung.

Behebe gefundene Fehler eigenständig.

Lege keine unnötigen Roadmap-, Status- oder Review-Dokumente an.

Nutze vorhandene Git-Funktionen zur Änderungsverfolgung.

Commits sind nur für überprüfte, konsistente Änderungen sinnvoll. Kein automatisches Pushen oder Deployment.

---

## 18. Fachliche Abnahmekriterien

Die Anwendung gilt erst dann als fertig, wenn folgende Bedingungen erfüllt sind:

1. Ein Nutzer kann seinen aktuellen Cashbestand eingeben.
2. Er kann den monatlich verfügbaren Betrag festlegen.
3. Er kann eine Mindestreserve definieren.
4. Er kann einmalige Ziele anlegen.
5. Er kann jährlich wiederkehrende Ziele anlegen.
6. Er kann Ziele bearbeiten und löschen.
7. Er kann für Ziele zeitliche Spielräume definieren.
8. Das System berechnet den erforderlichen Cashbestand.
9. Es erkennt rechnerisch überschüssiges Cash.
10. Es erkennt nicht finanzierbare Ziele.
11. Es beziffert Finanzierungslücken korrekt.
12. Es berechnet zukünftige monatliche Cash-Zuführungen.
13. Es berechnet den verbleibenden Monatsbetrag für langfristige Anlagen.
14. Es berücksichtigt die Mindestreserve.
15. Es kann die zwei Cash-Szenarien darstellen.
16. Es stellt die Entwicklung übersichtlich auf einer Altersachse dar.
17. Es zeigt die kommenden monatlichen Cash-Zuführungen tabellarisch.
18. Es verarbeitet alle Berechnungen vollständig lokal.
19. Es speichert Daten automatisch im Browser.
20. Es kann vollständige Daten als JSON exportieren und importieren.
21. Es funktioniert ohne Backend und ohne Laufzeitbibliotheken.
22. Es besitzt umfassende, erfolgreiche automatisierte Tests.
23. Es besitzt funktionierendes Linting.
24. Es besitzt aktuelle fachliche und technische Dokumentation.
25. Es funktioniert auch bei typischen Fehleingaben kontrolliert.
26. Es ist für Nicht-Techniker verständlich und bedienbar.
27. Es funktioniert auf Desktop und Smartphone.
28. Es enthält keine unnötigen Funktionen außerhalb des beschriebenen Produktumfangs.

---

## 19. Abschließendes Audit

Führe nach der Implementierung eine unabhängige fachliche und technische Prüfung durch.

Ein separater Subagent darf dafür eingesetzt werden, wenn verfügbar und sinnvoll.

### Fachliches Audit

Prüfe insbesondere:

- Stimmt die Berechnungslogik?
- Sind sämtliche Ziele berücksichtigt?
- Sind die Monatskonventionen konsistent?
- Sind die Cashüberschüsse korrekt?
- Sind Finanzierungslücken korrekt?
- Gibt es Fälle, in denen eine unzulässige Sparrate ausgegeben wird?
- Werden Ergebnisse durch Verschiebungen oder den Planungshorizont verfälscht?
- Stimmen Diagramm, Tabelle und numerische Ergebnisse überein?

### Technisches Audit

Prüfe:

- Unnötige Architekturkomplexität.
- Übergroße Dateien oder Funktionen.
- Unnötige Abstraktionen.
- Toten Code.
- Doppelte Logik.
- Schwache Fehlerbehandlung.
- Sicherheitsprobleme.
- Fehlende Tests.
- Unzureichende Modultrennung.
- Unnötige Abhängigkeiten.
- Nicht aktualisierte Dokumentation.

Das Audit soll echte Defekte und Wartbarkeitsprobleme finden.

Keine rein kosmetischen Umgestaltungen ohne konkreten Nutzen.

Gefundene relevante Probleme beheben und erneut prüfen.

---

## 20. Gewünschtes Endergebnis

Liefere ein vollständig funktionsfähiges Projekt namens **CashflowPlanner**.

Erwartet werden:

- Lauffähige statische Webanwendung.
- Vollständiger Quellcode.
- Durchdachte Projektstruktur.
- `AGENTS.md` und projektspezifische Agentenregeln.
- Automatisierte Tests.
- ESLint-Konfiguration.
- Automatische Dokumentationssynchronisation.
- Verständliche README.
- Vollständige fachliche Berechnung.
- Intuitive deutschsprachige Benutzeroberfläche.
- Funktionierender JSON-Import und -Export.

Die README muss erklären:

- Was die Anwendung tut.
- Was sie bewusst nicht tut.
- Wie sie lokal gestartet wird.
- Wie Tests und Qualitätsprüfungen ausgeführt werden.
- Wie eine statische Bereitstellung erfolgt.
- Wo die fachliche Berechnung dokumentiert ist.

Führe zum Abschluss `npm run verify` aus und überprüfe die Anwendung zusätzlich im Browser, soweit die Entwicklungsumgebung dies ermöglicht.

Berichte abschließend kurz:

- Welche Funktionen implementiert wurden.
- Welche Prüfungen tatsächlich erfolgreich ausgeführt wurden.
- Ob es bekannte Einschränkungen gibt.
- Welche fachlichen Annahmen wesentlich sind.

**Leitgedanke für die gesamte Entwicklung:**

CashflowPlanner soll nicht möglichst viele Finanzfunktionen besitzen.

Er soll eine einzige Frage außergewöhnlich zuverlässig, verständlich und einfach beantworten:

**„Wie viel Cash brauche ich jetzt, und wie viel muss ich künftig monatlich zurücklegen, damit meine finanziellen Ziele erreichbar bleiben und ich den Rest langfristig investieren kann?“**

Entwickle die einfachste robuste Anwendung, die dieses Problem vollständig löst.
