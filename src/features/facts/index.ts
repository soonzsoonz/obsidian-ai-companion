import { Notice, normalizePath, type App, type Plugin } from 'obsidian';
import type { ProviderCore } from '../../core';
import { ensureNote, formatDate, journalPath, readSection } from '../../core/notes';
import type { AICompanionSettings } from '../../settings';
import { t } from '../../i18n';

const TABLE_FILE = 'facts.md';
const LOG_FILE = '_log.md';

/**
 * Maintains what the AI knows about the writer.
 *
 * Two files, deliberately:
 *  - facts.md is the current picture, rewritten as understanding improves.
 *  - _log.md is append-only provenance. Because AI output is written into the
 *    vault directly, the log is what lets the writer tell later what the AI
 *    inferred, and from which day's entry, versus what they wrote themselves.
 */
export class FactsFeature {
    constructor(
        private plugin: Plugin,
        private providerCore: ProviderCore,
        private settings: () => AICompanionSettings
    ) {}

    private get app(): App {
        return this.plugin.app;
    }

    private path(file: string): string {
        const folder = this.settings().facts.folder || 'facts';
        return normalizePath(`${folder}/${file}`);
    }

    /**
     * Opens the fact table for reading and hand-editing.
     *
     * It is an ordinary note on purpose: when the AI records something wrong,
     * correcting it should be as easy as editing any other note, and the next
     * run reads the corrected version back.
     */
    async open(): Promise<void> {
        const path = this.path(TABLE_FILE);
        const file = this.app.vault.getFileByPath(path)
            ?? await ensureNote(this.app, path, '# ' + t('FACTS_EMPTY_HEADING') + '\n');
        await this.app.workspace.getLeaf(false).openFile(file);
    }

    /** Current fact table, for injecting into other features' prompts. */
    async read(): Promise<string> {
        if (!this.settings().facts.enable) return '';
        const file = this.app.vault.getFileByPath(this.path(TABLE_FILE));
        return file ? (await this.app.vault.read(file)).trim() : '';
    }

    async accumulate(date = new Date()): Promise<void> {
        const cfg = this.settings();
        if (!cfg.facts.enable) {
            new Notice(t('NOTICE_FACTS_DISABLED'));
            return;
        }

        const journal = this.app.vault.getFileByPath(
            journalPath(cfg.journal.folder, date, cfg.journal.dateFormat)
        );
        if (!journal) {
            new Notice(t('NOTICE_JOURNAL_EMPTY'));
            return;
        }

        const entry = readSection(await this.app.vault.read(journal), 'journal');
        if (!entry.replace(/[-*\s]/g, '')) {
            new Notice(t('NOTICE_JOURNAL_EMPTY'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const existing = await this.read();
        const stamp = formatDate(date, 'YYYY-MM-DD');
        const res = await this.providerCore.generate(this.buildPrompt(entry, existing, stamp));

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? `: ${res.error}` : ''));
            return;
        }

        const table = await ensureNote(this.app, this.path(TABLE_FILE), '');
        await this.app.vault.modify(table, res.data.trim() + '\n');

        // Append-only: never rewrite, so history stays auditable.
        const log = await ensureNote(this.app, this.path(LOG_FILE), '# Fact log\n');
        await this.app.vault.append(log, `\n## ${stamp}\n\nUpdated from journal [[${journal.basename}]].\n`);

        new Notice(t('NOTICE_FACTS_ACCUMULATED'));
    }

    private buildPrompt(entry: string, existing: string, stamp: string): string {
        return [
            'You maintain a factual profile of a person from their daily journal.',
            'Return the COMPLETE updated profile as markdown — it replaces the old one.',
            '',
            'Rules:',
            '- Record durable facts only: people and relationships, ongoing projects,',
            '  goals, recurring problems, constraints, preferences.',
            '- Skip one-off events and passing moods. Those belong in the journal, not here.',
            '- Merge duplicates. If a problem recurs across days, keep ONE entry and note it is ongoing.',
            '- Never invent. If the entry does not support a fact, leave it out.',
            '- Write in the same language as the journal.',
            '',
            'State each fact as it is NOW, not as a history of how it changed.',
            'Rewrite the fact; do not append the update to it. So a project whose',
            'submission was rejected and later approved reads "已上架 (2026-08-15)",',
            'NOT "送審 (08-04); 被拒 (08-07); 上架 (08-15)". Keep one date: when the',
            'current state was learned. The journal already holds the history — this',
            'file is the current picture, and it has to stay readable after months',
            'of updates.',
            '',
            'Use exactly these headings, and put every line under one of them:',
            '## People',
            '## Projects',
            '## Goals',
            '## Ongoing issues',
            '## Resolved',
            '',
            'When a problem is fixed, MOVE it from Ongoing issues to Resolved with',
            'the date it was resolved. Never leave text outside a heading.',
            '',
            existing ? `Current profile:\n${existing}` : 'No profile yet — create one.',
            '',
            `Journal entry for ${stamp}:`,
            entry
        ].join('\n');
    }
}
