# Berechnung

## Zeit und Eingaben

Der aktuelle Kalendermonat ist `t = 0`. Cash ist der heute tatsächlich vorhandene Betrag. In diesem Monat fällige, noch offene Ziele werden daraus bezahlt; es gibt keine neue monatliche Zuführung. Ab `t = 1` erfolgt die Zuführung vor den Monatsausgaben. Monatsendstände werden danach ausgewiesen. Das Alter dient nur der näherungsweisen Achsenbeschriftung, weil kein Geburtsdatum erfasst wird. Geld ist eine sichere ganzzahlige Centzahl; Einzelbeträge sind begrenzt. `M` (monatlich verfügbar) und alle Ziele sind nominal, ohne Zinsen, Inflation, Steuern oder weitere Einnahmen.

Einmalige Ziele erzeugen ein Ausgabenereignis zum Wunschtermin. Liegt dieser vor dem Startmonat, gilt das Ziel als noch offen und wird genau einmal in `t = 0` eingeplant. Jährliche Ziele erzeugen ab ihrer ersten Fälligkeit alle zwölf Monate ein Ereignis. Liegt ein Jahrestermin in der Vergangenheit, wird genau eine offene Ausgabe in `t = 0` nachgeholt; künftige reguläre Jahrestermine bleiben im ursprünglichen Kalendermonat. Fällt ein regulärer Termin bereits in `t = 0`, entsteht kein zweites Ereignis. Ältere versäumte Jahre werden mangels Zahlungsstatus nicht rückwirkend summiert. Überfällige Ereignisse werden sichtbar gekennzeichnet. Ausgaben desselben Monats werden addiert. Ziele nach dem Horizont werden ausdrücklich ausgewiesen. Der normale Plan verschiebt keine Termine.

## Mindestbedarf

`H` ist der letzte Planungsmonat, `R` die Mindestreserve, `M` der maximal monatlich verfügbare Cashbeitrag und `E[t]` die Summe der Ausgaben in Monat `t`. `F[t]` ist der am Ende von `t` mindestens nötige Bestand für alle späteren Ziele. Es gilt:

```text
F[H] = R
F[t-1] = max(R, F[t] + E[t] - M), für t = H … 1
Cash_erforderlich_heute = E[0] + F[0]
Lücke_heute = max(0, Cash_erforderlich_heute - Cash_aktuell)
Freigebbar_heute = max(0, Cash_aktuell - Cash_erforderlich_heute)
```

Die Formel rechnet die maximal möglichen künftigen Zuführungen rückwärts ein. Sie liefert den minimalen heutigen Bestand unter den Modellannahmen. „Freigebbar“ bedeutet nur: Selbst nach einer hypothetischen Entnahme dieses Betrags kann der Plan mit künftig nötigen Zuführungen rechnerisch finanziert werden. Es ist keine Anlageempfehlung und keine tatsächliche Transaktion.

## Monatsplan und Unterdeckung

Bei finanzierbarem Plan wird Cash so spät wie möglich zurückgelegt. Für jeden künftigen Monat:

```text
Sparrate[t] = max(0, F[t] + E[t] - Cash[t-1])
Cash[t] = Cash[t-1] + Sparrate[t] - E[t]
Langfristig_verfügbar[t] = M - Sparrate[t]
```

Ein gültiger Plan hält stets `0 <= Sparrate[t] <= M` und `Cash[t] >= R` nach jeder Ausgabe. Szenario A startet mit dem tatsächlichen Cashbestand. Szenario B zieht nur den rechnerisch freigebbaren Überschuss sofort und ausdrücklich hypothetisch ab. Beide planen danach nach derselben Formel. Ist der Anfangsbestand unzureichend, zeigt die Anwendung die Mindestlücke und den ersten kritischen Monat; ein Maximalzuführungsverlauf kann zur Illustration dienen, wird aber nicht als gültiger Sparplan ausgegeben.

## Flexible Termine und Grenzen

Wenn der Wunschplan nicht finanzierbar ist, kann eine theoretische Variante mit der maximal zulässigen späteren Verschiebung flexibler Ziele geprüft werden. Sie bleibt gekennzeichnet; gespeicherte Wunschtermine ändern sich nicht. Nachgeholte überfällige Ausgaben bleiben auch hier heute fällig. Nur künftige reguläre Jahresereignisse können gemeinsam verschoben werden; sie behalten untereinander ihren Zwölfmonatsabstand. Kein bereits berücksichtigtes Ereignis darf über den Horizont geschoben werden, um es verschwinden zu lassen. Diese Variante prüft die grundsätzliche Wirksamkeit des Spielraums und sucht keine global optimale Kombination einzelner Verschiebungen.

Die Rechnung endet am gewählten Horizont. Spätere Ausgaben und spätere Wiederholungen liegen außerhalb der Aussage. Ein nominales, konstantes Monatsbudget ist keine Prognose künftiger Erträge oder Lebenshaltungskosten.
