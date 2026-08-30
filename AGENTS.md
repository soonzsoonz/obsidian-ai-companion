# obsidian-ai-journey — build spec

An Obsidian plugin: an AI companion for a daily founder's journal. Practical and
life-oriented, NOT a wellness-guru product. Author: soonzsoonz.
Repo: git@github.com:soonzsoonz/obsidian-ai-journey.git

## Three features (all shallow but working in v1)

1. **Health advisor** — from journal mentions, give practical advice.
2. **Life companion** — comfort/suggestions on work, family, daily life.
3. **Idea catalyst** (the differentiator) — ingest shared links collected in the
   vault, produce a daily digest, and synthesize ACROSS many posts on one theme
   into a single how-to guide.

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

Digest items MUST use this existing triple format:
`**來源標題**: <title> ([原始連結](<url>))` / `**核心結論**: ...` / `**為什麼重要**: ...`
separated by `---`. See `data-for-study/daily_new_knowledge/網路新知彙整/*.md`.

## Fact table

`facts/*.md` — AI accumulates what it learns about the writer (people, projects,
goals, ongoing problems) so later advice is targeted. Every fact carries
provenance: the journal date it came from. Append-only source log in
`facts/_log.md`; never silently rewrite history. Journal sample shows recurring
threads (問題清單/優化清單 repeat across months) — dedupe these into one fact.

## Architecture (copy claudian's split)

- `src/core/` — provider-neutral types + runtime. Feature code depends ONLY on this.
- `src/providers/` — one adapter per AI CLI, spawned via child_process.
  Implement a `cli` provider (configurable command/args, e.g. claude or gemini).
  Leave a clearly-marked seam for a future `api` provider — do NOT implement it.
- `src/features/` — journal/, digest/, facts/ (one folder each).
- `src/settings/` — settings tab + defaults.
- `src/i18n/` — see below.
- `src/main.ts` — plugin entry.

`manifest.json`: id `ai-journey`, name `AI Journey`, isDesktopOnly **true**
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
