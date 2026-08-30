import Link from "next/link";

const performance = [
  ["Deki", "100%", "98%", "99%", "green"],
  ["Farah", "96%", "98%", "97%", "green"],
  ["Ariel", "96%", "94%", "95%", "green"],
  ["Ilham", "92%", "92%", "92%", "green"],
  ["Yogi", "80%", "90%", "85%", "yellow"],
];

const sessions = [
  ["08.00–09.30", "Deki", "6 SD A", "green"],
  ["10.00–11.30", "Farah", "7 SMP A", "green"],
  ["13.00–14.30", "Yogi", "8 SMP A", "yellow"],
  ["15.00–16.30", "Ariel", "10 SMA A", "green"],
];

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">MT Coach<span>BAC · Internal</span></div>
        <nav className="nav">
          <Link className="active" href="/">🏠 Dashboard</Link>
          <Link href="/planning">📅 Planning</Link>
          <Link href="/monitoring">📊 Monitoring</Link>
          <Link href="/performance">🏆 Performance</Link>
          <button disabled>⚙️ Data</button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="title"><h1>Dashboard</h1><p>Week 36 · 31 Aug – 6 Sep 2026</p></div>
          <div className="filters">
            <select className="select" defaultValue="week36" aria-label="Week"><option value="week36">Week 36</option><option value="week35">Week 35</option></select>
            <select className="select" defaultValue="tarandam" aria-label="Cabang"><option value="tarandam">Tarandam</option><option value="all">Semua Cabang</option></select>
          </div>
        </header>

        <section className="grid">
          <div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">95.8%</div><div className="kpi-note">23 / 24 realized</div></div>
          <div className="card"><div className="kpi-label">Admin Completion</div><div className="kpi-value">95.0%</div><div className="kpi-note">153 / 161 complete</div></div>
          <div className="card"><div className="kpi-label">LD</div><div className="kpi-value">4 / 4</div><div className="kpi-note"><span className="badge green">Target tercapai</span></div></div>
          <div className="card"><div className="kpi-label">Active MT</div><div className="kpi-value">12</div><div className="kpi-note">Tarandam</div></div>
        </section>

        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">
          <div className="alert"><div><strong>3 sesi</strong><small>Admin belum lengkap</small></div><Link className="badge red" href="/monitoring">Lihat Sesi →</Link></div>
          <div className="alert"><div><strong>2 MT</strong><small>Performance di bawah 90%</small></div><Link className="badge yellow" href="/performance">Lihat MT →</Link></div>
          <div className="alert"><div><strong>LD</strong><small>Target minggu ini sudah tercapai</small></div><span className="badge green">4 / 4</span></div>
        </div></section>

        <section className="section"><div className="section-head"><h2>🏆 MT Performance</h2><span className="kpi-note">Top 5</span></div><div className="table-wrap">
          <table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Admin</th><th>Overall</th><th>Status</th></tr></thead><tbody>
            {performance.map((row, i) => <tr key={row[0]}><td>{i + 1}</td><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td className="score">{row[3]}</td><td><span className={`badge ${row[4]}`}>{row[4] === "green" ? "Good" : "Attention"}</span></td></tr>)}
          </tbody></table>
        </div></section>

        <section className="section"><div className="section-head"><h2>📅 Today · Monday, 31 Aug</h2></div><div className="today">
          {sessions.map((s) => <div className="session" key={s[0]}><strong>{s[0]} · {s[1]}</strong><span>{s[2]}</span><br/><span className={`badge ${s[3]}`}>{s[3] === "green" ? "Planned" : "Attention"}</span></div>)}
        </div></section>
      </main>
    </div>
  );
}
