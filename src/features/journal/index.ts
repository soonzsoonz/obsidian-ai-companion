import { Notice, type App, type Plugin } from 'obsidian';
import type { ProviderCore } from '../../core';
import { ensureNote, journalPath, readSection, writeSection, SECTIONS } from '../../core/notes';
import type { AIJourneySettings } from '../../settings';
import { t } from '../../i18n';

/** Skeleton written into a freshly created daily note. */
export function dailyTemplate(): string {
    return [SECTIONS.journal, '', '- ', '', SECTIONS.shares, '', '- ', ''].join('\n');
}

/**
 * Reads the day's 日誌 section and writes practical advice into AI回饋 —
 * covering both the health and the life/work sides of what was written.
 */
export class JournalFeature {
    constructor(
        private plugin: Plugin,
        private providerCore: ProviderCore,
        private settings: () => AIJourneySettings,
        private facts: { read(): Promise<string> }
    ) {}

    private get app(): App {
        return this.plugin.app;
    }

    async generateFeedback(date = new Date()): Promise<void> {
        const cfg = this.settings();
        const path = journalPath(cfg.journal.folder, date, cfg.journal.dateFormat);
        const file = await ensureNote(this.app, path, dailyTemplate());
        const content = await this.app.vault.read(file);
        const entry = readSection(content, 'journal');

        if (!entry.replace(/[-*\s]/g, '')) {
            new Notice(t('NOTICE_JOURNAL_EMPTY'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const known = await this.facts.read();
        const res = await this.providerCore.generate(this.buildPrompt(entry, known));

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? `: ${res.error}` : ''));
            return;
        }

        const updated = writeSection(await this.app.vault.read(file), 'feedback', res.data);
        await this.app.vault.modify(file, updated);
        new Notice(t('NOTICE_DONE'));
    }

    private buildPrompt(entry: string, known: string): string {
        return [
            'You are a practical, grounded companion for a founder who keeps a daily journal.',
            'You are NOT a wellness guru: skip affirmations and therapy-speak.',
            'Give concrete, useful responses about real life and real work.',
            '',
            'Cover, only where the entry actually warrants it:',
            '- Health: practical advice on any health matter mentioned (theirs or family).',
            '- Life and work: brief, honest thoughts on difficulties, decisions, or family matters.',
            '- Follow-ups: anything worth checking or acting on.',
            '',
            'Rules:',
            '- Reply in the same language as the journal entry.',
            '- Output a markdown bullet list only. No preamble, no heading.',
            '- Be specific. Do not restate what they wrote back to them.',
            '- If something is outside your competence (medical, legal), say so plainly and briefly.',
            known ? `\nWhat you already know about this person:\n${known}` : '',
            '',
            "Today's journal entry:",
            entry
        ].filter(Boolean).join('\n');
    }
}
