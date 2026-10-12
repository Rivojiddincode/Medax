import React, { useId } from "react";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const maskId = useId();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-morph-btn ${isDark ? "is-dark" : "is-light"} ${className}`.trim()}
      onClick={(e) => toggleTheme(e)}
      title={isDark ? t("theme_light") : t("theme_dark")}
      aria-label={t("theme_toggle")}
    >
      <svg
        className="theme-morph-svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <circle
            className="theme-mask-circle"
            cx={isDark ? "17" : "26"}
            cy={isDark ? "7" : "2"}
            r="8"
            fill="black"
          />
        </mask>

        {/* Quyosh markazi / Oy tanasi */}
        <circle
          className="theme-sun-core"
          cx="12"
          cy="12"
          r={isDark ? "9" : "5"}
          mask={`url(#${maskId})`}
        />

        {/* Quyosh nurlari */}
        <g className="theme-sun-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
};
