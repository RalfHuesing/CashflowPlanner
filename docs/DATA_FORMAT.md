# Datenformat

Die Eingaben werden als versioniertes JSON exportiert. Beispiel:

```json
{
  "format": "cashflow-planner",
  "version": 1,
  "exportedAt": "2026-10-20T12:00:00.000Z",
  "data": {
    "settings": {
      "cashCents": 4000000,
      "monthlyCents": 50000,
      "reserveCents": 0,
      "currentAge": 35,
      "horizonAge": 60
    },
    "goals": [{
      "id": "auto-1",
      "name": "Auto",
      "amountCents": 4000000,
      "type": "once",
      "dueMonth": "2032-10",
      "flexMonths": 6
    }],
    "cashUpdatedAt": "2026-10-20T12:00:00.000Z"
  }
}
```

Alle Beträge sind ganzzahlige Centwerte. Cash, monatlicher Betrag und Reserve sind nicht negativ, Ziele haben einen positiven Betrag. Jeder Einzelbetrag ist auf 10.000.000.000 Cent begrenzt, also 100 Millionen Euro. Alter und Horizont sind ganze Jahre von 0 bis 120; der Horizont darf nicht vor dem aktuellen Alter liegen. `type` ist `once` oder `annual`, `dueMonth` ein gültiger Kalendermonat `JJJJ-MM`, `flexMonths` ein ganzzahliger Wert von 0 bis 1200. Zielnamen sind nicht leer und höchstens 120 Zeichen lang; IDs sind eindeutig und höchstens 100 Zeichen lang. Höchstens 1.000 Ziele und 1 MB Importdatei sind zulässig.

`cashUpdatedAt` ist ein UTC-Zeitstempel oder `null`; er dokumentiert, wann der tatsächliche Cashbestand eingegeben wurde. `exportedAt` dokumentiert nur den Export. Vergangene `dueMonth`-Werte sind gültig; sie werden als noch offene Zahlung im aktuellen Monat behandelt. Ein Zahlungsstatus wird nicht gespeichert. Prognostizierte Cashstände und andere Rechenergebnisse gehören nicht in die Datei. Der LocalStorage-Eintrag trägt zusätzlich eine eigene Version und einen Speicherzeitstempel.

Ein Import akzeptiert ausschließlich das beschriebene Format mit Version 1 und allen Pflichtfeldern. Falsche Typen, unbekannte Felder, doppelte IDs und ungültige Werte werden vollständig zurückgewiesen. Erst nach erfolgreicher Validierung und Bestätigung dürfen vorhandene Eingaben ersetzt werden. Es gibt derzeit keine Migration älterer Versionen; unbekannte Versionen werden kontrolliert abgelehnt.
