import { Menu, Notice, Plugin, TFile, normalizePath } from 'obsidian';
import { AICompanionSettingsTab, DEFAULT_SETTINGS } from './settings';
import type { AICompanionSettings } from './settings';
import { JournalFeature } from './features/journal';
import { DigestFeature } from './features/digest';
import { FactsFeature } from './features/facts';
import { NewsInbox } from './features/news';
import { isJournalNote, parseNoteDate } from './core/notes';
import { defaultRoles, defaultRules } from './core/roles';
import { decorateSections } from './core/decorate';
import { themeById } from './core/themes';
import { ProviderCore } from './core';
import { CliProvider } from './providers/cli';
import { t } from './i18n';

const HOUR_MS = 60 * 60 * 1000;

/** The day a journal note is for, from its filename; today if unparseable. */
function dateOfNote(file: TFile, settings: AICompanionSettings): Date {
    return parseNoteDate(file.basename, settings.journal.dateFormat) ?? new Date();
}

export default class AICompanionPlugin extends Plugin {
    settings: AICompanionSettings = DEFAULT_SETTINGS;
    providerCore: ProviderCore | null = null;
    journalFeature: JournalFeature | null = null;
    digestFeature: DigestFeature | null = null;
    factsFeature: FactsFeature | null = null;
    newsInbox: NewsInbox | null = null;

    private hourlyTimer: number | null = null;

