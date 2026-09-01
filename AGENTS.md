# obsidian-ai-companion — build spec

An Obsidian plugin: an AI companion for a daily founder's journal. Practical and
life-oriented, NOT a wellness-guru product. Author: soonzsoonz.
Repo: git@github.com:soonzsoonz/obsidian-ai-companion.git

## Three features (all shallow but working in v1)

1. **Health advisor** — from journal mentions, give practical advice.
2. **Life companion** — comfort/suggestions on work, family, daily life.
3. **Idea catalyst** (the differentiator) — shares arrive from a phone into a
   landing folder; the plugin lists them in the journal and digests each one,
   fetching the page so the summary reflects what it actually says.

## Canonical daily note layout (must match this)

```
## 日誌
- (user writes freely)

## AI回饋
- (AI generated)

## 今日社群轉貼
- Thread: <title> <url>

## AI整理社群新知
- (AI generated)
```

Only the source line of a digest item is fixed; what follows depends on what the
item holds (see `src/features/digest/index.ts`, `itemFormat`). One template made
everything read as a report. Section headings and the field labels follow the
interface language — never hardcode Chinese in output.

## Fact table

`ai-companion/memory/facts.md` — AI accumulates what it learns about the writer (people, projects,
goals, ongoing problems) so later advice is targeted. Every fact carries
provenance: the journal date it came from. Append-only source log in
`memory/_log.md`; never silently rewrite history. Journal sample shows recurring
threads (問題清單/優化清單 repeat across months) — dedupe these into one fact.

## Architecture (copy claudian's split)

- `src/core/` — provider-neutral types + runtime. Feature code depends ONLY on this.
- `src/providers/` — one adapter per AI CLI, spawned via child_process.
  Implement a `cli` provider (configurable command/args, e.g. claude or gemini).
  Leave a clearly-marked seam for a future `api` provider — do NOT implement it.
- `src/features/` — journal/, digest/, news/, facts/ (one folder each).
- `src/settings/` — settings tab + defaults.
- `src/i18n/` — see below.
- `src/main.ts` — plugin entry.

`manifest.json`: id `ai-companion`, name `AI Companion`, isDesktopOnly **true**
(CLI spawning needs Node), minAppVersion "1.5.0", author soonzsoonz.

## i18n (required from day one — copy notebook-navigator's pattern EXACTLY)

`src/i18n/index.ts` + `src/i18n/locales/<code>.ts`.
- `en.ts` is the source of truth; export `STRINGS_EN`.
- Other locales typed as `typeof STRINGS_EN` so missing keys are compile errors.
- Select locale via `getLanguage()` imported from `obsidian`; fall back to `en`.
- Locales required: en, zh_tw, zh_cn, ja, ko, de, fr, es, pt, pt_br, ru, vi, id,
  th, tr, uk, nl, it, pl, ar, fa.
- Translate genuinely into each language — do not leave English placeholders.
  zh_tw must be Traditional Chinese (Taiwan wording), zh_cn Simplified.
- ALL user-facing strings go through i18n. No hardcoded UI text anywhere.

## Settings surface

- AI: provider, CLI path/command, extra args, model, timeout.
- Journal: folder, date format, template path (follow periodic-notes naming:
  folder / format / template).
- Digest: schedule mode (manual | on-open | hourly), default manual.
- Facts: facts folder, enable/disable.

## Repo scaffolding (release-ready from day one, per notebook-navigator)

README.md (with a Features / Installation / Settings / Privacy section),
CONTRIBUTING.md, SECURITY.md, LICENSE (MIT, Copyright (c) 2026 soonzsoonz),
docs/, .gitignore, .editorconfig, package.json, tsconfig.json,
esbuild.config.mjs, version-bump.mjs, versions.json, styles.css,
.github/workflows/ci.yml (build + typecheck on push/PR).

README must state plainly: the plugin spawns a local AI CLI, journal content is
sent to that CLI's provider, and it writes directly into the vault.

## Constraints

- TypeScript strict. Target ES2018, format cjs, external: obsidian + electron +
  node builtins. Entry src/main.ts → main.js at repo root.
- Obsidian API only (`obsidian` package). Use `child_process` only inside
  `src/providers/`.
- `npm run build` and `npx tsc --noEmit` MUST both pass cleanly.
- Do not touch `data-for-study/` — it is read-only reference sample data.

## Learned the hard way

- **Never use a dot-folder for plugin data.** Obsidian does not index it, so the
  vault API cannot read it back either — the feature goes silently inert.
- **A new field on a default object never reaches existing users.** The saved
  value replaces the default wholesale, so migrate explicitly on load. This bit
  the folder defaults, then the role emoji.
- **`getLanguage()` must come from `obsidian`.** localStorage holds nothing while
  the interface is English, so reading it directly reports English for everyone.
- **Scope CSS to classes something actually adds.** A wrapper class that is never
  applied means no rule can ever match.
- **Styles only apply in Reading view**; markdown post-processors do not run in
  Live Preview.
- **agy takes its prompt as an argument; claude takes it on stdin.** Exit 0 with
  empty output almost always means a missing non-interactive flag.
- **Verify AI output shape by running it**, not by reasoning about the prompt.
  Every prompt change here was wrong on the first try.
