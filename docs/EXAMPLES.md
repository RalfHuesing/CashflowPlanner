# Beispielszenarien

Automatisch aus `tests/fixtures/scenarios.json` und dem aktuellen Berechnungskern erzeugt. Nicht manuell bearbeiten.

## Referenz: Urlaub und zwei Autos

Startmonat: 2026-10; Alter: 40 bis 56 Jahre.

Cash heute: 40.000,00 €; monatlich verfügbar: 500,00 €; Mindestreserve: 0,00 €.

| Ziel | Betrag | Erster Termin | Wiederholung | Spielraum |
|---|---:|---|---|---:|
| Urlaub | 5.000,00 € | 2027-10 | jährlich | ± 0 Monate |
| Erstes Auto | 40.000,00 € | 2032-10 | einmalig | ± 0 Monate |
| Zweites Auto | 20.000,00 € | 2042-10 | einmalig | ± 0 Monate |

Erforderlicher Cashbestand heute: **44.000,00 €**. Finanzierungslücke: **4.000,00 €**. Rechnerisch freigebbar: **0,00 €**. Plan: **nicht finanzierbar**.

Erster kritischer Monat im Maximalzuführungsverlauf: 2042-10.

## Kleines erreichbares Ziel

Startmonat: 2026-10; Alter: 40 bis 41 Jahre.

Cash heute: 2.000,00 €; monatlich verfügbar: 200,00 €; Mindestreserve: 500,00 €.

| Ziel | Betrag | Erster Termin | Wiederholung | Spielraum |
|---|---:|---|---|---:|
| Reise | 1.000,00 € | 2027-04 | einmalig | ± 2 Monate |

Erforderlicher Cashbestand heute: **500,00 €**. Finanzierungslücke: **0,00 €**. Rechnerisch freigebbar: **1.500,00 €**. Plan: **finanzierbar**.

## Überfällige importierte Ziele: heute nachholen, Jahresrhythmus erhalten

Startmonat: 2026-10; Alter: 40 bis 41 Jahre.

Cash heute: 1.500,00 €; monatlich verfügbar: 100,00 €; Mindestreserve: 200,00 €.

| Ziel | Betrag | Erster Termin | Wiederholung | Spielraum |
|---|---:|---|---|---:|
| Offene Anschaffung | 300,00 € | 2025-08 | einmalig | ± 0 Monate |
| Jahresausgabe im April | 1.000,00 € | 2020-04 | jährlich | ± 0 Monate |

Erforderlicher Cashbestand heute: **1.900,00 €**. Finanzierungslücke: **400,00 €**. Rechnerisch freigebbar: **0,00 €**. Plan: **nicht finanzierbar**.

Erster kritischer Monat im Maximalzuführungsverlauf: 2027-04.
