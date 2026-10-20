## 1. Executive Summary & Gesamteindruck (TL;DR)

### Gesamtnote aus Nutzersicht (Persona Julian, 35): **2,7 (Befriedigend+)**

**Begründung:**
Der **Cashflow-Planner** löst ein hochrelevantes, im deutschsprachigen DIY-Finanzbereich (ETF-Sparer, *r/Finanzen*-, *Finanzfluss*- und *Finanztip*-Zielgruppe) bisher sträflich vernachlässigtes Problem: die Brücke zwischen kurz- bis mittelfristiger Liquiditätsplanung (Tagesgeld) und langfristiger Investitionsquote (ETF-Sparplan). Die mathematische Kernidee – ein gemeinsamer Cash-Pool mit Just-in-Time-Rückwärtsprojektion statt toter Kapitalbindung in 10 virtuellen Unterkonten („Spartöpfen“) – ist brillant.

Dass es (noch) nicht für ein „Sehr gut“ reicht, liegt nicht am Rechenkern, sondern an der **Übersetzung der Mathematik in ein intuitives mentales Modell** sowie einer **zersplitterten Informationsarchitektur**. Das Tool zwingt Julian aktuell zu häufigem Tab-Wechsel zwischen Parametern, Zielen und Auswertungen („Pogo-Sticking“) und verunsichert ihn an entscheidenden Stellen durch sperrige, teils widersprüchlich erklärte Kennzahlen (insbesondere beim *„Heute nötigen Cashbestand“* und der Behandlung des aktuellen Kalendermonats).

---

### Die 3 größten Stärken des Produkts

1. **Messerscharfe Value Proposition & Philosophische Klarheit:**
Der Leitgedanke *„So wenig Cash wie möglich, so viel wie nötig“* trifft Julians Schmerzpunkt auf den Punkt. Die Dreiteilung auf der Startseite (*1. Gemeinsamer Cashbestand → 2. Vorausschauende Projektion → 3. Freie Sparrate ermitteln*) erklärt ein finanzmathematisch anspruchsvolles Optimierungsproblem in unter 20 Sekunden.
2. **Radikaler Pragmatismus & „Local-First“-Vertrauensbonus:**
Kein Registrierungszwang, kein Cloud-Zwang, keine überladene Kategorisierung von Kaffeekonsum und Supermarkt-Belegen. Die Fokussierung auf den *verfügbaren Überschuss nach Fixkosten* und die lokale Speicherung im Browser senken die Einstiegshürde auf null.
3. **Saubere, barrierearme Code- und UI-Basis:**
Die Web-App ist technisch schlank, schnell, semantisch sauber aufgebaut (inkl. ARIA-Labels, Status-Rollen und Tastaturfokus) und verzichtet auf unnötigen visuellen Ballast. Die Trennung zwischen Bestandsverlauf (`Zeitplan`) und Mittelverwendung (`Jahresplan`) beantwortet genau die zwei Kernfragen eines Investors.

---

### Die 3 größten Schwachstellen / Hürden

1. **Räumliche Trennung von Ursache und Wirkung (Tab-Isolation):**
Die Eingabe der `Ausgangslage` (im Tab `Übersicht`), das Anlegen der `Ziele` (im Tab `Ziele`) und die visuelle Kontrolle der Auswirkungen (`Zeitplan` / `Jahresplan`) liegen auf getrennten Hauptnavigations-Tabs. Wenn Julian an seinen Zielen schraubt, sieht er die Auswirkung auf seinen Cashflow nicht live, sondern muss blind zwischen Tabs hin- und herspringen.
2. **Kognitive Dissonanz bei den Kern-KPIs („Heute nötiger Cashbestand“ & „Aktueller Monat“):**
Kennzahlen und Hilfetexte widersprechen teilweise der intuitiven Nutzererwartung. Wenn ein Wert **„Heute nötiger Cashbestand“** heißt, das Kleingedruckte unter *„Wie wird gerechnet?“* aber warnt: *„Er ist ein Rechenwert und keine Empfehlung, diesen Betrag heute vorzuhalten“*, verliert Julian sofort das Vertrauen in seine eigene Interpretation der Zahlen. Zudem klammert die Logik den *aktuellen* Kalendermonat bei der Sparrate aus, obwohl Julian genau *heute* wissen will, wie er seine Sparrate für diesen Monat einstellen soll.
3. **Inflations-Falle (Asymmetrie zwischen Zielen und Monatsbetrag):**
Während zukünftige Ziele und die Mindestreserve automatisch mit der eingestellten Inflationsrate dynamisiert werden, bleibt der `Verfügbare Monatsbetrag` über den gesamten Planungshorizont **nominal eingefroren** (und der Tagesgeldzins liegt fix bei 0 %). Bei einem Horizont von 5 bis 15 Jahren schrumpft Julians Sparrate real jedes Jahr, was fast zwangsläufig zu einem künstlichen *„Fehlenden Cashbestand“* führt.

