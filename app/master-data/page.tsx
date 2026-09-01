"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Key = "mt" | "rombel" | "mapel";
const labels: Record<Key, string> = { mt: "Nama MT", rombel: "Rombel", mapel: "Mapel" };
const icons: Record<Key, string> = { mt: "👤", rombel: "🏫", mapel: "📚" };
const tables: Record<Key, string> = { mt: "master_mt", rombel: "master_rombel", mapel: "master_mapel" };

type Item = { id: string; name: string };

export default function MasterDataPage() {
  const [data, setData] = useState<Record<Key, Item[]>>({ mt: [], rombel: [], mapel: [] });
  const [tab, setTab] = useState<Key>("mt");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  async function add() {
    const name = value.trim();
    if (!name || saving) return;
    const exists = data[tab].some(x => x.name.toLowerCase() === name.toLowerCase());
    if (exists) { setMessage(`${labels[tab]} sudah ada.`); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.from(tables[tab]).insert({ name, active: true });
    setSaving(false);
    if (error) { setMessage(`Gagal menambah ${labels[tab].toLowerCase()}: ${error.message}`); return; }
    setValue(""); setMessage(`${labels[tab]} berhasil ditambahkan.`); await load();
  }

  async function remove(item: Item) {
    if (!confirm(`Nonaktifkan ${labels[tab]} "${item.name}" dari pilihan?`)) return;
    const { error } = await supabase.from(tables[tab]).update({ active: false }).eq("id", item.id);
    if (error) { setMessage(`Gagal menonaktifkan: ${error.message}`); return; }
    setMessage(`${labels[tab]} berhasil dinonaktifkan.`); await load();
  }

  return <main className="page-wrap">
    <section className="planning-hero">
      <div className="planning-hero-row">
        <div>
          <div className="eyebrow">MT COACH · MANAGEMENT</div>
          <h1>Master Data</h1>
          <p>Kelola data MT, rombel, dan mapel yang digunakan oleh seluruh modul.</p>
        </div>
        <span className="badge planning-status">☁️ Shared Database</span>
      </div>
    </section>

    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, color: "#14213d", fontSize: 16 }}>Data Master</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Tambahkan atau nonaktifkan data yang tersedia di Weekly Planning.</div>
        </div>
        <button className="secondary-btn" onClick={load} disabled={loading}>↻ Refresh</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #e5eaf1", paddingBottom: 10, marginBottom: 16 }}>
        {(Object.keys(labels) as Key[]).map(k => <button key={k} onClick={() => { setTab(k); setMessage(""); setValue(""); }} className={tab === k ? "primary-btn" : "secondary-btn"} style={{ minWidth: 130 }}>
          {icons[k]} {labels[k]} <span style={{ opacity: .7 }}>({data[k].length})</span>
        </button>)}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={`Masukkan ${labels[tab].toLowerCase()} baru...`} style={{ flex: 1, border: "1px solid #dbe2ea", borderRadius: 12, padding: "12px 14px", outline: "none" }} disabled={loading || saving} />
        <button className="primary-btn" onClick={add} disabled={loading || saving || !value.trim()}>{saving ? "Menyimpan..." : `＋ Tambah ${labels[tab]}`}</button>
      </div>

      {message && <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: message.startsWith("Gagal") ? "#fef2f2" : "#ecfdf5", color: message.startsWith("Gagal") ? "#b91c1c" : "#047857", fontSize: 13, fontWeight: 600 }}>{message}</div>}

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Memuat master data…</div> : <div className="planning-table-wrap"><table><thead><tr><th style={{ width: 70 }}>#</th><th>{labels[tab]}</th><th style={{ width: 150, textAlign: "right" }}>Aksi</th></tr></thead><tbody>{data[tab].map((item, i) => <tr key={item.id}><td>{i + 1}</td><td><span className="table-primary">{item.name}</span></td><td style={{ textAlign: "right" }}><button className="row-delete" onClick={() => remove(item)}>Nonaktifkan</button></td></tr>)}{data[tab].length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 36, color: "#64748b" }}>Belum ada {labels[tab].toLowerCase()} aktif.</td></tr>}</tbody></table></div>}

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #eef2f7", color: "#64748b", fontSize: 11 }}>Sumber awal: sheet Validasi — MT kolom A, Rombel kolom F, Mapel kolom H. Cabang tidak dikelola sebagai master karena MT dapat mengajar di semua cabang.</div>
    </section>
  </main>;
}
