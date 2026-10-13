import React, { useEffect, useRef, useState } from "react";
import { Lang, useI18n } from "../context/I18nContext";

const LANGUAGES: { code: Lang; label: string; sub: string }[] = [
  { code: "uz", label: "O'zbekcha", sub: "UZ" },
  { code: "ru", label: "Русский", sub: "RU" },
  { code: "en", label: "English", sub: "EN" },
];

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = "" }) => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda dropdownni yopish
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const handleSelect = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`lang-dropdown-wrapper ${open ? "is-open" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className="lang-trigger-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
        title={t("language")}
      >
        {/* Yer shari / Dunyo (Globe skeleton) SVG ikonka */}
        <svg
          className="lang-globe-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        <span className="lang-current-code">{currentLang.sub}</span>

        {/* Chevron strelka */}
        <svg
          className={`lang-chevron-icon ${open ? "rotate" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Smooth Fade & Slide Dropdown Menu */}
      <div className={`lang-dropdown-menu ${open ? "open" : ""}`} role="listbox">
        {LANGUAGES.map((item) => {
          const isSelected = item.code === lang;
          return (
            <button
              key={item.code}
              type="button"
              className={`lang-menu-item ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelect(item.code)}
              role="option"
              aria-selected={isSelected}
            >
              <div className="lang-item-left">
                <span className="lang-item-badge">{item.sub}</span>
                <span className="lang-item-title">{item.label}</span>
              </div>
              {isSelected && (
                <svg
                  className="lang-check-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
