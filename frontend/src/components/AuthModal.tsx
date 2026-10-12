import { FormEvent, useState } from "react";
import { useCustomerAuth } from "../customerAuth";
import { MedaxLogo } from "./MedaxLogo";
import { TurnstileWidget } from "./TurnstileWidget";

type AuthMode = "password_login" | "register" | "sms_login";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, sendOtp, verifyOtp, loginWithPassword } = useCustomerAuth();

  // Mode: "password_login" (default) | "register" | "sms_login"
  const [mode, setMode] = useState<AuthMode>("password_login");

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

  if (!isAuthModalOpen) return null;

  const resetFields = () => {
    setOtpSent(false);
    setOtpCode("");
    setDevCode(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetFields();
  };

  // 1. Parol orqali tezkor kirish (Login via Phone + Password)
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

  // 2. SMS kod yuborish (Ro'yxatdan o'tish yoki SMS orqali kirish uchun)
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

  // 3. Ro'yxatdan o'tish (SMS tasdiqlash + Parol o'rnatish)
  const handleRegisterWithOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar bir-biriga mos kelmadi.");
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

  // 4. SMS orqali kirish (Parol unutganda yoki SMS bilan kirishda)
  const handleSmsOnlyLogin = async (e: FormEvent) => {
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

  return (
    <div className="modal-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Yopish tugmasi */}
        <button className="modal-close-btn" onClick={closeAuthModal} aria-label="Yopish">
          ✕
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <MedaxLogo size="sm" />
          <h2>
            {mode === "password_login" && "Shaxsiy kabinetga kirish"}
            {mode === "register" && "Yangi akkaunt ochish"}
            {mode === "sms_login" && "SMS orqali kirish"}
          </h2>
          <p className="auth-sub">
            {mode === "password_login" && "Telefon raqamingiz va parolingiz orqali 1 soniyada kiring"}
            {mode === "register" && "Telefon raqamni SMS bilan tasdiqlab, kirish uchun parol belgilang"}
            {mode === "sms_login" && "Telefon raqamingizga kelgan 6 xonali kod orqali kiring"}
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "password_login" ? "active" : ""}`}
            onClick={() => switchMode("password_login")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Parol bilan kirish</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span>Ro'yxatdan o'tish</span>
          </button>
        </div>

        {error && <div className="err auth-alert">{error}</div>}

        <div className="auth-body">
          {/* ======================================================== */}
          {/* 1. PAROL ORQALI TEZKOR KIRISH                           */}
          {/* ======================================================== */}
          {mode === "password_login" && (
            <form onSubmit={handlePasswordLogin}>
              <div className="field">
                <label htmlFor="auth-login-phone">Telefon raqamingiz</label>
                <input
                  id="auth-login-phone"
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
                  <label htmlFor="auth-login-pwd">Parolingiz</label>
                  <button
                    type="button"
                    className="link-btn"
                    style={{ fontSize: 12.5 }}
                    onClick={() => switchMode("sms_login")}
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-login-pwd"
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
                  onClick={() => switchMode("sms_login")}
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
                <label htmlFor="auth-reg-phone">Telefon raqamingiz</label>
                <input
                  id="auth-reg-phone"
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
                  onClick={() => switchMode("password_login")}
                >
                  Kirish →
                </button>
              </div>
            </form>
          )}

          {mode === "register" && otpSent && (
            <form onSubmit={handleRegisterWithOtp}>
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
                  placeholder="6 xonali kod (masalan: 123456)"
                  className="otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="formgrid">
                <div className="field">
                  <label htmlFor="auth-p-name">Ism-familiyangiz</label>
                  <input
                    id="auth-p-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Dr. Sardor"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="auth-p-org">Klinika / Tashkilot (ixtiyoriy)</label>
                  <input
                    id="auth-p-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Klinika yoki MCHJ"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="auth-reg-pwd">Yangi parol belgilang</label>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-reg-pwd"
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
                <small className="field-hint">
                  Keyingi safar tizimga kirish uchun ushbu paroldan foydalanasiz
                </small>
              </div>

              <div className="field">
                <label htmlFor="auth-reg-pwd-conf">Parolni qayta tering</label>
                <input
                  id="auth-reg-pwd-conf"
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
          {mode === "sms_login" && !otpSent && (
            <form onSubmit={handleSendOtp}>
              <div className="field">
                <label htmlFor="auth-sms-phone">Telefon raqamingiz</label>
                <input
                  id="auth-sms-phone"
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
                  onClick={() => switchMode("password_login")}
                >
                  ← Parol orqali kirishga qaytish
                </button>
              </div>
            </form>
          )}

          {mode === "sms_login" && otpSent && (
            <form onSubmit={handleSmsOnlyLogin}>
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
                <label htmlFor="auth-new-pwd-optional">Yangi parol (ixtiyoriy)</label>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-new-pwd-optional"
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
                <small className="field-hint">
                  Agar parol kiritsangiz, kelgusida parol orqali kirishingiz mumkin bo'ladi
                </small>
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

        <div className="auth-footer-note">
          Tizimga kirish orqali siz Medax xizmat ko'rsatish shartlariga rozilik bildirasiz.
        </div>
      </div>
    </div>
  );
}
