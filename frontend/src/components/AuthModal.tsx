import { FormEvent, useEffect, useState } from "react";
import { useCustomerAuth, TelegramSessionResponse } from "../customerAuth";
import { MedaxLogo } from "./MedaxLogo";
import { TurnstileWidget } from "./TurnstileWidget";
import { useI18n } from "../context/I18nContext";

type AuthMode = "password_login" | "register" | "sms_login";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    startTelegramSession,
    pollTelegramSession,
  } = useCustomerAuth();
  const { t, lang } = useI18n();

  // Mode: "password_login" (default) | "register" | "sms_login"
  const [mode, setMode] = useState<AuthMode>("password_login");

  // Telegram Login
  const [tgSession, setTgSession] = useState<TelegramSessionResponse | null>(null);
  const [tgWaiting, setTgWaiting] = useState(false);

  // Phone & SMS
  const [phone, setPhone] = useState("+998 ");
  const [captchaToken, setCaptchaToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

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

  useEffect(() => {
    let timer: any;
    if (tgWaiting && tgSession) {
      timer = setInterval(async () => {
        try {
          const res = await pollTelegramSession(tgSession.sessionId);
          if (res.status === "confirmed") {
            setTgWaiting(false);
          }
        } catch {}
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [tgWaiting, tgSession]);

  if (!isAuthModalOpen) return null;

  const resetFields = () => {
    setOtpSent(false);
    setOtpCode("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setTgWaiting(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetFields();
  };

  const handleTelegramLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const sess = await startTelegramSession();
      setTgSession(sess);
      setTgWaiting(true);
      window.open(sess.startUrl, "_blank");
    } catch (err: any) {
      setError(err.message || "Telegram sessiyasini ochishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 1. Parol orqali tezkor kirish (Login via Phone + Password)
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError(
        lang === "ru"
          ? "Пожалуйста, введите ваш пароль."
          : lang === "en"
          ? "Please enter your password."
          : "Iltimos, parolingizni kiriting."
      );
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(phone, password);
    } catch (err: any) {
      setError(
        err.message ||
          (lang === "ru"
            ? "Ошибка при входе"
            : lang === "en"
            ? "Sign in error"
            : "Kirishda xatolik yuz berdi")
      );
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
      setOtpCode("");
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
      setError(
        err.message ||
          (lang === "ru"
            ? "Ошибка при отправке SMS"
            : lang === "en"
            ? "Error sending SMS code"
            : "SMS kod yuborishda xatolik")
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Ro'yxatdan o'tish (SMS tasdiqlash + Parol o'rnatish)
  const handleRegisterWithOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(
        lang === "ru"
          ? "Пароль должен содержать минимум 6 символов."
          : lang === "en"
          ? "Password must be at least 6 characters."
          : "Parol kamida 6 ta belgidan iborat bo'lishi kerak."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(
        lang === "ru"
          ? "Пароли не совпадают."
          : lang === "en"
          ? "Passwords do not match."
          : "Parollar bir-biriga mos kelmadi."
      );
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
      setError(
        err.message ||
          (lang === "ru"
            ? "Неверный код"
            : lang === "en"
            ? "Invalid code"
            : "Kod noto'g'ri")
      );
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
      setError(
        err.message ||
          (lang === "ru"
            ? "Неверный код"
            : lang === "en"
            ? "Invalid code"
            : "Kod noto'g'ri")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Yopish tugmasi */}
        <button className="modal-close-btn" onClick={closeAuthModal} aria-label={t("auth_modal_close")}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <MedaxLogo size="sm" />
          <h2>
            {mode === "password_login" && t("auth_login_title")}
            {mode === "register" && t("auth_register_title")}
            {mode === "sms_login" && t("auth_sms_title")}
          </h2>
          <p className="auth-sub">
            {mode === "password_login" && t("auth_login_sub")}
            {mode === "register" && t("auth_register_sub")}
            {mode === "sms_login" && t("auth_sms_sub")}
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
            <span>{t("auth_tab_pwd")}</span>
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
            <span>{t("auth_tab_reg")}</span>
          </button>
        </div>

        {error && <div className="err auth-alert">{error}</div>}

        <div className="auth-body">
          {/* Telegram orqali 1-klikda kirish */}
          <button
            type="button"
            className="telegram-auth-btn"
            onClick={handleTelegramLogin}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(34, 158, 217, 0.25)",
              marginBottom: 14,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span>Telegram orqali 1-klikda kirish</span>
          </button>

          {tgWaiting && tgSession && (
            <div
              style={{
                background: "rgba(34, 158, 217, 0.08)",
                border: "1px solid rgba(34, 158, 217, 0.3)",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 600, color: "#229ED9", marginBottom: 4, fontSize: 14 }}>
                ⏳ Telegram botda tasdiqlang...
              </div>
              <p style={{ fontSize: 13, color: "var(--muted, #64748b)", margin: "0 0 8px 0" }}>
                Telegram botda <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing.
              </p>
              <a
                href={tgSession.startUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12.5, color: "#229ED9", fontWeight: 500, textDecoration: "underline" }}
              >
                Bot ochilmadimi? Bu yerni bosing →
              </a>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "8px 0 16px 0",
              color: "var(--muted, #94a3b8)",
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border, #e2e8f0)" }}></div>
            <span style={{ padding: "0 10px" }}>yoki telefon orqali</span>
            <div style={{ flex: 1, height: 1, background: "var(--border, #e2e8f0)" }}></div>
          </div>

          {/* ======================================================== */}
          {/* 1. PAROL ORQALI TEZKOR KIRISH                           */}
          {/* ======================================================== */}
          {mode === "password_login" && (
            <form onSubmit={handlePasswordLogin}>
              <div className="field">
                <label htmlFor="auth-login-phone">{t("auth_phone_label")}</label>
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
                  <label htmlFor="auth-login-pwd">{t("auth_pwd_label")}</label>
                  <button
                    type="button"
                    className="link-btn"
                    style={{ fontSize: 12.5 }}
                    onClick={() => switchMode("sms_login")}
                  >
                    {t("auth_forgot_pwd")}
                  </button>
                </div>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-login-pwd"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth_pwd_ph")}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    title={showPassword ? "Hide" : "Show"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? t("auth_btn_logging") : t("auth_btn_login")}
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
                  <span>{t("auth_sms_login_btn")}</span>
                </button>
                <span className="alt-sep">•</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("register")}
                >
                  {t("auth_open_reg")}
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
                <label htmlFor="auth-reg-phone">{t("auth_phone_label")}</label>
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
                  {t("auth_reg_hint")}
                </small>
              </div>

              <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} onExpire={() => setCaptchaToken("")} />

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? t("auth_btn_sending") : t("auth_btn_get_sms")}
              </button>

              <div className="auth-alt-actions" style={{ justifyContent: "center" }}>
                <span>{t("auth_has_account")}</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("password_login")}
                >
                  {t("btn_login")} →
                </button>
              </div>
            </form>
          )}

          {mode === "register" && otpSent && (
            <form onSubmit={handleRegisterWithOtp}>
              <div className="field">
                <div className="otp-sent-info">
                  <span>{t("auth_enter_code")} <b>{phone}</b></span>
                  <button type="button" className="link-btn" onClick={resetFields}>
                    {t("auth_change_phone")}
                  </button>
                </div>
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={t("auth_otp_ph")}
                  className="otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="formgrid">
                <div className="field">
                  <label htmlFor="auth-p-name">{t("auth_name_label")}</label>
                  <input
                    id="auth-p-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth_name_ph")}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="auth-p-org">{t("auth_org_label")}</label>
                  <input
                    id="auth-p-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={t("auth_org_ph")}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="auth-reg-pwd">{t("auth_new_pwd")}</label>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-reg-pwd"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth_min_chars")}
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
                  {t("auth_pwd_hint")}
                </small>
              </div>

              <div className="field">
                <label htmlFor="auth-reg-pwd-conf">{t("auth_confirm_pwd")}</label>
                <input
                  id="auth-reg-pwd-conf"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth_confirm_pwd_ph")}
                  required
                />
              </div>

              <button
                className="btn btn-primary-sheen w-full"
                type="submit"
                disabled={loading || otpCode.length < 6 || password.length < 6}
              >
                {loading ? t("auth_btn_sending") : t("auth_btn_create")}
              </button>

              <div className="resend-wrap">
                {countdown > 0 ? (
                  <span className="muted">{t("auth_resend")} {countdown}s</span>
                ) : (
                  <button type="button" className="link-btn" onClick={() => handleSendOtp()} disabled={loading}>
                    {t("auth_resend_btn")}
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
                <label htmlFor="auth-sms-phone">{t("auth_phone_label")}</label>
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
                  {t("auth_reg_hint")}
                </small>
              </div>

              <TurnstileWidget onVerify={(t) => setCaptchaToken(t)} onExpire={() => setCaptchaToken("")} />

              <button className="btn btn-primary-sheen w-full" type="submit" disabled={loading}>
                {loading ? t("auth_btn_sending") : t("auth_btn_get_sms")}
              </button>

              <div className="auth-alt-actions" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("password_login")}
                >
                  {t("auth_back_to_pwd")}
                </button>
              </div>
            </form>
          )}

          {mode === "sms_login" && otpSent && (
            <form onSubmit={handleSmsOnlyLogin}>
              <div className="field">
                <div className="otp-sent-info">
                  <span>{t("auth_enter_code")} <b>{phone}</b></span>
                  <button type="button" className="link-btn" onClick={resetFields}>
                    {t("auth_change_phone")}
                  </button>
                </div>
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={t("auth_otp_ph")}
                  className="otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="auth-new-pwd-optional">{t("auth_new_pwd_opt")}</label>
                <div className="pwd-input-wrap">
                  <input
                    id="auth-new-pwd-optional"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth_new_pwd_opt_ph")}
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
                  {t("auth_new_pwd_opt_hint")}
                </small>
              </div>

              <button
                className="btn btn-primary-sheen w-full"
                type="submit"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? t("auth_btn_logging") : t("auth_btn_login")}
              </button>

              <div className="resend-wrap">
                {countdown > 0 ? (
                  <span className="muted">{t("auth_resend")} {countdown}s</span>
                ) : (
                  <button type="button" className="link-btn" onClick={() => handleSendOtp()} disabled={loading}>
                    {t("auth_resend_btn")}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="auth-footer-note">
          {t("auth_terms_note")}
        </div>
      </div>
    </div>
  );
}
