"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "🏠", "Dashboard"],
  ["/planning", "📅", "Weekly Planning"],
  ["/monitoring", "📊", "Monitoring"],
  ["/performance", "🏆", "Performance"],
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav
      className="app-nav"
      aria-label="Menu utama"
      style={{
        width: "100%",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(15,23,42,.06)",
        padding: "0 28px",
        margin: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="app-nav-inner"
        style={{
          maxWidth: 1220,
          minHeight: 64,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Link href="/" className="app-brand" style={{ color: "#172033", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>
          MT Coach
        </Link>
        <div className="app-nav-links" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {items.map(([href, icon, label]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`app-nav-link${active ? " active" : ""}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 12px",
                  borderRadius: 9,
                  color: active ? "#2563eb" : "#64748b",
                  background: active ? "#eff6ff" : "transparent",
                  fontSize: 13,
                  fontWeight: active ? 800 : 700,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
