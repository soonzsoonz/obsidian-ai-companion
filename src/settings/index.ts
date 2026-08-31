import { App, PluginSettingTab, Setting } from 'obsidian';
import type AIJourneyPlugin from '../main';
import { t } from '../i18n';

export interface AISettings {
    provider: string;
    cliPath: string;
    extraArgs: string;
    model: string;
    timeout: number;
}

export interface JournalSettings {
    folder: string;
    dateFormat: string;
    templatePath: string;
}

export interface NewsSettings {
    /** Where mobile shares land. Read, then moved to archiveFolder. */
    landingFolder: string;
    /** Processed shares are moved here, one day after being digested. */
    archiveFolder: string;
    /** Let the AI actually fetch and research the shared links. */
    research: boolean;
    /** Delete archived shares older than this. 0 disables deletion. */
    archiveRetentionDays: number;
}

export interface DigestSettings {
    scheduleMode: 'manual' | 'on-open' | 'interval';
    /** Hours between scheduled runs when scheduleMode is 'interval'. */
    intervalHours: number;
    /** Whether a scheduled pass generates the news digest. */
    scheduleDigest: boolean;
    /** Whether a scheduled pass generates journal feedback. */
    scheduleFeedback: boolean;
    /** Run once when Obsidian starts, as well as on the interval. */
    runOnStart: boolean;
}

export interface FactsSettings {
    folder: string;
    enable: boolean;
}

export interface AIJourneySettings {
    ai: AISettings;
    journal: JournalSettings;
    news: NewsSettings;
    digest: DigestSettings;
    facts: FactsSettings;
}

export const DEFAULT_SETTINGS: AIJourneySettings = {
    ai: {
        provider: 'cli',
        cliPath: '',
        extraArgs: '',
        model: '',
        timeout: 30000
    },
    journal: {
        folder: 'ai-journey/journal',
        dateFormat: 'YYYY-MM-DD',
        templatePath: ''
    },
    news: {
        landingFolder: 'ai-journey/news/landing',
        archiveFolder: 'ai-journey/news/archived',
        research: true,
        // Deletion of archived shares is opt-in: 0 means keep forever.
        archiveRetentionDays: 0
    },
    digest: {
        scheduleMode: 'manual',
        intervalHours: 4,
        scheduleDigest: true,
        scheduleFeedback: false,
        runOnStart: false
    },
    facts: {
        folder: 'ai-journey/.ai-journey',
        enable: false
    }
};

export class AIJourneySettingsTab extends PluginSettingTab {
    plugin: AIJourneyPlugin;

