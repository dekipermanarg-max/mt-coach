"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Key = "mt" | "rombel" | "mapel";
type Item = { id: string; name: string };

const labels: Record<Key, string> = { mt: "List MT", rombel: "List Rombel", mapel: "List Mapel" };
const icons: Record<Key, string> = { mt: "👤", rombel: "🏫", mapel: "📚" };
const tables: Record<Key, string> = { mt: "master_mt", rombel: "master_rombel", mapel: "master_mapel" };

export default function MasterDataPage() {
  const [data, setData] = useState<Record<Key, Item[]>>({ mt: [], rombel: [], mapel: [] });
  const [values, setValues] = useState<Record<Key, string>>({ mt: "", rombel: "", mapel: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Key | null>(null);
  const [openAdd, setOpenAdd] = useState<Key | null>(null);
  const [search, setSearch] = useState<Record<Key, string>>({ mt: "", rombel: "", mapel: "" });

  async function load() {
    setLoading(true);
    const [mt, rombel, mapel] = await Promise.all([
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    if (mt.error || rombel.error || mapel.error) setMessage("Gagal mengambil master data dari database.");
    setData({ mt: mt.data || [], rombel: rombel.data || [], mapel: mapel.data || [] });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add(key: Key) {
    const name = values[key].trim();
    if (!name || saving) return;
    if (data[key].some((x) => x.name.toLowerCase() === name.toLowerCase())) {
      setMessage(`${labels[key]} "${name}" sudah ada.`);
      return;
    }
    setSaving(key); setMessage("");
    const { error } = await supabase.from(tables[key]).insert({ name, active: true });
    setSaving(null);
    if (error) { setMessage(`Gagal menambah ${labels[key].toLowerCase()}: ${error.message}`); return; }
    setValues((v) => ({ ...v, [key]: "" }));
    setOpenAdd(null);
    setMessage(`${labels[key]} berhasil ditambahkan.`);
    await load();
  }

  async function remove(key: Key, item: Item) {
    if (!window.confirm(`Hapus "${item.name}" dari ${labels[key].toLowerCase()}?`)) return;
    const { error } = await supabase.from(tables[key]).update({ active: false }).eq("id", item.id);
    if (error) { setMessage(`Gagal menghapus ${item.name}: ${error.message}`); return; }
    setMessage(`${item.name} berhasil dihapus dari pilihan aktif.`);
    await load();
  }

  function openModal(key: Key) {
    setValues((v) => ({ ...v, [key]: "" }));
    setOpenAdd(key);
    setMessage("");
  }

  function renderList(key: Key) {
    const q = search[key].trim().toLowerCase();
    const items = q ? data[key].filter((x) => x.name.toLowerCase().includes(q)) : data[key];
    return (
      <section className="card" style={{ padding: 18, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{icons[key]}</span>
            <div><div style={{ fontWeight: 800, color: "#14213d", fontSize: 15 }}>{labels[key]}</div><div style={{ color: "#94a3b8", fontSize: 11 }}>{data[key].length} data aktif</div></div>
          </div>
          <button className="primary-btn" onClick={() => openModal(key)} style={{ whiteSpace: "nowrap", padding: "8px 11px", fontSize: 11 }}>＋ Tambah</button>
        </div>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <input value={search[key]} onChange={(e) => setSearch((s) => ({ ...s, [key]: e.target.value }))} placeholder="Cari..." style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dbe2ea", borderRadius: 10, padding: "9px 11px", outline: "none", fontSize: 12 }} />
        </div>

        <div style={{ maxHeight: 390, overflowY: "auto", border: "1px solid #eef2f7", borderRadius: 10 }}>
          {loading ? <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 12 }}>Memuat...</div> : items.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 12 }}>{q ? "Data tidak ditemukan." : "Belum ada data."}</div> : (
            <table style={{ width: "100%" }}><thead><tr><th style={{ width: 42 }}>#</th><th>{key === "mt" ? "Nama MT" : key === "rombel" ? "Rombel" : "Mapel"}</th><th style={{ width: 78, textAlign: "right" }}>Aksi</th></tr></thead><tbody>
              {items.map((item, i) => <tr key={item.id}><td>{i + 1}</td><td><span className="table-primary">{item.name}</span></td><td style={{ textAlign: "right" }}><button className="row-delete" title={`Hapus ${item.name}`} aria-label={`Hapus ${item.name}`} onClick={() => remove(key, item)} style={{ border: "1px solid #fecaca", background: "#fff7f7", color: "#dc2626", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>🗑️ Hapus</button></td></tr>)}
            </tbody></table>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="page-wrap">
      <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · MANAGEMENT</div><h1>Data</h1><p>Kelola List MT, List Rombel, dan List Mapel yang digunakan di seluruh modul.</p></div><span className="badge planning-status">⚙️ Master Data</span></div></section>
      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}><div><h2 style={{ margin: 0, color: "#14213d", fontSize: 20 }}>Kelola Master Data</h2><p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Tambah atau hapus item yang tersedia pada Weekly Planning.</p></div><button className="secondary-btn" onClick={load} disabled={loading}>↻ Refresh</button></div>
        {message && <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: message.startsWith("Gagal") ? "#fef2f2" : "#ecfdf5", color: message.startsWith("Gagal") ? "#b91c1c" : "#047857", fontSize: 13, fontWeight: 600 }}>{message}</div>}
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", alignItems: "start" }}>{renderList("mt")}{renderList("rombel")}{renderList("mapel")}</div>
        <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 10, background: "#f8fafc", color: "#64748b", fontSize: 11 }}>Sumber data: shared database. Setiap perubahan langsung digunakan oleh Weekly Planning dan modul terkait.</div>
      </section>

      {openAdd && (
        <div role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenAdd(null); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.42)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "min(460px, 100%)", background: "white", borderRadius: 18, boxShadow: "0 24px 70px rgba(15,23,42,.24)", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", letterSpacing: ".06em", textTransform: "uppercase" }}>Master Data</div><h3 style={{ margin: "3px 0 0", color: "#14213d", fontSize: 20 }}>Tambah {openAdd === "mt" ? "MT" : openAdd === "rombel" ? "Rombel" : "Mapel"}</h3><p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Data baru akan langsung tersedia di Weekly Planning.</p></div>
              <button onClick={() => setOpenAdd(null)} aria-label="Tutup" style={{ width: 34, height: 34, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", borderRadius: 10, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 7 }}>{openAdd === "mt" ? "Nama MT" : openAdd === "rombel" ? "Nama Rombel" : "Nama Mapel"}</label>
              <input autoFocus value={values[openAdd]} onChange={(e) => setValues((v) => ({ ...v, [openAdd]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") add(openAdd); if (e.key === "Escape") setOpenAdd(null); }} placeholder={openAdd === "mt" ? "Contoh: Nama MT" : openAdd === "rombel" ? "Contoh: 10 SMA R4.02" : "Contoh: Bahasa Indonesia"} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 11, padding: "11px 12px", outline: "none", fontSize: 14, color: "#0f172a" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button className="secondary-btn" onClick={() => setOpenAdd(null)} disabled={saving !== null}>Batal</button><button className="primary-btn" onClick={() => add(openAdd)} disabled={!values[openAdd].trim() || saving !== null}>{saving === openAdd ? "Menyimpan..." : "Simpan"}</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}