---

## 2. User Journey & „WTF-Momente“ (Detaillierte Kritik entlang der Dimensionen A–E)

### Phase 1: Landingpage (`#start`) – Value Proposition & Mental Model (Dimension A)

Julian öffnet die App. Das Hero-Element und die 3 Schritte holen ihn sofort ab. Er versteht sofort: *„Alles klar, statt jeden Monat stur 200 € für Urlaub, 150 € fürs Auto und 100 € für die Küche wegzulegen, nutze ich einen gemeinsamen Topf und fülle ihn erst dann auf, wenn die Ausgaben näher rücken.“*

* **Der erste kleine Reibungspunkt:**
Der Tab `⌂ Start` belegt dauerhaft Platz 1 der Hauptnavigation. Sobald Julian das Konzept einmal verstanden hat, ist dieser Tab reiner Ballast (statischer Erklärungstext ohne App-Funktionalität). Zudem konkurriert der dauerhaft sichtbare Top-Banner (*„DEINE LIQUIDITÄTSPLANUNG – Willkommen beim Cashflow-Planner“*) visuell mit den eigentlichen Arbeitsbereichen.

---

### Phase 2: Dateneingabe (`#uebersicht`) – Onboarding & First-Time UX (Dimension B)

Julian klickt auf `Zur Planung starten →` und landet im Tab `Übersicht`. Links sieht er `Ausgangslage`, rechts `Deine Auswertung`.

* **WTF-Moment #1: „Wo trage ich denn jetzt meine Küche und meinen Urlaub ein?“**
Julian gibt seinen heutigen Cashbestand (z. B. 12.000 € Tagesgeld), seinen verfügbaren Monatsbetrag (z. B. 1.200 € Sparfähigkeit für Cash + ETF) und seine Mindestreserve (z. B. 6.000 € Notgroschen) ein. Er schaut nach rechts auf `Deine Auswertung` – aber er hat noch `0` Ziele!
Auf dem Screen `Übersicht` gibt es keine direkte Liste seiner Ziele, sondern er muss erst erkennen, dass er oben in der Navigation auf den dritten Tab `◎ Ziele 0` wechseln muss, um überhaupt das Herzstück seiner Planung einzugeben. Für Erstnutzer fühlt sich ein Dashboard ohne angelegte Ziele leer und unvollständig an.
* **WTF-Moment #2: „Was genau ist mein ‚Verfügbarer Monatsbetrag‘?“**
Auf der Startseite wurde zwar erwähnt, dass Kreditraten und Fixkosten vorher abgezogen werden müssen. Direkt am Eingabefeld muss für Julian aber glasklar sein: **Ist das meine gesamte monatliche Sparrate (also Cash-Aufbau PLUS ETF-Sparplan zusammen)?** Ja, so rechnet das Modell. Viele ETF-Sparer denken aber umgekehrt: Sie haben bereits einen laufenden 800-€-ETF-Sparplan im Kopf und fragen sich, ob sie hier nur den „Rest“ eintragen sollen oder die Gesamtsumme vor ETF-Abzug.

---

### Phase 3: Auswertung (`#uebersicht`) – Mentale Hürden der Rückwärtsprojektion (Dimension A & B)

Nachdem Julian erste Zahlen eingegeben hat, liest er die Werte unter `Deine Auswertung` und klappt zur Sicherheit `<details>Wie wird gerechnet?</summary>` auf. Hier entstehen die größten Fragezeichen:

* **WTF-Moment #3: Das Paradoxon des „Heute nötigen Cashbestands“**
In der Erklärung liest Julian:
> *„Der heute nötige Cashbestand berechnet das benötigte Startkapital für Ziele über den gesamten Planungshorizont, unter Berücksichtigung der gleichbleibenden Monatszuführungen und der Mindestreserve. Er ist ein Rechenwert und keine Empfehlung, diesen Betrag heute vorzuhalten.“*