    constructor(app: App, plugin: AIJourneyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // AI Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_AI_HEADING'));
        
        new Setting(containerEl)
            .setName(t('SETTINGS_AI_PROVIDER_NAME'))
            .setDesc(t('SETTINGS_AI_PROVIDER_DESC'))
            .addDropdown(dropdown => dropdown
                .addOption('cli', 'CLI')
                .setValue(this.plugin.settings.ai.provider)
                .onChange(async (value) => {
                    this.plugin.settings.ai.provider = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_AI_CLI_PATH_NAME'))
            .setDesc(t('SETTINGS_AI_CLI_PATH_DESC'))
            .addText(text => text
                .setPlaceholder('claude / gemini')
                .setValue(this.plugin.settings.ai.cliPath)
                .onChange(async (value) => {
                    this.plugin.settings.ai.cliPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_AI_EXTRA_ARGS_NAME'))
            .setDesc(t('SETTINGS_AI_EXTRA_ARGS_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.ai.extraArgs)
                .onChange(async (value) => {
                    this.plugin.settings.ai.extraArgs = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_AI_MODEL_NAME'))
            .setDesc(t('SETTINGS_AI_MODEL_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.ai.model)
                .onChange(async (value) => {
                    this.plugin.settings.ai.model = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_AI_TIMEOUT_NAME'))
            .setDesc(t('SETTINGS_AI_TIMEOUT_DESC'))
            .addText(text => text
                .setValue(String(this.plugin.settings.ai.timeout))
                .onChange(async (value) => {
                    this.plugin.settings.ai.timeout = parseInt(value, 10) || 30000;
                    await this.plugin.saveSettings();
                }));

        // Journal Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_JOURNAL_HEADING'));

        new Setting(containerEl)
            .setName(t('SETTINGS_JOURNAL_FOLDER_NAME'))
            .setDesc(t('SETTINGS_JOURNAL_FOLDER_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.journal.folder)
                .onChange(async (value) => {
                    this.plugin.settings.journal.folder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_JOURNAL_DATE_FORMAT_NAME'))
            .setDesc(t('SETTINGS_JOURNAL_DATE_FORMAT_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.journal.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.journal.dateFormat = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_JOURNAL_TEMPLATE_PATH_NAME'))
            .setDesc(t('SETTINGS_JOURNAL_TEMPLATE_PATH_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.journal.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.journal.templatePath = value;
                    await this.plugin.saveSettings();
                }));

        // News Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_NEWS_HEADING'));

        new Setting(containerEl)
            .setName(t('SETTINGS_NEWS_LANDING_NAME'))
            .setDesc(t('SETTINGS_NEWS_LANDING_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.news.landingFolder)
                .onChange(async (value) => {
                    this.plugin.settings.news.landingFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_NEWS_ARCHIVE_NAME'))
            .setDesc(t('SETTINGS_NEWS_ARCHIVE_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.news.archiveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.news.archiveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_NEWS_RESEARCH_NAME'))
            .setDesc(t('SETTINGS_NEWS_RESEARCH_DESC'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.news.research)
                .onChange(async (value) => {
                    this.plugin.settings.news.research = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_NEWS_RETENTION_NAME'))
            .setDesc(t('SETTINGS_NEWS_RETENTION_DESC'))
            .addText(text => text
                .setValue(String(this.plugin.settings.news.archiveRetentionDays))
                .onChange(async (value) => {
                    const days = Number(value);
                    this.plugin.settings.news.archiveRetentionDays =
                        Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
                    await this.plugin.saveSettings();
                }));

        // Digest Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_DIGEST_HEADING'));

        new Setting(containerEl)
            .setName(t('SETTINGS_DIGEST_SCHEDULE_MODE_NAME'))
            .setDesc(t('SETTINGS_DIGEST_SCHEDULE_MODE_DESC'))
            .addDropdown(dropdown => dropdown
                .addOption('manual', t('SETTINGS_DIGEST_SCHEDULE_MANUAL'))
                .addOption('on-open', t('SETTINGS_DIGEST_SCHEDULE_ON_OPEN'))
                .addOption('interval', t('SETTINGS_DIGEST_SCHEDULE_INTERVAL'))
                .setValue(this.plugin.settings.digest.scheduleMode)
                .onChange(async (value) => {
                    this.plugin.settings.digest.scheduleMode =
                        value as 'manual' | 'on-open' | 'interval';
                    await this.plugin.saveSettings();
                    // Redraw so the interval-only options appear or vanish.
                    this.display();
                }));

        if (this.plugin.settings.digest.scheduleMode !== 'manual') {
            if (this.plugin.settings.digest.scheduleMode === 'interval') {
                new Setting(containerEl)
                    .setName(t('SETTINGS_DIGEST_INTERVAL_NAME'))
                    .setDesc(t('SETTINGS_DIGEST_INTERVAL_DESC'))
                    .addSlider(slider => slider
                        .setLimits(1, 12, 1)
                        .setDynamicTooltip()
                        .setValue(this.plugin.settings.digest.intervalHours)
                        .onChange(async (value) => {
                            this.plugin.settings.digest.intervalHours = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName(t('SETTINGS_DIGEST_RUN_ON_START_NAME'))
                    .setDesc(t('SETTINGS_DIGEST_RUN_ON_START_DESC'))
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.digest.runOnStart)
                        .onChange(async (value) => {
                            this.plugin.settings.digest.runOnStart = value;
                            await this.plugin.saveSettings();
                        }));
            }

            new Setting(containerEl)
                .setName(t('SETTINGS_DIGEST_RUN_DIGEST_NAME'))
                .setDesc(t('SETTINGS_DIGEST_RUN_DIGEST_DESC'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.digest.scheduleDigest)
                    .onChange(async (value) => {
                        this.plugin.settings.digest.scheduleDigest = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName(t('SETTINGS_DIGEST_RUN_FEEDBACK_NAME'))
                .setDesc(t('SETTINGS_DIGEST_RUN_FEEDBACK_DESC'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.digest.scheduleFeedback)
                    .onChange(async (value) => {
                        this.plugin.settings.digest.scheduleFeedback = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Facts Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_FACTS_HEADING'));

        new Setting(containerEl)
            .setName(t('SETTINGS_FACTS_ENABLE_NAME'))
            .setDesc(t('SETTINGS_FACTS_ENABLE_DESC'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.facts.enable)
                .onChange(async (value) => {
                    this.plugin.settings.facts.enable = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t('SETTINGS_FACTS_FOLDER_NAME'))
            .setDesc(t('SETTINGS_FACTS_FOLDER_DESC'))
            .addText(text => text
                .setValue(this.plugin.settings.facts.folder)
                .onChange(async (value) => {
                    this.plugin.settings.facts.folder = value;
                    await this.plugin.saveSettings();
                }));
    }
}
