import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface CustomerItem {
  id: number;
  name: string;
  phone?: string | null;
  organization?: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const getHeaders = () => {
    const token = localStorage.getItem("adm_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    };
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      const res = await fetch(`/api/admin/customers?${q.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2>Ro'yxatdan o'tgan mijozlar ({total})</h2>
          <p className="muted">
            Tizimda ro'yxatdan o'tgan foydalanuvchilar, klinikalar va ularning buyurtmalari.
          </p>
        </div>
      </div>

      <div className="adm-filter-bar" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Ism, telefon yoki tashkilot..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
          style={{ minWidth: 280 }}
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
              <th>Tashkilot / Klinika</th>
              <th>Telefon</th>
              <th>Buyurtmalar soni</th>
              <th>Ro'yxatdan o'tgan sana</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 30 }}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 30 }} className="muted">
                  Mijozlar topilmadi.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: "var(--brand, #0284c7)" }}>
                      #{c.id}
                    </span>
                  </td>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td className="muted">{c.organization || "Jismoniy shaxs"}</td>
                  <td>{c.phone || "-"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: c._count?.orders > 0 ? "#e0f2fe" : "var(--bg)",
                        color: c._count?.orders > 0 ? "#0284c7" : "var(--ink2)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {c._count?.orders || 0} ta buyurtma
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(c.createdAt).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
