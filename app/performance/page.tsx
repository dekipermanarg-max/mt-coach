"use client";

import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../../lib/store";

const branches = ["Semua Cabang", "Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung", "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada", "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun"];

function weekLabel(date = new Date()) {
  const first = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - first.getTime()) / 86400000);
  return `Week ${Math.ceil((day + first.getDay() + 1) / 7)}`;
}

export default function Performance() {
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branch, setBranch] = useState("Semua Cabang");
  const [week, setWeek] = useState(weekLabel());

  useEffect(() => {
    setMts(getMTs().filter((mt) => mt.status === "Active"));
    setSessions(getSessions());
  }, []);

  const rows = useMemo(() => mts.map((mt) => {
    const own = sessions.filter((s) => s.mt === mt.name && (branch === "Semua Cabang" || mt.branch === branch));
    const planned = own.length;
    const realized = own.filter((s) => s.status === "Realized").length;
    const session = planned ? Math.round(realized / planned * 100) : 0;
    return { name: mt.name, branch: mt.branch, session, planned, realized, admin: null as number | null, overall: null as number | null, ld: null as number | null };
  }).filter((r) => branch === "Semua Cabang" || r.branch === branch).sort((a, b) => b.session - a.session), [mts, sessions, branch]);

  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0";
  const top = rows[0];
  const attention = rows.filter((r) => r.session < 90).length;
  const plannedTotal = rows.reduce((sum, r) => sum + r.planned, 0);
  const realizedTotal = rows.reduce((sum, r) => sum + r.realized, 0);

  return (
    <div className="performance-shell">
      <main className="performance-main">
        <div className="performance-wrap">
          <header className="performance-head">
            <div><div className="performance-eyebrow">MT COACH · ANALYTICS</div><h1>MT Performance</h1><p>Performance berdasarkan planning dan realisasi sesi yang tercatat.</p></div>
            <div className="performance-filters">
              <select className="select" value={week} onChange={(e) => setWeek(e.target.value)}>{[weekLabel(), "Week 35", "Week 34", "Week 33"].map((w) => <option key={w}>{w}</option>)}</select>
              <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>{branches.map((b) => <option key={b}>{b}</option>)}</select>
            </div>
          </header>

          <section className="performance-grid">
            <div className="card performance-kpi"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT aktif · {week}</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Top MT</div><div className="kpi-value">{top ? `${top.session}%` : "—"}</div><div className="kpi-note">{top?.name ?? "Belum ada data"}</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session completion &lt; 90%</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Total Realized</div><div className="kpi-value">{realizedTotal}</div><div className="kpi-note">dari {plannedTotal} planned</div></div>
          </section>

          <section className="section"><div className="section-head"><div><h2>🏆 Ranking MT</h2><p className="section-note">Ranking mengikuti filter cabang dan periode yang dipilih.</p></div><button className="secondary-btn" type="button">⬇️ Export</button></div>
            <div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Cabang</th><th>Planned</th><th>Realized</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name}><td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.branch}</td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.session}%</td><td>—</td><td>—</td><td><span className={`badge ${r.session >= 95 ? "green" : r.session >= 90 ? "blue" : "yellow"}`}>{r.session >= 95 ? "Excellent" : r.session >= 90 ? "Good" : "Attention"}</span></td></tr>)}{rows.length === 0 && <tr><td colSpan={9}><div className="empty-state">Belum ada data performance untuk filter ini.</div></td></tr>}</tbody></table></div>
          </section>

          <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{rows.filter((r) => r.session < 90).map((r) => <div className="alert" key={r.name}><div><strong>{r.name} · {r.session}%</strong><small>{r.branch} · Session completion di bawah 90%</small></div><span className="badge yellow">Attention</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan berdasarkan filter saat ini.</small></div></div>}</div></section>

          <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card formula-card"><strong>Session Completion = Realized ÷ Planned × 100</strong><div className="kpi-note">Admin dan LD akan masuk ke score setelah data Monitoring tersedia.</div></div></section>
        </div>
      </main>

      <style jsx global>{`
        .performance-shell{min-height:100vh;background:#f6f7f9;color:#172033}.performance-main{padding:28px 30px 45px}.performance-wrap{max-width:1220px;margin:0 auto}.performance-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}.performance-eyebrow{font-size:11px;letter-spacing:.14em;font-weight:800;color:#64748b}.performance-head h1{margin:6px 0 5px;font-size:30px;letter-spacing:-.03em}.performance-head p{margin:0;color:#64748b;font-size:13px}.performance-filters{display:flex;gap:10px}.performance-filters .select{min-width:125px;background:#fff;border:1px solid #d8dee8;border-radius:9px;padding:10px 12px}.performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.performance-kpi{min-height:125px}.performance-kpi:first-child{border-left:4px solid #2563eb}.performance-kpi:nth-child(2){border-left:4px solid #22c55e}.performance-kpi:nth-child(3){border-left:4px solid #f59e0b}.performance-kpi:nth-child(4){border-left:4px solid #8b5cf6}.section-note{margin:4px 0 0;color:#64748b;font-size:12px}.secondary-btn{background:#fff}.formula-card{display:flex;justify-content:space-between;align-items:center;gap:20px}.formula-card .kpi-note{margin:0}@media(max-width:900px){.performance-main{padding:20px 16px}.performance-head{align-items:stretch;flex-direction:column}.performance-filters{width:100%}.performance-filters .select{flex:1}.performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.performance-grid{grid-template-columns:1fr}.formula-card{align-items:flex-start;flex-direction:column}}
      `}</style>
    </div>
  );
}
