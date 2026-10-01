export interface MuseumHeaders {
  museumLabel: string;
  didYouKnow: string;
  artistPrefix?: string;
}

export const MUSEUM_HEADERS: Record<string, MuseumHeaders> = {
  en: {
    museumLabel: 'M U S E U M   L A B E L',
    didYouKnow: 'D I D   Y O U   K N O W',
  },
  es: {
    museumLabel: 'E T I Q U E T A   D E   M U S E O',
    didYouKnow: '¿ S A B Í A S   Q U E . . . ?',
  },
  fr: {
    museumLabel: 'C A R T E L   D U   M U S É E',
    didYouKnow: 'L E   S A V I E Z - V O U S   ?',
  },
  de: {
    museumLabel: 'M U S E U M S S C H I L D',
    didYouKnow: 'W U S S T E N   S I E   S C H O N ?',
  },
  it: {
    museumLabel: 'C A R T E L L I N O   M U S E A L E',
    didYouKnow: 'L O   S A P E V I   C H E . . . ?',
  },
  pt: {
    museumLabel: 'E T I Q U E T A   D E   M U S E U',
    didYouKnow: 'S A B I A   Q U E . . . ?',
  },
  ja: {
    museumLabel: 'ミ ュ ー ジ ア ム ・ ラ ベ ル',
    didYouKnow: 'ご 存 知 で し た か ？',
  },
  zh: {
    museumLabel: '博 物 馆 展 牌',
    didYouKnow: '您 知 道 吗 ？',
  },
  hi: {
    museumLabel: 'सं ग्र हा ल य   ले ब ल',
    didYouKnow: 'क्या आप जानते हैं?',
  },
  ar: {
    museumLabel: 'ب ط ا ق ة   ا ل م ت ح ف',
    didYouKnow: 'هل كنت تعلم؟',
  },
  nl: {
    museumLabel: 'M U S E U M L A B E L',
    didYouKnow: 'W I S T   J E   D A T ?',
  },
  ru: {
    museumLabel: 'М У З Е Й Н А Я   Э Т И К Е Т К А',
    didYouKnow: 'З Н А Е Т Е   Л И   В Ы ?',
  },
  ko: {
    museumLabel: '박 물 관   레 이 블',
    didYouKnow: '알 고   계 셨 나 요 ?',
  },
};

export function getMuseumHeaders(langId: string): MuseumHeaders {
  const base = langId.split('-')[0].toLowerCase();
  return MUSEUM_HEADERS[base] || MUSEUM_HEADERS.en;
}
