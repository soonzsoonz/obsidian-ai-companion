import { App, PluginSettingTab, Setting } from 'obsidian';
import type AICompanionPlugin from '../main';
import { CLI_PRESETS, detectCommand, presetById } from '../providers/presets';
import { STYLE_THEMES } from '../core/themes';
import { defaultRoles, defaultRules, type RoleDefinition, type RoleRule } from '../core/roles';
import { t } from '../i18n';

export interface AISettings {
    provider: string;
    cliPath: string;
    extraArgs: string;
    model: string;
    /** Reasoning effort, when the chosen CLI supports one. */
    effort: string;
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
    /** Write a full note for items the AI marks as worth expanding. */
    expandReports: boolean;
    /** Cap per run, so one busy day cannot spawn a dozen AI calls. */
    maxReportsPerRun: number;
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

export interface AppearanceSettings {
    /** Style theme id, or 'none' to leave notes entirely alone. */
    theme: string;
    /** Only style notes inside the journal folder. */
    journalOnly: boolean;
}

export interface RolesSettings {
    rules: RoleRule[];
    roles: RoleDefinition[];
}

export interface AICompanionSettings {
    ai: AISettings;
    journal: JournalSettings;
    news: NewsSettings;
    digest: DigestSettings;
    facts: FactsSettings;
    roles: RolesSettings;
    appearance: AppearanceSettings;
}

export const DEFAULT_SETTINGS: AICompanionSettings = {
    ai: {
        provider: 'claude',
        cliPath: '',
        extraArgs: '',
        model: '',
        effort: 'medium',
        timeout: 500000
    },
    journal: {
        folder: 'ai-companion/journal',
        dateFormat: 'YYYY-MM-DD',
        templatePath: ''
    },
    news: {
        landingFolder: 'ai-companion/news/landing',
        archiveFolder: 'ai-companion/news/archived',
        research: true,
        // Deletion of archived shares is opt-in: 0 means keep forever.
        archiveRetentionDays: 0,
        expandReports: true,
        maxReportsPerRun: 3
    },
    digest: {
        scheduleMode: 'manual',
        intervalHours: 4,
        scheduleDigest: true,
        scheduleFeedback: false,
        runOnStart: false
    },
    facts: {
        folder: 'ai-companion/memory',
        enable: false
    },
    roles: {
        // Filled in by loadSettings(): t() cannot run at module-evaluation
        // time, before Obsidian has reported its language.
        rules: [],
        roles: []
    },
    appearance: {
        // Off by default: many vaults are already styled by a theme or
        // snippet, and repainting someone's notes uninvited is a nuisance.
        theme: 'none',
        journalOnly: true
    }
};

function presetPlaceholder(id: string): string {
    const preset = presetById(id);
    // Show the detected path, so leaving the field empty is visibly safe.
    return detectCommand(preset) || preset.command || 'claude';
}

export class AICompanionSettingsTab extends PluginSettingTab {
    plugin: AICompanionPlugin;

    constructor(app: App, plugin: AICompanionPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /** Which tab is showing. Kept on the instance so a redraw stays put. */
    private tab = 'general';

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const tabs: { id: string; label: string }[] = [
            { id: 'general', label: t('TAB_GENERAL') },
            { id: 'ai', label: t('TAB_AI') },
            { id: 'roles', label: t('TAB_ROLES') },
            { id: 'appearance', label: t('TAB_APPEARANCE') }
        ];

        const bar = containerEl.createDiv({ cls: 'ai-companion-tabs' });
        for (const tab of tabs) {
            const btn = bar.createEl('button', { text: tab.label });
            btn.addClass('ai-companion-tab');
            if (this.tab === tab.id) btn.addClass('is-active');
            btn.onclick = () => { this.tab = tab.id; this.display(); };
        }

        const body = containerEl.createDiv();
        if (this.tab === 'general') this.renderGeneral(body);
        else if (this.tab === 'ai') this.renderAI(body);
        else if (this.tab === 'roles') this.renderRoles(body);
        else this.renderAppearance(body);
    }

