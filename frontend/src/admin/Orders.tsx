import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, Paged, STATUS_LABEL } from "../api";
import { Pager } from "../components/Shell";

interface Order {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  organization: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  comment: string;
  status: keyof typeof STATUS_LABEL;
  managerNote: string;
  ip?: string | null;
  flags: string[];
  createdAt: string;
  items: { id: number; productName: string; quantity: number }[];
}

import { useAdminI18n } from "./i18n";

const FLAG_LABEL: Record<string, string> = { FIRST: "Birinchi buyurtma", TRUSTED: "Ishonchli mijoz" };
const fmt = (s: string) => new Date(s).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default function Orders() {
  const { t } = useAdminI18n();
  const [sp, setSp] = useSearchParams();
  const status = sp.get("status") || "";
  const [data, setData] = useState<Paged<Order> | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page) });
    if (status) p.set("status", status);
    if (query) p.set("q", query);
    api<Paged<Order>>(`/admin/orders?${p}`, { admin: true }).then(setData).catch((e) => setError(e.message));
  }, [page, status, query]);
  useEffect(load, [load]);

  const setStatus = (s: string) => {
    setPage(1);
    setSp(s ? { status: s } : {});
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "NEW": return t("st_new") || "Yangi";
      case "CONFIRMED": return t("st_confirmed") || "Tasdiqlangan";
      case "READY": return "Olib ketishga tayyor";
      case "DONE": return t("st_done") || "Bajarildi";
      case "CANCELED": return t("st_canceled") || "Bekor qilingan";
      case "FAKE": return t("st_fake") || "Soxta";
      default: return s || t("all") || "Barchasi";
    }
  };

  return (
    <>
      <h1>{t("orders")}</h1>
      <div className="row">
        {["", "NEW", "CONFIRMED", "READY", "DONE", "CANCELED", "FAKE"].map((s) => (
          <button key={s} className="tab" style={{ margin: 0 }} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}>
            {getStatusLabel(s)}
          </button>
        ))}
        <span className="grow" />
        <form className="search" onSubmit={(e: FormEvent) => { e.preventDefault(); setPage(1); setQuery(q.trim()); }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kod, ism yoki telefon" aria-label="Qidirish" />
          <button className="btn sm">Qidirish</button>
        </form>
      </div>
      {error && <p className="err">{error}</p>}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("order_code")}</th>
              <th>{t("customer")}</th>
              <th>{t("phone")}</th>
              <th>Mahsulotlar</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((o) => (
              <tr key={o.id} className="click" onClick={() => setOpen(o)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(o)}>
                <td style={{ fontWeight: 600 }}>#{o.code}</td>
                <td>{o.customerName}{o.organization && <div className="muted" style={{ fontSize: 13 }}>{o.organization}</div>}</td>
                <td>{o.phone}</td>
                <td>{o.items.length} ta ({o.items.reduce((s, i) => s + i.quantity, 0)} dona)</td>
                <td>{fmt(o.createdAt)}</td>
                <td><span className={`st ${o.status}`}>{getStatusLabel(o.status)}</span></td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: 32 }}>{t("no_orders_yet")}</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
      {open && <Detail order={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); load(); }} />}
    </>
  );
}

