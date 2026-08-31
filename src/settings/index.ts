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
    /** Cross-day theme guides and long-form reports. */
    summaryFolder: string;
    /** Let the AI actually fetch and research the shared links. */
    research: boolean;
    /** Delete archived shares older than this. 0 disables deletion. */
    archiveRetentionDays: number;
}

export interface DigestSettings {
    scheduleMode: 'manual' | 'on-open' | 'hourly';
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
        summaryFolder: 'ai-journey/news/summary',
        research: true,
        // Deletion of archived shares is opt-in: 0 means keep forever.
        archiveRetentionDays: 0
    },
    digest: {
        scheduleMode: 'manual'
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

        // Digest Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_DIGEST_HEADING'));

        new Setting(containerEl)
            .setName(t('SETTINGS_DIGEST_SCHEDULE_MODE_NAME'))
            .setDesc(t('SETTINGS_DIGEST_SCHEDULE_MODE_DESC'))
            .addDropdown(dropdown => dropdown
                .addOption('manual', t('SETTINGS_DIGEST_SCHEDULE_MANUAL'))
                .addOption('on-open', t('SETTINGS_DIGEST_SCHEDULE_ON_OPEN'))
                .addOption('hourly', t('SETTINGS_DIGEST_SCHEDULE_HOURLY'))
                .setValue(this.plugin.settings.digest.scheduleMode)
                .onChange(async (value) => {
                    this.plugin.settings.digest.scheduleMode = value as 'manual' | 'on-open' | 'hourly';
                    await this.plugin.saveSettings();
                }));

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