    private renderGeneral(containerEl: HTMLElement): void {
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
            .setName(t('SETTINGS_NEWS_REPORTS_NAME'))
            .setDesc(t('SETTINGS_NEWS_REPORTS_DESC'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.news.expandReports)
                .onChange(async (value) => {
                    this.plugin.settings.news.expandReports = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.news.expandReports) {
            new Setting(containerEl)
                .setName(t('SETTINGS_NEWS_MAXREPORTS_NAME'))
                .setDesc(t('SETTINGS_NEWS_MAXREPORTS_DESC'))
                .addSlider(slider => slider
                    .setLimits(1, 10, 1)
                    .setDynamicTooltip()
                    .setValue(this.plugin.settings.news.maxReportsPerRun)
                    .onChange(async (value) => {
                        this.plugin.settings.news.maxReportsPerRun = value;
                        await this.plugin.saveSettings();
                    }));
        }

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

    private renderAI(containerEl: HTMLElement): void {
        // AI Settings
        new Setting(containerEl).setHeading().setName(t('SETTINGS_AI_HEADING'));
        
        new Setting(containerEl)
            .setName(t('SETTINGS_AI_PROVIDER_NAME'))
            .setDesc(t('SETTINGS_AI_PROVIDER_DESC'))
            .addDropdown(dropdown => {
                for (const preset of CLI_PRESETS) {
                    dropdown.addOption(preset.id, preset.label
                        + (preset.verified ? '' : ' — ' + t('SETTINGS_AI_UNVERIFIED')));
                }
                dropdown.setValue(this.plugin.settings.ai.provider)
                    .onChange(async (value) => {
                        this.plugin.settings.ai.provider = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        // Say plainly whether the CLI was found, so an empty field is visibly
        // the right answer when it was, and obviously not when it was not.
        const preset = presetById(this.plugin.settings.ai.provider);
        const found = detectCommand(preset);
        new Setting(containerEl)
            .setName(t('SETTINGS_AI_CLI_PATH_NAME'))
            .setDesc(found
                ? t('SETTINGS_AI_CLI_PATH_FOUND') + ' ' + found
                : t('SETTINGS_AI_CLI_PATH_MISSING').replace('{cmd}', preset.command || 'claude'))
            .addText(text => text
                .setPlaceholder(presetPlaceholder(this.plugin.settings.ai.provider))
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

        if (preset.effortLevels.length > 0) {
            new Setting(containerEl)
                .setName(t('SETTINGS_AI_EFFORT_NAME'))
                .setDesc(t('SETTINGS_AI_EFFORT_DESC')
                    .replace('{levels}', preset.effortLevels.join(' / ')))
                .addDropdown(dropdown => {
                    for (const level of preset.effortLevels) dropdown.addOption(level, level);
                    // A level the previous CLI accepted may not exist here.
                    const current = preset.effortLevels.includes(this.plugin.settings.ai.effort)
                        ? this.plugin.settings.ai.effort
                        : 'medium';
                    dropdown.setValue(current).onChange(async (value) => {
                        this.plugin.settings.ai.effort = value;
                        await this.plugin.saveSettings();
                    });
                });
        }

        new Setting(containerEl)
            .setName(t('SETTINGS_AI_TIMEOUT_NAME'))
            .setDesc(t('SETTINGS_AI_TIMEOUT_DESC'))
            .addText(text => text
                .setValue(String(this.plugin.settings.ai.timeout))
                .onChange(async (value) => {
                    this.plugin.settings.ai.timeout = parseInt(value, 10) || 500000;
                    await this.plugin.saveSettings();
                }));

    }

    /**
     * The roles tab: which voice the AI uses for what.
     *
     * Editable because the right voice is a personal call — the built-in rules
     * are a starting point, not an opinion about how anyone should be spoken to.
     */
    private renderRoles(containerEl: HTMLElement): void {
        const cfg = this.plugin.settings.roles;

        containerEl.createEl('p', {
            text: t('SETTINGS_ROLES_INTRO'),
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName(t('SETTINGS_ROLES_RULES_HEADING'))
            .setDesc(t('SETTINGS_ROLES_RESET_ALL'))
            .setHeading()
            .addExtraButton(b => b
                .setIcon('rotate-ccw')
                .setTooltip(t('SETTINGS_RESET'))
                .onClick(async () => {
                    cfg.rules = defaultRules();
                    await this.plugin.saveSettings();
                    this.display();
                }));

        for (const rule of cfg.rules) {
            const setting = new Setting(containerEl)
                .addText(text => text
                    .setPlaceholder(t('SETTINGS_ROLES_SITUATION'))
                    .setValue(rule.situation)
                    .onChange(async (value) => {
                        rule.situation = value;
                        await this.plugin.saveSettings();
                    }))
                .addText(text => text
                    // Comma-separated role names: a plain text field edits far
                    // more comfortably than a stack of dropdowns per rule.
                    .setPlaceholder(t('SETTINGS_ROLES_VOICES'))
                    .setValue(rule.roles
                        .map(id => cfg.roles.find(r => r.id === id)?.name ?? id)
                        .join(', '))
                    .onChange(async (value) => {
                        rule.roles = value.split(/[,、]/)
                            .map(n => n.trim())
                            .filter(Boolean)
                            .map(n => cfg.roles.find(r => r.name === n || r.id === n)?.id ?? n);
                        await this.plugin.saveSettings();
                    }))
                .addExtraButton(b => b
                    .setIcon('trash-2')
                    .setTooltip(t('SETTINGS_REMOVE'))
                    .onClick(async () => {
                        cfg.rules = cfg.rules.filter(r => r.id !== rule.id);
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            // Built-in rules can be restored one at a time; rules the reader
            // added have no default to return to, so they only get a delete.
            const stockRule = defaultRules().find(d => d.id === rule.id);
            if (stockRule) {
                setting.addExtraButton(b => b
                    .setIcon('rotate-ccw')
                    .setTooltip(t('SETTINGS_RESET'))
                    .onClick(async () => {
                        rule.situation = stockRule.situation;
                        rule.roles = [...stockRule.roles];
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            }
            setting.infoEl.remove();
        }

        new Setting(containerEl).addButton(b => b
            .setButtonText(t('SETTINGS_ROLES_ADD_RULE'))
            .onClick(async () => {
                cfg.rules.push({ id: 'r-' + Date.now(), situation: '', roles: [] });
                await this.plugin.saveSettings();
                this.display();
            }));

        new Setting(containerEl)
            .setName(t('SETTINGS_ROLES_VOICES_HEADING'))
            .setDesc(t('SETTINGS_ROLES_RESET_ALL'))
            .setHeading()
            .addExtraButton(b => b
                .setIcon('rotate-ccw')
                .setTooltip(t('SETTINGS_RESET'))
                .onClick(async () => {
                    cfg.roles = defaultRoles();
                    await this.plugin.saveSettings();
                    this.display();
                }));

        for (const role of cfg.roles) {
            const stock = defaultRoles().find(d => d.id === role.id);
            // Older saved roles predate the emoji field.
            if (role.emoji === undefined) role.emoji = stock?.emoji ?? '💬';
            const setting = new Setting(containerEl)
                .addText(text => {
                    // Emoji and name sit inline: the voice's identity is one
                    // thing, and both show up as the answer's prefix.
                    text.setValue(role.emoji)
                        .onChange(async (value) => {
                            role.emoji = value.trim();
                            await this.plugin.saveSettings();
                        });
                    text.inputEl.addClass('ai-companion-emoji-input');
                })
                .addText(text => text
                    .setValue(role.name)
                    .onChange(async (value) => {
                        role.name = value;
                        await this.plugin.saveSettings();
                    }))
                .addTextArea(area => {
                    area.setValue(role.prompt)
                        .onChange(async (value) => {
                            role.prompt = value;
                            await this.plugin.saveSettings();
                        });
                    area.inputEl.rows = 3;
                    area.inputEl.addClass('ai-companion-role-prompt');
                });

            if (stock) {
                setting.addExtraButton(b => b
                    .setIcon('rotate-ccw')
                    .setTooltip(t('SETTINGS_RESET'))
                    .onClick(async () => {
                        role.emoji = stock.emoji;
                        role.name = stock.name;
                        role.prompt = stock.prompt;
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            } else {
                setting.addExtraButton(b => b
                    .setIcon('trash-2')
                    .setTooltip(t('SETTINGS_REMOVE'))
                    .onClick(async () => {
                        cfg.roles = cfg.roles.filter(r => r.id !== role.id);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            }
        }

        new Setting(containerEl).addButton(b => b
            .setButtonText(t('SETTINGS_ROLES_ADD_VOICE'))
            .onClick(async () => {
                const id = 'role-' + Date.now();
                cfg.roles.push({ id, emoji: '💬', name: t('SETTINGS_ROLES_NEW_VOICE'), prompt: '' });
                await this.plugin.saveSettings();
                this.display();
            }));
    }

    /**
     * Appearance: opt-in styling for the plugin's own sections.
     *
     * Deliberately last and deliberately off by default — the reader's theme
     * should win unless they ask otherwise.
     */
    private renderAppearance(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('SETTINGS_STYLE_NAME'))
            .setDesc(t('SETTINGS_STYLE_DESC'))
            .addDropdown(dropdown => {
                for (const theme of STYLE_THEMES) {
                    dropdown.addOption(theme.id, t(theme.labelKey));
                }
                dropdown.setValue(this.plugin.settings.appearance.theme)
                    .onChange(async (value) => {
                        this.plugin.settings.appearance.theme = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.appearance.theme !== 'none') {
            new Setting(containerEl)
                .setName(t('SETTINGS_STYLE_JOURNAL_ONLY_NAME'))
                .setDesc(t('SETTINGS_STYLE_JOURNAL_ONLY_DESC'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.appearance.journalOnly)
                    .onChange(async (value) => {
                        this.plugin.settings.appearance.journalOnly = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
