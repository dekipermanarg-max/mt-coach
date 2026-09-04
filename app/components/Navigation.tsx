"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";

const items = [["/", "Dashboard"], ["/planning", "Weekly Planning"], ["/sessions", "Session Admin"], ["/monitoring", "Monitoring"], ["/performance", "Performance"], ["/data", "Data"], ["/backup", "Backup"]];
const icons: Record<string, string> = { Dashboard: "⌂", "Weekly Planning": "▦", "Session Admin": "✓", Monitoring: "◉", Performance: "↗", Data: "▤", Backup: "↻" };

export default function Navigation() {
  const pathname = usePathname();
  return <>
    <nav className="app-nav" aria-label="Menu utama"><div className="app-nav-inner">
      <Link href="/" className="app-brand" aria-label="Brain Academy MT Coach"><img src={BAC_LOGO} alt="Brain Academy by Ruangguru" /></Link>
      <div className="app-nav-links">{items.map(([href,label]) => { const active=href==="/"?pathname==="/":pathname.startsWith(href); return <Link key={href} href={href} className={`app-nav-link${active?" active":""}`}><span className="app-nav-icon" aria-hidden="true">{icons[label]}</span><span>{label}</span></Link>; })}</div>
    </div></nav>
    <style jsx global>{`
      .app-nav{background:rgba(255,255,255,.96)!important;box-shadow:0 4px 18px rgba(15,23,42,.06)!important}.app-nav-inner{max-width:1280px!important;padding:0 24px!important;gap:26px!important}.app-brand{border:1px solid #eef2f7;border-radius:10px!important;box-shadow:0 3px 10px rgba(15,23,42,.06);transition:transform .16s ease,box-shadow .16s ease}.app-brand:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,23,42,.09)}.app-nav-links{gap:5px!important}.app-nav-link{display:inline-flex!important;align-items:center;gap:7px;padding:10px 13px!important;transition:all .16s ease!important}.app-nav-icon{width:18px;height:18px;display:inline-grid;place-items:center;border-radius:6px;font-size:13px;line-height:1;background:#f1f5f9;color:#64748b;transition:all .16s ease}.app-nav-link:hover .app-nav-icon{background:#e2e8f0;color:#172033}.app-nav-link.active{box-shadow:inset 0 0 0 1px #dbeafe}.app-nav-link.active .app-nav-icon{background:#dbeafe;color:#2563eb}@media(max-width:700px){.app-nav-inner{padding:0 12px!important;gap:12px!important}.app-nav-link{padding:8px 9px!important}.app-nav-icon{display:none}}
    `}</style>
  </>;
}
