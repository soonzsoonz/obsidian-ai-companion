import { Notice, Plugin } from 'obsidian';
import { AIJourneySettingsTab, DEFAULT_SETTINGS } from './settings';
import type { AIJourneySettings } from './settings';
import { JournalFeature } from './features/journal';
import { DigestFeature } from './features/digest';
import { FactsFeature } from './features/facts';
import { NewsInbox } from './features/news';
import { ProviderCore } from './core';
import { CliProvider } from './providers/cli';
import { t } from './i18n';

const HOUR_MS = 60 * 60 * 1000;

export default class AIJourneyPlugin extends Plugin {
    settings: AIJourneySettings = DEFAULT_SETTINGS;
    providerCore: ProviderCore | null = null;
    journalFeature: JournalFeature | null = null;
    digestFeature: DigestFeature | null = null;
    factsFeature: FactsFeature | null = null;
    newsInbox: NewsInbox | null = null;

    private hourlyTimer: number | null = null;

    async onload() {
        await this.loadSettings();

        const getSettings = () => this.settings;
        this.providerCore = new ProviderCore(new CliProvider(this.settings.ai));

        this.newsInbox = new NewsInbox(this.app, () => this.settings.news);
        this.factsFeature = new FactsFeature(this, this.providerCore, getSettings);
        this.journalFeature = new JournalFeature(this, this.providerCore, getSettings, this.factsFeature);
        this.digestFeature = new DigestFeature(this, this.providerCore, getSettings, this.factsFeature, this.newsInbox);

        this.addSettingTab(new AIJourneySettingsTab(this.app, this));

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
            id: 'synthesize-theme',
            name: t('COMMAND_SYNTHESIZE_THEME'),
            callback: () => { void this.digestFeature?.synthesizeTheme(); }
        });

        this.addCommand({
            id: 'archive-processed-shares',
            name: t('COMMAND_ARCHIVE_SHARES'),
            callback: () => { void this.archiveShares(); }
        });

        this.app.workspace.onLayoutReady(() => this.applySchedule());
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
     * Digest scheduling. Defaults to manual: unattended AI runs that write
     * straight into the vault are opt-in, not something a fresh install starts
     * doing on its own.
     */
    applySchedule() {
        if (this.hourlyTimer !== null) {
            window.clearInterval(this.hourlyTimer);
            this.hourlyTimer = null;
        }

        const mode = this.settings.digest.scheduleMode;
        if (mode === 'on-open') {
            void this.digestFeature?.generate();
        } else if (mode === 'hourly') {
            this.hourlyTimer = window.setInterval(() => {
                void this.digestFeature?.generate();
            }, HOUR_MS);
            this.registerInterval(this.hourlyTimer);
        }
    }

    onunload() {
        if (this.hourlyTimer !== null) {
            window.clearInterval(this.hourlyTimer);
            this.hourlyTimer = null;
        }
    }

    async loadSettings() {
        const saved = (await this.loadData()) as Partial<AIJourneySettings> | null;
        // Merge per-section: a shallow assign would drop nested defaults when an
        // older config predates a newly added field.
        this.settings = {
            ai: { ...DEFAULT_SETTINGS.ai, ...saved?.ai },
            journal: { ...DEFAULT_SETTINGS.journal, ...saved?.journal },
            news: { ...DEFAULT_SETTINGS.news, ...saved?.news },
            digest: { ...DEFAULT_SETTINGS.digest, ...saved?.digest },
            facts: { ...DEFAULT_SETTINGS.facts, ...saved?.facts }
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Swap in place: the features hold this same ProviderCore instance.
        this.providerCore?.setProvider(new CliProvider(this.settings.ai));
        this.applySchedule();
    }
}