**Julians Reaktion:** *„Wie bitte?! Der Wert heißt wörtlich ‚Heute nötiger Cashbestand‘ – und im Hilfetext steht, es ist KEINE Empfehlung, diesen Betrag heute vorzuhalten? Was soll ich denn dann heute auf dem Tagesgeldkonto lassen?!“*
* **Warum das passiert (Diagnose):** Das Tool vermischt sprachlich zwei Konzepte:
1. Den **aktuell gebundenen Cashbestand** (Mindestreserve + der Teil des heutigen Bestands, der *zwingend* schon heute da sein muss, weil zukünftige Ausgaben-Spitzen größer sind als die bis dahin verfügbaren Monatsraten).
2. Den Wunsch des Nutzers nach einer klaren **Handlungsanweisung für heute**: *„Habe ich heute zu viel Cash auf dem Tagesgeld (Einmalanlage in ETF möglich) oder zu wenig (Fehlbetrag)?“*




* **WTF-Moment #4: Das „Aktueller-Monat-Loch“**
Weiter liest Julian unter *„Wie wird gerechnet?“*:
> *„Ab dem nächsten Kalendermonat erfolgt die Zuführung vor den Ausgaben. Offene Ausgaben im aktuellen Monat werden aus deinem heutigen Bestand bezahlt; für diesen Monat wird keine zusätzliche Sparrate angenommen.“*


**Julians Reaktion:** *„Ich habe heute am 28. mein Gehalt bekommen und will meinen Dauerauftrag für den 1. einstellen. Warum rechnet das Tool erst ab nächstem Monat mit einer Zuführung?“*
Aus mathematischer Sicht ist ein sauberer Stichtag (`heute = Bestandsaufnahme nach Gehaltseingang, Zuführung ab Folgemonat`) völlig legitim – aber aus Nutzersicht will Julian eine sofortige Zahl: **„Diesen/Nächsten Monat: X € aufs Tagesgeld, Y € in den ETF.“**

---

### Phase 4: Ziele anlegen & verwalten (`#ziele`) – Informationsarchitektur & Finanzielle Realität (Dimension C & D)

Julian wechselt in den Tab `◎ Ziele`.

* **WTF-Moment #5: Enterprise-Filter für 6 Ziele, aber kein „Was-wäre-wenn“-Schalter**
Julian legt 5 Ziele an: *Sommerurlaub (jährlich 3.000 €)*, *Auto-Inspektion (jährlich 800 €)*, *Neue Küche (in 3 Jahren, 12.000 €)*, *Neues Auto (in 7 Jahren, 25.000 €)*.
Er sieht oben ein Such-/Filterfeld, eine Sortier-Dropdown (`Fälligkeit`, `Bezeichnung`, `Betrag (absteigend)`) und unten eine Seitennavigation (`Seiten der Zielliste`). Für einen typischen Privathaushalt mit 5 bis 12 Zielen ist eine Pagination mit Sortierung überdimensioniert.
**Was Julian stattdessen schmerzlich vermisst:**
1. Er sieht im Tab `Ziele` **kein Live-Feedback**, ob das gerade eingetragene 25.000-€-Auto seinen Cashflow sprengt! Er muss erst wieder zurück zu `Übersicht` oder `Zeitplan` klicken.
2. Er kann ein Ziel nicht testweise per **Toggle/Checkbox („Aktiv / Pausiert“)** ein- und ausschalten, um zu sehen: *„Was passiert mit meiner freien ETF-Quote, wenn ich die Küche ein Jahr schiebe oder das Auto weglasse?“*


