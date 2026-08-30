import Link from "next/link";

const rows = [
  ["Deki", "100%", "98%", "99%", "2", "green"],
  ["Farah", "96%", "98%", "97%", "1", "green"],
  ["Ariel", "96%", "94%", "95%", "1", "green"],
  ["Ilham", "92%", "92%", "92%", "1", "blue"],
  ["Yogi", "80%", "90%", "85%", "0", "yellow"],
];

export default function Performance() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">MT Coach<span>BAC · Internal</span></div>
        <nav className="nav">
          <Link href="/">🏠 Dashboard</Link>
          <Link href="/planning">📅 Planning</Link>
          <Link href="/monitoring">📊 Monitoring</Link>
          <Link className="active" href="/performance">🏆 Performance</Link>
          <button disabled>⚙️ Data</button>
        </nav>
      </aside>

      <main className="main">
        <div className="page-wrap">
          <header className="page-head">
            <div><h1>MT Performance</h1><p>Ranking dan ringkasan performa minggu berjalan.</p></div>
            <div className="filters">
              <select className="select" defaultValue="week36" aria-label="Week"><option value="week36">Week 36</option><option value="week35">Week 35</option></select>
              <select className="select" defaultValue="tarandam" aria-label="Cabang"><option value="tarandam">Tarandam</option><option value="all">Semua Cabang</option></select>
            </div>
          </header>

          <section className="grid">
            <div className="card"><div className="kpi-label">Average Performance</div><div className="kpi-value">94.2%</div><div className="kpi-note">5 MT minggu ini</div></div>
            <div className="card"><div className="kpi-label">Top MT</div><div className="kpi-value">99%</div><div className="kpi-note">Deki</div></div>
            <div className="card"><div className="kpi-label">Needs Attention</div><div className="kpi-value">1</div><div className="kpi-note">Performance &lt; 90%</div></div>
            <div className="card"><div className="kpi-label">LD</div><div className="kpi-value">5</div><div className="kpi-note">Total rombel</div></div>
          </section>

          <section className="section">
            <div className="section-head"><h2>🏆 Ranking MT</h2><button className="secondary-btn" type="button">⬇️ Export</button></div>
            <div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Admin</th><th>Overall</th><th>LD</th><th>Status</th></tr></thead>
              <tbody>{rows.map((r, i) => <tr key={r[0]}><td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td><td className="score">{r[3]}</td><td>{r[4]}</td><td><span className={`badge ${r[5]}`}>{r[5] === "green" ? "Excellent" : r[5] === "blue" ? "Good" : "Attention"}</span></td></tr>)}</tbody>
            </table></div>
          </section>

          <section className="section">
            <div className="section-head"><h2>⚠️ Needs Attention</h2></div>
            <div className="attention"><div className="alert"><div><strong>Yogi · 85%</strong><small>Session 80% · Admin 90% · LD 0</small></div><span className="badge yellow">Attention</span></div></div>
          </section>

          <section className="section">
            <div className="section-head"><h2>📐 Cara Hitung</h2></div>
            <div className="card"><strong>Overall = (Session Completion + Admin Completion) ÷ 2</strong><div className="kpi-note">LD ditampilkan sebagai indikator tambahan, bukan bagian dari score.</div></div>
          </section>
        </div>
      </main>
    </div>
  );
}
