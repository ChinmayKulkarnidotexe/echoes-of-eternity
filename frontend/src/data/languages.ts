import type { LanguageOption, AccentOption } from '../types';

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    accents: [
      { code: 'en-US', name: 'United States', flag: '🇺🇸' },
      { code: 'en-GB', name: 'United Kingdom', flag: '🇬🇧' },
      { code: 'en-AU', name: 'Australia', flag: '🇦🇺' },
      { code: 'en-IN', name: 'India', flag: '🇮🇳' },
      { code: 'en-CA', name: 'Canada', flag: '🇨🇦' },
    ],
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    accents: [
      { code: 'es-ES', name: 'España', flag: '🇪🇸' },
      { code: 'es-MX', name: 'México', flag: '🇲🇽' },
      { code: 'es-AR', name: 'Argentina', flag: '🇦🇷' },
      { code: 'es-US', name: 'Estados Unidos', flag: '🇺🇸' },
      { code: 'es-CO', name: 'Colombia', flag: '🇨🇴' },
    ],
  },
  {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    accents: [
      { code: 'fr-FR', name: 'France', flag: '🇫🇷' },
      { code: 'fr-CA', name: 'Canada (Québec)', flag: '🇨🇦' },
      { code: 'fr-BE', name: 'Belgique', flag: '🇧🇪' },
      { code: 'fr-CH', name: 'Suisse', flag: '🇨🇭' },
    ],
  },
  {
    id: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    accents: [
      { code: 'de-DE', name: 'Deutschland', flag: '🇩🇪' },
      { code: 'de-AT', name: 'Österreich', flag: '🇦🇹' },
      { code: 'de-CH', name: 'Schweiz', flag: '🇨🇭' },
    ],
  },
  {
    id: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    accents: [
      { code: 'it-IT', name: 'Italia', flag: '🇮🇹' },
      { code: 'it-CH', name: 'Svizzera', flag: '🇨🇭' },
    ],
  },
  {
    id: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    accents: [
      { code: 'pt-PT', name: 'Portugal', flag: '🇵🇹' },
      { code: 'pt-BR', name: 'Brasil', flag: '🇧🇷' },
    ],
  },
  {
    id: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    accents: [
      { code: 'ja-JP', name: '日本 (Japan)', flag: '🇯🇵' },
    ],
  },
  {
    id: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    accents: [
      { code: 'zh-CN', name: '普通话 (Mandarin - Mainland)', flag: '🇨🇳' },
      { code: 'zh-TW', name: '國語 (Taiwan)', flag: '🇹🇼' },
      { code: 'zh-HK', name: '粵語 (Cantonese - Hong Kong)', flag: '🇭🇰' },
    ],
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    accents: [
      { code: 'hi-IN', name: 'भारत (India)', flag: '🇮🇳' },
    ],
  },
  {
    id: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    accents: [
      { code: 'ar-EG', name: 'مصر (Egypt)', flag: '🇪🇬' },
      { code: 'ar-SA', name: 'المملكة العربية السعودية (Saudi Arabia)', flag: '🇸🇦' },
      { code: 'ar-AE', name: 'الإمارات (UAE)', flag: '🇦🇪' },
    ],
  },
  {
    id: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    accents: [
      { code: 'nl-NL', name: 'Nederland', flag: '🇳🇱' },
      { code: 'nl-BE', name: 'België', flag: '🇧🇪' },
    ],
  },
  {
    id: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    accents: [
      { code: 'ru-RU', name: 'Россия (Russia)', flag: '🇷🇺' },
    ],
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    accents: [
      { code: 'ko-KR', name: '대한민국 (South Korea)', flag: '🇰🇷' },
    ],
  },
];

export const DEFAULT_LANGUAGE: LanguageOption = LANGUAGES[0];
export const DEFAULT_ACCENT: AccentOption = LANGUAGES[0].accents[0];