* **WTF-Moment #6: Wenn das Geld nicht reicht („Fehlender Cashbestand“)**
Julian stellt fest, dass sein Plan nicht aufgeht – es wird ein `Fehlender Cashbestand` gemeldet.
**Das Problem:** Das Tool zeigt zwar die rote Ampel (es fehlt Geld), benennt aber in der Übersicht und in der Zielliste nicht den **konkreten Verursacher-Monat (Engpass)** und bietet keine interaktive Entscheidungshilfe (*„Im April 2029 fehlen dir 1.850 € für ‚Neue Küche‘. Erhöhe deinen Monatsbetrag um 52 € oder verschiebe das Ziel auf Juni 2029.“*). Julian muss selbst in den `Zeitplan` oder `Monatsplan` abtauchen, um zu suchen, wann die Kurve des erforderlichen Bestands seinen Cashbestand übersteigt.
* **WTF-Moment #7: Die Inflations-Scheren-Falle**
Julian trägt pflichtbewusst `2,0 %` Inflation ein und plant seinen jährlichen Urlaub (3.000 €) über 20 Jahre. Im Hintergrund verteuert der Rechner den Urlaub und die Mindestreserve jedes Jahr um 2 %, friert aber Julians `Verfügbaren Monatsbetrag` von 1.200 € über 20 Jahre nominal ein. Im Jahr 15 kostet der Urlaub nominal über 4.000 €, während sein Monatsbudget immer noch bei 1.200 € klebt und das Tagesgeld 0 % Zinsen abwirft. Das Ergebnis: Die freien ETF-Quoten brechen in späteren Jahren drastisch ein, obwohl Julians Gehalt in der Realität mit der Inflation steigt.

---

### Phase 5: Zeitplan, Jahresplan & Monatsplan (`#zeitplan`, `#jahresplan`, `#monatsplan`) – Visualisierung (Dimension C)

Julian klickt sich durch die drei Auswertungs-Tabs:

1. **`Zeitplan` (`So entwickelt sich dein Cash`):**
Zeigt die 4 Größen `Cashbestand`, `Erforderlicher Bestand`, `Mindestreserve` und `Ausgabe`.
* *Kritik:* Die Gegenüberstellung von `Cashbestand` und `Erforderlicher Bestand` ist für Finanz-Nerds spannend, für Julian aber zunächst erklärungsbedürftig: Warum weicht mein `Cashbestand` vom `Erforderlichen Bestand` ab? (Weil man heute evtl. schon mehr Startkapital hat als rechnerisch nötig, das dann später abgeschmolzen wird). Ohne direkten visuellen Hinweis im Chart (*„Grüne Zone = Überschuss / Puffer, ab Monat X beginnt das Ansparen für Ziel Y“*) muss Julian die Legende erst gedanklich entschlüsseln.


2. **`Jahresplan` (`Monatsbetrag pro Jahr aufteilen`):**
**Das heimliche Highlight der App!** Hier sieht Julian endlich genau das, wofür er gekommen ist: `Übrig für Vermögensaufbau` vs. `In Cash zurückgelegt (für geplante Ausgaben)` plus die Detailtabelle mit der `freien Quote` pro Jahr.
* *Kritik:* Warum ist diese essenzielle Grafik („Wie viel geht in den ETF, wie viel in Cash?“) erst auf **Tab Nr. 5** versteckt, statt das zentrale Herzstück der `Übersicht` zu sein?


3. **`Monatsplan`:**
Eine granulare Tabelle aller Monate bis zum Planungsende. Gut als „Beweis-Tabelle“ zum Nachrechnen (ersetzt Julians Excel-Drang), aber als gleichwertiger Hauptnavigations-Tab fast zu prominent.

---

### Phase 6: Vertrauen, Datenschutz & Datensicherheit (Dimension E)

* **Das Versprechen „Lokal im Browser gespeichert“:**
Auf der Startseite und im Footer wird die lokale Datenhaltung klar kommuniziert. Das schafft bei Julian sofort hohe Sympathie.
* **Die UX-Lücke beim Backup:**
Der Hinweis *„Beim Löschen der Browserdaten kann sie verloren gehen. Sichere sie regelmäßig über ‚Exportieren‘.“* steht klein im Footer. Wenn Julian 10 Ziele angelegt hat und den Tab schließt, gibt es keinen sanften Impuls (*„Du hast 10 Ziele angelegt – sichere deinen Plan jetzt als Datei“*). Noch wichtiger: Der Hinweis im Footer *„Lokale Daten sind nicht automatisch verschlüsselt“* ist zwar juristisch/technisch ehrlich, klingt für Laien aber fast bedrohlich (als lägen ihre Daten ungeschützt im Internet, obwohl nur der lokale `localStorage` gemeint ist).

---

## 3. Konkrete UX/UI-Verbesserungsvorschläge (Actionable Backlog)

