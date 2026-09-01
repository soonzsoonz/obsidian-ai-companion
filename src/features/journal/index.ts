import { Notice, normalizePath, type App, type Plugin } from 'obsidian';
import type { ProviderCore } from '../../core';
import {
    clockTime, ensureNote, formatDate, isJournalNote, journalPath, readSection, writeSection, SECTIONS
} from '../../core/notes';
import type { AICompanionSettings } from '../../settings';
import { renderRoleGuidance } from '../../core/roles';
import { t } from '../../i18n';

/**
 * Skeleton written into a freshly created daily note.
 *
 * Only the two sections the writer fills in themselves are laid out; AI回饋
 * and AI整理社群新知 are created by the commands that populate them, so an
 * untouched note is not full of empty AI headings.
 */
export function dailyTemplate(date: Date, format: string): string {
    return [
        '---',
        'title:',
        'date: ' + formatDate(date, format),
        '---',
        '',
        SECTIONS.journal,
        '',
        '- ',
        '',
        SECTIONS.shares,
        '',
        '- ',
        ''
    ].join('\n');
}

/**
 * Reads the day's 日誌 section and writes practical advice into AI回饋 —
 * covering both the health and the life/work sides of what was written.
 */
export class JournalFeature {
    constructor(
        private plugin: Plugin,
        private providerCore: ProviderCore,
        private settings: () => AICompanionSettings,
        private facts: { read(): Promise<string> }
    ) {}

    private get app(): App {
        return this.plugin.app;
    }

    /**
     * Opens the day's journal note, creating it from the template first.
     *
     * A template path in settings wins over the built-in skeleton, so the
     * layout can be customised without touching the plugin — but the four
     * canonical headings are what the AI commands look for, so a custom
     * template that drops them will leave those commands with nowhere to write.
     */
    async openToday(date = new Date()): Promise<void> {
        const cfg = this.settings();
        const path = journalPath(cfg.journal.folder, date, cfg.journal.dateFormat);

        let initial = dailyTemplate(date, cfg.journal.dateFormat);
        const templatePath = cfg.journal.templatePath.trim();
        if (templatePath) {
            const tpl = this.app.vault.getFileByPath(normalizePath(templatePath));
            if (tpl) {
                initial = (await this.app.vault.read(tpl))
                    .replace(/\{\{date\}\}/g, formatDate(date, cfg.journal.dateFormat))
                    .replace(/\{\{time\}\}/g, clockTime(date));
            } else {
                new Notice(t('NOTICE_TEMPLATE_MISSING') + ': ' + templatePath);
            }
        }

        const file = await ensureNote(this.app, path, initial);
        await this.app.workspace.getLeaf(false).openFile(file);
    }

    async generateFeedback(date = new Date()): Promise<void> {
        const cfg = this.settings();

        // Prefer the note the reader is looking at, so feedback lands on the
        // day they are actually editing rather than always on today.
        const active = this.app.workspace.getActiveFile();
        const file = active && isJournalNote(active.path, cfg.journal.folder)
            ? active
            : await ensureNote(
                this.app,
                journalPath(cfg.journal.folder, date, cfg.journal.dateFormat),
                dailyTemplate(date, cfg.journal.dateFormat)
            );
        const content = await this.app.vault.read(file);
        const entry = readSection(content, 'journal');

        if (!entry.replace(/[-*\s]/g, '')) {
            new Notice(t('NOTICE_JOURNAL_EMPTY'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const known = await this.facts.read();
        const res = await this.providerCore.generate(this.buildPrompt(
            entry, known, renderRoleGuidance(cfg.roles.rules, cfg.roles.roles)
        ));

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? `: ${res.error}` : ''));
            return;
        }

        // Stamped and appended: several runs a day accumulate, so the reader
        // can see how the advice changed as the day's entry grew.
        const stamp = '*' + formatDate(date, 'YYYY-MM-DD') + ' ' + clockTime(date) + '*';
        const prior = readSection(await this.app.vault.read(file), 'feedback');
        const block = stamp + '\n\n' + res.data.trim();
        const merged = prior ? prior + '\n\n---\n\n' + block : block;

        await this.app.vault.modify(
            file,
            writeSection(await this.app.vault.read(file), 'feedback', merged)
        );
        new Notice(t('NOTICE_DONE'));
    }

    private buildPrompt(entry: string, known: string, roleGuidance: string): string {
        return [
            'You respond to what someone wrote in their journal today.',
            'A journal holds all of a life at once — family, work, worry, small',
            'pleasures. Meet each part on its own terms.',
            '',
            roleGuidance,
            '',
            'Rules:',
            '- Reply in the same language as the journal entry.',
            '- Output a markdown bullet list only. No preamble, no heading.',
            '- Be specific. Do not restate what they wrote back to them.',
            '- If something is outside your competence (medical, legal), say so plainly and briefly.',
            '- Not everything needs advice. Some things just need acknowledging.',
            known ? `\nWhat you already know about this person:\n${known}` : '',
            '',
            "Today's journal entry:",
            entry
        ].filter(Boolean).join('\n');
    }
}
