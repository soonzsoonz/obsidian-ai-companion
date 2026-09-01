import { Notice, normalizePath, type App, type Plugin, type TFile } from 'obsidian';
import type { ProviderCore } from '../../core';
import {
    clockTime, ensureNote, extractLinks, formatDate, journalChildFolder, journalPath,
    readSection, writeSection
} from '../../core/notes';
import type { AIJourneySettings } from '../../settings';
import { NewsInbox, type Share } from '../news';
import { renderRoleGuidance } from '../../core/roles';
import { buildReportPrompt, findExpandable, linkReport, safeFileName } from './reports';
import { t } from '../../i18n';

/**
 * The per-item shape, in the reader's language.
 *
 * The three fields keep the structure of the author's existing Notion digests
 * (source / takeaway / why it matters) so old and new archives stay
 * comparable, but the labels themselves follow the interface language.
 */
function itemFormat(): string {
    return [
        '- **' + t('DIGEST_SOURCE') + '**: <title> ([link](<url>))',
        '- **' + t('DIGEST_TAKEAWAY') + '**: <the concrete takeaway>',
        '- **' + t('DIGEST_WHY') + '**: <what they can do with it>'
    ].join('\n');
}

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
            this.buildDigestPrompt(
                items, known, shares, cfg.news.research,
                renderRoleGuidance(cfg.roles.rules, cfg.roles.roles)
            )
        );

        if (!res.success || !res.data) {
            new Notice(t('NOTICE_AI_FAILED') + (res.error ? ': ' + res.error : ''));
            return;
        }

        const stamp = formatDate(date, 'YYYY-MM-DD') + ' ' + clockTime(date);

        // 今日社群轉貼 is filled in by the plugin, not by hand: copying links
        // out of a phone into a note is exactly the chore this is meant to
        // remove. Only shares that arrived via the landing folder are added —
        // links the writer typed inline are already there.
        if (shares.length > 0) {
            const listed = extractLinks(readSection(await this.app.vault.read(file), 'shares'))
                .map(l => l.url);
            const fresh = shares
                .filter(s => s.url && !listed.includes(s.url))
                .map(s => '- [' + s.title + '](' + s.url + ')');

            if (fresh.length > 0) {
                const priorShares = readSection(await this.app.vault.read(file), 'shares')
                    .replace(/^-\s*$/gm, '')   // drop the empty bullet the template leaves
                    .trim();
                await this.app.vault.modify(file, writeSection(
                    await this.app.vault.read(file),
                    'shares',
                    priorShares ? priorShares + '\n' + fresh.join('\n') : fresh.join('\n')
                ));
            }
        }

        const existing = readSection(await this.app.vault.read(file), 'digest');
        const block = '*' + stamp + '*\n\n' + res.data.trim();
        const merged = existing ? existing + '\n\n---\n\n' + block : block;

        await this.app.vault.modify(
            file,
            writeSection(await this.app.vault.read(file), 'digest', merged)
        );

        // Both sections are written, so these shares have served their purpose
        // and can be archived immediately.
        if (shares.length > 0) {
            await this.inbox.markDone(shares, formatDate(date, 'YYYY-MM-DD'));
            await this.inbox.archiveNow(shares);
        }
        new Notice(t('NOTICE_DIGEST_GENERATED'));

        if (cfg.news.expandReports) {
            await this.writeReports(file, res.data.trim(), date, known);
        }
    }

    /**
     * Writes a full note for each item the AI flagged as worth expanding, and
     * links it from the digest entry.
     *
     * Runs after the digest is already saved, so a failure here costs the
     * reader a report but never the briefing they were waiting for.
     */
    private async writeReports(
        journal: TFile, digestBlock: string, date: Date, known: string
    ): Promise<void> {
        const cfg = this.settings();
        const items = findExpandable(digestBlock);
        if (items.length === 0) return;

        const folder = journalChildFolder(cfg.journal.folder, date, cfg.journal.dateFormat);
        const guidance = renderRoleGuidance(cfg.roles.rules, cfg.roles.roles);
        let written = 0;

        for (const item of items.slice(0, cfg.news.maxReportsPerRun)) {
            const res = await this.providerCore.generate(
                buildReportPrompt(item, known, cfg.news.research, guidance)
            );
            if (!res.success || !res.data) continue;

            const name = safeFileName(item.title);
            const note = await ensureNote(
                this.app, normalizePath(folder + '/' + name + '.md'), ''
            );
            const heading = '# ' + item.title + '\n\n'
                + (item.url ? '[' + t('DIGEST_SOURCE') + '](' + item.url + ')\n\n' : '');
            await this.app.vault.modify(note, heading + res.data.trim() + '\n');

            // Link it from the digest line that asked for it.
            const current = readSection(await this.app.vault.read(journal), 'digest');
            const linked = linkReport(current, item, note.basename);
            if (linked !== current) {
                await this.app.vault.modify(
                    journal,
                    writeSection(await this.app.vault.read(journal), 'digest', linked)
                );
            }
            written++;
        }

        if (written > 0) new Notice(t('NOTICE_REPORTS_WRITTEN') + ': ' + written);
    }

    private buildDigestPrompt(
        items: { title: string; url: string }[],
        known: string,
        shares: Share[],
        research: boolean,
        roleGuidance: string
    ): string {
        const captured = shares
            .filter(s => s.body)
            .map(s => '--- shared note "' + s.title + '" ---\n' + s.body);

        const sourcing = research
            ? 'Fetch each link and base your summary on what the page ACTUALLY says. '
              + 'If a page cannot be fetched, say so rather than guessing from the title.'
            : 'Work from the titles and any captured text below. Where you are '
              + 'inferring rather than certain, say so.';

        return [
            'You write the daily briefing for someone who saves links they find',
            'worth keeping.',
            '',
            sourcing,
            '',
            'Start by asking why THIS person kept THIS link. People save things to',
            'use at work, to try in their own making, for someone in the family, or',
            'simply because it was good. Answer in the voice that reason calls for.',
            '',
            roleGuidance,
            '',
            'For EACH link, output exactly this three-line block:',
            itemFormat(),
            '',
            'Separate blocks with a line containing only: ---',
            '',
            'Rules:',
            '- The second line is the concrete takeaway — the actual technique,',
            '  number, or finding. If it is a prompt or a recipe, quote the usable part.',
            '- The third line says what they can DO with it, or what makes it good.',
            '  It is NOT a rating. Never call something unimportant, of little help,',
            '  or merely for leisure — they already decided it was worth keeping, and',
            '  saying otherwise tells them nothing they can use. A book someone loved,',
            '  a drawing style, a thing their kid might like: these are worth keeping',
            '  for their own sake, so write about them on their own terms.',
            '- Reply in ' + t('LANGUAGE_NAME') + ' unless the shared items are clearly another language.',
            '- Output only the blocks. No preamble, no heading.',
            '',
            'When a page cannot be fetched, work from the text captured with the',
            'share and write the summary anyway, ending the takeaway line with',
            '"' + t('DIGEST_UNFETCHED') + '". Do not suggest they check the link',
            'or ask the sharer — they are the sharer.',
            '',
            'If any single item is substantial enough to deserve a full write-up',
            '(a how-to, a comparison, a feasibility assessment) rather than three',
            'lines, add a fourth line to that block:',
            '- **' + t('DIGEST_EXPAND') + '**: <one-line reason a full report would help>',
            'Use this sparingly — most items do not warrant it.',
            known ? '\nAbout this reader (context, not a filter — most of what they\n'
                + 'save has nothing to do with these):\n' + known : '',
            captured.length ? '\nText captured with the shares:\n' + captured.join('\n\n') : '',
            '',
            'Links:',
            ...items.map((l, i) => (i + 1) + '. ' + l.title + ' — ' + l.url)
        ].filter(Boolean).join('\n');
    }
}
