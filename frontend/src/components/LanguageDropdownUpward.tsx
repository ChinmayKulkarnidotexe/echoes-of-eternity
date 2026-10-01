import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronRight, ArrowLeft, Check, X } from 'lucide-react';
import type { LanguageOption, AccentOption } from '../types';
import { LANGUAGES } from '../data/languages';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: LanguageOption;
  currentAccent: AccentOption;
  onSelect: (lang: LanguageOption, accent: AccentOption) => void;
}

export const LanguageDropdownUpward: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLanguage,
  currentAccent,
  onSelect,
}) => {
  const [activeLang, setActiveLang] = useState<LanguageOption | null>(null);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setActiveLang(null);
      setSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

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
      ref={dropdownRef}
      className="absolute bottom-full mb-3 left-0 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(20, 16, 12, 0.98) 0%, rgba(10, 8, 6, 0.99) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.32)',
        boxShadow: '0 -15px 45px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.12)',
        backdropFilter: 'blur(24px)',
        maxHeight: '440px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Dropdown Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        {activeLang ? (
          <button
            onClick={() => setActiveLang(null)}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors font-medium px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Languages</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
              Language & Accent
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-200 transition-colors rounded-full hover:bg-white/[0.06]"
          title="Close dropdown"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Level 1: Language List with Search ── */}
      {!activeLang ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-white/[0.06] bg-black/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search language (Spanish, Français, हिन्दी)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/50 border border-white/[0.1] focus:border-amber-500/50 rounded-xl text-stone-100 placeholder:text-stone-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Languages Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-72 custom-scrollbar">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                No matching languages found
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = currentLanguage.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left group ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/35'
                        : 'hover:bg-white/[0.05] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-stone-100 font-serif">
                            {lang.nativeName}
                          </span>
                          {lang.nativeName !== lang.name && (
                            <span className="text-[10px] text-stone-400 font-light">
                              ({lang.name})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500">
                          {lang.accents.length > 1
                            ? `${lang.accents.length} accents available`
                            : lang.accents[0].name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {lang.accents.length > 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ── Level 2: Accent Submenu ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
            <span className="text-2xl">{activeLang.flag}</span>
            <div>
              <div className="text-xs font-medium text-amber-200 font-serif">
                {activeLang.nativeName} ({activeLang.name})
              </div>
              <div className="text-[10px] text-stone-400">Choose regional accent:</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-72 custom-scrollbar">
            {activeLang.accents.map((accent) => {
              const isSelected =
                currentLanguage.id === activeLang.id && currentAccent.code === accent.code;
              return (
                <button
                  key={accent.code}
                  onClick={() => handleSelectAccent(accent)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : 'hover:bg-white/[0.05] border border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{accent.flag}</span>
                    <div>
                      <div className="text-xs font-medium text-stone-100">{accent.name}</div>
                      <div className="text-[10px] font-mono text-stone-400">{accent.code}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dropdown Footer ── */}
      <div
        className="px-3.5 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-stone-500"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <span>
          Selected: {currentAccent.flag} {currentLanguage.nativeName} ({currentAccent.code})
        </span>
        <span className="text-amber-500/70">Google Translate & Gemini</span>
      </div>
    </div>
  );
};