### A. Quick Wins (Hoher Impact bei geringem Entwicklungsaufwand)

| # | Bereich | Problem | Konkrete Lösung (Text / UI / Default) |
| --- | --- | --- | --- |
| **QW-1** | **Wording & KPIs (`Übersicht`)** | „Heute nötiger Cashbestand“ verwirrt in Kombination mit dem Disclaimer im Hilfetext massiv. | Umbenennen in **„Gebundener Cashbestand (heute)“** oder **„Mindest-Startkapital für deinen Plan“**. Darunter direkt als Klartext-Fazit ausgeben: **„Freies Einmal-Kapital heute: X.XXX €“** *(Dein heutiger Bestand abzüglich des gebundenen Bestands → kann sofort investiert werden)* bzw. **„Aktueller Fehlbetrag: X.XXX €“**. |
| **QW-2** | **Handlungsanweisung (`Übersicht`)** | Julian sucht die konkrete Zahl für seinen Dauerauftrag im nächsten Monat. | Eine prominente **Action-Box („Dein Plan für den nächsten Monat“)** ganz oben in `Deine Auswertung` platzieren: **„1. Aufs Tagesgeld überweisen: X € | 2. Frei für ETF-Sparplan: Y €“**. |
| **QW-3** | **Inflation vs. Monatsbetrag** | Asymmetrie zwischen inflationierten Zielen und nominal fixem Monatsbetrag zerstört lange Horizonte. | Entweder Checkbox bei der Inflation ergänzen: **„Verfügbaren Monatsbetrag jährlich mit der Inflation dynamisieren (Kaufkraft erhalten)“** (Default: Aktiv!) – oder im Tooltip deutlich empfehlen, bei realer Betrachtung (heutige Kaufkraft) mit **0 % Inflation** zu rechnen. |
| **QW-4** | **Engpass-Diagnose bei Fehlbetrag** | Bei „Fehlender Cashbestand“ weiß der Nutzer nicht, *wann* und *warum* der Plan kippt. | Direkt in der Warnmeldung den Auslöser nennen: *„Engpass im **[Monat/Jahr]** bei Ziel **[Zielname]**: Es fehlen **[Betrag] €**.“* |
| **QW-5** | **Eingabelabel „Monatsbetrag“** | Unklarheit, ob bestehende ETF-Sparpläne schon abgezogen sein müssen. | Label präzisieren zu: **„Monatliches Gesamt-Sparbudget (Cash + Investment)“** mit Subtext: *„Alles, was nach Fixkosten & Alltag pro Monat für Rücklagen UND Vermögensaufbau übrig bleibt.“* |
| **QW-6** | **Footer-Wording zur Sicherheit** | „Lokale Daten sind nicht automatisch verschlüsselt“ verunsichert unnötig. | Umformulieren zu: *„Deine Daten verlassen niemals dieses Gerät (100 % lokal im Browser). Auf gemeinsam genutzten Computern sind sie für andere Nutzer dieses Browser-Profils sichtbar.“* |

---

### B. Strukturelle Verbesserungen (Architektur & Alltagsnutzen)

1. **Navigation von 6 auf 3–4 Tabs konsolidieren (Cockpit statt Tab-Hopping):**
* **Ist-Zustand:** `Start` | `Übersicht` | `Ziele` | `Zeitplan` | `Jahresplan` | `Monatsplan`
* **Soll-Zustand:**
* **`Planung (Cockpit)`:** Vereint `Ausgangslage`, `Ziele` (direkt darunter oder daneben!) und die wichtigsten Top-KPIs (`Deine Auswertung`). Wenn Julian ein Ziel hinzufügt oder ändert, sieht er **ohne Tab-Wechsel in Echtzeit**, wie sich seine freie Sparrate und sein benötigter Cashbestand verändern.
* **`Verlauf & Analyse`:** Vereint die Grafiken aus `Zeitplan` (Bestandsentwicklung) und `Jahresplan` (Mittelverwendung Cash vs. ETF) untereinander auf einer Seite, sodass man Ursache (Ausgaben/Bestand) und Wirkung (freie ETF-Quote) synchron im Blick hat.
* **`Datentabelle`:** Kombiniert die Detailtabellen (`Jahresübersicht im Detail` und `Monatsplan` per Umschalter `[Jahre | Monate]`).
* **`Start` / `So funktioniert's`:** Als kompaktes Info-Banner (wegklickbar bei wiederkehrenden Nutzern, sobald Daten im `localStorage` liegen) oder als Hilfe-Button `?` im Header statt als dauerhafter Tab #1.




