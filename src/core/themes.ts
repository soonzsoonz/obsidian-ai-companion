/**
 * Optional styling for the sections the plugin writes.
 *
 * Off by default. Many people already style their vault with a theme or a CSS
 * snippet, and a plugin that repaints their notes uninvited is a nuisance —
 * so this is something to switch on, not something to switch off.
 *
 * Every style is scoped to `.ai-journey-styled` on the markdown container, and
 * built from Obsidian's own CSS variables, so a chosen style still follows the
 * reader's theme and their light/dark setting rather than fighting it.
 */
export interface StyleTheme {
    id: string;
    /** Shown in the settings dropdown; localised via its i18n key. */
    labelKey: 'STYLE_NONE' | 'STYLE_CARDS' | 'STYLE_QUIET' | 'STYLE_MAGAZINE';
    css: string;
}

const CARDS = `
.ai-journey-styled .ai-journey-section {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 0.85rem 1.1rem;
    margin-bottom: 0.9rem;
}
.ai-journey-styled .ai-journey-section-heading {
    margin-top: 0;
    font-size: var(--font-ui-medium);
    letter-spacing: 0.02em;
    color: var(--text-accent);
}
.ai-journey-styled .ai-journey-ai .ai-journey-section-heading::before {
    content: "✦ ";
    opacity: 0.7;
}
.ai-journey-styled .ai-journey-stamp {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
}
.ai-journey-styled .ai-journey-section hr {
    border: none;
    border-top: 1px dashed var(--background-modifier-border);
    margin: 0.9rem 0;
}
`;

const QUIET = `
.ai-journey-styled .ai-journey-ai {
    border-left: 3px solid var(--background-modifier-border);
    padding-left: 0.9rem;
    margin-bottom: 0.9rem;
}
.ai-journey-styled .ai-journey-ai .ai-journey-section-heading {
    font-size: var(--font-ui-small);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
}
.ai-journey-styled .ai-journey-stamp {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
}
`;

const MAGAZINE = `
.ai-journey-styled .ai-journey-section-heading {
    font-family: var(--font-text);
    font-size: 1.25em;
    border-bottom: 2px solid var(--text-accent);
    padding-bottom: 0.25rem;
    margin-bottom: 0.7rem;
}
.ai-journey-styled .ai-journey-ai {
    margin-bottom: 1.2rem;
}
.ai-journey-styled .ai-journey-ai strong {
    color: var(--text-accent);
}
.ai-journey-styled .ai-journey-stamp {
    display: inline-block;
    font-size: var(--font-ui-smaller);
    color: var(--text-on-accent);
    background: var(--text-accent);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
}
.ai-journey-styled .ai-journey-ai hr {
    border: none;
    border-top: 1px solid var(--background-modifier-border);
    margin: 1rem 0;
}
`;

export const STYLE_THEMES: StyleTheme[] = [
    { id: 'none', labelKey: 'STYLE_NONE', css: '' },
    { id: 'cards', labelKey: 'STYLE_CARDS', css: CARDS },
    { id: 'quiet', labelKey: 'STYLE_QUIET', css: QUIET },
    { id: 'magazine', labelKey: 'STYLE_MAGAZINE', css: MAGAZINE }
];

export function themeById(id: string): StyleTheme {
    return STYLE_THEMES.find(theme => theme.id === id) ?? STYLE_THEMES[0];
}
