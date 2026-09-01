"use client";

import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../../lib/store";

const branches = ["Semua Cabang", "Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung", "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada", "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun"];

function formatDate(date: string) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function Performance() {
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branch, setBranch] = useState("Semua Cabang");
  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setMts(getMTs().filter((mt) => mt.status === "Active"));
    setSessions(getSessions());
  }, []);

  const rows = useMemo(() => mts.map((mt) => {
    const own = sessions.filter((s) => {
      const sessionDate = String(s.date ?? "").slice(0, 10);
      return s.mt === mt.name && sessionDate >= startDate && sessionDate <= endDate && (branch === "Semua Cabang" || mt.branch === branch);
    });
    const planned = own.length;
    const realized = own.filter((s) => s.status === "Realized").length;
    const session = planned ? Math.round(realized / planned * 100) : 0;
    return { name: mt.name, branch: mt.branch, session, planned, realized, admin: null as number | null, overall: null as number | null, ld: null as number | null };
  }).filter((r) => branch === "Semua Cabang" || r.branch === branch).sort((a, b) => b.session - a.session), [mts, sessions, branch, startDate, endDate]);

  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0";
  const top = rows[0];
  const attention = rows.filter((r) => r.session < 90).length;
  const plannedTotal = rows.reduce((sum, r) => sum + r.planned, 0);
  const realizedTotal = rows.reduce((sum, r) => sum + r.realized, 0);

  return (
    <div className="performance-shell">
      <main className="performance-main">
        <div className="performance-wrap">
          <section className="planning-hero">
            <div className="planning-hero-row">
              <div><div className="eyebrow">MT COACH · ANALYTICS</div><h1>MT Performance</h1><p>Performance berdasarkan planning dan realisasi sesi yang tercatat.</p></div>
              <span className="badge planning-status">🏆 Performance</span>
            </div>
          </section>

          <div className="performance-filters">
            <label className="date-filter"><span>Tanggal Awal</span><input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label className="date-filter"><span>Tanggal Akhir</span><input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} /></label>
            <label className="branch-filter"><span>Cabang</span><select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>{branches.map((b) => <option key={b}>{b}</option>)}</select></label>
          </div>
          <div className="period-note">Menampilkan performance <strong>{formatDate(startDate)}</strong> sampai <strong>{formatDate(endDate)}</strong>.</div>

          <section className="performance-grid">
            <div className="card performance-kpi"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT aktif · periode terpilih</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Top MT</div><div className="kpi-value">{top ? `${top.session}%` : "—"}</div><div className="kpi-note">{top?.name ?? "Belum ada data"}</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session completion &lt; 90%</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Total Realized</div><div className="kpi-value">{realizedTotal}</div><div className="kpi-note">dari {plannedTotal} planned</div></div>
          </section>

          <section className="section"><div className="section-head"><div><h2>🏆 Ranking MT</h2><p className="section-note">Ranking mengikuti filter cabang dan rentang tanggal yang dipilih.</p></div><button className="secondary-btn" type="button">⬇️ Export</button></div>
            <div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Cabang</th><th>Planned</th><th>Realized</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name}><td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.branch}</td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.session}%</td><td>—</td><td>—</td><td><span className={`badge ${r.session >= 95 ? "green" : r.session >= 90 ? "blue" : "yellow"}`}>{r.session >= 95 ? "Excellent" : r.session >= 90 ? "Good" : "Attention"}</span></td></tr>)}{rows.length === 0 && <tr><td colSpan={9}><div className="empty-state">Belum ada data performance untuk rentang tanggal dan cabang ini.</div></td></tr>}</tbody></table></div>
          </section>

          <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{rows.filter((r) => r.session < 90).map((r) => <div className="alert" key={r.name}><div><strong>{r.name} · {r.session}%</strong><small>{r.branch} · Session completion di bawah 90%</small></div><span className="badge yellow">Attention</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan berdasarkan filter saat ini.</small></div></div>}</div></section>

          <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card formula-card"><strong>Session Completion = Realized ÷ Planned × 100</strong><div className="kpi-note">Admin dan LD akan masuk ke score setelah data Monitoring tersedia.</div></div></section>
        </div>
      </main>

      <style jsx global>{`
        .performance-shell{min-height:100vh;background:#f6f7f9;color:#172033}.performance-main{padding:20px 24px 45px}.performance-wrap{max-width:1220px;margin:0 auto}.performance-filters{display:flex;justify-content:flex-end;align-items:flex-end;gap:10px;margin-bottom:6px}.date-filter,.branch-filter{display:flex;flex-direction:column;gap:5px}.date-filter span,.branch-filter span{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em}.date-filter input,.performance-filters .select{height:42px;background:#fff;border:1px solid #d8dee8;border-radius:9px;padding:10px 12px;font:inherit;color:#172033}.date-filter input{min-width:155px}.performance-filters .select{min-width:220px}.period-note{text-align:right;color:#64748b;font-size:12px;margin-bottom:18px}.period-note strong{color:#334155}.performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.performance-kpi{min-height:125px}.performance-kpi:first-child{border-left:4px solid #2563eb}.performance-kpi:nth-child(2){border-left:4px solid #22c55e}.performance-kpi:nth-child(3){border-left:4px solid #f59e0b}.performance-kpi:nth-child(4){border-left:4px solid #8b5cf6}.section-note{margin:4px 0 0;color:#64748b;font-size:12px}.secondary-btn{background:#fff}.formula-card{display:flex;justify-content:space-between;align-items:center;gap:20px}.formula-card .kpi-note{margin:0}@media(max-width:900px){.performance-main{padding:18px 16px}.performance-filters{justify-content:stretch;flex-wrap:wrap}.date-filter,.branch-filter{flex:1;min-width:170px}.performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.performance-grid{grid-template-columns:1fr}.formula-card{align-items:flex-start;flex-direction:column}.performance-filters{flex-direction:column;align-items:stretch}.date-filter,.branch-filter{min-width:0}.period-note{text-align:left}}
      `}</style>
    </div>
  );
}
