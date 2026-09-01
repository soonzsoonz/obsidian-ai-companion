import type { App, TFile } from 'obsidian';
import { normalizePath } from 'obsidian';
import { allTranslations, t } from '../i18n';

export type SectionKey = 'journal' | 'feedback' | 'shares' | 'digest';

const SECTION_ORDER: SectionKey[] = ['journal', 'feedback', 'shares', 'digest'];

const SECTION_KEYS = {
    journal: 'SECTION_JOURNAL',
    feedback: 'SECTION_FEEDBACK',
    shares: 'SECTION_SHARES',
    digest: 'SECTION_DIGEST'
} as const;

/**
 * Headings the plugin wrote before they were localised. Kept so vaults created
 * with earlier versions keep working; they are recognised but never written.
 */
const LEGACY_HEADINGS: Record<SectionKey, string[]> = {
    journal: ['日誌'],
    feedback: ['AI回饋'],
    shares: ['今日社群轉貼'],
    digest: ['AI整理社群新知']
};

/** The heading written for new sections, in the reader's language. */
export function sectionHeading(key: SectionKey): string {
    return '## ' + t(SECTION_KEYS[key]);
}

/**
 * Every heading that counts as this section, in any language.
 *
 * Recognising all of them is what lets someone switch Obsidian's language, or
 * open a vault written in another, without their existing notes going
 * unrecognised and a second set of headings appearing alongside the first.
 */
export function sectionAliases(key: SectionKey): string[] {
    const names = [...allTranslations(SECTION_KEYS[key]), ...LEGACY_HEADINGS[key]];
    return [...new Set(names)].map(name => '## ' + name);
}

/** Finds where a section's heading starts, or -1. Matches any language. */
function findHeading(content: string, key: SectionKey): { start: number; heading: string } | null {
    for (const heading of sectionAliases(key)) {
        // Anchor to line starts so "## AI Feedback" cannot match inside a line.
        const idx = content.search(
            new RegExp('^' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm')
        );
        if (idx !== -1) return { start: idx, heading };
    }
    return null;
}

/**
 * Canonical section headings, in the reader's current language.
 * Order matters: it is the order sections are created in when absent.
 */
export const SECTIONS = {
    get journal() { return sectionHeading('journal'); },
    get feedback() { return sectionHeading('feedback'); },
    get shares() { return sectionHeading('shares'); },
    get digest() { return sectionHeading('digest'); }
};

/** Formats a Date using the subset of moment tokens used by the date-format setting. */
export function formatDate(date: Date, format: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
        .replace(/YYYY/g, String(date.getFullYear()))
        .replace(/MM/g, pad(date.getMonth() + 1))
        .replace(/DD/g, pad(date.getDate()));
}

/** HH:mm, for stamping when a piece of AI output was produced. */
export function clockTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function journalPath(folder: string, date: Date, format: string): string {
    const name = `${formatDate(date, format)}.md`;
    return normalizePath(folder ? `${folder}/${name}` : name);
}

/**
 * The folder that holds notes belonging to one journal day.
 *
 * Obsidian files cannot have children, but a folder sharing the note's name
 * is displayed alongside it and reads as its subtree — so every report the
 * AI generates on a given day lands here, next to that day's journal.
 */
export function journalChildFolder(folder: string, date: Date, format: string): string {
    const name = formatDate(date, format);
    return normalizePath(folder ? `${folder}/${name}` : name);
}

/**
 * Whether a path lies inside the journal folder.
 *
 * The AI commands only ever act on journal notes. A note outside that folder
 * is someone else's — a meeting note, a project page — and running a command
 * while it is open must neither rewrite it nor silently retarget today's
 * journal behind the reader's back.
 */
export function isJournalNote(path: string, journalFolder: string): boolean {
    const folder = normalizePath(journalFolder).replace(/\/+$/, '');
    if (!folder) return true; // journal is the vault root: everything qualifies
    return normalizePath(path).startsWith(folder + '/');
}

/** Reads the body of one section, excluding the heading itself. */
export function readSection(content: string, key: SectionKey): string {
    const found = findHeading(content, key);
    if (!found) return '';
    const bodyStart = found.start + found.heading.length;
    const next = content.slice(bodyStart).search(/^## /m);
    const body = next === -1 ? content.slice(bodyStart) : content.slice(bodyStart, bodyStart + next);
    return body.trim();
}

/**
 * Replaces a section's body, creating the section if absent. New sections are
 * inserted at their canonical position rather than appended, so a note keeps
 * the documented layout however it was first written.
 *
 * An existing section keeps the heading it already has, whatever language that
 * is in: rewriting someone's headings because they switched Obsidian's
 * language would be a surprising edit to make on their behalf.
 */
export function writeSection(content: string, key: SectionKey, body: string): string {
    const found = findHeading(content, key);
    const heading = found ? found.heading : sectionHeading(key);
    const block = `${heading}\n\n${body.trim()}\n`;

    if (found) {
        const bodyStart = found.start + found.heading.length;
        const rel = content.slice(bodyStart).search(/^## /m);
        const end = rel === -1 ? content.length : bodyStart + rel;
        return `${content.slice(0, found.start)}${block}\n${content.slice(end).replace(/^\n+/, '')}`;
    }

    // Insert before the first section that should follow this one.
    const laterKeys = SECTION_ORDER.slice(SECTION_ORDER.indexOf(key) + 1);
    for (const later of laterKeys) {
        const idx = findHeading(content, later);
        if (idx) {
            return `${content.slice(0, idx.start)}${block}\n${content.slice(idx.start)}`;
        }
    }
    const prefix = content.trim() ? `${content.replace(/\n+$/, '')}\n\n` : '';
    return `${prefix}${block}`;
}

/** Returns the file at `path`, creating it (and parent folders) if needed. */
export async function ensureNote(app: App, path: string, initial = ''): Promise<TFile> {
    const existing = app.vault.getFileByPath(path);
    if (existing) return existing;

    const slash = path.lastIndexOf('/');
    if (slash > 0) {
        const folder = path.slice(0, slash);
        if (!app.vault.getFolderByPath(folder)) {
            await app.vault.createFolder(folder).catch(() => { /* raced or exists */ });
        }
    }
    return app.vault.create(path, initial);
}

/** Extracts markdown links from a section body, as {title, url} pairs. */
export function extractLinks(body: string): { title: string; url: string }[] {
    const out: { title: string; url: string }[] = [];
    const seen = new Set<string>();
    const re = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
        const url = (m[2] ?? m[3] ?? '').replace(/[.,;)]+$/, '');
        if (!url || seen.has(url)) continue;
        seen.add(url);
        const lineStart = body.lastIndexOf('\n', m.index) + 1;
        const label = m[1]?.trim();
        const line = body.slice(lineStart, m.index).replace(/^[-*]\s*/, '').replace(/[:：]\s*$/, '').trim();
        out.push({ title: label || line || url, url });
    }
    return out;
}
