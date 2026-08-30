import { Notice, normalizePath, type App, type Plugin } from 'obsidian';
import type { ProviderCore } from '../../core';
import {
    ensureNote, extractLinks, formatDate, journalPath, readSection, writeSection
} from '../../core/notes';
import type { AIJourneySettings } from '../../settings';
import { t } from '../../i18n';

/** The per-item shape carried over from the author's existing Notion digests,
 *  kept verbatim so old and new archives stay comparable. */
const ITEM_FORMAT = [
    '- **來源標題**: <title> ([原始連結](<url>))',
    '- **核心結論**: <the concrete takeaway>',
    '- **為什麼重要**: <why it matters to this reader>'
].join('\n');

export class DigestFeature {
    constructor(
        private plugin: Plugin,
        private providerCore: ProviderCore,
        private settings: () => AIJourneySettings,
        private facts: { read(): Promise<string> }
    ) {}

    private get app(): App {
        return this.plugin.app;
    }

    /** Summarises each link shared today into the 來源標題/核心結論/為什麼重要 triple. */
    async generate(date = new Date()): Promise<void> {
        const cfg = this.settings();
        const path = journalPath(cfg.journal.folder, date, cfg.journal.dateFormat);
        const file = this.app.vault.getFileByPath(path);
        if (!file) {
            new Notice(t('NOTICE_NO_SHARES'));
            return;
        }

        const links = extractLinks(readSection(await this.app.vault.read(file), 'shares'));
        if (links.length === 0) {
            new Notice(t('NOTICE_NO_SHARES'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const known = await this.facts.read();
        const res = await this.providerCore.generate(this.buildDigestPrompt(links, known));

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? `: ${res.error}` : ''));
            return;
        }

        const updated = writeSection(await this.app.vault.read(file), 'digest', res.data);
        await this.app.vault.modify(file, updated);
        new Notice(t('NOTICE_DIGEST_GENERATED'));
    }

    /**
     * The cross-post synthesis: gathers links shared over the last `days` and,
     * instead of summarising each, groups them by theme and writes one how-to
     * guide per theme. This is what turns ten scattered posts about prompting
     * into a single usable reference.
     */
    async synthesizeTheme(days = 7, date = new Date()): Promise<void> {
        const cfg = this.settings();
        const collected: { title: string; url: string }[] = [];

        for (let i = 0; i < days; i++) {
            const day = new Date(date);
            day.setDate(day.getDate() - i);
            const file = this.app.vault.getFileByPath(
                journalPath(cfg.journal.folder, day, cfg.journal.dateFormat)
            );
            if (!file) continue;
            collected.push(...extractLinks(readSection(await this.app.vault.read(file), 'shares')));
        }

        if (collected.length === 0) {
            new Notice(t('NOTICE_NO_SHARES'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const known = await this.facts.read();
        const res = await this.providerCore.generate(this.buildSynthesisPrompt(collected, known, days));

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? `: ${res.error}` : ''));
            return;
        }

        const stamp = formatDate(date, 'YYYY-MM-DD');
        const folder = cfg.journal.folder ? `${cfg.journal.folder}/themes` : 'themes';
        const out = await ensureNote(this.app, normalizePath(`${folder}/${stamp} theme guide.md`), '');
        await this.app.vault.modify(out, res.data.trim() + '\n');

        new Notice(t('NOTICE_SYNTHESIS_DONE'));
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(out);
    }

    private buildDigestPrompt(links: { title: string; url: string }[], known: string): string {
        return [
            'You summarise links a founder shared today into a daily knowledge digest.',
            '',
            'For EACH link, output exactly this three-line block:',
            ITEM_FORMAT,
            '',
            'Separate blocks with a line containing only: ---',
            '',
            'Rules:',
            '- 核心結論 is the concrete takeaway, not a description of the article.',
            '- 為什麼重要 must connect to this reader specifically. Be honest when',
            '  something is only marginally relevant — say so rather than inflating it.',
            '- Reply in Traditional Chinese unless the shared items are clearly another language.',
            '- Output only the blocks. No preamble, no heading.',
            known ? `\nAbout this reader:\n${known}` : '',
            '',
            'Links shared today:',
            ...links.map((l, i) => `${i + 1}. ${l.title} — ${l.url}`)
        ].filter(Boolean).join('\n');
    }

    private buildSynthesisPrompt(
        links: { title: string; url: string }[], known: string, days: number
    ): string {
        return [
            `You are given every link a founder shared over the last ${days} days.`,
            'Do NOT summarise them one by one. Instead:',
            '',
            '1. Group them into themes. A theme needs at least 2 related links;',
            '   drop anything that does not cluster.',
            '2. For each theme, write ONE practical guide that synthesises across',
            '   its sources — comparing approaches, noting where they differ, and',
            '   ending with concrete steps the reader can actually follow.',
            '3. Prefer depth over coverage. Two strong themes beat six thin ones.',
            '',
            'Structure per theme:',
            '## <theme name>',
            '<what this cluster is collectively about, 1-2 sentences>',
            '### 做法',
            '<the synthesised how-to, in steps>',
            '### 不同風格 / 取捨',
            '<how the sources differ and when to pick which>',
            '### 來源',
            '<markdown links to the sources used>',
            '',
            'Rules:',
            '- Reply in Traditional Chinese unless the sources are clearly another language.',
            '- Base claims on the linked material. Where you are inferring, say so.',
            '- Output only the themed sections.',
            known ? `\nAbout this reader:\n${known}` : '',
            '',
            'Shared links:',
            ...links.map((l, i) => `${i + 1}. ${l.title} — ${l.url}`)
        ].filter(Boolean).join('\n');
    }
}
