import Link from "next/link";

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          MT Coach
          <span>BAC · Internal</span>
        </div>
        <nav className="nav">
          <Link href="/">🏠 Dashboard</Link>
          <Link className="active" href="/planning">📅 Planning</Link>
          <Link href="/monitoring">📊 Monitoring</Link>
          <Link href="/performance">🏆 Performance</Link>
          <Link href="/data">⚙️ Data</Link>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
