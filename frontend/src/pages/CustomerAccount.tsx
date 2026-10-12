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

  const [tab, setTab] = useState<"orders" | "wallet" | "profile">(
    tabParam === "profile" ? "profile" : tabParam === "wallet" ? "wallet" : "orders"
  );
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Wallet / Deposit states
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [activeDeposit, setActiveDeposit] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 daqiqa (soniyalarda)
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    if (tabParam === "profile") setTab("profile");
    else if (tabParam === "wallet") setTab("wallet");
    else if (tabParam === "orders") setTab("orders");
  }, [tabParam]);

  const switchTab = (newTab: "orders" | "wallet" | "profile") => {
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

  // 10 daqiqalik taymer va avto-tekshiruv (Polling)
  useEffect(() => {
    if (!activeDeposit || activeDeposit.status !== "PENDING") return;

    const timer = setInterval(() => {
      const exp = new Date(activeDeposit.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(timer);
        setActiveDeposit((prev: any) => (prev ? { ...prev, status: "EXPIRED" } : null));
      }
    }, 1000);

    // Har 4 soniyada to'lov qabul qilinganligini tekshirib turamiz
    const poller = setInterval(async () => {
      try {
        const res = await fetch(`/api/customer/deposit/${activeDeposit.id}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.deposit?.status === "CONFIRMED") {
            setActiveDeposit(null);
            setDepositSuccess(true);
            refreshCustomer();
            clearInterval(poller);
            clearInterval(timer);
          } else if (data.deposit?.status === "EXPIRED") {
            setActiveDeposit((prev: any) => (prev ? { ...prev, status: "EXPIRED" } : null));
            clearInterval(poller);
            clearInterval(timer);
          }
        }
      } catch {}
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [activeDeposit, token]);

  const handleCreateDeposit = async (amt: number) => {
    if (!token || amt < 1000) return;
    setCreatingDeposit(true);
    setDepositSuccess(false);
    try {
      const res = await fetch("/api/customer/deposit/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "So'rov yaratishda xatolik");
      setActiveDeposit(data.deposit);
      const exp = new Date(data.deposit.expiresAt).getTime();
      setTimeLeft(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
    } catch (e: any) {
      alert(e.message || "Xatolik yuz berdi");
    } finally {
      setCreatingDeposit(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
            <h1>{customer?.name}</h1>
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
          className={`tab-btn ${tab === "wallet" ? "active" : ""}`}
          onClick={() => switchTab("wallet")}
          style={{ position: "relative" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M16 12h.01" />
            <path d="M2 10h20" />
          </svg>
          <span>Hamyon / Balans ({(customer?.balance || 0).toLocaleString("ru-RU")} so'm)</span>
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

      {/* 2. WALLET / BALANS TAB */}
      {tab === "wallet" && (
        <section className="account-wallet-section" style={{ display: "grid", gap: 24, maxWidth: 840, margin: "0 auto" }}>
          {/* Asosiy Balans kartasi */}
          <div
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              borderRadius: 20,
              padding: "28px 32px",
              boxShadow: "0 14px 34px -10px rgba(2, 132, 199, 0.45)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6, fontWeight: 500 }}>
                Shaxsiy hamyon balansi
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>
                {(customer?.balance || 0).toLocaleString("ru-RU")}{" "}
                <span style={{ fontSize: 20, fontWeight: 600 }}>so'm</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>
                Buyurtmalarni 1 bosishda to'lash uchun foydalaniladi
              </div>
            </div>

            <button
              type="button"
              className="btn"
              onClick={() => refreshCustomer()}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 12,
                padding: "10px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🔄 Balansni yangilash
            </button>
          </div>

          {/* Muvaffaqiyatli to'lov xabari */}
          {depositSuccess && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1.5px solid #10b981",
                color: "#065f46",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 32 }}>🎉</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>To'lov muvaffaqiyatli qabul qilindi!</h4>
                <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>
                  Mablag' shaxsiy hisobingizga muvaffaqiyatli o'tkazildi. Endi istalgan tibbiy jihozni to'g'ridan-to'g'ri balansdan xarid qilishingiz mumkin.
                </p>
              </div>
            </div>
          )}

          {/* Faol to'lov sessiyasi (10 daqiqalik hisoblagich) */}
          {activeDeposit && activeDeposit.status === "PENDING" && (
            <div
              style={{
                background: "var(--card, #fff)",
                border: "2px solid #0284c7",
                borderRadius: 20,
                padding: "28px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <span style={{ display: "inline-block", background: "#e0f2fe", color: "#0284c7", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    KUTILMOQDA • AVTOMATIK TEKSHIRUV
                  </span>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                    To'lovni amalga oshirish
                  </h3>
                </div>

                {/* 10 Daqiqalik Taymer */}
                <div
                  style={{
                    background: timeLeft < 120 ? "#fee2e2" : "#f0fdf4",
                    border: `1.5px solid ${timeLeft < 120 ? "#ef4444" : "#22c55e"}`,
                    color: timeLeft < 120 ? "#b91c1c" : "#15803d",
                    borderRadius: 12,
                    padding: "8px 16px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Qolgan vaqt</div>
                  <div style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "var(--ink2)", margin: "0 0 20px" }}>
                Iltimos, Click, Payme yoki bank ilovangiz orqali quyidagi <b>aniq summani</b> ko'rsatilgan kartaga o'tkazing. Tizim bank pochtasi orqali to'lovni avtomatik aniqlaydi:
              </p>

              <div style={{ display: "grid", gap: 14, background: "var(--bg, #f8fafc)", padding: 20, borderRadius: 16 }}>
                {/* To'lanishi kerak bo'lgan aniq summa */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 600 }}>O'tkazilishi kerak bo'lgan aniq summa:</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7" }}>
                      {activeDeposit.finalAmount?.toLocaleString("ru-RU")} so'm
                    </div>
                    {activeDeposit.diffAmount > 0 && (
                      <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                        (Asosiy summa: {activeDeposit.baseAmount?.toLocaleString("ru-RU")} so'm + {activeDeposit.diffAmount} so'm identifikatsiya kodi)
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() => copyToClipboard(String(activeDeposit.finalAmount), "amount")}
                    style={{ borderRadius: 8, padding: "6px 14px", fontWeight: 600 }}
                  >
                    {copiedField === "amount" ? "Nusxalandi ✓" : "Summani nusxalash"}
                  </button>
                </div>

                <div style={{ height: 1, background: "var(--line, #e2e8f0)" }} />

                {/* Karta raqami */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 600 }}>Qabul qiluvchi karta:</div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "var(--ink)" }}>
                      {activeDeposit.cardNumber}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>{activeDeposit.cardHolder}</div>
                  </div>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() => copyToClipboard(activeDeposit.cardNumber.replace(/\s+/g, ""), "card")}
                    style={{ borderRadius: 8, padding: "6px 14px", fontWeight: 600 }}
                  >
                    {copiedField === "card" ? "Nusxalandi ✓" : "Kartani nusxalash"}
                  </button>
                </div>

                <div style={{ height: 1, background: "var(--line, #e2e8f0)" }} />

                {/* To'lov kodi (Ixtiyoriy izoh) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 600 }}>To'lov izohi / kodi (Tavsiya etiladi):</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{activeDeposit.code}</div>
                  </div>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() => copyToClipboard(activeDeposit.code, "code")}
                    style={{ borderRadius: 8, padding: "6px 14px", fontWeight: 600 }}
                  >
                    {copiedField === "code" ? "Nusxalandi ✓" : "Kodni nusxalash"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--ink2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="spinner-dot" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }} />
                  Bankdan xat kutilmoqda... Sahifani yangilash shart emas.
                </span>

                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setActiveDeposit(null)}
                  style={{ color: "var(--ink3)" }}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          )}

          {/* Eskirgan sessiya */}
          {activeDeposit && activeDeposit.status === "EXPIRED" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #f87171",
                color: "#991b1b",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>To'lov vaqti tugadi (10 daqiqa)</h4>
              <p style={{ margin: "6px 0 12px", fontSize: 14 }}>
                Ushbu sessiya uchun ajratilgan vaqt tugadi. Iltimos, yangi to'lov so'rovini yarating.
              </p>
              <button
                type="button"
                className="btn sm btn-primary-sheen"
                onClick={() => setActiveDeposit(null)}
              >
                Qayta urinish
              </button>
            </div>
          )}

          {/* Hisobni to'ldirish formasi */}
          {(!activeDeposit || activeDeposit.status !== "PENDING") && (
            <div
              style={{
                background: "var(--card, #fff)",
                border: "1px solid var(--line, #e2e8f0)",
                borderRadius: 20,
                padding: "28px",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
                Hisobni to'ldirish
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink2)", margin: "0 0 20px" }}>
                To'ldirmoqchi bo'lgan summani tanlang yoki kiriting:
              </p>

              {/* Tayyor summa tugmalari */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {[50000, 100000, 300000, 500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`btn sm ${topupAmount === amt ? "btn-primary-sheen" : "ghost"}`}
                    onClick={() => setTopupAmount(amt)}
                    style={{
                      borderRadius: 12,
                      padding: "8px 16px",
                      fontWeight: topupAmount === amt ? 700 : 500,
                    }}
                  >
                    {amt.toLocaleString("ru-RU")} so'm
                  </button>
                ))}
              </div>

              {/* Qo'lda kiritish */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
                  Boshqa summa (so'mda):
                </label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    padding: "12px 16px",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    border: "1.5px solid var(--line)",
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary-sheen"
                disabled={creatingDeposit || topupAmount < 1000}
                onClick={() => handleCreateDeposit(topupAmount)}
                style={{
                  borderRadius: 14,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {creatingDeposit ? "So'rov tayyorlanmoqda..." : `Davom etish (${topupAmount.toLocaleString("ru-RU")} so'm) →`}
              </button>
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
