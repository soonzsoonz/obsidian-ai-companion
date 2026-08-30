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
  'zh-tw': STRINGS_ZH_TW,
  'zh-cn': STRINGS_ZH_CN,
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

export function getLanguage(): string {
    // For browser/electron environment where window.localStorage might be accessible 
    // or using obsidian's internal localization
    return window.localStorage.getItem('language') || 'en';
}

export function t(key: keyof typeof STRINGS_EN): string {
  const lang = getLanguage();
  const locale = locales[lang] || locales.en;
  return locale[key] || STRINGS_EN[key];
}
