"use client";

import { useEffect, useMemo, useState } from "react";
import { getMTs, getRombels, getMapels, saveMTs, saveRombels, saveMapels, MT, Rombel, Mapel } from "../../lib/store";

type Target = "mt" | "rombel" | "mapel";

export default function DataPage() {
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState<Target>("mt");
  const [name, setName] = useState("");
  const [search, setSearch] = useState({ mt: "", rombel: "", mapel: "" });

  useEffect(() => { setMts(getMTs()); setRombels(getRombels()); setMapels(getMapels()); }, []);

  const filteredMT = useMemo(() => mts.filter(x => x.name.toLowerCase().includes(search.mt.toLowerCase())), [mts, search.mt]);
  const filteredRombel = useMemo(() => rombels.filter(x => x.name.toLowerCase().includes(search.rombel.toLowerCase())), [rombels, search.rombel]);
  const filteredMapel = useMemo(() => mapels.filter(x => x.name.toLowerCase().includes(search.mapel.toLowerCase())), [mapels, search.mapel]);

  function openAdd(type: Target) { setTarget(type); setName(""); setShowForm(true); }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    if (target === "mt") {
      const next = [...mts, { id: Date.now(), name: value, branch: "Semua Cabang", status: "Active" as const }]; setMts(next); saveMTs(next);
    } else if (target === "rombel") {
      const next = [...rombels, { id: Date.now(), name: value, level: "", branch: "Semua Cabang", status: "Active" as const }]; setRombels(next); saveRombels(next);
    } else {
      const next = [...mapels, { id: Date.now(), name: value, status: "Active" as const }]; setMapels(next); saveMapels(next);
    }
    setShowForm(false);
  }

  function removeMT(id: number) { if (window.confirm("Hapus MT ini dari master data?")) { const next = mts.filter(x => x.id !== id); setMts(next); saveMTs(next); } }
  function removeRombel(id: number) { if (window.confirm("Hapus rombel ini dari master data?")) { const next = rombels.filter(x => x.id !== id); setRombels(next); saveRombels(next); } }
  function removeMapel(id: number) { if (window.confirm("Hapus mapel ini dari master data?")) { const next = mapels.filter(x => x.id !== id); setMapels(next); saveMapels(next); } }

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div><div className="eyebrow">MT COACH · MANAGEMENT</div><h1>Master Data</h1><p>Kelola daftar MT, rombel, dan mapel yang digunakan di Weekly Planning.</p></div>
          <span className="badge planning-status">⚙️ Data</span>
        </div>
      </section>

      <div className="page-head"><div><h2>Data Master</h2><p>Tambah atau hapus data yang tersedia di seluruh modul.</p></div></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
        <MasterCard title="List MT" icon="👤" count={mts.length} search={search.mt} onSearch={v => setSearch(s => ({ ...s, mt: v }))} onAdd={() => openAdd("mt")}>
          {filteredMT.map(mt => <div key={mt.id} style={rowStyle}><span>{mt.name}</span><button className="row-delete" onClick={() => removeMT(mt.id)}>Hapus</button></div>)}
        </MasterCard>
        <MasterCard title="List Rombel" icon="🏫" count={rombels.length} search={search.rombel} onSearch={v => setSearch(s => ({ ...s, rombel: v }))} onAdd={() => openAdd("rombel")}>
          {filteredRombel.map(r => <div key={r.id} style={rowStyle}><span>{r.name}</span><button className="row-delete" onClick={() => removeRombel(r.id)}>Hapus</button></div>)}
        </MasterCard>
        <MasterCard title="List Mapel" icon="📚" count={mapels.length} search={search.mapel} onSearch={v => setSearch(s => ({ ...s, mapel: v }))} onAdd={() => openAdd("mapel")}>
          {filteredMapel.map(m => <div key={m.id} style={rowStyle}><span>{m.name}</span><button className="row-delete" onClick={() => removeMapel(m.id)}>Hapus</button></div>)}
        </MasterCard>
      </div>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="modal" onSubmit={addItem}>
          <div className="modal-head"><div><h2>Tambah {target === "mt" ? "MT" : target === "rombel" ? "Rombel" : "Mapel"}</h2><p>Data baru langsung tersedia di Weekly Planning.</p></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div>
          <label>{target === "mt" ? "Nama MT" : target === "rombel" ? "Nama Rombel" : "Nama Mapel"}<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={target === "mt" ? "Nama MT" : target === "rombel" ? "10 SMA R4.01" : "Matematika"} required /></label>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div>
        </form>
      </div>}
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid #eef0f3", fontSize: 12 };

function MasterCard({ title, icon, count, search, onSearch, onAdd, children }: { title: string; icon: string; count: number; search: string; onSearch: (value: string) => void; onAdd: () => void; children: React.ReactNode }) {
  return <section className="card" style={{ padding: 16, minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div><h3 style={{ margin: 0, fontSize: 16 }}>{icon} {title}</h3><span style={{ color: "#64748b", fontSize: 11 }}>{count} data</span></div>
      <button className="primary-btn" style={{ padding: "8px 10px", fontSize: 11 }} onClick={onAdd}>＋ Tambah</button>
    </div>
    <input className="search" style={{ width: "100%", maxWidth: "none", marginBottom: 7 }} value={search} onChange={e => onSearch(e.target.value)} placeholder="Cari..." />
    <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>{children}</div>
  </section>;
}
