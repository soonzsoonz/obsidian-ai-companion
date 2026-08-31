import { Notice, normalizePath, type App, type Plugin } from 'obsidian';
import type { ProviderCore } from '../../core';
import {
    clockTime, ensureNote, extractLinks, formatDate, journalPath, readSection, writeSection
} from '../../core/notes';
import type { AIJourneySettings } from '../../settings';
import { NewsInbox, type Share } from '../news';
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
        private facts: { read(): Promise<string> },
        private inbox: NewsInbox
    ) {}

    private get app(): App {
        return this.plugin.app;
    }

    /**
     * Digests today's shared links into the 來源標題/核心結論/為什麼重要 triple.
     *
     * Sources are the note's own 今日社群轉貼 section plus anything sitting
     * unprocessed in the news landing folder (where mobile shares arrive).
     * Because new shares can appear at any time, this appends to the digest
     * section rather than replacing it, so an afternoon run adds to the
     * morning's entries instead of discarding them.
     */
    async generate(date = new Date()): Promise<void> {
        const cfg = this.settings();
        const path = journalPath(cfg.journal.folder, date, cfg.journal.dateFormat);
        const file = await ensureNote(this.app, path, '');

        const inline = extractLinks(readSection(await this.app.vault.read(file), 'shares'));
        const shares = await this.inbox.pending();
        const items = [
            ...inline,
            ...shares.map(s => ({ title: s.title, url: s.url }))
        ].filter(i => i.url);

        if (items.length === 0) {
            new Notice(t('NOTICE_NO_SHARES'));
            return;
        }

        new Notice(t('NOTICE_GENERATING'));
        const known = await this.facts.read();
        const res = await this.providerCore.generate(
            this.buildDigestPrompt(items, known, shares, cfg.news.research)
        );

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? ': ' + res.error : ''));
            return;
        }

        const stamp = formatDate(date, 'YYYY-MM-DD') + ' ' + clockTime(date);
        const existing = readSection(await this.app.vault.read(file), 'digest');
        const block = '*' + stamp + '*\n\n' + res.data.trim();
        const merged = existing ? existing + '\n\n---\n\n' + block : block;

        await this.app.vault.modify(
            file,
            writeSection(await this.app.vault.read(file), 'digest', merged)
        );

        // Stamp shares as done; they move to the archive on a later day.
        if (shares.length > 0) {
            await this.inbox.markDone(shares, formatDate(date, 'YYYY-MM-DD'));
        }
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
        const res = await this.providerCore.generate(
            this.buildSynthesisPrompt(collected, known, days, cfg.news.research)
        );

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? ': ' + res.error : ''));
            return;
        }

        // Cross-day guides belong to no single journal day, so they live under
        // the news summary folder, filed by year and month.
        const stamp = formatDate(date, 'YYYY-MM-DD');
        const folder = normalizePath(
            cfg.news.summaryFolder + '/' + formatDate(date, 'YYYY') + '/' + formatDate(date, 'MM')
        );
        const out = await ensureNote(this.app, normalizePath(folder + '/' + stamp + ' 主題彙整.md'), '');
        await this.app.vault.modify(out, res.data.trim() + '\n');

        new Notice(t('NOTICE_SYNTHESIS_DONE'));
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(out);
    }

    private buildDigestPrompt(
        items: { title: string; url: string }[],
        known: string,
        shares: Share[],
        research: boolean
    ): string {
        const captured = shares
            .filter(s => s.body)
            .map(s => '--- shared note "' + s.title + '" ---\n' + s.body);

        const sourcing = research
            ? 'Fetch each link and base your summary on what the page ACTUALLY says. '
              + 'If a page cannot be fetched, say so in 核心結論 rather than guessing '
              + 'from the title.'
            : 'Work from the titles and any captured text below. Where you are '
              + 'inferring rather than certain, say so.';

        return [
            'You summarise links a founder shared into a daily knowledge digest.',
            '',
            sourcing,
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
            '',
            'If any single item is substantial enough to deserve a full write-up',
            '(a how-to, a comparison, a feasibility assessment) rather than three',
            'lines, add a fourth line to that block:',
            '- **值得展開**: <one-line reason a full report would help>',
            'Use this sparingly — most items do not warrant it.',
            known ? '\nAbout this reader:\n' + known : '',
            captured.length ? '\nText captured with the shares:\n' + captured.join('\n\n') : '',
            '',
            'Links:',
            ...items.map((l, i) => (i + 1) + '. ' + l.title + ' — ' + l.url)
        ].filter(Boolean).join('\n');
    }

    private buildSynthesisPrompt(
        links: { title: string; url: string }[],
        known: string,
        days: number,
        research: boolean
    ): string {
        return [
            'You are given every link a founder shared over the last ' + days + ' days.',
            research ? 'Fetch them so the guide reflects what the sources actually say.' : '',
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
            known ? '\nAbout this reader:\n' + known : '',
            '',
            'Shared links:',
            ...links.map((l, i) => (i + 1) + '. ' + l.title + ' — ' + l.url)
        ].filter(Boolean).join('\n');
    }
}
