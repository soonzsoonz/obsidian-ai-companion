import { t } from '../../i18n';

/** One digest item the AI flagged as deserving a full write-up. */
export interface ExpandableItem {
    title: string;
    url: string;
    /** The AI's one-line reason a report would help. */
    reason: string;
    /** The item's own digest block, for context when writing the report. */
    block: string;
}

/** Strips characters Obsidian will not accept in a file name. */
export function safeFileName(title: string): string {
    const cleaned = title
        .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
    return cleaned || 'report';
}

/**
 * Finds the items the AI marked with the "worth expanding" line.
 *
 * The digest is markdown the AI wrote to a described shape rather than a
 * guaranteed one, so this reads tolerantly: blocks are split on `---`, and an
 * item counts as flagged only when the marker line is present and carries a
 * reason.
 */
export function findExpandable(digest: string): ExpandableItem[] {
    const marker = t('DIGEST_EXPAND');
    const sourceLabel = t('DIGEST_SOURCE');
    const out: ExpandableItem[] = [];

    for (const block of digest.split(/^---$/m)) {
        const reasonMatch = new RegExp(
            '^\\s*-?\\s*\\*\\*' + escapeRegExp(marker) + '\\*\\*\\s*[:：]\\s*(.+)$',
            'm'
        ).exec(block);
        if (!reasonMatch) continue;

        const sourceMatch = new RegExp(
            '^\\s*-?\\s*\\*\\*' + escapeRegExp(sourceLabel) + '\\*\\*\\s*[:：]\\s*(.+)$',
            'm'
        ).exec(block);
        if (!sourceMatch) continue;

        const raw = sourceMatch[1].trim();
        // "Title ([label](url))" — take the title and the first url separately.
        const url = /\((https?:\/\/[^)\s]+)\)/.exec(raw)?.[1]
            ?? /(https?:\/\/\S+)/.exec(raw)?.[1]
            ?? '';
        const title = raw.replace(/\s*\(\[[^\]]*\]\([^)]*\)\)\s*$/, '').replace(/\s*\(https?:\/\/\S+\)\s*$/, '').trim();

        out.push({ title: title || raw, url, reason: reasonMatch[1].trim(), block: block.trim() });
    }
    return out;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Appends a link to the generated report onto that item's 值得展開 line, so
 * the digest entry and its report stay connected in the note the reader
 * actually opens.
 */
export function linkReport(digest: string, item: ExpandableItem, noteName: string): string {
    const marker = escapeRegExp(t('DIGEST_EXPAND'));
    const reason = escapeRegExp(item.reason);
    const line = new RegExp(
        '^(\\s*-?\\s*\\*\\*' + marker + '\\*\\*\\s*[:：]\\s*' + reason + ')\\s*$',
        'm'
    );
    if (!line.test(digest)) return digest;
    return digest.replace(line, '$1 → [[' + noteName + ']]');
}

export function buildReportPrompt(
    item: ExpandableItem,
    known: string,
    research: boolean,
    roleGuidance: string
): string {
    return [
        'Write a full note on one thing someone saved, because a three-line',
        'summary was not enough for it.',
        '',
        research
            ? 'Fetch the source and work from what it actually says. Where you rely'
              + ' on general knowledge instead, say so.'
            : 'Work from the digest entry below and your own knowledge. Mark clearly'
              + ' where you are inferring rather than reporting.',
        '',
        roleGuidance,
        '',
        'Why a full note was wanted: ' + item.reason,
        '',
        'Structure it as:',
        '',
        '## ' + t('REPORT_WHAT'),
        '<what this is, in a few sentences>',
        '',
        '## ' + t('REPORT_HOW'),
        '<the actual method, steps, or technique — quote prompts, settings,',
        'numbers and code verbatim where they exist, so it can be used from',
        'this note without reopening the source>',
        '',
        '## ' + t('REPORT_NOTES'),
        '<trade-offs, gotchas, what to watch for, what you would try first>',
        '',
        'Rules:',
        '- Reply in ' + t('LANGUAGE_NAME') + ' unless the source is clearly another language.',
        '- Concrete over general. If you cannot say anything specific under a',
        '  heading, leave that heading out rather than padding it.',
        '- Do not restate the digest entry; this note exists to go deeper.',
        '- No preamble and no title line — start at the first heading.',
        known ? '\nAbout this reader (context, not a filter):\n' + known : '',
        '',
        'The digest entry:',
        item.block,
        item.url ? '\nSource: ' + item.url : ''
    ].filter(Boolean).join('\n');
}
