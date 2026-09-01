import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";

export const metadata: Metadata = {
  title: "MT Coach",
  description: "Monitoring, Planning, dan Performance Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Navigation />
        <style>{`
          /* One navigation only: remove legacy page sidebars. */
          .sidebar { display: none !important; }
          .shell { display: block !important; min-height: auto !important; }
          .main { margin-left: 0 !important; width: 100% !important; }

          .app-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            height: 64px;
            background: rgba(255,255,255,.96);
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 2px 10px rgba(15,23,42,.05);
            backdrop-filter: blur(10px);
          }
          .app-nav-inner {
            max-width: 1220px;
            height: 100%;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 28px;
          }
          .app-brand {
            width: 118px;
            height: 48px;
            flex: 0 0 118px;
            display: flex;
            align-items: center;
            overflow: hidden;
            border-radius: 6px;
            background: #fff;
          }
          .app-brand img {
            display: block;
            width: 118px;
            height: 48px;
            object-fit: contain;
          }
          .app-nav-links {
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
            overflow-x: auto;
          }
          .app-nav-link {
            white-space: nowrap;
            padding: 9px 12px;
            border-radius: 9px;
            color: #64748b;
            font-size: 13px;
            font-weight: 700;
          }
          .app-nav-link:hover { background: #f1f5f9; color: #172033; }
          .app-nav-link.active { background: #eff6ff; color: #2563eb; }
          @media (max-width: 700px) {
            .app-nav { height: 58px; }
            .app-nav-inner { gap: 12px; padding: 0 12px; }
            .app-brand, .app-brand img { width: 92px; height: 42px; flex-basis: 92px; }
            .app-nav-link { padding: 8px 9px; font-size: 12px; }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
