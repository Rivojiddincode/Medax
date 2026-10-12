import { useState, useEffect } from "react";
import { useCustomerAuth } from "../customerAuth";
import { useI18n } from "../context/I18nContext";
import { MedaxLogo } from "./MedaxLogo";

export const WELCOME_ONBOARDING_KEY = "medax_welcome_seen";

export function WelcomeOnboardingModal() {
  const { customer, loading, openAuthModal } = useCustomerAuth();
  const { lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa yoki avval ko'rgan bo'lsa ko'rsatmaymiz
    if (loading) return;
    if (customer) return;

    const seen = localStorage.getItem(WELCOME_ONBOARDING_KEY);
    if (!seen) {
      // Bir oz kechiktirib (350ms) ko'rsatish silliq animatsiya beradi
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [customer, loading]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_ONBOARDING_KEY, "1");
    setIsOpen(false);
  };

  const handleLogin = () => {
    localStorage.setItem(WELCOME_ONBOARDING_KEY, "1");
    setIsOpen(false);
    openAuthModal();
  };

  // Matnlar ko'p tillilikka mos
  const content = {
    uz: {
      badge: "B2B TIBBIYOT PLATFORMASI",
      title: "Medax portaliga xush kelibsiz!",
      desc: "Klinikalar, tibbiy markazlar va shifokorlar uchun professional tibbiy uskunalar, to'g'ridan-to'g'ri import va rasmiy kafolat.",
      f1_title: "100% Rasmiy zavod kafolati",
      f1_desc: "12 oydan 36 oygacha rasmiy kafolat va professional muhandislik servisi.",
      f2_title: "To'g'ridan-to'g'ri import & Tezkor yetkazish",
      f2_desc: "O'zbekiston bo'ylab 1-3 kunda yetkazib, joyida o'rnatib sozlab beriladi.",
      f3_title: "Shaxsiy kabinet & Maxsus narxlar",
      f3_desc: "SMS orqali 10 soniyada kiring, buyurtmalarni kuzatib boring va B2B chegirmalarga ega bo'ling.",
      btn_login: "Kirish / Ro'yxatdan o'tish (SMS orqali)",
      btn_guest: "Mehmon sifatida ko'rish →",
    },
    ru: {
      badge: "B2B МЕДИЦИНСКАЯ ПЛАТФОРМА",
      title: "Добро пожаловать в Medax!",
      desc: "Профессиональное медицинское оборудование для клиник, медцентров и врачей с прямым импортом и официальной гарантией.",
      f1_title: "100% Официальная заводская гарантия",
      f1_desc: "Гарантия от 12 до 36 месяцев и авторизованная сервисная служба инженеров.",
      f2_title: "Прямой импорт & Быстрая доставка",
      f2_desc: "Доставка по всему Узбекистану за 1-3 дня с профессиональной установкой на месте.",
      f3_title: "Личный кабинет & Специальные цены",
      f3_desc: "Быстрый вход по SMS за 10 секунд, отслеживание заказов и доступ к оптовым скидкам.",
      btn_login: "Войти / Регистрация (по SMS)",
      btn_guest: "Продолжить как гость →",
    },
    en: {
      badge: "B2B MEDICAL PLATFORM",
      title: "Welcome to Medax!",
      desc: "Professional medical equipment for clinics, medical centers, and doctors with direct import and official warranty.",
      f1_title: "100% Official Factory Warranty",
      f1_desc: "12 to 36 months manufacturer warranty and certified engineering support.",
      f2_title: "Direct Import & Fast Delivery",
      f2_desc: "Fast delivery across Uzbekistan in 1-3 days with on-site installation and tuning.",
      f3_title: "Customer Account & Special Deals",
      f3_desc: "Instant 10-second SMS login, real-time order tracking and wholesale B2B pricing.",
      btn_login: "Sign In / Register (via SMS)",
      btn_guest: "Browse as Guest →",
    },
  }[lang] || {
    badge: "B2B TIBBIYOT PLATFORMASI",
    title: "Medax portaliga xush kelibsiz!",
    desc: "Klinikalar, tibbiy markazlar va shifokorlar uchun professional tibbiy uskunalar, to'g'ridan-to'g'ri import va rasmiy kafolat.",
    f1_title: "100% Rasmiy zavod kafolati",
    f1_desc: "12 oydan 36 oygacha rasmiy kafolat va professional muhandislik servisi.",
    f2_title: "To'g'ridan-to'g'ri import & Tezkor yetkazish",
    f2_desc: "O'zbekiston bo'ylab 1-3 kunda yetkazib, joyida o'rnatib sozlab beriladi.",
    f3_title: "Shaxsiy kabinet & Maxsus narxlar",
    f3_desc: "SMS orqali 10 soniyada kiring, buyurtmalarni kuzatib boring va B2B chegirmalarga ega bo'ling.",
    btn_login: "Kirish / Ro'yxatdan o'tish (SMS orqali)",
    btn_guest: "Mehmon sifatida ko'rish →",
  };

  return (
    <div className="onboard-modal-overlay" onClick={handleDismiss} role="dialog" aria-modal="true">
      <div className="onboard-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Yopish tugmasi */}
        <button
          type="button"
          className="onboard-close-btn"
          onClick={handleDismiss}
          aria-label="Yopish"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Yuqori brend bo'limi */}
        <div className="onboard-head">
          <div className="onboard-logo-box">
            <MedaxLogo size="md" />
          </div>
          <span className="onboard-badge">{content.badge}</span>
          <h2 className="onboard-title">{content.title}</h2>
          <p className="onboard-desc">{content.desc}</p>
        </div>

        {/* 3 ta asosiy afzallik qatori */}
        <div className="onboard-features">
          <div className="onboard-feat-item">
            <div className="onboard-feat-icon icon-shield">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="onboard-feat-text">
              <strong>{content.f1_title}</strong>
              <span>{content.f1_desc}</span>
            </div>
          </div>

          <div className="onboard-feat-item">
            <div className="onboard-feat-icon icon-truck">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className="onboard-feat-text">
              <strong>{content.f2_title}</strong>
              <span>{content.f2_desc}</span>
            </div>
          </div>

          <div className="onboard-feat-item">
            <div className="onboard-feat-icon icon-user">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="onboard-feat-text">
              <strong>{content.f3_title}</strong>
              <span>{content.f3_desc}</span>
            </div>
          </div>
        </div>

        {/* Harakat tugmalari */}
        <div className="onboard-actions">
          <button type="button" className="btn onboard-btn-login" onClick={handleLogin}>
            <span>{content.btn_login}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>

          <button type="button" className="onboard-btn-guest" onClick={handleDismiss}>
            {content.btn_guest}
          </button>
        </div>
      </div>
    </div>
  );
}
