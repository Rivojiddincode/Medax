import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, Brand, Category, Product } from "../api";
import { ProductCard } from "../components/Shell";
import { useI18n } from "../context/I18nContext";

interface HomeData {
  total: number;
  categories: Category[];
  brands: Brand[];
  hits: Product[];
  news: Product[];
  latest: Product[];
}

export interface HeroSlide {
  id: number;
  badge: string;
  verified?: boolean;
  titleTop?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  title?: string;
  desc: string;
  pills?: string[];
  cta: string;
  ctaLink: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  img: string;
  alt: string;
  bgGradient?: string;
  isGraphic?: boolean;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: "Yangi Texnologiya",
    verified: true,
    titleTop: "Nogironlar aravachasi",
    titleHighlight: "ENDI PULT ORQALI",
    titleSuffix: "MEDAX'DA",
    desc: "Elektromotorli, yengil va xavfsiz konstruksiya. Masofaviy pult orqali avtomatik qulay boshqaruv.",
    pills: ["🎮 Masofaviy pult", "⚡ Kuchli akkumulyator", "🛡️ 1 yil kafolat", "🚚 Bepul yetkazib berish"],
    cta: "Katalogdan ko'rish →",
    ctaLink: "/catalog?category=reabilitatsiya-va-invalit-aravachalari",
    secondaryCta: "Menejer bilan bog'lanish",
    secondaryCtaLink: "/contact",
    img: "/uploads/banners/wheelchair-remote.png",
    alt: "Pult orqali boshqariladigan nogironlar aravachasi Medax",
    bgGradient: "linear-gradient(135deg, #eef2f6 0%, #e2e8f0 45%, #f8fafc 100%)",
  },
  {
    id: 2,
    badge: "Kafolatli diagnostika",
    verified: true,
    titleTop: "Zamonaviy UZI apparatlari",
    titleHighlight: "ANIQ VA TEZKOR",
    titleSuffix: "MEDAX'DA",
    desc: "4D tasvirlash, yuqori aniqlikdagi datchiklar va klinikalar uchun rasmiy muhandislik kafolati.",
    pills: ["🩺 4D skanerlash", "🔬 Yuqori aniqlik", "🛠️ Muhandislik kafolati"],
    cta: "UZI apparatlarini ko'rish →",
    ctaLink: "/catalog?category=ultratovush-diagnostikasi",
    secondaryCta: "Tijoriy taklif olish",
    secondaryCtaLink: "/contact",
    img: "/uploads/products/medical-diag.jpg",
    alt: "Diagnostika uskunalari",
    bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)",
  },
  {
    id: 3,
    badge: "Reanimatsiya & Jarrohlik",
    verified: true,
    titleTop: "Reanimatsiya va IVL tizimlari",
    titleHighlight: "ISHONCHLI KAFOLAT",
    titleSuffix: "MEDAX'DA",
    desc: "Bemor hayotiy ko'rsatkichlari monitorlari, kislorod konsentratorlari va xalqaro sertifikatli uskunalar.",
    pills: ["🫁 Nafas berish tizimi", "📊 Ko'p parametrli monitoring", "⚡ 24/7 uzluksiz ish"],
    cta: "Reanimatsiya jihozlari →",
    ctaLink: "/catalog?category=reanimatsiya-va-anesteziologiya",
    secondaryCta: "Mutaxassis konsultatsiyasi",
    secondaryCtaLink: "/contact",
    img: "/uploads/products/medical-surgery.jpg",
    alt: "Reanimatsiya va jarrohlik uskunalari",
    bgGradient: "linear-gradient(135deg, #fef2f2 0%, #f8fafc 50%, #eff6ff 100%)",
  },
  {
    id: 4,
    badge: "Tibbiy mebel",
    verified: true,
    titleTop: "Funksional tibbiy kravatlar",
    titleHighlight: "QULAY VA CHIDAMLI",
    titleSuffix: "MEDAX'DA",
    desc: "Bemorlarning qulay va tez sog'ayishi uchun ko'p funksiyali elektr boshqaruvli kravatlar va aravachalar.",
    pills: ["🛏️ Elektr sozlanish", "🦾 Mustahkam metall karkas", "🛡️ Rasmiy servis"],
    cta: "Mebellarni tanlash →",
    ctaLink: "/catalog?category=tibbiy-mebel",
    secondaryCta: "Klinikaga buyurtma",
    secondaryCtaLink: "/contact",
    img: "/uploads/products/medical-bed.jpg",
    alt: "Tibbiy funksional kravat",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f8fafc 100%)",
  },
];

