import { existsSync } from 'fs';

/**
 * Per-CLI knowledge: the flags each tool needs to run one prompt
 * non-interactively, and how it expects to receive that prompt.
 *
 * Kept here so the reader picks their CLI from a list instead of discovering
 * by trial and error that, say, `claude` returns nothing without `-p`.
 */
export type PromptDelivery = 'stdin' | 'argument';

export interface CliPreset {
    id: string;
    /** Shown in the settings dropdown. */
    label: string;
    /** Default executable name; the reader can override with a full path. */
    command: string;
    /**
     * Where the installer usually puts it, per platform. A GUI app does not
     * inherit the shell's PATH, so the bare command often fails under
     * Obsidian even when it works in a terminal — these are tried in order
     * before falling back to the bare name.
     */
    candidates?: { win32: string[]; darwin: string[]; linux: string[] };
    /** Flags that make the CLI run a single prompt and exit. */
    baseArgs: string[];
    /** Flags added only when the reader enables link research. */
    researchArgs: string[];
    /** How the prompt reaches the CLI. */
    delivery: PromptDelivery;
    /** How the model is named, when one is set. */
    modelFlag: string;
    /** How reasoning effort is named, or '' if the CLI has no such flag. */
    effortFlag: string;
    /** Effort levels this CLI accepts, in order. Empty means no effort control. */
    effortLevels: string[];
    /**
     * Whether this preset has been verified against the real CLI. Presets that
     * have not are still offered, but the settings tab says so rather than
     * implying a guarantee.
     */
    verified: boolean;
}

export const CLI_PRESETS: CliPreset[] = [
    {
        id: 'claude',
        label: 'Claude Code',
        command: 'claude',
        candidates: {
            win32: ['%USERPROFILE%/.local/bin/claude.exe',
                    '%USERPROFILE%/.local/bin/claude',
                    '%LOCALAPPDATA%/Programs/claude/claude.exe'],
            darwin: ['$HOME/.local/bin/claude', '/opt/homebrew/bin/claude', '/usr/local/bin/claude'],
            linux: ['$HOME/.local/bin/claude', '/usr/local/bin/claude']
        },
        baseArgs: ['-p'],
        researchArgs: ['--allowedTools', 'WebFetch,WebSearch'],
        delivery: 'stdin',
        modelFlag: '--model',
        effortFlag: '--effort',
        effortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
        verified: true
    },
    {
        id: 'antigravity',
        label: 'Antigravity (agy)',
        command: 'agy',
        candidates: {
            win32: ['%LOCALAPPDATA%/agy/bin/agy.exe',
                    '%LOCALAPPDATA%/agy/bin/agy'],
            darwin: ['$HOME/.agy/bin/agy', '/opt/homebrew/bin/agy', '/usr/local/bin/agy'],
            linux: ['$HOME/.agy/bin/agy', '/usr/local/bin/agy']
        },
        // agy's -p takes the prompt as its argument rather than reading stdin.
        baseArgs: ['-p'],
        researchArgs: [],
        delivery: 'argument',
        modelFlag: '--model',
        effortFlag: '--effort',
        effortLevels: ['low', 'medium', 'high'],
        verified: true
    },
    {
        id: 'codex',
        label: 'Codex (ChatGPT)',
        command: 'codex',
        candidates: {
            win32: ['%APPDATA%/npm/codex.cmd', '%APPDATA%/npm/codex'],
            darwin: ['/opt/homebrew/bin/codex', '/usr/local/bin/codex'],
            linux: ['/usr/local/bin/codex']
        },
        baseArgs: ['exec'],
        researchArgs: [],
        delivery: 'argument',
        modelFlag: '--model',
        // Documented as model_reasoning_effort; not verified against the real
        // CLI, which is not installed here.
        effortFlag: '-c model_reasoning_effort=',
        effortLevels: ['minimal', 'low', 'medium', 'high'],
        verified: false
    },
    {
        id: 'custom',
        label: 'Custom',
        command: '',
        baseArgs: [],
        researchArgs: [],
        delivery: 'stdin',
        modelFlag: '--model',
        // Unknown CLI: pass nothing rather than guessing a flag it may reject.
        effortFlag: '',
        effortLevels: [],
        verified: true
    }
];

export function presetById(id: string): CliPreset {
    return CLI_PRESETS.find(p => p.id === id) ?? CLI_PRESETS[CLI_PRESETS.length - 1];
}

/**
 * The first candidate path that exists on this machine, or '' if none do.
 *
 * Obsidian is a GUI app and does not inherit the shell's PATH, so a bare
 * command name that works in a terminal frequently fails here. Probing the
 * usual install locations means most people never have to find the path
 * themselves.
 */
export function detectCommand(preset: CliPreset): string {
    const list = preset.candidates?.[process.platform as 'win32' | 'darwin' | 'linux'];
    if (!list) return '';

    for (const raw of list) {
        const path = raw
            .replace(/%([^%]+)%/g, (_, name: string) => process.env[name] ?? '')
            .replace(/\$HOME/g, process.env.HOME ?? process.env.USERPROFILE ?? '');
        if (!path.includes('%') && !path.includes('$') && existsSync(path)) return path;
    }
    return '';
}
