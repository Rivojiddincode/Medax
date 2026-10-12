import React, { useState, useEffect, useRef } from "react";
import { MedaxLogo } from "./MedaxLogo";
import { useI18n } from "../context/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface AppOnboardingProps {
  onComplete: () => void;
}

interface SlideData {
  image: string;
  badge: { uz: string; ru: string; en: string };
  title: { uz: string; ru: string; en: string };
  desc: { uz: string; ru: string; en: string };
  chips: Array<{ uz: string; ru: string; en: string }>;
}

const SLIDES: SlideData[] = [
  {
    image: "/uploads/products/medical-surgery.jpg",
    badge: {
      uz: "B2B TIBBIYOT PLATFORMASI",
      ru: "B2B МЕДИЦИНСКАЯ ПЛАТФОРМА",
      en: "B2B MEDICAL PLATFORM",
    },
    title: {
      uz: "Klinika va Shifoxonalar Uchun Zamonaviy Tibbiy Texnikalar",
      ru: "Современное медицинское оборудование для клиник и больниц",
      en: "Advanced Medical Equipment for Clinics & Hospitals",
    },
    desc: {
      uz: "Jarrohlik, reanimatsiya, ultratovush diagnostikasi va tibbiy mebellarning O'zbekistondagi rasmiy distribyutori.",
      ru: "Официальный дистрибьютор хирургического, реанимационного, диагностического оборудования и медицинской мебели в Узбекистане.",
      en: "Official distributor of surgical, intensive care, ultrasound diagnostics and medical furniture in Uzbekistan.",
    },
    chips: [
      { uz: "15+ Xalqaro Brendlar", ru: "15+ Мировых брендов", en: "15+ Global Brands" },
      { uz: "500+ O'rnatilgan Uskunalar", ru: "500+ Установленных систем", en: "500+ Installed Systems" },
    ],
  },
  {
    image: "/uploads/products/medical-diag.jpg",
    badge: {
      uz: "100% RASMIY ZAVOD KAFOLATI",
      ru: "100% ЗАВОДСКАЯ ГАРАНТИЯ",
      en: "100% OFFICIAL WARRANTY",
    },
    title: {
      uz: "Rasmiy Kafolat va Sertifikatlangan Muhandislik Servisi",
      ru: "Официальная гарантия и сертифицированный сервис",
      en: "Official Manufacturer Warranty & Certified Engineering",
    },
    desc: {
      uz: "Barcha uskunalarga 12 oydan 36 oygacha rasmiy kafolat beriladi. Malakali muhandislarimiz uskunangizning uzluksiz ishlashini ta'minlaydi.",
      ru: "Гарантия от 12 до 36 месяцев на всю технику. Авторизованная сервисная служба инженеров обеспечивает бесперебойную работу.",
      en: "12 to 36 months manufacturer warranty on all equipment. Certified engineers ensure continuous uptime and support.",
    },
    chips: [
      { uz: "12–36 Oy Rasmiy Kafolat", ru: "12–36 Месяцев гарантии", en: "12–36 Months Warranty" },
      { uz: "Litsenziyalangan Muhandislar", ru: "Сертифицированные инженеры", en: "Certified Engineers" },
    ],
  },
  {
    image: "/uploads/products/medical-icu.jpg",
    badge: {
      uz: "TO'G'RIDAN-TO'G'RI IMPORT",
      ru: "ПРЯМОЙ ИМПОРТ",
      en: "DIRECT IMPORT",
    },
    title: {
      uz: "Ishlab Chiqaruvchi Narxlari va Tezkor Yetkazish",
      ru: "Цены напрямую от заводов и экспресс-доставка",
      en: "Direct Factory Prices & Fast Delivery",
    },
    desc: {
      uz: "Ortiqcha vositachilarsiz to'g'ridan-to'g'ri zavod narxlari. O'zbekiston bo'ylab 1-3 kunda xavfsiz yetkazib, joyida to'liq sozlab topshiramiz.",
      ru: "Цены напрямую от заводов без переплат. Экспресс-доставка за 1-3 дня по всему Узбекистану с профессиональным монтажом.",
      en: "Direct manufacturer pricing with zero middle markup. Safe 1-3 day delivery across Uzbekistan with on-site setup.",
    },
    chips: [
      { uz: "1–3 Kunda Yetkazish", ru: "Доставка за 1–3 дня", en: "1–3 Days Delivery" },
      { uz: "Joyida O'rnatish & O'qitish", ru: "Монтаж и обучение", en: "On-site Setup & Training" },
    ],
  },
  {
    image: "/uploads/products/medical-monitor.jpg",
    badge: {
      uz: "SHAXSIY B2B KABINET",
      ru: "ЛИЧНЫЙ B2B КАБИНЕТ",
      en: "PERSONAL B2B ACCOUNT",
    },
    title: {
      uz: "Shaxsiy Kabinet, Ulgurji Narxlar va Shartnomalar",
      ru: "Личный кабинет, оптовые цены и документация",
      en: "Personal Cabinet, Wholesale Pricing & Contracts",
    },
    desc: {
      uz: "Ilovaga kiring: barcha buyurtmalaringiz tarixi, schyot-fakturalar va klinikangiz uchun maxsus B2B ulgurji narxlarga ega bo'ling.",
      ru: "Войдите в систему: отслеживайте статус заказов, скачивайте счета и получайте персональные оптовые предложения для вашей клиники.",
      en: "Log in to view orders, access contracts and invoices, and unlock exclusive B2B wholesale pricing for your clinic.",
    },
    chips: [
      { uz: "SMS orqali 10s Kirish", ru: "Вход по SMS за 10 сек", en: "10-Sec SMS Login" },
      { uz: "Maxsus B2B Chegirmalar", ru: "Оптовые скидки B2B", en: "Exclusive B2B Discounts" },
    ],
  },
];

