import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, money } from "../api";
import { useCart } from "../cart";
import { DeviceIcon } from "../components/Shell";
import { useCustomerAuth, CUSTOMER_TOKEN_KEY } from "../customerAuth";
import { PhoneSmsIcon, ClinicIcon, OrderBoxIcon } from "../components/Icons";
import { TurnstileWidget } from "../components/TurnstileWidget";
import { useI18n } from "../context/I18nContext";

type CheckoutStage = "cart" | "phone" | "otp" | "checkout" | "done";

export default function Cart() {
  const { lang, t } = useI18n();
  const cart = useCart();
  const { customer, token, sendOtp, verifyOtp, refreshCustomer } = useCustomerAuth();
  const startedAt = useRef(Date.now());

  // Stages: cart -> (if not logged in: phone -> otp -> checkout) -> (if logged in: checkout) -> done
  const [stage, setStage] = useState<CheckoutStage>("cart");

  // Form states
  const [phone, setPhone] = useState("+998 ");
  const [captchaToken, setCaptchaToken] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Delivery & payment details
  const [organization, setOrganization] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderCode, setOrderCode] = useState("");

  // Sync logged in customer info
  useEffect(() => {
    if (customer) {
      if (customer.name && !name) setName(customer.name);
      if (customer.phone && (phone === "+998 " || !phone)) setPhone(customer.phone);
      if (customer.organization && !organization) setOrganization(customer.organization);
    }
  }, [customer]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Calculate totals
  const totalAmount = cart.items.reduce((acc, item) => {
    if (item.priceFrom) {
      return acc + Number(item.priceFrom) * item.quantity;
    }
    return acc;
  }, 0);

  const hasAnyPrice = cart.items.some((i) => i.priceFrom);

  // 1. Click "Buyurtmani rasmiylashtirish"
  const handleProceedToCheckout = () => {
    setError("");
    if (customer) {
      // Already logged in! Skip phone & OTP, jump straight to delivery & payment
      setStage("checkout");
    } else {
      // Not logged in -> ask for phone number friction-free
      setStage("phone");
    }
  };

  // 2. Request OTP code
  const handleSendPhoneOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 13) {
      setError("Iltimos, to'liq telefon raqamingizni kiriting (+998 __ ___ __ __)");
      return;
    }

    setBusy(true);
    try {
      const res = await sendOtp(phone, captchaToken || undefined);
      if (res.devCode) setDevCode(res.devCode);
      setCountdown(res.resendIn || 60);
      setStage("otp");
    } catch (err: any) {
      setError(err.message || "SMS kod yuborishda xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  // 3. Verify OTP code
  const handleVerifyPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (otpCode.length !== 6) {
      setError("Iltimos, 6 xonali SMS kodni kiriting");
      return;
    }

    setBusy(true);
    try {
      const authRes = await verifyOtp({
        phone,
        code: otpCode,
        name: name.trim() || undefined,
        organization: organization.trim() || undefined,
      });

      if (authRes?.customer?.name) setName(authRes.customer.name);
      if (authRes?.customer?.organization) setOrganization(authRes.customer.organization);

      // Verified! Now proceed directly to delivery & payment
      setStage("checkout");
    } catch (err: any) {
      setError(err.message || "Kiritilgan kod noto'g'ri");
    } finally {
      setBusy(false);
    }
  };

  // 4. Confirm and place the order
  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 13) {
      setError("Iltimos, to'g'ri telefon raqami kiriting");
      return;
    }

    setBusy(true);
    try {
      const headers: Record<string, string> = {};
      const authToken = token || localStorage.getItem(CUSTOMER_TOKEN_KEY);
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const res = await api<{ code: string }>("/orders", {
        headers,
        json: {
          name: name.trim(),
          phone: cleanPhone,
          organization: organization.trim(),
          deliveryAddress: deliveryAddress.trim(),
          paymentMethod,
          comment: comment.trim(),
          website, // honeypot
          elapsedMs: Date.now() - startedAt.current,
          captchaToken: captchaToken || undefined,
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });

      setOrderCode(res.code);
      cart.clear();
      refreshCustomer();
      setStage("done");
    } catch (err) {
      setError((err as ApiError).message || "Buyurtmani rasmiylashtirishda xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------
  // Render: Done state
  // -------------------------------------------------------------
  if (stage === "done") {
    return (
      <main className="wrap">
        <div className="order-success-card">
          <div className="success-anim-badge">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1>Buyurtmangiz muvaffaqiyatli qabul qilindi!</h1>
          <p className="order-subheading">
            Medax mutaxassisi tez orada <b>{phone}</b> raqamingizga qo'ng'iroq qilib, shartnoma, texnik hujjatlar va yetkazib berish vaqtini aniqlashtiradi.
          </p>

          <div className="order-number-banner">
            <span className="order-num-label">Buyurtma kodi:</span>
            <span className="order-num-value">{orderCode}</span>
          </div>

          <div className="order-next-steps">
            <div className="step-point">
              <span className="step-num">1</span>
              <div>
                <strong>Menejer aloqasi</strong>
                <p>15 daqiqa ichida buyurtmangiz bo'yicha menejer bog'lanadi.</p>
              </div>
            </div>
            <div className="step-point">
              <span className="step-num">2</span>
              <div>
                <strong>Rasmiy kafolat & Shartnoma</strong>
                <p>Yuridik yoki jismoniy shaxs uchun to'liq hujjatlar to'plami tayyorlanadi.</p>
              </div>
            </div>
            <div className="step-point">
              <span className="step-num">3</span>
              <div>
                <strong>Tezkor yetkazib berish</strong>
                <p>Toshkent shahri va barcha viloyatlar bo'ylab o'rnatib berish xizmati.</p>
              </div>
            </div>
          </div>

          <div className="order-actions-bar">
            <Link className="btn btn-primary-sheen" to="/account">
              <OrderBoxIcon size={18} />
              Shaxsiy kabinetda ko'rish
            </Link>
            <Link className="btn ghost" to="/catalog">
              Katalogga qaytish
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Render: Empty cart
  // -------------------------------------------------------------
  if (cart.items.length === 0) {
    return (
      <main className="wrap">
        <div className="cart-empty-box">
          <div className="empty-cart-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1.5" />
              <circle cx="20" cy="21" r="1.5" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h1>{t("cart_empty_title")}</h1>
          <p className="muted" style={{ maxWidth: "48ch", margin: "0 auto 24px" }}>
            {t("cart_empty_desc")}
          </p>
          <Link className="btn btn-primary-sheen" to="/catalog">
            {t("cart_go_catalog")} →
          </Link>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Main Cart & Checkout Flow
  // -------------------------------------------------------------
  return (
    <main className="wrap">
      {/* Breadcrumbs & Flow Progress */}
      <div className="crumbs">
        <Link to="/">Bosh sahifa</Link> /{" "}
        <span onClick={() => setStage("cart")} style={{ cursor: "pointer", textDecoration: stage !== "cart" ? "underline" : "none" }}>
          Savat
        </span>
        {stage !== "cart" && <span> / Rasmiylashtirish</span>}
      </div>

      {/* Progress Steps Header */}
      <div className="checkout-pipeline-steps">
        <div className={`pipe-step ${stage === "cart" ? "active" : "completed"}`} onClick={() => setStage("cart")}>
          <span className="pipe-dot">1</span>
          <span className="pipe-title">Savat</span>
        </div>
        <div className={`pipe-step ${stage === "phone" || stage === "otp" ? "active" : stage === "checkout" ? "completed" : ""}`}>
          <span className="pipe-dot">2</span>
          <span className="pipe-title">Telefon / Kirish</span>
        </div>
        <div className={`pipe-step ${stage === "checkout" ? "active" : ""}`}>
          <span className="pipe-dot">3</span>
          <span className="pipe-title">Yetkazib berish & To'lov</span>
        </div>
      </div>

      <div className="cartpage">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Stage dependent content                     */}
        {/* ======================================================== */}
        <section className="cart-left-col">
          {/* STEP 1: CART ITEMS VIEW */}
          {stage === "cart" && (
            <div>
              <div className="cart-heading-row">
                <h1 style={{ fontSize: 28, margin: 0 }}>Xaridlar savati</h1>
                <span className="cart-count-pill">{cart.count} xil uskuna ({cart.totalQuantity} dona)</span>
              </div>

              <div className="cart-items-table">
                {cart.items.map((i) => {
                  const itemTotal = i.priceFrom ? Number(i.priceFrom) * i.quantity : null;
                  return (
                    <div className="line cart-table-row" key={i.productId}>
                      <div className="th">
                        {i.thumb ? <img src={i.thumb} alt={i.name} /> : <DeviceIcon />}
                      </div>

                      <div className="cart-item-info">
                        <Link to={`/product/${i.slug}`} className="cart-item-title">
                          {i.name}
                        </Link>
                        <div className="cart-item-unit-price">
                          {i.priceFrom ? (
                            <>
                              <span className="unit-label">Dona narxi:</span>
                              <strong>{money(i.priceFrom)}</strong>
                            </>
                          ) : (
                            <span className="negotiated-tag">Narx so'rov bo'yicha</span>
                          )}
                        </div>
                      </div>

                      <div className="acts cart-item-actions">
                        <div className="qty-and-subtotal">
                          <div className="qty">
                            <button onClick={() => cart.setQty(i.productId, i.quantity - 1)} aria-label="Kamaytirish">−</button>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={i.quantity}
                              onChange={(e) => cart.setQty(i.productId, Number(e.target.value))}
                              aria-label="Soni"
                            />
                            <button onClick={() => cart.setQty(i.productId, i.quantity + 1)} aria-label="Ko'paytirish">+</button>
                          </div>

                          {itemTotal !== null && (
                            <div className="item-subtotal-price">
                              {money(itemTotal)}
                            </div>
                          )}
                        </div>

                        <button className="btn-del-item" onClick={() => cart.remove(i.productId)} title="Savatdan o'chirish">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-table-footer">
                <Link to="/catalog" className="btn ghost sm">
                  ← Katalogdan yana tanlash
                </Link>
                <button className="btn ghost sm" onClick={() => cart.clear()}>
                  Savatni tozalash
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHONE INPUT PROMPT */}
          {stage === "phone" && (
            <div className="checkout-step-card">
              <div className="step-back-link" onClick={() => setStage("cart")}>
                ← Savatga qaytish
              </div>
              <div className="step-card-header">
                <div className="step-icon-badge">
                  <PhoneSmsIcon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, margin: "0 0 4px" }}>Buyurtmani davom ettirish</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    Buyurtmani rasmiylashtirish va holatini kuzatish uchun telefon raqamingizni kiriting.
                  </p>
                </div>
              </div>

              {error && <div className="auth-error-banner">{error}</div>}

              <form onSubmit={handleSendPhoneOtp} className="checkout-auth-form">
                <div className="field">
                  <label htmlFor="auth-phone">Telefon raqamingiz</label>
                  <div className="input-with-icon">
                    <input
                      id="auth-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      required
                      autoFocus
                      className="checkout-phone-input"
                    />
                  </div>
                  <span className="field-hint">Ushbu raqamga bir martalik SMS tasdiqlash kodi yuboriladi.</span>
                </div>

                <div className="field">
                  <label htmlFor="auth-name">Ism va familiyangiz (ixtiyoriy)</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Dr. Sardor Rahimov"
                    maxLength={80}
                  />
                </div>

                <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} onExpire={() => setCaptchaToken("")} />

                <button type="submit" className="btn btn-primary-sheen" style={{ width: "100%", height: 48, fontSize: 16 }} disabled={busy}>
                  {busy ? "SMS kod yuborilmoqda…" : "Davom etish (SMS kod olish) →"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {stage === "otp" && (
            <div className="checkout-step-card">
              <div className="step-back-link" onClick={() => setStage("phone")}>
                ← Raqamni o'zgartirish
              </div>
              <div className="step-card-header">
                <div className="step-icon-badge">
                  <PhoneSmsIcon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, margin: "0 0 4px" }}>SMS kodni kiriting</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    <b>{phone}</b> raqamiga yuborilgan 6 xonali kodni kiriting.
                  </p>
                </div>
              </div>

              {devCode && (
                <div className="dev-test-code-badge" onClick={() => setOtpCode(devCode)} title="Bosib kodni qo'yish">
                  <span className="live-radar-dot" />
                  <span>Test rejimi faol. Tasdiqlash kodi: <b>{devCode}</b> (Kodni nusxalash)</span>
                </div>
              )}

              {error && <div className="auth-error-banner">{error}</div>}

              <form onSubmit={handleVerifyPhoneOtp} className="checkout-auth-form">
                <div className="field">
                  <label htmlFor="checkout-otp">6 xonali SMS kod</label>
                  <input
                    id="checkout-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="otp-digit-input"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-sheen"
                  style={{ width: "100%", height: 48, fontSize: 16 }}
                  disabled={busy || otpCode.length !== 6}
                >
                  {busy ? "Tekshirilmoqda…" : "Kodni tasdiqlash va davom etish →"}
                </button>

                <div className="otp-resend-row">
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={countdown > 0 || busy}
                    onClick={() => handleSendPhoneOtp()}
                  >
                    {countdown > 0 ? `Qayta yuborish (${countdown}s)` : "Kodni qayta yuborish"}
                  </button>
                  <button type="button" className="btn ghost sm" onClick={() => setStage("phone")}>
                    Boshqa raqam kiritish
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: DETAILS, DELIVERY & PAYMENT */}
          {stage === "checkout" && (
            <div className="checkout-step-card">
              <div className="step-back-link" onClick={() => setStage("cart")}>
                ← Savatga qaytish
              </div>

              <div className="step-card-header">
                <div className="step-icon-badge">
                  <ClinicIcon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, margin: "0 0 4px" }}>Buyurtmani rasmiylashtirish</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    Yetkazib berish manzili va qulay to'lov usulini tanlang.
                  </p>
                </div>
              </div>

              {/* Logged in badge */}
              <div className="customer-verified-banner">
                <div className="ver-dot-wrap">
                  <span className="live-radar-dot" />
                </div>
                <div>
                  <div className="ver-title">Foydalanuvchi tasdiqlangan</div>
                  <div className="ver-user">
                    {name || customer?.name || "Mijoz"} · <b>{phone || customer?.phone}</b>
                  </div>
                </div>
              </div>

              {error && <div className="auth-error-banner">{error}</div>}

              <form onSubmit={handleConfirmOrder} className="checkout-final-form">
                <h3 className="section-subhead">1. Qabul qiluvchi ma'lumotlari</h3>
                <div className="form-grid-2">
                  <div className="field">
                    <label htmlFor="ord-name">Ism va familiya *</label>
                    <input
                      id="ord-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Masalan: Azizbek Karimov"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ord-phone">Telefon raqam *</label>
                    <input
                      id="ord-phone"
                      type="tel"
                      value={customer?.phone || phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={!!customer}
                      style={customer ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="ord-org">Tibbiy muassasa / Klinika / Tashkilot (ixtiyoriy)</label>
                  <input
                    id="ord-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Masalan: City Med Markazi MCHJ"
                  />
                </div>

                <h3 className="section-subhead" style={{ marginTop: 24 }}>2. Yetkazib berish manzili</h3>
                <div className="field">
                  <label htmlFor="ord-addr">Yetkazib berish manzili (Shahar, viloyat, ko'cha, bino) *</label>
                  <textarea
                    id="ord-addr"
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    placeholder="Masalan: Namangan viloyati, Namangan sh., Ozod MFY, Abu Rayhon Beruniy ko'chasi 2-uy"
                  />
                </div>

                <div className="field">
                  <label htmlFor="ord-comment">Qo'shimcha izoh yoki texnik talablar (ixtiyoriy)</label>
                  <textarea
                    id="ord-comment"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Masalan: Shartnomani elektron hisob-faktura (Didox) orqali yuboring"
                  />
                </div>

                {/* Honeypot field */}
                <div className="hp" aria-hidden="true" style={{ display: "none" }}>
                  <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                <h3 className="section-subhead" style={{ marginTop: 24 }}>3. To'lov usuli</h3>
                <div className="payment-options-grid">
                  {/* 1. Ichki hamyon (Balansdan to'lash) */}
                  {customer && (
                    <label
                      className={`payment-card ${paymentMethod === "wallet_balance" ? "active" : ""}`}
                      style={{
                        border: paymentMethod === "wallet_balance" ? "2px solid #0284c7" : "1px solid var(--line)",
                        background: paymentMethod === "wallet_balance" ? "#f0f9ff" : undefined,
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_opt"
                        value="wallet_balance"
                        checked={paymentMethod === "wallet_balance"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className="pay-card-icon">💳</div>
                      <div className="pay-card-text">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong>Shaxsiy hamyon (Balansdan to'lash)</strong>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              background: (customer.balance || 0) >= totalAmount ? "#dcfce7" : "#fee2e2",
                              color: (customer.balance || 0) >= totalAmount ? "#15803d" : "#b91c1c",
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            Balans: {(customer.balance || 0).toLocaleString("ru-RU")} so'm
                          </span>
                        </div>
                        <span>
                          {(customer.balance || 0) >= totalAmount
                            ? "Balansingiz yetarli! Buyurtma to'lovi darhol avtomatik tasdiqlanadi ✓"
                            : `Mablag' yetarli emas (Yetishmayotgan: ${(totalAmount - (customer.balance || 0)).toLocaleString("ru-RU")} so'm)`}
                        </span>
                      </div>
                    </label>
                  )}

                  <label className={`payment-card ${paymentMethod === "bank_transfer" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payment_opt"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="pay-card-icon">🏦</div>
                    <div className="pay-card-text">
                      <strong>Bank hisob-faktura (Shartnoma)</strong>
                      <span>Yuridik shaxslar, klinikalar va davlat shifoxonalari uchun</span>
                    </div>
                  </label>

                  <label className={`payment-card ${paymentMethod === "upon_delivery" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payment_opt"
                      value="upon_delivery"
                      checked={paymentMethod === "upon_delivery"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="pay-card-icon">💵</div>
                    <div className="pay-card-text">
                      <strong>Yetkazib berilganda to'lash</strong>
                      <span>Uskunani qabul qilib olgach (Naqd, korporativ karta yoki terminal)</span>
                    </div>
                  </label>

                  <label className={`payment-card ${paymentMethod === "contract_quote" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payment_opt"
                      value="contract_quote"
                      checked={paymentMethod === "contract_quote"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="pay-card-icon">📑</div>
                    <div className="pay-card-text">
                      <strong>Tijoriy taklif & Tender hisob-kitobi</strong>
                      <span>Katta hajmdagi tibbiy jihozlar, lizing va rasmiy smeta uchun</span>
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: 28 }}>
                  <button
                    type="submit"
                    className="btn btn-primary-sheen"
                    style={{ width: "100%", height: 52, fontSize: 17, fontWeight: 700 }}
                    disabled={busy}
                  >
                    {busy ? "Buyurtma yuborilmoqda…" : "Buyurtmani tasdiqlash va yakunlash ✓"}
                  </button>
                  <p className="note" style={{ textAlign: "center", marginTop: 12 }}>
                    Tugmani bosish orqali siz shartnoma shartlariga va shaxsiy ma'lumotlarni qayta ishlashga rozilik bildirasiz.
                  </p>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Order Summary Box (Always visible)        */}
        {/* ======================================================== */}
        <aside className="cart-summary-panel">
          <div className="summary-card">
            <h2 className="summary-title">Buyurtma xulosasi</h2>

            <div className="summary-row">
              <span className="summary-label">Mahsulotlar soni:</span>
              <span className="summary-val">{cart.totalQuantity} dona ({cart.count} xil)</span>
            </div>

            <div className="summary-items-preview">
              {cart.items.map((i) => (
                <div className="preview-row" key={i.productId}>
                  <span className="preview-name">{i.name}</span>
                  <span className="preview-qty">× {i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="summary-row total-row">
              <span className="total-label">Jami:</span>
              <div className="total-amount-box">
                {hasAnyPrice && totalAmount > 0 ? (
                  <span className="total-price-val">{money(totalAmount)}</span>
                ) : (
                  <span className="total-price-val">Kelishilgan narxda</span>
                )}
              </div>
            </div>

            {stage === "cart" && (
              <button
                type="button"
                className="btn btn-primary-sheen btn-checkout-cta"
                onClick={handleProceedToCheckout}
              >
                Buyurtmani rasmiylashtirish →
              </button>
            )}

            <div className="summary-perks">
              <div className="perk-item">
                <span className="perk-icon">🛡️</span>
                <span>Rasmiy 12 oylik kafolat va servis</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">🚚</span>
                <span>O'zbekiston bo'ylab yetkazib berish</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">📄</span>
                <span>Yuridik shaxslar uchun shartnoma & hisob-faktura</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
