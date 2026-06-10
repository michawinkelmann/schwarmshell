# 🎮 SchwarmShell

Ein Browser-Lernspiel für Linux-Shell-Grundlagen (`ls`, `cd`, `grep`, `find`, `chmod`, Pipes, Prozesse …), verpackt in eine Story über einen System-Glitch an einer Schule. Zielgruppe: Schüler*innen — Begleitmaterial für Lehrkräfte liegt in [BEGLEITMATERIAL.md](BEGLEITMATERIAL.md).

Vanilla JS, **kein Build-Schritt**: Die Seite lädt klassische `<script>`-Tags, es gibt keinen Bundler und keine Laufzeit-Abhängigkeiten.

## Spielen / lokal starten

```bash
npm start                        # startet python3 -m http.server 8765
# dann http://localhost:8765 öffnen
```

Jeder andere statische Webserver funktioniert genauso (`npx serve`, Apache, …). Der Spielstand liegt im `localStorage` des Browsers (Autosave); über den **Savegame**-Button lässt sich der Stand als Passphrase exportieren und an einem anderen Rechner fortsetzen.

## Tests

End-to-End-Tests mit Playwright spielen die Hauptpfade aller 6 Phasen mechanisch durch:

```bash
npm install                      # einmalig: lädt Playwright
npx playwright install chromium  # einmalig: lädt den Browser (falls nicht vorhanden)
npm test                         # headless
npm run test:headed              # Browser sichtbar
```

Der Test startet den HTTP-Server selbst, falls auf Port 8765 keiner läuft. CI: `.github/workflows/test.yml` führt die Suite bei jedem Push/PR aus.

## Architektur

Die Scripts laden in fester Reihenfolge (siehe `index.html`) und teilen sich den globalen Scope — top-level `const`/`function` einer Datei sind in allen späteren Dateien sichtbar. **Die Reihenfolge ist daher Teil des Vertrags.**

| Datei | Aufgabe |
|---|---|
| `js/boot.js` | Sichtbarer Fehler-Banner, falls beim Laden etwas schiefgeht |
| `js/i18n.js` | UI-Übersetzungen (`t("key")`), Deutsch/Englisch |
| `js/data/fs.js` | Spielwelt: virtuelles Dateisystem als `window.SCHWARM_FS` |
| `js/data/npcs.js` | NPC-Stammdaten als `window.SCHWARM_NPCS` |
| `js/data.js` | Aggregiert Daten + Quest-Ziele (`OBJECTIVES`) zu `window.SCHWARM_DATA` |
| `js/core.js` | DOM-Helfer, Terminal-Zeilen, Toasts, `escapeHtml` |
| `js/state.js` | Spielstand: Laden/Speichern/Migration (`localStorage`), Savegame-Passphrasen |
| `js/fs.js` | Operationen auf dem virtuellen Dateisystem (`getNode`, `readFile`, `cp`, …), Ordnerkarte |
| `js/commands.js` | Befehls-Registry, man-Pages, Befehls-Implementierungen, NPC-Dialoge, Quest-Trigger |
| `js/main.js` | UI-Verdrahtung: Eingabe, Overlays, Settings, Tutorial, Audio |

### Konventionen

- **Fehlerformat:** FS-/Parser-Helfer geben `{ ok:false, err:"<präfixfreier Grund>" }` zurück; Befehls-Implementierungen übersetzen das in `{ ok:false, out:"cmd: Grund" }` — `out` ist immer das, was im Terminal landet.
- **HTML-Ausgabe:** Nutzereingaben und Spieltexte laufen durch `escapeHtml()` aus `core.js`, bevor sie per `innerHTML` gerendert werden.
- **i18n:** Nur die UI-Schicht (Settings, Toasts, Phase-Pill) ist übersetzt. **Spielinhalte (Story, NPC-Dialoge, man-Pages, Quests) bleiben bewusst Deutsch** — ein vollständiger Sprach-Switch wäre ein eigenes Projekt.
- **Savegames:** Schema-Version im Storage-Key (`schwarmshell_all_phases_v5`); `normalizeState()` in `state.js` migriert alte Stände.

## Inhalte erweitern

- **Quest-Ziel hinzufügen:** `OBJECTIVES` in `js/data.js` — Eintrag mit `phase`, `title`, `hint` und einer `done(state)`-Funktion. Der zugehörige Flag wird von einem Befehl/Trigger in `js/commands.js` gesetzt.
- **Ort/Datei hinzufügen:** `js/data/fs.js` — Pfad als Key, `{ type:"dir"|"file", children|content }`. Ortsbeschreibungen (`LOC`) liegen ebenfalls dort.
- **NPC hinzufügen:** `js/data/npcs.js` — `id`, `name`, `role`, `at:[Pfade]`. Generische NPCs bekommen automatisch Mehrstufen-Dialoge; Spezial-Dialoge leben in `case "talk"` in `js/commands.js`.
- **Befehl hinzufügen:** Eintrag in `COMMAND_REGISTRY` (+ ausführliche man-Page in `MANUALS`) und ein `case` in `cmdImpl()` — beides in `js/commands.js`. Ggf. in `allowedCommands()` für die Phase freischalten.

## Didaktik

Lernziele, Einsatz im Unterricht, Schwierigkeitsstufen und bekannte (bewusste) Vereinfachungen der Shell-Semantik: siehe [BEGLEITMATERIAL.md](BEGLEITMATERIAL.md).