export const AppOnboarding: React.FC<AppOnboardingProps> = ({ onComplete }) => {
  const { lang } = useI18n();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = SLIDES.length;
  const slide = SLIDES[current];

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onComplete();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current]);

  // Touch Swipe navigation (Native app gesture feel)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (diff > 50) {
      handleNext(); // swipe left -> next
    } else if (diff < -50) {
      handlePrev(); // swipe right -> prev
    }
  };

  const labels = {
    uz: {
      skip: "O'tkazib yuborish",
      next: "Keyingisi →",
      finish: "Boshlash va Kirish →",
      prev: "← Orqaga",
      step: `Qadam ${current + 1} / ${total}`,
    },
    ru: {
      skip: "Пропустить",
      next: "Далее →",
      finish: "Начать и Войти →",
      prev: "← Назад",
      step: `Шаг ${current + 1} из ${total}`,
    },
    en: {
      skip: "Skip",
      next: "Next →",
      finish: "Get Started & Login →",
      prev: "← Back",
      step: `Step ${current + 1} of ${total}`,
    },
  }[lang] || {
    skip: "O'tkazib yuborish",
    next: "Keyingisi →",
    finish: "Boshlash va Kirish →",
    prev: "← Orqaga",
    step: `Qadam ${current + 1} / ${total}`,
  };

  return (
    <div
      className="onboarding-screen"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header Bar: Faqat Til, Mavzu va O'tkazib yuborish (Skip) tugmasi */}
      <header className="onboarding-topbar">
        <div className="onboard-top-left">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="onboard-skip-btn"
          onClick={onComplete}
          aria-label={labels.skip}
        >
          <span>{labels.skip}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </header>

      {/* Main Slide Presentation */}
      <main className="onboard-main-content">
        <div className="onboard-card">
          {/* Stories-style progress lines */}
          <div className="onboard-story-bars" aria-label={labels.step}>
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`onboard-story-bar ${idx === current ? "active" : idx < current ? "done" : ""}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Slayd ${idx + 1}`}
              />
            ))}
          </div>

          {/* Real Equipment Photo Showcase */}
          <div className="onboard-media-box">
            <img
              key={slide.image}
              src={slide.image}
              alt={slide.title[lang as "uz" | "ru" | "en"] || slide.title.uz}
              className="onboard-photo-img"
              loading="eager"
            />
            <div className="onboard-media-overlay" />
            <div className="onboard-slide-counter">
              <span>{current + 1} / {total}</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="onboard-info-box">
            <span className="onboard-badge-pill">
              {slide.badge[lang as "uz" | "ru" | "en"] || slide.badge.uz}
            </span>

            <h1 className="onboard-heading">
              {slide.title[lang as "uz" | "ru" | "en"] || slide.title.uz}
            </h1>

            <p className="onboard-description">
              {slide.desc[lang as "uz" | "ru" | "en"] || slide.desc.uz}
            </p>

            {/* Micro Feature Chips */}
            <div className="onboard-chips-row">
              {slide.chips.map((chip, cIdx) => (
                <span key={cIdx} className="onboard-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{chip[lang as "uz" | "ru" | "en"] || chip.uz}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Controls Bar */}
      <footer className="onboarding-bottombar">
        {current > 0 ? (
          <button
            type="button"
            className="onboard-prev-btn"
            onClick={handlePrev}
            aria-label={labels.prev}
          >
            {labels.prev}
          </button>
        ) : (
          <div className="onboard-prev-placeholder" />
        )}

        {/* Animated pagination dots */}
        <div className="onboard-dots">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`onboard-dot ${idx === current ? "active" : ""}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Slayd ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className={`btn onboard-next-btn ${current === total - 1 ? "onboard-finish-btn" : ""}`}
          onClick={handleNext}
        >
          <span>{current === total - 1 ? labels.finish : labels.next}</span>
        </button>
      </footer>
    </div>
  );
};
