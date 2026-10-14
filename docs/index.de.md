# Schriftartenmodul

Das Schriftartenmodul bietet Auswahl, Größe, Vorschau und Zurücksetzen in den Cognis-Einstellungen über die Host-Einstellungen.

## Verwendung

Modul aktivieren und den Bereich Schriftarten öffnen. Eine verfügbare Schriftart und eine Größe von 8 bis 24 Punkt wählen, die Vorschau ansehen und über die Änderungsleiste speichern oder verwerfen.

## Technische Spezifikation

### Einstellungen und Präferenzen

Der Einstellungsbeitrag nutzt den Sub-Composer-Vertrag des Hosts. `fonts:preferences` delegiert Laden und Speichern über eigene Abläufe `fonts:loadPreferences` und `fonts:savePreferences` an `ui:reuse` → `ui-preferences.js`. Beim Speichern werden Kontoeinstellungen zusammengeführt und durch den Host angewendet. Konto-API-Aufrufe, Speicherschlüssel und Shell-Stile werden nicht dupliziert.

### Mitwirkendenstruktur und Zuständigkeit des Hosts

Neue Module beginnen mit [cognis-module-template](https://github.com/Cognis-Labs-HQ/cognis-module-template); dieses Repository folgt der in `AGENTS.md` festgehaltenen Vorlagenrevision. `bootstrap.js` orchestriert den Lebenszyklus, `api/index.js` verdrahtet ctx-Abhängigkeiten, `api/routes/<domain>/index.js` enthält HTTP-Handler und `api/reuse/` wiederverwendbaren Servercode. Browserfunktionen liegen unter `ui/`, Styles unter `ui/styles/`, wiederverwendbare Vorlagen unter `ui/templates/` und lokalisierte Dokumentation unter `docs/index.<locale>.md`. Historische Veröffentlichungen liegen in `docs/changelog/` und werden nicht gehasht. Nicht unterstützte optionale Bereiche entfallen.

Öffentliche ctx-Fähigkeiten und deklarierte Abläufe nutzen; niemals Cognis-Interna oder benachbarte Module importieren. Dashboard-Anbieter für Fähigkeiten und Navigation exportieren `mountProvider(scopedUiCtx)` und geben Aufräumfunktionen für eigene Ressourcen zurück. Importe registrieren kein Modulverhalten. Der Host entfernt Fähigkeiten, Ablauf-Hooks, Listener und Anbieterzustand beim Deaktivieren und bindet zwischengespeicherte Anbieter beim erneuten Aktivieren neu ein. Einstellungen, Administration und Anmeldefußzeilen folgen ihren jeweiligen dokumentierten Host-Verträgen. Diese Verträge mit eigenständigen Testdoubles prüfen, die ausführbare Strukturprüfung ausführen, Hashes nach der letzten Paketänderung erneuern und vor der Veröffentlichung Lint, Tests und Manifestprüfung ausführen.

Die Paketprüfung stellt sicher, dass Einstiegspunkte, Icons, Banner und Screenshots reguläre Dateien innerhalb des Checkouts sind, auch nach Pfadauflösung. Die Dokumentation beschreibt öffentliche Verträge und verweist für Veröffentlichungsmetadaten auf Manifeste; Änderungsprotokolle behalten die Herkunft der Veröffentlichung. Schriftvorgaben, Katalogsuche, Familienformatierung, gespeicherte Familien und HTML-Escaping stammen aus Host-Wiederverwendungsverträgen. Einstellungen aktualisieren die sichtbare Vorschau und stoppen ausstehende Darstellung beim Abbau; Speichern nutzt weiterhin scoped Einstellungs-Flows.
