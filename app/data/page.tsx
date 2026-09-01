"use client";

import { useEffect, useState } from "react";
import { getMTs, getRombels, saveMTs, saveRombels, MT, Rombel } from "../../lib/store";

export default function DataPage() {
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [tab, setTab] = useState<"mt" | "rombel" | "branch">("mt");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("SD");
  const [branch, setBranch] = useState("Tarandam");

  useEffect(() => { setMts(getMTs()); setRombels(getRombels()); }, []);

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (tab === "mt") {
      const next = [...mts, { id: Date.now(), name: name.trim(), branch, status: "Active" as const }];
      setMts(next); saveMTs(next);
    } else if (tab === "rombel") {
      const next = [...rombels, { id: Date.now(), name: name.trim(), level, branch, status: "Active" as const }];
      setRombels(next); saveRombels(next);
    }
    setName(""); setShowForm(false);
  }

  function toggleMT(id: number) {
    const next = mts.map((item) => item.id === id ? { ...item, status: item.status === "Active" ? "Inactive" as const : "Active" as const } : item);
    setMts(next); saveMTs(next);
  }

  function toggleRombel(id: number) {
    const next = rombels.map((item) => item.id === id ? { ...item, status: item.status === "Active" ? "Inactive" as const : "Active" as const } : item);
    setRombels(next); saveRombels(next);
  }

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div><div className="eyebrow">MT COACH · MANAGEMENT</div><h1>Master Data</h1><p>Kelola data MT, rombel, dan cabang yang digunakan oleh seluruh modul.</p></div>
          <span className="badge planning-status">⚙️ Data</span>
        </div>
      </section>

      <div className="page-head"><div><h2>Master Data</h2><p>Kelola data MT, rombel, dan cabang.</p></div>{tab !== "branch" && <button className="primary-btn" onClick={() => setShowForm(true)}>＋ Tambah {tab === "mt" ? "MT" : "Rombel"}</button>}</div>
      <div className="data-tabs"><button className={tab === "mt" ? "data-tab active" : "data-tab"} onClick={() => setTab("mt")}>👤 MT</button><button className={tab === "rombel" ? "data-tab active" : "data-tab"} onClick={() => setTab("rombel")}>🏫 Rombel</button><button className={tab === "branch" ? "data-tab active" : "data-tab"} onClick={() => setTab("branch")}>🏢 Cabang</button></div>
      {tab === "mt" && <div className="table-wrap"><table><thead><tr><th>Nama MT</th><th>Cabang</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{mts.map((mt) => <tr key={mt.id}><td><strong>{mt.name}</strong></td><td>{mt.branch}</td><td><span className={`badge ${mt.status === "Active" ? "green" : "red"}`}>{mt.status}</span></td><td><button className="button secondary" onClick={() => toggleMT(mt.id)}>{mt.status === "Active" ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>)}</tbody></table></div>}
      {tab === "rombel" && <div className="table-wrap"><table><thead><tr><th>Rombel</th><th>Jenjang</th><th>Cabang</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rombels.map((rombel) => <tr key={rombel.id}><td><strong>{rombel.name}</strong></td><td>{rombel.level}</td><td>{rombel.branch}</td><td><span className={`badge ${rombel.status === "Active" ? "green" : "red"}`}>{rombel.status}</span></td><td><button className="button secondary" onClick={() => toggleRombel(rombel.id)}>{rombel.status === "Active" ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>)}</tbody></table></div>}
      {tab === "branch" && <div className="table-wrap"><table><thead><tr><th>Cabang</th><th>Status</th></tr></thead><tbody>{["Tarandam", "Gajah Mada", "S. Parman", "Sutomo"].map((b) => <tr key={b}><td><strong>{b}</strong></td><td><span className="badge green">Active</span></td></tr>)}</tbody></table></div>}
      {showForm && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="modal" onSubmit={addItem}><div className="modal-head"><div><h2>Tambah {tab === "mt" ? "MT" : "Rombel"}</h2><p>Data baru akan langsung tersedia di modul berikutnya.</p></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div><label>{tab === "mt" ? "Nama MT" : "Nama Rombel"}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={tab === "mt" ? "Contoh: Rizky" : "Contoh: 10 SMA B"} required /></label>{tab === "rombel" && <label>Jenjang<select value={level} onChange={(e) => setLevel(e.target.value)}><option>SD</option><option>SMP</option><option>SMA</option></select></label>}<label>Cabang<select value={branch} onChange={(e) => setBranch(e.target.value)}><option>Tarandam</option><option>Gajah Mada</option><option>S. Parman</option><option>Sutomo</option></select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div></form></div>}
    </div>
  );
}
