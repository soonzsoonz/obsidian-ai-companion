# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub security advisories](https://github.com/soonzsoonz/obsidian-ai-companion/security/advisories/new)
rather than in a public issue.

## What this plugin does with your data

Worth understanding before you install it, since a journal is unusually personal.

- **It spawns a local AI CLI** (`child_process.spawn`, no shell) and pipes your journal text
  and shared links to it on stdin. Where that data goes next is governed by the CLI you
  configured and its provider, not by this plugin. Your journal may contain health details
  and family matters — choose that CLI deliberately.
- **It writes directly into your vault** with no confirmation step, though only into the
  sections and folders documented in the README.
- **It sends nothing anywhere else.** There is no telemetry, no analytics, and no network
  code in the plugin itself. Any web access comes from the CLI you configured, and only if
  you enabled research or passed the flags that permit it.
- **Everything stays local.** Settings live in your vault's `.obsidian` folder; the fact
  table and all output are ordinary notes you can read, edit, and delete.

## Scope

The plugin executes the command you name in settings. Pointing it at an untrusted executable
runs that executable with your permissions — that is inherent to the design, not a
vulnerability. Reports concerning the plugin passing data somewhere it should not, writing
outside its documented folders, or mishandling the command it spawns are in scope.
