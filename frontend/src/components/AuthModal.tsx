import { useEffect, useState } from "react";
import { useCustomerAuth, TelegramSessionResponse } from "../customerAuth";
import { MedaxLogo } from "./MedaxLogo";
import { useI18n } from "../context/I18nContext";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    startTelegramSession,
    pollTelegramSession,
  } = useCustomerAuth();
  const { t, lang } = useI18n();

  const [tgSession, setTgSession] = useState<TelegramSessionResponse | null>(null);
  const [tgWaiting, setTgWaiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: any;
    if (tgWaiting && tgSession) {
      timer = setInterval(async () => {
        try {
          const res = await pollTelegramSession(tgSession.sessionId);
          if (res.status === "confirmed") {
            setTgWaiting(false);
            setTgSession(null);
          }
        } catch {}
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [tgWaiting, tgSession, pollTelegramSession]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setTgWaiting(false);
    setTgSession(null);
    setError("");
    closeAuthModal();
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
      setError(err.message || "Telegram sessiyasini ochishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Yopish tugmasi */}
        <button className="modal-close-btn" onClick={handleClose} aria-label={t("auth_modal_close")}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="auth-header">
          <MedaxLogo size="sm" />
          <h2>
            {lang === "ru"
              ? "Вход в личный кабинет"
              : lang === "en"
              ? "Sign In to Account"
              : "Shaxsiy kabinetga kirish"}
          </h2>
          <p className="auth-sub">
            {lang === "ru"
              ? "Быстрый и безопасный вход через Telegram в 1 клик"
              : lang === "en"
              ? "Fast and secure sign in via Telegram in 1 click"
              : "Telegram orqali 1 soniyada xavfsiz va bepul kiring"}
          </p>
        </div>

        {error && <div className="err auth-alert">{error}</div>}

        <div className="auth-body">
          {!tgWaiting ? (
            <div>
              {/* Katta ko'k Telegram tugmasi */}
              <button
                type="button"
                className="btn-telegram-primary"
                onClick={handleTelegramLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 14,
                  padding: "16px 20px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 6px 20px rgba(34, 158, 217, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span>
                  {loading
                    ? (lang === "ru" ? "Загрузка..." : "Yuklanmoqda...")
                    : (lang === "ru"
                    ? "Войти через Telegram"
                    : lang === "en"
                    ? "Sign in with Telegram"
                    : "Telegram orqali 1-klikda kirish")}
                </span>
              </button>

              {/* Afzalliklari ro'yxati */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background: "var(--paper, rgba(0,0,0,0.02))",
                  border: "1px solid var(--line, rgba(0,0,0,0.06))",
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 13,
                  color: "var(--ink2, #64748b)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 16 }}>✓</span>
                  <span>
                    {lang === "ru"
                      ? "Без ожидания SMS и без паролей"
                      : "SMS kod kutmasdan va parolsiz 1 soniyada"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 16 }}>✓</span>
                  <span>
                    {lang === "ru"
                      ? "Безопасное подтверждение вашего номера"
                      : "Telefon raqamingiz xavfsiz tasdiqlanadi"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 16 }}>✓</span>
                  <span>
                    {lang === "ru"
                      ? "100% бесплатно и доступно для всех"
                      : "100% bepul va har doim ochiq"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Bot ochilganda kutish oynasi */
            <div
              style={{
                textAlign: "center",
                padding: "20px 10px 10px",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(34, 158, 217, 0.12)",
                  color: "#229ED9",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                  animation: "pulse 1.8s infinite",
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </div>

              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ink, #0f172a)" }}>
                {lang === "ru" ? "Telegram бот открыт!" : "Telegram bot ochildi!"}
              </h3>
              <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--ink2, #64748b)", lineHeight: 1.45 }}>
                {lang === "ru" ? (
                  <>
                    В открывшемся боте нажмите кнопку <br />
                    <b>«📱 Отправить номер телефона»</b>.
                  </>
                ) : (
                  <>
                    Ochilgan botda pastdagi <br />
                    <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing.
                  </>
                )}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tgSession?.startUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(tgSession.startUrl, "_blank")}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(34, 158, 217, 0.1)",
                      color: "#229ED9",
                      border: "1px solid rgba(34, 158, 217, 0.3)",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 13.5,
                      cursor: "pointer",
                    }}
                  >
                    ↗️ {lang === "ru" ? "Открыть бот повторно" : "Botni qayta ochish"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTgWaiting(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink2, #94a3b8)",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px",
                  }}
                >
                  {lang === "ru" ? "← Отмена" : "← Bekor qilish"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="auth-footer-note" style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: "var(--ink2, #94a3b8)" }}>
          {lang === "ru"
            ? "Безопасный доступ к Medax без SMS и паролей"
            : "Medax tibbiyot uskunalari markaziga xavfsiz kirish"}
        </div>
      </div>
    </div>
  );
}
