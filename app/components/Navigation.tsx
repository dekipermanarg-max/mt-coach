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
    <nav className="app-nav" aria-label="Menu utama">
      <div className="app-nav-inner">
        <div className="app-brand">MT Coach</div>
        <div className="app-nav-links">
          {items.map(([href, icon, label]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`app-nav-link${active ? " active" : ""}`}>
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
