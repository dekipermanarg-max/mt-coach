"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Target = "mt" | "rombel" | "mapel";
type Row = { id: string; name: string; active: boolean };

export default function DataPage() {
  const [mts, setMts] = useState<Row[]>([]);
  const [rombels, setRombels] = useState<Row[]>([]);
  const [mapels, setMapels] = useState<Row[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState<Target>("mt");
  const [name, setName] = useState("");
  const [search, setSearch] = useState({ mt: "", rombel: "", mapel: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    const [mtRes, rombelRes, mapelRes] = await Promise.all([
      supabase.from("master_mt").select("id,name,active").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name,active").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name,active").eq("active", true).order("name"),
    ]);
    if (mtRes.error || rombelRes.error || mapelRes.error) {
      setMessage(`Gagal memuat master data: ${(mtRes.error || rombelRes.error || mapelRes.error)?.message}`);
    } else {
      setMts((mtRes.data || []) as Row[]);
      setRombels((rombelRes.data || []) as Row[]);
      setMapels((mapelRes.data || []) as Row[]);
      setMessage("");
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredMT = useMemo(() => mts.filter(x => x.name.toLowerCase().includes(search.mt.toLowerCase())), [mts, search.mt]);
  const filteredRombel = useMemo(() => rombels.filter(x => x.name.toLowerCase().includes(search.rombel.toLowerCase())), [rombels, search.rombel]);
  const filteredMapel = useMemo(() => mapels.filter(x => x.name.toLowerCase().includes(search.mapel.toLowerCase())), [mapels, search.mapel]);

  function openAdd(type: Target) { setTarget(type); setName(""); setShowForm(true); setMessage(""); }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value || saving) return;
    setSaving(true); setMessage("");

    const table = target === "mt" ? "master_mt" : target === "rombel" ? "master_rombel" : "master_mapel";
    const { error } = await supabase.from(table).insert({ name: value, active: true });

    if (error) {
      setMessage(`Gagal menambahkan: ${error.message}`);
    } else {
      setShowForm(false);
      setName("");
      setMessage(`${target === "mt" ? "MT" : target === "rombel" ? "Rombel" : "Mapel"} berhasil ditambahkan. Data langsung tersedia di Weekly Planning.`);
      await loadData();
    }
    setSaving(false);
  }

  async function removeItem(type: Target, id: string, label: string) {
    const title = type === "mt" ? "MT" : type === "rombel" ? "rombel" : "mapel";
    if (!window.confirm(`Hapus ${title} "${label}" dari master data?\n\nData akan disembunyikan dari Weekly Planning, tetapi sesi lama tetap aman.`)) return;
    setSaving(true); setMessage("");
    const table = type === "mt" ? "master_mt" : type === "rombel" ? "master_rombel" : "master_mapel";
    const { error } = await supabase.from(table).update({ active: false }).eq("id", id);
    if (error) setMessage(`Gagal menghapus: ${error.message}`);
    else {
      setMessage(`${title} "${label}" dihapus dari master aktif. Weekly Planning otomatis tidak lagi menampilkannya.`);
      await loadData();
    }
    setSaving(false);
  }

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div><div className="eyebrow">MT COACH · MANAGEMENT</div><h1>Master Data</h1><p>Kelola daftar MT, rombel, dan mapel yang digunakan di Weekly Planning.</p></div>
          <span className="badge planning-status">⚙️ Shared Database</span>
        </div>
      </section>

      <div className="page-head"><div><h2>Data Master</h2><p>Perubahan di sini langsung tersimpan ke database yang dipakai Weekly Planning.</p></div></div>
      {message && <div className="card" style={{ marginBottom: 16, padding: 13, fontSize: 12 }}>{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
        <MasterCard title="List MT" icon="👤" count={mts.length} search={search.mt} onSearch={v => setSearch(s => ({ ...s, mt: v }))} onAdd={() => openAdd("mt")} disabled={saving}>
          {filteredMT.map(mt => <div key={mt.id} style={rowStyle}><span>{mt.name}</span><button className="row-delete" disabled={saving} onClick={() => removeItem("mt", mt.id, mt.name)}>Hapus</button></div>)}
        </MasterCard>
        <MasterCard title="List Rombel" icon="🏫" count={rombels.length} search={search.rombel} onSearch={v => setSearch(s => ({ ...s, rombel: v }))} onAdd={() => openAdd("rombel")} disabled={saving}>
          {filteredRombel.map(r => <div key={r.id} style={rowStyle}><span>{r.name}</span><button className="row-delete" disabled={saving} onClick={() => removeItem("rombel", r.id, r.name)}>Hapus</button></div>)}
        </MasterCard>
        <MasterCard title="List Mapel" icon="📚" count={mapels.length} search={search.mapel} onSearch={v => setSearch(s => ({ ...s, mapel: v }))} onAdd={() => openAdd("mapel")} disabled={saving}>
          {filteredMapel.map(m => <div key={m.id} style={rowStyle}><span>{m.name}</span><button className="row-delete" disabled={saving} onClick={() => removeItem("mapel", m.id, m.name)}>Hapus</button></div>)}
        </MasterCard>
      </div>

      {loading && <div className="card" style={{ marginTop: 16, padding: 14, fontSize: 12, color: "#64748b" }}>Memuat data shared database…</div>}

      {showForm && <div
        role="dialog"
        aria-modal="true"
        onMouseDown={e => { if (e.target === e.currentTarget && !saving) setShowForm(false); }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999, padding: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,.52)", backdropFilter: "blur(4px)",
        }}
      >
        <form
          onSubmit={addItem}
          style={{
            width: "min(480px, 100%)", margin: "0 auto", background: "#fff",
            border: "1px solid #e2e8f0", borderRadius: 18,
            boxShadow: "0 28px 80px rgba(15,23,42,.28)", overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 22px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 5 }}>MASTER DATA</div>
              <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.2, color: "#14213d" }}>Tambah {target === "mt" ? "MT" : target === "rombel" ? "Rombel" : "Mapel"}</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>Data baru langsung tersedia di Weekly Planning.</p>
            </div>
            <button type="button" aria-label="Tutup" disabled={saving} onClick={() => setShowForm(false)} style={{ flex: "0 0 auto", width: 34, height: 34, border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", color: "#475569", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ padding: "20px 22px 22px" }}>
            <label style={{ display: "block", color: "#334155", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{target === "mt" ? "Nama MT" : target === "rombel" ? "Nama Rombel" : "Nama Mapel"}</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={target === "mt" ? "Contoh: Nama MT" : target === "rombel" ? "Contoh: 10 SMA R4.02" : "Contoh: Bahasa Indonesia"}
              required
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 11, padding: "12px 13px", background: "#fff", color: "#0f172a", fontSize: 14, outline: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 18 }}>
              <button type="button" className="secondary-btn" disabled={saving} onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="primary-btn" disabled={saving || !name.trim()}>{saving ? "Menyimpan…" : "Simpan"}</button>
            </div>
          </div>
        </form>
      </div>}
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid #eef0f3", fontSize: 12 };

function MasterCard({ title, icon, count, search, onSearch, onAdd, children, disabled }: { title: string; icon: string; count: number; search: string; onSearch: (value: string) => void; onAdd: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <section className="card" style={{ padding: 16, minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div><h3 style={{ margin: 0, fontSize: 16 }}>{icon} {title}</h3><span style={{ color: "#64748b", fontSize: 11 }}>{count} data aktif</span></div>
      <button className="primary-btn" disabled={disabled} style={{ padding: "8px 10px", fontSize: 11 }} onClick={onAdd}>＋ Tambah</button>
    </div>
    <input className="search" style={{ width: "100%", maxWidth: "none", marginBottom: 7 }} value={search} onChange={e => onSearch(e.target.value)} placeholder="Cari..." />
    <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>{children}</div>
  </section>;
}
