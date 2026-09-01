# Contributing

Pull requests are welcome.

## Getting set up

```bash
npm install
npm run build
```

To test against a real vault, copy `main.js`, `manifest.json`, and `styles.css` into
`<vault>/.obsidian/plugins/ai-companion/` and reload Obsidian.

Before opening a PR:

```bash
npx tsc --noEmit
npm run build
```

Both must pass. `skipLibCheck` is on because Obsidian's own `obsidian.d.ts` has a
`HistoryHandler` bug affecting `Menu`, `Modal`, and `PopoverSuggest`; the plugin's own
sources typecheck cleanly without it.

## Translations

This is the easiest place to help. English is the source of truth in
`src/i18n/locales/en.ts`, and every other locale is typed as `typeof STRINGS_EN`, so a
missing or misspelled key is a compile error rather than a silent fallback to English.

To add a string: add it to `en.ts` first, then to every other locale. To fix a translation,
edit that locale alone.

Most locales, and the translated READMEs under `docs/`, were machine-translated and
reviewed only for structure — not by native speakers. Corrections are especially
welcome, and a fix to your own language needs no discussion first.

Two things to watch:

- The section headings `日誌`, `AI回饋`, `今日社群轉貼`, and `AI整理社群新知` are literal
  heading names in the user's notes. Where they appear inside a message, leave them in
  Chinese in **every** language — translate only the sentence around them.
- Keep the quoting convention: single quotes, switching to double quotes for any string
  containing an apostrophe.

## Architecture

```
src/
  core/         provider-neutral types, note/section helpers
  providers/    one adapter per AI CLI; the only place child_process is used
  features/     journal/, digest/, news/, facts/
  settings/     settings tab and defaults
  i18n/         index.ts + locales/
```

Feature code depends only on `core/`, never on a concrete provider. That is what keeps an
API-backed provider addable later without touching feature code — please preserve it.

Two conventions worth knowing before changing behaviour:

- **Writes are confined to the journal folder.** `isJournalNote()` guards every command so
  a note outside it is never modified.
- **AI output appends with a timestamp** rather than replacing, so running a command twice
  in one day does not discard the earlier result.

## Reporting bugs

Say which AI CLI you configured and what the notice said. If a command did nothing, the
usual cause is a CLI that needs a non-interactive flag — see the README's CLI setup.
