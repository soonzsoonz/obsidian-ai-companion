# AI Journey

An Obsidian plugin that turns a daily journal into a working relationship with an AI —
practical and life-sized, not a wellness coach.

You keep writing your journal the way you already do. The plugin reads it, responds with
concrete advice, digests the links you collected that day, and slowly builds up a picture
of who you are so its help gets more targeted over time.

## Features

**Journal feedback** — Reads what you wrote and responds where it can actually help:
practical notes on health matters you mentioned (yours or your family's), honest thoughts on
work and family difficulties, and follow-ups worth acting on. It is told explicitly to skip
affirmations and therapy-speak.

**Daily digest** — Takes the links you dropped under `今日社群轉貼` and summarises each one
into a fixed triple: 來源標題 / 核心結論 / 為什麼重要. 為什麼重要 is written against what the
plugin knows about you, so a post is allowed to come back marked as only marginally relevant.

**Theme synthesis** — The interesting one. Instead of summarising posts one by one, it takes
everything you shared over the past week, clusters it by theme, and writes a single how-to
guide per cluster — comparing the approaches, noting where sources disagree, ending in steps
you can follow. Ten scattered posts about prompting become one usable reference.

**Fact table** — The AI accumulates durable facts about you (people, projects, goals,
recurring problems) in `facts/facts.md`, and every other feature reads it before answering.
Recurring items are merged rather than repeated, and each fact is dated.

## Daily note layout

The plugin reads and writes these four sections. You own the first and third; the AI writes
the second and fourth.

```markdown
## 日誌
- what you did today

## AI回饋
- (AI writes here)

## 今日社群轉貼
- Thread: Top 10 coding skills https://...

## AI整理社群新知
- (AI writes here)
```

Sections are found by heading, so their order in your file does not matter, and re-running a
command replaces that section rather than appending a second copy. Anything outside these
four headings is never touched.

## Installation

Requires Obsidian 1.5.0+ on desktop.

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Put them in `<vault>/.obsidian/plugins/ai-journey/`.
3. Enable **AI Journey** in Settings → Community plugins.
4. Set your AI CLI path in Settings → AI Journey.

### Building from source

```bash
npm install
npm run build
```

## Commands

| Command | What it does |
| --- | --- |
| Generate Journal Feedback | Writes advice into `## AI回饋` |
| Generate Digest | Summarises today's shared links into `## AI整理社群新知` |
| Synthesize Theme Guide from Recent Shares | Clusters the last 7 days of links into themed guides |
| Accumulate Facts | Updates the fact table from today's entry |

## Settings

- **AI** — provider, CLI path/command, extra arguments, model, timeout.
- **Journal** — folder, date format, template path.
- **Digest** — schedule: `manual` (default), `on-open`, or `hourly`.
- **Facts** — folder, and an enable toggle (off by default).

## Privacy and safety

Read this before enabling anything.

- **Your journal is sent to an AI provider.** The plugin spawns a local AI CLI and pipes your
  journal text to it. Whatever that CLI sends onward — and to whom — is governed by that tool,
  not by this plugin. Journals contain health details and family matters; decide deliberately.
- **The AI writes directly into your vault.** There is no confirmation step. It only ever
  replaces the `## AI回饋` and `## AI整理社群新知` sections, but it does so without asking.
- **Provenance is kept.** `facts/_log.md` is append-only and records which journal day each
  fact update came from, so you can always separate what you wrote from what the AI inferred.
- **Scheduling defaults to manual.** `hourly` exists but is opt-in — unattended runs that
  write into your vault should be a decision, not a default.
- **Desktop only.** Spawning a CLI needs Node, so this cannot run on mobile.

## Internationalisation

The interface ships in 21 languages, following Obsidian's own language setting: Arabic,
German, English, Spanish, Persian, French, Indonesian, Italian, Japanese, Korean, Dutch,
Polish, Portuguese, Portuguese (Brazil), Russian, Thai, Turkish, Ukrainian, Vietnamese,
Chinese (Simplified), and Chinese (Traditional).

Translations live in `src/i18n/locales/`. Each locale is typed against English, so a missing
key is a compile error rather than a silent fallback.

## License

MIT
