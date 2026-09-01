import { getLanguage as obsidianGetLanguage } from 'obsidian';
import { STRINGS_EN } from './locales/en';
import { STRINGS_ZH_TW } from './locales/zh_tw';
import { STRINGS_ZH_CN } from './locales/zh_cn';
import { STRINGS_JA } from './locales/ja';
import { STRINGS_KO } from './locales/ko';
import { STRINGS_DE } from './locales/de';
import { STRINGS_FR } from './locales/fr';
import { STRINGS_ES } from './locales/es';
import { STRINGS_PT } from './locales/pt';
import { STRINGS_PT_BR } from './locales/pt_br';
import { STRINGS_RU } from './locales/ru';
import { STRINGS_VI } from './locales/vi';
import { STRINGS_ID } from './locales/id';
import { STRINGS_TH } from './locales/th';
import { STRINGS_TR } from './locales/tr';
import { STRINGS_UK } from './locales/uk';
import { STRINGS_NL } from './locales/nl';
import { STRINGS_IT } from './locales/it';
import { STRINGS_PL } from './locales/pl';
import { STRINGS_AR } from './locales/ar';
import { STRINGS_FA } from './locales/fa';

const locales: { [key: string]: typeof STRINGS_EN } = {
  en: STRINGS_EN,
  // Obsidian reports Simplified Chinese as 'zh' and Traditional as 'zh-TW'.
  zh: STRINGS_ZH_CN,
  'zh-cn': STRINGS_ZH_CN,
  'zh-tw': STRINGS_ZH_TW,
  'zh-hant': STRINGS_ZH_TW,
  ja: STRINGS_JA,
  ko: STRINGS_KO,
  de: STRINGS_DE,
  fr: STRINGS_FR,
  es: STRINGS_ES,
  pt: STRINGS_PT,
  'pt-br': STRINGS_PT_BR,
  ru: STRINGS_RU,
  vi: STRINGS_VI,
  id: STRINGS_ID,
  th: STRINGS_TH,
  tr: STRINGS_TR,
  uk: STRINGS_UK,
  nl: STRINGS_NL,
  it: STRINGS_IT,
  pl: STRINGS_PL,
  ar: STRINGS_AR,
  fa: STRINGS_FA,
};

/**
 * Obsidian's current interface language, as a key into `locales`.
 *
 * Uses Obsidian's own getLanguage(), not localStorage: the stored value is
 * absent when the interface is English (the default is never written), so
 * reading it directly reported English for everyone who had not switched
 * away and back again.
 */
function currentLanguage(): string {
    let raw = '';
    try {
        raw = obsidianGetLanguage() || '';
    } catch {
        // Older API or a non-Obsidian context (tests): fall through.
    }
    if (!raw) {
        try {
            raw = window.localStorage.getItem('language') || '';
        } catch {
            raw = '';
        }
    }

    const lang = raw.toLowerCase().replace('_', '-');
    if (locales[lang]) return lang;
    // zh-hant / pt-pt and similar: try the base tag before giving up.
    const base = lang.split('-')[0];
    return locales[base] ? base : 'en';
}

export function t(key: keyof typeof STRINGS_EN): string {
  const lang = currentLanguage();
  const locale = locales[lang] || locales.en;
  return locale[key] || STRINGS_EN[key];
}

/**
 * Every locale's value for a key.
 *
 * Section headings are written in the reader's language, but a vault may hold
 * notes created under a different one — or shared by someone else. Matching
 * therefore accepts any locale's heading, so switching Obsidian's language
 * never orphans existing notes.
 */
export function allTranslations(key: keyof typeof STRINGS_EN): string[] {
    const seen = new Set<string>();
    for (const locale of Object.values(locales)) {
        const value = locale[key];
        if (value) seen.add(value);
    }
    return [...seen];
}
