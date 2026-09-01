"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMTs,
  getRombels,
  getMapels,
  saveMTs,
  saveRombels,
  saveMapels,
  MT,
  Rombel,
  Mapel,
} from "../../lib/store";

const columns = [
  { key: "mt", title: "List MT", icon: "👤" },
  { key: "rombel", title: "List Rombel", icon: "🏫" },
  { key: "mapel", title: "List Mapel", icon: "📚" },
] as const;
type ColumnKey = (typeof columns)[number]["key"];

export default function DataPage() {
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState<ColumnKey>("mt");
  const [name, setName] = useState("");
  const [search, setSearch] = useState({ mt: "", rombel: "", mapel: "" });

  useEffect(() => {
    setMts(getMTs());
    setRombels(getRombels());
    setMapels(getMapels());
  }, []);

  const filteredMT = useMemo(() => mts.filter((x) => x.name.toLowerCase().includes(search.mt.toLowerCase())), [mts, search.mt]);
  const filteredRombel = useMemo(() => rombels.filter((x) => x.name.toLowerCase().includes(search.rombel.toLowerCase())), [rombels, search.rombel]);
  const filteredMapel = useMemo(() => mapels.filter((x) => x.name.toLowerCase().includes(search.mapel.toLowerCase())), [mapels, search.mapel]);

  function openAdd(key: ColumnKey) {
    setTarget(key);
    setName("");
    setShowForm(true);
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;

    if (target === "mt") {
      const next = [...mts, { id: Date.now(), name: value, branch: "Semua Cabang", status: "Active" as const }];
      setMts(next); saveMTs(next);
    } else if (target === "rombel") {
      const next = [...rombels, { id: Date.now(), name: value, level: "", branch: "Semua Cabang", status: "Active" as const }];
      setRombels(next); saveRombels(next);
    } else {
      const next = [...mapels, { id: Date.now(), name: value, status: "Active" as const }];
      setMapels(next); saveMapels(next);
    }
    setShowForm(false);
  }

  function removeMT(id: number) {
    if (!window.confirm("Hapus MT ini dari master data?")) return;
    const next = mts.filter((x) => x.id !== id); setMts(next); saveMTs(next);
  }
  function removeRombel(id: number) {
    if (!window.confirm("Hapus rombel ini dari master data?")) return;
    const next = rombels.filter((x) => x.id !== id); setRombels(next); saveRombels(next);
  }
  function removeMapel(id: number) {
    if (!window.confirm("Hapus mapel ini dari master data?")) return;
    const next = mapels.filter((x) => x.id !== id); setMapels(next); saveMapels(next);
  }

  const counts = { mt: mts.length, rombel: rombels.length, mapel: mapels.length };

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div>
            <div className="eyebrow">MT COACH · MANAGEMENT</div>
            <h1>Master Data</h1>
            <p>Kelola daftar MT, rombel, dan mapel yang digunakan di Weekly Planning.</p>
          </div>
          <span className="badge planning-status">⚙️ Data</span>
        </div>
      </section>

      <div className="page-head">
        <div>
          <h2>Data Master</h2>
          <p>Tambah atau hapus data yang tersedia di seluruh modul.</p>
        </div>
      </div>

      <div className="master-grid">
        <MasterCard title="List MT" icon="👤" count={counts.mt} search={search.mt} onSearch={(v) => setSearch((s) => ({ ...s, mt: v }))} onAdd={() => openAdd("mt")}>
          {filteredMT.map((mt) => <div className="master-row" key={mt.id}><span>{mt.name}</span><button className="danger-text" onClick={() => removeMT(mt.id)}>Hapus</button></div>)}
        </MasterCard>

        <MasterCard title="List Rombel" icon="🏫" count={counts.rombel} search={search.rombel} onSearch={(v) => setSearch((s) => ({ ...s, rombel: v }))} onAdd={() => openAdd("rombel")}>
          {filteredRombel.map((r) => <div className="master-row" key={r.id}><span>{r.name}</span><button className="danger-text" onClick={() => removeRombel(r.id)}>Hapus</button></div>)}
        </MasterCard>

        <MasterCard title="List Mapel" icon="📚" count={counts.mapel} search={search.mapel} onSearch={(v) => setSearch((s) => ({ ...s, mapel: v }))} onAdd={() => openAdd("mapel")}>
          {filteredMapel.map((m) => <div className="master-row" key={m.id}><span>{m.name}</span><button className="danger-text" onClick={() => removeMapel(m.id)}>Hapus</button></div>)}
        </MasterCard>
      </div>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form className="modal" onSubmit={addItem}>
            <div className="modal-head">
              <div><h2>Tambah {target === "mt" ? "MT" : target === "rombel" ? "Rombel" : "Mapel"}</h2><p>Data baru langsung tersedia untuk input berikutnya.</p></div>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <label>{target === "mt" ? "Nama MT" : target === "rombel" ? "Nama Rombel" : "Nama Mapel"}<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={target === "mt" ? "Contoh: Nama MT" : target === "rombel" ? "Contoh: 10 SMA R4.01" : "Contoh: Matematika"} required /></label>
            <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function MasterCard({ title, icon, count, search, onSearch, onAdd, children }: { title: string; icon: string; count: number; search: string; onSearch: (value: string) => void; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className="master-card">
      <div className="master-card-head">
        <div><h3>{icon} {title}</h3><span>{count} data</span></div>
        <button className="primary-btn small" onClick={onAdd}>＋ Tambah</button>
      </div>
      <input className="master-search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Cari..." />
      <div className="master-list">{children}</div>
    </section>
  );
}
