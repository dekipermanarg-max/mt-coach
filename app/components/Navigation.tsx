"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BAC_LOGO = "data:image/png;base64,REPLACE_LOGO";

const items = [
  ["/", "Dashboard"],
  ["/planning", "Weekly Planning"],
  ["/monitoring", "Monitoring"],
  ["/performance", "Performance"],
  ["/data", "Data"],
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Menu utama">
      <div className="app-nav-inner">
        <Link href="/" className="app-brand" aria-label="BAC MT Coach">
          <img src={BAC_LOGO} alt="Brain Academy by Ruangguru" />
        </Link>
        <div className="app-nav-links">
          {items.map(([href, label]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`app-nav-link${active ? " active" : ""}`}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
