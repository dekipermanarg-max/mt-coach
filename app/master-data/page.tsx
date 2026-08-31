"use client";

import { useEffect, useState } from "react";
import masterData from "../../lib/master-data.json";

type Key = "mt" | "rombel" | "mapel";
const KEY = "mt-coach-master-data";
const labels: Record<Key, string> = { mt: "Nama MT", rombel: "Rombel", mapel: "Mapel" };

export default function MasterDataPage() {
  const [data, setData] = useState<Record<Key, string[]>>({ mt: masterData.mt, rombel: masterData.rombel, mapel: masterData.mapel });
  const [tab, setTab] = useState<Key>("mt");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...data, ...JSON.parse(raw) }); } catch {} }, []);
  function persist(next: Record<Key, string[]>) { setData(next); localStorage.setItem(KEY, JSON.stringify(next)); setMessage("Perubahan master data tersimpan di browser ini."); }
  function add() { const name = value.trim(); if (!name || data[tab].some(x => x.toLowerCase() === name.toLowerCase())) return; persist({ ...data, [tab]: [...data[tab], name].sort((a,b) => a.localeCompare(b, "id")) }); setValue(""); }
  function remove(name: string) { if (!confirm(`Hapus ${labels[tab]} "${name}" dari pilihan?`)) return; persist({ ...data, [tab]: data[tab].filter(x => x !== name) }); }
  function reset() { if (!confirm("Kembalikan master data ke data awal dari file Validasi?")) return; const next = { mt: masterData.mt, rombel: masterData.rombel, mapel: masterData.mapel }; persist(next); }

  return <main className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · MASTER DATA</div><h1>Master Data</h1><p>Kelola daftar MT, rombel, dan mapel yang tersedia di Weekly Planning.</p></div><span className="badge planning-status">⚙️ Admin</span></div></section>
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>{(Object.keys(labels) as Key[]).map(k => <button key={k} onClick={() => { setTab(k); setMessage(""); }} className={tab === k ? "primary-btn" : "secondary-btn"}>{labels[k]} <span style={{ opacity: .65 }}>({data[k].length})</span></button>)}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}><input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={`Tambah ${labels[tab]}...`} style={{ flex: 1, border: "1px solid #dbe2ea", borderRadius: 12, padding: "12px 14px" }} /><button className="primary-btn" onClick={add}>＋ Tambah</button></div>
      {message && <div style={{ marginBottom: 14, color: "#047857", fontSize: 13, fontWeight: 600 }}>{message}</div>}
      <div className="planning-table-wrap"><table><thead><tr><th>#</th><th>{labels[tab]}</th><th style={{ textAlign: "right" }}>Aksi</th></tr></thead><tbody>{data[tab].map((name, i) => <tr key={name}><td>{i + 1}</td><td><span className="table-primary">{name}</span></td><td style={{ textAlign: "right" }}><button className="row-delete" onClick={() => remove(name)}>Hapus</button></td></tr>)}</tbody></table></div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid #eef2f7", flexWrap: "wrap" }}><small style={{ color: "#64748b" }}>Data awal berasal dari sheet Validasi: MT kolom A, Rombel kolom F, Mapel kolom H.</small><button className="secondary-btn" onClick={reset}>↺ Reset ke Data Awal</button></div>
    </section>
  </main>;
}
