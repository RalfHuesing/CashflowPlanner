# Cashflow-Planner

Cashflow-Planner beantwortet eine Frage: Wie viel Cash wird heute und in den kommenden Monaten für geplante Ausgaben benötigt, und welcher Teil des monatlich verfügbaren Betrags bleibt für langfristige Anlagen frei? Einmalige und jährlich wiederkehrende Ziele teilen sich einen gemeinsamen Cashbestand. Jährliche Ziele können optional einen letzten Zahlungsmonat haben. Übersicht, Zielverwaltung und Zeitplan sind getrennte Ansichten; große Ziellisten lassen sich durchsuchen und seitenweise anzeigen. Die Rechnung erfolgt vollständig im Browser, ohne Konto, Backend oder Laufzeitbibliotheken.

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
npx playwright install chromium
npm run test:e2e
npm run docs:sync
npm run docs:check
npm run verify
```

`docs:sync` erzeugt [Beispielpläne](docs/EXAMPLES.md) aus Test-Fixtures und Berechnungskern. `docs:check` prüft Dokumentationsverweise und die Aktualität dieser Datei, ohne Dateien zu ändern.

Die Browserinstallation ist einmalig erforderlich. `test:e2e` prüft Zielverwaltung, Import/Export, Dialogbedienung, Monatsabgleich, Löschung und Druckansicht mit einem lokalen Chromium. Die produktive Website benötigt Playwright nicht.

## Suche und Linkvorschau

SEO-Metadaten, Canonical, `social-preview.png`, `robots.txt` und `sitemap.xml` werden mit `web/` ausgeliefert. Änderungen werden nicht automatisch veröffentlicht.

Nach dem Hochladen in der [Google Search Console](https://search.google.com/search-console/):

1. Eine vorhandene **Domain-Property `huesing.info`** verwenden; sie umfasst die Planner-Subdomain. Alternativ eine **URL-Präfix-Property `https://cashflow-planner.huesing.info/`** hinzufügen und nach Googles Anleitung bestätigen.
2. Die vollständige Planner-URL mit der URL-Prüfung live testen und einmal die Indexierung beantragen.
3. Unter „Sitemaps“ `https://cashflow-planner.huesing.info/sitemap.xml` einreichen.

Eine Domain-Property wird per DNS bestätigt. Bei einer HTML-Dateibestätigung der URL-Präfix-Property gehört die unveränderte Google-Datei in das Document Root der Planner-Subdomain. Kein Analytics-Skript erforderlich. Weitere Details: [Property-Arten](https://support.google.com/webmasters/answer/34592?hl=de) und [URL-Prüfung](https://support.google.com/webmasters/answer/9012289?hl=de).

## Umfang und Grenzen

Zielbeträge und die Mindestreserve werden als heutige Eurobeträge erfasst und bis zum jeweiligen Monat mit dem einstellbaren jährlichen Inflationssatz hochgerechnet (Vorgabe 2 %, 0 % schaltet die Hochrechnung aus). Geldbeträge werden auf Cent gerundet. Der monatlich verfügbare Betrag bleibt als fester Eurobetrag über den gesamten Zeitraum unverändert. Der einzige Plan legt Cash so spät wie möglich zurück. Falls der Bestand und der feste Monatsbetrag nicht für den gesamten Horizont reichen, zeigt die Anwendung den ersten Engpass und einen Verlauf bei voller monatlicher Zuführung. Zinsen und Renditen werden nicht berechnet. Cashflow-Planner plant keine Depotverkäufe, Kredite, Transaktionen oder Konten. Daten werden lokal im Browser gespeichert; ein JSON-Export dient als manuelle Sicherung. Auf gemeinsam genutzten Geräten sind lokale Browserdaten zugänglich.

Fachliche Details: [Produkt](docs/PRODUCT.md), [Algorithmus](docs/ALGORITHM.md), [Architektur](docs/ARCHITECTURE.md), [Datenformat](docs/DATA_FORMAT.md).
