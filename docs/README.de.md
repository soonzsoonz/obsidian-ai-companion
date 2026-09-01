# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | Deutsch | [Español](README.es.md) | [Italiano](README.it.md) | [Português (BR)](README.pt-BR.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [Indonesia](README.id.md)】

Ein Obsidian-Plugin, das ein tägliches Journal in eine funktionierende Beziehung mit einer KI verwandelt — praktisch und lebensnah, kein Wellness-Coach.

Sie schreiben Ihr Journal so weiter, wie Sie es bereits tun, und teilen Links von Ihrem Telefon so, wie Sie es bereits tun. Das Plugin liest beides, antwortet mit konkreten Ratschlägen, verarbeitet die Links zu einem täglichen Briefing und baut langsam ein Bild davon auf, wer Sie sind, damit die Hilfe mit der Zeit zielgerichteter wird.

## Funktionen

**Journal-Feedback** — Liest, was Sie geschrieben haben, und antwortet mit der Stimme, die das Thema verlangt: 🫂 ein Vertrauter für einen Streit, 🎒 ein Lehrer für etwas über Ihr Kind, 🔧 ein Ingenieur für einen Fehler. Jede Antwort beginnt mit dem Emoji und dem Namen dieser Stimme, so dass sich ein Tag mit allen dreien wie drei Antworten statt wie eine Textwand liest. Welche Stimme auf was zutrifft, ist eine bearbeitbare Tabelle in den Einstellungen, ebenso wie das Emoji, der Name und die Anweisung jeder Stimme.

**Nachrichten-Zusammenfassung** — Teilen Sie einen Beitrag von Threads, X oder Facebook in Ihren vault von Ihrem Telefon, und das Plugin erledigt den Rest: Es listet den Link unter der Überschrift für geteilte Inhalte auf und schreibt ihn in drei festgelegten Teilen auf — Quelle, Kernaussage, warum es wichtig ist. Mit aktivierter Recherche ruft es jede Seite ab und fasst zusammen, was tatsächlich dort steht, anstatt vom Titel aus zu raten. Menschen speichern Dinge, um sie bei der Arbeit zu nutzen, sie in ihrem eigenen Schaffen auszuprobieren, für jemanden in der Familie oder einfach, weil sie gut waren — also sagt die dritte Zeile, was man damit tun kann, und bewertet es nie.

**Vollständige Berichte** — Wenn ein Element mehr als ein paar Zeilen verdient, markiert die KI es und schreibt ihm eine eigene Notiz im Ordner dieses Tages — was es ist, wie man es macht, worauf man achten muss — und zitiert die Methode wörtlich, so dass sie ohne erneutes Öffnen der Quelle nutzbar ist. Der Eintrag in der Zusammenfassung verlinkt darauf. Begrenzt pro Ausführung und abschaltbar.

**Faktentabelle** — Die KI sammelt dauerhafte Fakten über Sie (Personen, Projekte, Ziele, wiederkehrende Probleme) in einer gewöhnlichen, bearbeitbaren Notiz. Jede andere Funktion liest diese, bevor sie antwortet. Fakten werden so dargestellt, wie sie *jetzt* sind, und neu geschrieben, wenn sich Dinge ändern, so dass die Datei nach Monaten lesbar bleibt, anstatt zu einem Änderungsprotokoll heranzuwachsen.

## Wie ein Tag abläuft

1. Teilen Sie tagsüber Links von Ihrem Telefon in den Eingangsordner.
2. Schreiben Sie Ihr Journal — nur den Abschnitt Journal; der Rest wird für Sie ausgefüllt.
3. Führen Sie **Zusammenfassung generieren** aus. Ihre geteilten Inhalte erscheinen unter der Überschrift für geteilte Inhalte, die Zusammenfassungen unter der Überschrift für Zusammenfassungen, und die Notizen der geteilten Inhalte werden ins Archiv verschoben.
4. Führen Sie **Journal-Feedback generieren** aus, wenn Sie eine Antwort auf das haben möchten, was Sie geschrieben haben.

Oder legen Sie einen Zeitplan fest und lassen Sie die Schritte 3 und 4 von alleine passieren.

## Täglicher Notizaufbau

Sie besitzen den ersten und dritten Abschnitt; die KI schreibt den zweiten und vierten.

```markdown
## Journal
- was Sie heute gemacht haben

## KI-Feedback
- (KI schreibt hier, mit Zeitstempel)

## Heute geteilt
- (KI listet hier Ihre geteilten Links auf)

## KI-Zusammenfassung
- (KI schreibt hier, mit Zeitstempel)
```

