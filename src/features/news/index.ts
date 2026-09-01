import { normalizePath, type App, type TFile } from 'obsidian';
import { extractLinks } from '../../core/notes';
import type { NewsSettings } from '../../settings';

/** One share that landed in the inbox from a mobile share sheet. */
export interface Share {
    file: TFile;
    title: string;
    url: string;
    /** Whatever else the share sheet captured — often the post's text. */
    body: string;
}

/** Frontmatter key marking a share as already digested, holding the date. */
const PROCESSED_KEY = 'ai-journey-processed';

function frontmatter(content: string): { fm: string; body: string } {
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(content);
    return m ? { fm: m[1], body: content.slice(m[0].length) } : { fm: '', body: content };
}

export function isProcessed(content: string): boolean {
    return new RegExp('^' + PROCESSED_KEY + ':', 'm').test(frontmatter(content).fm);
}

/** Reads the processed stamp, or null if the share has not been digested. */
export function processedOn(content: string): string | null {
    const m = new RegExp('^' + PROCESSED_KEY + ': *(.+)$', 'm').exec(frontmatter(content).fm);
    return m ? m[1].trim() : null;
}

/** Stamps a share as digested without disturbing existing frontmatter. */
export function markProcessed(content: string, date: string): string {
    const { fm, body } = frontmatter(content);
    if (isProcessed(content)) {
        return content.replace(
            new RegExp('^' + PROCESSED_KEY + ': *.+$', 'm'),
            PROCESSED_KEY + ': ' + date
        );
    }
    const next = fm ? `${fm}\n${PROCESSED_KEY}: ${date}` : `${PROCESSED_KEY}: ${date}`;
    return `---\n${next}\n---\n${body}`;
}

export class NewsInbox {
    constructor(private app: App, private settings: () => NewsSettings) {}

    /**
     * Unprocessed shares sitting in the landing folder.
     *
     * The share sheet writes one note per share, but its shape varies by
     * source app, so the URL is recovered from the body rather than assumed
     * to be in any particular field.
     */
    async pending(): Promise<Share[]> {
        const folder = normalizePath(this.settings().landingFolder);
        const out: Share[] = [];

        for (const file of this.app.vault.getMarkdownFiles()) {
            if (!file.path.startsWith(folder + '/')) continue;
            const content = await this.app.vault.read(file);
            if (isProcessed(content)) continue;

            const { body } = frontmatter(content);
            const links = extractLinks(body);
            out.push({
                file,
                title: file.basename,
                url: links[0]?.url ?? '',
                body: body.trim()
            });
        }
        return out;
    }

    /** Stamps each share as digested today. Moving happens a day later. */
    async markDone(shares: Share[], date: string): Promise<void> {
        for (const s of shares) {
            const content = await this.app.vault.read(s.file);
            await this.app.vault.modify(s.file, markProcessed(content, date));
        }
    }

    /**
     * Moves specific shares to the archive right away.
     *
     * Called once a digest run has written both 今日社群轉貼 and
     * AI整理社群新知 — at that point the share note has done its job, and
     * leaving it in the landing folder would only make it look unprocessed.
     * Shares from a run that failed are never passed here, so they stay put.
     */
    async archiveNow(shares: Share[], date: string): Promise<number> {
        const archive = normalizePath(this.settings().archiveFolder);
        let moved = 0;

        if (!this.app.vault.getFolderByPath(archive)) {
            await this.app.vault.createFolder(archive).catch(() => { /* exists */ });
        }

        for (const share of shares) {
            // Stamp and move in one pass. Doing them separately left the note
            // marked processed but still sitting in the landing folder when
            // the move failed, which reads as "nothing happened" and then as
            // "no shares found" on the next run.
            const file = this.app.vault.getFileByPath(share.file.path) ?? share.file;
            try {
                await this.app.vault.modify(file, markProcessed(await this.app.vault.read(file), date));

                let target = normalizePath(archive + '/' + file.name);
                if (this.app.vault.getFileByPath(target)) {
                    target = normalizePath(archive + '/' + file.basename + ' ' + Date.now() + '.md');
                }
                await this.app.fileManager.renameFile(file, target);
                moved++;
            } catch {
                // Leave it in place; the next run will pick it up again.
            }
        }
        return moved;
    }

    /**
     * Sweeps up any processed share still sitting in the landing folder.
     *
     * Digest runs archive their own shares, so this only catches leftovers
     * from an interrupted run or an older version of the plugin.
     */
    async archiveProcessed(today: string): Promise<number> {
        const cfg = this.settings();
        const landing = normalizePath(cfg.landingFolder);
        const archive = normalizePath(cfg.archiveFolder);
        let moved = 0;

        for (const file of this.app.vault.getMarkdownFiles()) {
            if (!file.path.startsWith(landing + '/')) continue;
            const stamp = processedOn(await this.app.vault.read(file));
            if (!stamp) continue;

            if (!this.app.vault.getFolderByPath(archive)) {
                await this.app.vault.createFolder(archive).catch(() => { /* exists */ });
            }
            let target = normalizePath(`${archive}/${file.name}`);
            if (this.app.vault.getFileByPath(target)) {
                target = normalizePath(`${archive}/${file.basename} ${stamp}.md`);
            }
            await this.app.fileManager.renameFile(file, target);
            moved++;
        }
        return moved;
    }

    /** Deletes archived shares past the retention window. Off when 0. */
    async pruneArchive(now = new Date()): Promise<number> {
        const cfg = this.settings();
        if (cfg.archiveRetentionDays <= 0) return 0;

        const archive = normalizePath(cfg.archiveFolder);
        const cutoff = now.getTime() - cfg.archiveRetentionDays * 24 * 60 * 60 * 1000;
        let removed = 0;

        for (const file of this.app.vault.getMarkdownFiles()) {
            if (!file.path.startsWith(archive + '/')) continue;
            if (file.stat.mtime >= cutoff) continue;
            // trash(true) uses the system trash, so a bad retention setting is
            // recoverable rather than destroying the archive outright.
            await this.app.vault.trash(file, true);
            removed++;
        }
        return removed;
    }
}
