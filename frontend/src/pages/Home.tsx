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

const HERO_SLIDES = [
  {
    id: 1,
    badge: "Medax Maxsus Taklif",
    title: "O'zingizga va bemorlarga g'amxo'rlik bilan",
    desc: "Klinikalar va shifoxonalar uchun zamonaviy tibbiy uskunalar, laboratoriya jihozlari va rasmiy kafolat.",
    cta: "Katalogga o'tish →",
    ctaLink: "/catalog",
    img: "/uploads/products/medical-surgery.jpg",
    alt: "Tibbiy jihozlar",
  },
  {
    id: 2,
    badge: "Kafolatli narxlar",
    title: "Reanimatsiya va ultratovush diagnostikasi",
    desc: "Yetakchi brendlarning UZI apparatlari, ko'p parametrli bemor monitorlari va IVL tizimlari kafolat bilan.",
    cta: "Diagnostika uskunalarini ko'rish →",
    ctaLink: "/catalog?category=ultratovush-diagnostikasi",
    img: "/uploads/products/medical-diag.jpg",
    alt: "Diagnostika uskunalari",
  },
  {
    id: 3,
    badge: "Do'konda mavjud",
    title: "Reabilitatsiya va shifoxona mebellari",
    desc: "Bemorlarning qulay va tez sog'ayishi uchun aravachalar, funksional kravatlar va reabilitatsiya vositalari.",
    cta: "Mebellarni tanlash →",
    ctaLink: "/catalog?category=tibbiy-mebel",
    img: "/uploads/products/medical-bed.jpg",
    alt: "Tibbiy mebel",
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

  // B2B tezkor so'rov formasi holati
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryEquipment, setInquiryEquipment] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  // Carousel autoplay timer (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
          <div className="uz-banner-carousel">
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
            <div className="uz-carousel-slide active" key={HERO_SLIDES[currentSlide].id}>
              <div className="uz-slide-content">
                <span className="uz-slide-badge">{HERO_SLIDES[currentSlide].badge}</span>
                <h1 className="uz-slide-title">
                  {HERO_SLIDES[currentSlide].title}
                </h1>
                <p className="uz-slide-desc">
                  {HERO_SLIDES[currentSlide].desc}
                </p>
                <div className="uz-slide-actions">
                  <Link to={HERO_SLIDES[currentSlide].ctaLink} className="btn btn-primary-sheen">
                    {HERO_SLIDES[currentSlide].cta}
                  </Link>
                  <Link to="/contact" className="btn ghost">
                    Menejer bilan bog'lanish
                  </Link>
                </div>
              </div>
              <div className="uz-slide-visual">
                <img
                  src={HERO_SLIDES[currentSlide].img}
                  alt={HERO_SLIDES[currentSlide].alt}
                  className="uz-slide-img"
                />
              </div>
            </div>

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
