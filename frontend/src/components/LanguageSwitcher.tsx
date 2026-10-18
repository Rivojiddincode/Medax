import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lang, useI18n } from "../context/I18nContext";

const LANGUAGES: { code: Lang; label: string; sub: string; flag: string }[] = [
  { code: "uz", label: "O'zbekcha", sub: "UZ", flag: "🇺🇿" },
  { code: "ru", label: "Русский", sub: "RU", flag: "🇷🇺" },
  { code: "en", label: "English", sub: "EN", flag: "🇬🇧" },
];

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = "" }) => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Outside click for desktop dropdown and mobile sheet
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Do not close if clicking inside the mobile portal sheet or container
      if (target.closest(".lang-portal-sheet") || target.closest(".lang-portal-container")) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, { passive: true });
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const handleSelect = (code: Lang, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLang(code);
    setOpen(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`lang-dropdown-wrapper ${open ? "is-open" : ""} ${className}`.trim()}
      >
        <button
          type="button"
          className="lang-trigger-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t("language")}
          title={t("language")}
        >
          {/* Yer shari / Dunyo SVG ikonka */}
          <svg
            className="lang-globe-icon"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
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
            width="11"
            height="11"
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

        {/* Desktop Dropdown Menu (anchored under button) */}
        <div className={`lang-dropdown-menu desktop-only ${open ? "open" : ""}`} role="listbox">
          <div className="lang-menu-list">
            {LANGUAGES.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`lang-menu-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => handleSelect(item.code, e)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="lang-item-left">
                    <span className="lang-item-flag" aria-hidden="true">{item.flag}</span>
                    <span className="lang-item-badge">{item.sub}</span>
                    <span className="lang-item-title">{item.label}</span>
                  </div>
                  {isSelected && (
                    <svg
                      className="lang-check-icon"
                      width="18"
                      height="18"
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
      </div>

      {/* Mobile Bottom Sheet Modal rendered directly to body via Portal */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="lang-portal-container" role="presentation">
          <div
            className="lang-portal-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="lang-portal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t("language")}
          >
            <div className="lang-portal-sheet-bar" />
            <div className="lang-sheet-header">
              <h4>{t("language")}</h4>
              <button
                type="button"
                className="lang-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="lang-portal-options">
              {LANGUAGES.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={`lang-portal-btn ${isSelected ? "selected" : ""}`}
                    onClick={(e) => handleSelect(item.code, e)}
                    onPointerUp={(e) => handleSelect(item.code, e)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="lang-item-left">
                      <span className="lang-item-flag" aria-hidden="true">{item.flag}</span>
                      <span className="lang-item-badge">{item.sub}</span>
                      <span className="lang-item-title">{item.label}</span>
                    </div>
                    {isSelected ? (
                      <div className="lang-check-circle">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <div className="lang-radio-circle" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
