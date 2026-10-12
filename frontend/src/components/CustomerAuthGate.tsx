import { FormEvent, useState } from "react";
import { useCustomerAuth } from "../customerAuth";
import { useI18n } from "../context/I18nContext";
import { MedaxLogo } from "./MedaxLogo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TurnstileWidget } from "./TurnstileWidget";

type GateMode = "login" | "register" | "forgot_sms";

interface CustomerAuthGateProps {
  onShowOnboarding?: () => void;
}

export function CustomerAuthGate({ onShowOnboarding }: CustomerAuthGateProps = {}) {
  const { sendOtp, verifyOtp, loginWithPassword } = useCustomerAuth();
  const { lang } = useI18n();

  const [mode, setMode] = useState<GateMode>("login");

  // Phone & SMS
  const [phone, setPhone] = useState("+998 ");
  const [captchaToken, setCaptchaToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  // Profile & Password fields
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const resetFields = () => {
    setOtpSent(false);
    setOtpCode("");
    setDevCode(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const switchMode = (newMode: GateMode) => {
    setMode(newMode);
    resetFields();
  };

  // 1. Telefon raqam + Parol orqali tezkor kirish
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Iltimos, parolingizni kiriting.");
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(phone, password);
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // 2. SMS kod yuborish (Ro'yxatdan o'tish yoki Parolni tiklash)
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(phone, captchaToken || undefined);
      setOtpSent(true);
      if (res.devCode) setDevCode(res.devCode);
      setCountdown(res.resendIn || 60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "SMS kod yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 3. Ro'yxatdan o'tish (SMS tasdiqlash + Yangi Parol o'rnatish)
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kiritilgan parollar bir-biriga mos kelmadi.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        phone,
        code: otpCode,
        name: name.trim() || undefined,
        organization: organization.trim() || undefined,
        password,
      });
    } catch (err: any) {
      setError(err.message || "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  // 4. Parolni unutganda SMS orqali kirish
  const handleSmsLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp({
        phone,
        code: otpCode,
        password: password ? password : undefined,
      });
    } catch (err: any) {
      setError(err.message || "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const txt = {
    uz: {
      badge: "B2B TIBBIYOT PLATFORMASI",
      title: "Medax portaliga xush kelibsiz",
      subtitle: "Katalog, narxlar va buyurtmalarni ko'rish uchun avval tizimga kiring yoki ro'yxatdan o'ting.",
      tab_login: "Parol bilan kirish",
      tab_reg: "Ro'yxatdan o'tish",
      trust_1: "Rasmiy zavod kafolati",
      trust_2: "To'g'ridan-to'g'ri import narxlari",
      trust_3: "Muhandislik va servis xizmati",
    },
    ru: {
      badge: "B2B МЕДИЦИНСКАЯ ПЛАТФОРМА",
      title: "Добро пожаловать в Medax",
      subtitle: "Для доступа к каталогу оборудования, ценам и заказам войдите в систему или зарегистрируйтесь.",
      tab_login: "Вход по паролю",
      tab_reg: "Регистрация",
      trust_1: "Официальная гарантия завода",
      trust_2: "Прямые импортные цены",
      trust_3: "Сервисная служба инженеров",
    },
    en: {
      badge: "B2B MEDICAL PLATFORM",
      title: "Welcome to Medax",
      subtitle: "Please log in or register to browse equipment catalog, view prices and make orders.",
      tab_login: "Password Login",
      tab_reg: "Register",
      trust_1: "Official Factory Warranty",
      trust_2: "Direct Import Prices",
      trust_3: "Engineering & Maintenance",
    },
  }[lang] || {
    badge: "B2B TIBBIYOT PLATFORMASI",
    title: "Medax portaliga xush kelibsiz",
    subtitle: "Katalog, narxlar va buyurtmalarni ko'rish uchun avval tizimga kiring yoki ro'yxatdan o'ting.",
    tab_login: "Parol bilan kirish",
    tab_reg: "Ro'yxatdan o'tish",
    trust_1: "Rasmiy zavod kafolati",
    trust_2: "To'g'ridan-to'g'ri import narxlari",
    trust_3: "Muhandislik va servis xizmati",
  };

  return (
    <div className="auth-gate-wrapper">
      {/* Yuqori o'ng burchakda til va mavzu almashtirgich */}
      <div className="auth-gate-topbar">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="auth-gate-container">
        {/* Chap yoki yuqori brend kartasi */}
        <div className="auth-gate-hero">
          <div className="auth-gate-brand">
            <MedaxLogo size="lg" />
          </div>

          <span className="auth-gate-badge">{txt.badge}</span>
          <h1 className="auth-gate-title">{txt.title}</h1>
          <p className="auth-gate-sub">{txt.subtitle}</p>

          <div className="auth-gate-trust">
            <div className="trust-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{txt.trust_1}</span>
            </div>
            <div className="trust-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>{txt.trust_2}</span>
            </div>
            <div className="trust-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              <span>{txt.trust_3}</span>
            </div>
          </div>
        </div>

        {/* Kirish / Ro'yxatdan o'tish formasi kartasi */}
        <div className="auth-gate-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{txt.tab_login}</span>
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>{txt.tab_reg}</span>
            </button>
          </div>

          {error && <div className="err auth-alert">{error}</div>}

          {/* ======================================================== */}
          {/* 1. PAROL ORQALI TEZKOR KIRISH                           */}
          {/* ======================================================== */}
          {mode === "login" && (
            <form onSubmit={handlePasswordLogin}>
              <div className="field">
                <label htmlFor="gate-phone">Telefon raqamingiz</label>
                <input
                  id="gate-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="gate-pwd">Parolingiz</label>
                  <button
                    type="button"
                    className="link-btn"
                    style={{ fontSize: 12.5 }}
                    onClick={() => switchMode("forgot_sms")}
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="pwd-input-wrap">
                  <input
                    id="gate-pwd"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolingizni kiriting"
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? "Kirilmoqda…" : "Kabinetga kirish →"}
              </button>

              <div className="auth-alt-actions">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("forgot_sms")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>SMS kod orqali kirish</span>
                </button>
                <span className="alt-sep">•</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("register")}
                >
                  Yangi akkaunt ochish →
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. RO'YXATDAN O'TISH (SMS + Yangi Parol)                 */}
          {/* ======================================================== */}
          {mode === "register" && !otpSent && (
            <form onSubmit={handleSendOtp}>
              <div className="field">
                <label htmlFor="gate-reg-phone">Telefon raqamingiz</label>
                <input
                  id="gate-reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  required
                  autoFocus
                />
                <small className="field-hint">
                  Ushbu raqamga bir martalik 6 xonali tasdiqlash kodi yuboriladi
                </small>
              </div>

              <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} onExpire={() => setCaptchaToken("")} />

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? "Yuborilmoqda…" : "SMS kodni olish →"}
              </button>

              <div className="auth-alt-actions" style={{ justifyContent: "center" }}>
                <span>Allaqachon akkauntingiz bormi?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("login")}
                >
                  Kirish →
                </button>
              </div>
            </form>
          )}

          {mode === "register" && otpSent && (
            <form onSubmit={handleRegister}>
              {devCode && (
                <div className="ok dev-code-badge">
                  <span>Sinov kodi (Dev):</span> <b>{devCode}</b>
                </div>
              )}

              <div className="field">
                <div className="otp-sent-info">
                  <span>SMS kod: <b>{phone}</b></span>
                  <button type="button" className="link-btn" onClick={resetFields}>
                    Raqamni o'zgartirish
                  </button>
                </div>
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6 xonali kod"
                  className="otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="formgrid">
                <div className="field">
                  <label htmlFor="gate-p-name">Ism-familiyangiz</label>
                  <input
                    id="gate-p-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Dr. Sardor"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="gate-p-org">Klinika / Tashkilot (ixtiyoriy)</label>
                  <input
                    id="gate-p-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Klinika yoki MCHJ"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="gate-p-pwd">Yangi parol belgilang</label>
                <div className="pwd-input-wrap">
                  <input
                    id="gate-p-pwd"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="gate-p-pwd-conf">Parolni qayta tering</label>
                <input
                  id="gate-p-pwd-conf"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Parolni tasdiqlang"
                  required
                />
              </div>

              <button
                className="btn btn-primary-sheen w-full"
                type="submit"
                disabled={loading || otpCode.length < 6 || password.length < 6}
              >
                {loading ? "Yaratilmoqda…" : "Akkauntni yaratish va Kirish ✓"}
              </button>

              <div className="resend-wrap">
                {countdown > 0 ? (
                  <span className="muted">Qayta yuborish: {countdown}s</span>
                ) : (
                  <button type="button" className="link-btn" onClick={() => handleSendOtp()} disabled={loading}>
                    Yangi kod yuborish
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. SMS ORQALI KIRISH / PAROLNI TIKLASH                  */}
          {/* ======================================================== */}
          {mode === "forgot_sms" && !otpSent && (
            <form onSubmit={handleSendOtp}>
              <div className="field">
                <label htmlFor="gate-sms-phone">Telefon raqamingiz</label>
                <input
                  id="gate-sms-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  required
                  autoFocus
                />
                <small className="field-hint">
                  Kodni qabul qilib, parolsiz kirishingiz yoki yangi parol o'rnatishingiz mumkin
                </small>
              </div>

              <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} onExpire={() => setCaptchaToken("")} />

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? "Yuborilmoqda…" : "SMS kodni olish →"}
              </button>

              <div className="auth-alt-actions" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("login")}
                >
                  ← Parol orqali kirishga qaytish
                </button>
              </div>
            </form>
          )}

          {mode === "forgot_sms" && otpSent && (
            <form onSubmit={handleSmsLogin}>
              {devCode && (
                <div className="ok dev-code-badge">
                  <span>Sinov kodi (Dev):</span> <b>{devCode}</b>
                </div>
              )}

              <div className="field">
                <div className="otp-sent-info">
                  <span>Kodni kiriting: <b>{phone}</b></span>
                  <button type="button" className="link-btn" onClick={resetFields}>
                    Raqamni o'zgartirish
                  </button>
                </div>
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6 xonali kod"
                  className="otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="gate-sms-new-pwd">Yangi parol (ixtiyoriy)</label>
                <div className="pwd-input-wrap">
                  <input
                    id="gate-sms-new-pwd"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolni yangilamoqchi bo'lsangiz yozing"
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary-sheen w-full"
                type="submit"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? "Kirilmoqda…" : "Kabinetga kirish ✓"}
              </button>

              <div className="resend-wrap">
                {countdown > 0 ? (
                  <span className="muted">Qayta yuborish: {countdown}s</span>
                ) : (
                  <button type="button" className="link-btn" onClick={() => handleSendOtp()} disabled={loading}>
                    Yangi kod yuborish
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            type="button"
            className="link-btn"
            style={{ fontSize: 13, opacity: 0.88 }}
            onClick={() => {
              if (onShowOnboarding) {
                onShowOnboarding();
              } else {
                localStorage.removeItem("medax_onboarding_completed");
                sessionStorage.removeItem("medax_onboard_step");
                window.location.reload();
              }
            }}
          >
            ✦ Medax ilova tanishtiruvini qayta ko'rish (Onboarding) →
          </button>
        </div>
      </div>
    </div>
  );
}
