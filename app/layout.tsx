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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navigation />
        <style>{`
          /* Global typography: use Inter throughout the application. */
          html, body, button, input, select, textarea { font-family: Inter, Arial, Helvetica, sans-serif !important; }

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

          /* Weekly Planning — polished session-entry form. */
          .input-card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 18px !important;
            padding: 24px !important;
            background: #fff !important;
            box-shadow: 0 8px 28px rgba(15,23,42,.045) !important;
          }
          .section-title {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 20px !important;
            padding-bottom: 18px !important;
            margin-bottom: 20px !important;
            border-bottom: 1px solid #eef2f7 !important;
          }
          .section-title h2 {
            margin: 0 !important;
            font-size: 20px !important;
            line-height: 1.25 !important;
            letter-spacing: -.02em !important;
            color: #172033 !important;
          }
          .section-title p {
            margin: 6px 0 0 !important;
            color: #64748b !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
          .section-title strong { color: #2563eb !important; }
          .section-chip {
            flex-shrink: 0 !important;
            background: #eff6ff !important;
            color: #2563eb !important;
            border: 1px solid #dbeafe !important;
            padding: 6px 10px !important;
            border-radius: 999px !important;
            font-size: 10px !important;
            letter-spacing: .04em !important;
          }
          .planning-form-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
          .planning-field { display: flex !important; flex-direction: column !important; gap: 7px !important; min-width: 0 !important; }
          .planning-field > span {
            color: #475569 !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            letter-spacing: .05em !important;
            text-transform: uppercase !important;
          }
          .planning-field select {
            width: 100% !important;
            min-width: 0 !important;
            height: 44px !important;
            padding: 0 38px 0 13px !important;
            border: 1px solid #d8e0ea !important;
            border-radius: 11px !important;
            background: #f8fafc !important;
            color: #172033 !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            outline: none !important;
            cursor: pointer !important;
            transition: .15s ease !important;
          }
          .planning-field select:hover { border-color: #b9c7d9 !important; background: #fff !important; }
          .planning-field select:focus { border-color: #60a5fa !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(37,99,235,.10) !important; }
          .planning-options {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-top: 16px !important;
            padding: 11px !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            background: #f8fafc !important;
          }
          .option-pill {
            min-height: 38px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 7px 13px !important;
            border: 1px solid #dbe3ed !important;
            border-radius: 9px !important;
            background: #fff !important;
            color: #334155 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
          }
          .option-pill:hover { border-color: #93c5fd !important; background: #eff6ff !important; }
          .option-pill input { width: 16px !important; height: 16px !important; margin: 0 !important; accent-color: #2563eb !important; }
          .add-session-btn {
            margin-top: 18px !important;
            min-height: 42px !important;
            padding: 0 17px !important;
            border: 0 !important;
            border-radius: 10px !important;
            background: #2563eb !important;
            color: #fff !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            box-shadow: 0 6px 14px rgba(37,99,235,.18) !important;
            transition: transform .15s ease, box-shadow .15s ease, background .15s ease !important;
          }
          .add-session-btn:hover:not(:disabled) { background: #1d4ed8 !important; transform: translateY(-1px) !important; box-shadow: 0 8px 18px rgba(37,99,235,.22) !important; }
          .add-session-btn:disabled { opacity: .55 !important; cursor: not-allowed !important; }
          @media (max-width: 1000px) {
            .planning-form-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          }
          @media (max-width: 700px) {
            .app-nav { height: 58px; }
            .app-nav-inner { gap: 12px; padding: 0 12px; }
            .app-brand, .app-brand img { width: 92px; height: 42px; flex-basis: 92px; }
            .app-nav-link { padding: 8px 9px; font-size: 12px; }
            .input-card { padding: 18px !important; border-radius: 15px !important; }
            .section-title { flex-direction: column !important; gap: 10px !important; }
            .planning-form-grid { grid-template-columns: 1fr !important; gap: 11px !important; }
            .planning-options { flex-direction: column !important; align-items: stretch !important; }
            .option-pill { width: 100% !important; }
            .add-session-btn { width: 100% !important; }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