    async onload() {
        await this.loadSettings();

        const getSettings = () => this.settings;
        this.providerCore = new ProviderCore(new CliProvider(this.settings.ai, this.settings.news.research));

        this.newsInbox = new NewsInbox(this.app, () => this.settings.news);
        this.factsFeature = new FactsFeature(this, this.providerCore, getSettings);
        this.journalFeature = new JournalFeature(this, this.providerCore, getSettings, this.factsFeature);
        this.digestFeature = new DigestFeature(this, this.providerCore, getSettings, this.factsFeature, this.newsInbox);

        this.addSettingTab(new AICompanionSettingsTab(this.app, this));

        this.addCommand({
            id: 'generate-digest',
            name: t('COMMAND_GENERATE_DIGEST'),
            callback: () => { void this.digestFeature?.generate(); }
        });

        this.addCommand({
            id: 'generate-journal-feedback',
            name: t('COMMAND_GENERATE_JOURNAL_FEEDBACK'),
            callback: () => { void this.journalFeature?.generateFeedback(); }
        });

        this.addCommand({
            id: 'accumulate-facts',
            name: t('COMMAND_ACCUMULATE_FACTS'),
            callback: () => { void this.factsFeature?.accumulate(); }
        });

        this.addCommand({
            id: 'open-fact-table',
            name: t('COMMAND_OPEN_FACTS'),
            callback: () => { void this.factsFeature?.open(); }
        });

        this.addCommand({
            id: 'archive-processed-shares',
            name: t('COMMAND_ARCHIVE_SHARES'),
            callback: () => { void this.archiveShares(); }
        });

        this.addCommand({
            id: 'create-journal-note',
            name: t('COMMAND_CREATE_JOURNAL'),
            callback: () => { void this.journalFeature?.openToday(); }
        });

        // The note's own ⋮ menu, so a day can be re-run from the day itself
        // rather than by remembering which note the command would target.
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
            if (!(file instanceof TFile) || file.extension !== 'md') return;
            if (!isJournalNote(file.path, this.settings.journal.folder)) return;

            menu.addSeparator();
            menu.addItem(item => item
                .setTitle(t('COMMAND_GENERATE_JOURNAL_FEEDBACK'))
                .setIcon('message-circle')
                .onClick(() => { void this.journalFeature?.generateFeedback(dateOfNote(file, this.settings)); }));
            menu.addItem(item => item
                .setTitle(t('COMMAND_GENERATE_DIGEST'))
                .setIcon('newspaper')
                .onClick(() => { void this.digestFeature?.generate(dateOfNote(file, this.settings)); }));
            menu.addItem(item => item
                .setTitle(t('COMMAND_ACCUMULATE_FACTS'))
                .setIcon('brain')
                .onClick(() => { void this.factsFeature?.accumulate(dateOfNote(file, this.settings)); }));
        }));

        this.registerMarkdownPostProcessor((el, ctx) => {
            if (this.settings.appearance.theme === 'none') return;
            if (this.settings.appearance.journalOnly
                && !isJournalNote(ctx.sourcePath, this.settings.journal.folder)) return;
            decorateSections(el, ctx);
        });

        this.addRibbonIcon('bot-message-square', t('RIBBON_TOOLTIP'), evt => {
            this.showActionMenu(evt);
        });

        this.app.workspace.onLayoutReady(() => {
            this.applyTheme();
            void this.migrateFromOldName()
                .then(() => this.ensureFolders())
                .then(() => this.applySchedule());
        });
    }

    /**
     * The ribbon menu — the same actions as the command palette, reachable
     * without knowing their names. Actions that would act on a journal note
     * are disabled while a non-journal note is open, rather than silently
     * retargeting today's journal.
     */
    private showActionMenu(evt: MouseEvent): void {
        const active = this.app.workspace.getActiveFile();
        const onJournal = !active || isJournalNote(active.path, this.settings.journal.folder);
        const menu = new Menu();

        const item = (label: string, icon: string, run: () => void, needsJournal = true) => {
            menu.addItem(mi => {
                mi.setTitle(label).setIcon(icon).onClick(run);
                if (needsJournal && !onJournal) mi.setDisabled(true);
            });
        };

        item(t('COMMAND_CREATE_JOURNAL'), 'file-plus', () => void this.journalFeature?.openToday(), false);
        menu.addSeparator();
        item(t('COMMAND_GENERATE_JOURNAL_FEEDBACK'), 'message-circle',
            () => void this.journalFeature?.generateFeedback());
        item(t('COMMAND_GENERATE_DIGEST'), 'newspaper',
            () => void this.digestFeature?.generate());
        item(t('COMMAND_ACCUMULATE_FACTS'), 'brain',
            () => void this.factsFeature?.accumulate());
        item(t('COMMAND_OPEN_FACTS'), 'book-open',
            () => void this.factsFeature?.open(), false);
        menu.addSeparator();
        item(t('COMMAND_ARCHIVE_SHARES'), 'archive', () => void this.archiveShares(), false);

        if (!onJournal) {
            menu.addSeparator();
            menu.addItem(mi => mi.setTitle(t('MENU_NOT_JOURNAL')).setDisabled(true));
        }
        menu.showAtMouseEvent(evt);
    }

    /** Moves digested shares out of the landing folder and prunes old ones. */
    async archiveShares(): Promise<void> {
        if (!this.newsInbox) return;
        const today = new Date().toISOString().slice(0, 10);
        const moved = await this.newsInbox.archiveProcessed(today);
        const pruned = await this.newsInbox.pruneArchive();
        new Notice(t('NOTICE_ARCHIVED') + ': ' + moved + ' / ' + pruned);
    }

    /**
     * Scheduling. Defaults to manual: unattended AI runs that write straight
     * into the vault are opt-in, not something a fresh install starts doing
     * on its own.
     *
     * The timer only runs while Obsidian is open — a CLI-backed plugin has no
     * background process, so a missed window is simply picked up at the next
     * tick rather than being caught up retroactively.
     */
    applySchedule() {
        if (this.hourlyTimer !== null) {
            window.clearInterval(this.hourlyTimer);
            this.hourlyTimer = null;
        }

        const cfg = this.settings.digest;
        if (cfg.scheduleMode === 'manual') return;

        if (cfg.scheduleMode === 'on-open') {
            void this.runScheduled();
            return;
        }

        // 'interval'
        const hours = Math.max(1, cfg.intervalHours);
        this.hourlyTimer = window.setInterval(() => {
            void this.runScheduled();
        }, hours * HOUR_MS);
        this.registerInterval(this.hourlyTimer);

        if (cfg.runOnStart) void this.runScheduled();
    }

    /** One scheduled pass: whichever of the two the reader enabled. */
    private async runScheduled(): Promise<void> {
        const cfg = this.settings.digest;
        if (cfg.scheduleDigest) await this.digestFeature?.generate();
        if (cfg.scheduleFeedback) await this.journalFeature?.generateFeedback();
    }

    onunload() {
        document.getElementById('ai-companion-theme')?.remove();
        if (this.hourlyTimer !== null) {
            window.clearInterval(this.hourlyTimer);
            this.hourlyTimer = null;
        }
    }

    async loadSettings() {
        const saved = (await this.loadData()) as Partial<AICompanionSettings> | null;
        // Merge per-section: a shallow assign would drop nested defaults when an
        // older config predates a newly added field.
        this.settings = {
            ai: { ...DEFAULT_SETTINGS.ai, ...saved?.ai },
            journal: { ...DEFAULT_SETTINGS.journal, ...saved?.journal },
            news: { ...DEFAULT_SETTINGS.news, ...saved?.news },
            digest: { ...DEFAULT_SETTINGS.digest, ...saved?.digest },
            facts: { ...DEFAULT_SETTINGS.facts, ...saved?.facts },
            roles: {
                // Seed from the reader's language when nothing was saved; an
                // existing set is their own wording and is left untouched.
                rules: saved?.roles?.rules?.length ? saved.roles.rules : defaultRules(),
                roles: saved?.roles?.roles?.length ? saved.roles.roles : defaultRoles()
            },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...saved?.appearance }
        };

        // A folder saved as "" predates the default layout — it is what an
        // unset field looked like in an earlier version, not a deliberate
        // choice of the vault root. Without this, anyone who opened settings
        // before the layout existed would keep writing to the vault root and
        // never receive the defaults.
        const j = this.settings.journal;
        if (!j.folder.trim()) j.folder = DEFAULT_SETTINGS.journal.folder;
        // A dot-folder is invisible to Obsidian's whole API surface, not just
        // the file explorer: it is never indexed, so the fact table could be
        // neither read back nor opened by hand. Move anyone off it.
        // Roles saved before emoji existed would otherwise stay blank forever,
        // because the saved array replaces the defaults wholesale.
        for (const role of this.settings.roles.roles) {
            if (!role.emoji) {
                role.emoji = defaultRoles().find(d => d.id === role.id)?.emoji ?? '💬';
            }
        }

        const f = this.settings.facts;
        if (!f.folder.trim() || f.folder === 'facts' || f.folder.includes('/.')) {
            f.folder = DEFAULT_SETTINGS.facts.folder;
        }
    }

    /**
     * Moves a vault created under the old name across, once.
     *
     * The plugin was called ai-journey before, and its folders were named for
     * it. Renaming the plugin must not strand someone's journal: any folder
     * still on the old path is moved, and any setting still pointing at one is
     * repointed. Folders the reader renamed themselves are left alone, since
     * they no longer match the old default either.
     */
    private async migrateFromOldName(): Promise<void> {
        const OLD = 'ai-journey';
        const NEW = 'ai-companion';
        const s = this.settings;

        const repoint = (value: string) =>
            value === OLD || value.startsWith(OLD + '/')
                ? NEW + value.slice(OLD.length)
                : value;

        // Move the top-level folder first; the per-setting paths then follow.
        const old = this.app.vault.getFolderByPath(OLD);
        if (old && !this.app.vault.getFolderByPath(NEW)) {
            try {
                await this.app.fileManager.renameFile(old, NEW);
                new Notice(t('NOTICE_MIGRATED'));
            } catch {
                return; // Leave settings pointing at the folder that still exists.
            }
        }

        s.journal.folder = repoint(s.journal.folder);
        s.news.landingFolder = repoint(s.news.landingFolder);
        s.news.archiveFolder = repoint(s.news.archiveFolder);
        s.facts.folder = repoint(s.facts.folder);
        await this.saveData(s);
    }

    /**
     * Creates the folders the plugin writes into.
     *
     * Done at startup rather than on first write so the news landing folder
     * exists before the reader goes looking for it in a mobile share sheet —
     * a folder that only appears after the first digest run is a folder they
     * cannot share into yet.
     */
    private async ensureFolders(): Promise<void> {
        const s = this.settings;
        for (const path of [
            s.journal.folder,
            s.news.landingFolder,
            s.news.archiveFolder,
            s.facts.folder
        ]) {
            const clean = normalizePath(path.trim());
            if (!clean || clean === '/' || this.app.vault.getFolderByPath(clean)) continue;
            await this.app.vault.createFolder(clean).catch(() => { /* raced or exists */ });
        }
    }

    /**
     * Injects the chosen style's CSS. Replacing one style element keeps the
     * page from accumulating stale rules as the reader tries styles out.
     */
    applyTheme(): void {
        const id = 'ai-companion-theme';
        document.getElementById(id)?.remove();
        const css = themeById(this.settings.appearance.theme).css;
        if (!css) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = css;
        document.head.appendChild(el);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.applyTheme();
        // Swap in place: the features hold this same ProviderCore instance.
        this.providerCore?.setProvider(new CliProvider(this.settings.ai, this.settings.news.research));
        this.applySchedule();
    }
}
