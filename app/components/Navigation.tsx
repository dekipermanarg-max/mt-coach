"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";

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
        <Link href="/" className="app-brand" aria-label="Brain Academy MT Coach">
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
