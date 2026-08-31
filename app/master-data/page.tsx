"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Key = "mt" | "rombel" | "mapel";
const labels: Record<Key, string> = { mt: "Nama MT", rombel: "Rombel", mapel: "Mapel" };
const tables: Record<Key, string> = { mt: "master_mt", rombel: "master_rombel", mapel: "master_mapel" };

export default function MasterDataPage() {
  const [data, setData] = useState<Record<Key, { id: string; name: string }[]>>({ mt: [], rombel: [], mapel: [] });
  const [tab, setTab] = useState<Key>("mt");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (!name) return;
    const exists = data[tab].some(x => x.name.toLowerCase() === name.toLowerCase());
    if (exists) { setMessage(`${labels[tab]} sudah ada.`); return; }
    const { error } = await supabase.from(tables[tab]).insert({ name, active: true });
    if (error) { setMessage(`Gagal menambah ${labels[tab].toLowerCase()}: ${error.message}`); return; }
    setValue(""); setMessage(`${labels[tab]} berhasil ditambahkan.`); load();
  }

  async function remove(item: { id: string; name: string }) {
    if (!confirm(`Nonaktifkan ${labels[tab]} "${item.name}" dari pilihan?`)) return;
    const { error } = await supabase.from(tables[tab]).update({ active: false }).eq("id", item.id);
    if (error) { setMessage(`Gagal menghapus: ${error.message}`); return; }
    setMessage(`${labels[tab]} berhasil dinonaktifkan.`); load();
  }

  return <main className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · MASTER DATA</div><h1>Master Data</h1><p>Data tersimpan bersama di database, sehingga perubahan terlihat oleh semua Coach.</p></div><span className="badge planning-status">☁️ Shared Database</span></div></section>
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>{(Object.keys(labels) as Key[]).map(k => <button key={k} onClick={() => { setTab(k); setMessage(""); }} className={tab === k ? "primary-btn" : "secondary-btn"}>{labels[k]} <span style={{ opacity: .65 }}>({data[k].length})</span></button>)}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}><input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={`Tambah ${labels[tab]}...`} style={{ flex: 1, border: "1px solid #dbe2ea", borderRadius: 12, padding: "12px 14px" }} disabled={loading} /><button className="primary-btn" onClick={add} disabled={loading}>＋ Tambah</button></div>
      {message && <div style={{ marginBottom: 14, color: message.startsWith("Gagal") ? "#b91c1c" : "#047857", fontSize: 13, fontWeight: 600 }}>{message}</div>}
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Memuat master data…</div> : <div className="planning-table-wrap"><table><thead><tr><th>#</th><th>{labels[tab]}</th><th style={{ textAlign: "right" }}>Aksi</th></tr></thead><tbody>{data[tab].map((item, i) => <tr key={item.id}><td>{i + 1}</td><td><span className="table-primary">{item.name}</span></td><td style={{ textAlign: "right" }}><button className="row-delete" onClick={() => remove(item)}>Nonaktifkan</button></td></tr>)}</tbody></table></div>}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid #eef2f7", flexWrap: "wrap" }}><small style={{ color: "#64748b" }}>Sumber awal: sheet Validasi — MT kolom A, Rombel kolom F, Mapel kolom H.</small><button className="secondary-btn" onClick={load}>↻ Refresh</button></div>
    </section>
  </main>;
}
