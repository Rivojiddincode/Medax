import { Link, useLocation } from "react-router-dom";
import { useCart } from "../cart";
import { useCustomerAuth } from "../customerAuth";
import { useI18n } from "../context/I18nContext";

export function MobileBottomNav() {
  const location = useLocation();
  const { count } = useCart();
  const { customer, openAuthModal } = useCustomerAuth();
  const { t } = useI18n();

  const pathname = location.pathname;
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/catalog");
  const isCart = pathname.startsWith("/cart");
  const isAccount = pathname.startsWith("/account");

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil pastki menyu">
      {/* 1. Asosiy */}
      <Link
        to="/"
        className={`mob-nav-item ${isHome ? "active" : ""}`}
        aria-label={t("nav_home") || "Asosiy"}
      >
        <div className="mob-nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="mob-nav-label">{t("nav_home") || "Asosiy"}</span>
      </Link>

      {/* 2. Katalog */}
      <Link
        to="/catalog"
        className={`mob-nav-item ${isCatalog ? "active" : ""}`}
        aria-label={t("nav_catalog") || "Katalog"}
      >
        <div className="mob-nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <span className="mob-nav-label">{t("nav_catalog") || "Katalog"}</span>
      </Link>

      {/* 3. Savatcha */}
      <Link
        to="/cart"
        className={`mob-nav-item ${isCart ? "active" : ""}`}
        aria-label={`${t("nav_cart") || "Savatcha"} (${count})`}
      >
        <div className="mob-nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {count > 0 && <span className="mob-badge">{count > 99 ? "99+" : count}</span>}
        </div>
        <span className="mob-nav-label">{t("nav_cart") || "Savat"}</span>
      </Link>

      {/* 4. Profil / Kirish */}
      {customer ? (
        <Link
          to="/account"
          className={`mob-nav-item ${isAccount ? "active" : ""}`}
          aria-label={t("nav_account") || "Profil"}
        >
          <div className="mob-nav-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="mob-nav-label">{customer.name ? customer.name.split(" ")[0] : "Kabinet"}</span>
        </Link>
      ) : (
        <button
          type="button"
          className="mob-nav-item mob-nav-btn"
          onClick={() => openAuthModal()}
          aria-label={t("btn_login") || "Kirish"}
        >
          <div className="mob-nav-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <span className="mob-nav-label">{t("btn_login") || "Kirish"}</span>
        </button>
      )}
    </nav>
  );
}
