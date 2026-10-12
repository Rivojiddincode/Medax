import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api";

interface Item { id: number; name: string; count: number; sortOrder?: number; country?: string | null }

function Block({ title, path, withCountry }: { title: string; path: "categories" | "brands"; withCountry?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Item[]>(`/admin/${path}`, { admin: true }).then(setItems).catch((e) => setError(e.message));
  }, [path]);
  useEffect(load, [load]);

  const payload = (n: string, x: string) =>
    withCountry ? { name: n, country: x || null } : { name: n, sortOrder: Number(x) || 0 };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api(`/admin/${path}`, { json: payload(name, extra), admin: true });
      setName(""); setExtra(""); load();
    } catch (err) { setError((err as ApiError).message); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api(`/admin/${path}/${editing.id}`, { method: "PUT", json: payload(editing.name, withCountry ? editing.country || "" : String(editing.sortOrder ?? 0)), admin: true });
      setEditing(null); load();
    } catch (err) { setError((err as ApiError).message); }
  };

  const remove = async (i: Item) => {
    if (!confirm(`"${i.name}" o'chirilsinmi?`)) return;
    try { await api(`/admin/${path}/${i.id}`, { method: "DELETE", admin: true }); load(); }
    catch (err) { setError((err as ApiError).message); }
  };

  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>{title}</h2>
      {error && <p className="err">{error}</p>}
      <form className="row" onSubmit={add}>
        <input type="text" style={{ flex: 2, minWidth: 180 }} placeholder="Nomi" value={name} onChange={(e) => setName(e.target.value)} required aria-label="Nomi" />
        <input type={withCountry ? "text" : "number"} style={{ flex: 1, minWidth: 120 }} placeholder={withCountry ? "Davlat" : "Tartib raqami"} value={extra} onChange={(e) => setExtra(e.target.value)} aria-label={withCountry ? "Davlat" : "Tartib raqami"} />
        <button className="btn">Qo'shish</button>
      </form>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Nomi</th><th>{withCountry ? "Davlat" : "Tartib"}</th><th>Mahsulotlar</th><th></th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                {editing?.id === i.id ? (
                  <>
                    <td><input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Nomi" /></td>
                    <td>{withCountry
                      ? <input type="text" value={editing.country || ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} aria-label="Davlat" />
                      : <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} aria-label="Tartib" />}</td>
                    <td>{i.count}</td>
                    <td style={{ whiteSpace: "nowrap" }}><button className="btn sm" onClick={saveEdit}>Saqlash</button>{" "}<button className="btn ghost sm" onClick={() => setEditing(null)}>Bekor</button></td>
                  </>
                ) : (
                  <>
                    <td style={{ fontWeight: 600 }}>{i.name}</td>
                    <td>{withCountry ? i.country || "—" : i.sortOrder}</td>
                    <td>{i.count}</td>
                    <td style={{ whiteSpace: "nowrap" }}><button className="btn ghost sm" onClick={() => setEditing(i)}>Tahrirlash</button>{" "}<button className="btn ghost sm" onClick={() => remove(i)}>O'chirish</button></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Taxonomy() {
  return (
    <>
      <h1>Kategoriya va brendlar</h1>
      <Block title="Kategoriyalar" path="categories" />
      <Block title="Brendlar" path="brands" withCountry />
    </>
  );
}
