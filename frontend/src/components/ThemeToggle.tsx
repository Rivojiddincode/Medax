import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-morph-btn ${isDark ? "is-dark" : "is-light"} ${className}`.trim()}
      onClick={(e) => toggleTheme(e)}
      title={isDark ? t("theme_light") : t("theme_dark")}
      aria-label={t("theme_toggle")}
    >
      <span className="theme-icon-inner">
        {/* Quyosh (Light Mode) */}
        <svg
          className="theme-icon-sun"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#f59e0b" />
          <line x1="12" y1="1" x2="12" y2="3" stroke="#f59e0b" />
          <line x1="12" y1="21" x2="12" y2="23" stroke="#f59e0b" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#f59e0b" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#f59e0b" />
          <line x1="1" y1="12" x2="3" y2="12" stroke="#f59e0b" />
          <line x1="21" y1="12" x2="23" y2="12" stroke="#f59e0b" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#f59e0b" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#f59e0b" />
        </svg>

        {/* Markaziy Oy (Dark Mode) */}
        <svg
          className="theme-icon-moon"
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="#38bdf8"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  );
};