Überschriften folgen der Spracheinstellung von Obsidian, so dass eine chinesische Schnittstelle `## 日誌`, `## AI回饋` und so weiter schreibt. Notizen, die in einer Sprache geschrieben wurden, funktionieren auch in einer anderen: Der Abgleich erkennt die Überschriften jedes Gebietsschemas, und ein bestehender Abschnitt behält die Überschrift bei, die er bereits hat, anstatt neu geschrieben zu werden.

Abschnitte werden anhand der Überschrift gefunden, daher ist ihre Reihenfolge in Ihrer Datei unwichtig. Die erneute Ausführung eines Befehls fügt einen neuen Block mit Zeitstempel an, anstatt das Vorherige zu ersetzen, sodass sich mehrere Ausführungen pro Tag ansammeln. Alles außerhalb dieser vier Überschriften wird nie angetastet.

## Ordnerstruktur

```
ai-companion/
  journal/              tägliche Notizen; jeder Tag kann einen eigenen Ordner für Berichte erhalten
  news/
    landing/            ← teilen Sie in diesen Ordner von Ihrem Telefon
    archived/           verarbeitete geteilte Inhalte werden hierher verschoben
  memory/
    facts.md            was die KI über Sie weiß — bearbeiten Sie es frei
    _log.md             nur anhängende Aufzeichnung, wann es aktualisiert wurde
```

Jeder Ordner ist in den Einstellungen konfigurierbar. Sie werden erstellt, wenn das Plugin geladen wird, so dass der Eingangsordner existiert, bevor Sie ihn in einem mobilen Teilen-Menü suchen.

## Installation

Erfordert Obsidian 1.5.0+ auf dem Desktop.

1. Laden Sie `main.js`, `manifest.json` und `styles.css` aus dem neuesten Release herunter.
2. Legen Sie sie in `<vault>/.obsidian/plugins/ai-companion/` ab.
3. Aktivieren Sie **AI Companion** unter Einstellungen → Community-Plugins.
4. Legen Sie Ihren KI-CLI-Pfad unter Einstellungen → AI Companion fest.

### Einrichten der CLI

Das Plugin leitet Ihren prompt über stdin an eine lokale KI-CLI weiter und liest dessen stdout, daher muss der Befehl nicht-interaktiv ausgeführt werden. Für Claude Code:

Wählen Sie Ihre CLI aus dem Dropdown-Menü und ihre nicht-interaktiven Flags werden für Sie angewendet. Legen Sie nur einen Pfad fest, wenn sich die ausführbare Datei nicht in Ihrem `PATH` befindet.

| CLI | Status |
| --- | --- |
| Claude Code | Verifiziert; prompt über stdin gesendet |
| Antigravity (`agy`) | Verifiziert; prompt als Argument übergeben |
| Codex (ChatGPT) | Angeboten, aber ungetestet — bitte berichten Sie, was Sie herausfinden |

Wenn ein Befehl keine Ausgabe meldet, wollte die CLI höchstwahrscheinlich eine interaktive Sitzung; überprüfen Sie die Flags unter Zusätzliche Argumente.

### Aus dem Quellcode kompilieren

```bash
npm install
npm run build
```

## Befehle

Alle diese Befehle befinden sich in der Befehlspalette und im Menü hinter dem Ribbon-Symbol.

| Befehl | Was er tut |
| --- | --- |
| Neue Journal-Notiz | Erstellt die heutige Notiz aus der Vorlage und öffnet sie |
| Journal-Feedback generieren | Antwortet auf den heutigen Eintrag mit der Stimme, die jeder Teil verlangt |
| Zusammenfassung generieren | Listet Ihre geteilten Inhalte auf und schreibt jeden einzelnen auf |
| Fakten ansammeln | Aktualisiert die Faktentabelle anhand des heutigen Eintrags |
| Faktentabelle öffnen | Öffnet `facts.md` zum Lesen oder Korrigieren |
| Verarbeitete geteilte Inhalte archivieren | Räumt übrig gebliebene verarbeitete geteilte Inhalte auf |

Befehle, die in eine Journal-Notiz schreiben, sind deaktiviert, solange eine Nicht-Journal-Notiz geöffnet ist, sodass sie niemals auf eine Datei einwirken, die Sie nicht ändern wollten.

## Einstellungen

