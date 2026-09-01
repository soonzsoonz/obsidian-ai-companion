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
    /** Flags that make the CLI run a single prompt and exit. */
    baseArgs: string[];
    /** Flags added only when the reader enables link research. */
    researchArgs: string[];
    /** How the prompt reaches the CLI. */
    delivery: PromptDelivery;
    /** How the model is named, when one is set. */
    modelFlag: string;
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
        baseArgs: ['-p'],
        researchArgs: ['--allowedTools', 'WebFetch,WebSearch'],
        delivery: 'stdin',
        modelFlag: '--model',
        verified: true
    },
    {
        id: 'antigravity',
        label: 'Antigravity (agy)',
        command: 'agy',
        // agy's -p takes the prompt as its argument rather than reading stdin.
        baseArgs: ['-p'],
        researchArgs: [],
        delivery: 'argument',
        modelFlag: '--model',
        verified: true
    },
    {
        id: 'codex',
        label: 'Codex (ChatGPT)',
        command: 'codex',
        baseArgs: ['exec'],
        researchArgs: [],
        delivery: 'argument',
        modelFlag: '--model',
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
        verified: true
    }
];

export function presetById(id: string): CliPreset {
    return CLI_PRESETS.find(p => p.id === id) ?? CLI_PRESETS[CLI_PRESETS.length - 1];
}
