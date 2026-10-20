# Berechnung

## Zeit und Eingaben

Der aktuelle Kalendermonat ist `t = 0`. Cash ist der heute tatsächlich vorhandene Betrag. In diesem Monat fällige, noch offene Ziele werden daraus bezahlt; es gibt keine neue monatliche Zuführung. Ab `t = 1` erfolgt die Zuführung vor den Monatsausgaben. Monatsendstände werden danach ausgewiesen. Das Alter dient nur der näherungsweisen Achsenbeschriftung, weil kein Geburtsdatum erfasst wird. Geld ist eine sichere ganzzahlige Centzahl; Einzelbeträge sind begrenzt. `M` (monatlich verfügbar) bleibt nominal konstant; Zinsen, Steuern und weitere Einnahmen werden nicht berücksichtigt.

Einmalige Ziele erzeugen ein Ausgabenereignis zum Wunschtermin. Liegt dieser vor dem Startmonat, gilt das Ziel als noch offen und wird genau einmal in `t = 0` eingeplant. Jährliche Ziele erzeugen ab ihrer ersten Fälligkeit alle zwölf Monate ein Ereignis. Ein optionaler Endmonat begrenzt diese Termine einschließlich des Endmonats; ohne ihn gelten Wiederholungen bis zum Planungshorizont. Liegt ein Jahrestermin in der Vergangenheit, wird genau eine offene Ausgabe in `t = 0` nachgeholt, auch wenn die Reihe inzwischen beendet ist; spätere reguläre Jahrestermine bleiben im ursprünglichen Kalendermonat und müssen vor dem Endmonat oder in ihm liegen. Fällt ein regulärer, noch gültiger Termin bereits in `t = 0`, entsteht kein zweites Ereignis. Ältere versäumte Jahre werden mangels Zahlungsstatus nicht rückwirkend summiert. Überfällige Ereignisse werden sichtbar gekennzeichnet. Ausgaben desselben Monats werden addiert. Ziele nach dem Horizont werden ausdrücklich ausgewiesen. Der normale Plan verschiebt keine Termine.

Jeder eingegebene Zielbetrag `A` gilt in heutigen Euro. Mit dem jährlichen Inflationssatz `p` (Basispunkte `inflationBps`, 200 = 2 %) wird ein Ereignis im Zahlungsmonat `t` zu `Runde_auf_Cent(A × (1 + p/100)^(t/12))`. Der Standard ist 2 % pro Jahr; `0` lässt den Betrag unverändert. Ein heute nachgeholtes, überfälliges Ziel hat `t = 0` und wird nicht rückwirkend hochgerechnet. Erst die gerundeten Ereignisbeträge werden zu `E[t]` addiert. Überschreiten Ergebnisse den sicheren Zahlenbereich, wird die Berechnung abgelehnt. Auch die Mindestreserve `R` wird ab dem Startmonat mit diesem Inflationssatz hochgerechnet: `R[t] = Runde_auf_Cent(R × (1 + p/100)^(t/12))`. Der monatlich verfügbare Betrag `M` wird nicht hochgerechnet.

## Mindestbedarf

`H` ist der letzte Planungsmonat, `R[t]` die Mindestreserve in Monat `t` (bei Inflation jährlich aufgezinst), `M` der maximal monatlich verfügbare Cashbeitrag und `E[t]` die Summe der Ausgaben in Monat `t`. `F[t]` ist der am Ende von `t` mindestens nötige Bestand für alle späteren Ziele. Es gilt:

```text
F[H] = R[H]
F[t-1] = max(R[t-1], F[t] + E[t] - M), für t = H … 1
Cash_erforderlich_heute = E[0] + F[0]
Lücke_heute = max(0, Cash_erforderlich_heute - Cash_aktuell)
```

Die Formel rechnet die maximal möglichen künftigen Zuführungen rückwärts ein. Sie liefert das minimale Startkapital für **alle Ziele bis zum Planungshorizont** unter den Modellannahmen; es ist nicht der Betrag der heutigen Ausgaben oder eine pauschale Empfehlung, diese Summe heute vorzuhalten. Für einen 60-jährigen Horizont kann dieser Modellwert groß werden, wenn Zielausgaben jährlich steigen, `M` aber fest bleibt. Die Oberfläche trennt deshalb aktuelle Ausgaben, tatsächlichen Cashbestand, langfristigen Modellbedarf und ersten Engpass.

## Monatsplan und Unterdeckung

Bei finanzierbarem Plan wird Cash so spät wie möglich zurückgelegt. Für jeden künftigen Monat:

```text
Sparrate[t] = max(0, F[t] + E[t] - Cash[t-1])
Cash[t] = Cash[t-1] + Sparrate[t] - E[t]
Langfristig_verfügbar[t] = M - Sparrate[t]
```

Ein gültiger Plan hält stets `0 <= Sparrate[t] <= M` und `Cash[t] >= R[t]` nach jeder Ausgabe. Der einzige Plan startet mit dem tatsächlichen Cashbestand, nimmt keine Entnahme an und legt Cash so spät wie möglich zurück. Ist der Anfangsbestand unter den Modellannahmen unzureichend, zeigt die Anwendung die langfristige Modelllücke und den ersten kritischen Monat. Ein Verlauf mit voller monatlicher Zuführung dient dann nur zur Illustration und wird nicht als finanzierbarer Sparplan ausgegeben.

## Termine und Grenzen

Der Plan verwendet ausschließlich die gespeicherten Fälligkeiten. Ein in älteren Dateien gespeicherter `flexMonths`-Wert bleibt für den Import erhalten, verschiebt aber keine Zahlung. Heute fällige und überfällige Ausgaben werden heute aus dem vorhandenen Cashbestand bezahlt.

Die Rechnung endet am gewählten Horizont. Spätere Ausgaben und spätere Wiederholungen liegen außerhalb der Aussage. Ein nominales, konstantes Monatsbudget und ein konstanter Inflationssatz sind keine Prognose künftiger Erträge oder Lebenshaltungskosten.
