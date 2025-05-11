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
* [ ] Beim Starten sqlite kürzen auf 10'000 Barcodes Einträge, verhindert zu grosse Dateien
* [ ] Sync
    - [ ] Beim Starten von Online zu sqlite synchronisieren
        - [ ] Leticodes
        - [ ] Einstellungen
        - [ ] Benutzer
        - [ ] Ausnahmen
    - [ ] Offline fähig
    - [ ] Wenn Online Barcodes synchronisieren
* [x] Lager Users bleiben gespeichert beim F5 Refresh
* [ ] Alle Versionen hochladen in package.json und alle cargo.toml