export default function Home() {
  const nav = useNavigate();
  const { lang, t } = useI18n();
  const [data, setData] = useState<HomeData | null>(null);
  const [tab, setTab] = useState<"latest" | "hits">("latest");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // B2B tezkor so'rov formasi holati
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryEquipment, setInquiryEquipment] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  // Carousel autoplay timer (every 5 seconds, pauses on hover)
  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarouselPaused]);

  useEffect(() => {
    api<HomeData>("/home").then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [data, tab]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    nav(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : "/catalog");
  };

  const handleInquirySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setInquiryName("");
      setInquiryPhone("");
      setInquiryEquipment("");
    }, 4500);
  };

  const list = data && data[tab] ? data[tab] : [];

  return (
    <main>
      {/* Uzum-style Big Hero Slider Banner */}
      <section className="uz-hero-section">
        <div className="wrap">
          <div
            className="uz-banner-carousel"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Prev arrow button */}
            <button
              type="button"
              className="uz-carousel-nav prev"
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
              aria-label="Oldingi slayd"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Active Slide */}
            {HERO_SLIDES[currentSlide].isGraphic ? (
              <Link
                to={HERO_SLIDES[currentSlide].ctaLink}
                className="uz-carousel-slide uz-carousel-slide--graphic active"
                key={HERO_SLIDES[currentSlide].id}
                aria-label={HERO_SLIDES[currentSlide].alt}
              >
                <img
                  src={HERO_SLIDES[currentSlide].img}
                  alt={HERO_SLIDES[currentSlide].alt}
                  className="uz-slide-graphic-img"
                />
              </Link>
            ) : (
              <div
                className="uz-carousel-slide active"
                key={HERO_SLIDES[currentSlide].id}
                style={{
                  background:
                    HERO_SLIDES[currentSlide].bgGradient ||
                    "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                }}
              >
                <div className="uz-slide-content">
                  <div className="uz-slide-badges">
                    <span className="uz-slide-badge">
                      <span className="uz-badge-dot"></span>
                      {HERO_SLIDES[currentSlide].badge}
                    </span>
                    {HERO_SLIDES[currentSlide].verified && (
                      <span className="uz-slide-verified-badge">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        ORIGINAL
                      </span>
                    )}
                  </div>

                  <h1 className="uz-slide-title">
                    <span className="slide-title-main">
                      {HERO_SLIDES[currentSlide].titleTop || HERO_SLIDES[currentSlide].title}
                    </span>
                    {HERO_SLIDES[currentSlide].titleHighlight && (
                      <span className="slide-title-highlight">
                        {HERO_SLIDES[currentSlide].titleHighlight}
                      </span>
                    )}
                    {HERO_SLIDES[currentSlide].titleSuffix && (
                      <span className="slide-title-brand">
                        {HERO_SLIDES[currentSlide].titleSuffix}
                      </span>
                    )}
                  </h1>

                  <p className="uz-slide-desc">{HERO_SLIDES[currentSlide].desc}</p>

                  {HERO_SLIDES[currentSlide].pills && (
                    <div className="uz-slide-features">
                      {HERO_SLIDES[currentSlide].pills!.map((pill) => (
                        <span key={pill} className="uz-feature-pill">
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="uz-slide-actions">
                    <Link to={HERO_SLIDES[currentSlide].ctaLink} className="btn btn-primary-sheen">
                      {HERO_SLIDES[currentSlide].cta}
                    </Link>
                    <Link
                      to={HERO_SLIDES[currentSlide].secondaryCtaLink || "/contact"}
                      className="btn ghost"
                    >
                      {HERO_SLIDES[currentSlide].secondaryCta || "Menejer bilan bog'lanish"}
                    </Link>
                  </div>
                </div>

                <div className="uz-slide-visual">
                  <div className="uz-slide-img-backdrop"></div>
                  <img
                    src={HERO_SLIDES[currentSlide].img}
                    alt={HERO_SLIDES[currentSlide].alt}
                    className="uz-slide-product-img"
                  />
                </div>
              </div>
            )}

            {/* Next arrow button */}
            <button
              type="button"
              className="uz-carousel-nav next"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              aria-label="Keyingi slayd"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Carousel navigation indicator dots */}
            <div className="uz-carousel-dots">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`dot ${idx === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slayd ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Uzum-style 4 Quick Category Cards below banner */}
          <div className="uz-quick-tiles">
            <Link to="/catalog?category=reanimatsiya-va-anesteziologiya" className="uz-quick-tile">
              <div className="tile-icon-wrap">🫁</div>
              <div className="tile-info">
                <strong>Reanimatsiya va IVL</strong>
                <span>Nafas berish va monitoring</span>
              </div>
            </Link>

            <Link to="/catalog?category=ultratovush-diagnostikasi" className="uz-quick-tile">
              <div className="tile-icon-wrap">🩺</div>
              <div className="tile-info">
                <strong>UZI Diagnostika</strong>
                <span>Dopler va 3D/4D datchiklar</span>
              </div>
            </Link>

            <Link to="/catalog?category=jarrohlik" className="uz-quick-tile">
              <div className="tile-icon-wrap">🔬</div>
              <div className="tile-info">
                <strong>Jarrohlik jihozlari</strong>
                <span>Stollar, lampalar va koagulyator</span>
              </div>
            </Link>

            <Link to="/catalog?category=tibbiy-mebel" className="uz-quick-tile">
              <div className="tile-icon-wrap">🛏️</div>
              <div className="tile-info">
                <strong>Tibbiy mebel</strong>
                <span>Funksional kravatlar va aravachalar</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="facts stagger-items">
          <div className="fact-item reveal">
            <div className="fact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4M7 10h2l2-3 2 6 2-3h2" />
              </svg>
            </div>
            <div className="fact-text">
              <b>{t("trust_1_title")}</b>
              <span>{t("trust_1_desc")}</span>
            </div>
          </div>

          <div className="fact-item reveal">
            <div className="fact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="fact-text">
              <b>{t("trust_2_title")}</b>
              <span>{t("trust_2_desc")}</span>
            </div>
          </div>

          <div className="fact-item reveal">
            <div className="fact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="fact-text">
              <b>{t("trust_3_title")}</b>
              <span>{t("trust_3_desc")}</span>
            </div>
          </div>

          <div className="fact-item reveal">
            <div className="fact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <div className="fact-text">
              <b>{t("trust_4_title")}</b>
              <span>{t("trust_4_desc")}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="wrap"><p className="err">{error}</p></div>}

      <section className="sec">
        <div className="wrap">
          <div className="sec-head-wrap reveal">
            <h2>{t("categories_title")}</h2>
            <span className="sec-sub">{t("categories_sub")}</span>
          </div>
          <div className="cats stagger-items">
            {data?.categories?.map((c) => (
              <Link key={c.id} className="cat reveal" to={`/catalog?category=${c.slug}`}>
                <div className="cat-content">
                  <h3>{c.name}</h3>
                  <div className="cat-meta">
                    <small>{c.count} {t("items_count")}</small>
                    <span className="cat-arrow" aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec products-sec">
        <div className="wrap">
          <div className="bar reveal">
            <h2>{t("products_title")}</h2>
            <div role="tablist" aria-label="Mahsulot turi">
              {([["latest", t("tab_latest")], ["hits", t("tab_hits")]] as const).map(([k, label]) => (
                <button
                  key={k}
                  className="tab"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link className="catalog-text-link" to="/catalog">
              <span>{t("view_all_catalog")}</span>
              <span className="link-arrow">→</span>
            </Link>
          </div>
          <div className="grid stagger-items">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
            {data && list.length === 0 && <div className="empty">{t("not_found_products")}</div>}
          </div>
        </div>
      </section>

      {/* Qanday buyurtma beriladi? (4 bosqich) */}
      <section className="sec order-steps-sec" id="buyurtma">
        <div className="wrap">
          <div className="sec-head-wrap text-center reveal">
            <h2>{t("how_to_order")}</h2>
            <span className="sec-sub">
              {lang === "ru"
                ? "Поэтапный процесс для медицинских учреждений и клиник"
                : lang === "en"
                ? "Step-by-step process for healthcare institutions and clinics"
                : "Tibbiy muassasalar va klinikalar uchun bosqichma-bosqich jarayon"}
            </span>
          </div>

          <div className="order-steps-grid stagger-items">
            <div className="order-step-card reveal">
              <span className="step-num-pill">01</span>
              <h3>{lang === "ru" ? "Подача заявки" : lang === "en" ? "Submit Request" : "So'rov qoldirish"}</h3>
              <p>
                {lang === "ru"
                  ? "Отправьте заявку через сайт или укажите требуемое оборудование и ТЗ."
                  : lang === "en"
                  ? "Submit a request online or specify the required equipment specifications."
                  : "Sayt orqali so'rov yuborasiz yoki kerakli uskuna va texnik topshiriqni bildirasiz."}
              </p>
            </div>

            <div className="order-step-card reveal">
              <span className="step-num-pill">02</span>
              <h3>{lang === "ru" ? "Коммерческое предложение (КП)" : lang === "en" ? "Commercial Offer" : "Tijoriy taklif (KP)"}</h3>
              <p>
                {lang === "ru"
                  ? "В течение 24 часов наш специалист предоставит официальные цены, спецификации и сроки."
                  : lang === "en"
                  ? "Within 24 hours, our specialist provides official pricing, specs, and delivery timelines."
                  : "24 soat ichida mutaxassisimiz rasmiy narx, spetsifikatsiya va muddatlarni taqdim etadi."}
              </p>
            </div>

            <div className="order-step-card reveal">
              <span className="step-num-pill">03</span>
              <h3>{lang === "ru" ? "Официальный договор" : lang === "en" ? "Official Contract" : "Rasmiy shartnoma"}</h3>
              <p>
                {lang === "ru"
                  ? "Юридический договор, условия оплаты и гарантийные обязательства согласовываются сторонами."
                  : lang === "en"
                  ? "Legal contract, payment terms, and warranty obligations are verified and signed."
                  : "Yuridik shartnoma, to'lov shartlari va kafolat majburiyatlari tasdiqlanadi."}
              </p>
            </div>

            <div className="order-step-card reveal">
              <span className="step-num-pill">04</span>
              <h3>{lang === "ru" ? "Доставка и наладка" : lang === "en" ? "Delivery & Setup" : "Yetkazish va sozlash"}</h3>
              <p>
                {lang === "ru"
                  ? "Доставка по всему Узбекистану, монтаж и обучение персонала нашими инженерами."
                  : lang === "en"
                  ? "Delivery across Uzbekistan, installation, calibration, and training by certified engineers."
                  : "O'zbekiston bo'ylab yetkazib berish, muhandislar tomonidan o'rnatish va o'rgatish."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tezkor so'rov formasi (B2B narx va tijoriy taklif so'rash) */}
      <section className="sec inquiry-sec">
        <div className="wrap">
          <div className="inquiry-card reveal-scale">
            <div className="inquiry-info">
              <span className="inquiry-badge">{lang === "ru" ? "Быстрая связь" : lang === "en" ? "Fast Support" : "Tezkor aloqa"}</span>
              <h2>{t("inquiry_title")}</h2>
              <p className="inquiry-desc">{t("inquiry_sub")}</p>

              <div className="inquiry-points">
                <div className="inquiry-point">
                  <span className="point-check">✓</span>
                  <span>{lang === "ru" ? "Быстрый ответ за 15 минут" : lang === "en" ? "Fast response in 15 mins" : "15 daqiqada tezkor javob"}</span>
                </div>
                <div className="inquiry-point">
                  <span className="point-check">✓</span>
                  <span>{lang === "ru" ? "Прямые заводские цены" : lang === "en" ? "Direct factory prices" : "To'g'ridan-to'g'ri rasmiy zavod narxi"}</span>
                </div>
                <div className="inquiry-point">
                  <span className="point-check">✓</span>
                  <span>{lang === "ru" ? "Полный комплект сертификатов" : lang === "en" ? "Complete certifications" : "To'liq sertifikat va texnik pasport"}</span>
                </div>
              </div>
            </div>

            <form className="inquiry-form" onSubmit={handleInquirySubmit}>
              {inquirySent ? (
                <div className="inquiry-success-msg">
                  <span className="success-badge">✓</span>
                  <h3>{t("inquiry_sent_title")}</h3>
                  <p>{t("inquiry_sent_desc")}</p>
                </div>
              ) : (
                <>
                  <div className="inquiry-input-field">
                    <label htmlFor="inq-name">{t("inquiry_name")}</label>
                    <input
                      id="inq-name"
                      type="text"
                      required
                      placeholder={lang === "ru" ? "Например, Др. Азиз Каримов" : lang === "en" ? "E.g., Dr. Aziz Karimov" : "Masalan, Dr. Aziz Karimov"}
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                    />
                  </div>

                  <div className="inquiry-input-field">
                    <label htmlFor="inq-phone">{t("inquiry_phone")}</label>
                    <input
                      id="inq-phone"
                      type="tel"
                      required
                      placeholder="+998 90 123 45 67"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                    />
                  </div>

                  <div className="inquiry-input-field">
                    <label htmlFor="inq-eq">{t("inquiry_equip")}</label>
                    <input
                      id="inq-eq"
                      type="text"
                      placeholder={lang === "ru" ? "Например, аппарат УЗИ или операционный стол" : lang === "en" ? "E.g., Ultrasound or Surgical table" : "Masalan, UZI apparati yoki Jarrohlik stoli"}
                      value={inquiryEquipment}
                      onChange={(e) => setInquiryEquipment(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-inquiry-submit">
                    {t("inquiry_submit")}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Rasmiy hamkor brendlar */}
      <section className="sec brands-sec" id="brend">
        <div className="wrap">
          <div className="sec-head-wrap text-center reveal">
            <h2>{t("brands_title")}</h2>
            <span className="sec-sub">{t("brands_sub")}</span>
          </div>

          <div className="brands-clean-grid stagger-items">
            {data?.brands?.map((b) => {
              const logoMap: Record<string, string> = {
                mindray: "/brands/mindray.png",
                dirui: "/brands/dirui.png",
                rayto: "/brands/rayto.png",
                chison: "/brands/chison.png",
                human: "/brands/human.png",
                cypress: "/brands/cypress.png",
              };
              const logoSrc = logoMap[b.slug];

              return (
                <Link
                  key={b.id}
                  className="brand-clean-card reveal"
                  to={`/catalog?brand=${b.slug}`}
                  title={`${b.name} (${b.country || ""})`}
                >
                  {logoSrc ? (
                    <div className="brand-logo-box">
                      <img src={logoSrc} alt={b.name} loading="lazy" />
                    </div>
                  ) : null}
                  <strong className="brand-clean-name">{b.name}</strong>
                  {b.country && <span className="brand-clean-country">{b.country}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
