"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";
const items = [["/", "Dashboard"], ["/planning", "Weekly Planning"], ["/monitoring", "Monitoring"], ["/performance", "Performance"], ["/activity-log", "Activity Log"], ["/sessions", "Mathchamps"], ["/data", "Data"], ["/backup", "Backup"]] as const;
const icons: Record<string, string> = { Dashboard: "⌂", "Weekly Planning": "▦", Mathchamps: "✓", Monitoring: "◉", Performance: "↗", "Activity Log": "◷", Data: "▤", Backup: "↻" };

export default function NavigationSecure() {
  const pathname = usePathname();
  const { loading, profile, signOut } = useAuth();
  if (pathname === "/login" || pathname === "/login/") return null;
  if (loading || !profile) return null;

  const canSeeActivityLog = profile.role === "SUPERADMIN" || profile.role === "MTC";
  const visibleItems = profile.module_scope === "MATHCHAMPS_ONLY"
    ? items.filter(([href]) => href === "/sessions" || (href === "/activity-log" && canSeeActivityLog))
    : canSeeActivityLog
      ? items
      : items.filter(([href]) => href !== "/activity-log");

  return <>
    <nav className="app-nav" aria-label="Dashboard Administrasi MT Regional Sumbar"><div className="app-nav-inner">
      <Link href={profile.module_scope === "MATHCHAMPS_ONLY" ? "/sessions" : "/"} className="app-brand" aria-label="Dashboard Administrasi MT Regional Sumbar"><img src={BAC_LOGO} alt="Brain Academy by Ruangguru" /></Link>
      <div className="app-nav-links">{visibleItems.map(([href,label]) => { const active=href==="/"?pathname==="/":pathname.startsWith(href); return <Link key={href} href={href} className={`app-nav-link${active?" active":""}`}><span className="app-nav-icon" aria-hidden="true">{icons[label]}</span><span>{label}</span></Link>; })}</div>
      <div className="app-user-box"><div className="app-user-copy"><strong>{profile.display_name}</strong><span>{profile.role}{profile.module_scope === "MATHCHAMPS_ONLY" ? " · MATHCHAMPS" : ""}</span></div><button type="button" className="app-logout" onClick={() => void signOut()}>Keluar</button></div>
    </div></nav>
    <style jsx global>{`
      .app-nav{background:rgba(255,255,255,.96)!important;box-shadow:0 4px 18px rgba(15,23,42,.06)!important}.app-nav-inner{max-width:1280px!important;padding:0 24px!important;gap:26px!important}.app-brand{border:1px solid #eef2f7;border-radius:10px!important;box-shadow:0 3px 10px rgba(15,23,42,.06);transition:transform .16s ease,box-shadow .16s ease}.app-brand:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,23,42,.09)}.app-nav-links{gap:5px!important}.app-nav-link{display:inline-flex!important;align-items:center;gap:7px;padding:10px 13px!important;transition:all .16s ease!important}.app-nav-icon{width:18px;height:18px;display:inline-grid;place-items:center;border-radius:6px;font-size:13px;line-height:1;background:#f1f5f9;color:#64748b;transition:all .16s ease}.app-nav-link:hover .app-nav-icon{background:#e2e8f0;color:#172033}.app-nav-link.active{box-shadow:inset 0 0 0 1px #dbeafe}.app-nav-link.active .app-nav-icon{background:#dbeafe;color:#2563eb}.app-user-box{margin-left:auto;display:flex;align-items:center;gap:10px;flex:0 0 auto}.app-user-copy{display:flex;flex-direction:column;align-items:flex-end;line-height:1.15;white-space:nowrap}.app-user-copy strong{font-size:11px;color:#172033}.app-user-copy span{margin-top:3px;font-size:9px;font-weight:800;letter-spacing:.05em;color:#64748b}.app-logout{height:32px;padding:0 10px;border:1px solid #dbe3ed;border-radius:8px;background:#fff;color:#475569;font-size:10px;font-weight:800;cursor:pointer}.app-logout:hover{background:#f8fafc;color:#172033}@media(max-width:1000px){.app-user-copy{display:none}}@media(max-width:700px){.app-nav-inner{padding:0 12px!important;gap:12px!important}.app-nav-link{padding:8px 9px!important}.app-nav-icon{display:none}.app-user-box{margin-left:0}.app-logout{height:30px;padding:0 8px}}
    `}</style>
  </>;
}
