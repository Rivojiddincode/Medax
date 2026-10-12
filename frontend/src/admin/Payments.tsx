import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

interface DepositItem {
  id: number;
  code: string;
  baseAmount: number;
  diffAmount: number;
  finalAmount: number;
  status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELED";
  expiresAt: string;
  paidAt?: string;
  cardLast4?: string;
  rawEmailNote?: string;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    phone?: string;
    organization?: string;
    balance: number;
  };
}

interface CustomerItem {
  id: number;
  customerCode?: string;
  name: string;
  phone?: string;
  organization?: string;
  balance: number;
  createdAt: string;
  _count: { orders: number; deposits: number };
}

export default function AdminPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "customers" ? "customers" : "deposits";
  const [tab, setTab] = useState<"deposits" | "customers">(initialTab);

  useEffect(() => {
    const currentTab = searchParams.get("tab") === "customers" ? "customers" : "deposits";
    setTab(currentTab);
  }, [searchParams]);

  const switchTab = (newTab: "deposits" | "customers") => {
    setTab(newTab);
    setSearchParams(newTab === "customers" ? { tab: "customers" } : {});
  };

  // Deposits state
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  // Customers state
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [loadingCust, setLoadingCust] = useState(false);

  // Modal for Manual Balance Adjustment
  const [adjustCustomer, setAdjustCustomer] = useState<CustomerItem | null>(null);
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState("");
  const [adjBusy, setAdjBusy] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("adm_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    };
  };

  const loadDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      const res = await fetch(`/api/admin/deposits?${q.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.items || []);
      }
    } catch {}
    setLoadingDeposits(false);
  };

  const loadCustomers = async () => {
    setLoadingCust(true);
    try {
      const q = new URLSearchParams();
      if (custSearch) q.set("search", custSearch);
      const res = await fetch(`/api/admin/customers?${q.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.items || []);
      }
    } catch {}
    setLoadingCust(false);
  };

  useEffect(() => {
    if (tab === "deposits") loadDeposits();
    else loadCustomers();
  }, [tab, statusFilter]);

  const handleConfirmDeposit = async (depId: number) => {
    if (!window.confirm("Ushbu to'lovni tasdiqlab, mijoz balansiga qo'shmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/admin/deposits/${depId}/confirm`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      alert("To'lov muvaffaqiyatli tasdiqlandi va balans to'ldirildi ✓");
      loadDeposits();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancelDeposit = async (depId: number) => {
    if (!window.confirm("To'lov so'rovini bekor qilmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/admin/deposits/${depId}/cancel`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      loadDeposits();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomer || adjAmount === 0 || !adjReason.trim()) {
      alert("Iltimos, summani va sababni to'liq kiriting.");
      return;
    }
    setAdjBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${adjustCustomer.id}/adjust-balance`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ amount: Number(adjAmount), reason: adjReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      alert(data.message || "Balans muvaffaqiyatli yangilandi ✓");
      setAdjustCustomer(null);
      setAdjAmount(0);
      setAdjReason("");
      loadCustomers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdjBusy(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PENDING":
        return <span className="st NEW">Kutilmoqda (10 daq)</span>;
      case "CONFIRMED":
        return <span className="st CONFIRMED">Qabul qilindi ✓</span>;
      case "EXPIRED":
        return <span className="st CANCELED">Vaqti o'tdi</span>;
      case "CANCELED":
        return <span className="st FAKE">Bekor qilindi</span>;
      default:
        return <span className="st">{st}</span>;
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2>To'lovlar & Hamyonlar boshqaruvi</h2>
          <p className="muted">
            Bank pochtasi orqali tushgan to'lovlar, 10 daqiqalik sessiyalar va mijozlar balanslari nazorati.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={`btn sm ${tab === "deposits" ? "btn-primary-sheen" : "ghost"}`}
            onClick={() => switchTab("deposits")}
          >
            💳 To'ldirish so'rovlari
          </button>
          <button
            type="button"
            className={`btn sm ${tab === "customers" ? "btn-primary-sheen" : "ghost"}`}
            onClick={() => switchTab("customers")}
          >
            👥 Ro'yxatdan o'tgan mijozlar & Balanslar
          </button>
        </div>
      </div>

      {/* 1. DEPOSITS TAB */}
      {tab === "deposits" && (
        <>
          <div className="adm-filter-bar" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Kod, mijoz ismi yoki tel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDeposits()}
              style={{ minWidth: 260 }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Barcha holatlar</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="CONFIRMED">Tasdiqlangan</option>
              <option value="EXPIRED">Vaqti o'tgan</option>
              <option value="CANCELED">Bekor qilingan</option>
            </select>
            <button className="btn sm ghost" onClick={loadDeposits}>
              Qidirish
            </button>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Mijoz</th>
                  <th>Summa</th>
                  <th>Aniq summa (Micro)</th>
                  <th>Holat</th>
                  <th>Yaratilgan vaqt</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loadingDeposits ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 30 }}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 30 }} className="muted">
                      Hech qanday to'lov so'rovi topilmadi.
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <b>{d.code}</b>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.customer?.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink2)" }}>{d.customer?.phone || "-"}</div>
                      </td>
                      <td>
                        <b>{d.baseAmount.toLocaleString("ru-RU")}</b> so'm
                      </td>
                      <td>
                        <span style={{ color: "#0284c7", fontWeight: 700 }}>
                          {d.finalAmount.toLocaleString("ru-RU")} so'm
                        </span>
                        {d.diffAmount > 0 && (
                          <span style={{ fontSize: 11, color: "var(--ink3)", marginLeft: 4 }}>
                            (+{d.diffAmount})
                          </span>
                        )}
                      </td>
                      <td>{getStatusBadge(d.status)}</td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(d.createdAt).toLocaleString("uz-UZ")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {d.status !== "CONFIRMED" && (
                            <button
                              type="button"
                              className="btn sm"
                              style={{ background: "#10b981", color: "#fff", padding: "4px 8px", fontSize: 11 }}
                              onClick={() => handleConfirmDeposit(d.id)}
                              title="Qo'lda tasdiqlash va balansga o'tkazish"
                            >
                              Tasdiqlash ✓
                            </button>
                          )}
                          {d.status === "PENDING" && (
                            <button
                              type="button"
                              className="btn sm danger"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              onClick={() => handleCancelDeposit(d.id)}
                            >
                              Bekor
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 2. CUSTOMERS & BALANCES TAB */}
      {tab === "customers" && (
        <>
          <div className="adm-filter-bar" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Ism, telefon yoki tashkilot..."
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
              style={{ minWidth: 260 }}
            />
            <button className="btn sm ghost" onClick={loadCustomers}>
              Qidirish
            </button>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mijoz</th>
                  <th>Tashkilot</th>
                  <th>Telefon</th>
                  <th>Joriy Balans</th>
                  <th>Buyurtmalar</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loadingCust ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 30 }}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 30 }} className="muted">
                      Mijozlar topilmadi.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: "var(--brand, #0284c7)" }}>
                          {c.customerCode || `MDX-${c.id}`}
                        </span>
                      </td>
                      <td>
                        <b>{c.name}</b>
                      </td>
                      <td className="muted">{c.organization || "-"}</td>
                      <td>{c.phone || "-"}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: c.balance > 0 ? "#10b981" : "var(--ink)",
                          }}
                        >
                          {c.balance.toLocaleString("ru-RU")} so'm
                        </span>
                      </td>
                      <td>{c._count?.orders || 0} ta</td>
                      <td>
                        <button
                          type="button"
                          className="btn sm btn-primary-sheen"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => {
                            setAdjustCustomer(c);
                            setAdjAmount(0);
                            setAdjReason("");
                          }}
                        >
                          Balansni boshqarish
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Balansni o'zgartirish modali */}
      {adjustCustomer && (
        <div className="adm-modal-backdrop" onClick={() => setAdjustCustomer(null)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3>Mijoz balansini o'zgartirish</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              <b>{adjustCustomer.name}</b> (Hozirgi balans: {adjustCustomer.balance.toLocaleString("ru-RU")} so'm)
            </p>

            <form onSubmit={handleAdjustBalance}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Summa (Musbat bo'lsa qo'shadi, manfiy bo'lsa yechadi):
                </label>
                <input
                  type="number"
                  placeholder="Masalan: 100000 yoki -50000"
                  value={adjAmount || ""}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: 15 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  O'zgartirish sababi (Izoh):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Bank orqali qo'lda to'landi / Bonus / To'g'rilash"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setAdjustCustomer(null)}
                  disabled={adjBusy}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn sm btn-primary-sheen" disabled={adjBusy}>
                  {adjBusy ? "Saqlanmoqda..." : "Tasdiqlash va Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
