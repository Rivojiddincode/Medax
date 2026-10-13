import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCustomerAuth } from "../customerAuth";
import { DeviceIcon } from "../components/Shell";
import { ClinicIcon, PhoneSmsIcon, OrderBoxIcon, SettingsIcon } from "../components/Icons";
import { useI18n, Lang } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  product?: {
    id: number;
    name: string;
    slug: string;
    images?: Array<{ thumbUrl: string }>;
  };
}

interface CustomerOrder {
  id: number;
  code: string;
  status: "NEW" | "CONFIRMED" | "DONE" | "CANCELED";
  createdAt: string;
  customerName: string;
  phone: string;
  organization?: string;
  comment?: string;
  cancelReason?: string;
  items: OrderItem[];
}

export default function CustomerAccount() {
  const { customer, token, updateProfile, changePassword, logout, openAuthModal, refreshCustomer } = useCustomerAuth();
  const { lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [tab, setTab] = useState<"orders" | "profile">(
    tabParam === "profile" ? "profile" : "orders"
  );
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (tabParam === "profile") setTab("profile");
    else if (tabParam === "orders") setTab("orders");
  }, [tabParam]);

  const switchTab = (newTab: "orders" | "profile") => {
    setTab(newTab);
    setSearchParams(newTab === "orders" ? {} : { tab: newTab });
  };

  // Profile edit states
  const [name, setName] = useState(customer?.name || "");
  const [org, setOrg] = useState(customer?.organization || "");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password change states
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  // Customer order cancellation state
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setOrg(customer.organization || "");
    }
  }, [customer]);

  const loadOrders = () => {
    if (!token) return;
    setLoadingOrders(true);
    fetch("/api/customer/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Yuklab bo'lmadi");
        return res.json();
      })
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: number) => {
    if (!cancelReasonText.trim()) {
      alert("Iltimos, bekor qilish sababini yozing.");
      return;
    }
    setCancelBusy(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReasonText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      setCancelingOrderId(null);
      setCancelReasonText("");
      loadOrders();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCancelBusy(false);
    }
  };



  if (!customer && !token) {
    return (
      <main className="wrap account-login-prompt">
        <div className="prompt-card">
          <h2>Shaxsiy kabinetga xush kelibsiz</h2>
          <p className="muted">
            Buyurtmalaringiz tarixini ko'rish va ma'lumotlaringizni boshqarish uchun tizimga kiring.
          </p>
          <button className="btn btn-primary-sheen" onClick={() => openAuthModal()}>
            Kirish yoki Ro'yxatdan o'tish →
          </button>
        </div>
      </main>
    );
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        organization: org.trim() || undefined,
      });
      setProfileMsg("Ma'lumotlar muvaffaqiyatli saqlandi ✓");
    } catch (err: any) {
      setProfileErr(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");
    if (newPassword.length < 6) {
      setPwdErr("Yangi parol kamida 6 belgidan iborat bo'lishi kerak.");
      return;
    }
    if (newPassword !== confPassword) {
      setPwdErr("Yangi parollar bir-biriga mos kelmadi.");
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({
        currentPassword: currPassword ? currPassword : undefined,
        newPassword,
      });
      setPwdMsg("Parol muvaffaqiyatli saqlandi ✓");
      setCurrPassword("");
      setNewPassword("");
      setConfPassword("");
    } catch (err: any) {
      setPwdErr(err.message || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setPwdSaving(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "NEW":
        return <span className="st NEW">Yangi buyurtma (Kutilmoqda)</span>;
      case "CONFIRMED":
        return <span className="st CONFIRMED">Tasdiqlangan / Tayyorlanmoqda</span>;
      case "DONE":
        return <span className="st DONE">Yetkazib berildi ✓</span>;
      case "CANCELED":
        return <span className="st CANCELED">Bekor qilingan</span>;
      default:
        return <span className="st">{st}</span>;
    }
  };

  return (
    <main className="wrap account-page">
      <div className="account-hero-bar">
        <div className="account-user-info">
          <div className="account-avatar">
            {customer?.avatar ? (
              <img src={customer.avatar} alt="" />
            ) : (
              <span>{customer?.name?.charAt(0) || "M"}</span>
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1>{customer?.name}</h1>
            </div>
            <div className="account-meta">
              {customer?.organization && (
                <span className="meta-item">
                  <ClinicIcon size={15} />
                  <span>{customer.organization}</span>
                </span>
              )}
              {customer?.phone && (
                <span className="meta-item">
                  <PhoneSmsIcon size={15} />
                  <span>{customer.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="account-logout-btn"
          onClick={() => {
            if (window.confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?")) {
              logout();
              nav("/");
            }
          }}
          title="Hisobdan chiqish"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Hisobdan chiqish</span>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="account-tabs">
        <button
          className={`tab-btn ${tab === "orders" ? "active" : ""}`}
          onClick={() => switchTab("orders")}
        >
          <OrderBoxIcon size={18} />
          <span>Buyurtmalarim ({orders.length})</span>
        </button>

        <button
          className={`tab-btn ${tab === "profile" ? "active" : ""}`}
          onClick={() => switchTab("profile")}
        >
          <SettingsIcon size={18} />
          <span>Profil sozlamalari</span>
        </button>
      </div>

      {/* 1. ORDERS TAB */}
      {tab === "orders" && (
        <section className="account-orders-section">
          {loadingOrders ? (
            <p className="muted" style={{ padding: 40, textAlign: "center" }}>
              Buyurtmalar yuklanmoqda…
            </p>
          ) : orders.length === 0 ? (
            <div className="empty-orders-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <h3>Hozircha buyurtmalaringiz yo'q</h3>
              <p className="muted">Katalogdan kerakli uskunalarni tanlab buyurtma ro'yxatiga qo'shing.</p>
              <Link to="/catalog" className="btn btn-primary-sheen">
                Katalogga o'tish →
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((o) => (
                <article key={o.id} className="customer-order-card">
                  <div className="order-card-header">
                    <div className="order-code-group">
                      <span className="order-code">Buyurtma: <b>{o.code}</b></span>
                      <span className="order-date">
                        {new Date(o.createdAt).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(o.status)}</div>
                  </div>

                  <div className="order-items-grid">
                    {o.items.map((item) => {
                      const img = item.product?.images?.[0];
                      return (
                        <div key={item.id} className="order-item-row">
                          <div className="order-item-thumb">
                            {img ? (
                              <img src={img.thumbUrl} alt="" />
                            ) : (
                              <DeviceIcon />
                            )}
                          </div>
                          <div className="order-item-desc">
                            <b>{item.productName}</b>
                            <span className="muted">Miqdori: {item.quantity} dona</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {o.comment && (
                    <div className="order-card-comment">
                      <span className="muted">Ma'lumot:</span> {o.comment}
                    </div>
                  )}

                  {/* Bekor qilingan bo'lsa sababini ko'rsatish */}
                  {o.status === "CANCELED" && (
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 10 }}>
                      <strong style={{ color: "#ef4444", display: "block", fontSize: 13, marginBottom: 3 }}>
                        ❌ Buyurtma bekor qilingan
                      </strong>
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>
                        <b>Sababi:</b> {o.cancelReason || "Menejer tomonidan ko'rib chiqilib bekor qilindi"}
                      </span>
                    </div>
                  )}

                  {/* Yangi bo'lsa, mijoz o'zi bekor qila olishi */}
                  {o.status === "NEW" && (
                    <div style={{ marginTop: 12, borderTop: "1px dashed var(--line)", paddingTop: 10 }}>
                      {cancelingOrderId === o.id ? (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px", marginTop: 6 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#be123c" }}>
                            Bekor qilish sababini yozing:
                          </span>
                          <input
                            type="text"
                            value={cancelReasonText}
                            onChange={(e) => setCancelReasonText(e.target.value)}
                            placeholder="Masalan: Boshqa modelni tanlamoqchiman..."
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 8 }}
                            autoFocus
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="btn sm danger"
                              disabled={cancelBusy}
                              onClick={() => handleCancelOrder(o.id)}
                            >
                              Bekor qilishni tasdiqlash
                            </button>
                            <button
                              type="button"
                              className="btn sm ghost"
                              disabled={cancelBusy}
                              onClick={() => {
                                setCancelingOrderId(null);
                                setCancelReasonText("");
                              }}
                            >
                              Orqaga
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn ghost sm"
                          style={{ color: "var(--ink2)", fontSize: 12 }}
                          onClick={() => {
                            setCancelingOrderId(o.id);
                            setCancelReasonText("");
                          }}
                        >
                          Buyurtmani bekor qilish
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}


      {/* 3. PROFILE TAB */}
      {tab === "profile" && (
        <section className="account-profile-section">
          <div className="profile-edit-card">
            <h3>Klinika va shaxsiy ma'lumotlar</h3>
            <p className="muted">
              Ushbu ma'lumotlar hisob-fakturalar va kafolat hujjatlarida avtomatik aks etadi.
            </p>

            {profileMsg && <div className="ok">{profileMsg}</div>}
            {profileErr && <div className="err">{profileErr}</div>}

            <form onSubmit={handleSaveProfile}>
              <div className="field">
                <label htmlFor="p-name">Ism-familiyangiz</label>
                <input
                  id="p-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="p-org">Klinika / Tashkilot nomi</label>
                <input
                  id="p-org"
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="Masalan: Shifo Medikal Servis MCHJ"
                />
              </div>

              <div className="field">
                <label htmlFor="p-phone">Telefon raqam (SMS bilan tasdiqlangan)</label>
                <input
                  id="p-phone"
                  type="tel"
                  value={customer?.phone || ""}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
                <small className="field-hint">Telefon raqam hisobingizning asosiy xavfsiz kalitidir.</small>
              </div>

              <button className="btn btn-primary-sheen" type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda…" : "O'zgarishlarni saqlash ✓"}
              </button>
            </form>
          </div>

          <div className="profile-edit-card" style={{ marginTop: 20 }}>
            <h3>Kirish parolini o'rnatish / yangilash</h3>
            <p className="muted">
              Ushbu parol orqali SMS kutmasdan telefon raqam va parol yordamida tezkor kira olasiz.
            </p>

            {pwdMsg && <div className="ok">{pwdMsg}</div>}
            {pwdErr && <div className="err">{pwdErr}</div>}

            <form onSubmit={handleChangePassword}>
              {customer?.hasPassword && (
                <div className="field">
                  <label htmlFor="p-curr-pwd">Joriy parolingiz</label>
                  <input
                    id="p-curr-pwd"
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    placeholder="Amaldagi parolingiz"
                    required
                  />
                </div>
              )}

              <div className="formgrid">
                <div className="field">
                  <label htmlFor="p-new-pwd">Yangi parol</label>
                  <input
                    id="p-new-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="p-conf-pwd">Yangi parolni tasdiqlang</label>
                  <input
                    id="p-conf-pwd"
                    type="password"
                    value={confPassword}
                    onChange={(e) => setConfPassword(e.target.value)}
                    placeholder="Parolni qayta tering"
                    required
                  />
                </div>
              </div>

              <button className="btn btn-primary-sheen" type="submit" disabled={pwdSaving}>
                {pwdSaving ? "Saqlanmoqda…" : "Parolni saqlash ✓"}
              </button>
            </form>
          </div>

          {/* 3. ILOVA SOZLAMALARI (TIL VA MAVZU) */}
          <div className="profile-edit-card" style={{ marginTop: 20 }}>
            <h3>Ilova sozlamalari</h3>
            <p className="muted">
              Interfeys tili va dizayn mavzusini o'zingizga moslashtiring.
            </p>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
                Interfeys tili:
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { code: "uz" as Lang, label: "O'zbekcha 🇺🇿" },
                  { code: "ru" as Lang, label: "Русский 🇷🇺" },
                  { code: "en" as Lang, label: "English 🇬🇧" },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`btn sm ${lang === item.code ? "btn-primary-sheen" : "ghost"}`}
                    onClick={() => setLang(item.code)}
                    style={{ borderRadius: 10, padding: "8px 16px", fontWeight: lang === item.code ? 700 : 500 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
                Ilova mavzusi (Dizayn):
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`btn sm ${theme === "light" ? "btn-primary-sheen" : "ghost"}`}
                  onClick={() => theme === "dark" && toggleTheme()}
                  style={{ borderRadius: 10, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: theme === "light" ? 700 : 500 }}
                >
                  ☀️ Kunduzgi (Yorug')
                </button>
                <button
                  type="button"
                  className={`btn sm ${theme === "dark" ? "btn-primary-sheen" : "ghost"}`}
                  onClick={() => theme === "light" && toggleTheme()}
                  style={{ borderRadius: 10, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: theme === "dark" ? 700 : 500 }}
                >
                  🌙 Tungi (Qorong'i)
                </button>
              </div>
            </div>
          </div>

          <div className="profile-edit-card profile-security-card">
            <div className="profile-sec-info">
              <h3>Hisob xavfsizligi va Seans</h3>
              <p className="muted">
                Ushbu qurilmadagi shaxsiy kabinet seansini yakunlash uchun hisobdan chiqish tugmasini bosing.
              </p>
            </div>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (window.confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?")) {
                  logout();
                  nav("/");
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Hisobdan chiqish</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
