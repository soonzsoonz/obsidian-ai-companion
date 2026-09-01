# AI Companion

An Obsidian plugin that turns a daily journal into a working relationship with an AI —
practical and life-sized, not a wellness coach.

You keep writing your journal the way you already do, and you share links from your phone
the way you already do. The plugin reads both, responds with concrete advice, digests the
links into a daily briefing, and slowly builds up a picture of who you are so its help gets
more targeted over time.

## Features

**Journal feedback** — Reads what you wrote and answers in the voice the subject calls for:
a confidant for a falling-out, a teacher for something about your child, an engineer for a
bug. Which voice applies to what is an editable table in settings, and so is each voice's
own instruction.

**News digest** — Share a post from Threads, X, or Facebook to your vault from your phone,
and the plugin does the rest: it lists the link in `今日社群轉貼`, then summarises it into a
fixed triple — source, takeaway, why it matters. With research enabled it fetches each page
and summarises what it actually says, rather than guessing from the title. People save things
to use at work, to try in their own making, for someone in the family, or simply because they
were good — so the third line says what you can do with it, and never rates it.

**Fact table** — The AI accumulates durable facts about you (people, projects, goals,
recurring problems) in an ordinary, editable note. Every other feature reads it before
answering. Facts are stated as they are *now* and rewritten as things change, so the file
stays readable after months rather than growing into a changelog.

## How a day works

1. During the day, share links from your phone into the landing folder.
2. Write your journal — just the `## 日誌` section; the rest is filled in for you.
3. Run **Generate Digest**. Your shares appear under the shares heading, the summaries
   under the digest heading, and the share notes move to the archive.
4. Run **Generate Journal Feedback** when you want a response to what you wrote.

Or set a schedule and let steps 3 and 4 happen on their own.

## Daily note layout

You own the first and third sections; the AI writes the second and fourth.

```markdown
## Journal
- what you did today

## AI Feedback
- (AI writes here, timestamped)

## Shared Today
- (AI lists your shared links here)

## AI Digest
- (AI writes here, timestamped)
```

Headings follow Obsidian's language setting, so a Chinese interface writes
`## 日誌`, `## AI回饋`, and so on. Notes written under one language keep working
under another: matching recognises every locale's headings, and an existing
section keeps whatever heading it already has rather than being rewritten.

Sections are found by heading, so their order in your file does not matter. Re-running a
command appends a new timestamped block rather than replacing what came before, so several
runs a day accumulate. Anything outside these four headings is never touched.

## Folder layout

```
ai-companion/
  journal/              daily notes; each day may get a folder of its own for reports
  news/
    landing/            ← share to this folder from your phone
    archived/           processed shares are moved here
  memory/
    facts.md            what the AI knows about you — edit it freely
    _log.md             append-only record of when it was updated
```

Every folder is configurable in settings. They are created when the plugin loads, so the
landing folder exists before you go looking for it in a mobile share sheet.

## Installation

Requires Obsidian 1.5.0+ on desktop.

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Put them in `<vault>/.obsidian/plugins/ai-companion/`.
3. Enable **AI Companion** in Settings → Community plugins.
4. Set your AI CLI path in Settings → AI Companion.

### Setting up the CLI

The plugin pipes your prompt to a local AI CLI on stdin and reads its stdout, so the command
must run non-interactively. For Claude Code:

Pick your CLI from the dropdown and its non-interactive flags are applied for you. Only set
a path if the executable is not on your `PATH`.

| CLI | Status |
| --- | --- |
| Claude Code | Verified; prompt sent on stdin |
| Antigravity (`agy`) | Verified; prompt passed as an argument |
| Codex (ChatGPT) | Offered but untested — please report what you find |

If a command reports no output, the CLI most likely wanted an interactive session; check the
flags under Extra arguments.

### Building from source

```bash
npm install
npm run build
```

## Commands

All of these are in the command palette, and in the menu behind the ribbon icon.

| Command | What it does |
| --- | --- |
| New Journal Note | Creates today's note from the template and opens it |
| Generate Journal Feedback | Writes advice into `## AI回饋` |
| Generate Digest | Lists your shares and summarises them into `## AI整理社群新知` |
| Accumulate Facts | Updates the fact table from the day's entry |
| Open Fact Table | Opens `facts.md` for reading or correcting |
| Archive Processed Shares | Sweeps up any leftover processed shares |

Commands that write to a journal note are disabled while a non-journal note is open, so they
never act on a file you did not mean to change.

## Settings

- **AI** — pick your CLI (Claude Code, Antigravity, Codex) and the flags it needs are filled
  in; or choose Custom. Plus path, extra arguments, model, timeout.
- **Voices** — the situation → voice table and each voice's instruction. Every built-in entry
  resets individually; add your own situations and voices.
- **Journal** — folder, date format, template path (supports `{{date}}` and `{{time}}`).
  A custom template must keep the four headings; they are how the AI finds where to write.
- **News** — landing and archive folders, research toggle, archive retention in days
  (0 keeps everything).
- **Schedule** — manual (default), on open, or every N hours, with separate toggles for
  whether a scheduled pass runs the digest, the feedback, or both.
- **Facts** — folder, and an enable toggle (off by default).

### Scheduling

Scheduled runs only happen while Obsidian is open — a CLI-backed plugin has no background
process, and a missed window is picked up at the next tick rather than being caught up.

The digest suits a schedule, since each run handles whatever new shares arrived. Journal
feedback is off by default in scheduled runs: every pass appends a fresh block, so running
it six times a day fills the section with near-identical advice.

## Privacy and safety

Read this before enabling anything.

- **Your journal is sent to an AI provider.** The plugin spawns a local AI CLI and pipes your
  journal text to it. Whatever that CLI sends onward — and to whom — is governed by that tool,
  not by this plugin. Journals contain health details and family matters; decide deliberately.
- **The AI writes directly into your vault.** There is no confirmation step. It only writes
  the sections listed above, but it does so without asking.
- **Provenance is kept.** `memory/_log.md` is append-only and records which journal day each
  fact update came from, so you can separate what you wrote from what the AI inferred.
- **The fact table is yours to edit.** If the AI records something wrong, open it and fix it;
  the next run reads your corrected version. Note that the AI rewrites the whole file each
  time, so a line with no support in your journal may not survive.
- **Scheduling defaults to manual.** Unattended runs that write into your vault should be a
  decision, not a default.
- **Archive deletion is opt-in** and uses the system trash, so it is recoverable.
- **Desktop only.** Spawning a CLI needs Node, so this cannot run on mobile. Sharing *into*
  the vault from a phone works fine — that is just Obsidian Sync.

## Internationalisation

The interface ships in 21 languages, following Obsidian's own language setting: Arabic,
German, English, Spanish, Persian, French, Indonesian, Italian, Japanese, Korean, Dutch,
Polish, Portuguese, Portuguese (Brazil), Russian, Thai, Turkish, Ukrainian, Vietnamese,
Chinese (Simplified), and Chinese (Traditional).

Translations live in `src/i18n/locales/`. Each locale is typed against English, so a missing
key is a compile error rather than a silent fallback.

## License

MIT
