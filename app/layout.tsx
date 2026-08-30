import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MT Coach",
  description: "Monitoring, Planning, dan Performance Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