function Detail({ order, onClose, onChanged }: { order: Order; onClose: () => void; onChanged: () => void }) {
  const [note, setNote] = useState(order.managerNote);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Mijoz rad etdi / O'zi bekor qildi");
  const [cancelReasonText, setCancelReasonText] = useState("");

  const patch = async (body: { status?: string; managerNote?: string }) => {
    setBusy(true); setError("");
    try {
      const r = await api<{ blocked: boolean }>(`/admin/orders/${order.id}`, { method: "PATCH", json: body, admin: true });
      if (r.blocked) alert(`${order.phone} raqami soxta buyurtmalar sababli avtomatik bloklandi.`);
      onChanged();
    } catch (e) { setError((e as ApiError).message); setBusy(false); }
  };

  const confirmCancel = () => {
    const fullReason = cancelReasonPreset === "Boshqa"
      ? (cancelReasonText.trim() || "Sabab ko'rsatilmadi")
      : `${cancelReasonPreset}${cancelReasonText.trim() ? `. Qo'shimcha: ${cancelReasonText.trim()}` : ""}`;
    patch({ status: "CANCELED", managerNote: fullReason });
    setCanceling(false);
  };

  const markFake = () => {
    if (confirm("Bu buyurtma soxta deb belgilansinmi? Raqam takror soxta bo'lsa avtomatik bloklanadi.")) patch({ status: "FAKE", managerNote: note });
  };

  const blockNow = async () => {
    if (!confirm(`${order.phone} raqamini darhol bloklaysizmi?`)) return;
    try {
      await api("/admin/blocklist", { json: { type: "PHONE", value: order.phone, reason: `Buyurtma ${order.code}` }, admin: true });
      setInfo("Raqam bloklandi.");
    } catch (e) { setError((e as ApiError).message); }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Buyurtma ${order.code}`} onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h2 style={{ fontSize: 26 }}>{order.code}</h2>
          <span className={`st ${order.status}`}>{STATUS_LABEL[order.status]}</span>
          <span className="grow" />
          <button className="btn ghost sm" onClick={onClose}>Yopish</button>
        </div>
        {error && <p className="err">{error}</p>}
        {info && <p className="ok">{info}</p>}
        <p style={{ margin: "0 0 4px" }}><b>{order.customerName}</b> · <a href={`tel:${order.phone}`}>{order.phone}</a></p>
        {order.organization && <p className="muted" style={{ margin: "0 0 4px" }}>{order.organization}</p>}
        <p className="muted" style={{ margin: "0 0 12px", fontSize: 14 }}>
          {fmt(order.createdAt)}{order.ip ? ` · IP ${order.ip}` : ""}
        </p>
        <div style={{ marginBottom: 12 }}>
          <span className="flag" style={{ background: "var(--mint)", color: "var(--moss)" }}>Telefon SMS bilan tasdiqlangan</span>
          {order.flags.map((f) => <span key={f} className={`flag ${f}`}>{FLAG_LABEL[f] || f}</span>)}
        </div>

        {order.status === "CANCELED" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", margin: "10px 0" }}>
            <strong style={{ color: "#b91c1c", display: "block", fontSize: 13, marginBottom: 4 }}>
              ❌ Buyurtma bekor qilingan
            </strong>
            <span style={{ color: "#7f1d1d", fontSize: 14 }}>
              <b>Sababi:</b> {order.managerNote || "Sabab yozilmagan"}
            </span>
          </div>
        )}

        <table className="specs"><tbody>
          {order.items.map((i) => <tr key={i.id}><td style={{ width: "auto", color: "var(--ink)" }}>{i.productName}</td><td style={{ width: 70, textAlign: "right" }}>{i.quantity} dona</td></tr>)}
        </tbody></table>
        {order.deliveryAddress && (
          <div style={{ background: "var(--sea, #f0f9ff)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: 10, padding: "10px 14px", margin: "10px 0" }}>
            <strong style={{ display: "block", fontSize: 13, color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>
              📍 Yetkazib berish manzili:
            </strong>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink, #0f172a)" }}>{order.deliveryAddress}</span>
          </div>
        )}

        {order.paymentMethod && (
          <div style={{ background: "var(--sea, #f0f9ff)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: 10, padding: "10px 14px", margin: "10px 0" }}>
            <strong style={{ display: "block", fontSize: 13, color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>
              💳 To'lov usuli:
            </strong>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink, #0f172a)" }}>
              {order.paymentMethod === "bank_transfer"
                ? "Bank hisob-faktura (Shartnoma / B2B)"
                : order.paymentMethod === "upon_delivery"
                ? "Yetkazib berilganda to'lash (Qabul qilgach)"
                : order.paymentMethod === "contract_quote"
                ? "Tijoriy taklif va hisob-kitob"
                : order.paymentMethod}
            </span>
          </div>
        )}

        {order.comment && (
          <div style={{ background: "var(--sea, #f0f9ff)", borderRadius: 10, padding: "10px 14px", margin: "10px 0" }}>
            <strong style={{ display: "block", fontSize: 13, color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>
              💬 Qo'shimcha izoh:
            </strong>
            <span style={{ fontSize: 14 }}>{order.comment}</span>
          </div>
        )}

        {canceling ? (
          <div style={{ background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 12, padding: "16px", margin: "16px 0" }}>
            <h4 style={{ margin: "0 0 10px", color: "#be123c", fontSize: 16 }}>⚠️ Buyurtmani bekor qilish sababini ko'rsating</h4>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="cancel-preset">Asosiy sabab:</label>
              <select
                id="cancel-preset"
                value={cancelReasonPreset}
                onChange={(e) => setCancelReasonPreset(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: 8 }}
              >
                <option value="Mijoz rad etdi / O'zi bekor qildi">Mijoz rad etdi / O'zi bekor qildi</option>
                <option value="Mahsulot omborda qolmagan">Mahsulot omborda qolmagan</option>
                <option value="Mijoz telefoniga javob bermadi">Mijoz telefoniga javob bermadi</option>
                <option value="Narx yoki yetkazib berish shartlari to'g'ri kelmadi">Narx yoki yetkazib berish shartlari to'g'ri kelmadi</option>
                <option value="Boshqa">Boshqa sabab (qo'lda yozish)...</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="cancel-detail">Qo'shimcha tafsilot / izoh:</label>
              <textarea
                id="cancel-detail"
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="Masalan: Mijoz bilan bog'lanildi, 2 haftadan keyin qayta murojaat qiladi..."
                style={{ minHeight: 60, width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn danger" disabled={busy} onClick={confirmCancel}>
                Bekor qilishni tasdiqlash
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => setCanceling(false)}>
                Orqaga
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="note">Menejer izohi</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              {order.status === "NEW" && (
                <button className="btn" disabled={busy} onClick={() => patch({ status: "CONFIRMED", managerNote: note })}>
                  📞 Tasdiqlash (Menejer qo'ng'iroq qildi)
                </button>
              )}
              {order.status === "CONFIRMED" && (
                <button className="btn" style={{ background: "#0284c7" }} disabled={busy} onClick={() => patch({ status: "READY", managerNote: note })}>
                  📦 Olib ketishga tayyor qilish
                </button>
              )}
              {order.status === "READY" && (
                <button className="btn" style={{ background: "#16a34a" }} disabled={busy} onClick={() => patch({ status: "DONE", managerNote: note })}>
                  ✅ Bajarildi (Mijoz olib ketdi)
                </button>
              )}
              {(order.status === "NEW" || order.status === "CONFIRMED" || order.status === "READY") && (
                <button className="btn ghost" disabled={busy} style={{ color: "#ef4444" }} onClick={() => setCanceling(true)}>
                  Bekor qilish...
                </button>
              )}
              {order.status !== "FAKE" && <button className="btn danger" disabled={busy} onClick={markFake}>Soxta (Bekor va Bloklash)</button>}
              <button className="btn ghost" disabled={busy} onClick={() => patch({ managerNote: note })}>Izohni saqlash</button>
              <button className="btn ghost" disabled={busy} onClick={blockNow}>Raqamni bloklash</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
