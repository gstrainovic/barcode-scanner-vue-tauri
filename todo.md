Hier noch eine kurze Checkliste / Überblick über die umgesetzte und offenen Funktionen:
* [x] Scanner erkennen statt auswählen
* [x] Wenn man scannt, springt es in den Vordergrund und fängt den Barcode ab
* [x] Wieder zurück zum Ursprung App, wenn Barcode gesendet, wenn Produktion User
* [x] Beim Schliessen eine Abfrage, ob ok
* [x] Settings online holen 
    - [x] Barcode zu kurz wird abgefangen
* [x] Barcodes werden gesendet
* [x] Doppelte Barcodes werden abgefangen
* [x] Leitcodes werden online geholt
* [x] Leitcodes werden abgefangen
* [x] Bei nur Zahlen wird gewarnt
* [x] Lager Users werden auch gesendet, wenn ausgewählt
* [x] Ausnahmen holen und anwenden
* [x] Selfupdater
* [x] Hinweis Produktion / Lager
* [x] Darf nicht zweimal gestartet werden
* [x] Hinweis umgsetzt toggle
* [x] Hinweis Vorlagen
* [x] Hotkey für Vorlagen
* [x] Lager Users bleiben gespeichert beim F5 Refresh
* [x] Mit Ziffernblock auch CTRL + Vorlagen laden
* [x] team and user ids nicht selber setzen sonder per appstore.xxx()
* [x] absteigend soriteren die imports
* [x] Alle Versionen hochladen in package.json und alle cargo.toml
* [x] pnpm check
* [x] code check von copilot
* [x] probieren auf awaits zu verzichten
* [x] imports alle nötig?
* [x] gemeinsame .env benutzen
* [x] Beim Starten sqlite verlauf kürzen auf 200 Barcodes Einträge, verhindert zu grosse Dateien
* [x] zeiterfassung testen
    * [x] login
    * [x] logout
    * [x] appschliessung
    * [x] nutzerwechsel
* [x] Beim Starten von Online zu localStorage synchronisieren
    * [x] Leitcodes
    * [x] Einstellungen
    * [x] Benutzer
    * [x] Ausnahmen
    * [x] HinweisVorlagen
    * [x] Barcodes mit Vorlagen
* [ ] Arbeitszeiten auch local speichern
* [ ] Sync
    - [ ] Offline fähig
    - [ ] Wenn Online Barcodes synchronisieren
* [ ] Arbeitszeiten in Admin darstellen
* [ ] Checkliste erstellen
