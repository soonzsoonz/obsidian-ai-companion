import type { App, TFile } from 'obsidian';
import { normalizePath } from 'obsidian';

/** Canonical section headings of a daily note. Order matters: it is the order
 *  sections are created in when a note is missing them. */
export const SECTIONS = {
    journal: '## 日誌',
    feedback: '## AI回饋',
    shares: '## 今日社群轉貼',
    digest: '## AI整理社群新知'
} as const;

export type SectionKey = keyof typeof SECTIONS;

const SECTION_ORDER: SectionKey[] = ['journal', 'feedback', 'shares', 'digest'];

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
    const heading = SECTIONS[key];
    const start = content.indexOf(heading);
    if (start === -1) return '';
    const bodyStart = start + heading.length;
    const next = content.slice(bodyStart).search(/^## /m);
    const body = next === -1 ? content.slice(bodyStart) : content.slice(bodyStart, bodyStart + next);
    return body.trim();
}

/**
 * Replaces a section's body, creating the section if absent. New sections are
 * inserted at their canonical position rather than appended, so a note keeps
 * the documented layout however it was first written.
 */
export function writeSection(content: string, key: SectionKey, body: string): string {
    const heading = SECTIONS[key];
    const block = `${heading}\n\n${body.trim()}\n`;
    const start = content.indexOf(heading);

    if (start !== -1) {
        const bodyStart = start + heading.length;
        const rel = content.slice(bodyStart).search(/^## /m);
        const end = rel === -1 ? content.length : bodyStart + rel;
        return `${content.slice(0, start)}${block}\n${content.slice(end).replace(/^\n+/, '')}`;
    }

    // Insert before the first section that should follow this one.
    const laterKeys = SECTION_ORDER.slice(SECTION_ORDER.indexOf(key) + 1);
    for (const later of laterKeys) {
        const idx = content.indexOf(SECTIONS[later]);
        if (idx !== -1) {
            return `${content.slice(0, idx)}${block}\n${content.slice(idx)}`;
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
