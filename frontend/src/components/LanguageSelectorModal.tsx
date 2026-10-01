import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, ArrowLeft, Check, Globe } from 'lucide-react';
import type { LanguageOption, AccentOption } from '../types';
import { LANGUAGES } from '../data/languages';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: LanguageOption;
  currentAccent: AccentOption;
  onSelect: (lang: LanguageOption, accent: AccentOption) => void;
}

export const LanguageSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLanguage,
  currentAccent,
  onSelect,
}) => {
  const [activeLang, setActiveLang] = useState<LanguageOption | null>(null);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.accents.some((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)),
    );
  }, [search]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    if (lang.accents.length > 1) {
      setActiveLang(lang);
    } else {
      onSelect(lang, lang.accents[0]);
      onClose();
      setActiveLang(null);
    }
  };

  const handleSelectAccent = (accent: AccentOption) => {
    if (activeLang) {
      onSelect(activeLang, accent);
      onClose();
      setActiveLang(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(4, 3, 6, 0.78)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-in"
        style={{
          background: 'linear-gradient(170deg, rgba(22, 17, 26, 0.98) 0%, rgba(12, 9, 15, 0.99) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {activeLang ? (
            <button
              onClick={() => setActiveLang(null)}
              className="flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 transition-colors font-medium py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Languages</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif text-amber-100 font-medium tracking-wide">
                  Choose Language
                </h3>
                <p className="text-[11px] text-stone-400 font-light">
                  Audio narration & AI will speak in your chosen tongue
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 transition-colors rounded-full hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content View */}
        {!activeLang ? (
          /* ── Level 1: Language Selection ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search language (e.g. Spanish, Français, हिन्दी)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-black/40 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-stone-100 placeholder:text-stone-500 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Language List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLanguage.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/35 shadow-sm shadow-amber-500/10'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl filter drop-shadow-sm">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-100 font-serif">
                            {lang.nativeName}
                          </span>
                          {lang.nativeName !== lang.name && (
                            <span className="text-xs text-stone-400 font-light">
                              ({lang.name})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {lang.accents.length > 1
                            ? `${lang.accents.length} regional accents available`
                            : `${lang.accents[0].name} (${lang.accents[0].code})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                      {lang.accents.length > 1 ? (
                        <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-300 transition-colors" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Level 2: Accent Submenu ── */
          <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeLang.flag}</span>
                <div>
                  <h4 className="text-base font-serif text-amber-100 font-medium">
                    {activeLang.nativeName} ({activeLang.name})
                  </h4>
                  <p className="text-xs text-stone-400">
                    Select your preferred regional dialect / accent
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {activeLang.accents.map((accent) => {
                const isSelected =
                  currentLanguage.id === activeLang.id && currentAccent.code === accent.code;
                return (
                  <button
                    key={accent.code}
                    onClick={() => handleSelectAccent(accent)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'hover:bg-white/[0.05] border border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{accent.flag}</span>
                      <div>
                        <div className="text-sm font-medium text-stone-100">
                          {accent.name}
                        </div>
                        <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                          {accent.code}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-500/25 px-2.5 py-1 rounded-full border border-amber-500/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 group-hover:text-stone-200">
                        Select
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          className="px-6 py-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-stone-500"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <span>
            Current: {currentLanguage.nativeName} ({currentAccent.name} · {currentAccent.code})
          </span>
          <span className="text-[11px] text-amber-500/80">Google Translate & Gemini Powered</span>
        </div>
      </div>
    </div>
  );
};
