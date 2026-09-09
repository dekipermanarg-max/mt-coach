"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";
const items = [["/", "Dashboard"], ["/planning", "Weekly Planning"], ["/monitoring", "Monitoring"], ["/performance", "Performance"], ["/sessions", "Mathchamps"], ["/data", "Data"], ["/import-data", "Import Data"], ["/activity-log", "Activity Log"], ["/backup", "Backup"]] as const;
const icons: Record<string, string> = { Dashboard: "⌂", "Weekly Planning": "▦", Mathchamps: "✓", Monitoring: "◉", Performance: "↗", "Activity Log": "◷", Data: "▤", "Import Data": "↑", Backup: "↻" };

export default function NavigationSecure() {
  const pathname = usePathname();
  const { loading, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (pathname === "/login" || pathname === "/login/") return null;
  if (loading || !profile) return null;

  const canSeeActivityLog = profile.role === "SUPERADMIN" || profile.role === "MTC";
  const visibleItems = profile.module_scope === "MATHCHAMPS_ONLY"
    ? items.filter(([href]) => href === "/sessions" || (href === "/activity-log" && canSeeActivityLog))
    : canSeeActivityLog ? items : items.filter(([href]) => href !== "/activity-log");

  return <>
    <nav className="app-nav" aria-label="Dashboard Administrasi MT Regional Sumbar"><div className="app-nav-inner">
      <Link href={profile.module_scope === "MATHCHAMPS_ONLY" ? "/sessions" : "/"} className="app-brand" aria-label="Dashboard Administrasi MT Regional Sumbar"><img src={BAC_LOGO} alt="Brain Academy by Ruangguru" /></Link>
      <div className="app-nav-links">{visibleItems.map(([href,label]) => { const active=href==="/"?pathname==="/":pathname.startsWith(href); return <Link key={href} href={href} className={`app-nav-link${active?" active":""}`}><span className="app-nav-icon" aria-hidden="true">{icons[label]}</span><span>{label}</span></Link>; })}</div>
      <div className="app-user-box"><div className="app-user-copy"><strong>{profile.display_name}</strong><span>{profile.role}{profile.module_scope === "MATHCHAMPS_ONLY" ? " · MATHCHAMPS" : ""}</span></div><button type="button" className="app-logout" onClick={() => void signOut()}>Keluar</button></div>
      <button type="button" className="app-mobile-menu-btn" aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? "×" : "☰"}</button>
    </div>
    {mobileOpen && <div className="app-mobile-menu">{visibleItems.map(([href,label]) => { const active=href==="/"?pathname==="/":pathname.startsWith(href); return <Link key={href} href={href} className={`app-mobile-link${active?" active":""}`} onClick={() => setMobileOpen(false)}><span className="app-mobile-icon" aria-hidden="true">{icons[label]}</span><span>{label}</span></Link>; })}<button type="button" className="app-mobile-logout" onClick={() => { setMobileOpen(false); void signOut(); }}>🚪 Keluar</button></div>}
    </nav>
    <style jsx global>{`
      .app-nav{position:relative;background:rgba(255,255,255,.96)!important;box-shadow:0 4px 18px rgba(15,23,42,.06)!important;z-index:50}.app-nav-inner{max-width:1280px!important;padding:0 14px!important;gap:10px!important;min-width:0}.app-brand{flex:0 0 auto;border:1px solid #eef2f7;border-radius:10px!important;box-shadow:0 3px 10px rgba(15,23,42,.06);transition:transform .16s ease,box-shadow .16s ease}.app-brand:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,23,42,.09)}.app-nav-links{gap:1px!important;display:flex!important;flex-wrap:nowrap!important;align-items:center;min-width:0;flex:1 1 auto}.app-nav-link{display:inline-flex!important;align-items:center;gap:5px;padding:8px 8px!important;white-space:nowrap;font-size:12px!important;transition:all .16s ease!important}.app-nav-icon{width:17px;height:17px;display:inline-grid;place-items:center;flex:0 0 17px;border-radius:6px;font-size:12px;line-height:1;background:#f1f5f9;color:#64748b;transition:all .16s ease}.app-nav-link:hover .app-nav-icon{background:#e2e8f0;color:#172033}.app-nav-link.active{box-shadow:inset 0 0 0 1px #dbeafe}.app-nav-link.active .app-nav-icon{background:#dbeafe;color:#2563eb}.app-user-box{margin-left:auto;display:flex;align-items:center;gap:7px;flex:0 0 auto}.app-user-copy{display:flex;flex-direction:column;align-items:flex-end;line-height:1.1;white-space:nowrap}.app-user-copy strong{font-size:10px;color:#172033}.app-user-copy span{margin-top:2px;font-size:8px;font-weight:800;letter-spacing:.04em;color:#64748b}.app-logout{height:30px;padding:0 9px;border:1px solid #dbe3ed;border-radius:8px;background:#fff;color:#475569;font-size:9px;font-weight:800;cursor:pointer}.app-logout:hover{background:#f8fafc;color:#172033}.app-mobile-menu-btn,.app-mobile-menu{display:none}
      @media(max-width:1100px) and (min-width:701px){.app-nav-inner{padding:0 6px!important;gap:3px!important}.app-nav-link{gap:3px;padding:7px 5px!important;font-size:10px!important}.app-nav-icon{width:15px;height:15px;flex-basis:15px;font-size:10px}.app-user-box{gap:4px}.app-user-copy strong{font-size:8px}.app-user-copy span{font-size:6px}.app-logout{height:26px;padding:0 6px;font-size:7px}}
      @media(max-width:700px){.app-nav-inner{padding:0 12px!important;gap:10px!important;min-height:58px}.app-nav-links{display:none!important}.app-brand{flex:0 0 auto}.app-user-box{margin-left:auto}.app-user-copy{display:none}.app-logout{display:none}.app-mobile-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border:1px solid #dbe3ed;border-radius:9px;background:#fff;color:#334155;font-size:21px;line-height:1;cursor:pointer}.app-mobile-menu-btn:hover{background:#f8fafc}.app-mobile-menu{position:absolute;top:calc(100% + 8px);left:12px;right:12px;display:flex;flex-direction:column;padding:8px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 14px 35px rgba(15,23,42,.14);z-index:100}.app-mobile-link{display:flex;align-items:center;gap:11px;padding:12px 13px;border-radius:8px;color:#475569;text-decoration:none;font-size:13px;font-weight:700}.app-mobile-link:hover{background:#f8fafc}.app-mobile-link.active{background:#eff6ff;color:#2563eb}.app-mobile-icon{width:22px;height:22px;display:grid;place-items:center;border-radius:6px;background:#f1f5f9;color:#64748b;font-size:13px}.app-mobile-link.active .app-mobile-icon{background:#dbeafe;color:#2563eb}.app-mobile-logout{margin-top:6px;padding:11px 13px;border:0;border-top:1px solid #eef2f7;background:#fff;color:#64748b;text-align:left;font-size:13px;font-weight:700;cursor:pointer}.app-mobile-logout:hover{color:#172033}}
    `}</style>
  </>;
}
