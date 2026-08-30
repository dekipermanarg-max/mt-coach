import Link from "next/link";

const rows = [
  ["Deki", "7", "7", "100%", "49 / 50", "2", "green"],
  ["Farah", "6", "6", "100%", "46 / 48", "1", "green"],
  ["Ariel", "6", "6", "100%", "45 / 48", "1", "green"],
  ["Ilham", "6", "5", "83%", "42 / 46", "1", "yellow"],
  ["Yogi", "5", "4", "80%", "31 / 35", "0", "yellow"],
];

export default function Monitoring() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">MT Coach<span>BAC · Internal</span></div>
        <nav className="nav">
          <Link href="/">🏠 Dashboard</Link>
          <Link href="/planning">📅 Planning</Link>
          <Link className="active" href="/monitoring">📊 Monitoring</Link>
          <button disabled>🏆 Performance</button>
          <button disabled>⚙️ Data</button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="title"><h1>Monitoring</h1><p>Week 36 · 31 Aug – 6 Sep 2026</p></div>
          <div className="filters">
            <select className="select" defaultValue="week36" aria-label="Week"><option value="week36">Week 36</option><option value="week35">Week 35</option></select>
            <select className="select" defaultValue="tarandam" aria-label="Cabang"><option value="tarandam">Tarandam</option><option value="all">Semua Cabang</option></select>
            <select className="select" defaultValue="all" aria-label="MT"><option value="all">Semua MT</option><option>Deki</option><option>Farah</option><option>Ariel</option><option>Ilham</option><option>Yogi</option></select>
          </div>
        </header>

        <section className="grid">
          <div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">95.8%</div><div className="kpi-note">23 / 24 realized</div></div>
          <div className="card"><div className="kpi-label">Admin Completion</div><div className="kpi-value">95.0%</div><div className="kpi-note">153 / 161 complete</div></div>
          <div className="card"><div className="kpi-label">LD</div><div className="kpi-value">4 / 4</div><div className="kpi-note"><span className="badge green">Target tercapai</span></div></div>
          <div className="card"><div className="kpi-label">Need Attention</div><div className="kpi-value">2 MT</div><div className="kpi-note">Performance perlu diperhatikan</div></div>
        </section>

        <section className="section"><div className="section-head"><h2>📊 Monitoring per MT</h2><input className="search" placeholder="🔎 Cari MT..." /></div><div className="table-wrap">
          <table><thead><tr><th>MT</th><th>Planned</th><th>Realized</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>
            {rows.map((r) => <tr key={r[0]}><td><Link className="table-link" href={`/monitoring/${r[0].toLowerCase()}`}><strong>{r[0]}</strong></Link></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td><span className={`badge ${r[6]}`}>{r[6] === "green" ? "Good" : "Attention"}</span></td></tr>)}
          </tbody></table>
        </div></section>

        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">
          <div className="alert"><div><strong>Ilham · 83%</strong><small>Session completion 83% · 1 sesi belum realized</small></div><span className="badge yellow">Periksa</span></div>
          <div className="alert"><div><strong>Yogi · 85%</strong><small>Session completion 80% · 1 sesi belum realized</small></div><span className="badge yellow">Periksa</span></div>
        </div></section>

        <section className="section"><div className="section-head"><h2>📋 Session Detail</h2><button className="button secondary">⬇ Export</button></div><div className="table-wrap">
          <table><thead><tr><th>Tanggal</th><th>Jam</th><th>MT</th><th>Rombel</th><th>Status</th><th>Admin</th></tr></thead><tbody>
            <tr><td>Senin, 31 Aug</td><td>08.00–09.30</td><td>Deki</td><td>6 SD A</td><td><span className="badge green">Realized</span></td><td>7 / 7</td></tr>
            <tr><td>Senin, 31 Aug</td><td>13.00–14.30</td><td>Yogi</td><td>8 SMP A</td><td><span className="badge yellow">Changed</span></td><td>6 / 7</td></tr>
            <tr><td>Selasa, 1 Sep</td><td>10.00–11.30</td><td>Ilham</td><td>9 SMP A</td><td><span className="badge green">Realized</span></td><td>7 / 8</td></tr>
            <tr><td>Rabu, 2 Sep</td><td>13.00–14.30</td><td>Yogi</td><td>8 SMP B</td><td><span className="badge red">Cancelled</span></td><td>—</td></tr>
          </tbody></table>
        </div></section>
      </main>
    </div>
  );
}
