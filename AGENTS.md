# CashflowPlanner: Arbeitsregeln

CashflowPlanner ist ein vollständig clientseitiger Liquiditätsplaner mit einem gemeinsamen Cashbestand. Er berechnet den minimal notwendigen Cashbedarf und künftige monatliche Cash-Zuführungen. Fachliche Verträge stehen in [Produkt](docs/PRODUCT.md) und [Algorithmus](docs/ALGORITHM.md); der Code ist für das tatsächliche Verhalten maßgeblich und die Dokumentation muss mit ihm übereinstimmen.

Lies nur aufgabenrelevante Dateien und analysiere vorhandenen Code vor Änderungen. Ändere nur betroffene Komponenten, bevorzuge einfache lokale Lösungen und füge keine Funktionen außerhalb des Auftrags hinzu. Verwende Subagenten nur bei echtem Nutzen. Überschreibe keine fremden oder nicht zur Aufgabe gehörenden Änderungen. Dokumentiere relevante fachliche Entscheidungen und aktualisiere betroffene Dokumente im selben Arbeitsgang, wenn Funktionalität, Architektur, Algorithmus oder Datenformat geändert werden.

Bei Finanzmathematik und Datenmodell gilt [.agents/rules/domain.md](.agents/rules/domain.md), bei Implementierung und Refactoring [.agents/rules/code-quality.md](.agents/rules/code-quality.md), bei UI-Arbeit [.agents/rules/ui.md](.agents/rules/ui.md).

Führe betroffene Tests und den Linter aus, bei relevanten Änderungen die vollständige Suite und `npm run docs:check`. Melde nur nachweislich erfolgreiche Prüfungen und keine unvollständige Änderung als fertig. Neue Abhängigkeiten brauchen einen konkreten Nutzen. Keine automatische externe Veröffentlichung.

Committe abgeschlossene, aufgabenbezogene Änderungen nach erfolgreichen erforderlichen Prüfungen automatisch in einem fokussierten Commit, sofern der Nutzer nichts anderes wünscht. Nimm nur Dateien der Aufgabe auf und lasse fremde Änderungen unberührt. Schlagen erforderliche Prüfungen fehl, behebe die Ursache oder lasse den Commit aus und nenne den Grund.