- **KI** — wählen Sie Ihre CLI (Claude Code, Antigravity, Codex) und die benötigten Flags werden ausgefüllt; oder wählen Sie Benutzerdefiniert. Plus Pfad, zusätzliche Argumente, Modell, Zeitüberschreitung.
- **Stimmen** — die Tabelle Situation → Stimme und die Anweisung jeder Stimme. Jeder integrierte Eintrag wird einzeln zurückgesetzt; fügen Sie Ihre eigenen Situationen und Stimmen hinzu.
- **Journal** — Ordner, Datumsformat, Vorlagenpfad (unterstützt `{{date}}` und `{{time}}`). Eine benutzerdefinierte Vorlage muss die vier Überschriften beibehalten; durch sie findet die KI, wo sie schreiben soll.
- **Nachrichten** — Eingangs- und Archivordner, Recherche-Umschalter, Archivaufbewahrung in Tagen (0 behält alles).
- **Zeitplan** — manuell (Standard), beim Öffnen oder alle N Stunden, mit separaten Schaltern dafür, ob ein geplanter Durchlauf die Zusammenfassung, das Feedback oder beides ausführt.
- **Fakten** — Ordner und ein Aktivierungsschalter (standardmäßig aus).
- **Erscheinungsbild** — ein optionaler Stil für die eigenen Abschnitte des Plugins (Karten, ruhig, Magazin), standardmäßig aus und auf Journal-Notizen beschränkt. Stile gelten in der Leseansicht; jeder Wert stammt aus den CSS-Variablen von Obsidian, so dass Ihr Theme weiterhin gewinnt.

### Zeitplanung

Geplante Ausführungen finden nur statt, während Obsidian geöffnet ist — ein Plugin mit CLI-Backend hat keinen Hintergrundprozess, und ein verpasstes Fenster wird beim nächsten Tick nachgeholt, anstatt aufgeholt zu werden.

Die Zusammenfassung eignet sich für einen Zeitplan, da jeder Durchlauf alle neu eingetroffenen geteilten Inhalte verarbeitet. Das Journal-Feedback ist in geplanten Durchläufen standardmäßig ausgeschaltet: Jeder Durchlauf hängt einen neuen Block an, so dass ein sechsmaliges Ausführen am Tag den Abschnitt mit fast identischen Ratschlägen füllt.

## Privatsphäre und Sicherheit

Lesen Sie dies, bevor Sie etwas aktivieren.

- **Ihr Journal wird an einen KI-Anbieter gesendet.** Das Plugin startet eine lokale KI-CLI und leitet Ihren Journal-Text an sie weiter. Was diese CLI weiterleitet — und an wen — wird von diesem Werkzeug bestimmt, nicht von diesem Plugin. Journale enthalten Gesundheitsdetails und Familienangelegenheiten; entscheiden Sie bewusst.
- **Die KI schreibt direkt in Ihren vault.** Es gibt keinen Bestätigungsschritt. Sie schreibt nur in die oben aufgeführten Abschnitte, aber sie tut dies, ohne zu fragen.
- **Die Herkunft bleibt erhalten.** `memory/_log.md` wird nur angehängt und zeichnet auf, von welchem Journal-Tag jede Faktenaktualisierung stammte, so dass Sie trennen können, was Sie geschrieben haben und was die KI abgeleitet hat.
- **Die Faktentabelle können Sie bearbeiten.** Wenn die KI etwas Falsches aufzeichnet, öffnen Sie es und korrigieren Sie es; der nächste Durchlauf liest Ihre korrigierte Version. Beachten Sie, dass die KI die gesamte Datei jedes Mal neu schreibt, sodass eine Zeile ohne Unterstützung in Ihrem Journal möglicherweise nicht überlebt.
- **Zeitplanung ist standardmäßig auf manuell eingestellt.** Unbeaufsichtigte Ausführungen, die in Ihren vault schreiben, sollten eine Entscheidung sein, keine Standardeinstellung.
- **Das Löschen des Archivs ist ein Opt-in** und verwendet den Papierkorb des Systems, so dass es wiederherstellbar ist.
- **Nur für Desktop.** Das Starten einer CLI erfordert Node, daher kann dies nicht auf Mobilgeräten ausgeführt werden. Das Teilen *in* den vault von einem Telefon funktioniert problemlos — das ist einfach Obsidian Sync.

## Internationalisierung

Die Benutzeroberfläche wird in 21 Sprachen ausgeliefert und folgt der eigenen Spracheinstellung von Obsidian: Arabisch, Deutsch, Englisch, Spanisch, Persisch, Französisch, Indonesisch, Italienisch, Japanisch, Koreanisch, Niederländisch, Polnisch, Portugiesisch, Portugiesisch (Brasilien), Russisch, Thai, Türkisch, Ukrainisch, Vietnamesisch, Chinesisch (Vereinfacht) und Chinesisch (Traditionell).

Übersetzungen befinden sich in `src/i18n/locales/`. Jedes Gebietsschema ist gegen Englisch typisiert, so dass ein fehlender Schlüssel ein Kompilierfehler und kein stiller Rückfall ist.

## Lizenz

MIT