2. **Interaktiver „Was-wäre-wenn“-Modus (Ziel-Toggles & Inline-Edit):**
* Jedes Ziel in der Zielliste bekommt einen einfachen **Switch (Aktiv / Simulieren pausiert)**. Damit kann Julian mit einem Klick testen: *„Was bringt es mir für meine ETF-Quote 2027/2028, wenn ich das Ziel ‚Neues Auto‘ kurz ausblende oder das Datum um 1 Jahr schiebe?“*
* Auf die Pagination (`Seiten der Zielliste`) sollte für bis zu 25 Ziele komplett verzichtet werden – alle Ziele auf einen Blick zu sehen ist für die kognitive Kontrolle essenziell.


3. **Optionaler Habenzins auf den Cashbestand (`Tagesgeldzins % p.a.`):**
* Wer Inflation (`% p.a.`) als Parameter anbietet, muss in einer Zinswelt von 2–3,5 % auf Tagesgeld/Geldmarkt-ETFs fairerweise auch ein Feld **„Verzinsung Cashbestand (% p.a., nach Steuern)“** anbieten (oder bewusst mit dem **Realzins** aus Inflation minus Tagesgeldzins arbeiten). Andernfalls rechnet der Planer den Nutzer systematisch ärmer, als er ist.


4. **Intelligenter „Jahres-Check-in“ & Backup-Nudge für wiederkehrende Nutzung:**
* Da das Tool local-first arbeitet, sollte nach Änderungen an den Zielen im Header ein dezenter Punkt am `Exportieren`-Button erscheinen (*„Ungesicherte Änderungen – Backup herunterladen“*).
* Wenn Julian die App nach 3 Monaten wieder öffnet, erkennt das Tool anhand des gespeicherten Datums den Monatswechsel und begrüßt ihn mit: *„Willkommen zurück im [Aktueller Monat]! Aktualisiere kurz deinen heutigen Kontostand, um deine optimale ETF-Sparrate für nächsten Monat zu sehen.“*



---

## 4. Fazit: Bleibt Julian (35) dabei oder kehrt er zu Excel zurück?

**Das ehrliche Urteil:**
In der **heutigen Version** würde Julian den Cashflow-Planner an einem Sonntagabend mit großer Begeisterung entdecken, 30 Minuten lang intensiv damit herumspielen, einen echten **Aha-Moment** über das Prinzip der „spätestmöglichen Cash-Ansparung“ erleben – und das Tool danach **nur unregelmäßig (1–2 Mal im Jahr) wieder öffnen**.

**Warum er es sofort liebt (und Excel dafür stehen lässt):**
Die Rückwärtsprojektion über mehrere überlappende Ziele (Urlaub jedes Jahr + Küche in 3 Jahren + Auto in 7 Jahren) in Excel selbst zu bauen, erfordert komplexe Rückwärts-Min/Max-Formeln über 120 Monatsspalten. Dass der Cashflow-Planner ihm diese Mathematik abnimmt und im **Jahresplan** schwarz auf weiß zeigt, wie viel Prozent seiner Sparrate trotz geplanter Großausgaben in den ETF fließen können, schlägt jede Standard-Excel-Liste.

**Warum er (noch) zögert, es monatlich als festes Steuerungstool zu nutzen:**
Solange Julian zwischen `Übersicht`, `Ziele` und `Jahresplan` hin- und herspringen muss, um einfache Szenarien durchzuspielen, und solange ihn Begriffe wie der *„Heute nötige Cashbestand“* (inklusive des verwirrenden Disclaimers) sowie die *Inflations-Asymmetrie* kurzzeitig an den Zahlen zweifeln lassen, fehlt das letzte Quäntchen „Blindes Vertrauen“.

**Der Hebel:** Setzt du die **Quick Wins (insbesondere QW-1 bis QW-4)** um und holst die **Zielliste direkt neben die Auswertung in ein gemeinsames Cockpit**, wird aus einem klugen Finanzrechner ein unverzichtbares persönliches Finanz-Cockpit, zu dem Julian jeden Monat (oder bei jeder Gehaltsanpassung) zurückkehrt.