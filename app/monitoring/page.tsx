"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../../lib/store";

export default function Monitoring() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mts, setMts] = useState<MT[]>([]);
  const [selectedMT, setSelectedMT] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { setSessions(getSessions()); setMts(getMTs()); }, []);

  const rows = useMemo(() => mts.map((mt) => {
    const own = sessions.filter((s) => s.mt === mt.name);
    const planned = own.length;
    const realized = own.filter((s) => s.status === "Realized").length;
    const completion = planned ? Math.round((realized / planned) * 100) : 0;
    const status = completion >= 90 ? "green" : completion >= 80 ? "yellow" : "red";
    return { mt: mt.name, planned, realized, completion, status, admin: "—", ld: "—" };
  }).filter((r) => selectedMT === "all" || r.mt === selectedMT).filter((r) => r.mt.toLowerCase().includes(search.toLowerCase())), [mts, sessions, selectedMT, search]);

  const planned = sessions.length;
  const realized = sessions.filter((s) => s.status === "Realized").length;
  const sessionCompletion = planned ? ((realized / planned) * 100).toFixed(1) : "0.0";
  const attention = rows.filter((r) => r.completion < 90).length;

  return (
    <div className="shell"><aside className="sidebar"><div className="brand">MT Coach<span>BAC · Internal</span></div><nav className="nav"><Link href="/">🏠 Dashboard</Link><Link href="/planning">📅 Planning</Link><Link className="active" href="/monitoring">📊 Monitoring</Link><Link href="/performance">🏆 Performance</Link><Link href="/data">⚙️ Data</Link></nav></aside>
      <main className="main"><header className="topbar"><div className="title"><h1>Monitoring</h1><p>Week 36 · 31 Aug – 6 Sep 2026</p></div><div className="filters"><select className="select" defaultValue="week36"><option>Week 36</option><option>Week 35</option></select><select className="select" defaultValue="tarandam"><option>Tarandam</option><option>Semua Cabang</option></select><select className="select" value={selectedMT} onChange={(e) => setSelectedMT(e.target.value)}><option value="all">Semua MT</option>{mts.map((mt) => <option key={mt.id} value={mt.name}>{mt.name}</option>)}</select></div></header>
        <section className="grid"><div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">{sessionCompletion}%</div><div className="kpi-note">{realized} / {planned} realized</div></div><div className="card"><div className="kpi-label">Admin Completion</div><div className="kpi-value">—</div><div className="kpi-note">Belum ada data admin</div></div><div className="card"><div className="kpi-label">LD</div><div className="kpi-value">—</div><div className="kpi-note">Belum ada data LD</div></div><div className="card"><div className="kpi-label">Need Attention</div><div className="kpi-value">{attention} MT</div><div className="kpi-note">Session completion &lt; 90%</div></div></section>
        <section className="section"><div className="section-head"><h2>📊 Monitoring per MT</h2><input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔎 Cari MT..." /></div><div className="table-wrap"><table><thead><tr><th>MT</th><th>Planned</th><th>Realized</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.mt}><td><strong>{r.mt}</strong></td><td>{r.planned}</td><td>{r.realized}</td><td>{r.completion}%</td><td>{r.admin}</td><td>{r.ld}</td><td><span className={`badge ${r.status}`}>{r.status === "green" ? "Good" : r.status === "yellow" ? "Attention" : "Critical"}</span></td></tr>)}</tbody></table></div></section>
        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{rows.filter((r) => r.completion < 90).map((r) => <div className="alert" key={r.mt}><div><strong>{r.mt} · {r.completion}%</strong><small>Session completion {r.completion}% · {r.planned - r.realized} sesi belum realized</small></div><span className="badge yellow">Periksa</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan.</small></div></div>}</div></section>
        <section className="section"><div className="section-head"><h2>📋 Session Detail</h2><button className="button secondary">⬇ Export</button></div><div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>MT</th><th>Rombel</th><th>Status</th><th>Admin</th></tr></thead><tbody>{sessions.map((s) => <tr key={s.id}><td>{s.date}</td><td>{s.time}</td><td>{s.mt}</td><td>{s.rombel}</td><td><span className={`badge ${s.status === "Realized" ? "green" : s.status === "Changed" ? "yellow" : s.status === "Cancelled" ? "red" : "gray"}`}>{s.status}</span></td><td>—</td></tr>)}</tbody></table></div></section>
      </main></div>
  );
}
