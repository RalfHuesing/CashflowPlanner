# CashflowPlanner

CashflowPlanner beantwortet eine Frage: Wie viel Cash wird heute und in den kommenden Monaten für geplante Ausgaben benötigt, und welcher Teil des monatlich verfügbaren Betrags bleibt für langfristige Anlagen frei? Einmalige und jährlich wiederkehrende Ziele teilen sich einen gemeinsamen Cashbestand. Jährliche Ziele können optional einen letzten Zahlungsmonat haben. Übersicht, Zielverwaltung und Zeitplan sind getrennte Ansichten; große Ziellisten lassen sich durchsuchen und seitenweise anzeigen. Die Rechnung erfolgt vollständig im Browser, ohne Konto, Backend oder Laufzeitbibliotheken.

## Start

Node.js ab Version 22 ist nur für Entwicklung und Tests erforderlich.

```sh
npm ci
npm run dev
```

Anschließend `http://127.0.0.1:4173` öffnen. Für eine statische Bereitstellung genügt der Inhalt von `web/` auf einem beliebigen statischen Webserver. Es ist kein Build-Schritt erforderlich.

Für Hetzner mit Apache 2.4 liegt eine passende [`.htaccess`](web/.htaccess) im Verzeichnis `web/`. Sie wird zusammen mit `index.html` in das Document Root der Subdomain kopiert und setzt eine Content Security Policy und weitere Sicherheitsheader. Vor der Veröffentlichung muss ein gültiges HTTPS-Zertifikat für die Subdomain aktiv sein; die HTTPS-Weiterleitung wird im Hetzner SSL Manager eingeschaltet. So entsteht keine doppelte Weiterleitung in der `.htaccess`. Die Datei setzt HSTS nur bei HTTPS und ohne `includeSubDomains`. Der Webserver muss `mod_headers` und `.htaccess`-Direktiven mit `AllowOverride FileInfo` zulassen. Nach dem Hochladen die Weiterleitung und Header mit `curl -I http://DEINE-SUBDOMAIN/` und `curl -I https://DEINE-SUBDOMAIN/` prüfen; die Anwendung selbst wird dadurch nicht veröffentlicht.

## Prüfen

```sh
npm run lint
npm test
npm run test:coverage
npm run docs:sync
npm run docs:check
npm run verify
```

`docs:sync` erzeugt [Beispielpläne](docs/EXAMPLES.md) aus Test-Fixtures und Berechnungskern. `docs:check` prüft Dokumentationsverweise und die Aktualität dieser Datei, ohne Dateien zu ändern.

## Umfang und Grenzen

Zielbeträge und die Mindestreserve werden als heutige Eurobeträge erfasst und bis zum jeweiligen Monat mit dem einstellbaren jährlichen Inflationssatz hochgerechnet (Vorgabe 2 %, 0 % schaltet die Hochrechnung aus). Geldbeträge werden auf Cent gerundet. Der monatlich verfügbare Betrag bleibt als fester Eurobetrag über den gesamten Zeitraum unverändert. Der einzige Plan legt Cash so spät wie möglich zurück. Falls der Bestand und der feste Monatsbetrag nicht für den gesamten Horizont reichen, zeigt die Anwendung den ersten Engpass und einen Verlauf bei voller monatlicher Zuführung. Zinsen und Renditen werden nicht berechnet. CashflowPlanner plant keine Depotverkäufe, Kredite, Transaktionen oder Konten. Daten werden lokal im Browser gespeichert; ein JSON-Export dient als manuelle Sicherung. Auf gemeinsam genutzten Geräten sind lokale Browserdaten zugänglich.

Fachliche Details: [Produkt](docs/PRODUCT.md), [Algorithmus](docs/ALGORITHM.md), [Architektur](docs/ARCHITECTURE.md), [Datenformat](docs/DATA_FORMAT.md).
